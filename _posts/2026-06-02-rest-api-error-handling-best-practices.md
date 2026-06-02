---
layout: post
title: "REST API错误处理最佳实践：从状态码到错误响应设计"
date: 2026-06-02 08:00:00 +0800
categories: [API设计, 后端开发]
tags: [api, rest, best-practices]
image: /assets/images/rest-api-error-handling.jpg
author: 大D
---

你有没有遇到过这样的API：返回200状态码，但body里藏着错误信息？或者500错误只返回一行"Internal Server Error"，完全不知道哪里出了问题？好的错误处理不是锦上添花，而是API设计的基础设施。这篇文章我会从状态码选择、错误响应格式、到具体实现，完整地讲清楚REST API错误处理的最佳实践。

## 一、HTTP状态码的正确使用

状态码是API错误处理的第一层信息。很多开发者要么全部返回200，要么全部返回500，这两种极端都不对。

### 2xx 成功系列

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 OK | 请求成功 | GET请求返回数据 |
| 201 Created | 资源创建成功 | POST请求创建新资源 |
| 204 No Content | 成功但无返回内容 | DELETE请求成功删除 |

### 4xx 客户端错误

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 400 Bad Request | 请求参数错误 | 缺少必填字段、格式不对 |
| 401 Unauthorized | 未认证 | 缺少Token或Token过期 |
| 403 Forbidden | 无权限 | 已认证但无权访问该资源 |
| 404 Not Found | 资源不存在 | 请求的资源ID无效 |
| 409 Conflict | 资源冲突 | 重复创建、版本冲突 |
| 422 Unprocessable Entity | 语义错误 | 参数格式正确但语义不对 |
| 429 Too Many Requests | 请求过于频繁 | 触发限流 |

### 5xx 服务端错误

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 500 Internal Server Error | 服务器内部错误 | 未预期的异常 |
| 502 Bad Gateway | 网关错误 | 上游服务不可用 |
| 503 Service Unavailable | 服务不可用 | 维护中或过载 |

**核心原则**：4xx是客户端的错，5xx是服务端的错。不要用4xx掩盖服务端bug，也不要用5xx表示客户端参数错误。

## 二、统一的错误响应格式

选对状态码只是第一步，错误响应的body同样重要。推荐使用以下格式：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确",
        "rejected_value": "not-an-email"
      },
      {
        "field": "age",
        "message": "年龄必须在18-120之间",
        "rejected_value": 15
      }
    ],
    "request_id": "req_abc123def456",
    "doc_url": "https://docs.example.com/errors/VALIDATION_ERROR"
  }
}
```

这个格式包含了：

- **code**：机器可读的错误码，方便客户端程序化处理
- **message**：人类可读的错误描述
- **details**：详细的错误信息列表（验证错误特别需要）
- **request_id**：请求追踪ID，方便排查问题
- **doc_url**：错误文档链接，帮助开发者自助解决

## 三、Python实现方案

以FastAPI为例，展示如何实现完整的错误处理体系：

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
import uuid
import time

app = FastAPI()

# 自定义异常类
class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400,
                 details: Optional[list] = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or []


class NotFoundError(AppError):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            code="NOT_FOUND",
            message=f"{resource}不存在",
            status_code=404,
            details=[{"field": "id", "message": f"未找到ID为{resource_id}的{resource}"}]
        )


class ConflictError(AppError):
    def __init__(self, message: str):
        super().__init__(
            code="CONFLICT",
            message=message,
            status_code=409
        )


class RateLimitError(AppError):
    def __init__(self, retry_after: int = 60):
        super().__init__(
            code="RATE_LIMIT_EXCEEDED",
            message=f"请求过于频繁，请在{retry_after}秒后重试",
            status_code=429
        )
        self.retry_after = retry_after


# 全局异常处理器
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:12])
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details,
                "request_id": request_id,
                "doc_url": f"https://docs.example.com/errors/{exc.code}"
            }
        },
        headers={"X-Request-ID": request_id}
    )


@app.exception_handler(Exception)
async def general_error_handler(request: Request, exc: Exception):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:12])
    # 生产环境不要暴露异常详情
    import logging
    logging.error(f"[{request_id}] 未处理异常: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "服务器内部错误，请稍后重试",
                "details": [],
                "request_id": request_id
            }
        },
        headers={"X-Request-ID": request_id}
    )


# 请求ID中间件
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:12])
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# 数据模型
class CreateUserRequest(BaseModel):
    email: EmailStr
    username: str
    age: int

    @validator("username")
    def validate_username(cls, v):
        if len(v) < 3 or len(v) > 20:
            raise ValueError("用户名长度必须在3-20之间")
        if not v.isalnum():
            raise ValueError("用户名只能包含字母和数字")
        return v

    @validator("age")
    def validate_age(cls, v):
        if v < 18 or v > 120:
            raise ValueError("年龄必须在18-120之间")
        return v


# 路由示例
@app.post("/users")
async def create_user(data: CreateUserRequest):
    # 检查用户名是否已存在
    if await check_username_exists(data.username):
        raise ConflictError(f"用户名 '{data.username}' 已被使用")

    user = await save_user(data)
    return {"id": user.id, "username": user.username}


@app.get("/users/{user_id}")
async def get_user(user_id: int):
    user = await find_user(user_id)
    if not user:
        raise NotFoundError("用户", str(user_id))
    return user
```

