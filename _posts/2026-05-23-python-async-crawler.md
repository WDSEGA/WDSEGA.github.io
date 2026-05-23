---
layout: post
title: "Python异步编程实战：从原理到高性能爬虫系统"
date: 2026-05-23 11:00:00 +0800
categories: [技术, Python]
tags: [Python, asyncio, 爬虫, 异步编程, 性能优化]
image: /assets/images/covers/python-async-cover.jpg
---

异步编程是Python开发中最容易被误解，也最能带来性能提升的技术之一。很多人听说过`async`和`await`，但真到写代码时还是习惯性地用`requests`和`time.sleep`。这篇文章从实际案例出发，带你构建一个高性能的异步爬虫系统。

## 为什么需要异步？

先看一个真实的场景。假设你要抓取100个网页，每个页面请求耗时1秒。

同步代码的做法：

```python
import requests
import time

urls = [f"https://api.example.com/data/{i}" for i in range(100)]

def fetch_sync(url):
    response = requests.get(url)
    return response.json()

start = time.time()
results = [fetch_sync(url) for url in urls]
print(f"同步耗时: {time.time() - start:.2f}秒")  # 约100秒
```

100个请求串行执行，总耗时就是100秒。大部分时间都在等待网络响应，CPU处于空闲状态。

异步版本：

```python
import aiohttp
import asyncio
import time

urls = [f"https://api.example.com/data/{i}" for i in range(100)]

async def fetch_async(session, url):
    async with session.get(url) as response:
        return await response.json()

async def main():
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_async(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
        return results

start = time.time()
results = asyncio.run(main())
print(f"异步耗时: {time.time() - start:.2f}秒")  # 约2-3秒
```

同样是100个请求，异步版本只需要2-3秒。性能提升30倍以上。

## 核心概念：协程、事件循环、任务

理解异步编程，需要掌握三个核心概念。

**协程（Coroutine）** 是用`async def`定义的函数。它不会立即执行，而是返回一个协程对象。

```python
async def say_hello():
    print("Hello")
    await asyncio.sleep(1)
    print("World")

# 这不会执行函数，只是创建协程对象
coro = say_hello()
```

**事件循环（Event Loop）** 是异步编程的心脏。它负责调度协程的执行，当一个协程遇到`await`等待时，事件循环会切换到其他就绪的协程，从而实现并发。

**任务（Task）** 是协程的包装器，表示一个正在执行或等待执行的协程。通过`asyncio.create_task()`可以将协程提交给事件循环。

```python
async def main():
    # 创建任务
    task1 = asyncio.create_task(say_hello())
    task2 = asyncio.create_task(say_hello())
    
    # 等待所有任务完成
    await asyncio.gather(task1, task2)

asyncio.run(main())
```

## 实战：构建异步爬虫系统

下面我们来构建一个完整的异步爬虫系统，包含以下功能：
- 并发控制（防止请求过快被封）
- 自动重试机制
- 结果持久化
- 进度监控

### 基础版本

```python
import aiohttp
import asyncio
from aiohttp import ClientTimeout, TCPConnector
import json
from datetime import datetime

class AsyncCrawler:
    def __init__(self, max_concurrent=10, max_retries=3, timeout=30):
        self.max_concurrent = max_concurrent
        self.max_retries = max_retries
        self.timeout = ClientTimeout(total=timeout)
        self.results = []
        self.failed_urls = []
        
    async def fetch(self, session, url, retry_count=0):
        """获取单个URL，带重试机制"""
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.text()
                    return {
                        'url': url,
                        'status': response.status,
                        'data': data,
                        'timestamp': datetime.now().isoformat()
                    }
                else:
                    raise Exception(f"HTTP {response.status}")
                    
        except Exception as e:
            if retry_count < self.max_retries:
                await asyncio.sleep(2 ** retry_count)  # 指数退避
                return await self.fetch(session, url, retry_count + 1)
            else:
                return {
                    'url': url,
                    'status': 'failed',
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                }
    
    async def worker(self, session, queue):
        """工作协程，从队列取URL并处理"""
        while True:
            try:
                url = queue.get_nowait()
            except asyncio.QueueEmpty:
                break
                
            result = await self.fetch(session, url)
            self.results.append(result)
            
            if result.get('status') == 'failed':
                self.failed_urls.append(url)
            
            queue.task_done()
    
    async def crawl(self, urls):
        """主入口：爬取URL列表"""
        queue = asyncio.Queue()
        for url in urls:
            queue.put_nowait(url)
        
        # 配置连接池，限制总连接数
        connector = TCPConnector(
            limit=self.max_concurrent,
            limit_per_host=5,  # 单域名并发限制
            enable_cleanup_closed=True,
            force_close=True,
        )
        
        async with aiohttp.ClientSession(
            connector=connector,
            timeout=self.timeout,
            headers={
                'User-Agent': 'AsyncCrawler/1.0 (Research Purpose)'
            }
        ) as session:
            # 创建工作协程
            workers = [
                asyncio.create_task(self.worker(session, queue))
                for _ in range(self.max_concurrent)
            ]
            
            # 等待所有任务完成
            await queue.join()
            
            # 取消工作协程
            for w in workers:
                w.cancel()
            
            await asyncio.gather(*workers, return_exceptions=True)
        
        return self.results

# 使用示例
async def main():
    urls = [
        "https://httpbin.org/get",
        "https://httpbin.org/delay/1",
        "https://httpbin.org/delay/2",
    ] * 10  # 30个请求
    
    crawler = AsyncCrawler(max_concurrent=5)
    start = datetime.now()
    results = await crawler.crawl(urls)
    elapsed = (datetime.now() - start).total_seconds()
    
    print(f"完成 {len(results)} 个请求，耗时 {elapsed:.2f} 秒")
    print(f"成功: {sum(1 for r in results if r.get('status') == 200)}")
    print(f"失败: {len(crawler.failed_urls)}")
    
    # 保存结果
    with open('crawl_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    asyncio.run(main())
```

