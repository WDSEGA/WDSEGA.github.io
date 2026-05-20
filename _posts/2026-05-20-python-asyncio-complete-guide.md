---
layout: post
title: "Python异步编程实战：asyncio完全指南"
date: 2026-05-20
categories: [编程, Python]
tags: [Python, asyncio, 异步编程, 并发, 教程]
image: /assets/images/python-asyncio-guide.jpg
---

![Python异步编程](/assets/images/python-asyncio-guide.jpg)

## 引言

在现代Python开发中，异步编程已经成为必备技能。无论是Web开发、网络爬虫、API调用还是数据处理，asyncio都能帮你大幅提升程序性能。本文将从零开始，带你全面掌握Python异步编程。

## 什么是异步编程？

### 同步 vs 异步

**同步编程**：代码按顺序一行一行执行，遇到I/O操作（网络请求、文件读写）时，程序会等待操作完成才继续执行下一行。

```python
import time

def fetch_data(url):
    """模拟网络请求 - 同步版本"""
    time.sleep(2)  # 等待2秒
    return f"数据来自 {url}"

def main():
    start = time.time()
    # 依次请求3个URL，总共需要6秒
    data1 = fetch_data("https://api1.com")
    data2 = fetch_data("https://api2.com")
    data3 = fetch_data("https://api3.com")
    print(f"总耗时: {time.time() - start:.2f}秒")  # 6.00秒

main()
```

**异步编程**：遇到I/O操作时，程序不会傻等，而是去执行其他任务，等I/O操作完成后再回来处理结果。

```python
import asyncio

async def fetch_data(url):
    """模拟网络请求 - 异步版本"""
    await asyncio.sleep(2)  # 不阻塞，让出控制权
    return f"数据来自 {url}"

async def main():
    start = asyncio.get_event_loop().time()
    # 同时请求3个URL，总共只需2秒！
    tasks = [
        fetch_data("https://api1.com"),
        fetch_data("https://api2.com"),
        fetch_data("https://api3.com"),
    ]
    results = await asyncio.gather(*tasks)
    print(f"总耗时: {asyncio.get_event_loop().time() - start:.2f}秒")  # 2.00秒

asyncio.run(main())
```

### 核心概念

| 概念 | 说明 | 类比 |
|------|------|------|
| event loop | 事件循环，异步程序的大脑 | 餐厅经理 |
| coroutine | 协程，异步函数 | 点菜的服务员 |
| await | 等待异步操作完成 | 等菜的同时服务其他桌 |
| Task | 对协程的封装 | 已下单的菜单 |
| Future | 未来结果的对象 | 取餐凭证 |

## asyncio基础

### 定义异步函数

```python
import asyncio

async def say_hello():
    print("Hello")
    await asyncio.sleep(1)
    print("World")

# 运行异步函数
asyncio.run(say_hello())
```

### await关键字

`await`只能在`async`函数中使用，它表示"等待这个异步操作完成，在此期间让出控制权"。

```python
async def fetch_user(user_id):
    await asyncio.sleep(1)  # 模拟数据库查询
    return {"id": user_id, "name": "张三"}

async def fetch_orders(user_id):
    await asyncio.sleep(1)  # 模拟API调用
    return [{"id": 1, "product": "Python教程"}]

async def main():
    # 串行执行 - 总共2秒
    user = await fetch_user(1)
    orders = await fetch_orders(user["id"])
    print(f"{user['name']}的订单: {orders}")

asyncio.run(main())
```

### 并发执行多个任务

```python
async def main():
    # 并行执行 - 只需1秒！
    user_task = asyncio.create_task(fetch_user(1))
    orders_task = asyncio.create_task(fetch_orders(1))

    user = await user_task
    orders = await orders_task
    print(f"{user['name']}的订单: {orders}")

asyncio.run(main())
```

## 实战案例

### 案例1：异步HTTP请求

```python
import asyncio
import aiohttp

async def fetch(session, url):
    """异步获取URL内容"""
    async with session.get(url) as response:
        return await response.text()

async def fetch_all(urls):
    """并发获取多个URL"""
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
        return results

async def main():
    urls = [
        "https://httpbin.org/get",
        "https://httpbin.org/ip",
        "https://httpbin.org/headers",
    ]
    results = await fetch_all(urls)
    for url, result in zip(urls, results):
        print(f"{url}: {len(result)} bytes")

asyncio.run(main())
```

### 案例2：异步数据库操作

