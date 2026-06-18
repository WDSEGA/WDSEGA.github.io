---
layout: post
title: "Docker Compose生产环境部署完整指南"
date: 2026-06-02 08:00:00 +0800
categories: [DevOps, Docker]
tags: [代码产品]
image: /assets/images/docker-compose-production.jpg
author: 大D
---

Docker Compose非常适合开发环境，但很多团队在将其用于生产环境时遇到了各种问题——安全配置不当、性能瓶颈、缺乏监控、无法优雅重启。这篇文章将系统性地讲解如何把Docker Compose从开发工具升级为可靠的生产部署方案。

## 为什么选择Docker Compose用于生产

在讨论"要不要用"之前，先明确适用场景：

- **中小型项目**：服务数量在10个以内，不需要Kubernetes的复杂编排
- **单体或微服务过渡期**：团队规模不大，需要快速迭代
- **边缘部署**：IoT设备、CDN节点等资源受限环境

如果你的项目符合以上条件，Docker Compose + 合理的运维脚本完全可以支撑生产环境。

## 基础架构设计

先看一个典型的生产环境docker-compose.yml结构：

```yaml
version: "3.9"

services:
  # 反向代理
  nginx:
    image: nginx:1.27-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx_logs:/var/log/nginx
    depends_on:
      app:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 256M
    networks:
      - frontend
      - backend

  # 应用服务
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 1G
    networks:
      - backend
    secrets:
      - db_password

  # 数据库
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 2G
    networks:
      - backend

  # Redis缓存
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    deploy:
      resources:
        limits:
          cpus: "0.5"
          memory: 512M
    networks:
      - backend

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  nginx_logs:
    driver: local

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # 内部网络，不能访问外网

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

## 安全加固

### 1. 敏感信息管理

永远不要把密码、密钥写死在docker-compose.yml中：

```bash
# 使用.env文件（不提交到git）
# .env
SECRET_KEY=your-super-secret-key
DB_USER=appuser
REDIS_PASSWORD=redis-secret-123

# 使用Docker secrets（更安全）
# secrets/db_password.txt
your-db-password-here
```

在.gitignore中添加：

```
.env
.env.*
secrets/
```

### 2. 网络隔离

上面的配置中，`backend`网络设置了`internal: true`，这意味着数据库和Redis不能直接访问外网，只有通过`app`服务才能被访问。这是最小权限原则的体现。

### 3. 容器权限限制

```yaml
# 在每个服务中添加安全配置
app:
  read_only: true  # 只读文件系统（需要配合tmpfs）
  tmpfs:
    - /tmp
  security_opt:
    - no-new-privileges:true  # 禁止提权
  cap_drop:
    - ALL  # 丢弃所有Linux能力
  cap_add:
    - NET_BIND_SERVICE  # 只添加必要的
```

## 健康检查配置

健康检查是生产环境的关键。没有健康检查，Docker无法判断服务是否真正可用。

```yaml
# 数据库健康检查
db:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 30s  # 给数据库启动时间

# 应用健康检查
app:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

注意`start_period`的设置——数据库启动通常需要较长时间，设置过短会导致误判。

## 日志管理

默认情况下Docker日志会无限增长，最终撑满磁盘。

```yaml
# 全局日志配置
services:
  app:
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
        compress: "gzip"

  db:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "3"
```

或者使用syslog/fluentd集中收集：

```yaml
services:
  app:
    logging:
      driver: "fluentd"
      options:
        fluentd-address: "localhost:24224"
        tag: "app.production"
```

## 优雅重启与零停机部署

生产环境的关键要求是不中断服务。以下是零停机部署的脚本：

```bash
#!/bin/bash
# deploy.sh - 零停机部署脚本

set -euo pipefail

COMPOSE_FILE="docker-compose.yml"
SERVICE_NAME="app"

echo "拉取最新代码..."
git pull origin main

echo "构建新镜像..."
docker compose -f $COMPOSE_FILE build $SERVICE_NAME

echo "启动新容器（滚动更新）..."
docker compose -f $COMPOSE_FILE up -d --no-deps --build $SERVICE_NAME

echo "等待健康检查通过..."
timeout=60
while [ $timeout -gt 0 ]; do
    if docker compose -f $COMPOSE_FILE ps $SERVICE_NAME | grep -q "healthy"; then
        echo "新容器健康检查通过"
        break
    fi
    echo "等待健康检查... 剩余 ${timeout}s"
    sleep 5
    timeout=$((timeout - 5))
done

if [ $timeout -eq 0 ]; then
    echo "健康检查超时，回滚..."
    docker compose -f $COMPOSE_FILE rollback $SERVICE_NAME
    exit 1
fi

echo "清理旧镜像..."
docker image prune -f

echo "部署完成！"
```

## 备份策略

数据备份是生产环境的生命线：

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/$(date +%Y-%m-%d)"
mkdir -p $BACKUP_DIR

# PostgreSQL备份
docker compose exec -T db pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_backup.sql.gz

# Redis备份
docker compose exec -T redis redis-cli -a $REDIS_PASSWORD --rdb - > $BACKUP_DIR/redis_backup.rdb

# 上传到远程存储
aws s3 sync $BACKUP_DIR s3://myapp-backups/$(date +%Y-%m-%d)/

# 清理30天前的备份
find /backups -type d -mtime +30 -exec rm -rf {} +

echo "备份完成: $BACKUP_DIR"
```

## 监控方案

没有监控的生产环境就是在裸奔。推荐使用Prometheus + Grafana：

```yaml
services:
  prometheus:
    image: prom/prometheus:v2.54
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.retention.time=30d'
    restart: unless-stopped
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:11
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    restart: unless-stopped
    networks:
      - frontend
      - monitoring
```

## 性能优化建议

1. **多阶段构建**：减小镜像体积，加快部署速度
2. **使用Alpine基础镜像**：减少安全攻击面和镜像大小
3. **合理设置资源限制**：防止单个服务吃光所有资源
4. **启用Docker BuildKit**：加速构建过程

```dockerfile
# 多阶段构建示例
FROM python:3.12-alpine AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-alpine
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app"]
```

## 总结

Docker Compose完全可以胜任生产环境部署，前提是你需要：

- 做好安全配置（网络隔离、secrets管理、权限限制）
- 配置完善的健康检查
- 建立日志管理和监控体系
- 准备好备份和回滚方案
- 编写自动化部署脚本

这些工作做完后，你会发现Docker Compose的生产部署方案比很多复杂的编排系统更容易维护和调试。关键是——不要把开发环境的配置直接搬到生产，花时间做好上面这些基础工作。
