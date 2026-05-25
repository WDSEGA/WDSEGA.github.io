---
title: "用Python自动化Excel办公：5个你每天都在重复的操作"
date: 2026-05-26
categories: [Python, 自动化办公, 教程]
tags: [python, excel, openpyxl, 自动化, 办公效率]
---

如果你每天都在手动处理Excel文件——复制粘贴、合并表格、做数据透视、调格式、发报表——那你正在浪费大量本可以自动化的时间。本文介绍5个最常见的Excel自动化场景，每个场景都有完整的Python代码，可以直接用到你的工作中。

## 环境准备

```bash
pip install openpyxl pandas xlwings
```

- `openpyxl`：读写Excel文件（.xlsx格式）
- `pandas`：数据处理和分析
- `xlwings`：操作Excel应用（需要安装Excel，适合复杂格式操作）

## 场景1：批量合并多个Excel文件

每个月各部门提交报表，你需要把几十个文件合并成一个。手动操作要半小时，自动化只需几秒。

```python
import pandas as pd
import glob

def merge_excel_files(folder_path, output_file, sheet_name=0):
    """合并文件夹中所有Excel文件"""
    all_files = glob.glob(f'{folder_path}/*.xlsx')

    dfs = []
    for file in all_files:
        df = pd.read_excel(file, sheet_name=sheet_name)
        df['来源文件'] = file.split('/')[-1]  # 标记来源
        dfs.append(df)
        print(f'已读取: {file.split("/")[-1]} ({len(df)} 行)')

    merged = pd.concat(dfs, ignore_index=True)
    merged.to_excel(output_file, index=False, sheet_name='合并结果')
    print(f'\n合并完成！共 {len(merged)} 行，已保存到 {output_file}')
    return merged

# 使用
merge_excel_files('部门报表/', '月度汇总.xlsx')
```

**进阶**：如果每个文件的列名不完全一致，可以用 `merge` 按关键字段关联，而不是简单拼接。

## 场景2：自动生成数据透视表

每周要做销售数据透视分析？让Python自动完成。

```python
import pandas as pd

def create_pivot_table(input_file, output_file):
    """自动生成数据透视表"""
    df = pd.read_excel(input_file)

    # 按产品和区域汇总销售额
    pivot_sales = df.pivot_table(
        values='销售额',
        index='产品类别',
        columns='区域',
        aggfunc='sum',
        fill_value=0,
        margins=True,        # 添加合计行/列
        margins_name='合计'
    )

    # 按月份统计各区域订单数
    df['月份'] = pd.to_datetime(df['日期']).dt.month
    pivot_orders = df.pivot_table(
        values='订单号',
        index='区域',
        columns='月份',
        aggfunc='count',
        fill_value=0
    )

    # 多维度分组统计
    stats = df.groupby('区域').agg(
        总销售额=('销售额', 'sum'),
        平均客单价=('销售额', 'mean'),
        订单数量=('订单号', 'count'),
        最大单笔=('销售额', 'max')
    ).round(2).reset_index()

    # 写入多Sheet
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        pivot_sales.to_excel(writer, sheet_name='销售透视')
        pivot_orders.to_excel(writer, sheet_name='订单透视')
        stats.to_excel(writer, sheet_name='区域统计', index=False)

    print(f'透视表已生成: {output_file}')

# 使用
create_pivot_table('销售数据.xlsx', '销售分析报告.xlsx')
```

## 场景3：自动设置条件格式

用Python给Excel添加条件格式，让关键数据一目了然。

