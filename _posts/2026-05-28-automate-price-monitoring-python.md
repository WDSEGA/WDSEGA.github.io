---
layout: post
title: "How to Automate Price Monitoring with Python"
date: 2026-05-28
categories: [Python, Automation, Web Scraping]
tags: [python, price monitoring, automation, web scraping, ecommerce]
image: /assets/images/python-price-monitoring.jpg
---

Whether you're tracking competitor prices, hunting for deals, or building a side business around price arbitrage, automated price monitoring is one of the most practical Python automation projects you can build.

In this guide, we'll walk through building a complete price monitoring system — from fetching product data to alerting you when prices drop.

## Why Build Your Own Price Monitor?

Commercial price tracking services exist, but they have limitations:

- **Monthly subscriptions** that add up quickly
- **Limited customization** for your specific tracking needs
- **Data ownership concerns** — your data lives on someone else's server
- **API rate limits** that restrict how frequently you can check prices

Building your own gives you full control over frequency, data format, alert thresholds, and notification channels.

## Architecture Overview

A robust price monitoring system consists of several components:

```
Product URLs → Fetcher → Parser → Database → Analyzer → Notifier
```

Let's build each component.

## Step 1: Setting Up the Data Model

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import sqlite3

@dataclass
class PriceRecord:
    product_id: str
    price: float
    currency: str = "USD"
    timestamp: datetime = field(default_factory=datetime.now)
    in_stock: bool = True
    title: Optional[str] = None
    source_url: Optional[str] = None

