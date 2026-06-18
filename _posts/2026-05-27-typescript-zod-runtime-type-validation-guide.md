---
layout: post
title: "TypeScript + Zod：构建类型安全的API，从验证到生成的完整方案"
date: 2026-05-27
categories: [TypeScript, Web开发, 教程]
tags: [代码产品]
image: /assets/images/typescript-zod-validation.jpg
---

## TypeScript的类型安全陷阱

TypeScript让JavaScript开发体验有了质的飞跃，但很多开发者忽略了一个关键事实：**TypeScript的类型检查只在编译时生效，运行时完全不存在。**

![TypeScript + Zod 类型安全方案](/assets/images/typescript-zod-validation.jpg)

这意味着，当数据从外部来源（API请求、数据库查询、用户输入）进入你的应用时，TypeScript无法保证这些数据的实际结构与类型定义一致。一个看似类型安全的接口，在运行时可能因为收到格式错误的数据而崩溃。

```typescript
// 这个接口在编译时看起来很安全
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
}

// 但运行时，外部数据可能是这样的：
const response = await fetch("/api/users/1");
const user: User = await response.json(); // 危险！没有任何运行时验证

// user.age 可能是字符串 "25"，可能是 null，甚至不存在
// TypeScript 不会告诉你这些，直到代码在运行时崩溃
```

这就是Zod存在的意义——它在运行时提供与TypeScript类型系统一致的验证能力，并且能从schema自动推导出TypeScript类型，实现"一次定义，处处安全"。

## Zod基础：Schema定义

### 安装与快速上手

```bash
npm install zod
```

Zod的核心概念是Schema。Schema既是运行时的验证器，也是TypeScript类型的来源：

```typescript
import { z } from "zod";

// 定义一个用户Schema
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "姓名至少2个字符").max(50, "姓名最多50个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  age: z.number().int().min(0).max(150),
  role: z.enum(["admin", "editor", "viewer"]),
  isActive: z.boolean().default(true),
  createdAt: z.string().datetime(),
});

// 自动推导TypeScript类型 —— 与手动定义的interface完全等价
type User = z.infer<typeof UserSchema>;
// 等价于：
// type User = {
//   id: string;
//   name: string;
//   email: string;
//   age: number;
//   role: "admin" | "editor" | "viewer";
//   isActive: boolean;
//   createdAt: string;
// }
```

### 常用验证器一览

```typescript
// 字符串验证
z.string()                    // 基础字符串
z.string().min(5)             // 最小长度
z.string().max(100)           // 最大长度
z.string().email()            // 邮箱格式
z.string().url()              // URL格式
z.string().uuid()             // UUID格式
z.string().regex(/^[a-z]+$/)  // 正则匹配
z.string().trim()             // 自动去除首尾空格
z.string().nonempty()         // 非空字符串

// 数字验证
z.number()                    // 基础数字
z.number().int()              // 整数
z.number().positive()         // 正数
z.number().min(0).max(100)    // 范围约束
z.number().multipleOf(0.01)   // 步长约束（适合金额）

// 其他类型
z.boolean()                   // 布尔值
z.date()                      // 日期对象
z.bigint()                    // BigInt
z.null()                      // 仅null
z.undefined()                 // 仅undefined
z.nullable(z.string())        // string | null
z.optional(z.string())        // string | undefined

// 高级类型
z.array(z.string())           // 字符串数组
z.tuple([z.string(), z.number()])  // 元组
z.record(z.string(), z.number())  // Record<string, number>
z.map(z.string(), z.number())     // Map<string, number>
z.set(z.string())             // Set<string>

// 联合类型与判别联合
z.union([z.string(), z.number()])    // string | number
z.literal("admin")                   // 字面量类型
z.discriminatedUnion("type", [       // 判别联合
  z.object({ type: z.literal("text"), content: z.string() }),
  z.object({ type: z.literal("image"), url: z.string().url() }),
]);
```

## 验证API请求与响应

### Express集成

将Zod集成到Express中间件中，实现请求参数的自动验证：

```typescript
// src/middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as any;
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: "请求参数验证失败",
          details: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }
      next(error);
    }
  };
}
```

### 实际API示例

