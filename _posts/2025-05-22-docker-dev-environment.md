---
layout: post
title: "用Docker构建一致的开发环境：从Dockerfile到docker-compose的完整指南"
date: 2025-05-22 20:00:00 +0800
categories: [技术实战, DevOps]
tags: [Docker, 开发环境, 容器化, docker-compose]
image: /assets/images/docker-dev-cover.jpg
---

"在我机器上能跑"是程序员最头疼的问题之一。今天我来分享如何用Docker构建一致的开发环境，彻底解决环境差异带来的麻烦。

## 为什么需要Docker化开发环境

传统开发环境的痛点：

- 新成员入职配置环境要一天
- 测试环境和生产环境不一致导致bug
- 不同项目依赖不同版本的Node/Python/MySQL
- "我昨天还能跑，今天就不行了"

Docker通过容器化解决了这些问题。每个项目有自己的容器，依赖完全隔离，环境配置代码化，新成员一条命令就能启动。

## 实战：Node.js项目的Docker化

假设我们有一个Express + MongoDB的项目。

### 项目结构

```
myapp/
├── src/
│   ├── app.js
│   └── routes/
├── package.json
├── .env.example
├── Dockerfile
└── docker-compose.yml
```

### Dockerfile

```dockerfile
# 使用官方Node镜像作为基础
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 先复制package文件，利用Docker缓存层
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 创建非root用户运行应用（安全最佳实践）
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# 启动命令
CMD ["node", "src/app.js"]
```

关键点解释：

1. **使用alpine镜像**：体积小，启动快
2. **分层构建**：先复制package.json，依赖不变时可以利用缓存
3. **npm ci**：比npm install更快，且严格遵循package-lock.json
4. **非root用户**：减少安全风险
5. **健康检查**：Docker可以自动检测容器是否健康

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: myapp-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - MONGODB_URI=mongodb://mongo:27017/myapp
      - REDIS_URL=redis://redis:6379
    env_file:
      - .env
    volumes:
      - .:/app
      - /app/node_modules  # 匿名卷，避免覆盖容器内的node_modules
    depends_on:
      mongo:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - myapp-network

  mongo:
    image: mongo:6
    container_name: myapp-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=secret
      - MONGO_INITDB_DATABASE=myapp
    volumes:
      - mongo-data:/data/db
      - ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 10s
      retries: 5
      start_period: 40s
    networks:
      - myapp-network

  redis:
    image: redis:7-alpine
    container_name: myapp-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    networks:
      - myapp-network

  # 开发工具：MongoDB管理界面
  mongo-express:
    image: mongo-express:latest
    container_name: myapp-mongo-express
    restart: unless-stopped
    ports:
      - "8081:8081"
    environment:
      - ME_CONFIG_MONGODB_ADMINUSERNAME=admin
      - ME_CONFIG_MONGODB_ADMINPASSWORD=secret
      - ME_CONFIG_MONGODB_URL=mongodb://admin:secret@mongo:27017/
    depends_on:
      - mongo
    networks:
      - myapp-network

volumes:
  mongo-data:
  redis-data:

networks:
  myapp-network:
    driver: bridge
```

这个配置包含：

- **app服务**：我们的Node.js应用
- **mongo服务**：MongoDB数据库
- **redis服务**：Redis缓存
- **mongo-express服务**：MongoDB的Web管理界面

### 开发模式vs生产模式

开发时我们需要热重载，生产时不需要。可以用多个docker-compose文件：

**docker-compose.yml**（生产配置）

```yaml
services:
  app:
    build: .
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

**docker-compose.dev.yml**（开发配置覆盖）

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev  # 使用开发专用的Dockerfile
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev  # 使用nodemon热重载
```

**Dockerfile.dev**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 安装nodemon用于热重载
RUN npm install -g nodemon

COPY package*.json ./
RUN npm install  # 开发环境安装所有依赖（包括devDependencies）

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

使用方式：

```bash
# 生产环境
docker-compose up -d

# 开发环境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## 进阶：多阶段构建优化镜像大小

对于生产环境，可以用多阶段构建进一步减小镜像：

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 只复制生产依赖
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/app.js"]
```

这样最终的镜像只包含运行所需的文件，没有源代码、没有构建工具、没有devDependencies。

## 实用命令速查

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 进入容器执行命令
docker-compose exec app sh

# 重建镜像
docker-compose up -d --build

# 停止并删除容器
docker-compose down

# 停止并删除容器和卷（小心！数据会丢失）
docker-compose down -v

# 查看资源使用
docker stats
```

## 常见问题解决

### 1. node_modules权限问题

如果在容器内安装依赖后，宿主机无法访问：

```yaml
volumes:
  - .:/app
  - node_modules:/app/node_modules  # 使用命名卷

volumes:
  node_modules:
```

### 2. 热重载不工作

Mac/Windows上需要启用polling：

```json
// package.json
{
  "scripts": {
    "dev": "nodemon --legacy-watch src/app.js"
  }
}
```

### 3. 环境变量不生效

检查.env文件是否在.dockerignore中。如果在，需要显式挂载：

```yaml
env_file:
  - .env
```

### 4. 数据库连接失败

确保服务名正确。在docker-compose中，服务名就是主机名：

```javascript
// 正确
mongoose.connect('mongodb://mongo:27017/myapp')

// 错误（localhost指向容器本身，不是宿主机）
mongoose.connect('mongodb://localhost:27017/myapp')
```

## 总结

Docker化开发环境的好处：

1. **一致性**：所有人的环境完全一样
2. **可复现**：新成员几分钟就能开始工作
3. **隔离性**：不同项目用不同版本的依赖
4. **可移植**：开发环境和生产环境配置相似

关键文件：

- **Dockerfile**：定义应用镜像
- **docker-compose.yml**：编排多个服务
- **.dockerignore**：排除不需要的文件

刚开始可能会觉得麻烦，但熟练之后，Docker会大幅提升开发效率。特别是团队协作时，环境问题的减少带来的收益远超学习成本。
