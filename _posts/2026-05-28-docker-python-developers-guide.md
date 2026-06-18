---
layout: post
title: "Docker for Python Developers: Getting Started"
date: 2026-05-28
categories: [Python, Docker, DevOps]
tags: [代码产品]
image: /assets/images/docker-python-developers.jpg
---

Docker has transformed how Python applications are developed, tested, and deployed. By containerizing your applications, you eliminate "works on my machine" problems, simplify dependency management, and create reproducible environments that work identically everywhere.

This guide is designed for Python developers who want to get started with Docker, covering everything from basic concepts to production-ready configurations.

## Why Docker for Python?

- **Consistent environments**: Development, testing, and production all use the same container
- **Dependency isolation**: No more virtual environment conflicts or system-level package issues
- **Easy onboarding**: New team members get a working environment with a single command
- **Reproducible builds**: The same Docker image always produces the same environment
- **Simplified deployment**: Deploy to any cloud platform that supports containers

## Your First Python Dockerfile

```dockerfile
# Use official Python image as base
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Run the application
CMD ["python", "app.py"]
```

## Building and Running

```bash
# Build the image
docker build -t my-python-app .

# Run the container
docker run -d --name my-app -p 8000:8000 my-python-app

# View logs
docker logs -f my-app

# Stop and remove
docker stop my-app && docker rm my-app
```

## Multi-Stage Builds for Smaller Images

Production images should be as small as possible. Multi-stage builds let you separate build dependencies from runtime:

```dockerfile
# Stage 1: Build
FROM python:3.12-slim AS builder

WORKDIR /build
ENV PYTHONDONTWRITEBYTECODE=1 PIP_NO_CACHE_DIR=1

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libffi-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Stage 2: Runtime
FROM python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH=/root/.local/bin:$PATH

# Copy only installed packages from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY . .

# Run as non-root user
RUN useradd --create-home appuser
USER appuser

EXPOSE 8000
CMD ["python", "app.py"]
```

## Docker Compose for Development

Docker Compose simplifies multi-container development environments:

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - .:/app          # Live code reloading
      - pip-cache:/root/.cache/pip
    environment:
      - DEBUG=true
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d mydb"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  postgres-data:
  redis-data:
  pip-cache:
```

```bash
# Start all services
docker compose up -d

# View logs for all services
docker compose logs -f

# Rebuild and restart
docker compose up -d --build

# Stop everything
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

## Development vs Production Configurations

### Development Dockerfile

```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install dev tools
RUN pip install watchdog flake8 black pytest

# Copy everything and use volume mount for live reload
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Use watchdog for auto-reload
CMD ["watchmedo", "auto-restart", "--directory=/app", "--pattern=*.py", "--recursive", "--", "python", "app.py"]
```

### Production Dockerfile

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /build
RUN pip install --user -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .

RUN useradd --create-home appuser
USER appuser

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--threads", "2", "app:app"]
```

## Docker Compose Override for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.prod
    restart: unless-stopped
    environment:
      - DEBUG=false
    volumes:  # No volume mount in production
      - ./logs:/app/logs
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '1.0'
```

```bash
# Run with production overrides
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Common Patterns

### Running Scripts in Containers

```bash
# One-off commands
docker compose run --rm app python manage.py migrate
docker compose run --rm app python -m pytest tests/
docker compose exec app python manage.py createsuperuser
```

### Using .env Files

```bash
# .env file (never commit this!)
DATABASE_URL=postgresql://user:pass@db:5432/mydb
SECRET_KEY=your-secret-key
DEBUG=true
```

```yaml
# docker-compose.yml
services:
  app:
    env_file:
      - .env
    environment:
      - NODE_ENV=production  # Override specific vars
```

### Data Persistence

```yaml
services:
  app:
    volumes:
      # Named volume for database
      - db-data:/var/lib/postgresql/data
      # Bind mount for config files
      - ./config:/app/config:ro
      # Anonymous volume for dependencies (no host mapping)
      - /app/node_modules

volumes:
  db-data:
```

## Optimization Tips

1. **Order layers wisely**: Copy requirements.txt before application code for better caching
2. **Use .dockerignore**: Exclude unnecessary files (`.git`, `__pycache__`, `*.pyc`, `.env`)
3. **Minimize layers**: Combine RUN commands with `&&`
4. **Use slim images**: `python:3.12-slim` is ~150MB vs ~1GB for the full image
5. **Pin versions**: Use specific image tags, not `latest`
6. **Clean up**: Remove build tools and caches in the same RUN layer

```
# .dockerignore
.git/
__pycache__/
*.pyc
*.pyo
.env
.venv/
*.md
tests/
.vscode/
.idea/
```

## Getting Started Checklist

1. Create a `Dockerfile` for your application
2. Create a `docker-compose.yml` for local development
3. Add a `.dockerignore` file
4. Test locally with `docker compose up`
5. Create a production Dockerfile with multi-stage build
6. Add health checks and resource limits
7. Set up CI/CD to build and push images

Docker is an investment that pays off quickly. Once your team is containerized, you'll spend less time debugging environment issues and more time building features.