```typescript
// src/schemas/user.schema.ts
import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "密码至少8位")
    .regex(/[A-Z]/, "密码必须包含大写字母")
    .regex(/[0-9]/, "密码必须包含数字")
    .regex(/[^A-Za-z0-9]/, "密码必须包含特殊字符"),
  role: z.enum(["admin", "editor", "viewer"]).default("viewer"),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({
  password: true,
});

export const QueryUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(["admin", "editor", "viewer"]).optional(),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const UserIdParamsSchema = z.object({
  id: z.string().uuid(),
});

// 推导类型
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type QueryUsersInput = z.infer<typeof QueryUsersSchema>;
```

```typescript
// src/routes/user.routes.ts
import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  CreateUserSchema,
  UpdateUserSchema,
  QueryUsersSchema,
  UserIdParamsSchema,
} from "../schemas/user.schema";

const router = Router();

// POST /api/users - 创建用户
router.post(
  "/",
  validate({ body: CreateUserSchema }),
  async (req, res) => {
    // req.body 已经通过验证，类型安全
    const userInput: CreateUserInput = req.body;
    const user = await userService.create(userInput);
    res.status(201).json({ success: true, data: user });
  }
);

// GET /api/users - 查询用户列表
router.get(
  "/",
  validate({ query: QueryUsersSchema }),
  async (req, res) => {
    const query: QueryUsersInput = req.query as any;
    const result = await userService.findAll(query);
    res.json({ success: true, data: result });
  }
);

// PATCH /api/users/:id - 更新用户
router.patch(
  "/:id",
  validate({ params: UserIdParamsSchema, body: UpdateUserSchema }),
  async (req, res) => {
    const { id } = req.params as any;
    const updateData: UpdateUserInput = req.body;
    const user = await userService.update(id, updateData);
    res.json({ success: true, data: user });
  }
);

export default router;
```

### Fastify集成

Fastify原生支持JSON Schema，Zod提供了专门的集成方案：

```typescript
// src/app.ts
import Fastify from "fastify";
import { z } from "zod";

const app = Fastify();

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

// 使用fastify-type-provider-zod实现类型安全的路由
import type { ZodTypeProvider } from "fastify-type-provider-zod";

app.withTypeProvider<ZodTypeProvider>().post(
  "/users",
  {
    schema: {
      body: CreateUserSchema,
      response: {
        201: z.object({
          success: z.literal(true),
          data: z.object({
            id: z.string().uuid(),
            name: z.string(),
            email: z.string().email(),
          }),
        }),
      },
    },
  },
  async (request, reply) => {
    // request.body 类型自动推导为 { name: string; email: string }
    // reply 类型自动推导为 201 响应
    const { name, email } = request.body;
    const user = await createUser({ name, email });
    return reply.status(201).send({
      success: true,
      data: user,
    });
  }
);
```

## 高级特性：Refinements与Transforms

### 自定义验证规则（Refinement）

```typescript
// 密码确认匹配
const PasswordFormSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"], // 错误指向confirmPassword字段
  });

// 日期范围验证
const EventSchema = z
  .object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  })
  .refine((data) => new Date(data.startDate) < new Date(data.endDate), {
    message: "结束日期必须晚于开始日期",
    path: ["endDate"],
  });

// 多条件refinement
const RegistrationSchema = z
  .object({
    email: z.string().email(),
    age: z.number().int().min(13),
    parentConsent: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // 未满18岁需要家长同意
      if (data.age < 18) return data.parentConsent === true;
      return true;
    },
    {
      message: "未满18岁需要家长同意书",
      path: ["parentConsent"],
    }
  );

// 使用superRefine进行更复杂的多字段交叉验证
const OrderSchema = z
  .object({
    items: z.array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
        price: z.number().positive(),
      })
    ),
    couponCode: z.string().optional(),
    totalAmount: z.number().positive(),
  })
  .superRefine((data, ctx) => {
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0
    );

    // 验证总金额是否正确
    if (Math.abs(data.totalAmount - subtotal) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `总金额计算错误，应为 ${subtotal}`,
        path: ["totalAmount"],
      });
    }

    // 有优惠券时验证最低消费
    if (data.couponCode && subtotal < 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "使用优惠券需满100元",
        path: ["couponCode"],
      });
    }
  });
```

### 数据转换（Transform）

