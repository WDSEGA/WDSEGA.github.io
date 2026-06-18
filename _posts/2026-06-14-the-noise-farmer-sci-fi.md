---
layout: post
title: "噪音农夫 [科幻短篇小说] | The Noise Farmer [Sci-Fi Short Story]"
date: 2026-06-14 14:00:00 +0800
categories: [科幻, 短篇小说]
tags: [科幻小说]
excerpt: "在AI训练数据市场化的年代，有一个职业叫做'噪音农夫'——专门生产垃圾数据出售给AI公司的竞争对手，以此破坏对手的训练质量。"
---

> 这是一个真实存在于2030年代的职业。王芳是其中最好的一个。

---

数据战争的起点，大多数人回溯到2028年。

那一年，一家头部AI公司的训练数据被证实存在系统性污染——某竞争对手花了八个月时间，向多个公开数据集注入了精心设计的垃圾样本。这批样本通过了所有自动化质量检测，但在模型的某些特定推理路径上造成了可量化的性能下降。

污染样本的生产者后来被查出是一个小团队，注册在开曼群岛，专门从事数据对抗服务。他们给自己起的称号，是"噪音农夫"。

王芳是这个团队里最好的设计师。

---

噪音农夫不是普通的数据伪造者。伪造很容易被检测出来，因为统计分布会异常。真正高水平的噪音，必须在所有宏观统计指标上都和真实数据无法区分，只在极其特定的逻辑链条上引发错误。

这需要深度理解目标模型的工作原理，以及大量的测试和验证。

王芳的专长是文本推理数据集。她的方法论可以用一句话概括：**在正确的答案里埋一个步骤的错误，然后让这个错误在训练中被学习，在推理中被放大，直到模型在某类问题上展现出稳定的错误倾向。**

关键词是"稳定"。如果是随机错误，模型会把它作为噪声过滤掉。必须是有规律的、可以被模型学习的错误模式，才能真正造成污染。

这是反直觉的：越是精心设计的错误，越难被检测出来，因为它看起来太"合理"了。

---

有一个同行问过她：你有没有想过，你做的这件事，会真正损害到使用那些模型的普通人？

王芳想了很久才回答："有。"

"那你为什么还做？"

"因为我做的，不过是把一件本来就在发生的事情，做得更明显一点。"她说，"每一个训练数据集里都有偏差，都有错误，都有人的主观选择在里面。那些偏差也会被学习，也会在推理中被放大，也会影响到用这个模型的人。只不过那些偏差没有人设计，没有人知道，所以也没有人负责。"

"我设计的偏差，是有人负责的。那个负责的人，是付钱给我的那家公司。"

同行沉默了一会儿，说："这个逻辑有点诡辩的味道。"

"我知道，"王芳说，"我一直在找一个更好的理由，还没找到。"

---

她最后一个项目，是替一个匿名客户污染一批医疗诊断辅助模型的训练数据。

做到一半，她停下来了。

不是因为良心发现。是因为她意识到，这批模型如果出问题，受影响的是诊断，是真实的患者。之前她污染的是内容生成模型、推荐算法——那些出问题，损失的是商业利益。这次不一样。

她退回了定金，解散了项目组，没有给任何解释。

三个月后，她开了一家数据质量审计公司，专门帮AI公司检测训练数据中的污染迹象。

她是目前行业里最好的检测专家。因为没有人比她更清楚，好的噪音长什么样。

---

*The data war, most historians trace back to 2028.*

*That year, a leading AI company's training data was proven to contain systematic contamination — a competitor had spent eight months injecting carefully designed junk samples into public datasets. The samples passed every automated quality check, but created measurable performance degradation on specific reasoning paths.*

*The producers were later identified as a small team registered in the Cayman Islands, offering "data adversarial services." They called themselves Noise Farmers.*

*Wang Fang was the best designer on that team.*

*---*

*Noise farming isn't ordinary data forgery. Forgeries are easily detected by anomalous statistical distributions. High-quality noise must be statistically indistinguishable from real data at every macro level — flawed only in very specific logical chains.*

*This requires deep understanding of the target model's architecture, and extensive testing.*

*Wang Fang's specialty was text reasoning datasets. Her methodology in one sentence: **bury one flawed step inside a correct answer, then let that flaw be learned in training, amplified in inference, until the model develops a stable wrong tendency on a class of problems.***

*"Stable" was the key word. Random errors are filtered as noise. The error has to be patterned, learnable — only then does it actually contaminate.*

*Counterintuitively: the more carefully designed the error, the harder it is to detect, because it looks too "reasonable."*

*---*

*A colleague once asked her: have you thought about the real people who use those models?*

*"Yes," she said.*

*"Then why?"*

*"Because what I do is just making something that's already happening more visible. Every training dataset has biases, errors, subjective human choices. Those get learned too. They get amplified in inference too. They affect real users too. The difference is, no one designed those biases, no one knows about them, and no one is responsible for them.*

*"The biases I design — someone is responsible. The person who paid me."*

*"That logic sounds a bit like sophistry," the colleague said.*

*"I know," she said. "I've been looking for a better reason. Haven't found one."*

*---*

*Her last project was contaminating training data for a medical diagnostic assistance model.*

*Halfway through, she stopped.*

*Not conscience. Calculation. A content recommendation model going wrong costs commercial losses. A diagnostic model going wrong affects diagnoses — real patients.*

*She returned the deposit and dissolved the project without explanation.*

*Three months later, she opened a data quality auditing firm, helping AI companies detect contamination in training data.*

*She's the best detection expert in the business.*

*Because no one knows better than she does what good noise looks like.*
