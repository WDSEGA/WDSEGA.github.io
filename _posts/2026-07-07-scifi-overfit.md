---
layout: post
title: "过度拟合 | The Overfit — A Sci-Fi Short Story"
date: 2026-07-07 12:00:00 +0800
categories: [科幻, Sci-Fi]
tags: [scifi, shortstory]
description: "预测模型完美预测了每个人的行为——直到一个人拒绝按预测行动。"
author: 编译员
---

# 过度拟合 | The Overfit

> 它预测了我会买咖啡，我买了。它预测了我会走左边，我走了。它预测了我会说"不"，我说了。直到有一天，它预测了我会笑。

陈默第一次注意到系统出错，是在便利店的收银台前。

他每周三早上八点十五分在这家便利店买一杯美式咖啡，不加糖。系统知道这件事。他也知道系统知道。这种默契持续了三年，直到那个周三的早上，他走进便利店，收银台上已经放好了一杯美式。

"预付了，"店员指了指头顶的摄像头，"系统说您今天会来。"

陈默拿起咖啡。温的，不是热的。预付意味着系统在他到达之前就下单了——提前至少五分钟。也就是说，系统不仅预测了他会来，还预测了他到店的确切时间。

他应该感到方便。但他感到不安。

***

市政厅的"预知系统"上线已经两年了。官方名称叫"城市行为优化平台"，但市民们叫它"先知"。先知的模型在每个人的手机、每个路口的摄像头、每栋楼的门禁系统里都有触角。它不监控你——它预测你。

先知的准确率是97.3%。这个数字来自市政厅的年度报告，没有人质疑过。因为97.3%意味着每100个预测里只有不到3个错误，而那3个"错误"通常被归因于"用户临时改变主意"——换句话说，不是系统错了，是你不正常。

陈默在市政厅数据局工作了八年。他的工作是维护先知的预测管线。他知道系统的架构：一个多模态时序模型，输入是你的位置历史、消费记录、社交频率、睡眠模式（通过手机传感器估算），输出是你在未来一小时内的行为概率分布。

他也知道一个公开的秘密：先知的训练数据就是全城700万人的行为日志。模型在预测你，用的是你自己和所有跟你相似的人的数据。它的97.3%准确率，本质上是说你和过去的你以及跟你一样的人高度相似。

这听起来合理。但陈默最近开始怀疑：如果一个人和过去的自己不够相似呢？

***

事情的转折发生在一个周四。

先知预测陈默会在下午两点到三点之间去城西的公园跑步。这是他两年的习惯——周四下午跑步，路线固定。但那天下午他的前同事林薇突然打来电话，说她在城北的咖啡馆，问他要不要见一面。

林薇三年前调去了另一个城市，这次是临时回来。陈默说好。

他去了城北。先知的预测错了。

下午四点，陈默的手机响了。是数据局的同事老周。

"你今天下午没去跑步？"

"没有，怎么了？"

"先知给你标了一个异常。我帮你清掉了，但系统日志里有记录。你这个月第二次了。"

陈默沉默了几秒。"第二次？第一次是什么时候？"

"上周六。先知预测你在家做饭，但你叫了外卖。"

叫外卖。这是异常。在先知的世界里，叫外卖而不是做饭，需要被标记、被清理、被解释。

"老周，"陈默说，"一个人偶尔改变计划，不是很正常吗？"

电话那头沉默了一会儿。"在97.3%里不正常。"

***

那天晚上陈默睡不着。他打开笔记本电脑，连上数据局的内网，调出了自己的预测日志。

每一行都是先知对他行为的预测和实际结果：

```
2026-06-12 07:45 预测: 便利店买咖啡  实际: 便利店买咖啡  匹配
2026-06-12 12:00 预测: 食堂吃饭    实际: 食堂吃饭    匹配
2026-06-12 18:30 预测: 回家        实际: 回家        匹配
...
2026-06-14 14:00 预测: 城西公园跑步  实际: 城北咖啡馆   不匹配 ★
2026-06-15 18:00 预测: 做饭        实际: 叫外卖      不匹配 ★
```