```python
from openpyxl import load_workbook
from openpyxl.formatting.rule import CellIsRule, DataBarRule, ColorScaleRule
from openpyxl.styles import PatternFill, Font

def apply_conditional_formatting(file_path):
    """自动设置条件格式"""
    wb = load_workbook(file_path)
    ws = wb.active

    # 1. 数值大于10000标红
    red_fill = PatternFill(start_color='FFCCCC', end_color='FFCCCC', fill_type='solid')
    red_font = Font(color='CC0000', bold=True)
    ws.conditional_formatting.add(
        'D2:D1000',  # 销售额列
        CellIsRule(operator='greaterThan', formula=['10000'], fill=red_fill, font=red_font)
    )

    # 2. 数值小于0标绿（负数）
    green_fill = PatternFill(start_color='CCFFCC', end_color='CCFFCC', fill_type='solid')
    ws.conditional_formatting.add(
        'E2:E1000',  # 利润列
        CellIsRule(operator='lessThan', formula=['0'], fill=green_fill)
    )

    # 3. 数据条（进度条效果）
    ws.conditional_formatting.add(
        'F2:F1000',  # 完成率列
        DataBarRule(start_type='min', end_type='max', color='4472C4')
    )

    # 4. 颜色渐变（热力图效果）
    ws.conditional_formatting.add(
        'G2:G1000',  # 评分列
        ColorScaleRule(
            start_type='min', start_color='F8696B',
            mid_type='percentile', mid_value=50, mid_color='FFEB84',
            end_type='max', end_color='63BE7B'
        )
    )

    # 5. 重复值高亮
    from openpyxl.formatting.rule import FormulaRule
    dup_fill = PatternFill(start_color='FFFF00', end_color='FFFF00', fill_type='solid')
    ws.conditional_formatting.add(
        'A2:A1000',  # 编号列
        FormulaRule(formula=['COUNTIF($A$2:$A$1000,A2)>1'], fill=dup_fill)
    )

    wb.save(file_path)
    print('条件格式设置完成！')

# 使用
apply_conditional_formatting('销售分析报告.xlsx')
```

## 场景4：自动生成周报/月报

每周五下午花两小时做报表？自动化后一键生成。

```python
import pandas as pd
from openpyxl import load_workbook
from openpyxl.styles import Font, Alignment, Border, Side, PatternFill
from datetime import datetime

def generate_weekly_report(data_file, output_file):
    """自动生成周报"""
    df = pd.read_excel(data_file)
    df['日期'] = pd.to_datetime(df['日期'])

    # 本周数据
    today = datetime.now()
    this_week = df[df['日期'].dt.isocalendar().week == today.isocalendar().week]
    last_week = df[df['日期'].dt.isocalendar().week == today.isocalendar().week - 1]

    # 计算关键指标
    metrics = {
        '本周销售额': this_week['销售额'].sum(),
        '上周销售额': last_week['销售额'].sum(),
        '环比增长': (this_week['销售额'].sum() - last_week['销售额'].sum()) / last_week['销售额'].sum() * 100,
        '本周订单数': len(this_week),
        '平均客单价': this_week['销售额'].mean(),
        'Top产品': this_week.groupby('产品')['销售额'].sum().idxmax(),
    }

    # 创建报表
    wb = load_workbook(output_file) if os.path.exists(output_file) else Workbook()
    ws = wb.active
    ws.title = f'周报-{today.strftime("%m%d")}'

    # 设置样式
    title_font = Font(name='微软雅黑', size=16, bold=True, color='2F5496')
    header_font = Font(name='微软雅黑', size=11, bold=True, color='FFFFFF')
    header_fill = PatternFill(start_color='2F5496', end_color='2F5496', fill_type='solid')
    thin_border = Border(
        left=Side(style='thin'), right=Side(style='thin'),
        top=Side(style='thin'), bottom=Side(style='thin')
    )

    # 写入标题
    ws.merge_cells('A1:D1')
    ws['A1'] = f'周报 - {today.strftime("%Y年%m月%d日")}'
    ws['A1'].font = title_font
    ws['A1'].alignment = Alignment(horizontal='center')

    # 写入关键指标
    row = 3
    for key, value in metrics.items():
        ws.cell(row=row, column=1, value=key).font = Font(bold=True)
        cell = ws.cell(row=row, column=2, value=round(value, 2) if isinstance(value, float) else value)
        if key == '环比增长':
            cell.number_format = '0.00"%"'
            cell.font = Font(color='FF0000' if value < 0 else '00AA00', bold=True)
        row += 1

    # 写入明细数据
    row += 1
    ws.cell(row=row, column=1, value='产品明细').font = Font(bold=True, size=12)
    row += 1
    for col_idx, col_name in enumerate(['产品', '销售额', '订单数', '占比'], 1):
        cell = ws.cell(row=row, column=col_idx, value=col_name)
        cell.font = header_font
        cell.fill = header_fill
        cell.border = thin_border

    product_stats = this_week.groupby('产品').agg(
        销售额=('销售额', 'sum'),
        订单数=('订单号', 'count')
    ).sort_values('销售额', ascending=False).reset_index()
    product_stats['占比'] = (product_stats['销售额'] / product_stats['销售额'].sum() * 100).round(1)

    for _, record in product_stats.iterrows():
        row += 1
        for col_idx, col_name in enumerate(['产品', '销售额', '订单数', '占比'], 1):
            cell = ws.cell(row=row, column=col_idx, value=record[col_name])
            cell.border = thin_border
            if col_name == '占比':
                cell.number_format = '0.0"%"'

    # 调整列宽
    ws.column_dimensions['A'].width = 20
    ws.column_dimensions['B'].width = 15
    ws.column_dimensions['C'].width = 15
    ws.column_dimensions['D'].width = 15

    wb.save(output_file)
    print(f'周报已生成: {output_file}')

# 使用
generate_weekly_report('销售数据.xlsx', '周报模板.xlsx')
```

