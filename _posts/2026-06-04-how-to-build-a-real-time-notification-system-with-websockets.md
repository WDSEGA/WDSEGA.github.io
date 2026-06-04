---
layout: post
title: "用WebSocket构建实时通知系统的完整指南"
date: 2026-06-04 09:00:00 +0800
tags: websocket, python, real-time
categories: Backend
image: /assets/images/websocket-notification.jpg
description: "使用FastAPI和WebSocket构建生产级实时通知系统，涵盖连接管理、用户路由、Redis Pub/Sub多实例支持和消息持久化。"
---

## 前言

在现代Web应用中，实时通知已经成为标配功能。无论是即时消息、系统告警、协作编辑还是实时数据推送，WebSocket都是最可靠的技术选择。本文将手把手教你用FastAPI和WebSocket构建一个生产级的实时通知系统，支持多实例部署和消息持久化。

---

## 系统架构概览

我们的实时通知系统包含以下核心组件：

```
客户端 <--WebSocket--> FastAPI实例1 <--Redis Pub/Sub--> FastAPI实例2
                                |
                            Redis/DB (消息持久化)
```

- **ConnectionManager**：管理所有WebSocket连接
- **用户路由**：将消息精确推送给目标用户
- **Redis Pub/Sub**：支持多实例部署时的消息广播
- **消息持久化**：离线消息存储和补发
- **心跳保活**：检测断线并自动重连

---

## 基础架构：ConnectionManager

首先实现一个连接管理器，负责维护所有活跃的WebSocket连接。

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, Optional
import json
import asyncio
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # 用户ID到连接的映射
        self.active_connections: Dict[str, WebSocket] = {}
        # 用户订阅的频道
        self.user_channels: Dict[str, Set[str]] = {}
        # 锁，防止并发问题
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: str):
        """接受WebSocket连接并注册用户"""
        await websocket.accept()
        async with self._lock:
            self.active_connections[user_id] = websocket
            self.user_channels.setdefault(user_id, set())
        logger.info(f"用户 {user_id} 已连接，当前在线: {len(self.active_connections)}")

    async def disconnect(self, user_id: str):
        """断开连接并清理资源"""
        async with self._lock:
            self.active_connections.pop(user_id, None)
            self.user_channels.pop(user_id, None)
        logger.info(f"用户 {user_id} 已断开，当前在线: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, user_id: str):
        """向指定用户发送消息"""
        websocket = self.active_connections.get(user_id)
        if websocket:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"发送消息给用户 {user_id} 失败: {e}")
                await self.disconnect(user_id)

    async def broadcast(self, message: dict, channel: Optional[str] = None):
        """广播消息到指定频道或所有用户"""
        async with self._lock:
            if channel:
                targets = [
                    uid for uid, channels in self.user_channels.items()
                    if channel in channels
                ]
            else:
                targets = list(self.active_connections.keys())

        for user_id in targets:
            await self.send_personal_message(message, user_id)

    def is_online(self, user_id: str) -> bool:
        """检查用户是否在线"""
        return user_id in self.active_connections

    def get_online_count(self) -> int:
        """获取在线用户数"""
        return len(self.active_connections)


# 全局连接管理器
manager = ConnectionManager()
```

---

## FastAPI WebSocket端点

接下来实现WebSocket端点，处理连接、消息接收和心跳保活。

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, Query
from datetime import datetime
import uuid

app = FastAPI(title="实时通知系统")


@app.websocket("/ws/notifications")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),  # JWT认证
):
    # 验证用户身份
    user_id = verify_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="认证失败")
        return

    # 建立连接
    await manager.connect(websocket, user_id)

    try:
        # 发送离线消息
        offline_messages = await get_offline_messages(user_id)
        for msg in offline_messages:
            await websocket.send_json(msg)
        await clear_offline_messages(user_id)

        # 心跳保活循环
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "ping":
                # 回复心跳
                await websocket.send_json({"type": "pong", "timestamp": datetime.now().isoformat()})
            elif message.get("type") == "subscribe":
                # 订阅频道
                async with manager._lock:
                    manager.user_channels[user_id].add(message["channel"])
                await websocket.send_json({
                    "type": "subscribed",
                    "channel": message["channel"]
                })
            elif message.get("type") == "unsubscribe":
                # 取消订阅
                async with manager._lock:
                    manager.user_channels[user_id].discard(message["channel"])

    except WebSocketDisconnect:
        await manager.disconnect(user_id)
    except Exception as e:
        logger.error(f"WebSocket异常: {e}")
        await manager.disconnect(user_id)
```

