---
layout: post
title: "PostgreSQL性能优化：从索引到查询计划的完整指南"
date: 2026-05-30 12:00:00 +0800
categories: [PostgreSQL, 数据库, 性能优化]
tags: [postgresql, database, optimization, indexing]
image: /assets/images/postgres-optimization.jpg
---

## 引言

PostgreSQL是最强大的开源关系数据库，但默认配置往往不是最优的。本文从索引设计到查询优化，全面提升PostgreSQL性能。

## 1. 索引策略

### 选择正确的索引类型

```sql
-- B-tree（默认，适合等值和范围查询）
CREATE INDEX idx_users_email ON users(email);

-- Hash（只适合等值查询，不常用）
CREATE INDEX idx_users_id_hash ON users USING hash(id);

-- GiST（适合几何数据、全文搜索）
CREATE INDEX idx_locations_point ON locations USING gist(point);

-- GIN（适合数组、JSONB、全文搜索）
CREATE INDEX idx_products_tags ON products USING gin(tags);
CREATE INDEX idx_users_data ON users USING gin(data jsonb_path_ops);

-- BRIN（适合大表、有序数据）
CREATE INDEX idx_logs_created ON logs USING brin(created_at);
```

### 复合索引设计

```sql
-- 错误：单独索引
CREATE INDEX idx_users_city ON users(city);
CREATE INDEX idx_users_age ON users(age);

-- 正确：复合索引（遵循最左前缀）
CREATE INDEX idx_users_city_age ON users(city, age);

-- 查询可以利用索引的情况：
-- SELECT * FROM users WHERE city = 'Beijing';  ✅
-- SELECT * FROM users WHERE city = 'Beijing' AND age > 25;  ✅
-- SELECT * FROM users WHERE age > 25;  ❌ 无法使用索引
```

### 部分索引

```sql
-- 只索引活跃用户
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';

-- 只索引未删除的订单
CREATE INDEX idx_valid_orders ON orders(user_id) WHERE deleted_at IS NULL;
```

### 表达式索引

```sql
-- 索引小写的email
CREATE INDEX idx_users_email_lower ON users(lower(email));

-- 查询时使用相同表达式
SELECT * FROM users WHERE lower(email) = 'test@example.com';
```

## 2. 查询优化

### 理解EXPLAIN

```sql
-- 基础分析
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- 详细分析（包含实际执行时间）
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- 更详细的分析
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT * FROM users WHERE email = 'test@example.com';
```

### 常见问题与解决

**1. 全表扫描**

```sql
-- 问题：Seq Scan
EXPLAIN SELECT * FROM users WHERE lower(email) = 'test@example.com';
-- 结果：Seq Scan on users

-- 解决：使用表达式索引
CREATE INDEX idx_users_email_lower ON users(lower(email));
-- 结果：Index Scan using idx_users_email_lower
```

**2. 隐式类型转换**

```sql
-- 问题：varchar列用整数查询
EXPLAIN SELECT * FROM users WHERE phone = 13800138000;
-- 结果：Seq Scan（隐式转换阻止索引使用）

-- 解决：用字符串查询
EXPLAIN SELECT * FROM users WHERE phone = '13800138000';
-- 结果：Index Scan
```

**3. NOT IN vs NOT EXISTS**

```sql
-- 慢：NOT IN（无法有效使用索引）
SELECT * FROM users WHERE id NOT IN (SELECT user_id FROM blacklist);

-- 快：NOT EXISTS
SELECT * FROM users u 
WHERE NOT EXISTS (SELECT 1 FROM blacklist b WHERE b.user_id = u.id);

-- 或使用LEFT JOIN
SELECT u.* FROM users u
LEFT JOIN blacklist b ON b.user_id = u.id
WHERE b.user_id IS NULL;
```

**4. 分页优化**

