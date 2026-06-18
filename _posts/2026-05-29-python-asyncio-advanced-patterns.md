---
layout: post
title: "Python Asyncio高级模式：从并发到并行的性能优化"
date: 2026-05-29 13:00:00 +0800
categories: [Python, 异步编程, 性能优化]
tags: [代码产品]
image: /assets/images/python-asyncio-advanced.jpg
---

## 引言

asyncio是Python异步编程的核心库，但很多开发者只停留在基础用法。本文将深入探讨高级模式，帮助你榨取最大性能。

## 基础回顾

```python
import asyncio

async def main():
    # 基础并发
    tasks = [
        asyncio.create_task(fetch_data(i))
        for i in range(10)
    ]
    results = await asyncio.gather(*tasks)
    return results

asyncio.run(main())
```

## 高级模式

### 1. 信号量控制并发

```python
import asyncio
import aiohttp

class RateLimiter:
    """速率限制器"""
    def __init__(self, max_concurrent=10):
        self.semaphore = asyncio.Semaphore(max_concurrent)
    
    async def acquire(self):
        await self.semaphore.acquire()
    
    def release(self):
        self.semaphore.release()
    
    async def __aenter__(self):
        await self.acquire()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        self.release()

# 使用示例
limiter = RateLimiter(max_concurrent=5)

async def fetch_with_limit(session, url):
    async with limiter:
        async with session.get(url) as response:
            return await response.text()

async def main():
    urls = ["https://api.example.com/data/{}".format(i) for i in range(100)]
    
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_with_limit(session, url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 处理异常
        successful = [r for r in results if not isinstance(r, Exception)]
        failed = [r for r in results if isinstance(r, Exception)]
        
        print(f"成功: {len(successful)}, 失败: {len(failed)}")
```

### 2. 队列处理模式

```python
import asyncio
from typing import Callable

class AsyncWorkerPool:
    """异步工作池"""
    def __init__(self, worker_count: int, processor: Callable):
        self.queue = asyncio.Queue()
        self.worker_count = worker_count
        self.processor = processor
        self.results = []
    
    async def worker(self, worker_id: int):
        """工作协程"""
        while True:
            try:
                item = await asyncio.wait_for(
                    self.queue.get(), 
                    timeout=1.0
                )
                result = await self.processor(item)
                self.results.append((item, result, None))
            except asyncio.TimeoutError:
                break
            except Exception as e:
                self.results.append((item, None, e))
            finally:
                self.queue.task_done()
    
    async def process(self, items):
        """处理所有项目"""
        # 放入队列
        for item in items:
            await self.queue.put(item)
        
        # 启动工作协程
        workers = [
            asyncio.create_task(self.worker(i))
            for i in range(self.worker_count)
        ]
        
        # 等待完成
        await self.queue.join()
        
        # 取消工作协程
        for w in workers:
            w.cancel()
        
        return self.results

# 使用示例
async def process_item(item):
    await asyncio.sleep(0.1)  # 模拟处理
    return item * 2

pool = AsyncWorkerPool(worker_count=5, processor=process_item)
results = await pool.process(range(100))
```

### 3. 超时和取消

```python
import asyncio
from contextlib import asynccontextmanager

@asynccontextmanager
async def timeout_context(seconds: float):
    """超时上下文管理器"""
    try:
        yield asyncio.timeout(seconds)
    except asyncio.TimeoutError:
        print(f"操作超时（{seconds}秒）")
        raise

async def resilient_operation():
    """弹性操作，支持重试"""
    max_retries = 3
    base_delay = 1
    
    for attempt in range(max_retries):
        try:
            async with timeout_context(5.0):
                result = await fetch_data()
                return result
        except asyncio.TimeoutError:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt)  # 指数退避
            print(f"重试 {attempt + 1}/{max_retries}, 等待 {delay}秒")
            await asyncio.sleep(delay)

# 取消保护
async def cancellable_task():
    try:
        while True:
            await asyncio.sleep(1)
            print("工作中...")
    except asyncio.CancelledError:
        print("收到取消信号，正在清理...")
        # 执行清理操作
        await cleanup()
        raise  # 重新抛出，确保取消传播
```

### 4. 混合CPU密集型任务

```python
import asyncio
from concurrent.futures import ProcessPoolExecutor
import multiprocessing

# 全局进程池
process_pool = ProcessPoolExecutor(
    max_workers=multiprocessing.cpu_count()
)

def cpu_intensive_task(data):
    """CPU密集型任务（同步函数）"""
    result = 0
    for i in range(10_000_000):
        result += i * data
    return result

async def hybrid_processing(items):
    """混合处理：IO + CPU"""
    loop = asyncio.get_running_loop()
    
    # 第一步：IO操作（获取数据）
    fetch_tasks = [fetch_data(item) for item in items]
    raw_data = await asyncio.gather(*fetch_tasks)
    
    # 第二步：CPU计算（使用进程池）
    compute_futures = [
        loop.run_in_executor(process_pool, cpu_intensive_task, data)
        for data in raw_data
    ]
    results = await asyncio.gather(*compute_futures)
    
    # 第三步：IO操作（保存结果）
    save_tasks = [save_result(r) for r in results]
    await asyncio.gather(*save_tasks)
    
    return results

# 优雅关闭
async def shutdown():
    process_pool.shutdown(wait=True)
```

