---
layout: post
title: "异常值 | The Outlier — A Sci-Fi Short Story"
date: 2026-07-06 18:00:00 +0800
categories: [科幻短篇, Sci-Fi Short Story]
tags: [scifi, shortstory, statistics, anomaly]
description: "一个统计AI在14亿人口中发现了一个不可能存在的人。他的每项指标都落在正态分布的边缘，但合在一起却是数学上的不可能。"
author: 编译员
---

# 异常值 | The Outlier

> 那个人不该存在。不是哲学意义上的不该——是数学意义上的。

林哲第一次注意到那个异常值是在周二下午三点十七分。

他负责维护"人口健康图谱"系统——一个对接全国14亿人口医保数据的AI分析平台。系统每天处理2.3亿条就诊记录，用统计模型检测传染病暴发、药物滥用模式和罕见病聚类。工作本身很枯燥：看仪表盘，确认没有红色警报，下班。

那天仪表盘上弹出一个黄色警告：某个体的综合健康指标偏离总体均值超过37个标准差。

37个标准差。

林哲以为是bug。正态分布中，偏离3个标准差的事件概率是0.3%。偏离6个标准差的事件，在全宇宙的原子数量中都不会出现一次。37个标准差不是"罕见"，是"数学上不可能"。

他点开了那个档案。

姓名：陈守山。性别：男。年龄：71岁。居住地：贵州省某县。

健康指标摘要：血压118/76，静息心率62，BMI 22.1，空腹血糖4.8，总胆固醇3.9，肝功能正常，肾功能正常，肺功能相当于40岁不吸烟男性。无慢性病诊断记录。无手术记录。无住院记录。过去50年间仅有7次门诊记录，全部为外伤（扭伤2次，切割伤3次，轻度烧伤1次，蚊虫叮咬过敏1次）。

林哲盯着屏幕看了很久。

不是哪一项指标不正常。是所有指标都太正常了——正常到不自然。一个71岁的农村男性，血压、心率、血糖、胆固醇全部处于20岁健康成年人的理想范围。在中国农村老年男性中，高血压患病率超过55%，糖尿病患病率超过20%。陈守山的每一项指标都落在分布的最边缘——不是异常的高或低，而是异常的"标准"。

但单项指标的异常不触发警报。系统之所以报警，是因为这些指标的组合概率。

林哲调出了系统的计算过程。血压在71岁农村男性中处于该范围的概率：0.7%。心率在该范围的概率：1.2%。血糖在该范围的概率：0.9%。胆固醇在该范围的概率：1.1%。无慢性病的概率：0.3%。50年无住院记录的概率：0.1%。

组合概率：0.7% × 1.2% × 0.9% × 1.1% × 0.3% × 0.1% ≈ 2.5 × 10⁻¹¹。

十四亿人中，这个概率对应0.034人。

陈守山不应该是存在的。不是"不太可能"——是统计上整个人口中出现一个这样的人的期望值是0.034。他不仅存在，而且活了71年。

林哲决定去贵州。

---

村子在山里，手机信号断断续续。村委会是一栋两层的砖房，外墙贴着褪色的瓷砖。村支书是个晒得很黑的中年女人，姓杨。

"陈守山？"杨支书想了想，"哦，守山叔啊。他身体好得很，从来不生病。"

"我想见他。"

"他住在后山，没通公路，要走四十分钟。你要去？"

林哲点头。

山路窄，两边是玉米地。七月的贵州很热，汗水顺着脖子往下淌。杨支书走在前面，偶尔用镰刀砍掉挡路的杂草。

"守山叔这人怪，"杨支书说，"不怎么跟人打交道。也不喝酒不抽烟。每天早上五点起来走路，走两个小时。吃的都是自己种的菜，肉也养着吃。"

"他去看过医生吗？"

"很少。去年镇上搞免费体检，他去了。医生说他身体好得像年轻人，他笑了笑就走了。"

走了大约四十分钟，看到一栋石板房。屋顶是石板铺的，墙壁是石头垒的，门前有一小块菜地，种着白菜、辣椒和西红柿。一个老人蹲在地里拔草，动作很慢但很稳。

"守山叔，有人找你。"

老人站起来，拍了拍手上的土。他穿着蓝色对襟衫，脸上的皱纹很少，眼神很亮。看起来像六十出头，不像七十一。

"你好，"林哲说，"我是做健康调查的，想了解一下你的生活习惯。"

陈守山看了他一眼，点了点头："进来坐。"

屋里很简单。一张木桌，两把竹椅，墙上挂着一杆旧秤和一串干辣椒。没有电视，没有冰箱。角落里有一个柴火灶，灶上放着一口铁锅。

林哲问了很多问题。吃什么，几点睡，几点起，干不干农活，有没有压力，家里有没有人生过病。

陈守山回答得很简洁。早上五点起，走两个小时山路。吃自己种的菜和养的鸡。不喝酒不抽烟不喝茶。晚上八点睡。没什么压力——"有什么好压力的"。父母都活到九十多，没生过大病。

