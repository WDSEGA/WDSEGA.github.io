---
title: "Python数据处理10个实用模板：从CSV清洗到VLOOKUP匹配"
date: 2026-05-26
categories: [Python, 数据处理, 教程]
tags: [代码产品]
---

在日常工作中，数据处理是最常见的重复性任务之一。无论你是分析师、工程师还是运营人员，几乎每天都在和表格打交道。本文整理了10个基于Python pandas库的实用数据处理模板，涵盖从CSV清洗到VLOOKUP匹配的常见场景，每个模板都可以直接复制使用。

## 1. 快速加载与预览数据

```python
import pandas as pd

# 加载CSV文件
df = pd.read_csv('data.csv', encoding='utf-8')

# 加载Excel文件
df_excel = pd.read_excel('data.xlsx', sheet_name='Sheet1')

# 快速预览
print(df.head(10))       # 前10行
print(df.info())         # 数据类型和空值概览
print(df.describe())     # 数值列统计摘要
print(df.shape)          # 行数和列数
```

**小技巧**：大文件用 `nrows` 参数先预览前100行，确认格式无误再全量加载。

## 2. 数据清洗：去重与空值处理

```python
# 去除完全重复的行
df = df.drop_duplicates()

# 去除某列的重复值，保留最后一条
df = df.drop_duplicates(subset=['user_id'], keep='last')

# 检查空值
print(df.isnull().sum())

# 填充空值
df['age'] = df['age'].fillna(0)                    # 用固定值填充
df['name'] = df['name'].fillna('未知')              # 用文本填充
df['salary'] = df['salary'].fillna(df['salary'].median())  # 用中位数填充

# 删除空值超过30%的列
threshold = len(df) * 0.7
df = df.dropna(thresh=threshold, axis=1)

# 删除包含空值的行
df = df.dropna(subset=['email', 'phone'])
```

## 3. 字符串清洗与标准化

```python
# 去除首尾空格
df['name'] = df['name'].str.strip()

# 统一大小写
df['category'] = df['category'].str.upper()

# 替换异常字符
df['phone'] = df['phone'].str.replace('-', '').str.replace(' ', '')

# 正则提取
import re
df['email_domain'] = df['email'].str.extract(r'@(.+)$')

# 批量字符串替换
mapping = {'北京': 'BJ', '上海': 'SH', '广州': 'GZ'}
df['city_code'] = df['city'].map(mapping).fillna(df['city'])
```

## 4. 数据类型转换

```python
# 日期转换
df['date'] = pd.to_datetime(df['date'], format='%Y-%m-%d')
df['month'] = df['date'].dt.month
df['weekday'] = df['date'].dt.day_name()

# 数值转换
df['price'] = pd.to_numeric(df['price'], errors='coerce')  # 非数字变NaN
df['quantity'] = df['quantity'].astype(int)

# 分类类型（节省内存）
df['status'] = df['status'].astype('category')

# 批量转换多列
numeric_cols = ['price', 'quantity', 'discount']
df[numeric_cols] = df[numeric_cols].apply(pd.to_numeric, errors='coerce')
```

## 5. 条件筛选与过滤

```python
# 单条件筛选
high_value = df[df['amount'] > 10000]

# 多条件组合
result = df[(df['status'] == 'active') & (df['score'] >= 80)]

# 字符串包含
df[df['name'].str.contains('科技', na=False)]

# 数值范围
df[df['age'].between(25, 35)]

# 多值匹配（类似SQL的IN）
df[df['city'].isin(['北京', '上海', '深圳'])]

# 排除特定值
df[~df['category'].isin(['测试', '废弃'])]
```

## 6. VLOOKUP匹配（双表关联）

这是Excel用户最常用的功能，在pandas中用 `merge` 实现：

```python
# 左连接（类似VLOOKUP）
orders = pd.read_csv('orders.csv')
users = pd.read_csv('users.csv')

result = orders.merge(
    users[['user_id', 'name', 'city', 'phone']],
    on='user_id',
    how='left'    # 保留左表所有行
)

# 多列匹配
result = orders.merge(
    users,
    on=['dept_id', 'team_id'],
    how='left'
)

# 不同列名匹配
result = orders.merge(
    users,
    left_on='customer_id',
    right_on='user_id',
    how='left'
)

# 模糊匹配（按关键词）
def fuzzy_match(row, lookup_df, col):
    matched = lookup_df[lookup_df[col].str.contains(row['keyword'], na=False)]
    return matched.iloc[0]['value'] if len(matched) > 0 else None

df['matched_value'] = df.apply(
    lambda r: fuzzy_match(r, lookup_table, 'name'), axis=1
)
```

