---
layout: post
title: "我用Python写了一個地牢游戏引擎，然后决定开源它 | I Wrote a Python Dungeon Engine, Then Decided to Open-Source It"
date: 2026-06-18 09:40:00 +0800
categories: [产品, 游戏开发]
tags: [科幻小说]
---

2026年6月，我发布了一个东西：PyDungeon Engine。

一个用 **Python 3.13 + Pygame 2.6** 写的完整Roguelike地牢游戏引擎。4个文件，1986行代码，零外部资源依赖。下载，运行，玩。

---

## 为什么写这个

Python开发者想做游戏，第一条路是pygame——但pygame是个框架，不是游戏。

你想做地牢游戏，pygame告诉你"这里有画圆的函数"。你得自己写：
- BSP地牢生成算法
- 回合制战斗系统
- 视野（FOV）计算
- 敌人AI（巡逻/追击/逃跑）
- 物品掉落和背包系统
- 存档机制

把这些全部写出来，一个月过去了。

PyDungeon Engine把这件事缩短到：**改配置，30分钟出可玩版本**。

---

## 引擎里的10大系统

**1. BSP地牢生成**

二进制分割算法，每次生成不同的地牢布局。房间数量、大小、走廊宽度全部可调。

**2. 3职业12技能**

战士（近战/坦克）、法师（AOE/控制）、盗贼（暴击/闪避）。每个职业4个技能，有冷却、有消耗、有联动。

**3. 回合制战术战斗**

不是即时战斗——这一步走哪里、放哪个技能、喝哪瓶药，全部由你决定。真正的Roguelike体验。

**4. 完整物品系统（稀有度分级）**

普通（白）/ 精良（蓝）/ 稀有（紫）/ 传说（金）。武器、防具、消耗品、卷轴，共60+种物品。

**5. 7种敌人+3Boss AI**

敌人有不同行为模式：近战冲锋、远程射击、魔法召唤、巡逻守卫。Boss有阶段变换（血量<30%时进入狂暴模式）。

**6. FOV迷雾系统**

只看到视野内的东西。转过拐角，后面的区域重新陷入黑暗。每次游戏，地图记忆都在变化。

**7. 10层递进**

从地上一层的入口，到地下10层的Boss房间。每层的敌人强度、物品掉率、陷阱密度都不同。

**8. 角色成长**

等级、经验值、属性点（力量/敏捷/智力）。每次升级获得属性点和技能点，可以深度定制Build。

**9. JSON存档**

游戏进度自动保存到 `save.json`。下次启动可以继承角色——这对于Roguelike来说不常见，但很实用。

**10. Boss战机制**

3个Boss各有独特机制：火焰Boss（灼烧地面）、冰霜Boss（冰冻减速）、暗影Boss（召唤小怪）。不是数值碾压，是机制战。

---

## 代码质量

这么说可能不谦虚，但：**这个引擎的代码是我写过最干净的Python**。

原因很简单——我写它是为了当作品集的。每一个函数都有类型注解，每一个类都有docstring，核心算法（BSP、FOV、A*寻路）都单独注释了原理。

如果你是一个想学游戏开发的Python程序员，读这个引擎的代码，比读10篇教程更有用。

---

## 谁适合用这个引擎

**Python学习者**：想做一个"能跑起来的项目"，而不是跟着教程抄代码。PyDungeon Engine可以让你从"改配置"逐步进阶到"改核心逻辑"。

**独立游戏开发者**：需要一个快速原型工具。地牢游戏的核心系统（战斗/物品/敌人AI）都已经写好，你可以在上面做皮肤、做剧情、做关卡设计。

**游戏设计学生**：需要交一个"能玩的作品"。PyDungeon Engine是完整的游戏，不是Demo。你可以在一周内做出一个有自己的设定和美术的版本。

---

## 获取和方式

PyDungeon Engine 是 **一次性买断**，含完整源码。

购买后获得：
- 4个Python文件（main.py 1345行核心引擎 + 3个辅助模块）
- 完整使用文档（含架构说明和扩展指南）
- 7张产品图（PNG，适配4个销售平台）
- 12个月免费更新
- 30天无理由退款

