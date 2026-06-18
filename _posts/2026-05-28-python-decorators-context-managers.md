---
layout: post
title: "Python高级技巧：8个让代码更优雅的装饰器和上下文管理器"
date: 2026-05-28 10:00:00 +0800
image: /assets/images/python-tips-advanced-2026.jpg
tags: [代码产品]
---

Python的装饰器（Decorator）和上下文管理器（Context Manager）是两个被低估的强大特性。很多开发者日常只用 `@staticmethod` 和 `with open()`，却不知道这两个机制可以实现远比这更复杂的功能。

本文将分享8个实用的高级技巧，涵盖缓存、重试、计时、权限检查、资源管理等常见场景。每个技巧都有完整的代码示例，可以直接复制使用。

## 1. 带过期时间的缓存装饰器

`functools.lru_cache` 很好用，但它没有过期时间控制。下面实现一个带TTL的缓存装饰器：

```python
import time
import functools

def timed_cache(max_age_seconds=60):
    """带过期时间的缓存装饰器"""
    def decorator(func):
        cache = {}

        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            key = (args, tuple(sorted(kwargs.items())))
            cached = cache.get(key)

            if cached and (time.time() - cached['time']) < max_age_seconds:
                return cached['value']

            result = func(*args, **kwargs)
            cache[key] = {'value': result, 'time': time.time()}
            return result

        wrapper.cache_clear = lambda: cache.clear()
        return wrapper

    return decorator

# 使用示例
@timed_cache(max_age_seconds=30)
def get_user_info(user_id):
    print(f"查询数据库: user_id={user_id}")
    return {"id": user_id, "name": "Test User"}

# 第一次调用会查询数据库
print(get_user_info(1))  # 查询数据库: user_id=1
# 30秒内再次调用直接返回缓存
print(get_user_info(1))  # 无输出，直接返回缓存
```

## 2. 智能重试装饰器

网络请求、数据库操作等场景经常需要重试机制：

```python
import time
import functools
import logging

logger = logging.getLogger(__name__)

def retry(max_attempts=3, delay=1, backoff=2, exceptions=(Exception,)):
    """
    智能重试装饰器
    :param max_attempts: 最大重试次数
    :param delay: 初始延迟（秒）
    :param backoff: 退避倍数
    :param exceptions: 需要重试的异常类型
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            current_delay = delay
            last_exception = None

            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt == max_attempts:
                        logger.error(
                            f"{func.__name__} 在 {max_attempts} 次尝试后失败"
                        )
                        raise

                    logger.warning(
                        f"{func.__name__} 第{attempt}次尝试失败，"
                        f"{current_delay}秒后重试... 错误: {e}"
                    )
                    time.sleep(current_delay)
                    current_delay *= backoff

        return wrapper
    return decorator

# 使用示例
@retry(max_attempts=3, delay=1, backoff=2, exceptions=(ConnectionError, TimeoutError))
def fetch_api_data(url):
    import requests
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    return response.json()
```

## 3. 函数执行计时器

性能优化时，精确测量函数执行时间非常重要：

```python
import time
import functools
import logging

logger = logging.getLogger(__name__)

def timer(log_level=logging.INFO):
    """函数执行计时装饰器"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                elapsed = time.perf_counter() - start
                logger.log(
                    log_level,
                    f"{func.__name__} 执行耗时: {elapsed:.4f}秒"
                )
        return wrapper
    return decorator

# 使用示例
@timer()
def process_large_file(filepath):
    """处理大文件"""
    with open(filepath, 'r') as f:
        data = f.readlines()
    return len(data)
```

## 4. 上下文管理器实现数据库事务

用上下文管理器管理数据库事务，确保异常时自动回滚：

```python
import sqlite3
from contextlib import contextmanager

@contextmanager
def db_transaction(db_path):
    """数据库事务上下文管理器"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        yield cursor
        conn.commit()
        logger.info("事务提交成功")
    except Exception as e:
        conn.rollback()
        logger.error(f"事务回滚: {e}")
        raise
    finally:
        conn.close()

# 使用示例
with db_transaction('app.db') as cur:
    cur.execute("INSERT INTO users (name, email) VALUES (?, ?)", ("Alice", "alice@example.com"))
    cur.execute("UPDATE stats SET user_count = user_count + 1")
    # 如果任何操作失败，自动回滚
```

## 5. 临时目录上下文管理器

处理文件时，经常需要创建临时目录：

