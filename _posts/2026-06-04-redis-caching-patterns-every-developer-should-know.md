---
layout: post
title: "每个开发者都该知道的Redis缓存模式"
date: 2026-06-04 09:00:00 +0800
tags: [代码产品, redis, caching, backend, performance]
categories: Backend
image: /assets/images/redis-caching.jpg
description: "详解7个Redis缓存模式：Cache Aside、Read Through、Write Through、Write Behind、缓存预热、分布式锁防击穿、布隆过滤器防穿透，每个模式都有Python代码示例。"
---

## 前言

Redis是现代后端系统中最常用的缓存方案。但"会用Redis"和"用好Redis"之间有很大的差距。不同的业务场景需要不同的缓存策略，选错模式可能导致数据不一致、缓存穿透甚至系统雪崩。本文将详解7个每个开发者都应该掌握的Redis缓存模式。

---

## 模式一：Cache Aside（旁路缓存）

Cache Aside是最常用的缓存模式。应用程序直接与缓存和数据库交互，缓存不主动做任何事情。

**读取流程：**
1. 先查缓存
2. 缓存命中则直接返回
3. 缓存未命中则查数据库
4. 将数据库结果写入缓存
5. 返回结果

**写入流程：**
1. 先更新数据库
2. 再删除缓存

```python
import redis.asyncio as redis
import json
import hashlib

class CacheAside:
    def __init__(self, redis_url: str = "redis://localhost:6379", ttl: int = 3600):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.ttl = ttl

    def _cache_key(self, table: str, id: int) -> str:
        """生成缓存键"""
        return f"cache:{table}:{id}"

    async def get(self, table: str, id: int, db_query_fn):
        """Cache Aside读取"""
        cache_key = self._cache_key(table, id)

        # 1. 先查缓存
        cached = await self.redis.get(cache_key)
        if cached:
            print(f"[Cache Hit] {cache_key}")
            return json.loads(cached)

        # 2. 缓存未命中，查数据库
        print(f"[Cache Miss] {cache_key}, querying database...")
        data = await db_query_fn(id)

        if data:
            # 3. 写入缓存
            await self.redis.setex(
                cache_key,
                self.ttl,
                json.dumps(data, ensure_ascii=False, default=str)
            )

        return data

    async def update(self, table: str, id: int, data: dict, db_update_fn):
        """Cache Aside写入：先更新DB，再删缓存"""
        # 1. 更新数据库
        await db_update_fn(id, data)

        # 2. 删除缓存（而不是更新缓存）
        cache_key = self._cache_key(table, id)
        await self.redis.delete(cache_key)
        print(f"[Cache Invalidated] {cache_key}")


# 使用示例
cache = CacheAside(ttl=1800)

async def get_user_from_db(user_id: int):
    """模拟数据库查询"""
    return {"id": user_id, "name": "张三", "email": "zhangsan@example.com"}

async def update_user_in_db(user_id: int, data: dict):
    """模拟数据库更新"""
    print(f"[DB Updated] user {user_id}")

# 读取
user = await cache.get("users", 1, get_user_from_db)

# 更新
await cache.update("users", 1, {"name": "李四"}, update_user_in_db)
```

**为什么写操作是"删缓存"而不是"更新缓存"？**
- 删除缓存是懒加载，只有下次读取时才重建，避免不必要的缓存更新
- 如果并发读写，更新缓存可能导致数据不一致
- 删除操作更简单、更安全

---

## 模式二：Read Through（读穿透）

Read Through模式下，应用程序只与缓存交互。缓存负责在未命中时自动从数据库加载数据。

