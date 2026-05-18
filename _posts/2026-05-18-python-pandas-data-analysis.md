---
title: "Python数据科学入门：从零开始掌握Pandas数据分析"
date: 2026-05-18 15:00:00 +0800
image: /assets/images/python-data-science.jpg
tags: [Python, 数据科学, Pandas, 教程]
---

# Python数据科学入门：从零开始掌握Pandas数据分析

如果你想用Python做数据分析，**Pandas**是你必须掌握的第一个工具。它是数据科学家手中的"Excel"，但强大得多。

本文将带你从零开始，一步步掌握Pandas的核心用法。

## 为什么选择Pandas？

| 特性 | Excel | Pandas |
|------|-------|--------|
| 数据量 | 百万行卡顿 | 千万行流畅 |
| 自动化 | 需要VBA | 原生Python |
| 可重复性 | 难以复现 | 完全可复现 |
| 可视化 | 内置 | 配合Matplotlib |
| 学习曲线 | 低 | 中等 |

## 环境准备

### 安装

```bash
# 最简单的方式
pip install pandas

# 推荐：安装完整的数据科学套件
pip install pandas numpy matplotlib seaborn jupyter
```

### 启动Jupyter Notebook

```bash
jupyter notebook
```

Jupyter是数据科学的标准开发环境，支持代码、图表、文档混排。

## Pandas核心概念

### 1. Series：一维数据

```python
import pandas as pd

# 创建Series
s = pd.Series([10, 20, 30, 40], index=['a', 'b', 'c', 'd'])
print(s)

# 输出：
# a    10
# b    20
# c    30
# d    40
# dtype: int64
```

### 2. DataFrame：二维表格

```python
# 创建DataFrame
df = pd.DataFrame({
    'name': ['张三', '李四', '王五'],
    'age': [25, 30, 35],
    'city': ['北京', '上海', '广州']
})

print(df)
# 输出：
#   name  age  city
# 0  张三   25   北京
# 1  李四   30   上海
# 2  王五   35   广州
```

## 数据读取与导出

### 读取各种格式

```python
# CSV文件
df = pd.read_csv('data.csv')

# Excel文件
df = pd.read_excel('data.xlsx', sheet_name='Sheet1')

# JSON文件
df = pd.read_json('data.json')

# SQL数据库
import sqlite3
conn = sqlite3.connect('database.db')
df = pd.read_sql('SELECT * FROM users', conn)
```

### 导出数据

```python
# 导出为CSV
df.to_csv('output.csv', index=False)

# 导出为Excel
df.to_excel('output.xlsx', sheet_name='结果', index=False)
```

## 数据探索：了解你的数据

### 基本信息查看

```python
# 查看前5行
df.head()

# 查看后5行
df.tail()

# 数据概览
df.info()

# 统计摘要
df.describe()

# 列名
df.columns

# 数据形状（行数, 列数）
df.shape
```

### 实战示例：分析销售数据

```python
import pandas as pd

# 读取销售数据
sales = pd.read_csv('sales_data.csv')

# 查看基本信息
print(f"数据维度: {sales.shape}")
print(f"列名: {sales.columns.tolist()}")

# 查看数据类型
print(sales.dtypes)

# 快速统计
print(sales.describe())
```

## 数据选择与过滤

### 选择数据

```python
# 选择单列
df['name']

# 选择多列
df[['name', 'age']]

# 按位置选择
df.iloc[0]        # 第一行
df.iloc[0:3]      # 前3行
df.iloc[0, 1]     # 第1行第2列

# 按标签选择
df.loc[0]         # 索引为0的行
df.loc[0:2, 'name']  # 指定行列
```

### 条件过滤

```python
# 单条件
df[df['age'] > 30]

# 多条件
df[(df['age'] > 25) & (df['city'] == '北京')]

# 包含判断
df[df['city'].isin(['北京', '上海'])]

# 字符串包含
df[df['name'].str.contains('张')]
```

## 数据清洗

### 处理缺失值

```python
# 检查缺失值
df.isnull().sum()

# 删除含缺失值的行
df.dropna()

# 填充缺失值
df.fillna(0)                    # 用0填充
df.fillna(df.mean())            # 用均值填充
df['age'].fillna(df['age'].median())  # 用中位数填充
```

### 处理重复值

```python
# 检查重复
df.duplicated().sum()

# 删除重复
df.drop_duplicates()
```

### 数据类型转换

