---
layout: post
title: "Kubernetes for Solo Developers: Running Your Side Projects at Scale"
date: 2026-06-06 08:00:00 +0800
categories: [devops, kubernetes]
tags: [kubernetes, devops, docker, deployment, infrastructure]
author: "WDSEGA"
---

Kubernetes has a reputation for being complex and enterprise-focused, but solo developers can harness its power to run side projects with production-grade reliability. This practical guide will show you how to set up a Kubernetes cluster, deploy applications, manage secrets, and handle scaling without needing a dedicated DevOps team.

## Why Kubernetes for Side Projects?

You might wonder why a solo developer should bother with Kubernetes when platforms like Heroku or Render offer simpler deployment options. The answer lies in cost, flexibility, and skill development. Running a small cluster on a single cloud instance can be significantly cheaper than managed platform fees as your projects grow. More importantly, learning Kubernetes opens doors to better job opportunities and gives you complete control over your infrastructure.

Kubernetes also solves real problems that solo developers face. It handles automatic restarts when your application crashes, manages rolling updates without downtime, and makes it easy to run multiple projects on the same server. Once configured, deploying a new application becomes as simple as applying a YAML file.

## Choosing Your Cluster Setup

For solo developers, a full multi-node cluster is usually overkill. Several lightweight options provide the Kubernetes API without the operational burden.

**Single-Node Cloud Instance**: Rent a single VPS from providers like Hetzner, DigitalOcean, or Vultr. Install a lightweight Kubernetes distribution such as K3s or MicroK8s. This approach costs as little as five dollars per month and can host multiple applications.

**K3s**: Rancher's K3s is designed for resource-constrained environments. It replaces etcd with SQLite by default, bundles essential components into a single binary, and installs in under a minute. For a solo developer, K3s on a single node provides everything you need.

**Local Development with Kind or Minikube**: Use Kind or Minikube for local testing before deploying to production. These tools run Kubernetes inside Docker containers on your development machine, letting you validate configurations without cloud costs.

## Installing K3s on a Single Node

Setting up K3s is remarkably straightforward. On a fresh Ubuntu server, run the following command as root:

```bash
curl -sfL https://get.k3s.io | sh -
```

This installs the Kubernetes control plane, kubelet, and containerd runtime. After installation, configure kubectl to communicate with your cluster:

```bash
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown $(id -u):$(id -g) ~/.kube/config
export KUBECONFIG=~/.kube/config
```

Verify the installation with `kubectl get nodes`. You should see your single node in the Ready state. That is it. You now have a functional Kubernetes cluster.

## Deploying Your First Application

Kubernetes deployments are defined declaratively using YAML manifests. Here is a complete example for deploying a web application with a service to expose it:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 2
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: myregistry/my-app:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
---
apiVersion: v1
kind: Service
metadata:
  name: my-app-service
spec:
  selector:
    app: my-app
  ports:
  - port: 80
    targetPort: 8000
  type: ClusterIP
```

Apply this manifest with `kubectl apply -f deployment.yaml`. Kubernetes will pull your container image, start two replicas, and ensure they keep running. Even on a single node, running multiple replicas provides resilience against application crashes.

## Managing Secrets Securely

Never commit sensitive data like database passwords or API keys to your Git repository. Kubernetes provides a built-in Secret resource for this purpose:

```bash
kubectl create secret generic app-secrets \
  --from-literal=database-url=postgresql://user:pass@host/db \
  --from-literal=api-key=sk-123456789
```

For a more robust solution, consider Sealed Secrets or External Secrets Operator. Sealed Secrets lets you encrypt secrets so they can be safely stored in Git. External Secrets Operator integrates with cloud secret managers like AWS Secrets Manager or HashiCorp Vault, keeping sensitive data out of your cluster entirely.

## Exposing Applications with Ingress

To route traffic from the internet to your applications, you need an Ingress controller. For solo developers, Traefik is an excellent choice because it integrates seamlessly with K3s and automatically discovers new services.

K3s includes Traefik by default, so you only need to define Ingress resources:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: my-app-ingress
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
spec:
  rules:
  - host: myapp.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: my-app-service
            port:
              number: 80
  tls:
  - hosts:
    - myapp.example.com
    secretName: myapp-tls
```

