---
layout: post
title: "Redis高级应用：分布式锁、发布订阅与Stream实战"
date: 2026-05-30 10:00:00 +0800
categories: [Redis, 数据库, 分布式系统]
tags: [代码产品]
image: /assets/images/redis-advanced.jpg
---

## 引言

Redis不仅是缓存，更是分布式系统的核心组件。本文介绍三个高级应用：分布式锁、发布订阅、Stream消息队列。

## 1. 分布式锁

### 基础实现

```python
import redis
import uuid
import time

class DistributedLock:
    """Redis分布式锁"""
    
    def __init__(self, redis_client, lock_name, timeout=10):
        self.redis = redis_client
        self.lock_name = f"lock:{lock_name}"
        self.timeout = timeout
        self.identifier = str(uuid.uuid4())
    
    def acquire(self, retry_interval=0.1, max_retries=100):
        """获取锁"""
        for _ in range(max_retries):
            # SET NX PX 原子操作
            if self.redis.set(
                self.lock_name, 
                self.identifier, 
                nx=True, 
                px=self.timeout * 1000
            ):
                return True
            time.sleep(retry_interval)
        return False
    
    def release(self):
        """释放锁（Lua脚本保证原子性）"""
        script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        return self.redis.eval(script, 1, self.lock_name, self.identifier)
    
    def __enter__(self):
        self.acquire()
        return self
    
    def __exit__(self, *args):
        self.release()

# 使用
r = redis.Redis()

with DistributedLock(r, "my_resource"):
    # 执行需要互斥的操作
    process_resource()
```

### 可重入锁

```python
class ReentrantLock:
    """可重入分布式锁"""
    
    def __init__(self, redis_client, lock_name, timeout=10):
        self.redis = redis_client
        self.lock_name = f"reentrant:{lock_name}"
        self.timeout = timeout
        self.identifier = str(uuid.uuid4())
    
    def acquire(self):
        script = """
        local key = KEYS[1]
        local identifier = ARGV[1]
        local timeout = ARGV[2]
        
        local current = redis.call("get", key)
        if current == identifier then
            redis.call("incr", key .. ":count")
            return 1
        elseif current == false then
            redis.call("set", key, identifier, "px", timeout)
            redis.call("set", key .. ":count", 1)
            return 1
        end
        return 0
        """
        return self.redis.eval(
            script, 1, 
            self.lock_name, 
            self.identifier, 
            self.timeout * 1000
        )
    
    def release(self):
        script = """
        local key = KEYS[1]
        local identifier = ARGV[1]
        
        if redis.call("get", key) == identifier then
            local count = redis.call("decr", key .. ":count")
            if count <= 0 then
                redis.call("del", key, key .. ":count")
            end
            return 1
        end
        return 0
        """
        return self.redis.eval(script, 1, self.lock_name, self.identifier)
```

## 2. 发布订阅

### 基础用法

```python
import redis
import threading

r = redis.Redis()

# 发布者
def publisher():
    for i in range(10):
        r.publish("channel:news", f"Message {i}")
        time.sleep(1)

# 订阅者
def subscriber():
    pubsub = r.pubsub()
    pubsub.subscribe("channel:news")
    
    for message in pubsub.listen():
        if message["type"] == "message":
            print(f"Received: {message['data']}")

# 启动
threading.Thread(target=subscriber, daemon=True).start()
publisher()
```

### 模式订阅

```python
def pattern_subscriber():
    pubsub = r.pubsub()
    # 订阅所有news相关频道
    pubsub.psubscribe("channel:news:*")
    
    for message in pubsub.listen():
        if message["type"] == "pmessage":
            print(f"Channel: {message['channel']}, Data: {message['data']}")
```

### 消息队列模式

```python
class RedisPubSubQueue:
    """基于Pub/Sub的消息队列"""
    
    def __init__(self, redis_client, channel):
        self.redis = redis_client
        self.channel = channel
        self.pubsub = redis_client.pubsub()
        self.pubsub.subscribe(channel)
    
    def send(self, message):
        """发送消息"""
        self.redis.publish(self.channel, json.dumps(message))
    
    def receive(self, timeout=None):
        """接收消息"""
        message = self.pubsub.get_message(timeout=timeout)
        if message and message["type"] == "message":
            return json.loads(message["data"])
        return None
```

## 3. Redis Stream

### 基础操作

```python
# 添加消息
stream_id = r.xadd(
    "mystream", 
    {"field1": "value1", "field2": "value2"}
)

# 读取消息
messages = r.xread(
    {"mystream": "0"},  # 从头开始
    count=10,
    block=1000  # 阻塞1秒
)

# 消费者组
r.xgroup_create("mystream", "mygroup", id="0")

# 读取未处理消息
messages = r.xreadgroup(
    "mygroup", 
    "consumer1",
    {"mystream": ">"},  # > 表示未读消息
    count=10
)

# 确认消息
r.xack("mystream", "mygroup", message_id)
```

