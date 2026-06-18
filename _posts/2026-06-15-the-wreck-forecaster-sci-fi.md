---
layout: post
title: "沉船预报员 - 科幻短篇小说 | The Wreck Forecaster — A Sci-Fi Short Story"
date: 2026-06-15 20:40:00 +0800
categories: 科幻
tags: [科幻小说]
---

## 中文

### 一

阿福第一次发现那个bug，是他入职"澄海"导航公司的第三个月。

"澄海"做的是全球航运AI航线规划——不是百度地图那种，是真正的大洋航线。绕过风暴、避开海盗区、走洋流最省油的路线。他们的AI叫"海图"，在全球43个航运公司里跑着，每天规划一千多条航线。

那天下午，阿福在做例行复盘的时候发现了一条船——"明瑞号"——的航线被"海图"推荐绕了一个巨大的弧线。绕行的距离多出了一千一百海里，多烧了十四万美元的油。

他查了半天，没找到绕行的原因。没有风暴、没有海盗、没有洋流异常。他写了一个bug报告：『航线ID: 100472 明瑞号 不合理的航线绕行，疑似算法错误。』

### 二

技术经理老方看了他的报告，没说话。拧开保温杯，喝了口茶，然后在电脑上打开了一个阿福从来没见过的后台面板。

"你看到的是航线绕行，"老方说，"但你看不见的是——如果我们不走那条绕路，5天之后，明瑞号会撞上一艘漂流的无人集装箱船。在凌晨三点十五分，天气晴朗，海况平静。雷达会检测到，但明瑞号吃水太深，转向半径不够。撞击角度，船首右舷23度。三号货舱进水，三到五个小时沉没。"

阿福盯着屏幕上那些数字，难以置信："你说的不是'可能会撞'——你说的是一个还没有发生的事情。"

"'海图'不是在做路线规划，"老方把保温杯放回桌上，杯底磕在桌面上的声音很轻，但阿福觉得那声很重。"'海图'在做的是一种时空概率运算——不是'哪条路最近'，而是'哪条路让这条船不沉'。"

### 三

老方说，"海图"的核心模块从来不是AI。AI是给外部看的。

真正干活的是一个叫"暗礁引擎"的系统。暗礁引擎的运作原理，按照老方的解释，是这样的：全球所有船只的AIS轨迹数据、洋流温度、货舱载荷、船员值班排班、港口起重机维修记录、甚至天气图上的每一个气压变化，都在一条因果链上。

一条船会不会沉，在物理层面是由一个不可逆的因果序列决定的：船的设计→装载方式→航线选择→航道状况→船员反应时间。这些因素在"海图"被激活之前就已经在动了——就像多米诺骨牌已经推倒了第一块。暗礁引擎做的事，就是在某一张骨牌倒下之前，伸手按住它旁边的另一张骨牌，让链条断掉。

"海图"不是AI。它是一个**因果干预系统**。

### 四

阿福把明瑞号的原始数据和绕行建议全部核对了一遍。在绕行路线的第37个航点之后，暗礁引擎的计算路径里出现了一串加密的干预日志。日志里只有三行字：

```
干预ID: WRK-2047
事件概率: 99.97%
干预后概率: 0.13%
结果: 成功
预计避免损失: $127,300,000
```

明瑞号是一艘74000吨的散货船，载着铁矿石，从澳大利亚开往中国青岛。船上有32名船员。那艘被预测会跟它相撞的无名集装箱船——暗礁引擎在导航记录里查到它最后被一艘拖船拖走的时间，正好是明瑞号绕行航线的第二天。

拖船公司是"澄海"通过第三方签约的。

老方说，公司成立六年，用这个引擎干预了四百多次"沉船事件"——其中至少有三十七次属于"绝对有效干预"，像明瑞号那样绕行避开一条正在漂向碰撞航线的无主船。剩下的几百次干预的效果无法精确验证，因为干预本身改变了因果关系，被干预的事件没有发生，所以在统计上永远无法证明"如果没有干预会怎样"。

暗礁引擎的悖论就在这里：**它做的事情在物理上可以被验证，在逻辑上永远不能被证明。**

### 五

阿福问："我们为什么不公开这个引擎？"

老方说："因为一旦公开，就必须要回答一个问题：你们为什么没救那艘船？"

去年秋天，一艘12000吨的化学品船在印度洋起火爆炸，27人遇难。暗礁引擎在爆炸前57小时生成了一个干预方案，成功率94%。但方案里有一个关键步骤——让一艘附近海域的钻井平台开启备用动力系统，为化学品船的应急冷却系统远程供电。这个步骤需要钻井平台的所有者——某家国际石油公司——在两小时内同意这个请求。

