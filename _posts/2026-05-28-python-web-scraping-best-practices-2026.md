---
layout: post
title: "Python Web Scraping Best Practices in 2026"
date: 2026-05-28
categories: [Python, Web Scraping, Best Practices]
tags: [代码产品]
image: /assets/images/python-web-scraping-2026.jpg
---

Web scraping has evolved significantly. Modern websites employ sophisticated anti-bot systems, dynamic rendering, and legal protections that make naive scraping approaches ineffective. In 2026, successful web scraping requires a thoughtful combination of technical skill, ethical awareness, and robust engineering practices.

This guide covers the current best practices for Python web scraping, from choosing the right tools to handling the challenges of modern web applications.

## Choosing the Right Tool for the Job

### Static Content: requests + BeautifulSoup

For sites that serve pre-rendered HTML, the classic combination remains the most efficient:

```python
import requests
from bs4 import BeautifulSoup
from bs4.element import Tag

class BasicScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
        })

    def fetch(self, url: str, timeout: int = 15) -> BeautifulSoup:
        response = self.session.get(url, timeout=timeout)
        response.raise_for_status()
        return BeautifulSoup(response.text, 'html.parser')

    def extract_links(self, soup: BeautifulSoup, base_url: str) -> list:
        links = []
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            if href.startswith('/'):
                href = base_url.rstrip('/') + href
            links.append({
                'url': href,
                'text': a_tag.get_text(strip=True)[:100]
            })
        return links
```

### Dynamic Content: Playwright

For JavaScript-rendered pages, Playwright has become the go-to tool in 2026:

```python
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

class DynamicScraper:
    def __init__(self, headless: bool = True):
        self.headless = headless

    def fetch_rendered(self, url: str, wait_for: str = 'networkidle') -> str:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=self.headless)
            context = browser.new_context(
                viewport={'width': 1920, 'height': 1080},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
                           'AppleWebKit/537.36'
            )
            page = context.new_page()

            try:
                page.goto(url, wait_until=wait_for, timeout=30000)

                # Handle lazy loading
                page.evaluate("""
                    () => {
                        window.scrollTo(0, document.body.scrollHeight);
                    }
                """)
                page.wait_for_timeout(1000)

                return page.content()
            except PlaywrightTimeout:
                # Return whatever we have
                return page.content()
            finally:
                browser.close()
```

### APIs First: Check for Official APIs

Before scraping, always check if the site offers an API. Many sites provide public APIs or have data accessible through their mobile apps:

```python
import requests

class APIFirstScraper:
    """Try API endpoints before falling back to HTML scraping."""

    def __init__(self):
        self.session = requests.Session()

    def try_api(self, base_url: str, endpoint: str) -> dict:
        """Attempt to fetch data from a known API pattern."""
        api_patterns = [
            f"{base_url}/api/v1/{endpoint}",
            f"{base_url}/api/{endpoint}",
            f"{base_url}/wp-json/wp/v2/{endpoint}",
        ]

        for api_url in api_patterns:
            try:
                response = self.session.get(api_url, timeout=5)
                if response.status_code == 200:
                    return response.json()
            except requests.RequestException:
                continue

        return None
```

## Robust Request Handling

### Retry with Exponential Backoff

```python
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import time
import random

def create_resilient_session(
    max_retries: int = 3,
    backoff_factor: float = 1.0
) -> requests.Session:
    session = requests.Session()

    retry_strategy = Retry(
        total=max_retries,
        backoff_factor=backoff_factor,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["GET", "HEAD"]
    )

    adapter = HTTPAdapter(
        max_retries=retry_strategy,
        pool_connections=10,
        pool_maxsize=100
    )

    session.mount("https://", adapter)
    session.mount("http://", adapter)
    return session
```

### Rate Limiting

```python
import time
from threading import Lock

class RateLimiter:
    def __init__(self, requests_per_minute: int = 30):
        self.min_interval = 60.0 / requests_per_minute
        self.last_request_time = 0
        self.lock = Lock()

    def wait(self):
        with self.lock:
            now = time.monotonic()
            elapsed = now - self.last_request_time
            if elapsed < self.min_interval:
                sleep_time = self.min_interval - elapsed
                # Add jitter to appear more human-like
                sleep_time += random.uniform(0, sleep_time * 0.3)
                time.sleep(sleep_time)
            self.last_request_time = time.monotonic()
```

### Proxy Rotation

```python
import random

class ProxyRotator:
    def __init__(self, proxies: list):
        self.proxies = proxies
        self.failed = set()
        self.current_index = 0

    def get_proxy(self) -> dict:
        available = [p for p in self.proxies
                     if p not in self.failed]
        if not available:
            self.failed.clear()
            available = self.proxies

        proxy = random.choice(available)
        return {
            'http': f'http://{proxy}',
            'https': f'http://{proxy}'
        }

    def report_failure(self, proxy_url: str):
        self.failed.add(proxy_url)

    def report_success(self, proxy_url: str):
        self.failed.discard(proxy_url)
```

