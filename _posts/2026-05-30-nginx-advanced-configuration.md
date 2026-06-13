---
layout: post
title: "Nginx高级配置：负载均衡、缓存与安全防护"
date: 2026-05-30 14:00:00 +0800
categories: [Nginx, 运维, 性能优化]
tags: [nginx, load-balancing, caching, security]
image: /assets/images/nginx-advanced.jpg
---

## 引言

Nginx不仅是Web服务器，更是反向代理、负载均衡器、缓存服务器。本文介绍高级配置技巧。

## 1. 负载均衡

### 基础配置

```nginx
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
    server 192.168.1.12:8080;
}

server {
    location / {
        proxy_pass http://backend;
    }
}
```

### 负载均衡策略

```nginx
# 轮询（默认）
upstream backend {
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
}

# 加权轮询
upstream backend {
    server 192.168.1.10:8080 weight=3;
    server 192.168.1.11:8080 weight=1;
}

# IP哈希（会话保持）
upstream backend {
    ip_hash;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
}

# 最少连接
upstream backend {
    least_conn;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
}

# 一致性哈希（适合缓存）
upstream backend {
    hash $request_uri consistent;
    server 192.168.1.10:8080;
    server 192.168.1.11:8080;
}
```

### 健康检查

```nginx
upstream backend {
    server 192.168.1.10:8080 max_fails=3 fail_timeout=30s;
    server 192.168.1.11:8080 max_fails=3 fail_timeout=30s;
    
    # 主动健康检查（需要nginx-plus或第三方模块）
    # health_check interval=5s fails=3 passes=2;
}
```

## 2. 缓存配置

### 静态文件缓存

```nginx
server {
    # 静态文件长期缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # HTML短期缓存
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public, must-revalidate";
    }
}
```

### 代理缓存

```nginx
# 缓存配置
proxy_cache_path /var/cache/nginx 
    levels=1:2 
    keys_zone=api_cache:10m 
    max_size=1g 
    inactive=60m 
    use_temp_path=off;

server {
    location /api/ {
        proxy_cache api_cache;
        proxy_cache_key "$request_method$request_uri";
        proxy_cache_valid 200 10m;
        proxy_cache_valid 404 1m;
        proxy_cache_use_stale error timeout updating http_500;
        
        add_header X-Cache-Status $upstream_cache_status;
        
        proxy_pass http://backend;
    }
}
```

### 缓存清除

```nginx
# 使用proxy_cache_bypass
location /api/ {
    proxy_cache api_cache;
    
    # 特定条件绕过缓存
    proxy_cache_bypass $http_x_nocache;
    
    # 或通过变量控制
    set $bypass 0;
    if ($request_method = POST) {
        set $bypass 1;
    }
    proxy_cache_bypass $bypass;
}
```

## 3. 安全防护

### 请求限制

```nginx
# 限制请求速率
limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;

# 限制连接数
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

server {
    # 限制请求
    limit_req zone=req_limit burst=20 nodelay;
    
    # 限制连接
    limit_conn conn_limit 10;
}
```

### IP访问控制

```nginx
# 白名单
allow 192.168.1.0/24;
allow 10.0.0.0/8;
deny all;

# 黑名单
deny 192.168.100.0/24;
allow all;
```

### 安全头

```nginx
server {
    # 防止点击劫持
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    # 防止MIME类型嗅探
    add_header X-Content-Type-Options "nosniff" always;
    
    # XSS保护
    add_header X-XSS-Protection "1; mode=block" always;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # CSP
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
}
```

### 防止常见攻击

```nginx
server {
    # 限制请求体大小
    client_max_body_size 10m;
    
    # 限制URI长度
    client_header_buffer_size 1k;
    large_client_header_buffers 4 8k;
    
    # 超时设置
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;
    
    # 隐藏版本号
    server_tokens off;
}
```

## 4. SSL/TLS优化

```nginx
server {
    listen 443 ssl http2;
    
    # SSL证书
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # 协议版本
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # 加密套件
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # 会话缓存
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
}
```

## 5. 日志配置

```nginx
# 自定义日志格式
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for" '
                'rt=$request_time uct="$upstream_connect_time" '
                'uht="$upstream_header_time" urt="$upstream_response_time"';

# 条件日志
map $status $loggable {
    ~^[23]  0;
    default 1;
}

server {
    access_log /var/log/nginx/access.log main if=$loggable;
}
```

## 6. 性能优化

```nginx
# 工作进程
worker_processes auto;
worker_cpu_affinity auto;

# 连接配置
events {
    worker_connections 10000;
    multi_accept on;
    use epoll;
}

# 文件缓存
open_file_cache max=10000 inactive=60s;
open_file_cache_valid 90s;
open_file_cache_min_uses 2;
open_file_cache_errors on;

# 启用gzip
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;

# 启用brotli（需要模块）
# brotli on;
# brotli_types text/plain text/css application/json;
```

## 总结

Nginx高级配置要点：

1. **负载均衡** - 选择合适的策略
2. **缓存** - 静态文件+代理缓存
3. **安全** - 限流、访问控制、安全头
4. **SSL** - 协议版本、加密套件优化
5. **性能** - 工作进程、连接数、文件缓存

> 💡 **工具推荐**：如果你需要监控Nginx性能，可以试试**PriceSentinel Pro**——一个轻量级监控工具，支持实时指标追踪和告警。

---