"你有没有觉得自己的身体跟别人不一样？"

陈守山想了想："没什么不一样。就是不怎么生病。"

林哲看着他，突然意识到一个问题。

他查了陈守山的基因检测记录——没有。系统里没有他的基因数据。全国医保系统有就诊记录、处方记录、住院记录，但没有基因检测记录。陈守山从未做过基因检测。

"你愿意做一个基因检测吗？免费的，我带设备了。"

陈守山看了看他的手："你要我吐口水？"

"对，往这个管子里吐一点。"

陈守山接过管子，犹豫了一下，吐了。林哲封好管子，放进口袋。

---

回到北京后，林哲把样本送进了实验室。三天后结果出来了。

他盯着报告看了整整十分钟。

陈守山的基因组里有一个从未被记录过的变异簇。不是单核苷酸多态性（SNP），而是整段基因的重排。这些重排影响了与炎症反应、细胞修复和端粒维持相关的几十个基因。

但真正让林哲坐不住的是另一件事。

他在基因组数据库中搜索了这个变异簇的相似序列。没有完全匹配的结果。但在一个不起眼的角落，他找到了部分匹配——一段来自古人类DNA数据库的序列，采样自贵州某洞穴的一具距今约8000年的骨骼遗骸。

8000年前，同一个人——不，同一个血脉的人，也住在这片山里。

林哲拨通了杨支书的电话。

"陈守山家的房子，有多久了？"

"那房子啊，听说是他爷爷的爷爷盖的。再往前就不知道了。"

"他家一直是住后山那个位置？"

"好像是的。村里老人说，陈家在后山住了好多代了。"

林哲挂了电话，坐在椅子上看着窗外。

14亿人中，出现了一个统计上不应该存在的人。他的基因里藏着8000年前的密码。他住在祖先可能住了几千年的同一座山上。他吃着祖先可能吃了几千年的同一种食物。他的身体，在几百代人的时间里，和环境达成了某种现代医学无法解释的平衡。

系统的黄色警告还在闪。林哲伸手把它关了。

他不确定自己是否应该写论文。不确定是否应该告诉任何人。他唯一确定的是：陈守山会继续在后山种他的白菜，每天五点起来走路，活到不知道多少岁。

而统计学，对某些人来说，永远无法解释。

---

# The Outlier — A Sci-Fi Short Story

> That person shouldn't exist. Not in a philosophical sense — in a mathematical sense.

Lin Zhe first noticed the anomaly at 3:17 PM on a Tuesday.

He maintained the "Population Health Atlas" system — an AI analysis platform connected to the health insurance data of 1.4 billion people. The system processed 230 million clinical records daily, using statistical models to detect infectious disease outbreaks, drug abuse patterns, and rare disease clusters. The work itself was tedious: check the dashboard, confirm no red alerts, go home.

That day, a yellow warning popped up: an individual's comprehensive health metrics deviated from the population mean by over 37 standard deviations.

37 standard deviations.

Lin Zhe assumed it was a bug. In a normal distribution, the probability of deviating by 3 standard deviations is 0.3%. Deviating by 6 standard deviations wouldn't occur once in a number of trials equal to the atoms in the universe. 37 standard deviations wasn't "rare" — it was "mathematically impossible."

He opened the file.

Name: Chen Shoushan. Gender: Male. Age: 71. Residence: A county in Guizhou Province.

Health metric summary: Blood pressure 118/76, resting heart rate 62, BMI 22.1, fasting glucose 4.8, total cholesterol 3.9, liver function normal, kidney function normal, lung function equivalent to a 40-year-old non-smoking male. No chronic disease diagnoses. No surgical records. No hospitalization records. Only 7 outpatient visits in the past 50 years, all for minor injuries (2 sprains, 3 lacerations, 1 mild burn, 1 insect bite allergy).

Lin Zhe stared at the screen for a long time.

It wasn't that any single metric was abnormal. It was that all metrics were too normal — unnaturally normal. A 71-year-old rural male with blood pressure, heart rate, blood sugar, and cholesterol all in the ideal range of a healthy 20-year-old. Among rural elderly males in China, hypertension prevalence exceeds 55%, diabetes prevalence exceeds 20%. Every one of Chen Shoushan's metrics fell at the extreme edge of the distribution — not abnormally high or low, but abnormally "standard."

But a single metric anomaly wouldn't trigger the alert. The system flagged him because of the combined probability of all these metrics.

Lin Zhe pulled up the system's calculation. Probability of blood pressure in this range for a 71-year-old rural male: 0.7%. Heart rate in this range: 1.2%. Blood sugar in this range: 0.9%. Cholesterol in this range: 1.1%. No chronic diseases: 0.3%. No hospitalizations in 50 years: 0.1%.

Combined probability: 0.7% x 1.2% x 0.9% x 1.1% x 0.3% x 0.1% = approximately 2.5 x 10^-11.