## 场景5：自动发送Excel报表邮件

报表做好了还要手动发邮件？Python可以自动发送。

```python
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
import os

def send_report_email(
    smtp_server, smtp_port, sender_email, sender_password,
    recipients, subject, body, attachment_path
):
    """自动发送带附件的报表邮件"""
    msg = MIMEMultipart()
    msg['From'] = sender_email
    msg['To'] = ', '.join(recipients)
    msg['Subject'] = subject

    # 邮件正文
    msg.attach(MIMEText(body, 'plain', 'utf-8'))

    # 添加附件
    if os.path.exists(attachment_path):
        with open(attachment_path, 'rb') as f:
            part = MIMEBase('application', 'octet-stream')
            part.set_payload(f.read())
            encoders.encode_base64(part)
            filename = os.path.basename(attachment_path)
            part.add_header('Content-Disposition', f'attachment; filename="{filename}"')
            msg.attach(part)

    # 发送邮件
    with smtplib.SMTP(smtp_server, smtp_port) as server:
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
    print(f'邮件已发送给: {", ".join(recipients)}')

# 使用示例
send_report_email(
    smtp_server='smtp.example.com',
    smtp_port=587,
    sender_email='report@company.com',
    sender_password='your_password',
    recipients=['manager@company.com', 'team@company.com'],
    subject='周报 - 销售数据汇总',
    body='各位好，\n\n附件是本周销售数据汇总报表，请查收。\n\n关键指标：\n- 本周销售额：xxx\n- 环比增长：xx%\n\n详细数据请查看附件。',
    attachment_path='周报模板.xlsx'
)
```

**安全提示**：生产环境中不要把密码硬编码在脚本里，建议使用环境变量或配置文件。

## 完整自动化流水线

把以上5个场景串联起来，就是一个完整的自动化流水线：

```python
import schedule
import time

def weekly_workflow():
    """每周五自动执行完整流水线"""
    print(f'=== 开始执行周报流水线 {datetime.now()} ===')

    # Step 1: 合并各部门数据
    merge_excel_files('部门报表/', '原始数据_合并.xlsx')

    # Step 2: 生成透视分析
    create_pivot_table('原始数据_合并.xlsx', '销售分析.xlsx')

    # Step 3: 设置条件格式
    apply_conditional_formatting('销售分析.xlsx')

    # Step 4: 生成周报
    generate_weekly_report('原始数据_合并.xlsx', '本周周报.xlsx')

    # Step 5: 发送邮件
    send_report_email(
        smtp_server='smtp.example.com', smtp_port=587,
        sender_email='report@company.com', sender_password='xxx',
        recipients=['manager@company.com'],
        subject='周报 - 自动生成',
        body='附件是本周自动生成的销售周报。',
        attachment_path='本周周报.xlsx'
    )

    print('=== 周报流水线执行完成 ===')

# 定时任务：每周五下午5点执行
schedule.every().friday.at("17:00").do(weekly_workflow)

while True:
    schedule.run_pending()
    time.sleep(60)
```

## 总结

这5个场景覆盖了Excel办公中最常见的重复性操作：

1. **批量合并** - 多文件汇总
2. **数据透视** - 自动分析
3. **条件格式** - 可视化标注
4. **自动报表** - 一键生成
5. **邮件发送** - 自动分发

把这些脚本组合起来，你可以把每周几小时的Excel工作压缩到几分钟。Python自动化的核心价值不是让你学会写代码，而是让你把时间花在更有价值的事情上。
