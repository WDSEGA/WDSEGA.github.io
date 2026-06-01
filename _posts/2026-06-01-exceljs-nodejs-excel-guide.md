---
layout: post
title: "Generating Excel Files with JavaScript: A Complete Guide to ExcelJS"
date: 2026-06-01 16:00:00 +0800
categories: [JavaScript, NodeJS, Tutorial]
tags: [javascript, nodejs, excel, exceljs]
image: /assets/images/ai-tools.jpg
---

If you are building a web application or backend service with Node.js, chances are you will need to generate Excel files at some point. Whether it is exporting user data, creating reports, or building downloadable templates, **ExcelJS** is the most full-featured library for the job. It supports styling, formulas, images, charts, and even streaming for large files.

In this guide, I will show you how to use ExcelJS to generate professional Excel files with practical, real-world examples.

## Setup

Install ExcelJS in your project:

```bash
npm install exceljs
```

## Basic Workbook Creation

Let's start with the fundamentals -- creating a workbook, adding a worksheet, and writing data.

```javascript
const ExcelJS = require("exceljs");

async function createBasicReport() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Your App Name";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Sales Report", {
    properties: { tabColor: { argb: "2F5496" } },
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
    },
  });

  // Add column headers with width
  sheet.columns = [
    { header: "Product", key: "product", width: 25 },
    { header: "Category", key: "category", width: 15 },
    { header: "Price", key: "price", width: 12 },
    { header: "Quantity", key: "quantity", width: 12 },
    { header: "Total", key: "total", width: 14 },
  ];

  // Add rows
  const products = [
    { product: "Wireless Mouse", category: "Electronics", price: 29.99, quantity: 150 },
    { product: "USB-C Cable", category: "Electronics", price: 12.99, quantity: 300 },
    { product: "Desk Lamp", category: "Furniture", price: 45.00, quantity: 80 },
    { product: "Notebook Set", category: "Stationery", price: 8.50, quantity: 500 },
    { product: "Monitor Stand", category: "Furniture", price: 65.00, quantity: 45 },
  ];

  products.forEach((item) => {
    const row = sheet.addRow(item);
    // Add formula for Total column
    row.getCell(5).value = { formula: `C${row.number}*D${row.number}` };
  });

  // Add totals row
  const totalRow = sheet.addRow({
    product: "TOTAL",
    price: { formula: "SUM(C2:C6)" },
    quantity: { formula: "SUM(D2:D6)" },
    total: { formula: "SUM(E2:E6)" },
  });

  await workbook.xlsx.writeFile("basic_report.xlsx");
  console.log("Report created successfully!");
}

createBasicReport();
```

## Applying Styles

ExcelJS gives you fine-grained control over cell formatting. Here is how to make your reports look polished.

```javascript
async function createStyledReport() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Q2 Revenue");

  // Define shared styles
  const headerStyle = {
    font: { bold: true, color: { argb: "FFFFFFFF" }, size: 12 },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "2F5496" } },
    alignment: { horizontal: "center", vertical: "middle" },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    },
  };

  const currencyFormat = '"$"#,##0.00';
  const altRowFill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "D6E4F0" },
  };

  // Add headers
  const headers = ["Month", "Revenue", "Expenses", "Net Profit", "Margin"];
  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.style = headerStyle;
  });
  sheet.getRow(1).height = 28;

  // Add data with styling
  const data = [
    ["April", 125000, 82000],
    ["May", 148000, 91000],
    ["June", 162000, 97500],
    ["July", 139000, 88000],
  ];

  data.forEach((row, index) => {
    const dataRow = sheet.addRow([
      row[0],
      row[1],
      row[2],
      { formula: `B${index + 2}-C${index + 2}` },
      { formula: `D${index + 2}/B${index + 2}` },
    ]);

    // Apply alternating row colors
    if (index % 2 === 1) {
      dataRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = altRowFill;
      });
    }

    // Format currency columns
    dataRow.getCell(2).numFmt = currencyFormat;
    dataRow.getCell(3).numFmt = currencyFormat;
    dataRow.getCell(4).numFmt = currencyFormat;
    dataRow.getCell(5).numFmt = "0.0%";
  });

  // Freeze header row
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  await workbook.xlsx.writeFile("styled_report.xlsx");
}

createStyledReport();
```

## Adding Images and Conditional Formatting

Sometimes you need to embed logos or apply conditional formatting to highlight important data.

