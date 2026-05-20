---
layout: post
title: "TypeScript设计模式精讲：用现代TS写出优雅可维护的代码"
date: 2026-05-20
categories: [技术教程, TypeScript, 设计模式]
tags: [TypeScript, 设计模式, 前端, 软件工程, 代码质量]
image: /assets/images/typescript-design-patterns.jpg
---

![TypeScript设计模式](/assets/images/typescript-design-patterns.jpg)

## 引言

设计模式是软件工程中的"最佳实践模板"。很多开发者觉得设计模式是后端Java/C#的专利，其实在前端TypeScript项目中，合理运用设计模式同样能让代码更优雅、更可维护、更易扩展。

本文精选8个最实用的设计模式，全部用TypeScript现代语法实现，并结合真实前端场景讲解。

## 1. 观察者模式（Observer Pattern）

**场景**：状态管理、事件系统、响应式数据

```typescript
// 类型安全的事件系统
type EventMap = {
  'user:login': { userId: string; timestamp: number };
  'user:logout': { userId: string };
  'cart:update': { items: CartItem[]; total: number };
  'notification:show': { message: string; type: 'success' | 'error' | 'warning' };
};

class TypedEventEmitter<Events extends Record<string, any>> {
  private listeners = new Map<keyof Events, Set<Function>>();

  on<K extends keyof Events>(event: K, callback: (data: Events[K]) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // 返回取消订阅函数
    return () => this.off(event, callback);
  }

  off<K extends keyof Events>(event: K, callback: (data: Events[K]) => void): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }
}

// 使用
const emitter = new TypedEventEmitter<EventMap>();

const unsub = emitter.on('user:login', ({ userId, timestamp }) => {
  console.log(`User ${userId} logged in at ${timestamp}`);
});

emitter.emit('user:login', { userId: '123', timestamp: Date.now() });
unsub(); // 取消订阅
```

## 2. 策略模式（Strategy Pattern）

**场景**：表单验证、排序算法、支付方式切换

```typescript
// 表单验证策略
interface ValidationStrategy {
  validate(value: string): string | null; // 返回null表示验证通过
}

class RequiredValidation implements ValidationStrategy {
  validate(value: string): string | null {
    return value.trim() ? null : '此字段为必填项';
  }
}

class EmailValidation implements ValidationStrategy {
  private regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  validate(value: string): string | null {
    return this.regex.test(value) ? null : '请输入有效的邮箱地址';
  }
}

class MinLengthValidation implements ValidationStrategy {
  constructor(private minLength: number) {}
  validate(value: string): string | null {
    return value.length >= this.minLength 
      ? null 
      : `最少需要${this.minLength}个字符`;
  }
}

// 验证器
class FormValidator {
  private strategies = new Map<string, ValidationStrategy[]>();

  addField(field: string, ...strategies: ValidationStrategy[]): this {
    this.strategies.set(field, strategies);
    return this;
  }

  validate(formData: Record<string, string>): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    for (const [field, validators] of this.strategies) {
      const fieldErrors = validators
        .map(v => v.validate(formData[field] ?? ''))
        .filter((e): e is string => e !== null);
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    return errors;
  }
}

// 使用
const validator = new FormValidator()
  .addField('email', new RequiredValidation(), new EmailValidation())
  .addField('password', new RequiredValidation(), new MinLengthValidation(8))
  .addField('name', new RequiredValidation(), new MinLengthValidation(2));

const errors = validator.validate({
  email: 'invalid',
  password: '123',
  name: ''
});
// { email: ['请输入有效的邮箱地址'], password: ['最少需要8个字符'], name: ['此字段为必填项', '最少需要2个字符'] }
```

## 3. 工厂模式（Factory Pattern）

**场景**：组件创建、API客户端、图表实例化

