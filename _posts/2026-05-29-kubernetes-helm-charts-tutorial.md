---
layout: post
title: "Kubernetes Helm Charts实战教程：简化K8s应用部署"
date: 2026-05-29 12:00:00 +0800
categories: [Kubernetes, DevOps, 云原生]
tags: [kubernetes, helm, charts, k8s, devops]
image: /assets/images/kubernetes-helm.jpg
liquid: false
---

## 引言

直接编写Kubernetes YAML文件管理应用部署既繁琐又容易出错。Helm作为K8s的包管理工具，可以大大简化这个过程。本文将带你从零开始掌握Helm Charts。

## Helm基础概念

```
Chart → 一个Helm包，包含一组K8s资源模板
Repository → Charts的仓库，类似apt/yum
Release → 运行在K8s集群中的Chart实例
```

## 快速开始

### 安装Helm

```bash
# macOS
brew install helm

# Linux
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# 验证
helm version
```

### 常用命令

```bash
# 添加仓库
helm repo add stable https://charts.helm.sh/stable
helm repo add bitnami https://charts.bitnami.com/bitnami

# 更新仓库
helm repo update

# 搜索Charts
helm search repo nginx

# 安装Chart
helm install my-nginx bitnami/nginx

# 查看Release
helm list

# 升级Release
helm upgrade my-nginx bitnami/nginx

# 回滚
helm rollback my-nginx 1

# 卸载
helm uninstall my-nginx
```

## 创建自己的Chart

### 1. 初始化Chart

```bash
helm create myapp
```

生成的目录结构：
```
myapp/
├── Chart.yaml          # Chart元数据
├── values.yaml         # 默认配置值
├── charts/             # 依赖的Charts
├── templates/          # K8s资源模板
│   ├── _helpers.tpl    # 辅助模板
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   └── hpa.yaml
└── README.md
```

### 2. 配置Chart.yaml

```yaml
apiVersion: v2
name: myapp
description: A Helm chart for Kubernetes
type: application
version: 1.0.0
appVersion: "1.16.0"

# 依赖
dependencies:
  - name: postgresql
    version: 12.x.x
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
  
  - name: redis
    version: 17.x.x
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled

# 维护者信息
maintainers:
  - name: Your Name
    email: your.email@example.com
```

### 3. 编写values.yaml

```yaml
# 应用配置
replicaCount: 3

image:
  repository: myapp
  pullPolicy: IfNotPresent
  tag: "v1.0.0"

# 服务配置
service:
  type: ClusterIP
  port: 80
  targetPort: 8080

# Ingress配置
ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
  hosts:
    - host: myapp.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: myapp-tls
      hosts:
        - myapp.example.com

# 资源限制
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 128Mi

# 自动扩缩容
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80

# 环境变量
env:
  - name: NODE_ENV
    value: production
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: myapp-secrets
        key: database-url

# 数据持久化
persistence:
  enabled: true
  storageClass: standard
  accessMode: ReadWriteOnce
  size: 10Gi
```

### 4. 编写资源模板

#### deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "myapp.fullname" . }}
  labels:
    {{- include "myapp.labels" . | nindent 4 }}
