---
layout: post
title: "Docker + Kubernetes 生产环境部署完全指南"
date: 2026-05-18 17:00:00 +0800
categories: [tech]
tags: [Docker, Kubernetes, DevOps, 云原生]
image: https://wdsega.github.io/assets/images/docker-kubernetes-deploy.jpg
---

![Docker + Kubernetes 生产部署](https://wdsega.github.io/assets/images/docker-kubernetes-deploy.jpg)

在企业级应用开发中，容器化与编排技术已经成为基础设施的基石。本文将从实际生产场景出发，系统讲解 Docker 容器化到 Kubernetes 编排部署的完整工作流，帮助 DevOps 工程师和后端开发者构建可靠、高效的云原生应用交付体系。

## 一、Docker 容器化最佳实践

### 1.1 多阶段构建

多阶段构建是生产环境镜像优化的核心手段，能够将构建依赖与运行时环境严格分离，显著减小最终镜像体积。

```dockerfile
# ===== 阶段一：构建阶段 =====
FROM node:20-alpine AS builder

WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存层加速构建
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 复制源码并构建
COPY . .
RUN npm run build

# ===== 阶段二：运行阶段 =====
FROM node:20-alpine AS runtime

# 创建非 root 用户
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# 仅从构建阶段复制必要产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
```

### 1.2 镜像优化要点

- **选择精简基础镜像**：优先使用 `alpine`、`slim` 等变体，避免安装不必要的系统包
- **合并 RUN 指令**：减少镜像层数，将相关操作用 `&&` 连接
- **利用构建缓存**：将不常变化的文件（如依赖声明）放在 Dockerfile 前部
- **设置 `.dockerignore`**：排除 `.git`、`node_modules`、`*.md` 等无关文件

```
# .dockerignore
.git
.gitignore
node_modules
npm-debug.log
README.md
.env.local
```

## 二、Docker Compose 开发环境配置

在开发阶段，Docker Compose 能够快速搭建包含应用、数据库、缓存等完整依赖的本地环境。

```yaml
# docker-compose.yml
version: "3.9"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - REDIS_HOST=redis
    volumes:
      - .:/app          # 挂载源码实现热重载
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: secretpassword
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d myapp"]
      interval: 5s
      timeout: 3s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
  redisdata:
```

## 三、Kubernetes 核心概念

在深入部署配置之前，先梳理 K8s 中最核心的几个资源对象：

| 资源对象 | 职责 |
|---------|------|
| **Pod** | 最小调度单元，包含一个或多个共享网络与存储的容器 |
| **Deployment** | 声明式管理 Pod 副本数，支持滚动更新与回滚 |
| **Service** | 为 Pod 提供稳定的网络访问入口与负载均衡 |
| **ConfigMap** | 存储非敏感配置数据，以环境变量或卷挂载方式注入 Pod |
| **Secret** | 存储敏感数据（密码、证书等），Base64 编码存储 |

## 四、生产级 Kubernetes 部署配置

以下是一个完整的生产级部署方案，包含 Deployment、Service、ConfigMap、Secret 和 Ingress。

### 4.1 Namespace 与 ConfigMap

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    env: production
    team: backend
---
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: production
data:
  NODE_ENV: "production"
  DB_HOST: "postgres-service"
  DB_PORT: "5432"
  DB_NAME: "myapp"
  REDIS_HOST: "redis-service"
  LOG_LEVEL: "info"
```

### 4.2 Secret

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
data:
  # 值需经过 base64 编码
  DB_PASSWORD: c2VjcmV0cGFzc3dvcmQ=
  JWT_SECRET: eW91ci1qd3Qtc2VjcmV0LWtleS0yMDI2
  API_KEY: YWJjZGVmZzEyMzQ1Njc4
```

> **注意**：生产环境中建议使用 Sealed Secrets、HashiCorp Vault 或云厂商的密钥管理服务来管理敏感数据，避免将 Secret 明文提交到代码仓库。

### 4.3 Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  namespace: production
  labels:
    app: myapp
    version: v1.2.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # 滚动更新时最多多出 1 个 Pod
      maxUnavailable: 0    # 更新期间不允许有 Pod 不可用
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
        version: v1.2.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "3000"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: myapp-sa
      terminationGracePeriodSeconds: 60

      # 反亲和性：确保 Pod 分散在不同节点
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - myapp
                topologyKey: kubernetes.io/hostname

      containers:
        - name: myapp
          image: registry.example.com/myapp:v1.2.0
          ports:
            - containerPort: 3000
              protocol: TCP

          # 资源限制与请求
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"

          # 环境变量注入
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: app-secrets

          # 健康检查
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 20
            timeoutSeconds: 5
            failureThreshold: 3

          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3

          startupProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 0
            periodSeconds: 5
            failureThreshold: 12   # 最多等待 60 秒启动

          # 生命周期钩子
          lifecycle:
            preStop:
              exec:
                command: ["/bin/sh", "-c", "sleep 15"]

          # 安全上下文
          securityContext:
            runAsNonRoot: true
            runAsUser: 1000
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
```

### 4.4 Service 与 Ingress

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp-service
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
    - name: http
      port: 80
      targetPort: 3000
      protocol: TCP
---
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - app.example.com
      secretName: app-tls-secret
  rules:
    - host: app.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-service
                port:
                  number: 80
```

## 五、健康检查与自动扩缩容

### 5.1 健康检查设计

K8s 提供三种探针（Probe），分别应对不同场景：

- **livenessProbe**：检测容器是否存活，失败则重启容器
- **readinessProbe**：检测容器是否就绪，失败则从 Service Endpoints 中摘除
- **startupProbe**：检测容器是否启动完成，适用于启动较慢的应用

### 5.2 HPA 自动扩缩容

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 3
  maxReplicas: 15
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

HPA 的 `behavior` 配置至关重要：扩容可以激进一些以快速响应流量增长，缩容则应保守以避免频繁波动。

## 六、滚动更新与回滚策略

### 6.1 滚动更新

K8s Deployment 默认采用滚动更新策略。在上述 Deployment 配置中，我们设置了 `maxSurge: 1` 和 `maxUnavailable: 0`，这意味着更新时会先创建新 Pod，确认其就绪后再终止旧 Pod，实现零停机部署。

```bash
# 执行滚动更新
kubectl set image deployment/myapp \
  myapp=registry.example.com/myapp:v1.3.0 \
  -n production

# 查看更新状态
kubectl rollout status deployment/myapp -n production

# 查看更新历史
kubectl rollout history deployment/myapp -n production
```

### 6.2 回滚

当新版本出现问题时，可以快速回滚到上一个稳定版本：

```bash
# 回滚到上一版本
kubectl rollout undo deployment/myapp -n production

# 回滚到指定版本
kubectl rollout undo deployment/myapp --to-revision=2 -n production

# 查看当前版本
kubectl rollout history deployment/myapp -n production
```

## 七、监控与日志

### 7.1 Prometheus + Grafana 监控栈

在 Deployment 中已通过注解暴露了 `/metrics` 端点。以下是 Prometheus 的 ServiceMonitor 配置：

```yaml
# servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: myapp-monitor
  namespace: production
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      app: myapp
  endpoints:
    - port: http
      path: /metrics
      interval: 15s
      scrapeTimeout: 10s
```

### 7.2 日志收集

生产环境推荐使用 EFK（Elasticsearch + Fluentd + Kibana）或 PLG（Promtail + Loki + Grafana）日志栈。以下是一个 Fluentd DaemonSet 的核心配置片段：

```yaml
# fluentd-configmap.yaml（节选）
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
  namespace: logging
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      read_from_head true
      <parse>
        @type json
        time_key time
        time_format %Y-%m-%dT%H:%M:%S.%NZ
      </parse>
    </source>

    <filter kubernetes.**>
      @type kubernetes_metadata
      @id filter_kube_metadata
    </filter>

    <match **>
      @type elasticsearch
      @id out_es
      @log_level info
      host elasticsearch.logging.svc
      port 9200
      logstash_format true
      logstash_prefix k8s-logs
      <buffer>
        @type file
        path /var/log/fluentd-buffers/kubernetes.system.buffer
        flush_mode interval
        flush_interval 5s
        flush_thread_count 2
        chunk_limit_size 2M
        queue_limit_length 8
        retry_max_interval 30
        retry_forever true
      </buffer>
    </match>
```

## 八、安全最佳实践

### 8.1 RBAC 权限控制

为应用分配最小权限的 ServiceAccount：

```yaml
# rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: myapp-sa
  namespace: production
automountServiceAccountToken: false
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: myapp-role
  namespace: production
rules:
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list"]
  - apiGroups: [""]
    resources: ["secrets"]
    resourceNames: ["app-secrets"]
    verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: myapp-rolebinding
  namespace: production
subjects:
  - kind: ServiceAccount
    name: myapp-sa
    namespace: production
roleRef:
  kind: Role
  name: myapp-role
  apiGroup: rbac.authorization.k8s.io
```

### 8.2 Network Policy

通过网络策略限制 Pod 间的通信，实现零信任网络模型：

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: myapp-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: myapp
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
    - to:   # 允许 DNS 解析
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

### 8.3 Pod 安全标准

从 K8s 1.23 起，Pod Security Admission（PSA）已取代 PSP。建议在 Namespace 级别启用安全标准：

```yaml
# namespace-security.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

## 九、常见问题排查

### 9.1 Pod 状态异常排查流程

```bash
# 1. 查看 Pod 状态
kubectl get pods -n production -o wide

# 2. 查看 Pod 事件（最常被忽视的排查手段）
kubectl describe pod <pod-name> -n production

# 3. 查看容器日志
kubectl logs <pod-name> -n production --tail=200 -f

# 4. 如果容器已崩溃，查看上一次的日志
kubectl logs <pod-name> -n production --previous

# 5. 进入容器调试
kubectl exec -it <pod-name> -n production -- /bin/sh
```

### 9.2 常见问题速查表

| 问题现象 | 可能原因 | 排查命令 |
|---------|---------|---------|
| `CrashLoopBackOff` | 应用启动失败 / OOM | `kubectl logs <pod> --previous` |
| `ImagePullBackOff` | 镜像不存在 / 认证失败 | `kubectl describe pod <pod>` |
| `Pending` | 资源不足 / 节点不匹配 | `kubectl describe pod <pod>` |
| `0/1 Running` | 就绪探针失败 | `kubectl describe pod <pod>` |
| Service 无法访问 | selector 不匹配 / Endpoints 为空 | `kubectl get endpoints <svc>` |
| 频繁重启 | OOMKilled / livenessProbe 过严 | `kubectl describe pod <pod>` |

### 9.3 资源限制调优

```bash
# 查看 Pod 资源使用情况
kubectl top pods -n production --sort-by=memory

# 查看节点资源使用情况
kubectl top nodes

# 查看资源配额
kubectl describe resourcequota -n production
```

## 总结

从 Docker 容器化到 Kubernetes 编排部署，构建生产级云原生架构需要关注的关键环节包括：镜像优化与多阶段构建、声明式资源配置、健康检查与自动扩缩容、滚动更新与快速回滚、完善的监控日志体系，以及严格的安全策略。每一个环节都直接影响系统的可靠性、可维护性和安全性。

建议在实际项目中逐步引入这些实践，而非一次性全量落地。先从容器化与基础部署开始，再逐步完善监控、安全策略和自动扩缩容能力，形成适合团队节奏的渐进式演进路径。