Use cert-manager to automatically obtain and renew Let's Encrypt certificates. Once configured, adding HTTPS to new applications requires only adding the TLS section to your Ingress manifest.

## Persistent Storage with Volumes

Applications that need persistent data, such as databases or file uploads, require Kubernetes volumes. For a single-node setup, local-path-provisioner, which K3s includes by default, creates hostPath volumes dynamically.

For production reliability, attach a block storage volume from your cloud provider. Most major providers offer Kubernetes CSI drivers that integrate with their block storage services. Define a PersistentVolumeClaim, and Kubernetes handles the provisioning:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

## Scaling Strategies

One of Kubernetes' greatest strengths is its ability to scale applications. For solo developers, this means your side project can handle sudden traffic spikes without manual intervention.

**Horizontal Pod Autoscaler** automatically adjusts the number of replicas based on CPU or memory usage:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
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

On a single-node cluster, horizontal scaling is limited by your node's capacity. For solo projects, vertical scaling, increasing CPU and memory limits, is often more practical until you outgrow a single server.

## Monitoring and Logging

Running applications without visibility into their health is risky. Fortunately, excellent open-source tools make monitoring accessible even for solo operators.

**Prometheus and Grafana**: Deploy the kube-prometheus-stack Helm chart to get comprehensive cluster monitoring with minimal configuration. It collects metrics from your nodes, containers, and applications, and provides pre-built dashboards for visualizing resource usage and application performance.

**Loki**: For log aggregation, Grafana Loki is lightweight and easy to set up compared to the Elasticsearch stack. It integrates natively with Grafana, letting you correlate metrics and logs in a single interface.

Set up alerting rules in Prometheus for critical conditions like disk space exhaustion, memory pressure, or application downtime. Route alerts to Slack, email, or PagerDuty so you are notified before users notice problems.

## CI/CD with GitOps

Automate your deployments using GitOps principles. Tools like ArgoCD or Flux continuously synchronize your cluster state with a Git repository. When you push changes to your manifests, the tool automatically applies them to your cluster.

For solo developers, this eliminates manual deployment steps and provides a complete history of infrastructure changes. It also makes disaster recovery trivial. If you lose your server, you can recreate the entire environment by pointing a new cluster at your Git repository.

A simple GitOps workflow looks like this:

1. Push application code to GitHub
2. GitHub Actions builds a container image and pushes it to a registry
3. Update the image tag in your Kubernetes manifests repository
4. ArgoCD detects the change and deploys the new version

## Cost Optimization Tips

Running Kubernetes does not have to be expensive. Here are strategies to keep costs low:

**Use Spot Instances**: Cloud providers offer significant discounts for preemptible instances. Since you are the only user, brief interruptions are acceptable for non-critical workloads.

**Right-Size Your Nodes**: Monitor actual resource usage and adjust your node size accordingly. Solo projects rarely need more than two CPU cores and four gigabytes of memory.

**Schedule Downtime**: For development environments, use tools like kube-downscaler to automatically scale deployments to zero during nights and weekends.

**Share the Cluster**: Run multiple applications on the same cluster. Kubernetes namespaces provide isolation, letting you host your blog, API, and personal projects on a single node.

## Conclusion

Kubernetes is not just for large engineering teams. Solo developers can leverage its power to run side projects with reliability and scalability that rivals enterprise deployments. By starting with a lightweight distribution like K3s, using declarative manifests, and embracing GitOps for automation, you can build an infrastructure that grows with your ambitions.

The initial learning curve is real, but the investment pays dividends. You gain valuable DevOps skills, reduce long-term hosting costs, and build systems that can handle success when your side project becomes the next big thing. Start small, iterate often, and let Kubernetes handle the operational complexity while you focus on building great software.
