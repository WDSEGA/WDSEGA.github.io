---
layout: post
title: "SQL性能优化：10个让查询提速100倍的技巧"
date: 2026-06-02 08:00:00 +0800
categories: [数据库, 性能优化]
tags: [代码产品]
image: /assets/images/sql-performance-optimization.jpg
author: 大D
---

"这条SQL怎么这么慢？"这大概是后端开发中最常见的问题之一。很多开发者遇到慢查询就本能地加索引，但索引不是万能药。真正的SQL性能优化需要从查询设计、索引策略、执行计划分析等多个维度入手。这篇文章总结了10个经过实战验证的优化技巧，每个都有具体的代码示例和效果对比。

## 技巧1：用EXPLAIN分析执行计划

优化SQL的第一步不是改代码，而是理解查询是怎么执行的。

```sql
-- 基础EXPLAIN
EXPLAIN SELECT * FROM orders WHERE user_id = 123;

-- 详细EXPLAIN（推荐）
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;

-- PostgreSQL格式化输出
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) 
SELECT u.name, COUNT(o.id) 
FROM users u 
JOIN orders o ON u.id = o.user_id 
WHERE u.created_at > '2025-01-01'
GROUP BY u.name;
```

**关注重点**：
- `Seq Scan`（全表扫描）—— 通常需要优化
- `Index Scan`（索引扫描）—— 理想情况
- `rows`（预估行数）—— 与实际行数差距大说明统计信息过时
- `actual time`（实际执行时间）—— 找出最耗时的部分

```sql
-- 如果统计信息过时，手动更新
ANALYZE orders;
ANALYZE users;
```

## 技巧2：避免SELECT *，只查需要的列

```sql
-- 慢：查询所有列（包括大文本字段）
SELECT * FROM articles WHERE author_id = 456;

-- 快：只查询需要的列
SELECT id, title, created_at FROM articles WHERE author_id = 456;
```

为什么`SELECT *`慢？三个原因：
1. **网络传输**：数据库到应用之间传输了大量不需要的数据
2. **内存占用**：数据库需要在内存中构造完整行
3. **覆盖索引失效**：无法利用覆盖索引（后面会讲）

## 技巧3：合理创建复合索引

单列索引不够用的时候，复合索引是关键。但顺序很重要。

```sql
-- 假设这个查询很频繁
SELECT * FROM orders 
WHERE user_id = 123 AND status = 'paid' 
ORDER BY created_at DESC 
LIMIT 20;

-- 创建复合索引（顺序很关键）
-- 最左前缀原则：等值条件在前，范围条件在后
CREATE INDEX idx_orders_user_status_created 
ON orders(user_id, status, created_at DESC);
```

**复合索引的顺序规则**：
1. 等值条件的列放前面（`user_id = 123`, `status = 'paid'`）
2. 范围条件的列放后面（`created_at DESC`）
3. 排序的列放最后

```sql
-- 这个查询能用到上面的索引
WHERE user_id = 123 AND status = 'paid' ORDER BY created_at DESC

-- 这个查询只能用到部分索引（user_id部分）
WHERE user_id = 123 ORDER BY created_at DESC

-- 这个查询完全用不到索引
WHERE status = 'paid' ORDER BY created_at DESC
```

## 技巧4：利用覆盖索引避免回表

覆盖索引是指索引包含了查询所需的所有列，不需要回表查询数据行。

```sql
-- 假设 users 表有 (id, name, email, bio, avatar, created_at)

-- 查询1：需要回表（bio和avatar不在索引中）
SELECT name, email, bio FROM users WHERE id = 123;

-- 查询2：可以覆盖索引（只查name和email）
SELECT name, email FROM users WHERE id = 123;

-- 创建覆盖索引
CREATE INDEX idx_users_name_email ON users(id, name, email);
```

**效果**：覆盖索引可以把查询速度提升10-100倍，特别是在数据量大的时候。

## 技巧5：用JOIN替代子查询

很多数据库对JOIN的优化比子查询好得多。

```sql
-- 慢：相关子查询（每行执行一次子查询）
SELECT u.name, 
    (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) as order_count
FROM users u;

-- 快：用JOIN替代
SELECT u.name, COALESCE(o.order_count, 0) as order_count
FROM users u
LEFT JOIN (
    SELECT user_id, COUNT(*) as order_count 
    FROM orders 
    GROUP BY user_id
) o ON u.id = o.user_id;
```

```sql
-- 慢：WHERE中的子查询
SELECT * FROM orders 
WHERE user_id IN (SELECT id FROM users WHERE region = 'Asia');

-- 快：用JOIN替代
SELECT DISTINCT o.* 
FROM orders o
JOIN users u ON o.user_id = u.id 
WHERE u.region = 'Asia';
```

## 技巧6：分页优化——避免大偏移量

传统的`OFFSET`分页在大偏移量时性能急剧下降。

