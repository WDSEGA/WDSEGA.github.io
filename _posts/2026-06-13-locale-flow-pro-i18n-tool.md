---
layout: post
title: "i18n翻译管理太头疼？LocaleFlow Pro帮你一键提取、检测、翻译所有语言文件"
date: 2026-06-13 14:00:00 +0800
categories: [开发工具, i18n]
tags: [代码产品]
canonical_url: "https://wdsega.github.io/2026/06/13/locale-flow-pro-i18n-tool.html"
---

## 你项目的i18n文件，多久没完整检查过了？

我上个月接了个外包项目，Vue + i18n，中英法三语。接手的时候，客户说"翻译都准备好了，你接进去就行"。

结果接进去以后，页面上到处是`[missing translation: home.hero]`。

打开`fr.json`一看——370个key，118个值是空的，或者值是英语（翻译偷懒直接copy了英语原文）。

手动对？370个key，3个文件，1110个值。我算了下，按每个值10秒算，要3小时。而且容易漏。

## 用Python写了个工具，40秒跑完

核心逻辑不复杂：

1. **提取**：扫代码里的`$t('key')`或`t('key')`，拿出所有用到的key
2. **检测**：比对每个语言文件的key，找出缺失、多余、过期
3. **验证**：检查占位符一致性（`{name}`在英语翻译里有，`{nombre}`在西班牙语里也有）
4. **翻译**：接LibreTranslate API，自动填充空值
5. **报告**：生成HTML报告，直观看到哪些key有问题

写出来以后，发现不止我一个人需要。组里另一个项目（React + TypeScript + i18next）也能用——只要改一下提取器，支持`.tsx`文件里的`useTranslation()`调用。

## 支持了哪些格式

| 格式 | 支持 |
|------|------|
| JSON (i18next) | ✅ |
| YAML (Rails) | ✅ |
| PO/MO (GNU gettext) | ✅ |
| Python (.py 字符串) | ✅ |
| JavaScript/TypeScript | ✅ |
| React (.tsx) | ✅ |

如果是没见过的格式，工具会提示"不支持"，不会静默失败。

## 一个真实bug：占位符不一致

我自己的项目里发现一个bug：

```json
// en.json
"welcome": "Hello, {name}!"

// fr.json  
"welcome": "Bonjour {nom}!"
```

英文用`{name}`，法文用`{nom}`。运行时不会报错，但如果你在代码里传`name`参数，法文显示就会漏掉名字。

这个bug手工检查很难发现，因为——谁会去逐个比对每个key的占位符格式？

工具跑一遍，直接在报告里标红：`[WARNING] welcome: placeholder mismatch: en={name}, fr={nom}`。

## 开源还是商用？

这个工具我整理了一下，打包成了一个Python包，叫**LocaleFlow Pro**。

包含：
- 完整的Python代码（7个核心模块）
- 5个使用示例（JSON/YAML/PO/Python/TSX）
- 一个"附赠案例"：用工具完整处理一个Vue i18n项目的全过程记录
- 法律免责声明

定价：$19.84（一次性买断，无订阅）。

如果你项目里也有i18n文件，不妨试一下。比手动对key快100倍，还能顺带发现一些你没注意到的bug。

链接：[Payhip购买](https://payhip.com/b/1X8c3) | [Gumroad购买](https://segauser.gumroad.com/l/guytly)

*（本文提及的LocaleFlow Pro为作者开发的数字产品，购买后获取完整源代码和使用文档。）*