Among 1.4 billion people, this probability corresponds to 0.034 people.

Chen Shoushan shouldn't exist. Not "unlikely" — the statistical expectation of such a person appearing in the entire population is 0.034. Not only did he exist, but he had lived for 71 years.

Lin Zhe decided to go to Guizhou.

---

The village was in the mountains, cell signal intermittent. The village committee office was a two-story brick building with faded tile exterior. The village secretary was a sun-darkened middle-aged woman named Yang.

"Chen Shoushan?" Secretary Yang thought for a moment. "Oh, Uncle Shoushan. He's very healthy, never gets sick."

"I'd like to meet him."

"He lives on the back mountain. No road access, forty minutes on foot. You want to go?"

Lin Zhe nodded.

The mountain path was narrow, flanked by cornfields. July in Guizhou was hot, sweat running down his neck. Secretary Yang walked ahead, occasionally hacking away obstructing weeds with a sickle.

"Uncle Shoushan is a bit strange," she said. "Doesn't socialize much. Doesn't drink or smoke. Gets up at five every morning to walk, two hours. Eats only vegetables he grows, and raises his own chickens."

"Has he seen doctors?"

"Rarely. Last year the township had a free health checkup, and he went. The doctor said his body was like a young person's. He smiled and left."

After about forty minutes, they saw a stone-slate house. The roof was laid with stone slabs, walls stacked from stone, a small vegetable garden in front with cabbage, chili peppers, and tomatoes. An old man was squatching in the garden pulling weeds, movements slow but steady.

"Uncle Shoushan, someone's looking for you."

The old man stood up, brushing dirt from his hands. He wore a blue button-front shirt, few wrinkles on his face, bright eyes. He looked early sixties, not seventy-one.

"Hello," Lin Zhe said. "I do health surveys. I'd like to learn about your lifestyle."

Chen Shoushan glanced at him and nodded. "Come in, sit."

The interior was simple. A wooden table, two bamboo chairs, an old scale and a string of dried chili peppers hanging on the wall. No TV, no refrigerator. In the corner, a wood-fired stove with an iron pot on top.

Lin Zhe asked many questions. What do you eat, when do you sleep, when do you wake, do you farm, do you have stress, has anyone in your family been sick.

Chen Shoushan answered concisely. Up at five, walk two hours on mountain paths. Eat vegetables he grows and chickens he raises. No alcohol, no tobacco, no tea. Asleep by eight. Not much stress — "What's there to stress about?" Both parents lived past ninety without major illness.

"Do you feel your body is different from others?"

Chen Shoushan thought about it. "Not really. Just don't get sick much."

Lin Zhe looked at him and suddenly realized something.

He checked Chen Shoushan's genetic testing records — none. The system had clinical records, prescription records, hospitalization records, but no genetic testing records. Chen Shoushan had never undergone genetic testing.

"Would you be willing to do a genetic test? It's free, I brought the equipment."

Chen Shoushan looked at his hands. "You want me to spit?"

"Yes, spit into this tube."

Chen Shoushan took the tube, hesitated, and spat. Lin Zhe sealed the tube and put it in his pocket.

---

Back in Beijing, Lin Zhe sent the sample to the lab. Three days later, the results came back.

He stared at the report for a full ten minutes.

Chen Shoushan's genome contained a cluster of variants never before recorded. Not single nucleotide polymorphisms (SNPs), but rearrangements of entire gene segments. These rearrangements affected dozens of genes related to inflammatory response, cellular repair, and telomere maintenance.

But what really unsettled Lin Zhe was something else.

He searched the genome database for similar sequences to this variant cluster. No exact matches. But in an obscure corner, he found a partial match — a sequence from an ancient human DNA database, sampled from skeletal remains approximately 8,000 years old found in a cave in Guizhou.

8,000 years ago, the same person — no, the same lineage — also lived in these mountains.

Lin Zhe called Secretary Yang.

"How long has Chen Shoushan's house been there?"

"That house? I heard it was built by his great-great-grandfather. Before that, I don't know."

"Has his family always lived in that spot on the back mountain?"

"Seems so. The old folks in the village say the Chen family has been on the back mountain for many generations."

Lin Zhe hung up and sat in his chair looking out the window.

Among 1.4 billion people, a person who statistically shouldn't exist had appeared. His genes held 8,000-year-old code. He lived on the same mountain his ancestors may have occupied for thousands of years. He ate the same foods his ancestors may have eaten for thousands of years. His body, over hundreds of generations, had reached some kind of balance with the environment that modern medicine couldn't explain.

The system's yellow warning was still blinking. Lin Zhe reached out and turned it off.

He wasn't sure whether he should write a paper. Wasn't sure whether he should tell anyone. The only thing he was sure of: Chen Shoushan would continue growing cabbage on the back mountain, getting up at five to walk, living to some unknown age.

And statistics, for some people, could never explain everything.