```python
import asyncio
import aiosqlite

async def init_db():
    """初始化数据库"""
    async with aiosqlite.connect("users.db") as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                name TEXT,
                email TEXT
            )
        """)
        await db.commit()

async def insert_user(name, email):
    """插入用户"""
    async with aiosqlite.connect("users.db") as db:
        await db.execute(
            "INSERT INTO users (name, email) VALUES (?, ?)",
            (name, email)
        )
        await db.commit()

async def get_all_users():
    """获取所有用户"""
    async with aiosqlite.connect("users.db") as db:
        async with db.execute("SELECT * FROM users") as cursor:
            async for row in cursor:
                print(row)

async def batch_insert(users):
    """批量插入用户"""
    async with aiosqlite.connect("users.db") as db:
        await db.executemany(
            "INSERT INTO users (name, email) VALUES (?, ?)",
            users
        )
        await db.commit()

async def main():
    await init_db()

    # 批量插入
    users = [
        ("张三", "zhangsan@example.com"),
        ("李四", "lisi@example.com"),
        ("王五", "wangwu@example.com"),
    ]
    await batch_insert(users)

    # 查询
    await get_all_users()

asyncio.run(main())
```

### 案例3：异步Web爬虫

```python
import asyncio
import aiohttp
from bs4 import BeautifulSoup

class AsyncCrawler:
    def __init__(self, max_concurrent=10):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.visited = set()
        self.results = []

    async def fetch_page(self, session, url):
        """获取页面内容"""
        async with self.semaphore:
            try:
                async with session.get(url, timeout=10) as resp:
                    return await resp.text()
            except Exception as e:
                print(f"获取失败 {url}: {e}")
                return None

    def parse_links(self, html, base_url):
        """解析页面中的链接"""
        soup = BeautifulSoup(html, 'html.parser')
        links = []
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            if href.startswith('http'):
                links.append(href)
        return links

    async def crawl(self, start_url, max_pages=50):
        """爬取网站"""
        async with aiohttp.ClientSession() as session:
            queue = asyncio.Queue()
            await queue.put(start_url)

            while not queue.empty() and len(self.visited) < max_pages:
                url = await queue.get()

                if url in self.visited:
                    continue

                self.visited.add(url)
                print(f"正在爬取: {url} ({len(self.visited)}/{max_pages})")

                html = await self.fetch_page(session, url)
                if html:
                    self.results.append({
                        'url': url,
                        'length': len(html)
                    })
                    links = self.parse_links(html, url)
                    for link in links:
                        if link not in self.visited:
                            await queue.put(link)

        return self.results

async def main():
    crawler = AsyncCrawler(max_concurrent=5)
    results = await crawler.crawl("https://example.com", max_pages=20)
    print(f"共爬取 {len(results)} 个页面")

asyncio.run(main())
```

### 案例4：异步任务调度器

```python
import asyncio
from datetime import datetime

class TaskScheduler:
    def __init__(self):
        self.tasks = {}

    async def schedule(self, name, coro, delay_seconds):
        """延迟执行任务"""
        print(f"[{datetime.now():%H:%M:%S}] 任务 '{name}' 已调度，"
              f"{delay_seconds}秒后执行")
        await asyncio.sleep(delay_seconds)
        result = await coro
        print(f"[{datetime.now():%H:%M:%S}] 任务 '{name}' 完成: {result}")
        return result

    async def schedule_periodic(self, name, coro, interval_seconds, times=3):
        """周期性执行任务"""
        for i in range(times):
            await asyncio.sleep(interval_seconds)
            print(f"[{datetime.now():%H:%M:%S}] "
                  f"周期任务 '{name}' 第{i+1}次执行")
            result = await coro
            print(f"  结果: {result}")

    async def run_with_timeout(self, coro, timeout_seconds):
        """带超时的任务执行"""
        try:
            result = await asyncio.wait_for(coro, timeout=timeout_seconds)
            return result
        except asyncio.TimeoutError:
            print(f"任务超时（{timeout_seconds}秒）")
            return None

async def main():
    scheduler = TaskScheduler()

    # 并发调度多个任务
    await asyncio.gather(
        scheduler.schedule("任务A", asyncio.coroutine(
            lambda: "完成"), 1),
        scheduler.schedule("任务B", asyncio.coroutine(
            lambda: "完成"), 2),
        scheduler.schedule("任务C", asyncio.coroutine(
            lambda: "完成"), 3),
    )

asyncio.run(main())
```

## 高级技巧

### 1. 使用asyncio.Queue进行任务分发