## Data Extraction Best Practices

### Use CSS Selectors Over Regex

```python
class RobustExtractor:
    """Extract data using multiple strategies for resilience."""

    def extract_price(self, soup: BeautifulSoup) -> float | None:
        # Strategy 1: Structured data (JSON-LD)
        json_ld = soup.find('script', type='application/ld+json')
        if json_ld:
            try:
                import json
                data = json.loads(json_ld.string)
                if 'offers' in data and 'price' in data['offers']:
                    return float(data['offers']['price'])
            except (json.JSONDecodeError, KeyError, TypeError):
                pass

        # Strategy 2: Common CSS selectors
        selectors = [
            '[itemprop="price"]',
            '.price-current',
            '[data-price]',
            '.product-price .value',
        ]
        for selector in selectors:
            element = soup.select_one(selector)
            if element:
                text = element.get('content') or element.get_text(strip=True)
                return self._parse_price(text)

        # Strategy 3: Regex fallback
        import re
        match = re.search(r'[\$€£]\s*([\d,]+\.?\d*)', soup.get_text())
        if match:
            return float(match.group(1).replace(',', ''))

        return None

    def _parse_price(self, text: str) -> float | None:
        import re
        cleaned = re.sub(r'[^\d.,]', '', text)
        if not cleaned:
            return None
        if ',' in cleaned and '.' in cleaned:
            cleaned = cleaned.replace(',', '')
        elif ',' in cleaned:
            cleaned = cleaned.replace(',', '.')
        try:
            return float(cleaned)
        except ValueError:
            return None
```

## Handling Anti-Bot Measures

### Browser Fingerprint Evasion

```python
from playwright.sync_api import sync_playwright

def create_stealth_context(playwright):
    """Create a browser context that appears more human."""
    context = playwright.chromium.launch_persistent_context(
        user_data_dir='/tmp/stealth_profile',
        headless=True,
        args=[
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
        ]
    )

    # Remove webdriver flag
    context.add_init_script("""
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined
        });
    """)

    return context
```

### Cookie and Session Management

```python
class SessionManager:
    def __init__(self):
        self.cookies = {}

    def save_cookies(self, response: requests.Response, domain: str):
        self.cookies[domain] = response.cookies.get_dict()

    def load_cookies(self, session: requests.Session, domain: str):
        if domain in self.cookies:
            session.cookies.update(self.cookies[domain])

    def save_to_file(self, filepath: str):
        import json
        with open(filepath, 'w') as f:
            json.dump(self.cookies, f)

    def load_from_file(self, filepath: str):
        import json
        try:
            with open(filepath) as f:
                self.cookies = json.load(f)
        except FileNotFoundError:
            pass
```

## Ethical and Legal Considerations

1. **Check robots.txt**: Always respect `robots.txt` directives
2. **Identify yourself**: Use a descriptive User-Agent with contact information
3. **Rate limit**: Don't overwhelm servers with rapid requests
4. **Respect ToS**: Review the site's Terms of Service
5. **Personal data**: Be careful with PII — comply with GDPR and similar regulations
6. **Copyright**: Scraped content may be copyrighted — understand fair use

## Data Storage and Pipeline

```python
import sqlite3
from datetime import datetime
from typing import Optional

class ScrapeStorage:
    def __init__(self, db_path: str = 'scraped_data.db'):
        self.conn = sqlite3.connect(db_path)
        self._init_db()

    def _init_db(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS scraped_pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT UNIQUE,
                title TEXT,
                content TEXT,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status_code INTEGER,
                metadata JSON
            )
        """)
        self.conn.commit()

    def save(self, url: str, title: str, content: str,
             status_code: int = 200, metadata: dict = None):
        import json
        self.conn.execute(
            """INSERT OR REPLACE INTO scraped_pages
               (url, title, content, status_code, metadata, scraped_at)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (url, title, content, status_code,
             json.dumps(metadata) if metadata else None,
             datetime.now().isoformat())
        )
        self.conn.commit()

    def is_scraped(self, url: str) -> bool:
        cursor = self.conn.execute(
            "SELECT 1 FROM scraped_pages WHERE url=?", (url,)
        )
        return cursor.fetchone() is not None
```

## Conclusion

Web scraping in 2026 requires a multi-layered approach. Start with APIs when available, use requests + BeautifulSoup for static content, and reach for Playwright when JavaScript rendering is needed. Always implement proper rate limiting, error handling, and respect for the target site's policies.

The key to sustainable scraping is building resilient systems that handle failures gracefully, adapt to changes in website structure, and operate within ethical and legal boundaries.
