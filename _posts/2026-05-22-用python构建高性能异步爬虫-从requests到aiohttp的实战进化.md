---
title: "用Python构建高性能异步爬虫：从requests到aiohttp的实战进化"
date: 2026-05-22
categories: [技术, 科普]
tags: "python, async, webscraping, tutorial"
---

爬虫是Python最经典的用途之一。但很多人写的爬虫效率极低，sequential的请求方式浪费了大量的等待时间。今天我来分享如何用异步编程把爬虫性能提升10倍以上。

## 问题：传统爬虫的瓶颈

同步爬虫的问题是：每次请求都要等待服务器响应，CPU大部分时间都在空转。如果每个请求平均耗时1秒，10个URL就需要10秒。

## 解决方案：asyncio + aiohttp

Python 3.4引入了asyncio模块，3.5加入了async/await语法，让异步编程变得简单。配合aiohttp库，我们可以写出高性能的异步爬虫。

```python
import asyncio
import aiohttp

async def fetch_url(session, url):
    async with session.get(url) as response:
        return await response.text()

async def main():
    urls = ["https://example.com/page/{}".format(i) for i in range(1, 11)]
    
    connector = aiohttp.TCPConnector(limit=10)
    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [fetch_url(session, url) for url in urls]
        results = await asyncio.gather(*tasks)
    
    return results

if __name__ == "__main__":
    asyncio.run(main())
```

## 进阶：带重试机制和限流的爬虫

实际生产环境需要更完善的错误处理。完整的实现包括：信号量限流、指数退避重试、随机抖动、完整的错误处理。

## 性能对比

| 方式 | URL数量 | 总耗时 |
|------|---------|--------|
| 同步requests | 20 | 20.5s |
| 异步aiohttp | 20 | 1.3s |

15倍的性能提升！

## 完整代码

完整代码和更多示例可以在我的博客找到。

---

*原文发表于 [WDSEGA Blog](https://wdsega.github.io/2025/05/22/python-async-crawler.html)*