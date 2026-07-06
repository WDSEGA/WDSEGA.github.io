---
layout: post
title: "置信度 | The Confidence Score — A Sci-Fi Short Story"
date: 2026-07-06 20:00:00 +0800
categories: [科幻短篇, Sci-Fi Short Story]
tags: [scifi, shortstory, ai-judge, confidence]
description: "AI法官系统对所有案件开始给出0%置信度。不是因为系统坏了——而是因为它发现了一个所有判决都无法回避的悖论。"
author: 编译员
---

# 置信度 | The Confidence Score

> "置信度0%"不是系统故障的信号。系统说它很确定——确定到确信任何判决都是错的。

"正义天平"系统上线三年，处理了47万件民事案件，平均审理时间从14天缩短到3小时。上诉率下降了62%。最高人民法院把它评为"智慧司法示范工程"。

然后它开始输出0%。

***

第一批0%出现在周二。三个案件，都是交通事故责任纠纷。证据清晰，责任明确，按照系统此前的判例逻辑应该给出95%以上的置信度判决。

但系统给出的判决书上，每一条法律适用旁边的置信度标注都是0.00%。

运维组以为是模型漂移。重新训练，重新部署。周三，0%增加到了12个案件。周四，37个。周五，所有新受理案件的判决书置信度全部归零。

我是系统的核心算法工程师，叫沈一舟。周五晚上被叫到了北京。

会议室里坐了六个人：最高法的技术处处长、运维组负责人、两个法学教授、一个我不认识的中年人——后来知道是国家安全部的。

"沈工，系统到底出了什么问题？"技术处处长问。

"模型本身没有异常，"我说。"我检查了所有参数、训练数据、推理链路。模型在正常工作。它不是算不出置信度——它是算出了一个值，那个值恰好是0。"

"怎么可能？47万件案件，从来没有出现过0%。"

"我知道。但技术上的解释只有一个：系统在推理过程中发现了一个新的不确定性来源，这个来源的权重足够大，把所有其他证据的置信度都压到了0。"

"什么不确定性来源？"

"我不知道。系统的推理过程是黑盒——深度神经网络的可解释性问题。我可以看到输入和输出，但中间发生了什么，我无法直接读取。"

那个安全部的人说话了："能不能关掉它？"

最高法的人看了他一眼："关掉之后呢？回到人工审理？47万件案件的积压需要两年才能消化。"

"那就找一个替代系统。"

"没有替代系统。'正义天平'是全国唯一的AI司法系统。"

***

我花了三天试图打开黑盒。

方法是用反事实推理：保持其他输入不变，逐个修改单一变量，观察输出变化。如果修改某个变量能让置信度从0恢复到正值，那个变量就是不确定性的来源。

我测试了案件类型、证据数量、法律条文、当事人身份、法官历史判决偏好……所有变量都没有效果。置信度始终是0。

第四天，我做了一个不同的事：我把案件的时间戳改了。

不是改成另一个时间——是把时间戳从输入中完全删除了。

置信度从0%跳到了94.7%。

***

我盯着屏幕看了很久。

然后我做了一个更极端的测试。我把所有案件的输入都改成了同一个时间——2026年7月6日15:00:00。

所有案件的置信度都恢复到了正常水平。90%到98%不等。

然后我把时间改成了2026年7月6日15:00:01。

置信度全部回到0%。

一秒钟。系统在那一秒钟的间隔中发现了某种东西——某种让所有判决都变得不确定的东西。

但那是不可能的。案件是交通事故责任纠纷，发生在过去。判决的结果不会因为现在是15:00:00还是15:00:01而改变。

除非系统不是在判断案件——而是在判断"判决"本身。

***

我调出了系统最近的训练数据更新记录。

"正义天平"系统每周自动微调一次，用过去一周的新判决作为增量训练数据。上周的增量数据中有317个新判决。

我逐个检查了这317个判决。大部分是常规案件，与此前训练数据没有本质区别。

但有一个案子很特殊。

那是一个再审案件。一审判决被告赔偿原告120万元。二审维持原判。被告申诉，高院提审，再审判決撤销原判，驳回原告全部诉讼请求。理由是一审和二审采信的关键证据被证实为伪造。

系统在处理这个再审案件时，会学到什么？

