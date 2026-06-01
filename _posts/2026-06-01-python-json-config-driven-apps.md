---
layout: post
title: "Building Config-Driven Python Applications with JSON"
date: 2026-06-01 15:00:00 +0800
categories: [Python, Architecture, Tutorial]
tags: [python, json, configuration, bestpractices]
image: /assets/images/ai-tools.jpg
---

Hardcoding values in your Python scripts is a fast path to maintenance headaches. When a deadline changes, a database moves, or a new feature flag needs toggling, you do not want to hunt through source code to find the right variable to update. The solution is simple: drive your application behavior with JSON configuration files.

In this article, I will show you how to build a robust, config-driven Python application from scratch.

## Why JSON for Configuration?

JSON strikes a great balance for Python configuration:

- **Human-readable**: Easy to edit without special tools
- **Language-agnostic**: Share configs across services written in different languages
- **Standard library support**: No extra dependencies required
- **Nested structure**: Supports complex configuration hierarchies naturally

## The Configuration File

Start by designing a clear configuration schema. Here is an example `config.json` for a data processing pipeline:

```json
{
  "app_name": "DataPipeline",
  "version": "2.1.0",
  "debug": false,
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "analytics_db",
    "pool_size": 10,
    "timeout_seconds": 30
  },
  "api": {
    "base_url": "https://api.example.com/v2",
    "rate_limit": 100,
    "retry_attempts": 3,
    "timeout": 15
  },
  "processing": {
    "batch_size": 500,
    "max_workers": 4,
    "log_level": "INFO",
    "output_format": "parquet",
    "allowed_sources": ["csv", "json", "excel"]
  },
  "notifications": {
    "email": {
      "enabled": true,
      "smtp_host": "smtp.gmail.com",
      "smtp_port": 587,
      "recipients": ["team@example.com"]
    },
    "slack": {
      "enabled": false,
      "webhook_url": ""
    }
  }
}
```

## Building the Config Loader

A good config loader should handle file loading, validation, environment overrides, and sensible defaults.

```python
import json
import os
from pathlib import Path
from typing import Any, Dict


class ConfigError(Exception):
    """Raised when configuration is invalid or missing."""
    pass


class AppConfig:
    """Manages application configuration with validation and env overrides."""

    REQUIRED_KEYS = ["database", "api", "processing"]
    DEFAULTS = {
        "debug": False,
        "processing": {
            "batch_size": 100,
            "max_workers": 2,
            "log_level": "WARNING",
        },
        "api": {
            "retry_attempts": 3,
            "timeout": 10,
        },
    }

    def __init__(self, config_path: str = "config.json"):
        self._config = {}
        self._load(config_path)
        self._apply_defaults()
        self._apply_env_overrides()
        self._validate()

    def _load(self, config_path: str) -> None:
        path = Path(config_path)
        if not path.exists():
            raise ConfigError(f"Configuration file not found: {config_path}")
        try:
            with open(path, "r", encoding="utf-8") as f:
                self._config = json.load(f)
        except json.JSONDecodeError as e:
            raise ConfigError(f"Invalid JSON in config file: {e}")

    def _deep_merge(self, base: dict, override: dict) -> dict:
        """Recursively merge override dict into base dict."""
        merged = base.copy()
        for key, value in override.items():
            if key in merged and isinstance(merged[key], dict) and isinstance(value, dict):
                merged[key] = self._deep_merge(merged[key], value)
            else:
                merged[key] = value
        return merged

    def _apply_defaults(self) -> None:
        self._config = self._deep_merge(self.DEFAULTS, self._config)

    def _apply_env_overrides(self) -> None:
        """Override config values with environment variables.
        Format: APP_DB_HOST -> overrides database.host
        """
        env_mapping = {
            "APP_DB_HOST": ("database", "host"),
            "APP_DB_PORT": ("database", "port"),
            "APP_DB_NAME": ("database", "name"),
            "APP_API_URL": ("api", "base_url"),
            "APP_DEBUG": ("debug", None),
        }
        for env_var, key_path in env_mapping.items():
            value = os.environ.get(env_var)
            if value is not None:
                if key_path[1] is None:
                    # Simple key like "debug"
                    typed_value = value.lower() in ("true", "1", "yes")
                    self._config[key_path[0]] = typed_value
                elif key_path[1] == "port":
                    self._config[key_path[0]][key_path[1]] = int(value)
                else:
                    self._config[key_path[0]][key_path[1]] = value

    def _validate(self) -> None:
        for key in self.REQUIRED_KEYS:
            if key not in self._config:
                raise ConfigError(f"Missing required config section: {key}")

    def get(self, *keys: str, default: Any = None) -> Any:
        """Get a nested config value using dot notation path."""
        value = self._config
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return default
        return value

    @property
    def raw(self) -> Dict:
        return self._config

    def __repr__(self) -> str:
        return f"AppConfig(app={self._config.get('app_name', 'Unknown')})"


# Usage
config = AppConfig("config.json")
print(config.get("database", "host"))          # localhost
print(config.get("processing", "batch_size"))    # 500
print(config.get("notifications", "slack", "enabled"))  # False
print(config.get("missing_key", default="N/A"))  # N/A
```

