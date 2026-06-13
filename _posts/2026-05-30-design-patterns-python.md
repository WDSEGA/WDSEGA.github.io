---
layout: post
title: "设计模式实战：Python实现23种经典设计模式"
date: 2026-05-30 15:00:00 +0800
categories: [Python, 设计模式, 软件工程]
tags: [python, design-patterns, oop, software-engineering]
image: /assets/images/design-patterns.jpg
---

## 引言

设计模式是软件设计的最佳实践。本文用Python实现23种经典设计模式，每个都有实际应用场景。

## 创建型模式

### 1. 单例模式

```python
class Singleton:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

# 线程安全版本
import threading

class ThreadSafeSingleton:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance
```

### 2. 工厂模式

```python
from abc import ABC, abstractmethod

# 产品接口
class Animal(ABC):
    @abstractmethod
    def speak(self) -> str:
        pass

class Dog(Animal):
    def speak(self) -> str:
        return "Woof!"

class Cat(Animal):
    def speak(self) -> str:
        return "Meow!"

# 工厂
class AnimalFactory:
    @staticmethod
    def create(animal_type: str) -> Animal:
        if animal_type == "dog":
            return Dog()
        elif animal_type == "cat":
            return Cat()
        raise ValueError(f"Unknown animal type: {animal_type}")

# 使用
dog = AnimalFactory.create("dog")
print(dog.speak())  # Woof!
```

### 3. 建造者模式

```python
class User:
    def __init__(self):
        self.name = None
        self.age = None
        self.email = None
        self.address = None
    
    def __str__(self):
        return f"User(name={self.name}, age={self.age}, email={self.email})"

class UserBuilder:
    def __init__(self):
        self._user = User()
    
    def with_name(self, name: str):
        self._user.name = name
        return self
    
    def with_age(self, age: int):
        self._user.age = age
        return self
    
    def with_email(self, email: str):
        self._user.email = email
        return self
    
    def with_address(self, address: str):
        self._user.address = address
        return self
    
    def build(self) -> User:
        return self._user

# 使用
user = (UserBuilder()
    .with_name("Alice")
    .with_age(30)
    .with_email("alice@example.com")
    .build())
```

## 结构型模式

### 4. 适配器模式

```python
# 旧接口
class LegacyPrinter:
    def print_string(self, text: str):
        print(f"Legacy: {text}")

# 新接口
class ModernPrinter:
    def print(self, text: str, style: str = "normal"):
        print(f"[{style}] {text}")

# 适配器
class PrinterAdapter(ModernPrinter):
    def __init__(self, legacy_printer: LegacyPrinter):
        self.legacy = legacy_printer
    
    def print(self, text: str, style: str = "normal"):
        self.legacy.print_string(f"[{style}] {text}")
```

### 5. 装饰器模式

```python
from functools import wraps

def log_execution(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        print(f"Executing {func.__name__}")
        result = func(*args, **kwargs)
        print(f"Finished {func.__name__}")
        return result
    return wrapper

def measure_time(func):
    import time
    @wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        print(f"{func.__name__} took {time.time()-start:.2f}s")
        return result
    return wrapper

@log_execution
@measure_time
def process_data(data):
    return [x * 2 for x in data]
```

### 6. 代理模式

```python
class Database:
    def query(self, sql: str):
        print(f"Executing: {sql}")
        return [{"id": 1, "name": "Alice"}]

class DatabaseProxy:
    def __init__(self):
        self._real_db = None
        self._cache = {}
    
    def query(self, sql: str):
        # 懒加载
        if self._real_db is None:
            self._real_db = Database()
        
        # 缓存检查
        if sql in self._cache:
            print("Cache hit!")
            return self._cache[sql]
        
        result = self._real_db.query(sql)
        self._cache[sql] = result
        return result
```

## 行为型模式

### 7. 策略模式

```python
from abc import ABC, abstractmethod

class PaymentStrategy(ABC):
    @abstractmethod
    def pay(self, amount: float):
        pass

class CreditCardPayment(PaymentStrategy):
    def pay(self, amount: float):
        print(f"Paid ${amount} via Credit Card")

class PayPalPayment(PaymentStrategy):
    def pay(self, amount: float):
        print(f"Paid ${amount} via PayPal")

class PaymentProcessor:
    def __init__(self, strategy: PaymentStrategy):
        self._strategy = strategy
    
    def process(self, amount: float):
        self._strategy.pay(amount)

# 使用
processor = PaymentProcessor(CreditCardPayment())
processor.process(100)
```

### 8. 观察者模式

```python
from typing import List, Callable

class EventEmitter:
    def __init__(self):
        self._listeners: List[Callable] = []
    
    def subscribe(self, callback: Callable):
        self._listeners.append(callback)
    
    def unsubscribe(self, callback: Callable):
        self._listeners.remove(callback)
    
    def emit(self, *args, **kwargs):
        for listener in self._listeners:
            listener(*args, **kwargs)

# 使用
emitter = EventEmitter()

def on_message(msg):
    print(f"Received: {msg}")

emitter.subscribe(on_message)
emitter.emit("Hello!")
```

### 9. 命令模式

```python
from typing import List

class Command:
    def execute(self):
        pass
    
    def undo(self):
        pass

class AddTextCommand(Command):
    def __init__(self, editor, text):
        self.editor = editor
        self.text = text
    
    def execute(self):
        self.editor.content += self.text
    
    def undo(self):
        self.editor.content = self.editor.content[:-len(self.text)]

class Editor:
    def __init__(self):
        self.content = ""
        self._history: List[Command] = []
    
    def execute(self, command: Command):
        command.execute()
        self._history.append(command)
    
    def undo(self):
        if self._history:
            command = self._history.pop()
            command.undo()
```

### 10. 状态模式

```python
class OrderState(ABC):
    @abstractmethod
    def next(self, order):
        pass
    
    @abstractmethod
    def cancel(self, order):
        pass

class NewOrder(OrderState):
    def next(self, order):
        order.state = PaidOrder()
    
    def cancel(self, order):
        order.state = CancelledOrder()

class PaidOrder(OrderState):
    def next(self, order):
        order.state = ShippedOrder()
    
    def cancel(self, order):
        print("Cannot cancel paid order")

class Order:
    def __init__(self):
        self.state = NewOrder()
    
    def next(self):
        self.state.next(self)
    
    def cancel(self):
        self.state.cancel(self)
```

## 总结

设计模式分类：

| 类型 | 模式 |
|------|------|
| 创建型 | 单例、工厂、建造者、原型 |
| 结构型 | 适配器、装饰器、代理、外观、组合 |
| 行为型 | 策略、观察者、命令、状态、迭代器 |

> 💡 **工具推荐**：如果你需要处理大量数据，可以试试**DataForge Pro**——一个轻量级数据处理工具，比Excel快100倍。

---