```python
# 转换类型
df['age'] = df['age'].astype(float)

# 日期转换
df['date'] = pd.to_datetime(df['date'])
```

## 数据分析与聚合

### 分组统计

```python
# 按城市分组，计算平均年龄
df.groupby('city')['age'].mean()

# 多种统计
df.groupby('city')['age'].agg(['mean', 'max', 'min', 'count'])

# 多列分组
df.groupby(['city', 'gender'])['age'].mean()
```

### 数据透视表

```python
# 创建透视表
pivot = pd.pivot_table(
    df,
    values='sales',
    index='city',
    columns='month',
    aggfunc='sum'
)
```

### 实战：销售数据分析

```python
import pandas as pd

# 读取数据
sales = pd.read_csv('sales.csv')

# 按产品类别统计
category_stats = sales.groupby('category').agg({
    'revenue': 'sum',
    'quantity': 'sum',
    'order_id': 'count'
}).rename(columns={'order_id': 'order_count'})

# 计算客单价
category_stats['avg_order_value'] = category_stats['revenue'] / category_stats['order_count']

# 按收入排序
category_stats.sort_values('revenue', ascending=False)
```

## 数据可视化

Pandas内置了便捷的绘图功能：

```python
import matplotlib.pyplot as plt

# 折线图
df['sales'].plot()
plt.show()

# 柱状图
df.groupby('category')['sales'].sum().plot(kind='bar')
plt.show()

# 直方图
df['age'].hist(bins=20)
plt.show()

# 散点图
df.plot.scatter(x='age', y='income')
plt.show()
```

## 进阶技巧

### 合并数据

```python
# 类似SQL的JOIN
pd.merge(df1, df2, on='id', how='left')

# 拼接
pd.concat([df1, df2], axis=0)  # 纵向拼接
pd.concat([df1, df2], axis=1)  # 横向拼接
```

### 应用函数

```python
# 对每行应用函数
df['new_column'] = df.apply(lambda row: row['a'] + row['b'], axis=1)

# 对单列应用函数
df['name_upper'] = df['name'].str.upper()
```

### 时间序列处理

```python
# 设置时间索引
df['date'] = pd.to_datetime(df['date'])
df.set_index('date', inplace=True)

# 重采样
df.resample('M').sum()    # 按月汇总
df.resample('W').mean()   # 按周平均

# 滚动窗口
df['rolling_avg'] = df['value'].rolling(window=7).mean()
```

## 完整实战案例

```python
import pandas as pd
import matplotlib.pyplot as plt

# 1. 读取数据
df = pd.read_csv('ecommerce_orders.csv')

# 2. 数据清洗
df['order_date'] = pd.to_datetime(df['order_date'])
df = df.dropna(subset=['customer_id', 'order_amount'])

# 3. 特征工程
df['year'] = df['order_date'].dt.year
df['month'] = df['order_date'].dt.month
df['weekday'] = df['order_date'].dt.day_name()

# 4. 分析：月度销售趋势
monthly = df.groupby(['year', 'month'])['order_amount'].sum()
monthly.plot(kind='line', figsize=(12, 6))
plt.title('月度销售趋势')
plt.show()

# 5. 分析：客户价值分层
customer_value = df.groupby('customer_id')['order_amount'].sum()
customer_value.describe()

# RFM分析
rfm = df.groupby('customer_id').agg({
    'order_date': lambda x: (pd.Timestamp.now() - x.max()).days,  # Recency
    'order_id': 'count',                                          # Frequency
    'order_amount': 'sum'                                         # Monetary
})
rfm.columns = ['recency', 'frequency', 'monetary']

# 6. 导出结果
rfm.to_csv('customer_rfm.csv')
```

## 学习资源推荐

| 资源 | 说明 | 链接 |
|------|------|------|
| 官方文档 | 最权威的参考 | pandas.pydata.org |
| 10 Minutes to Pandas | 快速入门 | 官方教程 |
| Pandas Cheat Sheet | 速查表 | pandas官网 |
| Kaggle Learn | 互动教程 | kaggle.com/learn |

## 结语

Pandas是数据科学的基石。掌握本文的内容，你已经可以处理大部分数据分析任务了。

下一步，建议：

1. **多练习**：用真实数据集实践
2. **学NumPy**：理解底层原理
3. **学可视化**：Matplotlib、Seaborn
4. **学机器学习**：Scikit-learn

数据分析的世界很广阔，Pandas只是起点。

---

*有问题欢迎在评论区讨论！后续我会分享更多数据科学相关内容。*
