---
layout: post
title: "Docker+Kubernetes部署AI模型：从开发到生产的MLOps实战指南"
date: 2026-05-27
categories: [Docker, Kubernetes, AI, DevOps]
tags: [代码产品]
image: /assets/images/docker-ai-mlops-guide.jpg
---

## 为什么AI模型部署如此困难？

将一个训练好的AI模型从Jupyter Notebook推向生产环境，往往是整个机器学习生命周期中最具挑战性的环节。模型推理需要处理GPU资源调度、高并发请求、版本管理、灰度发布、监控告警等一系列运维问题。

![Docker与Kubernetes MLOps架构](/assets/images/docker-ai-mlops-guide.jpg)

本文将手把手带你完成从容器化AI模型到Kubernetes集群部署的全流程，构建一套生产级的MLOps部署方案。

## 整体架构概览

```
┌─────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                 │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Ingress  │→ │ Service  │→ │ Model Deployment │   │
│  │ Controller│  │ (LB)     │  │ (Pods + GPU)     │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│                                      ↓               │
│                              ┌──────────────┐        │
│                              │ Prometheus   │        │
│                              │ + Grafana    │        │
│                              └──────────────┘        │
└─────────────────────────────────────────────────────┘
```

## 第一步：容器化AI模型

### 编写FastAPI推理服务

首先，我们创建一个基于FastAPI的模型推理服务：

```python
# app/main.py
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import numpy as np
import logging
import time
from typing import List, Optional
import mlflow
import os

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Model Serving",
    version="1.0.0",
    docs_url="/docs",
)

# 全局模型实例
model = None
model_version = os.getenv("MODEL_VERSION", "latest")


class PredictionRequest(BaseModel):
    """预测请求"""
    features: List[float] = Field(..., description="输入特征向量")
    model_version: Optional[str] = Field(None, description="指定模型版本")


class PredictionResponse(BaseModel):
    """预测响应"""
    prediction: float
    confidence: float
    model_version: str
    latency_ms: float


class BatchPredictionRequest(BaseModel):
    """批量预测请求"""
    batch_features: List[List[float]] = Field(..., description="批量输入特征")
    model_version: Optional[str] = Field(None, description="指定模型版本")


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str
    model_loaded: bool
    model_version: str
    gpu_available: bool


@app.on_event("startup")
async def load_model():
    """启动时加载模型"""
    global model
    try:
        # 从MLflow或本地路径加载模型
        model_path = os.getenv("MODEL_PATH", "./models/model.pkl")
        logger.info(f"正在加载模型: {model_path}")

        # 模拟模型加载（实际项目中替换为真实模型）
        model = {"version": model_version, "loaded": True}
        logger.info(f"模型加载成功，版本: {model_version}")
    except Exception as e:
        logger.error(f"模型加载失败: {e}")
        raise


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康检查端点"""
    import torch
    gpu_available = torch.cuda.is_available()
    return HealthResponse(
        status="healthy" if model else "unhealthy",
        model_loaded=model is not None,
        model_version=model_version,
        gpu_available=gpu_available,
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    """单条预测"""
    if not model:
        raise HTTPException(status_code=503, detail="模型未加载")

    start_time = time.time()

    try:
        features = np.array(request.features).reshape(1, -1)

        # 模拟推理（替换为真实模型推理逻辑）
        prediction = float(np.random.random())
        confidence = float(np.random.uniform(0.7, 0.99))

        latency = (time.time() - start_time) * 1000

        logger.info(
            f"预测完成 - 延迟: {latency:.2f}ms, "
            f"结果: {prediction:.4f}"
        )

        return PredictionResponse(
            prediction=prediction,
            confidence=confidence,
            model_version=model_version,
            latency_ms=round(latency, 2),
        )
    except Exception as e:
        logger.error(f"预测失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/predict/batch")
async def batch_predict(request: BatchPredictionRequest):
    """批量预测"""
    if not model:
        raise HTTPException(status_code=503, detail="模型未加载")

    start_time = time.time()
    results = []

    try:
        batch = np.array(request.batch_features)

        for features in batch:
            prediction = float(np.random.random())
            results.append({
                "prediction": prediction,
                "confidence": float(np.random.uniform(0.7, 0.99)),
            })

        latency = (time.time() - start_time) * 1000
        logger.info(
            f"批量预测完成 - 数量: {len(results)}, "
            f"延迟: {latency:.2f}ms"
        )

        return {
            "predictions": results,
            "model_version": model_version,
            "total_latency_ms": round(latency, 2),
        }
    except Exception as e:
        logger.error(f"批量预测失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```

### 编写Dockerfile

AI模型的Dockerfile需要特别注意层缓存和镜像体积：

