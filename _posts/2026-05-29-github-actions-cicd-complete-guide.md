---
layout: post
title: "GitHub Actions CI/CD完全指南：从零搭建自动化流水线"
date: 2026-05-29 11:00:00 +0800
categories: [DevOps, CI/CD, GitHub]
tags: [代码产品]
image: /assets/images/github-actions-cicd.jpg
---

## 引言

GitHub Actions是当今最流行的CI/CD工具之一。本文将从基础概念到高级技巧，带你完整掌握GitHub Actions的使用。

## 基础概念

### Workflow文件结构

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

# 触发条件
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'  # 每周日运行

# 环境变量
env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io

# 任务定义
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
      - run: npm ci
      - run: npm test
```

## 实战：完整CI/CD流水线

### 1. 测试阶段

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
        os: [ubuntu-latest, windows-latest]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### 2. 构建阶段

```yaml
  build:
    needs: test
    runs-on: ubuntu-latest
    outputs:
      image_tag: ${{ steps.meta.outputs.tags }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ github.repository }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 3. 部署阶段

```yaml
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    environment: staging
    
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying ${{ needs.build.outputs.image_tag }} to staging"
          # 实际部署命令
          
  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production"
```

## 高级技巧

### 条件执行

```yaml
jobs:
  deploy:
    if: |
      github.event_name == 'push' && 
      github.ref == 'refs/heads/main' && 
      !contains(github.event.head_commit.message, '[skip ci]')
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying..."
```

### 复用Workflow

```yaml
# .github/workflows/reusable-test.yml
name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
      test-command:
        default: 'npm test'
        type: string

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
      - run: npm ci
      - run: ${{ inputs.test-command }}

# 调用方
jobs:
  call-test:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '18'
      test-command: 'npm run test:unit'
```

###  secrets管理

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to ECS
        env:
          DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
          API_KEY: ${{ secrets.API_KEY }}
        run: |
          echo "Deploying with secrets..."
```

### 缓存优化

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # Node.js缓存
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      # Python缓存
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
      
      # Docker缓存
      - uses: docker/build-push-action@v5
        with:
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## 安全最佳实践

```yaml
name: Secure CI/CD

on: push

jobs:
  security:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
    
    steps:
      - uses: actions/checkout@v4
      
      # 依赖漏洞扫描
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      # 代码安全扫描
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2
      
      - name: Autobuild
        uses: github/codeql-action/autobuild@v2
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2
      
      # Secret检测
      - name: Secret Detection
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
```

## 自托管Runner

```yaml
jobs:
  build-on-self-hosted:
    runs-on: self-hosted
    steps:
      - uses: actions/checkout@v4
      - run: |
          # 使用本地资源
          make build
```

配置自托管Runner：
```bash
# 下载runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz \
  -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# 配置
tar xzf actions-runner-linux-x64-2.311.0.tar.gz
./config.sh --url https://github.com/OWNER/REPO --token TOKEN

# 启动
./run.sh
```

## 调试技巧

```yaml
jobs:
  debug:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # 启用调试日志
      - name: Debug info
        run: |
          echo "Event name: ${{ github.event_name }}"
          echo "Ref: ${{ github.ref }}"
          echo "SHA: ${{ github.sha }}"
          echo "Actor: ${{ github.actor }}"
      
      # 使用tmate远程调试
      - name: Setup tmate session
        uses: mxschmitt/action-tmate@v3
        if: ${{ failure() }}
```

## 总结

GitHub Actions的核心要点：

1. **合理设计触发条件** - 避免不必要的运行
2. **使用矩阵构建** - 测试多环境兼容性
3. **善用缓存** - 显著加速构建
4. **分离jobs** - 并行执行提高效率
5. **环境保护** - 生产部署需要审批
6. **安全扫描** - 集成到流水线
7. **复用workflow** - 减少重复配置

> 💡 **工具推荐**：如果你在管理多个GitHub仓库的Actions配置，可以试试我们开发的**FeishuAgent Orchestrator**——一个多Agent协作框架，可以帮助你自动化管理多个项目的CI/CD配置，支持智能任务分配和并行执行。

---