已上架平台：
→ [Gumroad](https://segauser.gumroad.com/l/qluwur)
→ [Payhip](https://payhip.com/b/Cm6oK)
→ [itch.io](https://itch.io/)
→ [SAC](https://sellanycode.com/)

---
## I Wrote a Python Dungeon Engine, Then Decided to Open-Source It

In June 2026, I released something: PyDungeon Engine.

A complete Roguelike dungeon game engine written in **Python 3.13 + Pygame 2.6**. 4 files, 1986 lines of code, zero external asset dependencies. Download, run, play.

---

## Why I Built This

Python developers who want to make games start with pygame — but pygame is a framework, not a game.

To build a dungeon game, pygame gives you "here's a function to draw a circle". You have to write from scratch:
- BSP dungeon generation algorithm
- Turn-based combat system
- FOV (field of vision) calculation
- Enemy AI (patrol/chase/flee)
- Loot drop and inventory system
- Save/load mechanism

Doing all that takes a month.

PyDungeon Engine shrinks that to: **edit config, playable version in 30 minutes**.

---

## The 10 Systems Inside

**1. BSP dungeon generation.**

Binary space partitioning algorithm, generates different dungeon layouts each run. Room count, size, corridor width all tunable.

**2. 3 classes, 12 skills.**

Warrior (melee/tank), Mage (AOE/crowd control), Rogue (crit/dodge). 4 skills per class, with cooldowns, resource costs, and synergies.

**3. Turn-based tactical combat.**

Not real-time — where you move, which skill you cast, which potion you drink, all your decision. Real Roguelike experience.

**4. Complete item system (rarity tiers).**

Common (white) / Fine (blue) / Rare (purple) / Legendary (gold). Weapons, armor, consumables, scrolls — 60+ item types.

**5. 7 enemy types + 3 Boss AIs.**

Enemies have different behavior patterns: melee rush, ranged shot, magic summon, patrol guard. Bosses have phase transitions (enrage at <30% HP).

**6. FOV fog system.**

Only see what's in your field of vision. Turn a corner, the area behind it fades back into darkness. Map memory changes each run.

**7. 10 floors of progression.**

From the surface entrance to the Boss chamber on floor 10. Enemy strength, loot drop rate, trap density all vary by floor.

**8. Character progression.**

Level, XP, attribute points (STR/DEX/INT). Each level gives attribute and skill points — deep Build customization.

**9. JSON save.**

Game progress auto-saves to `save.json`. Next launch can resume the character — uncommon for Roguelikes, but practical.

**10. Boss fight mechanics.**

3 Bosses with unique mechanics: Flame Boss (burning ground), Frost Boss (freeze slow), Shadow Boss (summon minions). Not stat-checking — mechanism fights.

---

## Code Quality

This might sound immodest, but: **this engine's code is the cleanest Python I've ever written**.

The reason is simple — I wrote it to be a portfolio piece. Every function has type annotations, every class has docstrings, core algorithms (BSP, FOV, A* pathfinding) have inline comments explaining the principle.

If you're a Python programmer wanting to learn game development, reading this engine's code is more useful than 10 tutorials.

---

## Who This Is For

**Python learners**: Want a "actually runs" project, not copying tutorial code. PyDungeon Engine lets you progress from "edit config" to "modify core logic".

**Indie game developers**: Need a rapid prototyping tool. The core systems (combat/items/enemy AI) are all written — you can build skins, story, and level design on top.

**Game design students**: Need to submit a "playable piece". PyDungeon Engine is a complete game, not a Demo. You can make a version with your own setting and art within a week.

---

## Access and Pricing

PyDungeon Engine is a **one-time purchase**, includes full source code.

You get:
- 4 Python files (main.py 1345 lines core engine + 3 support modules)
- Complete documentation (architecture + extension guide)
- 7 product images (PNG, formatted for 4 sales platforms)
- 12 months free updates
- 30-day no-questions-asked refund

Available on:
→ [Gumroad](https://segauser.gumroad.com/l/qluwur)
→ [Payhip](https://payhip.com/b/Cm6oK)
→ [itch.io](https://itch.io/)
→ [SAC](https://sellanycode.com/)

---