```typescript
// 图表工厂
type ChartType = 'bar' | 'line' | 'pie' | 'scatter';

interface ChartConfig {
  type: ChartType;
  data: number[];
  options?: Record<string, any>;
}

interface Chart {
  render(container: HTMLElement): void;
  update(data: number[]): void;
  destroy(): void;
}

class BarChart implements Chart {
  constructor(private config: ChartConfig) {}
  render(container: HTMLElement) { /* 渲染柱状图 */ }
  update(data: number[]) { /* 更新数据 */ }
  destroy() { /* 清理资源 */ }
}

class LineChart implements Chart { /* ... */ }
class PieChart implements Chart { /* ... */ }
class ScatterChart implements Chart { /* ... */ }

// 工厂注册器
class ChartFactory {
  private static registry = new Map<ChartType, new (config: ChartConfig) => Chart>();

  static register(type: ChartType, creator: new (config: ChartConfig) => Chart): void {
    this.registry.set(type, creator);
  }

  static create(config: ChartConfig): Chart {
    const Creator = this.registry.get(config.type);
    if (!Creator) throw new Error(`Unknown chart type: ${config.type}`);
    return new Creator(config);
  }
}

// 注册图表类型
ChartFactory.register('bar', BarChart);
ChartFactory.register('line', LineChart);
ChartFactory.register('pie', PieChart);
ChartFactory.register('scatter', ScatterChart);

// 使用
const chart = ChartFactory.create({
  type: 'bar',
  data: [10, 20, 30, 40, 50]
});
chart.render(document.getElementById('chart-container')!);
```

## 4. 装饰器模式（Decorator Pattern）

**场景**：日志、缓存、权限检查、性能监控

```typescript
// 方法装饰器：自动缓存
function Memoize(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const cache = new Map<string, any>();

  descriptor.value = function (...args: any[]) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = originalMethod.apply(this, args);
    cache.set(key, result);
    return result;
  };

  return descriptor;
}

// 方法装饰器：性能监控
function LogPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    const elapsed = performance.now() - start;
    console.log(`[${propertyKey}] 执行耗时: ${elapsed.toFixed(2)}ms`);
    return result;
  };

  return descriptor;
}

// 使用
class DataProcessor {
  @Memoize
  @LogPerformance
  fibonacci(n: number): number {
    if (n <= 1) return n;
    return this.fibonacci(n - 1) + this.fibonacci(n - 2);
  }
}

const processor = new DataProcessor();
processor.fibonacci(40); // 第一次计算，输出耗时
processor.fibonacci(40); // 从缓存读取，瞬间返回
```

## 5. 适配器模式（Adapter Pattern）

**场景**：第三方库集成、API版本迁移

```typescript
// 适配不同支付网关
interface PaymentGateway {
  charge(amount: number, currency: string): Promise<{ transactionId: string; status: string }>;
  refund(transactionId: string): Promise<{ status: string }>;
}

// Stripe适配器
class StripeAdapter implements PaymentGateway {
  constructor(private stripe: any) {}

  async charge(amount: number, currency: string) {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe用分
      currency: currency.toLowerCase(),
    });
    return {
      transactionId: paymentIntent.id,
      status: paymentIntent.status
    };
  }

  async refund(transactionId: string) {
    const refund = await this.stripe.refunds.create({ payment_intent: transactionId });
    return { status: refund.status };
  }
}

// PayPal适配器
class PayPalAdapter implements PaymentGateway {
  constructor(private paypal: any) {}

  async charge(amount: number, currency: string) {
    const order = await this.paypal.orders.create({
      intent: 'CAPTURE',
      purchase_units: [{ amount: { currency_code: currency.toUpperCase(), value: amount.toString() } }]
    });
    return {
      transactionId: order.id,
      status: order.status
    };
  }

  async refund(transactionId: string) {
    const refund = await this.paypal.orders.capture(transactionId);
    return { status: refund.status };
  }
}

// 统一使用
class PaymentService {
  constructor(private gateway: PaymentGateway) {}

  async processPayment(amount: number, currency: string) {
    return this.gateway.charge(amount, currency);
  }
}

// 切换支付网关只需更换适配器
const paymentService = new PaymentService(new StripeAdapter(stripeClient));
```

## 6. 单例模式（Singleton Pattern）

**场景**：全局状态、配置管理、数据库连接

```typescript
// TypeScript单例最佳实践
class AppConfig {
  private static instance: AppConfig;
  private config: Map<string, any> = new Map();

  private constructor() {
    // 私有构造函数，防止外部实例化
    this.loadDefaults();
  }

  static getInstance(): AppConfig {
    if (!AppConfig.instance) {
      AppConfig.instance = new AppConfig();
    }
    return AppConfig.instance;
  }

  private loadDefaults(): void {
    this.config.set('api.baseUrl', 'https://api.example.com');
    this.config.set('theme', 'light');
    this.config.set('language', 'zh-CN');
  }

  get<T>(key: string): T | undefined {
    return this.config.get(key);
  }

  set(key: string, value: any): void {
    this.config.set(key, value);
  }
}

// 使用
const config = AppConfig.getInstance();
const baseUrl = config.get<string>('api.baseUrl');
```