class PriceDatabase:
    def __init__(self, db_path: str = "prices.db"):
        self.conn = sqlite3.connect(db_path)
        self._init_tables()

    def _init_tables(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT,
                url TEXT UNIQUE,
                category TEXT,
                target_price REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id TEXT,
                price REAL,
                currency TEXT DEFAULT 'USD',
                in_stock INTEGER DEFAULT 1,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (product_id) REFERENCES products(id)
            )
        """)
        self.conn.commit()

    def add_product(self, product_id: str, name: str, url: str,
                    category: str = "", target_price: float = 0):
        self.conn.execute(
            "INSERT OR IGNORE INTO products VALUES (?,?,?,?,?,?)",
            (product_id, name, url, category, target_price, datetime.now())
        )
        self.conn.commit()

    def record_price(self, product_id: str, price: float,
                     in_stock: bool = True):
        self.conn.execute(
            "INSERT INTO price_history (product_id, price, in_stock) VALUES (?,?,?)",
            (product_id, price, int(in_stock))
        )
        self.conn.commit()

    def get_price_history(self, product_id: str, days: int = 30):
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        cursor = self.conn.execute(
            """SELECT price, recorded_at FROM price_history
               WHERE product_id=? AND recorded_at > ?
               ORDER BY recorded_at""",
            (product_id, cutoff)
        )
        return cursor.fetchall()
```

## Step 2: Building the Web Fetcher

Reliable fetching requires handling rate limits, retries, and anti-bot measures.

```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import time
import random

class PriceFetcher:
    def __init__(self, delay_range: tuple = (2, 5)):
        self.session = self._create_session()
        self.delay_range = delay_range
        self.headers = {
            "User-Agent": self._random_user_agent(),
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
        }

    def _create_session(self) -> requests.Session:
        session = requests.Session()
        retry = Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504]
        )
        adapter = HTTPAdapter(max_retries=retry)
        session.mount("https://", adapter)
        session.mount("http://", adapter)
        return session

    def _random_user_agent(self) -> str:
        agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        ]
        return random.choice(agents)

    def fetch(self, url: str) -> Optional[str]:
        time.sleep(random.uniform(*self.delay_range))
        try:
            response = self.session.get(url, headers=self.headers, timeout=15)
            response.raise_for_status()
            return response.text
        except requests.RequestException as e:
            print(f"Failed to fetch {url}: {e}")
            return None
```

## Step 3: Parsing Product Pages

Different e-commerce sites have different HTML structures. Use a strategy pattern to handle multiple sources:

```python
from bs4 import BeautifulSoup
import re

class BaseParser:
    def extract_price(self, html: str) -> Optional[float]:
        raise NotImplementedError

    def extract_title(self, html: str) -> Optional[str]:
        raise NotImplementedError

    def extract_availability(self, html: str) -> bool:
        raise NotImplementedError

class GenericParser(BaseParser):
    """A flexible parser that works with many e-commerce sites."""

    PRICE_SELECTORS = [
        '[data-price]',
        '.price',
        '#price',
        '.product-price',
        '[itemprop="price"]',
        '.current-price',
    ]

    def extract_price(self, html: str) -> Optional[float]:
        soup = BeautifulSoup(html, 'html.parser')

        # Try structured data first
        json_ld = soup.find('script', type='application/ld+json')
        if json_ld:
            try:
                data = json.loads(json_ld.string)
                offers = data.get('offers', {})
                if offers.get('price'):
                    return float(offers['price'])
            except (json.JSONDecodeError, TypeError):
                pass

        # Try CSS selectors
        for selector in self.PRICE_SELECTORS:
            element = soup.select_one(selector)
            if element:
                price_text = element.get_text(strip=True)
                price = self._parse_price_string(price_text)
                if price:
                    return price

        # Fallback: regex search
        match = re.search(r'\$?([\d,]+\.?\d*)', html)
        if match:
            return float(match.group(1).replace(',', ''))

        return None

    def _parse_price_string(self, text: str) -> Optional[float]:
        cleaned = re.sub(r'[^\d.,]', '', text)
        if ',' in cleaned and '.' in cleaned:
            cleaned = cleaned.replace(',', '')
        elif ',' in cleaned:
            cleaned = cleaned.replace(',', '.')
        try:
            return float(cleaned)
        except ValueError:
            return None

    def extract_title(self, html: str) -> Optional[str]:
        soup = BeautifulSoup(html, 'html.parser')
        title_tag = soup.find('h1') or soup.find(
            'meta', property='og:title'
        )
        if title_tag:
            content = title_tag.get('content') or title_tag.get_text()
            return content.strip()[:200]
        return None

    def extract_availability(self, html: str) -> bool:
        soup = BeautifulSoup(html, 'html.parser')
        unavailable_keywords = [
            'out of stock', 'unavailable', 'sold out',
            'currently unavailable'
        ]
        page_text = soup.get_text().lower()
        for keyword in unavailable_keywords:
            if keyword in page_text:
                return False
        return True
```

## Step 4: Price Analysis and Alerts

```python
from dataclasses import dataclass
from typing import List

@dataclass
class PriceAlert:
    product_name: str
    current_price: float
    previous_price: float
    drop_percentage: float
    target_price: Optional[float] = None
    is_target_reached: bool = False

class PriceAnalyzer:
    def __init__(self, db: PriceDatabase):
        self.db = db

    def check_for_alerts(self, threshold: float = 5.0) -> List[PriceAlert]:
        alerts = []
        products = self.db.conn.execute(
            "SELECT id, name, target_price FROM products"
        ).fetchall()

        for product_id, name, target_price in products:
            history = self.db.get_price_history(product_id, days=7)
            if len(history) < 2:
                continue

            current = history[-1][0]
            previous = history[-2][0]

            if previous == 0:
                continue

            drop_pct = ((previous - current) / previous) * 100

            if drop_pct >= threshold:
                alert = PriceAlert(
                    product_name=name,
                    current_price=current,
                    previous_price=previous,
                    drop_percentage=round(drop_pct, 2),
                    target_price=target_price,
                    is_target_reached=(target_price > 0 and current <= target_price)
                )
                alerts.append(alert)

        return alerts

    def get_price_stats(self, product_id: str, days: int = 90):
        history = self.db.get_price_history(product_id, days)
        if not history:
            return None

        prices = [p[0] for p in history]
        return {
            "current": prices[-1],
            "lowest": min(prices),
            "highest": max(prices),
            "average": sum(prices) / len(prices),
            "data_points": len(prices),
        }
```

## Step 5: Notification System

```python
import smtplib
from email.mime.text import MIMEText

class Notifier:
    def __init__(self, email_config: dict = None):
        self.email_config = email_config

    def send_email(self, subject: str, body: str):
        if not self.email_config:
            print(f"[EMAIL] {subject}\n{body}")
            return

        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = self.email_config['from']
        msg['To'] = self.email_config['to']

        with smtplib.SMTP_SSL(
            self.email_config['smtp_server'], 465
        ) as server:
            server.login(
                self.email_config['username'],
                self.email_config['password']
            )
            server.send_message(msg)

    def send_alerts(self, alerts: List[PriceAlert]):
        if not alerts:
            return

        subject = f"Price Drop Alert: {len(alerts)} products"
        body = "\n\n".join(
            f"{a.product_name}\n"
            f"  Price: ${a.previous_price:.2f} → ${a.current_price:.2f}\n"
            f"  Drop: {a.drop_percentage}%"
            for a in alerts
        )
        self.send_email(subject, body)
```

## Step 6: Scheduling with APScheduler

```python
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

class PriceMonitor:
    def __init__(self):
        self.db = PriceDatabase()
        self.fetcher = PriceFetcher()
        self.parser = GenericParser()
        self.analyzer = PriceAnalyzer(self.db)
        self.notifier = Notifier()

    def check_product(self, product_id: str, url: str):
        html = self.fetcher.fetch(url)
        if not html:
            return

        price = self.parser.extract_price(html)
        in_stock = self.parser.extract_availability(html)

        if price:
            self.db.record_price(product_id, price, in_stock)
            print(f"[{product_id}] ${price:.2f} (in stock: {in_stock})")

    def run_all_checks(self):
        products = self.db.conn.execute(
            "SELECT id, url FROM products"
        ).fetchall()

        for product_id, url in products:
            self.check_product(product_id, url)

        alerts = self.analyzer.check_for_alerts(threshold=5.0)
        if alerts:
            self.notifier.send_alerts(alerts)

    def start(self, interval_hours: int = 6):
        scheduler = BlockingScheduler()
        scheduler.add_job(
            self.run_all_checks,
            IntervalTrigger(hours=interval_hours)
        )
        print(f"Price monitor started. Checking every {interval_hours}h")
        scheduler.start()
```

## Advanced: Handling Dynamic Content

Many modern e-commerce sites render prices with JavaScript. For these cases, you'll need a headless browser:

```python
from playwright.sync_api import sync_playwright

class DynamicPriceFetcher:
    def fetch(self, url: str) -> Optional[str]:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            try:
                page.goto(url, wait_until='networkidle')
                page.wait_for_timeout(2000)  # Wait for JS rendering
                return page.content()
            finally:
                browser.close()
```

## Related Tools for Price Monitoring

If you need something more feature-rich than a custom solution, there are several tools worth exploring:

- **Keepa** and **CamelCamelCamel** for Amazon-specific tracking
- **Google Shopping price alerts** for broad coverage
- **PriceSentinel Pro** is a dedicated price monitoring platform that offers real-time tracking, historical price charts, and multi-site comparison. It handles the complexity of anti-bot detection, proxy rotation, and data normalization — things that are time-consuming to build from scratch. It's particularly useful if you need to monitor hundreds of products across multiple retailers.

## Best Practices

1. **Respect robots.txt**: Always check a site's crawling policies
2. **Rate limit your requests**: Space out requests to avoid IP bans
3. **Handle currency conversions**: If tracking international sites
4. **Store historical data**: Price trends are more valuable than single data points
5. **Monitor your monitors**: Set up health checks to ensure your system is running
6. **Use proxies for scale**: Rotate IPs if monitoring many products from the same site

## Conclusion

Building a price monitoring system with Python is both a practical project and an excellent learning exercise. It touches on web scraping, data storage, scheduling, and notification systems — skills that transfer to many other automation projects.

Start simple with a few products, get the basics working, and then iterate. Before you know it, you'll have a system that saves you money and gives you insights into market pricing trends.