---

## Redis Pub/Sub：多实例支持

在生产环境中，通常会有多个FastAPI实例运行。Redis Pub/Sub用于在实例之间传递消息。

```python
import redis.asyncio as redis
import json
from typing import Optional
import asyncio

class RedisPubSub:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.pubsub = None
        self._running = False

    async def connect(self):
        """建立Redis连接"""
        self.redis = redis.from_url(self.redis_url, decode_responses=True)
        self.pubsub = self.redis.pubsub()
        self._running = True

    async def publish(self, channel: str, message: dict):
        """发布消息到指定频道"""
        await self.redis.publish(channel, json.dumps(message, ensure_ascii=False))

    async def subscribe(self, channel: str, callback):
        """订阅频道并注册回调"""
        await self.pubsub.subscribe(channel)
        asyncio.create_task(self._listen(callback))

    async def _listen(self, callback):
        """监听消息"""
        async for message in self.pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                await callback(data)

    async def close(self):
        """关闭连接"""
        self._running = False
        if self.pubsub:
            await self.pubsub.unsubscribe()
            await self.pubsub.close()
        if self.redis:
            await self.redis.close()


# 初始化Redis Pub/Sub
pubsub = RedisPubSub()


@app.on_event("startup")
async def startup():
    await pubsub.connect()

    # 订阅通知频道
    async def handle_notification(message: dict):
        target_user = message.get("target_user")
        if target_user:
            await manager.send_personal_message(message, target_user)
        else:
            await manager.broadcast(message, message.get("channel"))

    await pubsub.subscribe("notifications", handle_notification)


@app.on_event("shutdown")
async def shutdown():
    await pubsub.close()
```

---

## 消息持久化：离线消息补发

当用户离线时，消息需要被存储起来，等用户上线后补发。

```python
import redis.asyncio as redis
from datetime import datetime, timedelta
import json

class MessageStore:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.redis: Optional[redis.Redis] = None

    async def connect(self):
        self.redis = redis.from_url(self.redis_url, decode_responses=True)

    async def store_offline_message(self, user_id: str, message: dict):
        """存储离线消息到Redis列表"""
        message["stored_at"] = datetime.now().isoformat()
        message_id = str(uuid.uuid4())
        await self.redis.hset(
            f"offline:{user_id}",
            message_id,
            json.dumps(message, ensure_ascii=False)
        )
        # 设置过期时间（7天）
        await self.redis.expire(f"offline:{user_id}", timedelta(days=7))

    async def get_offline_messages(self, user_id: str) -> list:
        """获取离线消息"""
        messages = []
        data = await self.redis.hgetall(f"offline:{user_id}")
        for msg_id, msg_data in data.items():
            messages.append(json.loads(msg_data))
        return messages

    async def clear_offline_messages(self, user_id: str):
        """清除已读的离线消息"""
        await self.redis.delete(f"offline:{user_id}")

    async def close(self):
        if self.redis:
            await self.redis.close()


message_store = MessageStore()


# 发送通知的统一接口
async def send_notification(
    target_user: str,
    notification_type: str,
    content: str,
    channel: Optional[str] = None,
    data: Optional[dict] = None,
):
    """发送通知的统一入口"""
    message = {
        "id": str(uuid.uuid4()),
        "type": notification_type,
        "content": content,
        "data": data or {},
        "timestamp": datetime.now().isoformat(),
        "target_user": target_user,
        "channel": channel,
    }

    if manager.is_online(target_user):
        # 用户在线，直接发送
        await manager.send_personal_message(message, target_user)
    else:
        # 用户离线，存储消息
        await message_store.store_offline_message(target_user, message)

    # 通过Redis广播（多实例场景）
    await pubsub.publish("notifications", message)
```

