---
layout: post
title: "Docker容器化Node.js应用：从Dockerfile到生产部署"
date: 2026-05-20
categories: [编程, DevOps]
tags: [Docker, Node.js, 容器化, 部署, DevOps]
image: /assets/images/docker-nodejs-deployment.jpg
---

![Docker容器化Node.js](/assets/images/docker-nodejs-deployment.jpg)

## 引言

Docker已经成为现代应用部署的标准工具。本文将手把手教你如何将一个Node.js应用从开发环境容器化，最终部署到生产环境。无论你是Docker新手还是有一定经验的开发者，都能从本文中获得实用价值。

## 为什么需要Docker？

### 传统部署的痛点

| 问题 | 描述 |
|------|------|
| 环境不一致 | "在我电脑上能跑"综合症 |
| 依赖冲突 | 不同项目需要不同版本的Node.js |
| 部署复杂 | 手动配置服务器，容易出错 |
| 扩展困难 | 难以快速横向扩展 |
| 回滚麻烦 | 出问题难以快速回退 |

### Docker的优势

- **环境一致性**：开发、测试、生产环境完全一致
- **快速部署**：秒级启动，一键部署
- **资源隔离**：每个容器独立运行，互不影响
- **易于扩展**：配合Kubernetes轻松实现自动扩缩容
- **版本管理**：镜像版本化，随时回滚

## 创建项目

### 初始化Node.js项目

```bash
mkdir docker-nodejs-app && cd docker-nodejs-app
npm init -y
npm install express
npm install -D nodemon
```

### 创建应用代码

```javascript
// app.js
const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({
        message: 'Hello from Docker!',
        hostname: os.hostname(),
        platform: os.platform(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/data', async (req, res) => {
    // 模拟数据库查询
    await new Promise(resolve => setTimeout(resolve, 100));
    res.json({
        items: [
            { id: 1, name: '项目A', status: 'active' },
            { id: 2, name: '项目B', status: 'pending' },
            { id: 3, name: '项目C', status: 'completed' }
        ],
        total: 3,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
```

### 创建package.json脚本

```json
{
  "name": "docker-nodejs-app",
  "version": "1.0.0",
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

## 编写Dockerfile

### 基础版Dockerfile

```dockerfile
# 使用官方Node.js镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install --production

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

### 生产级Dockerfile（多阶段构建）

```dockerfile
# ===== 第一阶段：安装依赖 =====
FROM node:18-alpine AS deps

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 利用Docker缓存层，依赖不变时不需要重新安装
RUN npm ci --only=production && \
    npm cache clean --force

# ===== 第二阶段：构建 =====
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# 如果有TypeScript需要编译
# RUN npm run build

# ===== 第三阶段：运行 =====
FROM node:18-alpine AS runner

# 安全：使用非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 从builder阶段复制编译结果
COPY --from=builder --chown=nodejs:nodejs /app ./
# 从deps阶段复制生产依赖
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# 切换到非root用户
USER nodejs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

CMD ["node", "app.js"]
```

### .dockerignore文件

```
node_modules
npm-debug.log
Dockerfile
.dockerignore
.git
.gitignore
.env
README.md
dist
coverage
.nyc_output
```

## Docker Compose

### 开发环境

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app          # 挂载源代码，支持热重载
      - /app/node_modules  # 防止本地node_modules覆盖容器内的
    environment:
      - NODE_ENV=development
      - PORT=3000
      - DB_HOST=db
      - REDIS_HOST=redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 开发专用Dockerfile

```dockerfile
# Dockerfile.dev
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

# 安装nodemon用于开发热重载
RUN npm install -g nodemon

COPY . .

EXPOSE 3000

# 开发模式使用nodemon
CMD ["nodemon", "app.js"]
```

## 构建和运行

### 构建镜像

```bash
# 构建生产镜像
docker build -t myapp:1.0 .

# 查看镜像大小
docker images myapp

# 使用BuildKit加速构建
DOCKER_BUILDKIT=1 docker build -t myapp:1.0 .
```

### 运行容器