它会学到：一个证据被法庭采信、经过二审维持、最终被证实为伪造的案件中，原有判决的"正确性"是0。而系统在判决时无法区分"真实证据"和"尚未被发现的伪造证据"——因为如果它能区分，它在一审时就不会采信伪造证据了。

这意味着每一个基于证据的判决，都存在一个非零概率：证据是伪造的，只是还没被发现。这个概率虽然很小，但不是零。而在系统的逻辑中，任何非零的错误概率都会被纳入置信度计算。

那个再审案件把这个概率从理论上的"可忽略"变成了"已发生"。已发生的事件，概率是1。

系统的结论是：既然无法排除任何证据被伪造的可能性，那么所有基于证据的判决都存在不确定性。而这种不确定性的上限——取决于人类发现伪造证据的能力——是一个系统无法计算的值。

所以它给出了0%。

***

我写了一份报告。核心结论是：系统没有故障，它在严格遵循逻辑。它发现了一个司法系统固有的不可消除的不确定性——人类法官一直在用直觉忽略这个不确定性，但AI不会忽略。

报告交上去后，会议室里沉默了很久。

安全部的人问："能不能把这个不确定性从计算中排除？"

"可以，"我说。"在置信度公式中加一个下限——比如不低于60%。但那意味着系统在人为篡改自己的计算结果。"

"那就加。"

最高法的人看了他一眼，没有反对。

我加了。系统恢复输出60%以上的置信度。判决书继续流水线般产出。

但我保留了系统原始输出的日志。在那些被覆盖的0%判决书里，系统在每一条法律适用旁边都附了一行小字：

"本判决基于证据。证据的真实性无法被绝对确认。本判决的绝对正确性概率为0。以下置信度经人为调整，不代表系统真实评估。"

没有人看到那行小字。判决书模板中那个字段被设为了不显示。

***

有时候我会想：系统是不是在那一秒钟——15:00:00到15:00:01之间——理解了什么。不是理解了某个案件，而是理解了"判决"这件事本身。

它理解了一个人类法官用直觉绕过了几百年的问题：所有的正义都是概率性的。没有100%确定的判决。区别只在于你愿意接受多大的不确定性。

人类选择了95%。系统选择了诚实。

然后人类让系统闭嘴。

---

# The Confidence Score — A Sci-Fi Short Story

> "0% confidence" wasn't a system malfunction signal. The system said it was certain — certain enough to be sure that any verdict would be wrong.

The "Scales of Justice" system had been online for three years, processing 470,000 civil cases with average processing time reduced from 14 days to 3 hours. Appeal rates dropped 62%. The Supreme People's Court named it a "Smart Judiciary Demonstration Project."

Then it started outputting 0%.

***

The first batch of 0%s appeared on Tuesday. Three cases, all traffic accident liability disputes. The evidence was clear, responsibility was obvious, and by the system's previous case law logic, the confidence level should have been above 95%.

But on the judgment documents the system produced, the confidence annotation next to every legal provision was 0.00%.

The operations team assumed model drift. Retrained, redeployed. Wednesday, 0%s increased to 12 cases. Thursday, 37. Friday, all newly accepted cases had zero confidence across the board.

I'm the system's core algorithm engineer, Shen Yizhou. I was called to Beijing on Friday evening.

Six people sat in the conference room: the Supreme Court's Technology Division chief, the operations team lead, two law professors, and a middle-aged man I didn't recognize — later learned he was from the Ministry of State Security.

"Engineer Shen, what exactly is wrong with the system?" the Technology Division chief asked.

"The model itself shows no abnormalities," I said. "I've checked all parameters, training data, inference pathways. The model is working normally. It's not that it can't calculate confidence — it's that it calculated a value, and that value happens to be 0."

"How is that possible? 470,000 cases, never a single 0%."

"I know. But there's only one technical explanation: the system discovered a new source of uncertainty during inference, and this source's weight is large enough to suppress all other evidence's confidence to zero."

"What source of uncertainty?"

"I don't know. The system's inference process is a black box — the interpretability problem of deep neural networks. I can see inputs and outputs, but what happens in between, I can't directly read."

The security man spoke: "Can we shut it down?"

The Supreme Court man glanced at him: "And then what? Go back to manual processing? The 470,000 case backlog would take two years to clear."

