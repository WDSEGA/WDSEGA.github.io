---
layout: post
title: "Python Logging in 2026: 10 Practices That Actually Matter for Production"
date: 2026-06-12
tags: [python, logging, backend, devops]
description: "Not all Python logging advice is equal. These 10 practices focus on what matters in production: structured output, context propagation, log levels that mean something, and avoiding the traps that bite teams at 2 AM."
canonical_url: "https://wdsega.github.io/python-logging-best-practices-production-2026"
---

The Python `logging` module has been around since Python 2.3. The documentation is thorough. The tutorials are everywhere. And yet production logging is still where most Python applications have their worst technical debt.

The reason is straightforward: logging feels like boilerplate until an incident forces you to actually read logs, at which point you discover your logs are useless.

Here are 10 practices that will make your logs useful before that moment arrives.

## 1. Use Structured Logging From the Start

Plain text logs are for humans. Structured logs are for humans *and* every log aggregation tool you'll ever use.

```python
import structlog

log = structlog.get_logger()
log.info("payment_processed", 
         user_id=user.id, 
         amount=order.total, 
         currency="USD",
         order_id=order.id)
```

When a query surfaces 10,000 events and you need to filter by `user_id`, structured logs are the difference between a 30-second query and a 30-minute grep session. Start structured. Never go back.

## 2. Set Log Levels That Mean Something

The standard Python log levels work when you respect their semantics:

- `DEBUG`: Verbose internals. Off in production.
- `INFO`: Normal events worth recording. A request completed, a job ran.
- `WARNING`: Something unexpected that you recovered from. A rate limit was hit, a retry succeeded.
- `ERROR`: Something failed that shouldn't have. The operation didn't complete.
- `CRITICAL`: The application cannot continue. Reserved for genuine emergencies.

The mistake teams make is using `ERROR` for anything that looks wrong and using `WARNING` for nothing. You end up with ERROR logs that don't actually need attention and alert fatigue sets in within a month.

## 3. Propagate Request Context Automatically

In a web application, every log entry should include the request ID, user ID, and any other context that helps you reconstruct what was happening. The worst way to do this is passing context through every function call.

Use `contextvars`:

```python
import contextvars
import uuid

request_id_var = contextvars.ContextVar('request_id', default=None)

# In middleware
request_id_var.set(str(uuid.uuid4()))

# In any function downstream
log.info("operation_complete", request_id=request_id_var.get())
```

With structlog, you can bind this context automatically so it appears in every log entry without any per-function boilerplate.

## 4. Never Log Sensitive Data

This sounds obvious. It is obvious. It still happens.

Passwords, API keys, full credit card numbers, social security numbers, and PII don't belong in logs. The problem is usually indirect: you log a request object and it serializes more than you intended.

Audit your log output in staging before shipping to production. A quick scan for "password", "token", "secret", and "ssn" in your log pipeline saves you an incident.

## 5. Use Separate Handlers for Different Destinations

The logging module lets you send log output to multiple destinations simultaneously. Use this.

```python
import logging

logger = logging.getLogger()
# Console for development
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)

# File for persistence
file_handler = logging.FileHandler('app.log')
file_handler.setLevel(logging.INFO)

# Error-only log for alerting
error_handler = logging.FileHandler('errors.log')
error_handler.setLevel(logging.ERROR)

logger.addHandler(console_handler)
logger.addHandler(file_handler)
logger.addHandler(error_handler)
```

This separation means you can tail the error log during an incident without noise from INFO-level events.

## 6. Include Timing in Operations That Might Slow Down

You will eventually need to prove that a specific operation was slow on a specific date. If you didn't log timing data, you're reconstructing from memory.

```python
import time

start = time.monotonic()
result = expensive_operation()
elapsed = time.monotonic() - start

log.info("database_query_complete", 
         query_name="user_lookup",
         duration_ms=round(elapsed * 1000, 2),
         result_count=len(result))
```

This takes four extra lines. The ROI is measured in hours saved during the next performance investigation.

## 7. Handle Third-Party Library Logs

Popular libraries — SQLAlchemy, requests, boto3 — emit their own log output. By default, if you're not actively managing their log levels, they either flood your logs with DEBUG output or stay completely silent when they should be warning you.

Set them explicitly:

```python
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
logging.getLogger('urllib3').setLevel(logging.WARNING)
logging.getLogger('boto3').setLevel(logging.WARNING)
```

## 8. Log at Exception Boundaries, Not Everywhere

Every `except` block that swallows an exception silently is a future debugging nightmare. Log at the boundary:

```python
try:
    result = process_payment(order)
except PaymentGatewayError as e:
    log.error("payment_failed", 
               order_id=order.id,
               error=str(e),
               error_type=type(e).__name__,
               exc_info=True)  # Includes full stack trace
    raise
```

The `exc_info=True` flag writes the full stack trace to the log entry. Without it, you have a logged error with no stack trace, which is only marginally better than no log at all.

## 9. Rotate Log Files

Logs that write to a single file indefinitely will eventually fill your disk. Use `RotatingFileHandler`:

```python
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler(
    'app.log',
    maxBytes=50 * 1024 * 1024,  # 50MB
    backupCount=10               # Keep 10 rotated files
)
```

Five minutes of setup prevents a production outage caused by a full disk.

## 10. Test Your Logging Configuration

Log configuration rarely gets tested. It should. At minimum, verify that:

1. Your production log level is what you think it is
2. Sensitive data isn't leaking into your logs
3. Log output reaches your aggregation system
4. High-severity events trigger alerts

A 15-minute quarterly audit of your logging setup is worth more than the time you'll spend debugging without it.

---

*For teams that need deeper log analysis capabilities — pattern detection, anomaly flagging, incident timeline reconstruction — [LogAnalysis Pro](https://payhip.com/b/4oNHy) bundles those tools into an offline Python package designed for exactly this kind of production log work.*