spec:
  {{- if not .Values.autoscaling.enabled }}
  replicas: {{ .Values.replicaCount }}
  {{- end }}
  selector:
    matchLabels:
      {{- include "myapp.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      annotations:
        checksum/config: {{ include (print $.Template.BasePath "/configmap.yaml") . | sha256sum }}
      labels:
        {{- include "myapp.selectorLabels" . | nindent 8 }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
          env:
            {{- toYaml .Values.env | nindent 12 }}
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          volumeMounts:
            - name: data
              mountPath: /app/data
          livenessProbe:
            httpGet:
              path: /health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
      volumes:
        - name: data
          {{- if .Values.persistence.enabled }}
          persistentVolumeClaim:
            claimName: {{ include "myapp.fullname" . }}
          {{- else }}
          emptyDir: {}
          {{- end }}
```

#### _helpers.tpl（辅助模板）

```yaml
{{/* 生成全名 */}}
{{- define "myapp.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/* 生成标签 */}}
{{- define "myapp.labels" -}}
helm.sh/chart: {{ include "myapp.chart" . }}
{{ include "myapp.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/* 选择器标签 */}}
{{- define "myapp.selectorLabels" -}}
app.kubernetes.io/name: {{ include "myapp.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

## 高级技巧

### 1. 条件渲染

```yaml
# 根据条件创建资源
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: {{ include "myapp.fullname" . }}
spec:
  rules:
  {{- range .Values.ingress.hosts }}
  - host: {{ .host | quote }}
    http:
      paths:
      {{- range .paths }}
      - path: {{ .path }}
        pathType: {{ .pathType }}
        backend:
          service:
            name: {{ include "myapp.fullname" $ }}
            port:
              number: {{ $.Values.service.port }}
      {{- end }}
  {{- end }}
{{- end }}
```

### 2. 循环遍历

```yaml
# 批量创建ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "myapp.fullname" . }}-config
data:
  {{- range $key, $value := .Values.config }}
  {{ $key }}: {{ $value | quote }}
  {{- end }}
```

### 3. 使用全局值

```yaml
# values.yaml
global:
  imageRegistry: "my-registry.com"
  storageClass: "fast-ssd"

# templates/deployment.yaml
image: "{{ .Values.global.imageRegistry }}/{{ .Values.image.repository }}:{{ .Values.image.tag }}"
```

### 4. 钩子（Hooks）

```yaml
# 部署前执行数据库迁移
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ include "myapp.fullname" . }}-db-migrate
  annotations:
    "helm.sh/hook": pre-install,pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: db-migrate
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          command: ["npm", "run", "migrate"]
```

## 调试与测试

```bash
# 渲染模板查看结果
helm template myapp ./myapp

# 带values文件渲染
helm template myapp ./myapp -f values-production.yaml

# 检查Chart
helm lint ./myapp

# 干运行（不实际部署）
helm install myapp ./myapp --dry-run --debug

# 打包Chart
helm package ./myapp

# 测试Release
helm test myapp
```

## 多环境管理

```bash
# 目录结构
myapp/
├── values.yaml              # 默认配置
├── values-development.yaml  # 开发环境
├── values-staging.yaml      # 测试环境
└── values-production.yaml   # 生产环境
```

```yaml
# values-production.yaml
replicaCount: 5

resources:
  limits:
    cpu: 2000m
    memory: 2Gi

autoscaling:
  enabled: true
  minReplicas: 5
  maxReplicas: 20
```

部署命令：
```bash
# 开发环境
helm install myapp-dev ./myapp -f values-development.yaml

# 生产环境
helm install myapp-prod ./myapp -f values-production.yaml
```

## 发布到Chart仓库

```bash
# 创建Chart包
helm package ./myapp

# 生成索引
helm repo index . --url https://charts.example.com

# 上传到对象存储（S3/GCS等）
aws s3 cp myapp-1.0.0.tgz s3://my-helm-charts/
aws s3 cp index.yaml s3://my-helm-charts/

# 用户使用
helm repo add myrepo https://charts.example.com
helm install myapp myrepo/myapp
```

## 总结

Helm Charts最佳实践：

1. **合理设计values结构** - 区分必要和可选配置
2. **使用辅助模板** - 保持模板DRY（Don't Repeat Yourself）
3. **添加健康检查** - livenessProbe和readinessProbe
4. **支持水平扩缩容** - HPA配置
5. **多环境配置分离** - values-*.yaml文件
6. **使用Hooks管理生命周期** - 数据库迁移等
7. **Chart版本管理** - 语义化版本控制

> 💡 **工具推荐**：如果你在管理多个K8s集群或需要自动化部署流程，可以试试**FeishuAgent Orchestrator**——一个多Agent协作框架，支持智能任务调度、并行执行和多环境管理，非常适合复杂的DevOps场景。

---

*本文首发于 [WD Tech Blog](https://wdsega.github.io)，转载请注明出处。*