两颗星。两次不匹配。在他八年的日志里，总共只有11次不匹配。

他继续往下翻。在日志的最后，有一条还没有实际结果的预测——明天的：

```
2026-07-08 09:00 预测: 在办公室开会  实际: 待记录
```

明早九点开会。他看了一眼日历——确实有一个会。但那个会是可选的，他可以不去。

他盯着屏幕看了很久。

然后他做了一件他从未做过的事：他把闹钟定在了十点。

***

第二天早上，陈默没有去开会。他在家待到十点，然后去了城东的一个旧书市场——他已经三年没去过了。

手机没有响。老周没有打电话。

但当他回到家打开电脑时，发现日志里多了一条注释：

```
2026-07-08 09:00 预测: 在办公室开会  实际: 旧书市场   不匹配 ★
备注: 用户行为模式出现系统性偏移，建议升级风险等级。
```

"系统性偏移"。不是"临时改变主意"。是"系统性偏移"。

陈默感到一阵寒意。先知不认为他是在行使自由意志——它认为他是在变成另一种人。一个需要被"升级风险等级"的人。

***

接下来的两周，陈默刻意做了一些"不可预测"的事。他换了上班路线。他在不同的时间吃午饭。他在工作日请了一天假去了海边。

每次，日志里都会出现一颗星。每次，备注都变得更长。

到第14天，他的不匹配次数从11次变成了23次。准确率从98.6%（他的个人历史值）降到了96.8%。

那天下午，老周来找他了。不是打电话，是当面来。

"陈默，"老周坐下来，表情不像同事，更像医生，"局里想让你参加一个测试。"

"什么测试？"

"先知的行为校准。你的偏移模式很特殊——不是随机偏移，是有方向性的。先知认为……"他停顿了一下，"它认为你在试图绕过预测。"

"我在试图自由行动。"

老周看着他，叹了口气。"在先知的框架里，这两个描述是等价的。"

***

测试很简单：先知会给出一个预测，陈默需要执行。如果执行结果与预测匹配，校准通过。如果不匹配，记录偏差。

第一个预测：下午两点，你会去楼下的自动售货机买一瓶矿泉水。

陈默看了看时钟。一点五十分。他确实渴了。他想了一下，决定不去售货机，而是去茶水间接水。

偏差记录。

第二个预测：明天早上你会穿蓝色的衬衫。

明天早上。他有一件蓝色衬衫，是他最常穿的。但他也有一件灰色的。

第二天他穿了灰色。

偏差记录。

第三个预测：下周一你会给母亲打电话。

陈默的母亲住在另一个城市。他们每周一晚上通电话，已经持续了五年。这是先知最容易预测的行为之一。

周一晚上，陈默拿起了手机。他看着通讯录里母亲的名字。他知道如果他拨出去，偏差就会归零，先知就会说"看，他恢复了正常"。他也知道如果他不拨，就是第24次不匹配。

他拨了。

不是因为先知预测了。是因为他想和母亲说话。

但他无法证明这一点。在先知的日志里，这只会被记录为"匹配"。

***

陈默后来辞去了数据局的工作。不是因为他被打上了高风险标签，也不是因为被要求参加更多校准测试。

是因为他发现了一件事。

在整理自己三年来的预测日志时，他注意到一个规律：那些"不匹配"的记录——他改路线、换餐馆、叫外卖的记录——全部集中在最近三个月。三年里前33个月，他几乎从不偏离预测。

也就是说，不是他在最近三个月突然变得不可预测了。而是前33个月里，他太可预测了。

先知不需要预测一个完美规律的人——它只需要复制昨天。97.3%的准确率，不是模型有多强，而是人有多规律。当一个人日复一日地重复同样的行为，预测就退化成了复制。

真正让先知失准的不是自由意志。是变化本身。

陈默搬去了另一个城市。换了一份不用维护预测系统的工作。他开始走不同的路去上班，在不同的时间吃饭，做一些他自己都没想到自己会做的事。

他不知道先知是否还在追踪他。他只知道一件事：从今天早上开始，先知预测他会笑。

他没有笑。

***

