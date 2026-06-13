---
title: "Docker容器化部署Node.js应用最佳实践"
date: 2026-05-25
categories: [技术]
tags: [Docker, Node.js, 容器化, 部署]
author: TechWriter
---

# Docker容器化部署Node.js应用最佳实践

Docker已成为现代应用部署的标准工具。本文将详细介绍如何将Node.js应用容器化，并分享生产环境的最佳实践。

## 项目准备

### 示例项目结构

```
my-node-app/
├── src/
│   ├── index.js
│   ├── routes/
│   └── controllers/
├── package.json
├── package-lock.json
├── .dockerignore
├── Dockerfile
└── docker-compose.yml
```

### 基础应用代码

```javascript
// src/index.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.json({ message: 'Hello from Docker!', timestamp: new Date() });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});
```

## Dockerfile编写

### 基础版本

```dockerfile
# 使用官方Node.js镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY src/ ./src/

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "src/index.js"]
```

### 生产级优化版本

```dockerfile
# ==================== 构建阶段 ====================
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖（包括devDependencies）
RUN npm ci

# 复制源代码
COPY . .

# 如果使用TypeScript，进行编译
# RUN npm run build

# ==================== 生产阶段 ====================
FROM node:20-alpine AS production

# 安全：使用非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeapp -u 1001

WORKDIR /app

# 只复制生产依赖
COPY --from=builder --chown=nodeapp:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodeapp:nodejs /app/package.json ./
COPY --from=builder --chown=nodeapp:nodejs /app/src ./src

# 切换到非root用户
USER nodeapp

# 环境变量
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动应用
CMD ["node", "--max-old-space-size=512", "src/index.js"]
```

## .dockerignore配置

```
# 依赖目录
node_modules
npm-debug.log

# Git
.git
.gitignore

# 测试
coverage
.nyc_output
*.test.js

# 文档
README.md
docs

# IDE
.idea
.vscode
*.swp

# 环境文件
.env
.env.local
.env.*.local

# Docker
Dockerfile
docker-compose*.yml
.dockerignore
```

## Docker Compose配置

### 开发环境

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  app:
    build:
      context: .
      target: builder
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
      - ./package.json:/app/package.json
    environment:
      - NODE_ENV=development
    command: npm run dev
    
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

### 生产环境

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      target: production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/production
    depends_on:
      mongodb:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    
  mongodb:
    image: mongo:7
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mongo_data:
```

## Nginx反向代理配置

```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
        keepalive 32;
    }

    server {
        listen 80;
        server_name example.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name example.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # 安全头
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /health {
            proxy_pass http://app/health;
            access_log off;
        }
    }
}
```

## 常用命令

### 构建与运行

```bash
# 构建镜像
docker build -t my-node-app:latest .

# 构建特定阶段
docker build --target production -t my-node-app:prod .

# 运行容器
docker run -d -p 3000:3000 --name my-app my-node-app:latest

# 使用compose
docker-compose -f docker-compose.prod.yml up -d
```

### 调试命令

```bash
# 查看日志
docker logs -f my-app

# 进入容器
docker exec -it my-app sh

# 查看资源使用
docker stats my-app

# 检查镜像大小
docker images my-node-app
```

## 安全最佳实践

### 1. 镜像安全扫描

```bash
# 使用Trivy扫描
trivy image my-node-app:latest

# 使用Docker Scout
docker scout cves my-node-app:latest
```

### 2. secrets管理

```yaml
# 使用Docker secrets
services:
  app:
    secrets:
      - db_password
    environment:
      - DB_PASSWORD_FILE=/run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

### 3. 网络隔离

```yaml
services:
  app:
    networks:
      - frontend
      - backend
      
  mongodb:
    networks:
      - backend

networks:
  frontend:
  backend:
    internal: true  # 内部网络，不暴露到外部
```

## CI/CD集成

```yaml
# .github/workflows/deploy.yml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: docker build --target production -t my-node-app:${{ github.sha }} .
      
      - name: Scan for vulnerabilities
        run: trivy image --severity HIGH,CRITICAL my-node-app:${{ github.sha }}
      
      - name: Push to registry
        run: |
          docker tag my-node-app:${{ github.sha }} registry.example.com/my-node-app:latest
          docker push registry.example.com/my-node-app:latest
```

## 性能优化

### 镜像大小优化

```dockerfile
# 使用alpine基础镜像
FROM node:20-alpine  # ~50MB vs node:20 ~300MB

# 清理缓存
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/*
```

### 多阶段构建效果

| 阶段 | 镜像大小 |
|------|----------|
| 单阶段 | ~350MB |
| 多阶段 | ~120MB |
| 多阶段+Alpine | ~80MB |

## 总结

Docker容器化Node.js应用的关键点：

1. 使用多阶段构建减小镜像体积
2. 以非root用户运行提升安全性
3. 添加健康检查支持容器编排
4. 合理配置资源限制
5. 使用.dockerignore优化构建

掌握这些实践，让你的Node.js应用部署更加专业！

---

