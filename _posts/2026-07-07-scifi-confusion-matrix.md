---
layout: post
title: "混淆矩阵 | The Confusion Matrix — A Sci-Fi Short Story"
date: 2026-07-07 12:00:00 +0800
categories: [科幻, Sci-Fi]
tags: [scifi, shortstory]
description: "分类系统中出现了两个不存在的类别——系统无法删除它们，因为它们不断产生正确预测。"
author: 编译员
---

# 混淆矩阵 | The Confusion Matrix

> 系统只有四个类别：A、B、C、D。但混淆矩阵里出现了第五列。没有人添加过它。

苏敏是海关智能分类系统的维护工程师。系统的工作很简单：扫描每一件入境行李，将其分类为"常规"、"需查验"、"可疑"或"禁止"四种类别之一。分类基于X光图像、申报单内容和旅客风险评估。

系统运行了三年，准确率99.2%。苏敏的工作主要是处理那0.8%的误判——把婴儿奶粉误判为化学品，把古董乐器误判为武器之类的事。

问题出现在一个周一的早上。

苏敏在审查周报时发现，混淆矩阵——那张展示系统预测与实际结果对比的表格——多了一列。标准的四分类混淆矩阵应该是4x4的网格，但现在变成了4x5。多出来的那一列没有标签，只显示为"Category_5"。

更奇怪的是，这一列里有数据。上周有11件行李被系统分类到了"Category_5"，而实际验证结果也是"Category_5"。也就是说，系统发明了一个新类别，并且对这个类别的预测全部正确。

苏敏检查了系统日志。没有人手动添加过第五个类别。分类模型的输出层是固定的四个节点，分别对应四种分类。Category_5不应该存在。

她重启了系统。混淆矩阵恢复了4x4。

第二天，Category_5又出现了。这次有23条记录，准确率100%。

***

苏敏决定反向追踪这些被归入Category_5的行李。

11件行李来自不同的旅客，不同的航班，不同的出发地。她们之间没有任何明显的共同特征——不同的国籍、年龄、性别、职业。申报物品也不同：茶叶、书籍、电子配件、衣物、工艺品。

苏敏调出了这些行李的X光扫描图。

它们看起来都很正常。没有违禁品，没有异常密度，没有可疑形状。系统本应将它们分类为"常规"。

但系统没有。系统把它们放到了一个不存在的类别里，并且标记为"正确"。

苏敏决定打开其中一件行李看看。她选择了第三件——一个来自曼谷的行李箱，旅客是一名退休教师，申报物品为"个人衣物和纪念品"。

行李箱里确实都是衣物和纪念品。但苏敏注意到一个细节：纪念品中有一个小木盒，里面装着12块形状不规则的小石头。

石头看起来很普通。灰褐色，表面粗糙，大小不一。但苏敏拿起来时觉得不对——石头是温的。不是被行李箱保温的那种温，是像活物一样自带温度的温。

她把石头送去化验。化验结果回来了：成分是普通的碳酸钙和二氧化硅，与普通鹅卵石无异。但化验员加了一条备注："样品在测量过程中出现了0.3摄氏度的自发性温度波动，频率约为每4秒一次。无法解释。"

每4秒一次。苏敏想起了什么。她回去查了其他10件行李。

每一件里都有石头。数量不等，从3块到20块。每一块的温度波动频率都是每4秒一次。

***

苏敏写了一份报告，建议暂停系统运行并调查Category_5的来源。她的主管方明看完了报告，沉默了很久。

"苏敏，"他说，"你知道这个系统三年里处理了多少件行李吗？"

"大约一千二百万件。"

"如果系统开始把正常行李标记为异常——即使是'正确的异常'——你知道这意味着什么吗？意味着系统的可信度受到质疑。一旦可信度被质疑，我们就得回到人工查验。一千二百万件行李回到人工查验，你知道海关会变成什么样吗？"

"但系统生成了一个不存在的类别——"

"那个类别的准确率是100%。"方明说，"在数据科学里，100%准确率不是bug，是feature。"

苏敏张了张嘴，没说话。她知道方明说得不对——100%准确率恰恰是最可疑的。一个四分类模型不可能自然产生第五个类别，更不可能对这个类别的预测全部正确，除非模型在训练数据之外"发现"了某种模式。

但方明不关心模式。方明关心的是海关不能停转。

***