```typescript
// 字符串自动转数字
const NumericStringSchema = z.string().transform((val) => Number(val));
const result = NumericStringSchema.parse("42"); // => 42 (number类型)

// 日期字符串转Date对象
const DateSchema = z.string().datetime().transform((val) => new Date(val));

// 数据清洗管道
const CleanUserSchema = z.object({
  name: z.string().trim().toLowerCase(),
  email: z.string().email().trim().toLowerCase(),
  phone: z.string().transform((val) => val.replace(/\D/g, "")),
  age: z.coerce.number().int().min(0), // z.coerce 自动类型转换
});

// 条件转换
const FlexibleDateSchema = z.union([
  z.string().datetime().transform((val) => new Date(val)),
  z.number().transform((val) => new Date(val * 1000)), // Unix时间戳
  z.date(),
]);

// pipe：链式验证与转换
const PositiveIntSchema = z
  .string()
  .trim()
  .pipe(z.coerce.number().int().positive());
// "  42  " => 42
// " -5 " => 验证失败
```

## 从Zod Schema生成TypeScript类型

Zod最大的优势之一是类型与验证的统一。通过 `z.infer`，你可以从schema自动生成TypeScript类型：

```typescript
// schemas/api.schema.ts
import { z } from "zod";

// ===== 请求Schema =====
export const CreateArticleSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(100),
  tags: z.array(z.string()).max(10),
  category: z.enum(["tech", "design", "business"]),
  isDraft: z.boolean().default(false),
});

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ===== 响应Schema =====
export const ArticleSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  category: z.string(),
  isDraft: z.boolean(),
  authorId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const PaginatedResponseSchema = z.object({
  data: z.array(ArticleSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// ===== 自动生成类型 =====
// 从请求Schema生成输入类型
export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;

// 从响应Schema生成输出类型
export type Article = z.infer<typeof ArticleSchema>;
export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// 使用示例
async function createArticle(input: CreateArticleInput): Promise<Article> {
  // input 和返回值都有完整的类型提示
  // 不需要手动维护interface，schema是唯一的数据源
}
```

## 错误处理模式

### 统一错误格式化

```typescript
// src/utils/zod-error.ts
import { ZodError } from "zod";

interface FormattedError {
  field: string;
  message: string;
  code: string;
}

export function formatZodError(error: ZodError): FormattedError[] {
  return error.errors.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

export function createValidationError(error: ZodError) {
  return {
    success: false,
    error: "VALIDATION_ERROR",
    message: "请求数据验证失败",
    details: formatZodError(error),
  };
}

// 自定义错误映射
const ERROR_MESSAGES: Record<string, string> = {
  ZodString_email: "请输入有效的邮箱地址",
  ZodString_url: "请输入有效的URL",
  ZodString_uuid: "请输入有效的UUID",
  ZodString_min: "内容过短",
  ZodString_max: "内容过长",
  ZodNumber_min: "数值过小",
  ZodNumber_max: "数值过大",
  ZodEnum_invalidEnumValue: "请选择有效的选项",
};

export function getFriendlyMessage(error: ZodError): string {
  const firstError = error.errors[0];
  const key = `${firstError.code}`;
  return ERROR_MESSAGES[key] || firstError.message || "数据验证失败";
}
```

### 前端表单验证集成

```typescript
// src/hooks/useFormValidation.ts
import { useState, useCallback } from "react";
import { ZodSchema, ZodError } from "zod";

interface UseFormValidationOptions<T> {
  schema: ZodSchema<T>;
  onSubmit: (values: T) => Promise<void>;
  initialValues?: Partial<T>;
}

interface FormState<T> {
  values: Partial<T>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isValid: boolean;
}

export function useFormValidation<T>({
  schema,
  onSubmit,
  initialValues = {},
}: UseFormValidationOptions<T>) {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    isSubmitting: false,
    isValid: false,
  });

  const validateField = useCallback(
    (name: string, value: unknown) => {
      try {
        // 验证单个字段
        const fieldSchema = (schema as any).shape[name];
        if (fieldSchema) {
          fieldSchema.parse(value);
          setState((prev) => {
            const newErrors = { ...prev.errors };
            delete newErrors[name];
            return { ...prev, errors: newErrors };
          });
        }
      } catch (error) {
        if (error instanceof ZodError) {
          setState((prev) => ({
            ...prev,
            errors: {
              ...prev.errors,
              [name]: error.errors[0].message,
            },
          }));
        }
      }
    },
    [schema]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setState((prev) => ({ ...prev, isSubmitting: true }));

      try {
        const validated = schema.parse(state.values);
        await onSubmit(validated);
      } catch (error) {
        if (error instanceof ZodError) {
          const fieldErrors: Record<string, string> = {};
          error.errors.forEach((err) => {
            const field = err.path.join(".");
            fieldErrors[field] = err.message;
          });
          setState((prev) => ({
            ...prev,
            errors: fieldErrors,
          }));
        }
      } finally {
        setState((prev) => ({ ...prev, isSubmitting: false }));
      }
    },
    [schema, onSubmit, state.values]
  );

  return {
    ...state,
    setFieldValue: (name: string, value: unknown) => {
      setState((prev) => ({
        ...prev,
        values: { ...prev.values, [name]: value },
      }));
      validateField(name, value);
    },
    handleSubmit,
  };
}
```