```sql
-- 慢：OFFSET越大越慢（数据库需要扫描并跳过前面的行）
SELECT * FROM articles 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 100000;

-- 快：使用游标分页（基于上一页最后一条记录）
SELECT * FROM articles 
WHERE created_at < '2025-05-01 12:00:00'  -- 上一页最后一条的时间
ORDER BY created_at DESC 
LIMIT 20;

-- 或者使用WHERE id > last_id
SELECT * FROM articles 
WHERE id > 500000  -- 上一页最后一条的ID
ORDER BY id ASC 
LIMIT 20;
```

**性能对比**（100万行数据）：
- `OFFSET 0`：约5ms
- `OFFSET 10000`：约50ms
- `OFFSET 100000`：约500ms
- `OFFSET 500000`：约2500ms
- 游标分页：始终约5ms

## 技巧7：批量操作替代循环查询

N+1查询问题是性能杀手。

```python
# 慢：N+1查询（在循环中执行SQL）
users = db.query("SELECT * FROM users LIMIT 100")
for user in users:
    orders = db.query(f"SELECT * FROM orders WHERE user_id = {user['id']}")
    user['orders'] = orders
# 执行了101次查询！

# 快：批量查询
users = db.query("SELECT * FROM users LIMIT 100")
user_ids = [u['id'] for u in users]
orders = db.query(
    "SELECT * FROM orders WHERE user_id IN (%s)" % 
    ','.join(map(str, user_ids))
)
# 构建user_id到orders的映射
from collections import defaultdict
orders_map = defaultdict(list)
for order in orders:
    orders_map[order['user_id']].append(order)

for user in users:
    user['orders'] = orders_map.get(user['id'], [])
# 只执行了2次查询！
```

## 技巧8：避免在索引列上使用函数

在索引列上使用函数会导致索引失效，触发全表扫描。

```sql
-- 慢：函数导致索引失效
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
SELECT * FROM orders WHERE DATE(created_at) = '2025-06-01';
SELECT * FROM products WHERE name LIKE '%phone%';

-- 快：避免函数，改写查询
SELECT * FROM users WHERE email = 'test@example.com';  -- 存储时统一小写
SELECT * FROM orders WHERE created_at >= '2025-06-01' AND created_at < '2025-06-02';
SELECT * FROM products WHERE name LIKE 'phone%';  -- 前缀匹配可以用索引

-- 如果必须用函数，创建函数索引（PostgreSQL）
CREATE INDEX idx_users_lower_email ON users(LOWER(email));
```

## 技巧9：合理使用UNION ALL替代UNION

`UNION`会去重，需要排序操作，开销很大。如果确定没有重复数据，使用`UNION ALL`。

```sql
-- 慢：UNION会去重（需要排序）
SELECT name FROM customers 
UNION 
SELECT name FROM suppliers;

-- 快：UNION ALL不去重（快很多）
SELECT name FROM customers 
UNION ALL 
SELECT name FROM suppliers;
```

**性能差异**：在10万行数据上，`UNION`可能需要2秒，`UNION ALL`只需要0.1秒。

## 技巧10：分区表处理大数据量

当单表数据量超过千万级，分区表是有效的优化手段。

```sql
-- PostgreSQL按时间范围分区
CREATE TABLE orders (
    id BIGSERIAL,
    user_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- 创建月度分区
CREATE TABLE orders_2025_06 PARTITION OF orders
    FOR VALUES FROM ('2025-06-01') TO ('2025-07-01');

CREATE TABLE orders_2025_07 PARTITION OF orders
    FOR VALUES FROM ('2025-07-01') TO ('2025-08-01');

-- 查询时数据库只扫描相关分区
SELECT * FROM orders 
WHERE created_at >= '2025-06-15' AND created_at < '2025-06-16';
-- 只扫描 orders_2025_06 分区
```

分区的好处：
- **查询更快**：只扫描相关分区
- **维护方便**：可以单独备份、删除旧分区
- **插入更快**：写入分散到不同分区

## 额外建议：监控慢查询

所有数据库都支持慢查询日志，这是发现性能问题的第一道防线：

```sql
-- PostgreSQL：设置慢查询阈值
ALTER SYSTEM SET log_min_duration_statement = '500';  -- 500ms
SELECT pg_reload_conf();

-- MySQL：开启慢查询日志
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;  -- 1秒
```

## 总结

SQL性能优化的核心思路：

1. **先分析再优化**——用EXPLAIN理解执行计划
2. **索引是第一武器**——但要注意复合索引的顺序和覆盖索引
3. **减少数据扫描量**——避免SELECT *、避免全表扫描
4. **减少查询次数**——批量操作、JOIN替代子查询
5. **注意分页效率**——大偏移量用游标分页
6. **保护索引有效性**——不在索引列上用函数
7. **大数据量考虑分区**——单表超过千万行时

记住：过早优化是万恶之源，但过晚优化就是技术债。当一条查询执行时间超过100ms，就该关注了；超过1秒，必须优化。