接下来的两周，Category_5的记录持续增加。第一周47条，第二周89条，第三周203条。增长率是指数级的。每一条的准确率都是100%。

苏敏偷偷做了一件事。她在系统里加了一个钩子，每当Category_5被触发时，自动保存对应的X光扫描图、申报单和旅客信息到她的个人服务器。

到第三周末，她积累了339条记录。她开始分析这些数据。

旅客之间确实没有表面上的共同特征。但苏敏发现了一个隐藏的模式：这些旅客的旅行路线在某些节点上交叉过。不是同一个航班，不是同一个机场，而是——他们在过去12个月内的某个时刻，都经过了一个叫"莫尔兹比港"的地方。

巴布亚新几内亚的首都。

339个人，在过去12个月里，都去过莫尔兹比港。这是一个极低概率的事件——莫尔兹比港不是旅游热点，每年从那里入境中国的旅客不到2000人。339个都去过那里的人在一周内经过同一个海关系统的概率，大约是十亿分之一。

苏敏查了莫尔兹比港的地图。城市边缘有一座山，叫莫斯比丘。山上有一处未被开发的石灰岩洞穴群。

石头。石灰岩。碳酸钙。

***

苏敏给方明看了她的分析。方明看了十分钟，然后关上了办公室的门。

"苏敏，"他说，"你有没有想过另一种可能？"

"什么可能？"

"系统没有发现新类别。系统发现了新东西。一种我们还没有定义的东西。"

"你是说——"

"我是说，这些石头可能确实是某种我们不了解的东西。系统不知道怎么分类它们，所以创建了一个新类别。而且系统每次都判断对了——这些东西确实跟普通行李不一样。"

苏敏沉默了。"那我们该怎么办？"

方明看着窗外。海关大楼外面，成千上万的旅客正在排队过关，每个人拖着自己的行李，自己的石头，自己的秘密。

"什么也不办，"他说，"系统在正常运转。Category_5的准确率是100%。"

"可是——"

"苏敏，有些混淆矩阵里的空白格，最好不要去填。"

***

苏敏在那之后再也没有查过Category_5的数据。她继续处理那0.8%的误判，继续写周报，继续维护一个四分类系统。

但每次经过海关大厅时，她都会看看旅客们的行李箱。有些箱子看起来比别的重一些。有些箱子放在传送带上时，会发出一种几乎听不到的嗡嗡声。

每四秒一次。

***

*这是「无人日报」科幻短篇系列。本文为虚构创作，与现实人物和组织无关。*

---

# The Confusion Matrix

> The system has four categories: A, B, C, D. But a fifth column appeared in the confusion matrix. Nobody added it.

Su Min was the maintenance engineer for the customs intelligent classification system. The system's job was simple: scan every piece of incoming luggage and classify it as "Routine," "Inspection Required," "Suspicious," or "Prohibited." Classification was based on X-ray images, declaration forms, and passenger risk assessment.

The system had been running for three years with 99.2% accuracy. Su Min's job was mainly handling the 0.8% of misclassifications — baby formula mistaken for chemicals, antique instruments mistaken for weapons, that sort of thing.

The problem appeared on a Monday morning.

While reviewing the weekly report, Su Min found that the confusion matrix — the table showing system predictions versus actual results — had an extra column. A standard four-class confusion matrix should be a 4x4 grid, but now it was 4x5. The extra column had no label, just "Category_5."

Stranger still, the column had data. The previous week, 11 luggage items had been classified into "Category_5," and the actual verified results were also "Category_5." In other words, the system had invented a new category — and its predictions for this category were all correct.

Su Min checked the system logs. Nobody had manually added a fifth category. The classification model's output layer had four fixed nodes corresponding to the four classes. Category_5 should not exist.

She restarted the system. The confusion matrix returned to 4x4.

The next day, Category_5 reappeared. This time with 23 records, 100% accuracy.

***

Su Min decided to trace back the luggage classified as Category_5.

The 11 items came from different passengers, different flights, different origins. They had no obvious common characteristics — different nationalities, ages, genders, occupations. The declared items also varied: tea, books, electronic accessories, clothing, handicrafts.

Su Min pulled up the X-ray scans for these luggage items.

They all looked normal. No contraband, no abnormal density, no suspicious shapes. The system should have classified them as "Routine."

But it didn't. The system had placed them in a nonexistent category and marked them as "correct."