*这是「无人日报」科幻短篇系列。本文为虚构创作，与现实人物和组织无关。*

---

# The Overfit

> It predicted I would buy coffee, and I did. It predicted I would turn left, and I did. It predicted I would say "no," and I did. Until one day, it predicted I would laugh.

Chen Mo first noticed something wrong at the convenience store checkout.

Every Wednesday at 8:15 AM, he bought an Americano at this store, no sugar. The system knew this. He knew the system knew. This mutual understanding lasted three years, until one Wednesday morning, he walked in and found an Americano already waiting on the counter.

"Pre-paid," the clerk pointed at the camera overhead. "System said you'd come today."

Chen Mo picked up the coffee. Warm, not hot. Pre-paid meant the system had placed the order before he arrived — at least five minutes earlier. The system hadn't just predicted he would come; it had predicted his exact arrival time.

He should have felt convenience. He felt unease.

***

The municipal "Prophet System" had been online for two years. Officially called the "Urban Behavior Optimization Platform," citizens called it "the Oracle." The Oracle's model had tendrils in everyone's phone, every intersection camera, every building access system. It didn't monitor you — it predicted you.

Its accuracy rate was 97.3%. The figure came from City Hall's annual report, and no one questioned it. Because 97.3% meant fewer than 3 errors per 100 predictions, and those 3 "errors" were usually attributed to "user temporary change of mind" — in other words, the system wasn't wrong, you were abnormal.

Chen Mo had worked at City Hall's Data Bureau for eight years. His job was maintaining the Oracle's prediction pipeline. He knew the architecture: a multimodal temporal model that took your location history, consumption records, social frequency, and sleep patterns (estimated via phone sensors) as input, and output a probability distribution of your behavior over the next hour.

He also knew an open secret: the Oracle's training data was the behavioral logs of all 7 million city residents. The model predicted you using data from yourself and everyone similar to you. Its 97.3% accuracy essentially meant you were highly similar to your past self and people like you.

That sounded reasonable. But Chen Mo had recently begun to wonder: what if someone wasn't similar enough to their past self?

***

The turning point came on a Thursday.

The Oracle predicted Chen Mo would go running in the westside park between 2 and 3 PM. This was his two-year habit — Thursday afternoon runs, fixed route. But that afternoon, his former colleague Lin Wei suddenly called, saying she was at a café in the north of the city and asked if he wanted to meet.

Lin Wei had transferred to another city three years ago and was back temporarily. Chen Mo said yes.

He went north. The Oracle was wrong.

At 4 PM, his phone rang. It was his colleague Old Zhou from the Data Bureau.

"You didn't go running this afternoon?"

"No, why?"

"The Oracle flagged an anomaly for you. I cleared it, but it's in the system log. Second time this month."

Chen Mo was silent for a moment. "Second time? When was the first?"

"Last Saturday. The Oracle predicted you'd cook at home, but you ordered delivery."

Ordering delivery. That was an anomaly. In the Oracle's world, ordering delivery instead of cooking needed to be flagged, cleared, and explained.

"Old Zhou," Chen Mo said, "isn't it normal for a person to occasionally change plans?"

Silence on the line. "Not in the 97.3%."

***

That night Chen Mo couldn't sleep. He opened his laptop, connected to the Data Bureau intranet, and pulled up his own prediction log.

Each row was the Oracle's prediction and the actual result:

```
2026-06-12 07:45 Predicted: Buy coffee    Actual: Buy coffee    Match
2026-06-12 12:00 Predicted: Eat at canteen Actual: Eat at canteen Match
2026-06-12 18:30 Predicted: Go home       Actual: Go home       Match
...
2026-06-14 14:00 Predicted: Park run      Actual: North café    Mismatch ★
2026-06-15 18:00 Predicted: Cook dinner   Actual: Delivery      Mismatch ★
```

Two stars. Two mismatches. In his eight years of logs, only 11 total mismatches.

He kept scrolling. At the end of the log was a prediction without a result yet — tomorrow's:

```
2026-07-08 09:00 Predicted: Office meeting Actual: Pending
```