```javascript
async function createAdvancedReport() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Dashboard");

  // Add a logo image (top-left corner)
  const imageId = workbook.addImage({
    filename: "logo.png",
    extension: "png",
  });
  sheet.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: 150, height: 50 },
  });

  // Add data starting below the image
  sheet.addRow([""]);
  const headers = ["Employee", "Score", "Rating"];
  const headerRow = sheet.addRow(headers);
  headerRow.font = { bold: true, size: 11 };
  headerRow.height = 24;

  const scores = [
    ["Alice", 95],
    ["Bob", 72],
    ["Carol", 88],
    ["David", 45],
    ["Eve", 91],
    ["Frank", 63],
  ];

  scores.forEach(([name, score]) => {
    const row = sheet.addRow([name, score]);
    row.getCell(3).value = {
      formula: `IF(B${row.number}>=90,"Excellent",IF(B${row.number}>=70,"Good","Needs Improvement"))`,
    };
  });

  // Conditional formatting: highlight scores below 70 in red
  sheet.addConditionalFormatting({
    ref: "B4:B9",
    rules: [
      {
        type: "cellIs",
        operator: "lessThan",
        formulae: [70],
        style: {
          font: { color: { argb: "FF0000" }, bold: true },
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFC7CE" } },
        },
      },
    ],
  });

  // Conditional formatting: highlight scores 90+ in green
  sheet.addConditionalFormatting({
    ref: "B4:B9",
    rules: [
      {
        type: "cellIs",
        operator: "greaterThanOrEqual",
        formulae: [90],
        style: {
          font: { color: { argb: "006100" }, bold: true },
          fill: { type: "pattern", pattern: "solid", fgColor: { argb: "C6EFCE" } },
        },
      },
    ],
  });

  await workbook.xlsx.writeFile("advanced_report.xlsx");
}

createAdvancedReport();
```

## Streaming Large Files

When generating reports with tens of thousands of rows, loading everything into memory is not practical. ExcelJS supports streaming mode for memory-efficient generation.

```javascript
const ExcelJS = require("exceljs");

async function createLargeReport() {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    filename: "large_report.xlsx",
    useSharedStrings: true,
    useStyles: true,
  });

  const sheet = workbook.addWorksheet("Transactions");

  // Add headers
  sheet.addRow(["Transaction ID", "Date", "Amount", "Status"]).commit();

  // Stream 100,000 rows without loading into memory
  for (let i = 1; i <= 100000; i++) {
    const row = sheet.addRow([
      `TXN-${String(i).padStart(8, "0")}`,
      new Date(2026, 0, 1 + Math.floor(Math.random() * 180))
        .toISOString()
        .split("T")[0],
      (Math.random() * 1000).toFixed(2),
      Math.random() > 0.1 ? "Completed" : "Pending",
    ]);
    row.commit(); // Flush row to disk

    if (i % 10000 === 0) {
      console.log(`Written ${i} rows...`);
    }
  }

  await workbook.commit();
  console.log("Large report generated successfully!");
}

createLargeReport();
```

The key difference with streaming is calling `row.commit()` after each row and `workbook.commit()` at the end. This writes data to disk incrementally instead of holding everything in memory.

## Express.js API Integration

Here is a practical example of serving Excel downloads from an Express API endpoint:

```javascript
const express = require("express");
const ExcelJS = require("exceljs");

const app = express();

app.get("/api/export/users", async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Users");

    sheet.columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Created At", key: "createdAt", width: 20 },
    ];

    // Replace with your actual data source
    const users = await fetchUsersFromDatabase();
    users.forEach((user) => sheet.addRow(user));

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=users_export.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: "Export failed" });
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));
```

## Quick Reference

| Feature | Method |
|---|---|
| Create workbook | `new ExcelJS.Workbook()` |
| Add worksheet | `workbook.addWorksheet("Name")` |
| Set columns | `sheet.columns = [...]` |
| Add row | `sheet.addRow(data)` |
| Apply style | `cell.style = {...}` |
| Add formula | `cell.value = { formula: "..." }` |
| Conditional formatting | `sheet.addConditionalFormatting({...})` |
| Stream mode | `new ExcelJS.stream.xlsx.WorkbookWriter({...})` |
| Write to response | `workbook.xlsx.write(res)` |

ExcelJS is a powerful tool that belongs in every Node.js developer's toolkit. Whether you are building simple data exports or complex financial reports, it handles the job well.

---
*This article was originally published on my [blog](https://wdsega.github.io). Follow me for more articles on AI, Python, and automation.*
