---
title: "Python异步编程完全指南：从入门到精通"
date: 2026-05-25
categories: [技术]
tags: [Python, 异步编程, asyncio, 教程]
author: TechWriter
---

# Python异步编程完全指南：从入门到精通

异步编程是现代Python开发中不可或缺的技能。本文将带你从零开始，全面掌握Python异步编程的核心概念和实践技巧。

## 为什么需要异步编程

### 同步 vs 异步

同步代码的问题：

```python
import requests
import time

def fetch_all_urls(urls):
    results = []
    for url in urls:
        response = requests.get(url)  # 阻塞等待
        results.append(response.text)
    return results

# 10个URL，每个耗时1秒 = 总共10秒
urls = [f"https://api.example.com/data/{i}" for i in range(10)]
start = time.time()
data = fetch_all_urls(urls)
print(f"耗时: {time.time() - start:.2f}秒")  # 约10秒
```

异步代码的优势：

```python
import aiohttp
import asyncio
import time

async def fetch_all_urls(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_one(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
    return results

async def fetch_one(session, url):
    async with session.get(url) as response:
        return await response.text()

# 10个URL并发请求 = 约1秒
urls = [f"https://api.example.com/data/{i}" for i in range(10)]
start = time.time()
data = asyncio.run(fetch_all_urls(urls))
print(f"耗时: {time.time() - start:.2f}秒")  # 约1秒
```

## 核心概念详解

### 事件循环

事件循环是异步编程的核心：

```python
import asyncio

async def main():
    print("Hello")
    await asyncio.sleep(1)
    print("World")

# 获取事件循环
loop = asyncio.get_event_loop()
loop.run_until_complete(main())

# 或者使用更简洁的方式
asyncio.run(main())
```

### 协程

协程是使用`async def`定义的函数：

```python
async def my_coroutine():
    """这是一个协程"""
    await asyncio.sleep(1)
    return "完成"

# 协程调用后返回协程对象，不会立即执行
coro = my_coroutine()
print(type(coro))  # <class 'coroutine'>

# 需要await或run来执行
result = asyncio.run(my_coroutine())
```

### await关键字

`await`用于等待协程完成：

```python
async def step_one():
    await asyncio.sleep(1)
    return "步骤1完成"

async def step_two():
    await asyncio.sleep(1)
    return "步骤2完成"

async def main():
    # 顺序执行
    result1 = await step_one()
    result2 = await step_two()
    print(result1, result2)
```

## 并发控制

### asyncio.gather

并行运行多个协程：

```python
async def fetch_data(url):
    await asyncio.sleep(1)  # 模拟网络请求
    return f"数据来自 {url}"

async def main():
    urls = ["url1", "url2", "url3", "url4", "url5"]
    
    # 并行执行所有请求
    results = await asyncio.gather(
        *[fetch_data(url) for url in urls]
    )
    print(results)

asyncio.run(main())
```

### asyncio.wait

更灵活的等待控制：

```python
async def main():
    tasks = [asyncio.create_task(fetch_data(f"url{i}")) for i in range(5)]
    
    # 等待所有完成
    done, pending = await asyncio.wait(tasks)
    
    # 等待第一个完成
    done, pending = await asyncio.wait(
        tasks, 
        return_when=asyncio.FIRST_COMPLETED
    )
    
    # 等待任意一个异常
    done, pending = await asyncio.wait(
        tasks,
        return_when=asyncio.FIRST_EXCEPTION
    )
```

### 信号量限制并发数

```python
async def fetch_with_limit(urls, max_concurrent=10):
    semaphore = asyncio.Semaphore(max_concurrent)
    
    async def fetch_one(url):
        async with semaphore:
            return await fetch_data(url)
    
    tasks = [fetch_one(url) for url in urls]
    return await asyncio.gather(*tasks)
```

## 实战案例：异步爬虫

