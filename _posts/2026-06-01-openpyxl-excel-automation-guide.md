---
layout: post
title: "5 Essential openpyxl Techniques Every Python Developer Should Know"
date: 2026-06-01 14:00:00 +0800
categories: [Python, Automation, Tutorial]
tags: [代码产品]
image: /assets/images/ai-tools.jpg
---

Excel files are everywhere in the business world. Whether you are processing financial reports, cleaning datasets, or generating invoices, Python's `openpyxl` library is the go-to tool for working with `.xlsx` files programmatically. In this article, I will walk you through five essential techniques that will make you significantly more productive with openpyxl.

## 1. Reading Data Efficiently

The most common task is reading data from an existing workbook. Here is how to do it properly, including handling merged cells and iterating through rows efficiently.

```python
from openpyxl import load_workbook

wb = load_workbook("sales_report.xlsx", data_only=True)
ws = wb.active

# Read all rows into a list of dictionaries
headers = [cell.value for cell in ws[1]]
data = []
for row in ws.iter_rows(min_row=2, values_only=True):
    data.append(dict(zip(headers, row)))

for record in data:
    print(f"{record['Product']}: ${record['Revenue']}")
```

The `data_only=True` parameter is crucial -- it returns calculated values instead of formulas. Using `iter_rows` with `values_only=True` is much faster than accessing individual cells when you only need the values.

## 2. Writing Data with Bulk Operations

Writing cell by cell is slow. Use bulk operations for better performance, especially with large datasets.

```python
from openpyxl import Workbook

wb = Workbook()
ws = wb.active
ws.title = "Employee Data"

# Write headers
headers = ["Name", "Department", "Salary", "Start Date"]
ws.append(headers)

# Write multiple rows at once
employees = [
    ["Alice Chen", "Engineering", 95000, "2023-03-15"],
    ["Bob Martinez", "Marketing", 78000, "2022-08-01"],
    ["Carol Davis", "Engineering", 102000, "2021-11-20"],
    ["David Kim", "Sales", 67000, "2024-01-10"],
]
for emp in employees:
    ws.append(emp)

# Auto-adjust column widths
for col in ws.columns:
    max_length = max(len(str(cell.value or "")) for cell in col)
    ws.column_dimensions[col[0].column_letter].width = max_length + 2

wb.save("employees.xlsx")
```

The `ws.append()` method is the fastest way to add rows. Notice the column width auto-adjustment trick -- this small detail makes your output files much more readable.

## 3. Applying Professional Styling

Raw data is hard to read. Proper styling makes your spreadsheets look professional and improves usability.

```python
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl import Workbook

wb = Workbook()
ws = wb.active

# Define styles
header_font = Font(name="Calibri", bold=True, color="FFFFFF", size=12)
header_fill = PatternFill(start_color="2F5496", end_color="2F5496", fill_type="solid")
header_align = Alignment(horizontal="center", vertical="center")
thin_border = Border(
    left=Side(style="thin"),
    right=Side(style="thin"),
    top=Side(style="thin"),
    bottom=Side(style="thin"),
)

# Apply header styling
headers = ["Quarter", "Revenue", "Expenses", "Profit"]
for col_idx, header in enumerate(headers, 1):
    cell = ws.cell(row=1, column=col_idx, value=header)
    cell.font = header_font
    cell.fill = header_fill
    cell.alignment = header_align
    cell.border = thin_border

# Add data rows with alternating colors
data = [
    ["Q1 2026", 150000, 98000, 52000],
    ["Q2 2026", 175000, 105000, 70000],
    ["Q3 2026", 162000, 101000, 61000],
]
light_fill = PatternFill(start_color="D6E4F0", end_color="D6E4F0", fill_type="solid")
for row_idx, row_data in enumerate(data, 2):
    for col_idx, value in enumerate(row_data, 1):
        cell = ws.cell(row=row_idx, column=col_idx, value=value)
        cell.border = thin_border
        cell.alignment = Alignment(horizontal="center")
        if row_idx % 2 == 0:
            cell.fill = light_fill

# Format currency columns
for row in range(2, 5):
    for col in range(2, 5):
        ws.cell(row=row, column=col).number_format = '$#,##0'

wb.save("styled_report.xlsx")
```