### 消息队列实现

```python
class RedisStreamQueue:
    """基于Stream的可靠消息队列"""
    
    def __init__(self, redis_client, stream_name, group_name, consumer_name):
        self.redis = redis_client
        self.stream = stream_name
        self.group = group_name
        self.consumer = consumer_name
        
        # 创建消费者组（如果不存在）
        try:
            self.redis.xgroup_create(stream_name, group_name, id="0")
        except redis.ResponseError:
            pass  # 组已存在
    
    def produce(self, message):
        """生产消息"""
        return self.redis.xadd(self.stream, message)
    
    def consume(self, count=1, block=1000):
        """消费消息"""
        messages = self.redis.xreadgroup(
            self.group,
            self.consumer,
            {self.stream: ">"},
            count=count,
            block=block
        )
        
        if messages:
            for stream, msgs in messages:
                for msg_id, msg_data in msgs:
                    yield msg_id, msg_data
    
    def ack(self, message_id):
        """确认消息"""
        return self.redis.xack(self.stream, self.group, message_id)
    
    def pending(self):
        """获取待处理消息"""
        return self.redis.xpending(self.stream, self.group)
    
    def claim(self, min_idle_time, message_ids):
        """认领超时消息"""
        return self.redis.xclaim(
            self.stream,
            self.group,
            self.consumer,
            min_idle_time,
            message_ids
        )

# 使用
queue = RedisStreamQueue(r, "orders", "order_workers", "worker1")

# 生产
queue.produce({"order_id": "123", "action": "create"})

# 消费
for msg_id, data in queue.consume():
    try:
        process_order(data)
        queue.ack(msg_id)
    except Exception as e:
        print(f"Failed: {e}")
```

## 4. 实战：分布式任务队列

```python
import json
from datetime import datetime

class DistributedTaskQueue:
    """分布式任务队列"""
    
    def __init__(self, redis_client, queue_name):
        self.redis = redis_client
        self.queue = queue_name
        self.stream = f"tasks:{queue_name}"
        self.results = f"results:{queue_name}"
    
    def submit(self, task_name, *args, **kwargs):
        """提交任务"""
        task = {
            "name": task_name,
            "args": args,
            "kwargs": kwargs,
            "submitted_at": datetime.now().isoformat()
        }
        
        task_id = self.redis.xadd(self.stream, {"data": json.dumps(task)})
        return task_id
    
    def get_result(self, task_id, timeout=30):
        """获取结果"""
        key = f"{self.results}:{task_id}"
        
        for _ in range(timeout):
            result = self.redis.get(key)
            if result:
                self.redis.delete(key)
                return json.loads(result)
            time.sleep(1)
        
        return None
    
    def worker(self, task_handlers, consumer_name):
        """工作进程"""
        group = f"workers:{self.queue}"
        
        try:
            self.redis.xgroup_create(self.stream, group, id="0")
        except redis.ResponseError:
            pass
        
        while True:
            messages = self.redis.xreadgroup(
                group,
                consumer_name,
                {self.stream: ">"},
                count=1,
                block=5000
            )
            
            if not messages:
                continue
            
            for stream, msgs in messages:
                for msg_id, msg_data in msgs:
                    task = json.loads(msg_data["data"])
                    
                    try:
                        handler = task_handlers[task["name"]]
                        result = handler(*task["args"], **task["kwargs"])
                        
                        # 存储结果
                        result_key = f"{self.results}:{msg_id}"
                        self.redis.setex(
                            result_key,
                            3600,  # 1小时过期
                            json.dumps({"status": "success", "result": result})
                        )
                    except Exception as e:
                        result_key = f"{self.results}:{msg_id}"
                        self.redis.setex(
                            result_key,
                            3600,
                            json.dumps({"status": "error", "error": str(e)})
                        )
                    
                    self.redis.xack(self.stream, group, msg_id)

# 使用
def process_image(image_path):
    # 处理图片
    return {"width": 800, "height": 600}

task_handlers = {
    "process_image": process_image,
}

queue = DistributedTaskQueue(r, "images")

# 提交任务
task_id = queue.submit("process_image", "/path/to/image.jpg")

# 获取结果
result = queue.get_result(task_id)
```

## 总结

Redis高级应用场景：

1. **分布式锁** - SET NX PX + Lua脚本
2. **发布订阅** - 实时消息推送
3. **Stream** - 可靠消息队列，支持消费者组

> 💡 **工具推荐**：如果你需要监控Redis性能，可以试试**PriceSentinel Pro**——一个轻量级监控工具，支持实时指标追踪和告警。

---