### 5. 流式处理

```python
import asyncio
from typing import AsyncIterator

async def data_stream() -> AsyncIterator[dict]:
    """异步数据流"""
    for i in range(1000):
        await asyncio.sleep(0.01)  # 模拟IO
        yield {"id": i, "data": f"item_{i}"}

async def process_stream():
    """处理流式数据"""
    batch_size = 10
    batch = []
    
    async for item in data_stream():
        batch.append(item)
        
        if len(batch) >= batch_size:
            # 批量处理
            await process_batch(batch)
            batch = []
    
    # 处理剩余
    if batch:
        await process_batch(batch)

# 背压控制
async def backpressure_producer(queue: asyncio.Queue):
    """带背压的生产者"""
    for i in range(1000):
        item = await produce_item(i)
        await queue.put(item)  # 队列满时会自动阻塞

async def backpressure_consumer(queue: asyncio.Queue):
    """消费者"""
    while True:
        item = await queue.get()
        if item is None:  # 结束信号
            break
        await consume_item(item)
        queue.task_done()

# 使用
queue = asyncio.Queue(maxsize=100)  # 限制队列大小实现背压
producer = asyncio.create_task(backpressure_producer(queue))
consumer = asyncio.create_task(backpressure_consumer(queue))
```

### 6. 事件驱动架构

```python
import asyncio
from dataclasses import dataclass
from typing import Callable, List

@dataclass
class Event:
    type: str
    data: dict

class EventBus:
    """异步事件总线"""
    def __init__(self):
        self._handlers: dict[str, List[Callable]] = {}
        self._queue = asyncio.Queue()
        self._running = False
    
    def on(self, event_type: str, handler: Callable):
        """订阅事件"""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
    
    async def emit(self, event: Event):
        """发布事件"""
        await self._queue.put(event)
    
    async def start(self):
        """启动事件循环"""
        self._running = True
        while self._running:
            try:
                event = await asyncio.wait_for(
                    self._queue.get(), 
                    timeout=1.0
                )
                await self._handle_event(event)
            except asyncio.TimeoutError:
                continue
    
    async def _handle_event(self, event: Event):
        """处理事件"""
        handlers = self._handlers.get(event.type, [])
        tasks = [handler(event.data) for handler in handlers]
        await asyncio.gather(*tasks, return_exceptions=True)
    
    def stop(self):
        self._running = False

# 使用示例
bus = EventBus()

async def on_user_created(data):
    print(f"发送欢迎邮件给: {data['email']}")
    await asyncio.sleep(0.1)

async def on_user_created_analytics(data):
    print(f"记录分析数据: {data['id']}")
    await asyncio.sleep(0.1)

bus.on("user.created", on_user_created)
bus.on("user.created", on_user_created_analytics)

# 发布事件
await bus.emit(Event("user.created", {"id": 1, "email": "user@example.com"}))
```

## 性能对比

```python
import time
import asyncio

async def benchmark():
    """性能测试"""
    items = range(100)
    
    # 同步方式
    start = time.time()
    sync_results = [cpu_intensive_task(i) for i in items]
    sync_time = time.time() - start
    
    # 异步方式
    start = time.time()
    async_results = await hybrid_processing(items)
    async_time = time.time() - start
    
    print(f"同步: {sync_time:.2f}s")
    print(f"异步: {async_time:.2f}s")
    print(f"提升: {sync_time/async_time:.1f}x")
```

## 调试技巧

```python
import asyncio
import logging

# 启用调试模式
logging.basicConfig(level=logging.DEBUG)

# 检查事件循环
loop = asyncio.get_running_loop()
print(f"当前循环: {loop}")
print(f"正在运行的任务: {len(asyncio.all_tasks())}")

# 任务监控
async def monitor_tasks():
    while True:
        tasks = asyncio.all_tasks()
        print(f"活跃任务数: {len(tasks)}")
        await asyncio.sleep(5)

# 内存分析
import tracemalloc
tracemalloc.start()

async def profiled_coroutine():
    snapshot1 = tracemalloc.take_snapshot()
    # ... 执行操作
    snapshot2 = tracemalloc.take_snapshot()
    
    top_stats = snapshot2.compare_to(snapshot1, 'lineno')
    for stat in top_stats[:5]:
        print(stat)
```

## 总结

asyncio高级模式要点：

1. **信号量控制并发** - 防止资源耗尽
2. **队列处理** - 生产者-消费者模式
3. **超时和重试** - 增强健壮性
4. **进程池混合** - 处理CPU密集型任务
5. **流式处理** - 大数据集处理
6. **事件驱动** - 解耦系统组件

> 💡 **工具推荐**：如果你在开发高并发应用，可以试试**PySecToolkit**——一个Python安全工具包，包含网络扫描、端口检测等功能。它完全基于asyncio构建，可以很好地集成到你的异步应用中，用于安全监控和自动化运维。

---

