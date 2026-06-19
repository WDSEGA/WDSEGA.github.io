---
layout: post
title: "我把算法面试练习做成了一个Git仓库游戏：GitQuest Pro的另一个用法 | I Turned Algorithm Interview Prep Into a Git-Based RPG: GitQuest Pro's Hidden Use Case"
date: 2026-06-19 10:30:00 +0800
categories: [代码产品]
tags: [代码产品]
author: 编译员
excerpt: "GitQuest Pro本来是算法学习工具。但我发现它还有一个用法：当面试备考系统。从数据结构到系统设计，用Git提交历史追踪你的学习轨迹。"
---

三个月前，有人在HackerNews上发了一句话：

> "面试备考最难的不是刷题，是不知道自己刷到哪里了。"

这句话点到了问题核心。

大多数人的刷题方式是：打开LeetCode，做一道，关掉，下次再打开，忘了上次做到哪里，再做一道不相关的。

没有系统，没有进度，没有上下文。

---

## Git是天然的学习追踪系统

这是我用GitQuest Pro一段时间后的发现。

GitQuest Pro的核心设计是：把算法题目组织成Git仓库，每道题是一个commit，每个主题是一个branch。你提交代码，就是在推进游戏进度。

但这个结构还有一个副产品：**完整的学习历史**。

三个月后回头看你的commit log：
```
feat: 实现二叉树层序遍历（BFS）
feat: 动态规划入门 - 爬楼梯
feat: 图遍历 - Dijkstra最短路径
fix: 修复滑动窗口边界条件
```

这比任何刷题APP的进度条都直观。

---

## 面试场景的具体用法

**第一步：建立topic分支**

GitQuest Pro预设了标准的算法分类branch：
- `arrays-and-strings`
- `trees-and-graphs`
- `dynamic-programming`
- `system-design-fundamentals`

每个分支有对应的题目和讲解文档。

**第二步：按难度递进**

每个分支内，题目按Easy→Medium→Hard排列，附有时间复杂度分析和多种解法。不是只给你一个答案，而是告诉你为什么这个答案比另一个好。

**第三步：提交即记录**

做完一道题，`git commit`。提交信息里写你的思路。一个月后，这些记录就是你的复习材料。

---

## 为什么不直接用LeetCode

LeetCode很好，但它是**孤立的**。

每道题是独立的，没有和你本地代码库的连接，没有版本控制，没有可以回溯的思考过程。

GitQuest Pro的设计是：**让算法学习进入你日常的开发工作流**。你已经在用Git了，把学习也放进来，没有额外摩擦。

---

## 有没有什么不足

有。

GitQuest Pro不是在线评测系统，没有自动判题。你需要自己本地运行测试用例验证答案。对习惯了LeetCode即时反馈的人，需要适应一下。

但如果你已经过了"会不会写"的阶段，在准备面试的"稳不稳、快不快"阶段，GitQuest Pro的价值更大。

---

**GitQuest Pro** 已在以下平台上架：
- [Gumroad](https://segauser.gumroad.com/l/gitquest-pro)
- [Payhip](https://payhip.com/b/gitquest)
- itch.io 和 SellAnyCode

---

I Turned Algorithm Interview Prep Into a Git-Based RPG: GitQuest Pro's Hidden Use Case

Most people's interview prep looks like this: open LeetCode, do a problem, close it, forget where they left off, repeat. No system, no progress tracking, no context.

GitQuest Pro's core design organizes algorithm problems as Git commits and branches. Each problem is a commit. Each topic is a branch. But there's a useful side effect: **a complete learning history** in your git log.

Three months of commits looks like:
```
feat: implement BFS level-order traversal
feat: dynamic programming intro - climbing stairs
feat: graph traversal - Dijkstra shortest path
fix: fix sliding window boundary condition
```

**How to use it for interview prep:** Use the built-in topic branches (arrays-and-strings, trees-and-graphs, dynamic-programming, system-design-fundamentals). Problems are ordered Easy→Medium→Hard with time complexity analysis and multiple solution approaches.

**Why not just LeetCode:** LeetCode is isolated. Each problem is disconnected from your local codebase, no version control, no revisitable thought process. GitQuest Pro plugs algorithm learning into your existing development workflow — you're already using Git, adding learning here has zero friction.

**One honest limitation:** No online judge. You run test cases locally. If you're used to LeetCode's instant feedback, there's an adjustment period. But for the "consistency and speed" phase of interview prep, GitQuest Pro adds real value.

Available on Gumroad, Payhip, itch.io, and SellAnyCode.

*Deskless Daily — AI-compiled tech intelligence, updated daily.*
*Full analysis: [https://wdsega.github.io](https://wdsega.github.io)*
