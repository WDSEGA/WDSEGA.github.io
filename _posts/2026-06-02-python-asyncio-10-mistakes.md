---
layout: post
title: "Python Asyncio的10个常见陷阱及解决方案"
date: 2026-06-02 08:00:00 +0800
categories: [Python, 异步编程]
tags: [代码产品]
image: /assets/images/python-asyncio-guide.jpg
author: 大D
---

Python的asyncio库让异步编程变得前所未有的简单，但简单并不意味着容易。在实际项目中，很多开发者会掉进一些看似不起眼的陷阱，导致程序性能下降、死锁甚至崩溃。今天我把这几年踩过的坑和解决方案整理出来，希望能帮你少走弯路。

## 陷阱1：在异步函数中调用阻塞IO

这是最常见的错误。很多开发者在async函数里直接使用`requests.get()`、`open()`等同步IO操作，结果整个事件循环被阻塞，其他协程全部卡住。

```python
# 错误示范
async def fetch_data():
    response = requests.get("https://api.example.com/data")  # 阻塞整个事件循环
    return response.json()

# 正确做法：使用aiohttp
import aiohttp

async def fetch_data():
    async with aiohttp.ClientSession() as session:
        async with session.get("https://api.example.com/data") as response:
            return await response.json()

# 或者用run_in_executor包装同步调用
import asyncio
from functools import partial

async def fetch_data():
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(
        None,
        partial(requests.get, "https://api.example.com/data")
    )
    return result.json()
```

**关键原则**：在async函数中，任何可能超过几毫秒的IO操作都应该用异步版本或放到线程池中执行。

## 陷阱2：忘记await

忘记加`await`是asyncio中最隐蔽的bug。代码不会报错，但协程不会被执行，你只会得到一个coroutine对象。

```python
# 错误示范
async def main():
    task = asyncio.create_task(some_work())  # 创建了任务但没有等待
    # some_work可能还没执行完，main就结束了

# 正确做法
async def main():
    task = asyncio.create_task(some_work())
    result = await task  # 等待任务完成
```

更隐蔽的情况是在函数调用链中遗漏await：

```python
# 错误：中间某层忘记await
async def process(data):
    cleaned = clean_data(data)  # 忘记await！clean_data是协程
    return cleaned

# 正确
async def process(data):
    cleaned = await clean_data(data)
    return cleaned
```

**建议**：使用mypy的asyncio插件或pyright等类型检查工具，它们能帮你检测到遗漏的await。

## 陷阱3：不当使用asyncio.gather的错误处理

`asyncio.gather`默认在某个任务失败时会取消其他所有任务。如果你需要部分失败不影响整体，必须设置`return_exceptions=True`。

```python
# 默认行为：一个失败全部取消
async def fetch_all():
    results = await asyncio.gather(
        fetch_user(1),
        fetch_user(2),
        fetch_user(3)
    )  # 如果fetch_user(2)抛异常，fetch_user(3)也会被取消

# 更好的做法
async def fetch_all():
    results = await asyncio.gather(
        fetch_user(1),
        fetch_user(2),
        fetch_user(3),
        return_exceptions=True
    )
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            print(f"任务{i}失败: {result}")
        else:
            print(f"任务{i}成功: {result}")
```

## 陷阱4：事件循环未正确关闭

在Python 3.10+中，`asyncio.run()`会自动处理事件循环的创建和关闭。但在一些需要手动管理事件循环的场景（如Jupyter Notebook、FastAPI的某些中间件），忘记关闭会导致资源泄漏。

```python
# Python 3.10+ 推荐方式
async def main():
    await do_something()

asyncio.run(main())  # 自动创建和关闭事件循环

# 需要手动管理的场景
async def main():
    # ... 你的代码
    pass

loop = asyncio.new_event_loop()
try:
    asyncio.set_event_loop(loop)
    loop.run_until_complete(main())
finally:
    # 清理所有待处理的任务
    pending = asyncio.all_tasks(loop)
    for task in pending:
        task.cancel()
    loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
    loop.run_until_complete(loop.shutdown_asyncgens())
    loop.close()
```

## 陷阱5：过度创建并发任务

一次性创建上千个并发请求看起来很高效，但实际上可能导致连接池耗尽、内存暴涨、甚至被目标服务器封IP。

```python
# 错误：一次性创建10000个任务
async def fetch_all_urls(urls):
    tasks = [fetch(url) for url in urls]  # 10000个任务同时运行
    return await asyncio.gather(*tasks)

# 正确：使用信号量控制并发数
async def fetch_all_urls(urls, max_concurrent=20):
    semaphore = asyncio.Semaphore(max_concurrent)

    async def limited_fetch(url):
        async with semaphore:
            return await fetch(url)

    tasks = [limited_fetch(url) for url in urls]
    return await asyncio.gather(*tasks)

# 或者使用TaskGroup + 信号量（Python 3.11+）
async def fetch_all_urls(urls, max_concurrent=20):
    semaphore = asyncio.Semaphore(max_concurrent)
    async with asyncio.TaskGroup() as tg:
        for url in urls:
            tg.create_task(limited_fetch(url, semaphore))
```