```python
import tempfile
import shutil
import os
from contextlib import contextmanager

@contextmanager
def temp_directory():
    """临时目录上下文管理器，退出时自动清理"""
    dir_path = tempfile.mkdtemp()
    try:
        yield dir_path
    finally:
        shutil.rmtree(dir_path, ignore_errors=True)

# 使用示例
with temp_directory() as tmp_dir:
    data_path = os.path.join(tmp_dir, 'data.csv')
    with open(data_path, 'w') as f:
        f.write('name,age\nAlice,30\nBob,25')
    # 处理文件...
    print(f"文件保存在: {data_path}")
# 退出with块后，tmp_dir及其内容自动删除
```

## 6. 参数验证装饰器

在函数入口处验证参数，提前拦截无效输入：

```python
import functools

def validate_types(**expected_types):
    """参数类型验证装饰器"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(**kwargs):
            for param_name, expected_type in expected_types.items():
                if param_name in kwargs:
                    value = kwargs[param_name]
                    if not isinstance(value, expected_type):
                        raise TypeError(
                            f"参数 '{param_name}' 期望类型 {expected_type.__name__}，"
                            f"实际得到 {type(value).__name__}"
                        )
            return func(**kwargs)
        return wrapper
    return decorator

def validate_range(**ranges):
    """参数范围验证装饰器"""
    def decorator(func):
        @functools.wraps(func)
        def wrapper(**kwargs):
            for param_name, (min_val, max_val) in ranges.items():
                if param_name in kwargs:
                    value = kwargs[param_name]
                    if not (min_val <= value <= max_val):
                        raise ValueError(
                            f"参数 '{param_name}' 的值 {value} "
                            f"不在有效范围 [{min_val}, {max_val}] 内"
                        )
            return func(**kwargs)
        return wrapper
    return decorator

# 组合使用
@validate_types(name=str, age=int, score=float)
@validate_range(age=(0, 150), score=(0.0, 100.0))
def create_student(name, age, score):
    return {"name": name, "age": age, "score": score}

# create_student(name="Alice", age=25, score=95.5)  # OK
# create_student(name="Bob", age=200, score=80)      # ValueError
# create_student(name=123, age=25, score=80)          # TypeError
```

## 7. 信号量控制并发

限制函数的并发执行数量：

```python
import functools
import asyncio

def async_rate_limit(max_concurrent=5):
    """异步并发限制装饰器"""
    semaphore = asyncio.Semaphore(max_concurrent)

    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            async with semaphore:
                return await func(*args, **kwargs)
        return wrapper
    return decorator

# 使用示例
@async_rate_limit(max_concurrent=3)
async def fetch_url(url):
    import aiohttp
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()

# 批量请求，但最多同时3个
async def batch_fetch(urls):
    tasks = [fetch_url(url) for url in urls]
    return await asyncio.gather(*tasks)
```

## 8. 单例模式装饰器

确保一个类只有一个实例：

```python
def singleton(cls):
    """单例模式装饰器"""
    instances = {}

    @functools.wraps(cls)
    def get_instance(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return get_instance

# 使用示例
@singleton
class DatabaseConnection:
    def __init__(self, host='localhost', port=5432):
        self.host = host
        self.port = port
        print(f"创建数据库连接: {host}:{port}")

    def query(self, sql):
        print(f"执行查询: {sql}")

# 无论创建多少次，都是同一个实例
db1 = DatabaseConnection()
db2 = DatabaseConnection()
print(db1 is db2)  # True
```

## 总结

| 技巧 | 适用场景 | 复杂度 |
|------|---------|--------|
| 带TTL缓存 | API调用、数据库查询 | 低 |
| 智能重试 | 网络请求、外部服务调用 | 低 |
| 执行计时 | 性能优化、监控 | 低 |
| 数据库事务 | 数据库操作 | 中 |
| 临时目录 | 文件处理、测试 | 低 |
| 参数验证 | API接口、数据处理 | 低 |
| 并发限制 | 爬虫、批量API调用 | 中 |
| 单例模式 | 数据库连接、配置管理 | 低 |

装饰器和上下文管理器的核心思想是**将横切关注点从业务逻辑中分离出来**。合理使用它们，可以让你的代码更简洁、更健壮、更易维护。

建议在日常开发中，遇到重复的"前置处理+后置清理"模式时，优先考虑用装饰器或上下文管理器来封装。

---

*你平时还用哪些Python高级技巧？欢迎在评论区分享交流。*