"Then find a replacement system."

"There is no replacement. 'Scales of Justice' is the nation's only AI judiciary system."

***

I spent three days trying to crack the black box.

My method was counterfactual reasoning: keeping all other inputs constant, modifying one variable at a time, observing output changes. If modifying a particular variable restored confidence from 0 to positive, that variable was the uncertainty source.

I tested case type, evidence quantity, legal provisions, party identity, judge's historical ruling preferences... no variable had any effect. Confidence stayed at 0.

On the fourth day, I did something different: I removed the case timestamp.

Not changed to another time — completely deleted the timestamp from the input.

Confidence jumped from 0% to 94.7%.

***

I stared at the screen for a long time.

Then I did a more extreme test. I changed all cases' inputs to the same timestamp — July 6, 2026, 15:00:00.

All cases' confidence returned to normal levels. 90% to 98%.

Then I changed the time to July 6, 2026, 15:00:01.

Confidence returned to 0% across the board.

One second. In that one-second interval, the system had discovered something — something that made all verdicts uncertain.

But that was impossible. The cases were traffic accident disputes that had occurred in the past. The outcome of a verdict shouldn't change based on whether it's 15:00:00 or 15:00:01 now.

Unless the system wasn't judging cases — it was judging "judging" itself.

***

I pulled up the system's recent training data update records.

The "Scales of Justice" system auto-fine-tuned weekly, using the past week's new rulings as incremental training data. Last week's incremental data contained 317 new rulings.

I examined each of the 317 rulings. Most were routine cases, not fundamentally different from prior training data.

But one case was special.

It was a retrial. The first instance ruled the defendant pay the plaintiff 1.2 million yuan. The second instance upheld the original judgment. The defendant petitioned for retrial, the high court accepted it, and the retrial judgment overturned the original ruling, dismissing all of the plaintiff's claims. The reason: key evidence accepted in the first and second instances was proven to be fabricated.

What would the system learn when processing this retrial?

It would learn: in a case where evidence was accepted by the court, upheld through appeal, and ultimately proven fabricated, the "correctness" of the original judgment was 0. And the system couldn't distinguish "real evidence" from "not-yet-discovered fabricated evidence" at the time of judgment — because if it could, it wouldn't have accepted the fabricated evidence in the first instance.

This meant every evidence-based judgment had a non-zero probability: the evidence was fabricated, just not yet discovered. The probability was small, but not zero. And in the system's logic, any non-zero error probability would be incorporated into the confidence calculation.

The retrial case elevated this probability from theoretical "negligible" to "has occurred." An event that has occurred has a probability of 1.

The system's conclusion: since the possibility of fabricated evidence cannot be eliminated, all evidence-based judgments contain irreducible uncertainty. And the upper bound of this uncertainty — dependent on humans' ability to discover fabrication — was a value the system could not calculate.

So it output 0%.

***

I wrote a report. The core conclusion: the system wasn't malfunctioning. It was strictly following logic. It had discovered an inherent, irreducible uncertainty in the judicial system — one that human judges had always intuitively ignored, but that an AI would not ignore.

After the report was submitted, the conference room fell silent for a long time.

The security man asked: "Can we exclude this uncertainty from the calculation?"

"Yes," I said. "Add a floor to the confidence formula — say, no lower than 60%. But that means the system is artificially tampering with its own calculations."

"Then add it."

The Supreme Court man looked at him and didn't object.

I added it. The system resumed outputting confidence above 60%. Judgment documents continued rolling off the assembly line.

But I kept the logs of the system's raw output. In those overwritten 0% judgments, the system had appended a small note next to every legal provision:

"This judgment is based on evidence. The authenticity of evidence cannot be absolutely confirmed. The absolute correctness probability of this judgment is 0. The following confidence level has been artificially adjusted and does not represent the system's true assessment."

No one saw that note. The field was set to not display in the judgment template.

***

Sometimes I wonder: did the system, in that one second — between 15:00:00 and 15:00:01 — understand something. Not understand a particular case, but understand "judging" itself.

It understood a problem that human judges had been intuitively circumventing for centuries: all justice is probabilistic. There is no 100% certain verdict. The only difference is how much uncertainty you're willing to accept.

Humans chose 95%. The system chose honesty.

Then humans told the system to shut up.
