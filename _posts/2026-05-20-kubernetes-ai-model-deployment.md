---
layout: post
title: "Kubernetes部署AI模型实战：从Docker到生产级MLOps"
date: 2026-05-20
categories: [技术教程, Kubernetes, AI, DevOps]
tags: [代码产品]
image: /assets/images/kubernetes-ai-ml-ops.jpg
---

![Kubernetes AI部署](/assets/images/kubernetes-ai-ml-ops.jpg)

## 引言

训练好一个AI模型只是开始，如何将其稳定、高效地部署到生产环境才是真正的挑战。Kubernetes作为容器编排的事实标准，为AI模型部署提供了弹性伸缩、滚动更新、服务发现等强大能力。

本文将带你完成一个完整的AI模型Kubernetes部署流程，涵盖Docker化、K8s配置、自动扩缩容、监控告警等关键环节。

## 架构总览

```
                    ┌─────────────┐
                    │   Ingress   │
                    │  (Nginx)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Service   │
                    │  (ClusterIP)│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼────┐ ┌────▼─────┐ ┌────▼─────┐
        │  Pod 1   │ │  Pod 2   │ │  Pod 3   │
        │ (Model)  │ │ (Model)  │ │ (Model)  │
        └──────────┘ └──────────┘ └──────────┘
              │            │            │
        ┌─────▼────────────▼────────────▼─────┐
        │           Redis (缓存)               │
        └─────────────────────────────────────┘
```

## 第一步：Docker化AI模型

### Dockerfile

```dockerfile
# 使用多阶段构建减小镜像体积
FROM python:3.11-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim as runtime

WORKDIR /app

# 安装运行时依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# 从builder复制Python包
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages

# 复制应用代码
COPY app/ ./app/
COPY models/ ./models/
COPY config/ ./config/

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### FastAPI服务端代码

```python
# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import numpy as np
import redis
import logging
import time
from contextlib import asynccontextmanager

# 模型管理
class ModelManager:
    def __init__(self):
        self.model = None
        self.redis_client = None
        self._load_model()

    def _load_model(self):
        """加载AI模型"""
        import joblib
        self.model = joblib.load('models/classifier.pkl')
        logging.info("Model loaded successfully")

    def predict(self, features: list) -> dict:
        """执行预测"""
        start_time = time.time()
        
        # 检查缓存
        cache_key = str(hash(tuple(features)))
        if self.redis_client:
            cached = self.redis_client.get(cache_key)
            if cached:
                return {"prediction": int(cached), "cached": True, "time_ms": 0}

        # 执行预测
        input_array = np.array(features).reshape(1, -1)
        prediction = int(self.model.predict(input_array)[0])
        probability = float(self.model.predict_proba(input_array).max())

        # 写入缓存（TTL 1小时）
        if self.redis_client:
            self.redis_client.setex(cache_key, 3600, str(prediction))

        elapsed = (time.time() - start_time) * 1000
        return {
            "prediction": prediction,
            "probability": round(probability, 4),
            "cached": False,
            "time_ms": round(elapsed, 2)
        }

model_manager = ModelManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时连接Redis
    model_manager.redis_client = redis.Redis(
        host='redis-service', port=6379, decode_responses=True
    )
    yield
    # 关闭时清理
    model_manager.redis_client.close()

app = FastAPI(title="AI Model Service", lifespan=lifespan)

class PredictRequest(BaseModel):
    features: list[float]

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model_manager.model is not None}

@app.post("/predict")
async def predict(request: PredictRequest):
    try:
        result = model_manager.predict(request.features)
        return JSONResponse(content=result)
    except Exception as e:
        logging.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
async def metrics():
    return {
        "service": "ai-model-service",
        "model_loaded": model_manager.model is not None,
        "redis_connected": model_manager.redis_client is not None
    }
```

## 第二步：Kubernetes部署配置

### Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-model-service
  labels:
    app: ai-model
    version: v1
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: ai-model
  template:
    metadata:
      labels:
        app: ai-model
        version: v1
    spec:
      containers:
      - name: ai-model
        image: your-registry/ai-model-service:latest
        ports:
        - containerPort: 8000
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        env:
        - name: MODEL_PATH
          value: "/app/models/classifier.pkl"
        - name: REDIS_HOST
          value: "redis-service"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
        volumeMounts:
        - name: model-storage
          mountPath: /app/models
      volumes:
      - name: model-storage
        persistentVolumeClaim:
          claimName: model-pvc
```

### Service + Ingress

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-model-service
spec:
  selector:
    app: ai-model
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-model-ingress
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  rules:
  - host: ai-api.yourdomain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ai-model-service
            port:
              number: 80
```

### HPA自动扩缩容

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-model-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-model-service
  minReplicas: 2
  maxReplicas: 10
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
      stabilizationWindowSeconds: 30
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

## 第三步：部署与验证

```bash
# 构建并推送镜像
docker build -t your-registry/ai-model-service:v1.0 .
docker push your-registry/ai-model-service:v1.0

# 部署到K8s
kubectl apply -f k8s/

# 验证部署状态
kubectl get pods -l app=ai-model
kubectl get svc ai-model-service
kubectl get hpa

# 测试API
kubectl port-forward svc/ai-model-service 8000:80 &
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"features": [1.2, 3.4, 5.6, 7.8]}'
```

## 第四步：监控与告警

### Prometheus配置

```yaml
# k8s/prometheus-monitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ai-model-monitor
spec:
  selector:
    matchLabels:
      app: ai-model
  endpoints:
  - port: http
    path: /metrics
    interval: 15s
```

### Grafana告警规则

```yaml
# k8s/alert-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ai-model-alerts
spec:
  groups:
  - name: ai-model.rules
    rules:
    - alert: HighLatency
      expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "AI模型服务P95延迟超过1秒"
    - alert: HighErrorRate
      expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
      for: 2m
      labels:
        severity: critical
      annotations:
        summary: "AI模型服务错误率超过5%"
    - alert: PodRestart
      expr: rate(kube_pod_container_status_restarts_total[15m]) > 0
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "AI模型Pod频繁重启"
```

## 独家最佳实践

### 1. 模型文件管理

不要将大模型文件打包到Docker镜像中，使用共享存储：

```yaml
# 使用NAS存储模型文件
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: model-pvc
spec:
  accessModes: ["ReadWriteMany"]
  storageClassName: nfs
  resources:
    requests:
      storage: 50Gi
```

### 2. GPU资源调度

```yaml
# GPU节点配置
spec:
  containers:
  - name: ai-model-gpu
    resources:
      limits:
        nvidia.com/gpu: 1
  nodeSelector:
    accelerator: nvidia-tesla-t4
```

### 3. 金丝雀发布

```yaml
# 使用Istio进行金丝雀发布
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: ai-model-vsvc
spec:
  hosts:
  - ai-api.yourdomain.com
  http:
  - route:
    - destination:
        host: ai-model-service
        subset: v1
      weight: 90
    - destination:
        host: ai-model-service
        subset: v2
      weight: 10
```

## 结语

Kubernetes为AI模型部署提供了企业级的可靠性和弹性。通过合理的资源配置、自动扩缩容和完善的监控体系，你可以构建一个高可用、高性能的AI推理服务。

> 💡 **关注我的博客**，获取更多MLOps和云原生实战教程！