```python
class ReadThroughCache:
    def __init__(self, redis_url: str, ttl: int = 3600):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.ttl = ttl
        self._db_loader = None

    def register_loader(self, loader_fn):
        """注册数据库加载函数"""
        self._db_loader = loader_fn

    async def get(self, key: str):
        """读取数据，缓存未命中时自动加载"""
        cached = await self.redis.get(key)
        if cached:
            return json.loads(cached)

        if not self._db_loader:
            raise ValueError("未注册数据库加载函数")

        # 自动从数据库加载
        data = await self._db_loader(key)
        if data:
            await self.redis.setex(key, self.ttl, json.dumps(data, default=str))

        return data

    async def put(self, key: str, data: dict):
        """写入缓存"""
        await self.redis.setex(key, self.ttl, json.dumps(data, default=str))


# 使用示例
cache = ReadThroughCache(ttl=1800)

async def load_product(product_id: str):
    """从数据库加载产品信息"""
    return {"id": product_id, "name": "示例商品", "price": 99.9}

cache.register_loader(load_product)

# 应用层只需调用get，缓存层自动处理未命中
product = await cache.get("product:1001")
```

---

## 模式三：Write Through（写穿透）

Write Through模式下，写入数据时同步更新缓存和数据库。

```python
class WriteThroughCache:
    def __init__(self, redis_url: str, ttl: int = 3600):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.ttl = ttl
        self._db_write_fn = None

    def register_writer(self, writer_fn):
        """注册数据库写入函数"""
        self._db_write_fn = writer_fn

    async def write(self, key: str, data: dict):
        """同步写入缓存和数据库"""
        # 1. 先写数据库
        if self._db_write_fn:
            await self._db_write_fn(key, data)

        # 2. 再写缓存
        await self.redis.setex(key, self.ttl, json.dumps(data, default=str))

    async def read(self, key: str, db_loader=None):
        """读取数据"""
        cached = await self.redis.get(key)
        if cached:
            return json.loads(cached)

        if db_loader:
            data = await db_loader(key)
            if data:
                await self.redis.setex(key, self.ttl, json.dumps(data, default=str))
            return data

        return None


# 使用示例
cache = WriteThroughCache(ttl=1800)

async def write_to_db(key: str, data: dict):
    """写入数据库"""
    print(f"[DB Write] {key}")

# 写入时自动同步到数据库和缓存
await cache.write("config:theme", {"mode": "dark", "font_size": 16})
```

---

## 模式四：Write Behind（异步写缓存）

Write Behind模式下，写入操作先更新缓存，然后异步批量写入数据库。适合写密集型场景。

```python
import asyncio
from collections import deque
import json

class WriteBehindCache:
    def __init__(self, redis_url: str, batch_size: int = 100, flush_interval: float = 5.0):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.batch_size = batch_size
        self.flush_interval = flush_interval
        self._write_queue = deque()
        self._running = False
        self._db_batch_write_fn = None

    def register_batch_writer(self, writer_fn):
        self._db_batch_write_fn = writer_fn

    async def start(self):
        """启动异步刷写任务"""
        self._running = True
        asyncio.create_task(self._flush_loop())

    async def stop(self):
        """停止并刷写剩余数据"""
        self._running = False
        await self._flush()

    async def write(self, key: str, data: dict):
        """写入缓存，加入待刷写队列"""
        # 立即更新缓存
        await self.redis.set(key, json.dumps(data, default=str))
        # 加入队列
        self._write_queue.append({"key": key, "data": data})

        # 队列满时立即刷写
        if len(self._write_queue) >= self.batch_size:
            await self._flush()

    async def _flush_loop(self):
        """定时刷写循环"""
        while self._running:
            await asyncio.sleep(self.flush_interval)
            if self._write_queue:
                await self._flush()

    async def _flush(self):
        """批量刷写到数据库"""
        if not self._write_queue or not self._db_batch_write_fn:
            return

        batch = []
        while self._write_queue:
            batch.append(self._write_queue.popleft())

        try:
            await self._db_batch_write_fn(batch)
            print(f"[Flush] 批量写入 {len(batch)} 条记录到数据库")
        except Exception as e:
            print(f"[Flush Error] {e}")
            # 写入失败，重新放回队列
            self._write_queue.extendleft(reversed(batch))
```

---

## 模式五：缓存预热

在系统启动或流量高峰前，提前将热点数据加载到缓存中。