```dockerfile
# Dockerfile
# ===== 阶段1: 构建依赖 =====
FROM python:3.11-slim AS builder

WORKDIR /build

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 安装Python依赖（利用Docker层缓存）
COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# ===== 阶段2: 运行时镜像 =====
FROM python:3.11-slim AS runtime

# 安装CUDA运行时（GPU推理需要）
# 如果不需要GPU，可以移除以下行并使用更小的基础镜像
ENV CUDA_VERSION=12.4.0
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 从构建阶段复制Python包
COPY --from=builder /install /usr/local

WORKDIR /app

# 复制应用代码
COPY app/ ./app/
COPY models/ ./models/

# 创建非root用户
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# 环境变量
ENV PYTHONUNBUFFERED=1
ENV MODEL_PATH=/app/models
ENV MODEL_VERSION=1.0.0

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令（使用uvicorn提升并发性能）
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--workers", "2", "--log-level", "info"]
```

### 依赖文件

```txt
# requirements.txt
fastapi==0.115.0
uvicorn[standard]==0.30.0
numpy>=1.26.0
scikit-learn>=1.5.0
torch>=2.3.0
mlflow>=2.15.0
prometheus-fastapi-instrumentator>=7.0.0
python-multipart==0.0.9
```

## 第二步：Kubernetes部署

### GPU节点配置

首先确保Kubernetes集群已安装GPU插件：

```yaml
# gpu-node-label.yaml
# 为GPU节点打标签，用于Pod调度
apiVersion: v1
kind: Node
metadata:
  name: gpu-node-01
  labels:
    node-type: gpu
    gpu-type: nvidia-a100
    nvidia.com/gpu.present: "true"
```

### Deployment配置

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-model-service
  namespace: ml-serving
  labels:
    app: ai-model-service
    version: v1
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1          # 滚动更新时最多多出1个Pod
      maxUnavailable: 0    # 更新时不允许有Pod不可用
  selector:
    matchLabels:
      app: ai-model-service
  template:
    metadata:
      labels:
        app: ai-model-service
        version: v1
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8000"
        prometheus.io/path: "/metrics"
    spec:
      # GPU资源限制
      nodeSelector:
        node-type: gpu
      tolerations:
        - key: nvidia.com/gpu
          operator: Exists
          effect: NoSchedule
      containers:
        - name: model-server
          image: your-registry.com/ai-model-service:v1.0.0
          imagePullPolicy: IfNotPresent
          ports:
            - containerPort: 8000
              protocol: TCP
          env:
            - name: MODEL_PATH
              value: "/app/models"
            - name: MODEL_VERSION
              valueFrom:
                configMapKeyRef:
                  name: model-config
                  key: model-version
            - name: LOG_LEVEL
              value: "info"
          resources:
            requests:
              cpu: "2"
              memory: "4Gi"
              nvidia.com/gpu: "1"    # 请求1块GPU
            limits:
              cpu: "4"
              memory: "8Gi"
              nvidia.com/gpu: "1"    # 限制最多1块GPU
          # 就绪探针
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3
          # 存活探针
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 60
            periodSeconds: 30
            failureThreshold: 5
          # 启动探针（给模型加载更多时间）
          startupProbe:
            httpGet:
              path: /health
              port: 8000
            failureThreshold: 30
            periodSeconds: 10
          volumeMounts:
            - name: model-storage
              mountPath: /app/models
              readOnly: true
      volumes:
        - name: model-storage
          persistentVolumeClaim:
            claimName: model-pvc
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: model-config
  namespace: ml-serving
data:
  model-version: "1.0.0"
  batch-size: "32"
  max-workers: "4"
```

### Service与Ingress配置

```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ai-model-service
  namespace: ml-serving
spec:
  type: ClusterIP
  selector:
    app: ai-model-service
  ports:
    - port: 80
      targetPort: 8000
      protocol: TCP
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ai-model-ingress
  namespace: ml-serving
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.yourdomain.com
      secretName: api-tls-secret
  rules:
    - host: api.yourdomain.com
      http:
        paths:
          - path: /v1/predict
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
  namespace: ml-serving
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-model-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    # 基于CPU使用率扩缩
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    # 基于自定义指标（推理延迟）扩缩
    - type: Pods
      pods:
        metric:
          name: inference_latency_p99
        target:
          type: AverageValue
          averageValue: "500ms"
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 50
          periodSeconds: 120
```

## 第三步：监控与可观测性

### Prometheus指标采集

在FastAPI应用中添加Prometheus指标：

```python
# app/metrics.py
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter, Histogram, Gauge
import time