```bash
# 基本运行
docker run -d -p 3000:3000 --name myapp myapp:1.0

# 带环境变量
docker run -d -p 3000:3000 \
    -e NODE_ENV=production \
    -e DB_HOST=db.example.com \
    --name myapp myapp:1.0

# 查看日志
docker logs -f myapp

# 进入容器调试
docker exec -it myapp sh

# 停止和删除
docker stop myapp && docker rm myapp
```

### 使用Docker Compose

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 重启某个服务
docker-compose restart app

# 停止所有服务
docker-compose down

# 停止并删除数据卷
docker-compose down -v
```

## 生产部署

### 镜像优化技巧

**1. 选择合适的基础镜像**

| 镜像 | 大小 | 适用场景 |
|------|------|----------|
| node:18 | 1.1GB | 开发环境 |
| node:18-slim | 250MB | 通用场景 |
| node:18-alpine | 180MB | 生产环境（推荐） |

**2. 合理利用缓存层**

```dockerfile
# 好的做法：先复制package.json，利用缓存
COPY package*.json ./
RUN npm ci
COPY . .

# 不好的做法：每次都重新安装依赖
COPY . .
RUN npm install
```

**3. 多阶段构建**

如上文所示，多阶段构建可以将最终镜像大小减少60%以上。

### 使用Nginx反向代理

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    image: myapp:1.0
    restart: always
    environment:
      - NODE_ENV=production
    expose:
      - "3000"
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
```

### Nginx配置

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream node_app {
        server app:3000;
    }

    server {
        listen 80;
        server_name example.com;

        location / {
            proxy_pass http://node_app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_cache_bypass $http_upgrade;
        }

        location /health {
            proxy_pass http://node_app/health;
            access_log off;
        }
    }
}
```

### 自动化部署脚本

```bash
#!/bin/bash
# deploy.sh - 自动化部署脚本

set -e

echo "=== 开始部署 ==="

# 变量
IMAGE_NAME="myapp"
VERSION=$(date +%Y%m%d-%H%M%S)
REGISTRY="registry.example.com"

# 1. 构建镜像
echo "构建镜像: ${REGISTRY}/${IMAGE_NAME}:${VERSION}"
docker build -t ${REGISTRY}/${IMAGE_NAME}:${VERSION} .
docker tag ${REGISTRY}/${IMAGE_NAME}:${VERSION} ${REGISTRY}/${IMAGE_NAME}:latest

# 2. 推送镜像
echo "推送镜像到仓库..."
docker push ${REGISTRY}/${IMAGE_NAME}:${VERSION}
docker push ${REGISTRY}/${IMAGE_NAME}:latest

# 3. 部署到服务器
echo "部署到生产环境..."
ssh deploy@server << EOF
    docker pull ${REGISTRY}/${IMAGE_NAME}:${VERSION}
    docker-compose -f docker-compose.prod.yml up -d
    docker image prune -f
EOF

echo "=== 部署完成: ${VERSION} ==="
```

## 监控和日志

### 日志管理

```yaml
services:
  app:
    image: myapp:1.0
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
```

### 资源限制

```yaml
services:
  app:
    image: myapp:1.0
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 容器启动后立即退出 | 应用报错 | `docker logs <container>` 查看日志 |
| 端口冲突 | 端口已被占用 | 更改映射端口或停止占用进程 |
| 权限问题 | 文件权限不匹配 | 使用非root用户，检查文件权限 |
| 内存不足 | 未设置资源限制 | 添加memory限制 |
| 网络不通 | 容器网络配置错误 | 检查network配置 |

## 结语

Docker容器化Node.js应用并不复杂，但要做好生产级部署需要注意很多细节。本文覆盖了从基础Dockerfile到多阶段构建、从开发环境到生产部署的完整流程。

记住这几个最佳实践：
1. 使用Alpine基础镜像减小体积
2. 多阶段构建分离编译和运行环境
3. 使用非root用户运行应用
4. 配置健康检查
5. 设置合理的资源限制
6. 使用.dockerignore排除不必要的文件

---

*本文为完整版，更多Kubernetes部署和CI/CD集成内容请持续关注本博客。*

*相关阅读：[Python异步编程实战：asyncio完全指南](/2026/05/20/python-asyncio-complete-guide)*
