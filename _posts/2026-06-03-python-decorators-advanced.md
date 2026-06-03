---
layout: post
title: "Python装饰器进阶：从入门到自定义元类"
date: 2026-06-03 09:00:00 +0800
tags: [python, decorator, metaclass, 进阶]
---

Python装饰器是日常开发中频繁使用的特性，但大多数开发者停留在`@staticmethod`或`@login_required`的层面。本文将从闭包原理出发，逐步深入到参数化装饰器、类装饰器，最终触及自定义元类，帮助你建立完整的装饰器知识体系。

## 一、装饰器的本质：语法糖背后的闭包

装饰器本质上是一个接收函数作为参数并返回函数的闭包。以下代码展示了最基础的装饰器实现：

```python
def my_decorator(func):
    def wrapper(*args, **kwargs):
        print("调用前")
        result = func(*args, **kwargs)
        print("调用后")
        return result
    return wrapper

@my_decorator
def say_hello():
    print("Hello")

say_hello()
```

输出结果为：

```
调用前
Hello
调用后
```

这里的关键在于`wrapper`函数形成了闭包，它记住了外部作用域中的`func`变量。理解这一点，才能明白为什么装饰器可以叠加使用：多个装饰器本质上是从内到外依次嵌套调用。

## 二、参数化装饰器：让装饰器接收配置

实际项目中，我们常常需要给装饰器传递参数。例如一个带超时设置的装饰器：

```python
import functools
import time

def retry(max_attempts=3, delay=1):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts:
                        raise
                    time.sleep(delay)
                    print(f"第 attempt 次失败，正在重试...")
        return wrapper
    return decorator

@retry(max_attempts=5, delay=2)
def fetch_data():
    import random
    if random.random() < 0.7:
        raise ConnectionError("网络波动")
    return "数据获取成功"
```

参数化装饰器的核心技巧是增加一层嵌套：最外层接收参数，中间层是装饰器本身，最内层是包装函数。`functools.wraps`的使用至关重要，它能保留原函数的元数据，避免调试时函数名被替换为`wrapper`的困扰。

## 三、类装饰器：面向对象的装饰方案

当装饰器需要维护状态时，类装饰器比函数装饰器更加清晰。以下实现了一个简单的速率限制装饰器：

```python
import time

class RateLimiter:
    def __init__(self, max_calls, period):
        self.max_calls = max_calls
        self.period = period
        self.calls = []

    def __call__(self, func):
        def wrapper(*args, **kwargs):
            now = time.time()
            self.calls = [c for c in self.calls if now - c < self.period]
            if len(self.calls) >= self.max_calls:
                raise RuntimeError("请求过于频繁，请稍后再试")
            self.calls.append(now)
            return func(*args, **kwargs)
        return wrapper

@RateLimiter(max_calls=5, period=60)
def api_endpoint():
    return {"status": "ok"}
```

类装饰器利用`__init__`接收配置参数，`__call__`返回包装函数。这种方式天然支持状态管理，无需借助闭包中的可变对象（如列表或字典）。

## 四、方法装饰器与描述符协议

在类中定义装饰器时，需要特别注意`self`的绑定问题。如果直接用函数装饰器装饰实例方法，`self`参数会丢失。正确的做法是实现描述符协议：

```python
class CachedProperty:
    def __init__(self, func):
        self.func = func
        self.name = func.__name__

    def __get__(self, instance, owner):
        if instance is None:
            return self
        value = self.func(instance)
        setattr(instance, self.name, value)
        return value

class DataProcessor:
    def __init__(self, data):
        self.data = data

    @CachedProperty
    def heavy_computation(self):
        print("执行耗时计算...")
        return sum(x ** 2 for x in self.data)

processor = DataProcessor(range(1000000))
print(processor.heavy_computation)  # 首次计算
print(processor.heavy_computation)  # 直接返回缓存值
```

`CachedProperty`通过`__get__`方法拦截属性访问，仅在首次访问时执行计算，后续直接从实例字典中读取。这是Django中`cached_property`的简化实现。

## 五、自定义元类：控制类的创建过程

元类是类的类，它控制类的创建过程。通过自定义元类，我们可以在类定义阶段注入装饰器逻辑：

```python
class AutoRegisterMeta(type):
    registry = {}

    def __new__(mcs, name, bases, namespace):
        cls = super().__new__(mcs, name, bases, namespace)
        if name != 'BasePlugin':
            mcs.registry[name.lower()] = cls
        return cls

class BasePlugin(metaclass=AutoRegisterMeta):
    def execute(self):
        raise NotImplementedError

class EmailPlugin(BasePlugin):
    def execute(self):
        return "发送邮件"

class SmsPlugin(BasePlugin):
    def execute(self):
        return "发送短信"

print(AutoRegisterMeta.registry)
# 输出: {'emailplugin': EmailPlugin, 'smsplugin': SmsPlugin}
```

在这个例子中，`AutoRegisterMeta`在类创建时自动将子类注册到字典中。这种模式在插件系统、ORM模型注册等场景中非常实用。

更进一步，我们可以用元类实现类似Django ORM的字段声明语法：

```python
class Field:
    def __init__(self, name, field_type):
        self.name = name
        self.field_type = field_type

class ModelMeta(type):
    def __new__(mcs, name, bases, namespace):
        fields = {}
        for key, value in list(namespace.items()):
            if isinstance(value, Field):
                fields[key] = value
                namespace.pop(key)
        namespace['_fields'] = fields
        return super().__new__(mcs, name, bases, namespace)

class Model(metaclass=ModelMeta):
    pass

class User(Model):
    id = Field('id', 'INTEGER')
    name = Field('name', 'VARCHAR')
    email = Field('email', 'VARCHAR')

print(User._fields)
# 输出: {'id': Field对象, 'name': Field对象, 'email': Field对象}
```

## 六、最佳实践与常见陷阱

1. **始终使用`functools.wraps`**：保留原函数的`__name__`、`__doc__`等属性。
2. **注意装饰器顺序**：多个装饰器从上到下执行，但嵌套顺序是从内到外。`@a @b def f()`等价于`f = a(b(f))`。
3. **类方法装饰器**：装饰`@classmethod`时，装饰器要放在`classmethod`之上，即`@decorator @classmethod`。
4. **类型提示**：Python 3.9+可以使用`typing.ParamSpec`保持装饰器对函数签名的支持：

```python
from typing import ParamSpec, TypeVar, Callable

P = ParamSpec('P')
T = TypeVar('T')

def transparent_decorator(func: Callable[P, T]) -> Callable[P, T]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        return func(*args, **kwargs)
    return wrapper
```

## 结语

从简单的函数装饰器到自定义元类，Python的装饰器机制提供了极大的灵活性。掌握这些技术后，你可以编写出更加简洁、可复用且易于维护的代码。建议从实际项目中的日志记录、权限校验等需求入手，逐步尝试更复杂的装饰器模式。