# 自定义指标
PREDICTION_COUNT = Counter(
    "model_predictions_total",
    "Total number of predictions",
    ["model_version", "status"]
)
PREDICTION_LATENCY = Histogram(
    "model_prediction_latency_seconds",
    "Prediction latency in seconds",
    ["model_version"],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)
MODEL_INFERENCE_ACTIVE = Gauge(
    "model_inference_active",
    "Number of active inference requests"
)
GPU_MEMORY_USAGE = Gauge(
    "gpu_memory_usage_bytes",
    "GPU memory usage in bytes",
    ["gpu_id"]
)


def setup_metrics(app):
    """配置Prometheus指标采集"""
    Instrumentator().instrument(app).expose(app, endpoint="/metrics")
```

### Grafana监控面板

关键监控指标包括：

- **请求量**：QPS、成功率、错误率
- **延迟**：P50/P95/P99推理延迟
- **资源使用**：CPU、内存、GPU显存利用率
- **模型指标**：预测分布、置信度分布
- **系统指标**：Pod重启次数、OOM事件

## 第四步：CI/CD流水线

```yaml
# .github/workflows/ml-deploy.yaml
name: ML Model CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'app/**'
      - 'models/**'
      - 'Dockerfile'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run unit tests
        run: pytest tests/ -v --cov=app
      - name: Run model validation
        run: python scripts/validate_model.py

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: |
          docker build -t your-registry.com/ai-model-service:${{ github.sha }} .
      - name: Push to registry
        run: |
          echo ${{ secrets.REGISTRY_PASSWORD }} | docker login your-registry.com -u ${{ secrets.REGISTRY_USER }} --password-stdin
          docker push your-registry.com/ai-model-service:${{ github.sha }}

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          kubectl set image deployment/ai-model-service \
            model-server=your-registry.com/ai-model-service:${{ github.sha }} \
            -n ml-staging
      - name: Run smoke tests
        run: python scripts/smoke_test.py --env staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Canary deployment (20% traffic)
        run: |
          kubectl set image deployment/ai-model-service-canary \
            model-server=your-registry.com/ai-model-service:${{ github.sha }} \
            -n ml-serving
      - name: Wait for canary validation
        run: sleep 300
      - name: Full rollout
        run: |
          kubectl set image deployment/ai-model-service \
            model-server=your-registry.com/ai-model-service:${{ github.sha }} \
            -n ml-serving
```

## 成本优化策略

GPU资源昂贵，以下是几个关键的优化方向：

1. **自动扩缩容**：设置合理的HPA策略，低峰期自动缩减副本数
2. **GPU共享**：使用NVIDIA MIG技术将A100切分为多个小GPU实例
3. **模型量化**：使用INT8/FP16量化减少显存占用，提升吞吐量
4. **请求批处理**：在服务端实现动态批处理，提高GPU利用率
5. **Spot实例**：非关键推理任务使用云厂商的Spot实例降低成本

```python
# 动态批处理示例
from collections import deque
import asyncio
import threading

class DynamicBatcher:
    """动态批处理推理引擎"""

    def __init__(self, model, max_batch_size=32, max_wait_ms=50):
        self.model = model
        self.max_batch_size = max_batch_size
        self.max_wait_ms = max_wait_ms
        self.queue = deque()
        self.lock = threading.Lock()

    async def predict(self, features):
        """提交推理请求，等待批处理结果"""
        future = asyncio.get_event_loop().create_future()
        with self.lock:
            self.queue.append((features, future))
            if len(self.queue) >= self.max_batch_size:
                self._process_batch()
        return await future

    def _process_batch(self):
        """处理一批请求"""
        batch = []
        while self.queue and len(batch) < self.max_batch_size:
            batch.append(self.queue.popleft())

        features_list = [item[0] for item in batch]
        futures = [item[1] for item in batch]

        # 批量推理
        results = self.model.predict_batch(features_list)

        # 分发结果
        for future, result in zip(futures, results):
            future.set_result(result)
```

## 总结

本文覆盖了AI模型从容器化到Kubernetes生产部署的完整链路。关键要点：

1. **多阶段构建**的Dockerfile能有效减小镜像体积并利用层缓存
2. **GPU资源管理**是AI部署的核心挑战，需要合理配置requests和limits
3. **滚动更新与金丝雀发布**确保模型升级的平滑过渡
4. **完善的监控体系**（Prometheus + Grafana）是生产环境不可或缺的
5. **CI/CD流水线**实现从代码提交到生产部署的自动化
6. **成本优化**需要从资源调度、模型优化、基础设施多个维度入手

MLOps不是一次性工程，而是一个持续迭代优化的过程。建议团队根据实际业务需求和资源情况，逐步完善部署体系，从简单的单模型服务开始，逐步演进到多模型、多版本、自动化的成熟MLOps平台。