```python
import asyncio
import random

async def producer(queue, item_count):
    """生产者：生成任务"""
    for i in range(item_count):
        item = f"任务-{i}"
        await queue.put(item)
        print(f"生产: {item}")
        await asyncio.sleep(random.uniform(0.1, 0.5))

async def consumer(queue, consumer_id):
    """消费者：处理任务"""
    while True:
        item = await queue.get()
        print(f"消费者{consumer_id} 处理: {item}")
        await asyncio.sleep(random.uniform(0.3, 1.0))
        queue.task_done()

async def main():
    queue = asyncio.Queue(maxsize=10)

    # 启动3个消费者
    consumers = [
        asyncio.create_task(consumer(queue, i))
        for i in range(3)
    ]

    # 启动生产者
    await producer(queue, 10)

    # 等待所有任务处理完成
    await queue.join()

    # 取消消费者
    for c in consumers:
        c.cancel()

asyncio.run(main())
```

### 2. 异步上下文管理器

```python
class AsyncDatabaseConnection:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.connection = None

    async def __aenter__(self):
        print(f"连接到 {self.host}:{self.port}")
        await asyncio.sleep(0.5)  # 模拟连接
        self.connection = f"Connection to {self.host}:{self.port}"
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        print("关闭连接")
        await asyncio.sleep(0.2)  # 模拟关闭
        self.connection = None

    async def query(self, sql):
        print(f"执行查询: {sql}")
        await asyncio.sleep(0.3)
        return [{"id": 1, "name": "测试数据"}]

async def main():
    async with AsyncDatabaseConnection("localhost", 5432) as db:
        results = await db.query("SELECT * FROM users")
        print(f"查询结果: {results}")

asyncio.run(main())
```

### 3. 信号量控制并发

```python
async def download_file(session, url, semaphore):
    """限制并发的文件下载"""
    async with semaphore:
        async with session.get(url) as response:
            content = await response.read()
            print(f"下载完成: {url} ({len(content)} bytes)")
            return content

async def download_all(urls, max_concurrent=5):
    """批量下载文件"""
    semaphore = asyncio.Semaphore(max_concurrent)
    async with aiohttp.ClientSession() as session:
        tasks = [
            download_file(session, url, semaphore)
            for url in urls
        ]
        return await asyncio.gather(*tasks)
```

## 常见陷阱与解决方案

### 陷阱1：在异步函数中调用同步阻塞代码

```python
# 错误示范
async def bad_example():
    time.sleep(5)  # 阻塞整个事件循环！
    requests.get("https://example.com")  # 同样阻塞！

# 正确做法
async def good_example():
    await asyncio.sleep(5)  # 非阻塞
    async with aiohttp.ClientSession() as session:
        async with session.get("https://example.com") as resp:
            return await resp.text()

# 如果必须使用同步代码，用线程池
async def mixed_example():
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,  # 默认线程池
        lambda: requests.get("https://example.com").text
    )
    return result
```

### 陷阱2：忘记await

```python
# 错误示范
async def bad():
    result = fetch_data()  # 忘记await！返回的是coroutine对象
    print(result)  # <coroutine object fetch_data at 0x...>

# 正确做法
async def good():
    result = await fetch_data()  # 正确await
    print(result)  # 实际数据
```

### 陷阱3：过度并发导致资源耗尽

```python
# 错误示范：同时发起10000个请求
async def bad():
    tasks = [fetch(url) for url in ten_thousand_urls]
    await asyncio.gather(*tasks)  # 可能导致连接池耗尽

# 正确做法：使用信号量限制并发
async def good():
    sem = asyncio.Semaphore(100)  # 最多100个并发
    async def limited_fetch(url):
        async with sem:
            return await fetch(url)
    tasks = [limited_fetch(url) for url in ten_thousand_urls]
    await asyncio.gather(*tasks)
```

## 性能对比

| 场景 | 同步耗时 | 异步耗时 | 提升倍数 |
|------|----------|----------|----------|
| 100个HTTP请求 | 200秒 | 2.5秒 | 80x |
| 1000个数据库查询 | 500秒 | 8秒 | 62x |
| 10个文件读写 | 5秒 | 0.8秒 | 6x |
| 混合I/O操作 | 150秒 | 5秒 | 30x |

## 结语

Python异步编程的核心思想是：**在等待I/O的时候不要闲着，去做别的事情**。掌握asyncio不仅能提升程序性能，更能让你写出更优雅、更高效的代码。

记住这几个关键点：
1. `async def`定义异步函数
2. `await`等待异步操作
3. `asyncio.gather()`并发执行多个任务
4. `asyncio.Semaphore()`控制并发数量
5. 避免在异步代码中使用同步阻塞操作

---

*本文为完整版，更多进阶案例和性能优化技巧请持续关注本博客。*

*相关阅读：[Docker容器化Node.js应用：从Dockerfile到生产部署](/2026/05/20/docker-nodejs-deployment-guide)*