## 四、错误码设计规范

错误码是客户端程序化处理错误的关键。设计时遵循以下原则：

```
格式: {DOMAIN}_{SPECIFIC_ERROR}

示例:
VALIDATION_INVALID_EMAIL
VALIDATION_REQUIRED_FIELD
AUTH_TOKEN_EXPIRED
AUTH_INVALID_CREDENTIALS
RESOURCE_NOT_FOUND
RESOURCE_ALREADY_EXISTS
RATE_LIMIT_EXCEEDED
PAYMENT_CARD_DECLINED
PAYMENT_INSUFFICIENT_BALANCE
INTERNAL_SERVICE_UNAVAILABLE
INTERNAL_DATABASE_ERROR
```

**规则**：
1. 全大写，用下划线分隔
2. 第一段是领域（VALIDATION, AUTH, RESOURCE等）
3. 具体到错误类型，不要用笼统的GENERAL_ERROR
4. 新增错误码时更新文档

## 五、版本兼容性处理

API版本升级时，错误响应也要考虑兼容性：

```python
# 在响应头中包含API版本
@app.middleware("http")
async def api_version_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["API-Version"] = "v2"
    return response

# 错误响应中也可以包含版本信息
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "api_version": "v2",
    "deprecated_codes": ["OLD_ERROR_FORMAT"],
    "details": [...]
  }
}
```

## 六、限流与降级

当服务过载时，优雅的错误处理尤为重要：

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/data")
@limiter.limit("100/minute")
async def get_data(request: Request):
    # 正常业务逻辑
    return {"data": "..."}

# 降级处理
@app.get("/api/heavy-computation")
async def heavy_computation(request: Request):
    try:
        result = await compute_expensive_result()
        return {"result": result}
    except TimeoutError:
        # 返回降级数据而不是500错误
        return JSONResponse(
            status_code=200,
            content={
                "data": get_cached_result(),
                "meta": {
                    "degraded": True,
                    "message": "数据为缓存版本，实时计算暂时不可用"
                }
            }
        )
```

## 七、错误文档

好的API应该为每个错误码提供详细的文档页面。客户端看到错误响应中的`doc_url`后，可以直接跳转查看解决方案：

```markdown
# 错误码: VALIDATION_ERROR

## 描述
请求参数未通过验证。

## 常见原因
1. 缺少必填字段
2. 字段格式不正确
3. 字段值超出允许范围

## 解决方案
检查请求body中的每个字段，确保：
- 所有必填字段都已提供
- 字段类型正确（字符串、数字、布尔值）
- 字段值在允许范围内

## 示例
### 错误请求
```json
{"email": "invalid", "age": 15}
```

### 错误响应
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {"field": "email", "message": "邮箱格式不正确"},
      {"field": "age", "message": "年龄必须在18-120之间"}
    ]
  }
}
```
```

## 总结

REST API的错误处理不是简单的try-catch，而是一个完整的体系：

1. **正确使用HTTP状态码**——这是最基本的信息传递
2. **设计统一的错误响应格式**——包含code、message、details、request_id
3. **建立错误码规范**——让客户端能程序化处理错误
4. **全局异常处理**——确保所有异常都被正确捕获和格式化
5. **请求追踪**——通过request_id串联日志，快速定位问题
6. **优雅降级**——过载时返回缓存数据而不是500错误
7. **完善的错误文档**——帮助调用方自助解决问题

把这些做好，你的API就不再是"能用就行"的水平，而是真正对开发者友好的专业级API。
