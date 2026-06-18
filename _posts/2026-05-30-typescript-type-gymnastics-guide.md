---
layout: post
title: "TypeScript类型体操入门：从基础到高级类型推导"
date: 2026-05-30 09:00:00 +0800
categories: [TypeScript, 前端, 类型系统]
tags: [代码产品]
image: /assets/images/typescript-types.jpg
---

## 引言

TypeScript的类型系统是图灵完备的，这意味着你可以用类型来做"计算"。这种技巧被称为"类型体操"。本文从基础开始，带你掌握TypeScript高级类型推导。

## 基础：条件类型

```typescript
// 基本条件类型
type IsString = T extends string ? true : false;

type A = IsString<string>; // true
type B = IsString<number>; // false

// 实用：判断是否为数组
type IsArray = T extends any[] ? true : false;

type C = IsArray<string[]>; // true
type D = IsArray<string>;   // false
```

## 进阶：类型推导 infer

```typescript
// 提取数组元素类型
type ArrayElement = T extends (infer E)[] ? E : never;

type E = ArrayElement<string[]>;  // string
type F = ArrayElement<number[]>;  // number

// 提取函数返回类型
type ReturnType = T extends (...args: any[]) => infer R ? R : never;

type G = ReturnType<() => string>;  // string
type H = ReturnType<(x: number) => boolean>;  // boolean

// 提取Promise值类型
type PromiseValue = T extends Promise<infer V> ? V : T;

type I = PromiseValue<Promise<string>>;  // string
type J = PromiseValue<string>;  // string
```

## 高级：递归类型

```typescript
// 深层Readonly
type DeepReadonly = {
  readonly [K in keyof T]: T[K] extends object 
    ? DeepReadonly<T[K]> 
    : T[K];
};

interface User {
  name: string;
  profile: {
    age: number;
    address: {
      city: string;
    };
  };
}

type ReadonlyUser = DeepReadonly<User>;
// 所有属性都变成readonly

// 深层Required
type DeepRequired = {
  [K in keyof T]-?: T[K] extends object 
    ? DeepRequired<T[K]> 
    : T[K];
};
```

## 实战：类型体操练习

### 1. 元组长度

```typescript
type Length = T extends { length: infer L } ? L : never;

type Len = Length<[1, 2, 3]>;  // 3
type StrLen = Length<'hello'>;  // 5
```

### 2. 元组转联合类型

```typescript
type TupleToUnion = T extends (infer E)[] ? E : never;

type Union = TupleToUnion<['a', 'b', 'c']>;  // 'a' | 'b' | 'c'
```

### 3. 联合类型转元组

```typescript
// 这个比较复杂，需要借助函数类型
type UnionToIntersection = 
  (T extends any ? (x: T) => void : never) extends 
  (x: infer R) => void ? R : never;

type LastOfUnion = 
  UnionToIntersection<T extends any ? () => T : never> extends 
  () => infer R ? R : never;

type Push = [...T, V];

type UnionToTuple = 
  T extends never ? [] : 
  Push<UnionToTuple<Exclude<T, LastOfUnion>>, LastOfUnion>;

type Tuple = UnionToTuple<'a' | 'b' | 'c'>;  // ['a', 'b', 'c']
```

### 4. 对象路径类型

```typescript
type Path = 
  K extends keyof T 
    ? T[K] extends object 
      ? K | `${K}.${Path<T[K]>}` 
      : K 
    : never;

interface Config {
  server: {
    host: string;
    port: number;
  };
  database: {
    url: string;
    credentials: {
      user: string;
      password: string;
    };
  };
}

type ConfigPath = Path<Config>;
// 'server' | 'database' | 'server.host' | 'server.port' | 
// 'database.url' | 'database.credentials' | 
// 'database.credentials.user' | 'database.credentials.password'
```

### 5. 类型安全的Object.keys

```typescript
type ObjectKeys = keyof T;

function safeKeys<T extends object>(obj: T): ObjectKeys[] {
  return Object.keys(obj) as ObjectKeys[];
}

const user = { name: 'Alice', age: 30 };
const keys = safeKeys(user);  // ('name' | 'age')[]
```

## 实用工具类型

```typescript
// 1. 可选属性变必选
type RequiredKeys = {
  [K in keyof T]-?: T[K];
};

// 2. 选取特定类型的属性
type PickByType = {
  [K in keyof T as T[K] extends U ? K : never]: T[K];
};

interface Mixed {
  name: string;
  age: number;
  active: boolean;
  count: number;
}

type NumberProps = PickByType<Mixed, number>;
// { age: number; count: number }

// 3. 排除特定类型的属性
type OmitByType = {
  [K in keyof T as T[K] extends U ? never : K]: T[K];
};

// 4. 函数参数类型
type Parameters = T extends (...args: infer P) => any ? P : never;

type Params = Parameters<(a: string, b: number) => void>;
// [string, number]

// 5. 可变元组操作
type Shift = T extends [infer _, ...infer R] ? R : [];

type First = T extends [infer F, ...any[]] ? F : never;

type Push = [...T, V];

type Pop = T extends [...infer R, infer _] ? R : [];

type Arr = [1, 2, 3];
type Shifted = Shift<Arr>;  // [2, 3]
type FirstEl = First<Arr>;  // 1
type Pushed = Push<Arr, 4>;  // [1, 2, 3, 4]
type Popped = Pop<Arr>;  // [1, 2]
```

## 类型体操实战：表单验证

```typescript
// 定义验证规则类型
type Validator<T> = (value: T) => boolean;

type Validators<T> = {
  [K in keyof T]?: Validator<T[K]>;
};

// 定义错误类型
type Errors<T> = {
  [K in keyof T]?: string;
};

// 类型安全的表单验证器
function createValidator<T extends object>(
  validators: Validators<T>
) {
  return (data: T): Errors<T> => {
    const errors: Errors<T> = {};
    
    for (const key in validators) {
      const validator = validators[key];
      if (validator && !validator(data[key])) {
        errors[key] = `Invalid ${String(key)}`;
      }
    }
    
    return errors;
  };
}

// 使用
interface LoginForm {
  email: string;
  password: string;
}

const validateLogin = createValidator<LoginForm>({
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  password: (v) => v.length >= 8,
});

const errors = validateLogin({
  email: 'invalid',
  password: '123',
});
// { email: 'Invalid email', password: 'Invalid password' }
```

## 性能注意事项

复杂的类型推导会增加编译时间：

```typescript
// 避免：过深的递归
type DeepFlatten = T extends any[] 
  ? DeepFlatten<T[number]> 
  : T;  // 可能导致编译器崩溃

// 推荐：限制递归深度
type DeepFlattenSafe<
  T, 
  Depth extends any[] = []
> = Depth['length'] extends 10 
  ? T 
  : T extends any[] 
    ? DeepFlattenSafe<T[number], [...Depth, 0]> 
    : T;
```

## 总结

TypeScript类型体操的核心技巧：

1. **条件类型** - extends ? : 三元表达式
2. **infer** - 类型推导关键字
3. **递归类型** - 处理嵌套结构
4. **模板字面量类型** - 字符串操作
5. **映射类型修饰符** - readonly、?、-?

> 💡 **工具推荐**：如果你在开发中需要处理大量数据文件，可以试试**DataForge Pro**——一个轻量级数据处理工具，比Excel快100倍，支持百万行数据的实时搜索和转换。

---

