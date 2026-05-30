---
layout: post
title: "机器学习工程化：MLOps最佳实践指南"
date: 2026-05-30 17:00:00 +0800
categories: [机器学习, MLOps, 工程化]
tags: [mlops, machine-learning, mlflow, kubeflow]
image: /assets/images/mlops.jpg
---

## 引言

模型训练只是ML项目的一小部分。真正的挑战在于模型部署、监控、迭代。本文介绍MLOps最佳实践。

## MLOps生命周期

```
数据准备 → 模型训练 → 模型评估 → 模型部署 → 监控 → 重新训练
```

## 1. 实验跟踪 - MLflow

```python
import mlflow
import mlflow.sklearn
from sklearn.ensemble import RandomForestClassifier

# 设置实验
mlflow.set_experiment("customer_churn")

with mlflow.start_run():
    # 记录参数
    mlflow.log_param("n_estimators", 100)
    mlflow.log_param("max_depth", 10)
    
    # 训练模型
    model = RandomForestClassifier(n_estimators=100, max_depth=10)
    model.fit(X_train, y_train)
    
    # 评估
    accuracy = model.score(X_test, y_test)
    
    # 记录指标
    mlflow.log_metric("accuracy", accuracy)
    mlflow.log_metric("f1_score", f1_score(y_test, model.predict(X_test)))
    
    # 保存模型
    mlflow.sklearn.log_model(model, "model")
    
    # 记录数据版本
    mlflow.log_artifact("data/preprocessed.csv")
```

## 2. 数据版本控制 - DVC

```bash
# 初始化DVC
dvc init

# 跟踪数据文件
dvc add data/raw.csv

# 提交到Git
git add data/raw.csv.dvc .gitignore
git commit -m "Add raw data"

# 推送到远程存储
dvc remote add -d myremote s3://my-bucket/dvc-storage
dvc push
```

## 3. 模型服务化

### Flask API

```python
from flask import Flask, request, jsonify
import pickle
import numpy as np

app = Flask(__name__)

# 加载模型
with open("model.pkl", "rb") as f:
    model = pickle.load(f)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json
    features = np.array(data["features"])
    prediction = model.predict(features.reshape(1, -1))
    return jsonify({"prediction": int(prediction[0])})

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

### FastAPI + 异步

```python
from fastapi import FastAPI
from pydantic import BaseModel
import asyncio

app = FastAPI()

class PredictionRequest(BaseModel):
    features: list[float]

class PredictionResponse(BaseModel):
    prediction: float
    confidence: float

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    # 异步预测
    prediction = await model.predict_async(request.features)
    confidence = await model.predict_proba_async(request.features)
    
    return PredictionResponse(
        prediction=prediction,
        confidence=confidence.max()
    )
```

## 4. 模型监控

### 性能监控

```python
import prometheus_client as prom

# 定义指标
prediction_counter = prom.Counter(
    'model_predictions_total',
    'Total predictions made'
)

prediction_latency = prom.Histogram(
    'model_prediction_latency_seconds',
    'Prediction latency'
)

drift_gauge = prom.Gauge(
    'model_feature_drift',
    'Feature drift score',
    ['feature_name']
)

@prediction_latency.time()
def predict_with_monitoring(features):
    prediction_counter.inc()
    result = model.predict(features)
    return result

def check_drift(new_data, reference_data):
    for feature in new_data.columns:
        drift_score = calculate_drift(
            new_data[feature],
            reference_data[feature]
        )
        drift_gauge.labels(feature_name=feature).set(drift_score)
```

### 数据漂移检测

```python
from scipy import stats

def detect_drift(reference, current, threshold=0.05):
    """检测数据漂移"""
    drift_detected = {}
    
    for col in reference.columns:
        # KS检验
        stat, p_value = stats.ks_2samp(
            reference[col],
            current[col]
        )
        
        drift_detected[col] = {
            "statistic": stat,
            "p_value": p_value,
            "drift": p_value < threshold
        }
    
    return drift_detected
```

## 5. CI/CD for ML

```yaml
# .github/workflows/ml-pipeline.yml
name: ML Pipeline

on:
  push:
    branches: [main]

jobs:
  train:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: pip install -r requirements.txt
      
      - name: Run training
        run: python train.py
      
      - name: Run tests
        run: pytest tests/
      
      - name: Register model
        run: python register_model.py
      
  deploy:
    needs: train
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # 部署逻辑
          kubectl apply -f deployment.yaml
```

## 6. A/B测试

```python
import random

class ABTestRouter:
    def __init__(self, model_a, model_b, ratio=0.5):
        self.model_a = model_a
        self.model_b = model_b
        self.ratio = ratio
    
    def predict(self, features, user_id):
        # 基于用户ID决定使用哪个模型
        if self._should_use_b(user_id):
            return self.model_b.predict(features)
        return self.model_a.predict(features)
    
    def _should_use_b(self, user_id):
        # 确定性分配（同一用户总是使用同一模型）
        return hash(user_id) % 100 < self.ratio * 100

# 收集A/B测试结果
def log_ab_result(user_id, model_version, prediction, actual):
    """记录A/B测试结果用于后续分析"""
    log_to_db({
        "user_id": user_id,
        "model_version": model_version,
        "prediction": prediction,
        "actual": actual,
        "timestamp": datetime.now()
    })
```

## 7. 模型版本管理

```python
class ModelRegistry:
    def __init__(self, storage_path):
        self.storage = storage_path
    
    def register(self, model, version, metrics):
        """注册新模型版本"""
        path = f"{self.storage}/v{version}"
        save_model(model, path)
        save_metrics(metrics, f"{path}/metrics.json")
    
    def get(self, version="latest"):
        """获取指定版本模型"""
        if version == "latest":
            version = self._get_latest_version()
        
        path = f"{self.storage}/v{version}"
        return load_model(path)
    
    def promote(self, version, stage):
        """将模型提升到指定阶段"""
        # staging -> production
        update_model_stage(version, stage)
```

## 总结

MLOps核心组件：

| 组件 | 工具 |
|------|------|
| 实验跟踪 | MLflow, Weights & Biases |
| 数据版本 | DVC |
| 模型服务 | Flask, FastAPI, TensorFlow Serving |
| 监控 | Prometheus, Grafana |
| CI/CD | GitHub Actions, Jenkins |
| 编排 | Kubeflow, Airflow |

> 💡 **工具推荐**：如果你需要监控ML模型性能，可以试试**PriceSentinel Pro**——一个轻量级监控工具，支持实时指标追踪和告警。

---

*本文首发于 [WD Tech Blog](https://wdsega.github.io)，转载请注明出处。*