## 7. 数据透视表

```python
# 基础透视表
pivot = df.pivot_table(
    values='amount',
    index='category',
    columns='month',
    aggfunc='sum',
    fill_value=0
)

# 多聚合函数
pivot = df.pivot_table(
    values='amount',
    index='region',
    columns='product',
    aggfunc=['sum', 'mean', 'count'],
    fill_value=0
)

# 分组统计（更灵活）
stats = df.groupby('department').agg(
    total_revenue=('amount', 'sum'),
    avg_salary=('salary', 'mean'),
    headcount=('employee_id', 'count'),
    max_bonus=('bonus', 'max')
).reset_index()

# 分组后取每组前N
top_products = df.groupby('category').apply(
    lambda x: x.nlargest(3, 'sales')
).reset_index(drop=True)
```

## 8. 格式转换（CSV/Excel/JSON互转）

```python
# CSV转Excel
df.to_excel('output.xlsx', index=False, sheet_name='Data')

# Excel转CSV
df.to_csv('output.csv', index=False, encoding='utf-8-sig')  # utf-8-sig兼容Excel

# DataFrame转JSON
df.to_json('output.json', orient='records', force_ascii=False, indent=2)

# JSON转DataFrame
df = pd.read_json('data.json', encoding='utf-8')

# 多Sheet写入
with pd.ExcelWriter('report.xlsx') as writer:
    df_summary.to_excel(writer, sheet_name='汇总', index=False)
    df_detail.to_excel(writer, sheet_name='明细', index=False)
    df_stats.to_excel(writer, sheet_name='统计', index=False)
```

## 9. 批量处理多个文件

```python
import os
import glob

# 读取文件夹中所有CSV并合并
all_files = glob.glob('data/*.csv')
dfs = [pd.read_csv(f, encoding='utf-8') for f in all_files]
merged = pd.concat(dfs, ignore_index=True)

# 批量处理并保存
for filepath in glob.glob('raw_data/*.csv'):
    df = pd.read_csv(filepath)
    df = df.drop_duplicates()
    df['processed_date'] = pd.Timestamp.now()
    filename = os.path.basename(filepath)
    df.to_csv(f'processed/{filename}', index=False, encoding='utf-8-sig')
    print(f'处理完成: {filename}')

# 按条件拆分成多个文件
for name, group in df.groupby('region'):
    group.to_csv(f'output/{name}.csv', index=False, encoding='utf-8-sig')
```

## 10. 数据对比与差异分析

```python
# 对比两个DataFrame的差异
df_old = pd.read_csv('last_month.csv')
df_new = pd.read_csv('this_month.csv')

# 新增的行
new_rows = df_new.merge(df_old, how='left', indicator=True)
added = new_rows[new_rows['_merge'] == 'right_only'].drop('_merge', axis=1)

# 删除的行
removed = new_rows[new_rows['_merge'] == 'left_only'].drop('_merge', axis=1)

# 数值变化
comparison = df_old.merge(df_new, on='id', suffixes=('_old', '_new'))
comparison['revenue_change'] = comparison['revenue_new'] - comparison['revenue_old']
comparison['change_pct'] = (comparison['revenue_change'] / comparison['revenue_old'] * 100).round(2)

# 找出变化超过10%的记录
significant_changes = comparison[abs(comparison['change_pct']) > 10]
```

## 总结

以上10个模板覆盖了日常数据处理中最常见的场景。核心要点：

1. **先预览再处理**：用 `head()` 和 `info()` 了解数据全貌
2. **善用链式操作**：pandas支持方法链，代码更简洁
3. **注意编码问题**：中文数据建议用 `utf-8-sig` 编码
4. **备份原始数据**：处理前先备份，避免不可逆操作
5. **分步验证**：每步操作后检查结果，避免错误累积

将这些模板保存到你的代码片段库中，下次遇到类似任务时直接复用，可以节省大量时间。