## 4. Adding Data Validation

Data validation prevents users from entering invalid data, which is essential for templates and shared workbooks.

```python
from openpyxl import Workbook
from openpyxl.worksheet.datavalidation import DataValidation

wb = Workbook()
ws = wb.active

# Headers
ws.append(["Task", "Priority", "Status", "Assignee"])

# Dropdown list for Priority column (column B)
priority_dv = DataValidation(
    type="list",
    formula1='"High,Medium,Low"',
    allow_blank=True,
)
priority_dv.error = "Please select a valid priority level"
priority_dv.errorTitle = "Invalid Priority"
priority_dv.prompt = "Choose from High, Medium, or Low"
priority_dv.promptTitle = "Priority Level"
ws.add_data_validation(priority_dv)
priority_dv.add("B2:B100")

# Dropdown list for Status column (column C)
status_dv = DataValidation(
    type="list",
    formula1='"Not Started,In Progress,Completed,Blocked"',
    allow_blank=True,
)
ws.add_data_validation(status_dv)
status_dv.add("C2:C100")

# Whole number validation for a numeric column
ws.append([""])
ws["D1"] = "Estimated Hours"
hours_dv = DataValidation(
    type="whole",
    operator="between",
    formula1="1",
    formula2="200",
)
hours_dv.error = "Hours must be between 1 and 200"
ws.add_data_validation(hours_dv)
hours_dv.add("D2:D100")

wb.save("task_tracker_template.xlsx")
```

## 5. Creating Charts Programmatically

Visualizing data directly in the Excel file adds tremendous value. openpyxl supports bar charts, line charts, pie charts, and more.

```python
from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference, LineChart
from openpyxl.chart.label import DataLabelList

wb = Workbook()
ws = wb.active

# Prepare data
ws.append(["Month", "Sales", "Target"])
monthly_data = [
    ["Jan", 42000, 40000],
    ["Feb", 38000, 40000],
    ["Mar", 51000, 45000],
    ["Apr", 47000, 45000],
    ["May", 55000, 50000],
    ["Jun", 62000, 50000],
]
for row in monthly_data:
    ws.append(row)

# Create a bar chart
chart = BarChart()
chart.type = "col"
chart.title = "Monthly Sales vs Target"
chart.y_axis.title = "Amount ($)"
chart.x_axis.title = "Month"
chart.style = 10

data_ref = Reference(ws, min_col=2, max_col=3, min_row=1, max_row=7)
cats_ref = Reference(ws, min_col=1, min_row=2, max_row=7)
chart.add_data(data_ref, titles_from_data=True)
chart.set_categories(cats_ref)
chart.shape = 4
chart.width = 18
chart.height = 12

# Add data labels
series = chart.series[0]
series.dLbls = DataLabelList()
series.dLbls.showVal = True

ws.add_chart(chart, "A10")
wb.save("sales_chart.xlsx")
```

## Putting It All Together

These five techniques cover the core workflows you will encounter when automating Excel with Python. Here is a quick reference:

| Technique | Use Case |
|---|---|
| Reading Data | Extracting data from existing reports |
| Bulk Writing | Generating reports from databases or APIs |
| Styling | Creating professional-looking output files |
| Data Validation | Building templates with controlled input |
| Charts | Adding visual summaries to your spreadsheets |

Install openpyxl with `pip install openpyxl` and start automating your Excel workflows today. The library is well-documented, actively maintained, and works perfectly with pandas when you need more advanced data manipulation.

---
*This article was originally published on my [blog](https://wdsega.github.io). Follow me for more articles on AI, Python, and automation.*