### 进阶：带解析和存储的完整系统

```python
import aiohttp
import asyncio
import aiofiles
from aiohttp import ClientTimeout, TCPConnector
from dataclasses import dataclass, asdict
from typing import List, Callable, Optional
import json
import sqlite3
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class CrawlResult:
    url: str
    status: int
    content: Optional[str]
    parsed_data: Optional[dict]
    crawl_time: float
    timestamp: str
    error: Optional[str] = None

class SQLiteStorage:
    """SQLite存储后端"""
    
    def __init__(self, db_path: str = "crawler.db"):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS crawl_results (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url TEXT NOT NULL,
                    status INTEGER,
                    content TEXT,
                    parsed_data TEXT,
                    crawl_time REAL,
                    timestamp TEXT,
                    error TEXT
                )
            ''')
            conn.execute('''
                CREATE INDEX IF NOT EXISTS idx_url ON crawl_results(url)
            ''')
            conn.commit()
    
    def save(self, results: List[CrawlResult]):
        with sqlite3.connect(self.db_path) as conn:
            for r in results:
                conn.execute('''
                    INSERT INTO crawl_results 
                    (url, status, content, parsed_data, crawl_time, timestamp, error)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    r.url, r.status, r.content,
                    json.dumps(r.parsed_data) if r.parsed_data else None,
                    r.crawl_time, r.timestamp, r.error
                ))
            conn.commit()
    
    def query(self, url_pattern: str = "%") -> List[dict]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM crawl_results WHERE url LIKE ?",
                (url_pattern,)
            )
            return [dict(row) for row in cursor.fetchall()]

class AdvancedCrawler:
    """高级异步爬虫，支持自定义解析和多种存储后端"""
    
    def __init__(
        self,
        max_concurrent: int = 10,
        max_retries: int = 3,
        timeout: int = 30,
        delay: float = 0.1,
        parser: Optional[Callable[[str], dict]] = None,
        storage: Optional[SQLiteStorage] = None
    ):
        self.max_concurrent = max_concurrent
        self.max_retries = max_retries
        self.timeout = ClientTimeout(total=timeout)
        self.delay = delay
        self.parser = parser
        self.storage = storage
        self.results: List[CrawlResult] = []
        self.semaphore = asyncio.Semaphore(max_concurrent)
        
    async def fetch(self, session: aiohttp.ClientSession, url: str) -> CrawlResult:
        """获取URL，带重试和限流"""
        start_time = asyncio.get_event_loop().time()
        
        for attempt in range(self.max_retries + 1):
            try:
                async with self.semaphore:
                    async with session.get(url) as response:
                        content = await response.text()
                        crawl_time = asyncio.get_event_loop().time() - start_time
                        
                        parsed = None
                        if self.parser and response.status == 200:
                            try:
                                parsed = self.parser(content)
                            except Exception as e:
                                logger.warning(f"解析失败 {url}: {e}")
                        
                        return CrawlResult(
                            url=url,
                            status=response.status,
                            content=content if not parsed else None,
                            parsed_data=parsed,
                            crawl_time=crawl_time,
                            timestamp=datetime.now().isoformat()
                        )
                        
            except Exception as e:
                if attempt < self.max_retries:
                    wait = 2 ** attempt + (asyncio.get_event_loop().time() % 1)
                    logger.warning(f"请求失败，{wait:.1f}秒后重试 {url}: {e}")
                    await asyncio.sleep(wait)
                else:
                    crawl_time = asyncio.get_event_loop().time() - start_time
                    return CrawlResult(
                        url=url,
                        status=0,
                        content=None,
                        parsed_data=None,
                        crawl_time=crawl_time,
                        timestamp=datetime.now().isoformat(),
                        error=str(e)
                    )
            
            await asyncio.sleep(self.delay)
    
    async def crawl(self, urls: List[str]) -> List[CrawlResult]:
        """爬取URL列表"""
        connector = TCPConnector(
            limit=self.max_concurrent * 2,
            limit_per_host=5,
            enable_cleanup_closed=True,
            force_close=True,
        )
        
        async with aiohttp.ClientSession(
            connector=connector,
            timeout=self.timeout,
            headers={
                'User-Agent': 'AdvancedCrawler/1.0 (Research Purpose)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            }
        ) as session:
            tasks = [self.fetch(session, url) for url in urls]
            
            # 使用as_completed实现进度监控
            completed = 0
            for coro in asyncio.as_completed(tasks):
                result = await coro
                self.results.append(result)
                completed += 1
                
                if completed % 10 == 0:
                    success_rate = sum(1 for r in self.results if r.status == 200) / len(self.results)
                    logger.info(f"进度: {completed}/{len(urls)}, 成功率: {success_rate:.1%}")
        
        # 保存结果
        if self.storage:
            self.storage.save(self.results)
            logger.info(f"结果已保存到数据库")
        
        return self.results
    
    def get_stats(self) -> dict:
        """获取爬取统计"""
        total = len(self.results)
        success = sum(1 for r in self.results if r.status == 200)
        failed = total - success
        avg_time = sum(r.crawl_time for r in self.results) / total if total > 0 else 0
        
        return {
            'total': total,
            'success': success,
            'failed': failed,
            'success_rate': success / total if total > 0 else 0,
            'avg_crawl_time': avg_time,
            'total_time': sum(r.crawl_time for r in self.results)
        }

# 使用示例：爬取JSON API并解析
def json_parser(content: str) -> dict:
    """示例解析器：解析JSON响应"""
    import json
    try:
        data = json.loads(content)
        # 提取关键字段
        return {
            'origin': data.get('origin'),
            'headers_count': len(data.get('headers', {})),
            'has_args': bool(data.get('args')),
        }
    except:
        return {'raw_length': len(content)}

async def demo():
    # 测试URL列表
    urls = [
        f"https://httpbin.org/get?n={i}"
        for i in range(50)
    ]
    
    # 创建爬虫实例
    storage = SQLiteStorage("demo_crawler.db")
    crawler = AdvancedCrawler(
        max_concurrent=10,
        max_retries=2,
        delay=0.05,
        parser=json_parser,
        storage=storage
    )
    
    # 执行爬取
    start = datetime.now()
    results = await crawler.crawl(urls)
    elapsed = (datetime.now() - start).total_seconds()
    
    # 输出统计
    stats = crawler.get_stats()
    print(f"\n{'='*50}")
    print(f"爬取完成!")
    print(f"总请求数: {stats['total']}")
    print(f"成功: {stats['success']}")
    print(f"失败: {stats['failed']}")
    print(f"成功率: {stats['success_rate']:.1%}")
    print(f"平均响应时间: {stats['avg_crawl_time']:.2f}秒")
    print(f"总耗时: {elapsed:.2f}秒")
    print(f"QPS: {stats['total'] / elapsed:.1f}")
    print(f"{'='*50}")
    
    # 查询保存的数据
    saved = storage.query()
    print(f"\n数据库中共有 {len(saved)} 条记录")

if __name__ == '__main__':
    asyncio.run(demo())
```

