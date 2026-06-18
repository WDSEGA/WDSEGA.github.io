---
layout: post
title: "数据库索引优化：从B-Tree到覆盖索引"
date: 2026-06-03 14:00:00 +0800
tags: [代码产品]
---

数据库索引是提升查询性能的核心手段，但不当的索引设计不仅无法加速查询，还会拖慢写入性能并浪费存储空间。本文从底层数据结构出发，系统讲解索引原理、优化策略和实战技巧。

## 一、索引底层：B-Tree结构解析

大多数关系型数据库（MySQL InnoDB、PostgreSQL）使用B+Tree作为默认索引结构。理解B+Tree有助于我们做出合理的索引决策。

B+Tree的特点：

- 所有数据都存储在叶子节点，叶子节点之间通过指针相连。
- 非叶子节点只存储键值和子节点指针，不存储实际数据。
- 树的高度通常很低（3-4层即可存储数百万条记录），因此磁盘I/O次数极少。

假设有一张用户表：

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TINYINT DEFAULT 1
);
```

主键索引`id`的B+Tree结构中，叶子节点存储的是完整的行数据（InnoDB的聚簇索引特性）。而二级索引（如`email`索引）的叶子节点存储的是主键值，查询时需要回表获取完整数据。

## 二、索引类型与适用场景

### B-Tree索引

B-Tree索引是最通用的索引类型，适用于等值查询和范围查询：

```sql
-- 等值查询
SELECT * FROM users WHERE email = 'alice@example.com';

-- 范围查询
SELECT * FROM users WHERE created_at > '2024-01-01';

-- 前缀匹配（仅最左前缀）
SELECT * FROM users WHERE username LIKE 'ali%';
```

### 哈希索引

MySQL的Memory引擎和PostgreSQL的Hash索引使用哈希结构，仅适用于等值查询，不支持范围查询：

```sql
-- PostgreSQL创建哈希索引
CREATE INDEX idx_email_hash ON users USING HASH (email);
```

哈希索引的查找速度为O(1)，但由于哈希冲突和无法排序，适用场景有限。

### 全文索引

针对文本搜索场景：

```sql
-- MySQL全文索引
CREATE FULLTEXT INDEX idx_content ON articles(title, body);

SELECT * FROM articles
WHERE MATCH(title, body) AGAINST('数据库优化' IN NATURAL LANGUAGE MODE);
```

### 空间索引

用于地理空间数据查询，基于R-Tree实现：

```sql
-- PostgreSQL + PostGIS
CREATE INDEX idx_location ON stores USING GIST (location);

SELECT * FROM stores
WHERE ST_DWithin(location, ST_MakePoint(116.4, 39.9)::geography, 1000);
```

## 三、复合索引与最左前缀原则

复合索引（多列索引）的设计是索引优化的核心技能。以下是一个电商订单表的示例：

```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    total_amount DECIMAL(10,2),
    INDEX idx_user_status_created (user_id, status, created_at)
);
```

复合索引`idx_user_status_created`遵循最左前缀原则，以下查询可以有效利用索引：

```sql
-- 完全匹配最左列
SELECT * FROM orders WHERE user_id = 100;

-- 匹配前两列
SELECT * FROM orders WHERE user_id = 100 AND status = 'paid';

-- 匹配全部三列
SELECT * FROM orders
WHERE user_id = 100 AND status = 'paid' AND created_at > '2024-01-01';
```

以下查询则无法有效使用索引：

```sql
-- 跳过了最左列user_id
SELECT * FROM orders WHERE status = 'paid';

-- 范围查询在中间列，后续列无法使用索引
SELECT * FROM orders
WHERE user_id = 100 AND created_at > '2024-01-01';
```

复合索引的列顺序设计原则：

1. **等值查询列在前**：将`=`条件最多的列放在最前面。
2. **区分度高的列在前**：区分度高的列能更快缩小扫描范围。
3. **范围查询列在后**：范围查询后面的列无法使用索引。

## 四、覆盖索引：避免回表查询

覆盖索引是指查询所需的所有列都在索引中，无需回表获取数据。这是索引优化的最高境界。

```sql
-- 创建覆盖索引
CREATE INDEX idx_user_email_status ON users(email, status, username);

-- 覆盖索引查询：SELECT的列都在索引中
SELECT username, status FROM users WHERE email = 'alice@example.com';
```

执行计划分析（MySQL）：

```sql
EXPLAIN SELECT username, status FROM users WHERE email = 'alice@example.com';
```

如果`Extra`列显示`Using index`，说明使用了覆盖索引，性能最优。

实战案例：分页查询优化

原始查询（性能差，需要回表）：

```sql
SELECT * FROM orders
WHERE user_id = 100
ORDER BY created_at DESC
LIMIT 10000, 10;
```

优化方案（延迟关联 + 覆盖索引）：

```sql
-- 第一步：创建覆盖索引
CREATE INDEX idx_user_created_id ON orders(user_id, created_at, id);

