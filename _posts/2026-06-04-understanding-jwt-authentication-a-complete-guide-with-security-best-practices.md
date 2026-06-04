---
layout: post
title: "JWT认证完全指南：从原理到安全最佳实践"
date: 2026-06-04 09:00:00 +0800
tags: jwt, authentication, security, python
categories: Security
image: /assets/images/jwt-authentication.jpg
description: "深入理解JWT的结构原理，掌握Python实现JWT认证的完整流程，以及生产环境中的安全最佳实践。"
---

## 前言

JWT（JSON Web Token）是现代Web应用中最流行的认证方案之一。从单页应用到微服务架构，JWT无处不在。然而，不正确的JWT实现可能导致严重的安全漏洞。本文将从原理到实践，全面讲解JWT认证的正确实现方式。

---

## JWT的结构原理

JWT由三部分组成，用 `.` 分隔：`Header.Payload.Signature`

### Header（头部）

```json
{
  "alg": "RS256",
  "typ": "JWT"
}
```

指定签名算法和令牌类型。常见的算法有：
- **HS256**：HMAC-SHA256，对称加密，适合单体应用
- **RS256**：RSA-SHA256，非对称加密，适合分布式系统
- **ES256**：ECDSA-SHA256，更短签名，性能更好

### Payload（载荷）

```json
{
  "sub": "user_12345",
  "name": "张三",
  "email": "zhangsan@example.com",
  "role": "admin",
  "iat": 1748956800,
  "exp": 1749043200,
  "jti": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

标准声明（Claims）：
- `sub`：主题，通常是用户ID
- `iat`：签发时间
- `exp`：过期时间
- `jti`：JWT唯一标识符
- `nbf`：生效时间

**重要提醒：** Payload只是Base64编码，不是加密！不要在JWT中存储密码、密钥等敏感信息。

### Signature（签名）

```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

签名用于验证令牌的完整性和真实性。

---

## Python实现：生成JWT

```python
import jwt
from datetime import datetime, timedelta, timezone
import uuid

# 配置
JWT_SECRET_KEY = "your-very-strong-secret-key-at-least-32-characters"
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE = timedelta(minutes=30)
JWT_REFRESH_TOKEN_EXPIRE = timedelta(days=7)


def create_access_token(user_id: str, role: str, extra_claims: dict = None) -> str:
    """生成访问令牌"""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "role": role,
        "iat": now,
        "exp": now + JWT_ACCESS_TOKEN_EXPIRE,
        "jti": str(uuid.uuid4()),
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)

    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def create_refresh_token(user_id: str) -> str:
    """生成刷新令牌"""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + JWT_REFRESH_TOKEN_EXPIRE,
        "jti": str(uuid.uuid4()),
        "type": "refresh",
    }

    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


# 使用示例
access_token = create_access_token("user_12345", "admin")
refresh_token = create_refresh_token("user_12345")
print(f"Access Token: {access_token[:50]}...")
print(f"Refresh Token: {refresh_token[:50]}...")
```

---

## Python实现：验证JWT

```python
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jwt import PyJWTError

app = FastAPI()
security = HTTPBearer()


def verify_token(token: str) -> dict:
    """验证JWT令牌"""
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iat": True,
                "verify_nbf": True,
                "require": ["exp", "sub", "iat"],
            }
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="令牌已过期")
    except jwt.InvalidTokenError as e:
        raise HTTPException(status_code=401, detail=f"无效的令牌: {str(e)}")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """获取当前用户（依赖注入）"""
    token = credentials.credentials
    payload = verify_token(token)

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="需要访问令牌")

    return {
        "user_id": payload["sub"],
        "role": payload["role"],
        "jti": payload["jti"],
    }


# 角色权限检查
def require_role(*roles: str):
    """角色权限装饰器"""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"需要以下角色之一: {', '.join(roles)}"
            )
        return current_user
    return role_checker


# 使用示例
@app.get("/api/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    return {"user_id": user["user_id"], "role": user["role"]}


@app.delete("/api/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: dict = Depends(require_role("admin"))
):
    return {"message": f"用户 {user_id} 已被删除"}
```

---

## RS256非对称签名实现

对于分布式系统，推荐使用RS256算法。私钥用于签名，公钥用于验证。

```python
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import jwt

# 生成RSA密钥对
def generate_rsa_keys():
    """生成RSA密钥对"""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=4096,
    )

    # 导出私钥（PEM格式）
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    # 导出公钥
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    return private_pem, public_pem


# 使用RS256签名
def create_token_rs256(payload: dict, private_key_pem: bytes) -> str:
    return jwt.encode(payload, private_key_pem, algorithm="RS256")


# 使用RS256验证
def verify_token_rs256(token: str, public_key_pem: bytes) -> dict:
    return jwt.decode(token, public_key_pem, algorithms=["RS256"])


# 在微服务架构中：
# - 认证服务持有私钥，负责签发JWT
# - 其他服务持有公钥，只负责验证JWT
# - 即使公钥泄露，攻击者也无法伪造令牌
```

---

## 安全最佳实践

### 1. 使用强密钥

```python
import secrets

# 生成强密钥（至少256位）
secret_key = secrets.token_urlsafe(32)
print(f"生成的密钥: {secret_key}")
```

密钥要求：
- HS256：至少32字节（256位）
- RS256：至少4096位RSA密钥
- 不要使用硬编码密钥
- 不要在代码中提交密钥，使用环境变量

### 2. 设置合理的过期时间