## 性能优化技巧

**1. 连接池配置**

```python
connector = TCPConnector(
    limit=100,           # 总连接数限制
    limit_per_host=10,   # 单域名连接限制
    ttl_dns_cache=300,   # DNS缓存时间
    use_dns_cache=True,
    enable_cleanup_closed=True,
)
```

**2. 信号量控制并发**

```python
semaphore = asyncio.Semaphore(10)

async def fetch(url):
    async with semaphore:
        # 只有10个协程能同时执行这里
        return await session.get(url)
```

**3. 批量处理结果**

```python
# 每100条结果保存一次
batch = []
for result in results:
    batch.append(result)
    if len(batch) >= 100:
        await save_batch(batch)
        batch = []
```

**4. 监控和日志**

```python
# 使用asyncio.Queue实现生产者-消费者模式
result_queue = asyncio.Queue()

async def producer():
    for url in urls:
        result = await fetch(url)
        await result_queue.put(result)

async def consumer():
    while True:
        result = await result_queue.get()
        await process_and_save(result)
        result_queue.task_done()
```

## 总结

异步编程不是银弹，但在I/O密集型场景（网络请求、文件读写、数据库操作）下，它能带来数量级的性能提升。掌握`asyncio`需要理解事件循环、协程、任务等概念，但一旦入门，你就能写出既高效又优雅的Python代码。

上面的爬虫系统可以直接用于生产环境，也可以作为学习异步编程的参考实现。关键要点：
- 使用`aiohttp`代替`requests`进行HTTP请求
- 用`asyncio.Semaphore`控制并发
- 实现指数退避重试机制
- 使用连接池复用TCP连接
- 批量处理结果减少I/O次数