```python
import asyncio
import aiohttp
from bs4 import BeautifulSoup
import time

class AsyncCrawler:
    def __init__(self, max_concurrent=10):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.session = None
    
    async def init_session(self):
        self.session = aiohttp.ClientSession()
    
    async def close_session(self):
        if self.session:
            await self.session.close()
    
    async def fetch_page(self, url):
        async with self.semaphore:
            try:
                async with self.session.get(url, timeout=10) as response:
                    html = await response.text()
                    return self.parse_page(html, url)
            except Exception as e:
                print(f"错误: {url} - {e}")
                return None
    
    def parse_page(self, html, url):
        soup = BeautifulSoup(html, 'html.parser')
        title = soup.find('title')
        return {
            'url': url,
            'title': title.text if title else '无标题'
        }
    
    async def crawl(self, urls):
        await self.init_session()
        try:
            tasks = [self.fetch_page(url) for url in urls]
            results = await asyncio.gather(*tasks)
            return [r for r in results if r]
        finally:
            await self.close_session()

# 使用示例
async def main():
    crawler = AsyncCrawler(max_concurrent=5)
    urls = [f"https://example.com/page/{i}" for i in range(100)]
    
    start = time.time()
    results = await crawler.crawl(urls)
    print(f"爬取 {len(results)} 页，耗时 {time.time()-start:.2f}秒")

asyncio.run(main())
```

## 异步上下文管理器

```python
class AsyncContextManager:
    async def __aenter__(self):
        print("进入上下文")
        await asyncio.sleep(0.5)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("退出上下文")
        await asyncio.sleep(0.5)
        return False

async def main():
    async with AsyncContextManager() as manager:
        print("执行操作")

asyncio.run(main())
```

## 异步迭代器

```python
class AsyncRange:
    def __init__(self, count):
        self.count = count
    
    def __aiter__(self):
        self.i = 0
        return self
    
    async def __anext__(self):
        if self.i >= self.count:
            raise StopAsyncIteration
        await asyncio.sleep(0.1)  # 模拟异步操作
        value = self.i
        self.i += 1
        return value

async def main():
    async for i in AsyncRange(5):
        print(i)

asyncio.run(main())
```

## 常见陷阱与解决方案

### 陷阱1：阻塞事件循环

```python
# 错误：在异步函数中使用阻塞操作
async def bad_example():
    time.sleep(5)  # 阻塞整个事件循环！
    return "完成"

# 正确：使用异步版本
async def good_example():
    await asyncio.sleep(5)  # 不阻塞，让出控制权
    return "完成"
```

### 陷阱2：忘记await

```python
async def fetch_data():
    await asyncio.sleep(1)
    return "数据"

async def main():
    # 错误：忘记await
    data = fetch_data()  # 只是创建了协程对象
    
    # 正确
    data = await fetch_data()
```

### 陷阱3：混合同步和异步

```python
# 使用asyncio.to_thread处理同步代码
async def main():
    # 在线程池中运行同步函数
    result = await asyncio.to_thread(sync_function, arg1, arg2)
    return result
```

## 性能优化技巧

### 1. 使用uvloop加速

```python
import asyncio
import uvloop

# 替换默认事件循环
uvloop.install()

async def main():
    # 现在使用更快的uvloop
    pass

asyncio.run(main())
```

### 2. 连接池复用

```python
# 全局session复用
class HttpClient:
    _instance = None
    _session = None
    
    @classmethod
    async def get_session(cls):
        if cls._session is None:
            cls._session = aiohttp.ClientSession()
        return cls._session
```

## 总结

Python异步编程的核心要点：

1. 理解事件循环的工作原理
2. 正确使用`async/await`语法
3. 使用`gather`、`wait`等实现并发
4. 注意避免阻塞事件循环
5. 合理控制并发数量

掌握异步编程，让你的Python程序性能提升数倍！

---

*本文首发于技术博客，转载请注明出处。*