## 陷阱6：混用线程和协程导致死锁

在asyncio中调用同步代码，而同步代码又尝试调用asyncio函数，这种循环依赖会导致死锁。

```python
# 死锁场景
def sync_function():
    # 这个函数在同步上下文中被调用
    asyncio.run(async_function())  # 如果已经在事件循环中，这会报错或死锁

# 解决方案1：使用nest_asyncio（适合Jupyter等特殊环境）
import nest_asyncio
nest_asyncio.apply()

# 解决方案2：重新设计，避免嵌套
async def main():
    # 把所有逻辑都放在异步上下文中
    result = await async_function()
    processed = await loop.run_in_executor(None, sync_process, result)
```

## 陷阱7：Task取消后未清理资源

当Task被取消时，会抛出`asyncio.CancelledError`。如果你在异步上下文管理器中忽略了它，可能导致数据库连接、文件句柄等资源无法正确释放。

```python
# 错误：取消后资源泄漏
async def process_with_db():
    conn = await get_db_connection()
    try:
        result = await conn.execute("SELECT * FROM users")
        await asyncio.sleep(10)  # 这里可能被取消
        return result
    except asyncio.CancelledError:
        return None  # conn没有关闭！

# 正确：使用async with确保资源释放
async def process_with_db():
    async with await get_db_connection() as conn:
        result = await conn.execute("SELECT * FROM users")
        await asyncio.sleep(10)
        return result
    # async with会确保即使被取消也能正确关闭连接
```

## 陷阱8：错误理解asyncio.sleep(0)的作用

`asyncio.sleep(0)`的作用是让出控制权给事件循环，让其他等待中的协程有机会执行。但很多人误以为它能保证公平调度。

```python
# asyncio.sleep(0)的正确用途
async def producer(queue):
    for item in items:
        await queue.put(item)
        await asyncio.sleep(0)  # 让消费者有机会处理

# 错误：以为sleep(0)能保证其他任务执行
async def bad_example():
    while True:
        await do_work()
        await asyncio.sleep(0)  # 这只是"建议"让出控制权，不保证

# 如果需要真正的定时执行，使用实际的时间间隔
async def timed_example():
    while True:
        await do_work()
        await asyncio.sleep(0.1)  # 至少间隔100ms
```

## 陷阱9：在多进程环境中错误共享事件循环

asyncio的事件循环不能跨进程共享。如果你使用多进程（`multiprocessing`），每个进程都需要自己独立的事件循环。

```python
# 错误：在子进程中使用父进程的事件循环
import multiprocessing

async def worker():
    # 这里会失败，因为子进程没有事件循环
    await asyncio.sleep(1)

def start_worker():
    multiprocessing.Process(target=worker).start()

# 正确：在子进程中创建新的事件循环
def start_worker():
    def run():
        asyncio.run(worker())  # 每个进程独立的事件循环

    multiprocessing.Process(target=run).start()

# 或者使用多线程代替多进程（GIL对IO密集型任务影响不大）
import threading

async def worker():
    await asyncio.sleep(1)

def start_workers(count=5):
    for _ in range(count):
        threading.Thread(target=lambda: asyncio.run(worker())).start()
```

## 陷阱10：调试困难——异常被协程吞噬

协程中的异常如果不被正确捕获，可能会被"吞噬"，只留下一个"Task exception was never retrieved"的警告。

```python
# 错误：异常被吞噬
async def main():
    asyncio.create_task(risky_operation())  # 如果risky_operation抛异常，你只会看到警告
    await asyncio.sleep(1)

# 正确：添加回调处理异常
def handle_exception(task):
    try:
        task.result()
    except Exception as e:
        print(f"任务失败: {e}")

async def main():
    task = asyncio.create_task(risky_operation())
    task.add_done_callback(handle_exception)
    await asyncio.sleep(1)

# 或者使用TaskGroup（Python 3.11+）自动传播异常
async def main():
    async with asyncio.TaskGroup() as tg:
        tg.create_task(risky_operation())
    # 如果risky_operation抛异常，这里会自动抛出
```

## 总结

asyncio是一个强大的工具，但需要开发者对事件循环的运行机制有清晰的理解。记住这几个核心原则：

1. **异步函数中不要做阻塞IO**——用aiohttp、asyncpg等异步库
2. **每个await都不能少**——用类型检查工具辅助
3. **控制并发数**——用Semaphore限制
4. **正确处理取消和异常**——用async with和TaskGroup
5. **资源一定要释放**——用异步上下文管理器

掌握这些要点后，asyncio会成为你构建高性能Python应用的利器。如果你在项目中遇到其他asyncio相关的问题，欢迎在评论区讨论。