-- 第二步：使用覆盖索引先获取主键
SELECT o.*
FROM orders o
INNER JOIN (
    SELECT id
    FROM orders
    WHERE user_id = 100
    ORDER BY created_at DESC
    LIMIT 10000, 10
) tmp ON o.id = tmp.id;
```

子查询只需扫描索引即可获取`id`，避免了大量回表操作。

## 五、索引优化实战技巧

### 1. 分析查询执行计划

```sql
-- MySQL
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- PostgreSQL
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM users WHERE email = 'test@example.com';
```

关注以下指标：

- `type`：访问类型，从优到差依次为`system > const > eq_ref > ref > range > index > ALL`。
- `rows`：扫描的行数，越小越好。
- `Extra`：额外信息，`Using index`表示覆盖索引，`Using filesort`表示需要排序优化。

### 2. 索引选择性分析

```sql
-- 计算列的选择性
SELECT
    COUNT(DISTINCT email) / COUNT(*) AS email_selectivity,
    COUNT(DISTINCT status) / COUNT(*) AS status_selectivity
FROM users;
```

选择性越接近1，索引效果越好。`status`这种只有几个取值的列，单独建索引效果很差。

### 3. 前缀索引优化长字符串

对于URL、邮箱等长字符串列，可以创建前缀索引节省空间：

```sql
-- 计算最优前缀长度
SELECT
    COUNT(DISTINCT LEFT(email, 4)) / COUNT(DISTINCT email) AS len_4,
    COUNT(DISTINCT LEFT(email, 6)) / COUNT(DISTINCT email) AS len_6,
    COUNT(DISTINCT LEFT(email, 8)) / COUNT(DISTINCT email) AS len_8
FROM users;

-- 创建前缀索引
CREATE INDEX idx_email_prefix ON users(email(8));
```

### 4. 索引维护与监控

```sql
-- MySQL查看索引使用情况
SELECT
    table_name,
    index_name,
    cardinality,
    rows_selected,
    rows_inserted
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE index_name IS NOT NULL;

-- PostgreSQL查看未使用索引
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0;
```

定期清理未使用的索引，减少写入开销。

## 六、索引与写入性能的平衡

索引并非越多越好。每次INSERT、UPDATE、DELETE操作都需要维护索引：

```sql
-- 测试插入性能
-- 无索引表
CREATE TABLE test_no_index (id INT, data VARCHAR(100));

-- 有索引表
CREATE TABLE test_with_index (id INT, data VARCHAR(100));
CREATE INDEX idx_data ON test_with_index(data);

-- 批量插入测试
INSERT INTO test_no_index SELECT n, md5(n::text) FROM generate_series(1, 100000) AS n;
-- 耗时: 约500ms

INSERT INTO test_with_index SELECT n, md5(n::text) FROM generate_series(1, 100000) AS n;
-- 耗时: 约1500ms
```

索引设计原则：

1. **只为WHERE、JOIN、ORDER BY、GROUP BY中出现的列创建索引**。
2. **控制单表索引数量**：一般不超过5-6个，过多会影响写入性能。
3. **定期审查**：随着查询模式变化，及时调整索引策略。
4. **考虑联合索引替代多个单列索引**：`INDEX(a, b)`通常比单独的`INDEX(a)`和`INDEX(b)`更高效。

## 七、PostgreSQL的特殊索引

PostgreSQL提供了一些MySQL不具备的高级索引特性：

### 部分索引

只为满足特定条件的行创建索引，大幅减小索引体积：

```sql
CREATE INDEX idx_active_users ON users(email)
WHERE status = 1;
```

### 表达式索引

对表达式结果创建索引：

```sql
CREATE INDEX idx_lower_email ON users(LOWER(email));

-- 查询时必须使用相同表达式
SELECT * FROM users WHERE LOWER(email) = 'alice@example.com';
```

### BRIN索引

针对自然有序的大表（如时序数据），BRIN索引体积极小：

```sql
CREATE INDEX idx_logs_created ON logs USING BRIN (created_at);
```

## 结语

索引优化是数据库性能调优的核心技能。理解B-Tree结构、掌握最左前缀原则、善用覆盖索引，能解决绝大多数查询性能问题。同时要记住，索引是查询性能和写入性能之间的权衡，需要根据实际业务负载持续监控和调整。建议结合慢查询日志和执行计划分析，建立系统化的索引优化流程。
