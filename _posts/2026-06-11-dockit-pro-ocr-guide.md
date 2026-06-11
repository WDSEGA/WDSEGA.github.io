---
layout: post
title: "五行命令搞定OCR：DocKit Pro文字识别实战"
date: 2026-06-11 10:40:00 +0800
categories: [工具, Python]
tags: [Python, OCR, 文字识别, 自动化]
---

扫描件里的文字提取不出来，是很多人卡住的地方。

商业OCR服务一般按页收费，或者有月度限额。如果你要处理的是几百份扫描报告、合同、发票，费用会很快累积。

本地OCR是更好的选择：一次安装，无限使用，数据不出本机。

## 环境准备

DocKit Pro的OCR模块基于Tesseract，支持100+语言（含中文简繁体、英语、日语等）。

```bash
# Windows安装Tesseract
# 1. 下载 https://github.com/UB-Mannheim/tesseract/wiki
# 2. 安装时勾选中文语言包

# 验证安装
tesseract --version
```

## 最常用的场景

**场景1：扫描图片提取文字**

```bash
python main.py ocr image --input scan.jpg --lang chi_sim --output result.txt
```

输出为纯文本，直接可以复制编辑。

**场景2：扫描版PDF提取全文**

```bash
python main.py ocr pdf --input contract_scan.pdf --lang chi_sim+eng --output extracted.txt
```

混合中英文文档加`chi_sim+eng`参数，识别率明显提升。

**场景3：批量处理整个文件夹**

这是最节省时间的用法。几百张扫描件丢一个文件夹，一条命令全部处理：

```bash
python main.py ocr batch --input ./scans/ --lang chi_sim --output ./results/ --format txt
```

输出格式支持`txt`、`json`（含坐标信息）、`csv`（适合表格数据）。

## 实测识别率

测试材料：100份打印版合同扫描件（A4、300dpi、黑白）

| 文档类型 | 识别率 | 备注 |
|---------|--------|------|
| 标准打印字体 | ~98% | 几乎无误 |
| 手写体（清晰） | ~72% | 识别率一般 |
| 低质量扫描（150dpi） | ~85% | 有偏差 |
| 表格数据 | ~94% | 结构基本保留 |

打印版文档识别率接近商业产品，手写体是Tesseract的短板（所有OCR都有这个问题）。

## 进阶：批量提取表格数据

如果要从发票、表格扫描件提取结构化数据：

```bash
python main.py ocr image --input invoice.jpg --lang chi_sim --format json
```

JSON输出包含每个识别文字块的坐标和置信度，方便进一步解析。

## 和付费服务对比

| 服务 | 价格 | 月限额 | 隐私 |
|------|------|--------|------|
| Adobe Acrobat OCR | $199/年 | 无限 | 上传至云端 |
| 百度OCR API | ¥0.004/次 | 按量付费 | 上传至云端 |
| DocKit Pro（Tesseract） | $24.84一次性 | 无限 | 本地处理 |

数据不离开本地，对合同、财务文件等敏感材料来说这一点很重要。

[DocKit Pro 在 Payhip 获取（$24.84，一次性）](https://payhip.com/b/9dTqi)

---

*更多Python自动化实战，关注 [wdsega.github.io](https://wdsega.github.io)*