## 7. 责任链模式（Chain of Responsibility）

**场景**：中间件、审批流程、请求处理

```typescript
// HTTP请求中间件链
interface Middleware {
  setNext(middleware: Middleware): Middleware;
  handle(request: Request): Response | null;
}

abstract class AbstractMiddleware implements Middleware {
  private nextMiddleware: Middleware | null = null;

  setNext(middleware: Middleware): Middleware {
    this.nextMiddleware = middleware;
    return middleware;
  }

  handle(request: Request): Response | null {
    if (this.nextMiddleware) {
      return this.nextMiddleware.handle(request);
    }
    return null;
  }
}

class AuthMiddleware extends AbstractMiddleware {
  handle(request: Request): Response | null {
    if (!request.headers.get('Authorization')) {
      return new Response(JSON.stringify({ error: '未授权' }), { status: 401 });
    }
    return super.handle(request);
  }
}

class RateLimitMiddleware extends AbstractMiddleware {
  private requestCount = new Map<string, number[]>();

  handle(request: Request): Response | null {
    const ip = request.headers.get('X-Forwarded-For') || 'unknown';
    const now = Date.now();
    const window = this.requestCount.get(ip)?.filter(t => now - t < 60000) || [];

    if (window.length >= 100) {
      return new Response(JSON.stringify({ error: '请求过于频繁' }), { status: 429 });
    }

    window.push(now);
    this.requestCount.set(ip, window);
    return super.handle(request);
  }
}

class LoggingMiddleware extends AbstractMiddleware {
  handle(request: Request): Response | null {
    console.log(`[${new Date().toISOString()}] ${request.method} ${request.url}`);
    return super.handle(request);
  }
}

// 构建中间件链
const auth = new AuthMiddleware();
const rateLimit = new RateLimitMiddleware();
const logging = new LoggingMiddleware();

logging.setNext(rateLimit).setNext(auth);

// 使用
logging.handle(request);
```

## 8. 代理模式（Proxy Pattern）

**场景**：懒加载、访问控制、缓存代理

```typescript
// 图片懒加载代理
interface ImageLoader {
  display(): void;
}

class RealImage implements ImageLoader {
  constructor(private url: string) {
    console.log(`加载图片: ${url}`);
    // 模拟图片加载
  }

  display(): void {
    console.log(`显示图片: ${this.url}`);
  }
}

class LazyImageProxy implements ImageLoader {
  private realImage: RealImage | null = null;

  constructor(private url: string) {}

  display(): void {
    if (!this.realImage) {
      this.realImage = new RealImage(this.url);
    }
    this.realImage.display();
  }
}

// 使用 - 图片只在第一次display时才真正加载
const img = new LazyImageProxy('https://example.com/large-image.jpg');
// 此时还没有加载图片
img.display(); // 此时才加载并显示
img.display(); // 直接显示，不再加载
```

## 何时使用设计模式？

| 模式 | 适用场景 | 不适用场景 |
|------|----------|-----------|
| 观察者 | 一对多依赖关系 | 简单的一次性回调 |
| 策略 | 多种算法可互换 | 只有一种固定算法 |
| 工厂 | 复杂对象创建 | 简单对象直接new |
| 装饰器 | 动态添加功能 | 静态固定的功能 |
| 适配器 | 接口不兼容 | 接口已经兼容 |
| 单例 | 全局唯一状态 | 需要多个实例 |
| 责任链 | 多步骤处理 | 单步直接处理 |
| 代理 | 控制访问/延迟加载 | 直接访问即可 |

## 结语

设计模式不是银弹，但它们是解决常见设计问题的成熟方案。在TypeScript中，得益于类型系统，设计模式的实现更加安全和优雅。关键是理解每个模式背后的思想，而不是死记硬背模板代码。

> 💡 **关注我的博客**，获取更多TypeScript高级技巧和前端架构设计文章！
