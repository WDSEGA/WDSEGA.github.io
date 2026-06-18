---
layout: post
title: "代码重构实战：从遗留代码到优雅设计"
date: 2026-05-30 16:00:00 +0800
categories: [重构, 代码质量, 软件工程]
tags: [代码产品]
image: /assets/images/refactoring.jpg
---

## 引言

重构是在不改变代码行为的前提下，改善代码结构。本文通过实际案例展示重构技巧。

## 重构原则

1. **小步前进** - 每次只改一点点
2. **测试先行** - 重构前确保有测试
3. **保持行为** - 不改变功能逻辑

## 案例：电商订单处理

### 原始代码（问题代码）

```python
def process_order(order_data):
    # 验证
    if not order_data.get('items'):
        return {'error': 'No items'}
    if not order_data.get('customer'):
        return {'error': 'No customer'}
    
    # 计算价格
    total = 0
    for item in order_data['items']:
        if item['type'] == 'normal':
            total += item['price'] * item['quantity']
        elif item['type'] == 'discount':
            total += item['price'] * item['quantity'] * 0.9
        elif item['type'] == 'vip':
            total += item['price'] * item['quantity'] * 0.8
    
    # 应用优惠券
    if order_data.get('coupon'):
        if order_data['coupon'] == 'SAVE10':
            total *= 0.9
        elif order_data['coupon'] == 'SAVE20':
            total *= 0.8
    
    # 创建订单
    order = {
        'id': generate_id(),
        'customer': order_data['customer'],
        'items': order_data['items'],
        'total': total,
        'status': 'pending'
    }
    
    # 保存
    save_to_db(order)
    
    # 发送通知
    send_email(order_data['customer']['email'], order)
    
    return order
```

**问题分析**：
- 函数太长（违反单一职责）
- 嵌套if太多（难以理解）
- 硬编码魔法数字
- 难以测试

### 第一步：提取验证逻辑

```python
def validate_order(order_data):
    if not order_data.get('items'):
        raise ValueError('No items')
    if not order_data.get('customer'):
        raise ValueError('No customer')
    return True

def process_order(order_data):
    validate_order(order_data)
    # ... 其余逻辑
```

### 第二步：提取价格计算

```python
from enum import Enum

class ItemType(Enum):
    NORMAL = 'normal'
    DISCOUNT = 'discount'
    VIP = 'vip'

# 价格策略
PRICE_MULTIPLIERS = {
    ItemType.NORMAL: 1.0,
    ItemType.DISCOUNT: 0.9,
    ItemType.VIP: 0.8,
}

def calculate_item_price(item):
    multiplier = PRICE_MULTIPLIERS.get(ItemType(item['type']), 1.0)
    return item['price'] * item['quantity'] * multiplier

def calculate_total(items):
    return sum(calculate_item_price(item) for item in items)
```

### 第三步：提取优惠券逻辑

```python
# 优惠券策略
COUPON_DISCOUNTS = {
    'SAVE10': 0.9,
    'SAVE20': 0.8,
}

def apply_coupon(total, coupon_code):
    if not coupon_code:
        return total
    discount = COUPON_DISCOUNTS.get(coupon_code, 1.0)
    return total * discount
```

### 第四步：提取订单创建

```python
def create_order(customer, items, total):
    return {
        'id': generate_id(),
        'customer': customer,
        'items': items,
        'total': total,
        'status': 'pending'
    }
```

### 第五步：提取通知逻辑

```python
def notify_customer(order):
    email = order['customer']['email']
    send_email(email, order)
```

### 最终重构结果

```python
class OrderProcessor:
    """订单处理器"""
    
    def __init__(self, 
                 validator=None,
                 price_calculator=None,
                 coupon_applier=None,
                 notifier=None):
        self.validator = validator or OrderValidator()
        self.price_calculator = price_calculator or PriceCalculator()
        self.coupon_applier = coupon_applier or CouponApplier()
        self.notifier = notifier or EmailNotifier()
    
    def process(self, order_data):
        # 验证
        self.validator.validate(order_data)
        
        # 计算价格
        total = self.price_calculator.calculate(order_data['items'])
        
        # 应用优惠券
        total = self.coupon_applier.apply(
            total, 
            order_data.get('coupon')
        )
        
        # 创建订单
        order = Order(
            customer=order_data['customer'],
            items=order_data['items'],
            total=total
        )
        
        # 保存
        order.save()
        
        # 通知
        self.notifier.notify(order)
        
        return order


class OrderValidator:
    def validate(self, order_data):
        if not order_data.get('items'):
            raise ValidationError('No items')
        if not order_data.get('customer'):
            raise ValidationError('No customer')


class PriceCalculator:
    MULTIPLIERS = {
        'normal': 1.0,
        'discount': 0.9,
        'vip': 0.8,
    }
    
    def calculate(self, items):
        return sum(self._item_price(item) for item in items)
    
    def _item_price(self, item):
        multiplier = self.MULTIPLIERS.get(item['type'], 1.0)
        return item['price'] * item['quantity'] * multiplier


class CouponApplier:
    DISCOUNTS = {
        'SAVE10': 0.9,
        'SAVE20': 0.8,
    }
    
    def apply(self, total, coupon_code):
        if not coupon_code:
            return total
        discount = self.DISCOUNTS.get(coupon_code, 1.0)
        return total * discount
```

## 重构带来的好处

1. **可测试** - 每个类可以独立测试
2. **可扩展** - 新增价格策略只需修改MULTIPLIERS
3. **可读性** - 每个类职责单一
4. **可维护** - 修改一处不影响其他

## 常用重构手法

### 提取函数

```python
# Before
def process(data):
    # 验证逻辑
    if not data:
        return None
    if len(data) > 100:
        return None
    # 处理逻辑...

# After
def validate(data):
    if not data:
        raise ValueError("Empty data")
    if len(data) > 100:
        raise ValueError("Data too large")

def process(data):
    validate(data)
    # 处理逻辑...
```

### 以多态替代条件

```python
# Before
def calculate(type, value):
    if type == 'A':
        return value * 1.1
    elif type == 'B':
        return value * 1.2

# After
class Calculator:
    @staticmethod
    def create(type):
        calculators = {
            'A': CalculatorA(),
            'B': CalculatorB(),
        }
        return calculators.get(type, DefaultCalculator())
    
    def calculate(self, value):
        return value

class CalculatorA(Calculator):
    def calculate(self, value):
        return value * 1.1
```

## 总结

重构的核心原则：

1. **小步前进** - 每次只改一点
2. **测试保护** - 重构前先写测试
3. **提取抽象** - 消除重复
4. **单一职责** - 每个函数/类只做一件事

> 💡 **工具推荐**：如果你需要处理大量数据文件，可以试试**DataForge Pro**——一个轻量级数据处理工具，比Excel快100倍。

---