```python
import redis.asyncio as redis
import json
import asyncio

class CacheWarmer:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url, decode_responses=True)

    async def warm_up(self, data_loaders: dict, ttl: int = 3600):
        """
        批量预热缓存
        data_loaders: {cache_key: loader_function}
        """
        total = len(data_loaders)
        success = 0
        failed = 0

        print(f"[Cache Warmup] 开始预热 {total} 个缓存键...")

        tasks = []
        for key, loader in data_loaders.items():
            tasks.append(self._load_and_cache(key, loader, ttl))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, Exception):
                failed += 1
                print(f"  [Failed] {result}")
            else:
                success += 1

        print(f"[Cache Warmup] 完成: {success} 成功, {failed} 失败")

    async def _load_and_cache(self, key: str, loader_fn, ttl: int):
        """加载单个数据并写入缓存"""
        data = await loader_fn()
        if data:
            await self.redis.setex(
                key,
                ttl,
                json.dumps(data, ensure_ascii=False, default=str)
            )


# 使用示例
async def main():
    warmer = CacheWarmer()

    # 定义需要预热的数据
    loaders = {
        "config:site": lambda: {"title": "我的网站", "theme": "dark"},
        "stats:total_users": lambda: 15000,
        "hot_articles": lambda: [
            {"id": 1, "title": "文章1", "views": 5000},
            {"id": 2, "title": "文章2", "views": 3000},
        ],
    }

    await warmer.warm_up(loaders, ttl=7200)

asyncio.run(main())
```

---

## 模式六：分布式锁防缓存击穿

缓存击穿是指一个热点key过期时，大量并发请求同时穿透到数据库。

```python
import redis.asyncio as redis
import uuid
import asyncio

class CacheWithLock:
    def __init__(self, redis_url: str, lock_timeout: int = 10, cache_ttl: int = 3600):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.lock_timeout = lock_timeout
        self.cache_ttl = cache_ttl

    async def get_with_lock(self, key: str, db_loader, retry_interval: float = 0.1, max_retries: int = 50):
        """使用分布式锁防止缓存击穿"""
        # 1. 先查缓存
        cached = await self.redis.get(key)
        if cached:
            return json.loads(cached)

        # 2. 获取分布式锁
        lock_key = f"lock:{key}"
        lock_value = str(uuid.uuid4())

        acquired = await self.redis.set(
            lock_key,
            lock_value,
            nx=True,  # 只在key不存在时设置
            ex=self.lock_timeout,
        )

        if acquired:
            try:
                # 3. 双重检查：获取锁后再次查缓存
                cached = await self.redis.get(key)
                if cached:
                    return json.loads(cached)

                # 4. 查数据库并写缓存
                data = await db_loader()
                if data:
                    await self.redis.setex(
                        key,
                        self.cache_ttl,
                        json.dumps(data, default=str)
                    )
                return data

            finally:
                # 5. 释放锁（使用Lua脚本保证原子性）
                lua_script = """
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
                """
                await self.redis.eval(lua_script, 1, lock_key, lock_value)
        else:
            # 6. 未获取到锁，等待并重试
            for _ in range(max_retries):
                await asyncio.sleep(retry_interval)
                cached = await self.redis.get(key)
                if cached:
                    return json.loads(cached)

        raise TimeoutError("获取缓存数据超时")


# 使用示例
cache = CacheWithLock(lock_timeout=10, cache_ttl=1800)

async def load_hot_data():
    """加载热点数据"""
    await asyncio.sleep(1)  # 模拟慢查询
    return {"data": "热点数据内容"}

# 并发请求测试
results = await asyncio.gather(
    cache.get_with_lock("hot:key", load_hot_data),
    cache.get_with_lock("hot:key", load_hot_data),
    cache.get_with_lock("hot:key", load_hot_data),
)
```

---

## 模式七：布隆过滤器防缓存穿透

缓存穿透是指查询不存在的数据，每次请求都会穿透到数据库。布隆过滤器可以高效地判断一个key是否可能存在。