```sql
-- 慢：大偏移量
SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 100000;

-- 快：使用游标
SELECT * FROM users WHERE id > 100000 ORDER BY id LIMIT 10;

-- 或使用keyset pagination
SELECT * FROM users 
WHERE (created_at, id) > ('2026-01-01', 1000) 
ORDER BY created_at, id 
LIMIT 10;
```

## 3. 连接优化

### JOIN顺序

```sql
-- 让PostgreSQL自动优化
SET join_collapse_limit = 8;
SET from_collapse_limit = 8;

-- 强制连接顺序（必要时）
SELECT /*+ Leading(a b c) */ *
FROM table_a a
JOIN table_b b ON b.a_id = a.id
JOIN table_c c ON c.b_id = b.id;
```

### 连接类型选择

```sql
-- 小表驱动大表
-- 内连接：PostgreSQL会自动选择最优顺序
SELECT * FROM small_table s JOIN large_table l ON l.s_id = s.id;

-- 外连接：注意顺序
SELECT * FROM small_table s 
LEFT JOIN large_table l ON l.s_id = s.id;  -- 正确

SELECT * FROM large_table l 
LEFT JOIN small_table s ON s.id = l.s_id;  -- 可能产生大量NULL
```

## 4. 配置优化

```sql
-- 内存配置
ALTER SYSTEM SET shared_buffers = '4GB';  -- 总内存的25%
ALTER SYSTEM SET effective_cache_size = '12GB';  -- 总内存的75%
ALTER SYSTEM SET work_mem = '64MB';  -- 排序、哈希内存
ALTER SYSTEM SET maintenance_work_mem = '1GB';  -- 维护操作内存

-- 并行查询
ALTER SYSTEM SET max_parallel_workers_per_gather = 4;
ALTER SYSTEM SET parallel_setup_cost = 100;
ALTER SYSTEM SET parallel_tuple_cost = 0.01;

-- 日志配置
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- 记录超过1秒的查询
ALTER SYSTEM SET log_checkpoints = on;
ALTER SYSTEM SET log_connections = on;
ALTER SYSTEM SET log_disconnections = on;

-- 应用配置
SELECT pg_reload_conf();
```

## 5. 统计信息更新

```sql
-- 手动更新统计
ANALYZE users;

-- 更新特定列
ANALYZE users(email, city);

-- 增加统计精度（对分布不均匀的列）
ALTER TABLE users ALTER COLUMN city SET STATISTICS 1000;
ANALYZE users(city);

-- 自动分析配置
ALTER SYSTEM SET autovacuum_analyze_threshold = 50;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;
```

## 6. 监控查询

```sql
-- 查看运行中的查询
SELECT pid, query, state, wait_event, query_start
FROM pg_stat_activity
WHERE state = 'active';

-- 查看慢查询
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- 查看表统计
SELECT relname, n_live_tup, n_dead_tup, 
       last_vacuum, last_autovacuum,
       last_analyze, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC;

-- 查看索引使用率
SELECT indexrelname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## 7. VACUUM优化

```sql
-- 手动VACUUM
VACUUM users;  -- 普通VACUUM
VACUUM FULL users;  -- 全量VACUUM（锁表！）

-- 并行VACUUM
VACUUM (PARALLEL 4) large_table;

-- 自动VACUUM配置
ALTER TABLE users SET (
    autovacuum_vacuum_scale_factor = 0.1,
    autovacuum_vacuum_threshold = 1000
);
```

## 总结

PostgreSQL优化检查清单：

1. **索引** - 选择正确的类型和列顺序
2. **查询** - 使用EXPLAIN分析，避免全表扫描
3. **配置** - 根据硬件调整内存参数
4. **统计** - 保持统计信息更新
5. **监控** - 定期检查慢查询和索引使用率

> 💡 **工具推荐**：如果你需要监控数据库性能，可以试试**PriceSentinel Pro**——一个轻量级监控工具，支持实时指标追踪和告警。

---

*本文首发于 [WD Tech Blog](https://wdsega.github.io)，转载请注明出处。*