## Using the Config in Your Application

Now wire the configuration into your actual application logic:

```python
import logging
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed


class DataPipeline:
    """A config-driven data processing pipeline."""

    def __init__(self, config: AppConfig):
        self.config = config
        self._setup_logging()

    def _setup_logging(self) -> None:
        level_name = self.config.get("processing", "log_level", default="INFO")
        logging.basicConfig(
            level=getattr(logging, level_name),
            format="%(asctime)s [%(levelname)s] %(message)s",
        )
        self.logger = logging.getLogger(self.config.get("app_name", default="App"))

    def fetch_data(self, endpoint: str) -> list:
        """Fetch data from API with config-driven retry logic."""
        base_url = self.config.get("api", "base_url")
        timeout = self.config.get("api", "timeout", default=10)
        max_retries = self.config.get("api", "retry_attempts", default=3)

        url = f"{base_url}/{endpoint}"
        for attempt in range(max_retries):
            try:
                response = requests.get(url, timeout=timeout)
                response.raise_for_status()
                return response.json()
            except requests.RequestException as e:
                self.logger.warning(
                    f"Attempt {attempt + 1}/{max_retries} failed: {e}"
                )
        raise RuntimeError(f"Failed to fetch {url} after {max_retries} attempts")

    def process_batch(self, items: list) -> list:
        """Process a batch of items using config-driven parallelism."""
        batch_size = self.config.get("processing", "batch_size", default=100)
        max_workers = self.config.get("processing", "max_workers", default=2)

        results = []
        batches = [items[i:i + batch_size] for i in range(0, len(items), batch_size)]

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(self._process_single_batch, batch): idx
                for idx, batch in enumerate(batches)
            }
            for future in as_completed(futures):
                results.extend(future.result())

        return results

    def _process_single_batch(self, batch: list) -> list:
        # Your actual processing logic here
        return [item.upper() if isinstance(item, str) else item for item in batch]


# Initialize and run
if __name__ == "__main__":
    config = AppConfig("config.json")
    pipeline = DataPipeline(config)
    pipeline.logger.info(
        f"Starting pipeline with {config.get('processing', 'max_workers')} workers"
    )
```

## Environment-Specific Configs

For real-world applications, support multiple environments by loading environment-specific overrides:

```python
import json
from pathlib import Path


def load_config_with_env(base_path: str, env: str = None) -> dict:
    """Load base config and merge with environment-specific overrides."""
    env = env or os.environ.get("APP_ENV", "development")

    with open(base_path, "r") as f:
        config = json.load(f)

    env_file = Path(base_path).parent / f"config.{env}.json"
    if env_file.exists():
        with open(env_file, "r") as f:
            env_config = json.load(f)
        # Merge env config on top of base config
        for key, value in env_config.items():
            if isinstance(value, dict) and isinstance(config.get(key), dict):
                config[key] = {**config[key], **value}
            else:
                config[key] = value

    print(f"Loaded config for environment: {env}")
    return config
```

## Key Takeaways

1. **Never hardcode** configuration values in your source code
2. **Validate early** -- fail fast if required config is missing or malformed
3. **Support environment overrides** so the same code works in dev, staging, and production
4. **Use the deep merge pattern** to layer defaults, base config, and env-specific overrides
5. **Provide sensible defaults** so your application works out of the box with minimal config

This pattern scales well from simple scripts to large applications. Once you adopt config-driven development, you will wonder how you ever managed without it.

---
*This article was originally published on my [blog](https://wdsega.github.io). Follow me for more articles on AI, Python, and automation.*