---

## REST API：发送通知接口

除了WebSocket，还需要提供REST API让后端服务发送通知。

```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel

class NotificationRequest(BaseModel):
    target_user: str
    notification_type: str
    content: str
    channel: Optional[str] = None
    data: Optional[dict] = None


@app.post("/api/notifications/send")
async def send_notification_api(request: NotificationRequest):
    """发送通知的REST API"""
    await send_notification(
        target_user=request.target_user,
        notification_type=request.notification_type,
        content=request.content,
        channel=request.channel,
        data=request.data,
    )
    return {"status": "ok", "message": "通知已发送"}


@app.post("/api/notifications/broadcast")
async def broadcast_notification(
    notification_type: str,
    content: str,
    channel: Optional[str] = None,
):
    """广播通知"""
    message = {
        "id": str(uuid.uuid4()),
        "type": notification_type,
        "content": content,
        "timestamp": datetime.now().isoformat(),
        "channel": channel,
    }
    await manager.broadcast(message, channel)
    await pubsub.publish("notifications", message)
    return {"status": "ok", "message": "广播通知已发送"}


@app.get("/api/notifications/online-count")
async def get_online_count():
    """获取在线用户数"""
    return {"online_count": manager.get_online_count()}
```

---

## 前端JavaScript代码

最后是前端JavaScript代码，处理WebSocket连接、心跳保活和消息接收。

```javascript
class NotificationClient {
    constructor(token) {
        this.token = token;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.heartbeatInterval = null;
        this.handlers = new Map();
    }

    connect() {
        const wsUrl = `wss://your-domain.com/ws/notifications?token=${this.token}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket已连接');
            this.reconnectAttempts = 0;
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'pong') return;

            // 触发对应的消息处理器
            const handler = this.handlers.get(message.type);
            if (handler) {
                handler(message);
            }

            // 触发通用处理器
            const globalHandler = this.handlers.get('*');
            if (globalHandler) {
                globalHandler(message);
            }
        };

        this.ws.onclose = (event) => {
            console.log(`WebSocket已断开: code=${event.code}`);
            this.stopHeartbeat();
            this.reconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket错误:', error);
        };
    }

    on(type, handler) {
        this.handlers.set(type, handler);
    }

    subscribe(channel) {
        this.send({ type: 'subscribe', channel });
    }

    unsubscribe(channel) {
        this.send({ type: 'unsubscribe', channel });
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.send({ type: 'ping' });
        }, 30000); // 每30秒发送心跳
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('达到最大重连次数，停止重连');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
        console.log(`${delay}ms后尝试第${this.reconnectAttempts}次重连...`);

        setTimeout(() => this.connect(), delay);
    }

    disconnect() {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
        }
    }
}

// 使用示例
const client = new NotificationClient('your-jwt-token');

client.on('new_message', (msg) => {
    showNotification(msg.content, msg.data);
});

client.on('system_alert', (msg) => {
    showAlertBanner(msg.content);
});

client.on('*', (msg) => {
    console.log('收到通知:', msg);
});

client.connect();
```

---

## 部署建议

### Nginx配置

```nginx
location /ws/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400;  # WebSocket长连接超时
}
```

### 性能优化建议

1. **连接数管理**：单实例建议控制在10000个并发连接以内
2. **消息压缩**：大消息使用gzip压缩后再发送
3. **限流保护**：对消息发送频率进行限制，防止滥用
4. **监控告警**：监控在线连接数、消息延迟和异常断线率

---

## 总结

本文实现了一个完整的实时通知系统，核心特性包括：

- **ConnectionManager**：统一的连接管理
- **用户级路由**：精确的消息推送
- **Redis Pub/Sub**：多实例消息广播
- **消息持久化**：离线消息存储和补发
- **心跳保活**：自动检测断线并重连
- **频道订阅**：灵活的消息分组

这个架构可以直接用于生产环境，根据实际需求进行水平扩展即可。
