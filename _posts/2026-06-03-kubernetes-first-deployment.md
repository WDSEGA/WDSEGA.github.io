---
layout: post
title: "Kubernetes入门：从零部署你的第一个应用"
date: 2026-06-03 10:00:00 +0800
tags: [kubernetes, docker, devops, 容器编排]
---

Kubernetes（简称K8s）已成为容器编排领域的事实标准，但初学者往往被其复杂的概念体系所困扰。本文将从零开始，带你完成第一个应用的部署，涵盖核心概念、环境搭建和实际操作。

## 一、核心概念速览

在动手之前，先理解几个关键概念：

- **Pod**：K8s的最小调度单元，一个Pod可以包含一个或多个紧密关联的容器。
- **Deployment**：管理Pod的声明式控制器，负责滚动更新和副本管理。
- **Service**：为Pod提供稳定的网络访问入口，解决Pod IP动态变化的问题。
- **Namespace**：资源隔离的虚拟集群，常用于区分开发、测试和生产环境。

这些概念之间的关系可以概括为：Deployment创建并管理Pod，Service为Pod提供访问入口，Namespace则将资源分组隔离。

## 二、环境搭建：minikube快速起步

本地学习推荐使用minikube，它能在单机上搭建完整的K8s集群。

```bash
# 安装minikube（以Linux为例）
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# 启动集群
minikube start --driver=docker

# 验证安装
kubectl get nodes
```

输出应显示一个名为`minikube`的节点，状态为`Ready`。同时安装`kubectl`命令行工具，它是与K8s集群交互的主要方式。

## 三、编写应用与容器化

我们创建一个简单的Flask应用作为部署目标：

```python
# app.py
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/health')
def health():
    return jsonify({"status": "healthy", "service": "demo-api"})

@app.route('/')
def index():
    return jsonify({"message": "Hello from Kubernetes!"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

对应的Dockerfile：

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
EXPOSE 5000

CMD ["python", "app.py"]
```

requirements.txt内容：

```
flask==3.0.0
```

构建并推送镜像（使用minikube内置的Docker守护进程）：

```bash
eval $(minikube docker-env)
docker build -t demo-api:1.0 .
```

## 四、编写K8s资源配置

K8s采用声明式配置，所有资源都通过YAML文件定义。以下是Deployment和Service的完整配置：

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo-api
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: demo-api
  template:
    metadata:
      labels:
        app: demo-api
    spec:
      containers:
      - name: api
        image: demo-api:1.0
        imagePullPolicy: Never
        ports:
        - containerPort: 5000
        resources:
          requests:
            memory: "64Mi"
            cpu: "100m"
          limits:
            memory: "128Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 5
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 3
          periodSeconds: 5
```

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: demo-api-service
  namespace: default
spec:
  selector:
    app: demo-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: NodePort
```

关键配置说明：

- `replicas: 3`：保持3个Pod副本运行，确保高可用。
- `imagePullPolicy: Never`：使用本地镜像，不拉取远程仓库。
- `livenessProbe`：检测容器是否存活，失败则重启容器。
- `readinessProbe`：检测容器是否就绪，未就绪时不接收流量。
- `NodePort`：将服务暴露到节点的某个端口，便于本地访问。

## 五、部署与验证

应用配置到集群：

```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

查看部署状态：

```bash
kubectl get deployments
kubectl get pods
kubectl get svc
```

访问应用：

```bash
minikube service demo-api-service --url
# 输出类似: http://192.168.49.2:30080
curl http://192.168.49.2:30080/
```

如果看到`{"message": "Hello from Kubernetes!"}`，说明部署成功。

## 六、弹性伸缩与滚动更新

K8s的强大之处在于自动化运维。手动扩容只需一条命令：

```bash
kubectl scale deployment demo-api --replicas=5
```

更推荐的方式是使用HorizontalPodAutoscaler（HPA）自动扩缩容：

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: demo-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: demo-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

应用后，K8s会根据CPU使用率自动调整Pod数量，范围在2到10之间。

滚动更新同样简单。修改应用代码后重新构建镜像，然后更新Deployment：

```bash
docker build -t demo-api:2.0 .
kubectl set image deployment/demo-api api=demo-api:2.0
```

K8s会逐个替换旧版本Pod，确保服务不中断。可以通过以下命令观察更新进度：

```bash
kubectl rollout status deployment/demo-api
```

如果更新出现问题，回滚到上一个版本：

```bash
kubectl rollout undo deployment/demo-api
```

## 七、配置管理：ConfigMap与Secret

将配置硬编码在镜像中是不好的实践。K8s提供ConfigMap和Secret来管理配置和敏感信息：

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: demo-config
data:
  APP_ENV: "production"
  LOG_LEVEL: "info"
```

```yaml
# secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: demo-secret
type: Opaque
data:
  # echo -n 'mysecret' | base64
  API_KEY: bXlzZWNyZXQ=
```

在Deployment中引用：

```yaml
spec:
  containers:
  - name: api
    image: demo-api:1.0
    envFrom:
    - configMapRef:
        name: demo-config
    env:
    - name: API_KEY
      valueFrom:
        secretKeyRef:
          name: demo-secret
          key: API_KEY
```

## 八、调试技巧

部署过程中难免遇到问题，以下是常用的调试命令：

```bash
# 查看Pod日志
kubectl logs -f deployment/demo-api

# 进入容器内部
kubectl exec -it deployment/demo-api -- /bin/sh

# 查看Pod详细事件
kubectl describe pod demo-api-xxxx

# 查看Service端点
kubectl get endpoints demo-api-service
```

## 结语

本文覆盖了K8s最核心的日常使用场景：部署应用、暴露服务、健康检查、弹性伸缩、滚动更新和配置管理。掌握这些基础后，你可以进一步学习Ingress、持久化存储、RBAC权限控制等进阶主题。建议在实际项目中多动手实践，K8s的学习曲线虽然陡峭，但一旦入门，其自动化运维能力将极大提升开发效率。