那家石油公司拒绝了。他们在内部邮件里的原话是："我们不承担任何责任，不提供任何动力，不参与任何形式的风险转移。"

老方喝完了保温杯里的茶，合上盖子，说："我们不是救不了。我们是没有权力救。知道这两者有什么区别吗？"

他知道答案，但他还是让老方说出来了。老方说："前者是技术问题，后者是政治问题。技术问题可以通过技术解决。政治问题不能通过技术解决，但政治问题用技术包装之后，就可以推给技术去背锅。"

---

## English

### I

Ah Fu found the bug in his third month at "ClearSea" Navigation.

ClearSea handled global shipping AI route planning — real ocean routes, bypassing storms, piracy zones, optimizing fuel consumption. Their AI, "SeaChart," ran across 43 global shipping companies, plotting a thousand routes daily.

During a routine review, Ah Fu noticed the *Mingrui* — a 74,000-ton bulk carrier — had been routed on a massive detour. Extra distance: 1,100 nautical miles. Extra fuel cost: $140,000.

No storm. No pirates. No current anomaly. He filed a bug report: "Route ID: 100472. Mingrui. Unexplained route detour. Suspected algorithm error."

### II

His manager, Old Fang, read the report. Didn't say anything. Opened his thermos, took a sip of tea, then pulled up a backend panel Ah Fu had never seen.

"What you're seeing is a detour," Old Fang said. "What you're not seeing is this: if we hadn't taken that detour, five days later, the Mingrui would have collided with a drifting unmanned container ship. At 3:15 AM. Clear skies, calm seas. Radar would have detected it, but the Mingrui was too deep-draft to turn in time. Impact angle: 23 degrees starboard bow. Cargo hold three breached. Three to five hours to sink."

Ah Fu stared at the numbers. "You're not saying 'might have collided.' You're describing something that hasn't happened yet."

"SeaChart isn't doing route planning," Old Fang said, setting his thermos down. The sound of it hitting the desk was soft. But Ah Fu felt it like a hammer. "SeaChart is doing probabilistic intervention — not 'which route is shortest,' but 'which route keeps this ship from sinking.'"

### III

The core of SeaChart had never been AI. AI was the public-facing wrapper.

The real engine was called "Reef Engine." Its principle, as Old Fang explained it: every ship's AIS trajectory data, ocean temperatures, cargo loads, crew watch schedules, port crane maintenance records, every pressure change on a weather map — connected in a single causal chain.

Whether a ship sinks is physically determined by one irreversible causal sequence: design → loading → route → waterway conditions → crew response time. Those dominoes are already falling before SeaChart activates. Reef Engine's job: find one domino about to fall, reach in, and press down on the domino next to it — breaking the chain.

SeaChart wasn't AI. It was a **causal intervention system**.

### IV

Ah Fu verified all the Mingrui's raw data. In the detour route, at waypoint 37 onward, he found an encrypted intervention log. Three lines:

```
Intervention ID: WRK-2047
Event probability: 99.97%
Post-intervention probability: 0.13%
Result: Success
Estimated loss avoided: $127,300,000
```

The Mingrui carried iron ore from Australia to Qingdao. 32 crew members. The unnamed container ship predicted to collide with it — Reef Engine's records showed it was towed away by a salvage tug exactly one day after the Mingrui's detour began.

The tug company had been contracted by ClearSea through a third party.

Old Fang said: six years, over four hundred "wreck interventions." Thirty-seven verified as definitively effective. The rest — impossible to prove statistically. Because the intervention itself changed the causal chain. The prevented event never happened. You can never statistically prove "what would have happened without the intervention."

That was Reef Engine's paradox: **what it does is physically verifiable, but logically unprovable.**

### V

Ah Fu asked: "Why don't we publish this engine?"

Old Fang said: "Because once we do, we have to answer a question: why didn't you save that other ship?"

Last autumn, a 12,000-ton chemical tanker caught fire in the Indian Ocean. Twenty-seven dead. Reef Engine generated an intervention 57 hours before the explosion — 94% success rate. But the plan required one critical step: a nearby offshore drilling platform had to activate its backup power to remotely supply the tanker's emergency cooling system. The platform's owner — an international oil company — had to approve within two hours.

They refused. Their internal email read: "We assume no liability, provide no power, participate in no form of risk transfer."

Old Fang drained his tea, screwed the thermos shut. "We didn't fail to save them. We weren't authorized to save them. Do you see the difference?"

Ah Fu did. But he let Old Fang say it.

"The first is a technical problem. Technical problems have technical solutions. The second is a political problem. Political problems don't have technical solutions. But if you package a political problem in technical wrapping paper — you can hand it to the engineers to take the blame."