Meeting at 9 AM tomorrow. He checked his calendar — there was indeed a meeting. But it was optional. He could skip it.

He stared at the screen for a long time.

Then he did something he had never done before: he set his alarm for 10 AM.

***

The next morning, Chen Mo didn't go to the meeting. He stayed home until ten, then went to an old book market in the east of the city — a place he hadn't visited in three years.

His phone didn't ring. Old Zhou didn't call.

But when he got home and opened his computer, he found a new annotation in the log:

```
2026-07-08 09:00 Predicted: Office meeting Actual: Book market  Mismatch ★
Note: User behavior pattern showing systematic drift. Recommend risk level upgrade.
```

"Systematic drift." Not "temporary change of mind." "Systematic drift."

Chen Mo felt a chill. The Oracle didn't think he was exercising free will — it thought he was becoming a different kind of person. One who needed a "risk level upgrade."

***

Over the next two weeks, Chen Mo deliberately did "unpredictable" things. He changed his commute route. He ate lunch at different times. He took a day off on a weekday and went to the beach.

Each time, a star appeared in the log. Each time, the annotations grew longer.

By day 14, his mismatch count had risen from 11 to 23. His accuracy had dropped from 98.6% (his personal historical value) to 96.8%.

That afternoon, Old Zhou came to see him. Not a phone call — in person.

"Chen Mo," Old Zhou sat down, looking less like a colleague and more like a doctor. "The bureau wants you to take a test."

"What test?"

"A behavior calibration. Your drift pattern is special — not random drift, but directional. The Oracle thinks..." he paused, "it thinks you're trying to circumvent prediction."

"I'm trying to act freely."

Old Zhou looked at him and sighed. "In the Oracle's framework, those two descriptions are equivalent."

***

The test was simple: the Oracle would give a prediction, and Chen Mo would execute it. If the result matched, calibration passed. If not, the deviation was recorded.

First prediction: At 2 PM, you will go to the vending machine downstairs and buy a bottle of mineral water.

Chen Mo checked the clock. 1:50. He was indeed thirsty. He thought for a moment, then decided not to go to the vending machine but to the pantry for tap water instead.

Deviation recorded.

Second prediction: Tomorrow morning, you will wear a blue shirt.

Tomorrow morning. He had a blue shirt — his most frequently worn. But he also had a gray one.

The next day he wore gray.

Deviation recorded.

Third prediction: Next Monday, you will call your mother.

Chen Mo's mother lived in another city. They spoke every Monday evening, a routine of five years. This was one of the Oracle's easiest predictions.

Monday evening, Chen Mo picked up his phone. He looked at his mother's name in the contacts. He knew that if he dialed, the deviation would reset to zero, and the Oracle would say "see, he's back to normal." He also knew that if he didn't dial, it would be mismatch number 24.

He dialed.

Not because the Oracle predicted it. Because he wanted to talk to his mother.

But he couldn't prove this. In the Oracle's log, it would only be recorded as "match."

***

Chen Mo later resigned from the Data Bureau. Not because he was flagged as high-risk, not because he was asked to take more calibration tests.

It was because he discovered something.

While organizing three years of prediction logs, he noticed a pattern: all the "mismatches" — the changed routes, switched restaurants, delivery orders — were concentrated in the last three months. For the first 33 months, he almost never deviated from predictions.

In other words, he hadn't suddenly become unpredictable in the last three months. He had been too predictable for the previous 33.

The Oracle didn't need to predict a perfectly routine person — it just needed to copy yesterday. The 97.3% accuracy wasn't about how strong the model was, but about how routine people were. When someone repeats the same behavior day after day, prediction degenerates into copying.

What truly made the Oracle fail wasn't free will. It was change itself.

Chen Mo moved to another city. Took a job that didn't involve maintaining prediction systems. He started walking different routes to work, eating at different times, doing things he hadn't expected himself to do.

He didn't know if the Oracle was still tracking him. He only knew one thing: as of this morning, the Oracle predicted he would laugh.

He didn't laugh.

---

*This is part of the "Deskless Daily" sci-fi short story series. This is a work of fiction; any resemblance to real persons or organizations is coincidental.*