```python
# 推荐的过期时间配置
ACCESS_TOKEN_EXPIRE = timedelta(minutes=15)   # 访问令牌：15分钟
REFRESH_TOKEN_EXPIRE = timedelta(days=7)       # 刷新令牌：7天
```

- 访问令牌设置较短的过期时间（15-30分钟）
- 使用刷新令牌获取新的访问令牌
- 刷新令牌存储在服务端（数据库或Redis）
- 支持令牌撤销机制

### 3. 令牌撤销：黑名单机制

```python
import redis.asyncio as redis

class TokenBlacklist:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url, decode_responses=True)

    async def blacklist_token(self, jti: str, exp: int):
        """将令牌加入黑名单"""
        # 设置过期时间与令牌过期时间一致
        ttl = exp - int(datetime.now(timezone.utc).timestamp())
        if ttl > 0:
            await self.redis.setex(f"blacklist:{jti}", ttl, "1")

    async def is_blacklisted(self, jti: str) -> bool:
        """检查令牌是否在黑名单中"""
        return await self.redis.exists(f"blacklist:{jti}")

    async def blacklist_user_tokens(self, user_id: str):
        """撤销用户的所有令牌（用于强制登出）"""
        await self.redis.set(f"user_logout:{user_id}", "1", ex=86400)

    async def is_user_logged_out(self, user_id: str, iat: int) -> bool:
        """检查用户在令牌签发后是否登出"""
        logout_time = await self.redis.get(f"user_logout:{user_id}")
        if logout_time:
            return iat < int(logout_time)
        return False


blacklist = TokenBlacklist()


# 在验证令牌时检查黑名单
async def verify_token_with_blacklist(token: str) -> dict:
    payload = verify_token(token)  # 先验证签名和过期时间

    jti = payload.get("jti")
    user_id = payload.get("sub")
    iat = payload.get("iat")

    # 检查令牌黑名单
    if await blacklist.is_blacklisted(jti):
        raise HTTPException(status_code=401, detail="令牌已被撤销")

    # 检查用户是否已登出
    if await blacklist.is_user_logged_out(user_id, iat):
        raise HTTPException(status_code=401, detail="用户已登出")

    return payload
```

### 4. 使用HttpOnly Cookie存储令牌

```python
from fastapi import Response

@app.post("/api/auth/login")
async def login(response: Response, credentials: LoginRequest):
    user = authenticate(credentials)
    access_token = create_access_token(user.id, user.role)
    refresh_token = create_refresh_token(user.id)

    # 使用HttpOnly Cookie存储令牌
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,        # JavaScript无法访问
        secure=True,          # 仅HTTPS传输
        samesite="strict",    # 防止CSRF
        max_age=1800,         # 30分钟
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=604800,       # 7天
        path="/api/auth/refresh",  # 仅刷新端点可访问
    )

    return {"message": "登录成功"}
```

### 5. 防御常见攻击

**XSS攻击防御：**
- 使用HttpOnly Cookie存储JWT，而不是localStorage
- 设置Content-Security-Policy头部

**CSRF攻击防御：**
- 设置SameSite=Strict或Lax
- 使用双重提交Cookie模式

**令牌注入防御：**
- 始终验证签名
- 使用白名单算法（不要使用 `algorithms=["none"]`）
- 验证 `iss`（签发者）声明

```python
# 安全的令牌验证配置
payload = jwt.decode(
    token,
    public_key,
    algorithms=["RS256"],  # 明确指定算法，不接受none
    issuer="your-auth-service",  # 验证签发者
    audience="your-api",  # 验证接收者
)
```

---

## 刷新令牌流程

```python
from fastapi import APIRouter, HTTPException, Response, Depends

router = APIRouter(prefix="/api/auth")


@router.post("/refresh")
async def refresh_access_token(
    response: Response,
    refresh_token: str = Depends(get_refresh_token_from_cookie),
):
    """使用刷新令牌获取新的访问令牌"""
    try:
        payload = jwt.decode(
            refresh_token,
            JWT_SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="刷新令牌已过期，请重新登录")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="无效的刷新令牌")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="需要刷新令牌")

    # 检查刷新令牌是否被撤销
    if await is_refresh_token_revoked(payload["jti"]):
        raise HTTPException(status_code=401, detail="刷新令牌已被撤销")

    # 生成新的访问令牌
    user = await get_user_by_id(payload["sub"])
    new_access_token = create_access_token(user.id, user.role)

    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=1800,
    )

    return {"message": "令牌已刷新"}


@router.post("/logout")
async def logout(
    response: Response,
    current_user: dict = Depends(get_current_user),
    token: str = Depends(get_token_from_cookie),
):
    """登出：撤销当前令牌"""
    payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])

    # 将访问令牌加入黑名单
    await blacklist.blacklist_token(payload["jti"], payload["exp"])

    # 标记用户已登出
    await blacklist.blacklist_user_tokens(current_user["user_id"])

    # 清除Cookie
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return {"message": "已成功登出"}
```

---

## 总结

JWT认证的安全要点清单：

1. 使用强密钥，通过环境变量管理
2. 访问令牌短过期（15-30分钟），配合刷新令牌
3. 使用RS256非对称签名（分布式系统）
4. HttpOnly Cookie + SameSite=Strict 防御XSS和CSRF
5. 实现令牌黑名单和撤销机制
6. 明确指定算法，不接受 `none`
7. 验证 `iss` 和 `aud` 声明
8. 不在Payload中存储敏感信息
9. 记录令牌签发和验证日志
10. 定期轮换密钥

安全是一个持续的过程，没有一劳永逸的方案。遵循以上最佳实践，可以大幅降低JWT认证的安全风险。