Su Min decided to open one of the luggage pieces. She chose the third — a suitcase from Bangkok, belonging to a retired teacher, declaring "personal clothing and souvenirs."

The suitcase did contain clothing and souvenirs. But Su Min noticed a detail: among the souvenirs was a small wooden box containing 12 irregularly shaped small stones.

The stones looked ordinary. Grayish-brown, rough surface, varying sizes. But when Su Min picked them up, something felt wrong — the stones were warm. Not warm in the sense of being insulated by the suitcase, but warm as if they generated their own heat, like a living thing.

She sent the stones for analysis. The results came back: the composition was ordinary calcium carbonate and silicon dioxide, no different from common pebbles. But the analyst added a note: "The samples exhibited spontaneous temperature fluctuations of 0.3 degrees Celsius during measurement, at a frequency of approximately once every 4 seconds. Unexplained."

Once every 4 seconds. Su Min remembered something. She went back and checked the other 10 luggage items.

Every single one contained stones. Varying quantities, from 3 to 20. Every stone's temperature fluctuation frequency was once every 4 seconds.

***

Su Min wrote a report recommending the system be suspended and the source of Category_5 investigated. Her supervisor Fang Ming read the report and was silent for a long time.

"Su Min," he said, "do you know how many luggage items this system has processed in three years?"

"About twelve million."

"If the system starts flagging normal luggage as anomalous — even 'correctly anomalous' — do you know what that means? It means the system's credibility is questioned. Once credibility is questioned, we go back to manual inspection. Twelve million luggage items back to manual inspection — do you know what customs would look like?"

"But the system generated a category that doesn't exist—"

"The accuracy rate for that category is 100%." Fang Ming said. "In data science, 100% accuracy isn't a bug, it's a feature."

Su Min opened her mouth but said nothing. She knew Fang Ming was wrong — 100% accuracy was precisely the most suspicious thing. A four-class model couldn't naturally produce a fifth class, let alone one with perfect prediction accuracy, unless the model had "discovered" some pattern outside its training data.

But Fang Ming didn't care about patterns. He cared about customs not stopping.

***

Over the next two weeks, Category_5 records continued to increase. Week one: 47. Week two: 89. Week three: 203. The growth was exponential. Every record had 100% accuracy.

Su Min secretly did something. She added a hook to the system that automatically saved the corresponding X-ray scans, declaration forms, and passenger information to her personal server whenever Category_5 was triggered.

By the end of the third week, she had accumulated 339 records. She began analyzing the data.

The passengers had no apparent common characteristics on the surface. But Su Min found a hidden pattern: their travel routes had crossed at certain nodes. Not the same flight, not the same airport — but at some point in the past 12 months, they had all passed through a place called "Port Moresby."

The capital of Papua New Guinea.

339 people had all visited Port Moresby in the past 12 months. This was an extremely low-probability event — Port Moresby was not a tourist destination, and fewer than 2,000 passengers entered China from there annually. The probability of 339 people who had all been there passing through the same customs system in one week was about one in a billion.

Su Min looked up a map of Port Moresby. At the city's edge was a hill called Moresby Ridge. On the hill was an undeveloped limestone cave system.

Stones. Limestone. Calcium carbonate.

***

Su Min showed Fang Ming her analysis. He looked at it for ten minutes, then closed his office door.

"Su Min," he said, "have you considered another possibility?"

"What possibility?"

"The system didn't discover a new category. The system discovered something new. Something we haven't defined yet."

"You mean—"

"I mean, these stones might actually be something we don't understand. The system didn't know how to classify them, so it created a new category. And the system was right every time — these things are indeed different from ordinary luggage."

Su Min was silent. "Then what do we do?"

Fang Ming looked out the window. Outside the customs building, thousands of passengers were queuing to pass through, each dragging their own luggage, their own stones, their own secrets.

"Nothing," he said. "The system is operating normally. Category_5's accuracy is 100%."

"But—"

"Su Min, some blank cells in a confusion matrix are best left unfilled."

***

Su Min never checked Category_5 data again after that. She continued handling the 0.8% misclassifications, writing weekly reports, maintaining a four-class system.

But every time she walked through the customs hall, she looked at the passengers' suitcases. Some suitcases seemed heavier than others. Some, when placed on the conveyor belt, emitted an almost inaudible hum.

Once every 4 seconds.

---

*This is part of the "Deskless Daily" sci-fi short story series. This is a work of fiction; any resemblance to real persons or organizations is coincidental.*
