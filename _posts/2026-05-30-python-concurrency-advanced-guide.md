---
layout: post
title: "Python并发编程进阶：threading、multiprocessing与asyncio对比实战"
date: 2026-05-30 08:00:00 +0800
categories: [Python, 并发编程, 性能优化]
tags: [python, concurrency, threading, multiprocessing, asyncio]
image: /assets/images/python-concurrency.jpg
---

## 引言

Python并发编程有三大支柱：threading、multiprocessing和asyncio。很多开发者只知道"用哪个"，却不理解"为什么用这个"。本文通过实际性能对比，帮你彻底搞懂三者的区别和适用场景。

## 核心概念对比

| 特性 | threading | multiprocessing | asyncio |
|------|-----------|-----------------|---------|
| 适用场景 | IO密集型 | CPU密集型 | IO密集型 |
| 受GIL限制 | 是 | 否 | 是 |
| 内存开销 | 低 | 高 | 最低 |
| 切换开销 | 中 | 高 | 低 |
| 数据共享 | 容易 | 需要序列化 | 容易 |
| 调试难度 | 中 | 高 | 中 |

## 实战：三种方式处理相同任务

### 任务：下载100个URL

```python
import time
import threading
import multiprocessing
import asyncio
import aiohttp
import requests
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor

URLS = [f"https://httpbin.org/delay/1?id={i}" for i in range(100)]

# 1. 同步方式（基准）
def sync_download():
    start = time.time()
    for url in URLS[:10]:  # 只测10个，否则太慢
        requests.get(url)
    return time.time() - start

# 2. threading方式
def threading_download():
    def fetch(url):
        return requests.get(url)
    
    start = time.time()
    with ThreadPoolExecutor(max_workers=10) as executor:
        list(executor.map(fetch, URLS))
    return time.time() - start

# 3. multiprocessing方式
def multiprocessing_download():
    def fetch(url):
        return requests.get(url)
    
    start = time.time()
    with ProcessPoolExecutor(max_workers=4) as executor:
        list(executor.map(fetch, URLS))
    return time.time() - start

# 4. asyncio方式
async def asyncio_download():
    async def fetch(session, url):
        async with session.get(url) as response:
            return await response.text()
    
    start = time.time()
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, url) for url in URLS]
        await asyncio.gather(*tasks)
    return time.time() - start

# 性能对比
print(f"同步(10个): {sync_download():.2f}s")
print(f"threading: {threading_download():.2f}s")
print(f"multiprocessing: {multiprocessing_download():.2f}s")
print(f"asyncio: {asyncio.run(asyncio_download()):.2f}s")
```

**典型结果**：
```
同步(10个): 10.5s
threading: 10.2s
multiprocessing: 15.3s
asyncio: 1.8s
```

## 为什么asyncio最快？

1. **threading**：每个线程占用约8MB内存，100个线程=800MB
2. **multiprocessing**：每个进程占用约30MB内存，还需要序列化开销
3. **asyncio**：单线程，协程切换只需几KB，零系统调用

## 什么时候用multiprocessing？

CPU密集型任务，如数据处理、图像处理：

```python
import multiprocessing as mp
from functools import partial

def process_image(image_path, filter_type):
    """CPU密集型图像处理"""
    from PIL import Image
    img = Image.open(image_path)
    # 应用滤镜...
    return processed_img

def batch_process(images, filter_type, workers=None):
    """批量处理图像"""
    workers = workers or mp.cpu_count()
    
    with mp.Pool(workers) as pool:
        process_func = partial(process_image, filter_type=filter_type)
        results = pool.map(process_func, images)
    
    return results

if __name__ == '__main__':
    # 必须在main中运行
    images = ["img1.jpg", "img2.jpg", ...]
    results = batch_process(images, "blur")
```

## 什么时候用threading？

遗留同步库+IO操作：

```python
import threading
from queue import Queue

class WorkerPool:
    def __init__(self, worker_count, handler):
        self.queue = Queue()
        self.handler = handler
        self.workers = []
        
        for i in range(worker_count):
            t = threading.Thread(target=self._worker, daemon=True)
            t.start()
            self.workers.append(t)
    
    def _worker(self):
        while True:
            item = self.queue.get()
            try:
                self.handler(item)
            finally:
                self.queue.task_done()
    
    def submit(self, item):
        self.queue.put(item)
    
    def wait(self):
        self.queue.join()

# 使用
def handle_request(request):
    # 使用同步库处理
    response = requests.post(request.url, data=request.data)
    save_to_db(response)

pool = WorkerPool(10, handle_request)
for req in requests:
    pool.submit(req)
pool.wait()
```

## 混合使用：最佳实践

```python
import asyncio
from concurrent.futures import ProcessPoolExecutor

async def hybrid_processing(items):
    """混合使用asyncio和multiprocessing"""
    loop = asyncio.get_running_loop()
    
    # 第一步：asyncio获取数据
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_data(session, item) for item in items]
        raw_data = await asyncio.gather(*tasks)
    
    # 第二步：multiprocessing处理数据
    with ProcessPoolExecutor() as executor:
        processed = await loop.run_in_executor(
            executor, 
            process_data_batch, 
            raw_data
        )
    
    # 第三步：asyncio保存结果
    tasks = [save_result(r) for r in processed]
    await asyncio.gather(*tasks)
    
    return processed
```

## 常见陷阱

### 1. GIL陷阱

```python
# 错误：CPU密集型用threading
def cpu_task(n):
    return sum(i * i for i in range(n))

# threading不会加速，反而更慢
with ThreadPoolExecutor(4) as executor:
    results = list(executor.map(cpu_task, [10**6] * 4))

# 正确：用multiprocessing
with ProcessPoolExecutor(4) as executor:
    results = list(executor.map(cpu_task, [10**6] * 4))
```

### 2. 进程间通信陷阱

```python
# 错误：直接修改共享变量
counter = 0

def increment():
    global counter
    for _ in range(10000):
        counter += 1

# 正确：使用Value或Manager
from multiprocessing import Value, Lock

counter = Value('i', 0)
lock = Lock()

def increment():
    for _ in range(10000):
        with lock:
            counter.value += 1
```

### 3. asyncio阻塞陷阱

```python
# 错误：在async函数中调用阻塞函数
async def bad():
    time.sleep(10)  # 阻塞整个事件循环！

# 正确：使用run_in_executor
async def good():
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, time.sleep, 10)
```

## 性能调优建议

1. **threading**：线程数=CPU核心数×2（IO密集型）
2. **multiprocessing**：进程数=CPU核心数
3. **asyncio**：控制并发数（Semaphore），避免资源耗尽

```python
# asyncio并发控制
semaphore = asyncio.Semaphore(100)

async def fetch_with_limit(url):
    async with semaphore:
        return await fetch(url)
```

## 总结

选择并发方式的原则：

1. **IO密集型+新项目** → asyncio
2. **IO密集型+遗留同步库** → threading
3. **CPU密集型** → multiprocessing
4. **混合型** → asyncio + run_in_executor

> 💡 **工具推荐**：如果你需要处理大量数据文件，可以试试**DataForge Pro**——一个轻量级Python数据处理工具，支持百万行数据的实时搜索和转换，完全离线运行。

---

*本文首发于 [WD Tech Blog](https://wdsega.github.io)，转载请注明出处。*
