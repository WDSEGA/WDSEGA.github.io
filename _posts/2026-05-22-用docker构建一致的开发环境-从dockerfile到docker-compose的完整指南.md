---
title: "用Docker构建一致的开发环境：从Dockerfile到docker-compose的完整指南"
date: 2026-05-22
tags: [时事新闻]
categories: [技术, 科普]
tags: "docker, devops, tutorial, node"
---

"在我机器上能跑"是程序员最头疼的问题之一。今天我来分享如何用Docker构建一致的开发环境，彻底解决环境差异带来的麻烦。

## 为什么需要Docker化开发环境

传统开发环境的痛点：
- 新成员入职配置环境要一天
- 测试环境和生产环境不一致导致bug
- 不同项目依赖不同版本的Node/Python/MySQL

## 实战：Node.js项目的Docker化

### Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
USER node
EXPOSE 3000
CMD ["node", "src/app.js"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - mongo
      - redis
  mongo:
    image: mongo:6
    volumes:
      - mongo-data:/data/db
  redis:
    image: redis:7-alpine

volumes:
  mongo-data:
```

## 开发模式vs生产模式

开发时我们需要热重载，生产时不需要。可以用多个docker-compose文件来区分。

## 实用命令速查

```bash
docker-compose up -d
docker-compose logs -f app
docker-compose exec app sh
```

---

*原文发表于 [WDSEGA Blog](https://wdsega.github.io/2025/05/22/docker-dev-environment.html)*