## 测试策略

为Zod Schema编写单元测试，确保验证逻辑的正确性：

```typescript
// src/schemas/__tests__/user.schema.test.ts
import { describe, it, expect } from "vitest";
import { CreateUserSchema, UpdateUserSchema } from "../user.schema";

describe("CreateUserSchema", () => {
  it("应该通过有效的用户数据", () => {
    const validData = {
      name: "张三",
      email: "zhangsan@example.com",
      password: "SecurePass123!",
      role: "viewer" as const,
    };

    const result = CreateUserSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("应该拒绝过短的姓名", () => {
    const result = CreateUserSchema.safeParse({
      name: "A",
      email: "test@example.com",
      password: "SecurePass123!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toContain("name");
    }
  });

  it("应该拒绝无效的邮箱格式", () => {
    const result = CreateUserSchema.safeParse({
      name: "张三",
      email: "not-an-email",
      password: "SecurePass123!",
    });

    expect(result.success).toBe(false);
  });

  it("应该拒绝不满足复杂度要求的密码", () => {
    const weakPasswords = ["short", "nodigits!", "NOLOWERCASE1!", "noupper1!"];

    for (const password of weakPasswords) {
      const result = CreateUserSchema.safeParse({
        name: "张三",
        email: "test@example.com",
        password,
      });

      expect(result.success).toBe(false);
    }
  });

  it("应该为role设置默认值", () => {
    const result = CreateUserSchema.parse({
      name: "张三",
      email: "test@example.com",
      password: "SecurePass123!",
    });

    expect(result.role).toBe("viewer");
  });
});

describe("UpdateUserSchema", () => {
  it("应该允许部分更新", () => {
    const result = UpdateUserSchema.safeParse({
      name: "新名字",
    });

    expect(result.success).toBe(true);
  });

  it("应该拒绝更新密码字段", () => {
    const result = UpdateUserSchema.safeParse({
      password: "newpassword123!",
    });

    expect(result.success).toBe(false);
  });
});
```

## 实战中的最佳实践

### 1. Schema组织结构

```
src/
├── schemas/
│   ├── index.ts           # 统一导出
│   ├── common/            # 通用Schema
│   │   ├── pagination.ts
│   │   └── id.ts
│   ├── user/
│   │   ├── user.schema.ts
│   │   └── user.types.ts  # 从schema推导的类型
│   └── article/
│       ├── article.schema.ts
│       └── article.types.ts
```

### 2. Schema复用与组合

```typescript
// schemas/common.ts
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const TimestampSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// schemas/user.ts
import { PaginationSchema, TimestampSchema } from "./common";

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
}).merge(TimestampSchema);

export const ListUsersQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  role: z.enum(["admin", "editor", "viewer"]).optional(),
});
```

### 3. API响应Schema

```typescript
// schemas/response.ts
import { z } from "zod";

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    timestamp: z.string().datetime(),
  });

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({
      field: z.string(),
      message: z.string(),
    })).optional(),
  }),
  timestamp: z.string().datetime(),
});

// 使用示例
const UserResponseSchema = ApiResponseSchema(UserSchema);
type UserResponse = z.infer<typeof UserResponseSchema>;
```

## 总结

TypeScript + Zod的组合为API开发提供了端到端的类型安全保障。核心要点：

1. **TypeScript类型只在编译时生效**，运行时需要Zod提供实际验证
2. **Schema是唯一数据源**，通过 `z.infer` 自动推导类型，避免重复定义
3. **中间件模式**可以优雅地将验证集成到Express/Fastify路由中
4. **Refinement和Transform**支持复杂的业务验证规则和数据转换
5. **统一的错误处理**让API返回规范的验证错误信息
6. **前端共享Schema**实现前后端验证逻辑的一致性
7. **完善的测试**确保Schema验证逻辑的正确性

在真实项目中，建议将Zod Schema作为前后端共享的契约，配合monorepo或npm包的方式分发，从而在数据流经的每个环节都保持类型安全。这种"Schema as Source of Truth"的理念，是构建健壮API系统的最佳实践。