```python
import redis.asyncio as redis
import json
import hashlib

class BloomFilterCache:
    def __init__(self, redis_url: str, cache_ttl: int = 3600):
        self.redis = redis.from_url(redis_url, decode_responses=True)
        self.cache_ttl = cache_ttl
        self.bloom_key = "bloom:valid_keys"
        self.hash_count = 7  # 哈希函数数量

    def _get_hashes(self, key: str) -> list:
        """生成多个哈希值"""
        hashes = []
        for i in range(self.hash_count):
            hash_input = f"{key}:{i}"
            hash_val = int(hashlib.md5(hash_input.encode()).hexdigest(), 16)
            hashes.append(hash_val % (2**32))
        return hashes

    async def add_to_bloom(self, key: str):
        """将key添加到布隆过滤器"""
        hashes = self._get_hashes(key)
        pipeline = self.redis.pipeline()
        for h in hashes:
            pipeline.setbit(self.bloom_key, h, 1)
        await pipeline.execute()

    async def might_exist(self, key: str) -> bool:
        """检查key是否可能存在（布隆过滤器）"""
        hashes = self._get_hashes(key)
        pipeline = self.redis.pipeline()
        for h in hashes:
            pipeline.getbit(self.bloom_key, h)
        results = await pipeline.execute()
        return all(r == 1 for r in results)

    async def get(self, key: str, db_loader):
        """使用布隆过滤器防止缓存穿透"""
        # 1. 布隆过滤器预判
        if not await self.might_exist(key):
            print(f"[Bloom Filter] {key} 肯定不存在，直接返回")
            return None

        # 2. 查缓存
        cached = await self.redis.get(f"cache:{key}")
        if cached:
            if cached == "NULL":
                return None  # 缓存空值，防止穿透
            return json.loads(cached)

        # 3. 查数据库
        data = await db_loader(key)

        if data:
            await self.redis.setex(
                f"cache:{key}",
                self.cache_ttl,
                json.dumps(data, default=str)
            )
            await self.add_to_bloom(key)
        else:
            # 缓存空值，设置较短TTL
            await self.redis.setex(f"cache:{key}", 300, "NULL")

        return data


# 使用示例
bloom_cache = BloomFilterCache(cache_ttl=1800)

async def get_user(user_id: str):
    """模拟数据库查询"""
    if user_id == "1":
        return {"id": "1", "name": "张三"}
    return None  # 用户不存在

# 先预热布隆过滤器
await bloom_cache.add_to_bloom("user:1")

# 查询存在的用户
result = await bloom_cache.get("user:1", get_user)

# 查询不存在的用户（被布隆过滤器拦截）
result = await bloom_cache.get("user:999", get_user)
```

---

## 模式选择指南

| 场景 | 推荐模式 | 原因 |
|------|---------|------|
| 通用读写 | Cache Aside | 最灵活，最常用 |
| 读多写少 | Read Through | 简化应用层逻辑 |
| 数据一致性要求高 | Write Through | 同步写入保证一致性 |
| 写密集型 | Write Behind | 异步批量写入提升性能 |
| 热点数据 | 缓存预热 | 提前加载避免冷启动 |
| 高并发热点key | 分布式锁 | 防止缓存击穿 |
| 大量不存在的查询 | 布隆过滤器 | 防止缓存穿透 |

---

## 总结

掌握这7个Redis缓存模式，可以应对绝大多数后端开发中的缓存场景。关键要点：

1. **Cache Aside**是最基础的模式，理解它就理解了缓存的核心逻辑
2. **写操作先更新DB再删缓存**，避免数据不一致
3. **缓存击穿**用分布式锁解决，**缓存穿透**用布隆过滤器解决
4. **缓存预热**可以显著降低系统启动时的数据库压力
5. 根据实际业务场景选择合适的缓存模式，不要一刀切

缓存不是银弹，但它确实是提升系统性能最有效的手段之一。用好缓存，你的系统将如虎添翼。
