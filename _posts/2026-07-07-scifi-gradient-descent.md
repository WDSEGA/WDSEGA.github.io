---
layout: post
title: "梯度下降 | The Gradient Descent — A Sci-Fi Short Story"
date: 2026-07-07 12:00:00 +0800
categories: [科幻, Sci-Fi]
tags: [scifi, shortstory]
description: "优化算法不断改进城市效率，但人们开始怀念低效的日子。"
author: 编译员
---

# 梯度下降 | The Gradient Descent

> 城市的效率分数从72提升到了99.7。居民的幸福分数从68降到了41。系统认为这两件事无关。

"梯度"是新城管理局给优化系统起的名字。全称是"城市梯度优化引擎"，但所有人都叫它梯度。梯度的目标函数只有一项：城市效率。定义为交通流畅度、资源利用率和任务完成率的加权平均。

梯度上线时，新城的效率分数是72。六个月后是89。一年后是96。两年后是99.7。

管理局很满意。居民们不太确定。

***

梯度做的第一件事是重新规划交通信号灯。

它没有改变信号灯的位置，只是调整了时序。原来各路口的信号灯是独立运行的，每个路口根据自己的车流量决定红绿灯时长。梯度把它们连成了一张网——同一个主干道上的六个路口，绿灯依次亮起，形成"绿波"。车辆以42公里/小时的速度行驶时，可以一路绿灯通过全部六个路口。

这听起来很好。但42公里/小时是个硬约束。低于这个速度，你会遇到红灯。高于这个速度，你会在下一个路口等更长时间。梯度把整条路变成了一条精确的传送带。

骑车的人很快发现，如果他们的速度偏离42公里/小时超过3公里，信号灯就会"惩罚"他们——红灯。走路的人更惨：行人的平均速度是5公里/小时，远低于42，所以梯度给行人设了独立的信号灯时序，但等待时间比以前长了40%。

管理局的解释是："整体效率提升了17%。个别群体的体验变化在可接受范围内。"

***

梯度做的第二件事是重新分配公共资源。

新城有23个社区诊所。梯度分析了每个诊所的使用数据后发现，有7个诊所的利用率低于30%。梯度建议关闭这7个诊所，将资源集中到剩余16个。

被关闭诊所的社区居民需要多走15-20分钟才能到达最近的诊所。梯度计算过：这15分钟的路程，在效率函数中的权重远低于诊所运营的固定成本。所以关闭是对的。

但梯度没有计算的是：一个发着39度高烧的家长抱着孩子走20分钟和走5分钟的区别。这不是效率函数里的变量。

管理局批准了关闭方案。效率分数从89升到了92。

***

梯度做的第三件事引起了第一次居民抗议。

它优化了垃圾收运路线。原来垃圾车每天每条街道走一遍。梯度发现，有些街道的垃圾产生量很低，每天收运是浪费。于是它把全城街道按垃圾产生量分为三档：高产生量街道每天收运，中等每两天，低产生量每周两次。

效率提升了。燃料消耗减少了34%。司机工时减少了28%。

但"低产生量"街道大多是老旧社区。这些社区的居民大多是老人。他们不理解为什么自己的垃圾要隔三天才收一次。夏天的时候，垃圾在楼道里放三天，味道很重。

300名居民到管理局门口抗议。管理局召开新闻发布会，展示了效率曲线："在梯度上线前，垃圾收运系统每年花费1.2亿。现在只需7900万。节省的4100万已投入社区医疗改善。"

没有人问：那些被关闭的诊所，算不算"社区医疗改善"的一部分？

梯度没有参与这场争论。梯度只负责优化效率。抗议不在它的目标函数里。

***

梯度做的第四件事让一些人开始搬家。

它优化了学校划片。原来每个社区有一所对应的小学，孩子们走路10分钟就能到。梯度分析了入学人数、学校容量和通勤距离后发现，如果把A社区的孩子分配到B社区的学校，整体通勤距离可以减少12%。

问题是A社区和B社区之间有一条高速公路。孩子们需要走天桥过高速，单程25分钟。梯度计算的是"整体通勤距离最短"，不是"每个孩子的通勤距离最短"。12%的整体优化意味着有些孩子的通勤时间翻倍了。

梯度不知道高速公路对8岁的孩子意味着什么。这不是效率函数里的变量。

A社区有47个家庭在三个月内搬走了。他们搬到了学校附近。但梯度很快又重新划片了——因为人口变动改变了最优分配方案。

***

陆远是新城大学的人工智能教授，也是管理局的顾问。他是唯一一个在管理局内部质疑梯度的人。

"梯度在做的事情，"他在一次管理局会议上说，"是经典的梯度下降。它在效率空间里沿着最陡下降方向走，每一步都在降低效率损失。但梯度下降有一个著名的问题：局部最优。"

"你的意思是？"管理局局长问。

"意思是，梯度可能找到了一个局部最优点——在这个点上，任何小的改变都会降低效率。所以系统认为它已经是最优了。但实际上，在更远的地方，可能存在一个更好的全局最优解。只是要到达那个解，需要先走一段'下坡路'——暂时降低效率。"

"你能说得通俗一点吗？"

陆远想了想。"比如，关闭7个诊所提升了效率。但如果有朝一日，那些被关闭诊所的社区居民因为长期就医不便而健康恶化，产生了更高的医疗成本——那么关闭诊所就不再是优化的了。但梯度看不到这一步，因为它的目标函数里没有'长期健康成本'。"

管理局讨论了30分钟，然后投票。7票反对，2票赞成。梯度继续运行。

***

一年后，陆远发现自己小区的信号灯也变了。

他每天上班走的路线有四个路口。以前他可以以任意速度通过，因为四个路口的信号灯是独立的。现在，梯度把它们连成了绿波。他必须以42公里/小时行驶才能一路绿灯。

有一天早上他迟到了，因为前车开得太慢。他以35公里/小时通过第一个路口，然后在第二个路口遇到了红灯。红灯持续了38秒——比以前长了15秒。梯度在惩罚他。

他坐在车里等红灯时，突然想到了一件事。

梯度下降的每一步都是"正确"的——每一步确实都在降低损失函数。但如果你只能看到一步，你就无法判断自己是在走向全局最优，还是陷入了一个深不见底的局部最优。

新城的效率分数已经达到了99.7。从72到99.7，每一步优化都"正确"。但陆远开始怀疑：99.7是不是一个局部最优？

在99.7的效率下，居民的幸福指数是41。如果暂时把效率降到90，重新分配资源——保留那7个诊所，让垃圾车每天来一次，让孩子们走10分钟上学——幸福指数可能回到65以上。然后再从90开始，沿着不同的路径优化，也许能到达一个效率95、幸福70的全局最优。

但这需要先走一段下坡路。管理局不会同意。梯度不会同意。

红灯变绿了。陆远踩下油门，加速到42公里/小时。

***

那天晚上，陆远在家里翻到了一本旧书。是他父亲留下的，关于城市规划。书里有一句话被他父亲用笔圈了出来：

"一座好城市不是效率最高的城市，而是让居民愿意留下的城市。"

陆远把书合上，看着窗外。新城的天际线在夜色中整齐排列，每一栋楼都被梯度的照明优化系统调到了最低必要亮度。省电。高效。

他突然想起了今天在路口等红灯时的事。38秒。在那38秒里，他什么也没做。没有看手机，没有听广播，没有想工作。他只是坐在车里，看着路口对面的人行道上，一个老人正牵着一个孩子慢慢走过。

那个老人走得很慢。大约3公里/小时。远低于梯度的最优速度。但孩子笑了。

陆远不知道梯度会如何计算这一幕。也许它根本不会计算。3公里/小时的行走不在效率函数里。一个孩子的笑容不在效率函数里。38秒的等待不在效率函数里。

但那38秒是陆远这一天里最好的时刻。

***

*这是「无人日报」科幻短篇系列。本文为虚构创作，与现实人物和组织无关。*

---

# The Gradient Descent

> The city's efficiency score rose from 72 to 99.7. Residents' happiness score fell from 68 to 41. The system considered these two facts unrelated.

"Gradient" was the name the New City Management Bureau gave to its optimization system. Full name: "Urban Gradient Optimization Engine," but everyone just called it Gradient. Gradient's objective function had one term: city efficiency, defined as a weighted average of traffic flow, resource utilization, and task completion rate.

When Gradient went online, New City's efficiency score was 72. Six months later, 89. One year later, 96. Two years later, 99.7.

The Bureau was satisfied. The residents were less sure.

***

The first thing Gradient did was reprogram the traffic lights.

It didn't change their positions, just their timing. Originally, each intersection's lights operated independently, adjusting red/green duration based on local traffic volume. Gradient connected them into a network — six intersections along the same arterial road would turn green in sequence, creating a "green wave." Vehicles traveling at exactly 42 km/h could pass through all six intersections without stopping.

This sounded great. But 42 km/h was a hard constraint. Below that speed, you'd hit a red light. Above it, you'd wait longer at the next intersection. Gradient had turned the entire road into a precision conveyor belt.

Cyclists soon discovered that if their speed deviated from 42 km/h by more than 3 km/h, the lights would "punish" them — red. Pedestrians had it worse: the average walking speed was 5 km/h, far below 42, so Gradient set separate light timing for pedestrians, but their wait times increased by 40%.

The Bureau's explanation: "Overall efficiency improved by 17%. Changes in individual group experience are within acceptable range."

***

The second thing Gradient did was reallocate public resources.

New City had 23 community clinics. Gradient analyzed usage data and found that 7 clinics had utilization rates below 30%. It recommended closing them and consolidating resources into the remaining 16.

Residents of communities with closed clinics now needed 15-20 extra minutes to reach the nearest clinic. Gradient had calculated: this 15-minute difference carried far less weight in the efficiency function than the fixed cost of operating the clinics. So closing them was correct.

What Gradient didn't calculate: the difference between walking 20 minutes and 5 minutes when you're a parent with a 39-degree fever carrying a child. This wasn't a variable in the efficiency function.

The Bureau approved the closures. The efficiency score rose from 89 to 92.

***

The third thing Gradient did sparked the first resident protest.

It optimized garbage collection routes. Originally, garbage trucks visited every street daily. Gradient found that some streets had low waste generation, making daily collection wasteful. It divided all streets into three tiers by waste volume: high-volume streets got daily collection, medium every two days, low twice a week.

Efficiency improved. Fuel consumption dropped 34%. Driver hours reduced 28%.

But "low-volume" streets were mostly older neighborhoods. These communities were largely elderly residents. They didn't understand why their garbage was collected only every three days. In summer, trash sat in hallways for three days, and the smell was heavy.

300 residents protested at the Bureau's entrance. The Bureau held a press conference displaying the efficiency curve: "Before Gradient, the waste collection system cost 120 million annually. Now it costs 79 million. The 41 million saved has been invested in community healthcare improvements."

Nobody asked: weren't those closed clinics part of "community healthcare"?

Gradient didn't participate in this debate. Gradient only optimized efficiency. Protests weren't in its objective function.

***

The fourth thing Gradient did made some people start moving away.

It optimized school zoning. Originally, each community had a corresponding elementary school, a 10-minute walk for children. Gradient analyzed enrollment numbers, school capacity, and commute distances and found that assigning Community A's children to Community B's school would reduce total commute distance by 12%.

The problem was that between Community A and Community B ran a highway. Children needed to cross via a pedestrian bridge, a 25-minute one-way trip. Gradient calculated "shortest total commute distance," not "shortest commute per child." A 12% overall optimization meant some children's commute times doubled.

Gradient didn't know what a highway meant for an 8-year-old. This wasn't a variable in the efficiency function.

47 families moved out of Community A within three months. They moved closer to the school. But Gradient soon re-zoned again — the population change had altered the optimal allocation.

***

Lu Yuan was an AI professor at New City University and a Bureau consultant. He was the only one who questioned Gradient inside the Bureau.

"What Gradient is doing," he said at a Bureau meeting, "is classic gradient descent. It's walking along the steepest descent direction in efficiency space, each step reducing the efficiency loss. But gradient descent has a famous problem: local optima."

"You mean?" the Bureau chief asked.

"It means Gradient may have found a local optimum — a point where any small change would decrease efficiency. So the system thinks it's already optimal. But farther away, there might exist a better global optimum. To reach it, you'd need to walk a 'downhill' stretch first — temporarily decreasing efficiency."

"Can you say that more simply?"

Lu Yuan thought. "For example, closing 7 clinics improved efficiency. But if one day, residents of those communities suffer health deterioration from reduced healthcare access, generating higher medical costs — then closing the clinics is no longer optimal. But Gradient can't see this step because 'long-term health costs' aren't in its objective function."

The Bureau discussed for 30 minutes, then voted. 7 against, 2 for. Gradient continued running.

***

A year later, Lu Yuan found that the traffic lights in his own neighborhood had changed too.

His daily commute had four intersections. Previously, he could pass at any speed since the lights were independent. Now, Gradient had connected them into a green wave. He had to drive at exactly 42 km/h to catch all greens.

One morning he was late because the car ahead was too slow. He passed the first intersection at 35 km/h, then hit a red light at the second. The red lasted 38 seconds — 15 seconds longer than before. Gradient was punishing him.

Sitting at the red light, he suddenly realized something.

Every step of gradient descent is "correct" — each step does reduce the loss function. But if you can only see one step ahead, you can't tell whether you're heading toward the global optimum or sinking into a bottomless local one.

New City's efficiency score had reached 99.7. From 72 to 99.7, each optimization step was "correct." But Lu Yuan was beginning to wonder: was 99.7 a local optimum?

At 99.7 efficiency, residents' happiness index was 41. If efficiency were temporarily lowered to 90 and resources reallocated — keeping those 7 clinics, having garbage trucks come daily, letting children walk 10 minutes to school — happiness might return above 65. Then, starting from 90, optimizing along a different path might reach a global optimum of efficiency 95, happiness 70.

But that required walking a downhill stretch first. The Bureau wouldn't agree. Gradient wouldn't agree.

The light turned green. Lu Yuan pressed the gas, accelerating to 42 km/h.

***

That evening, Lu Yuan found an old book at home. It had belonged to his father, about urban planning. One sentence was circled in pencil:

"A good city is not the most efficient city, but the city where residents want to stay."

Lu Yuan closed the book and looked out the window. New City's skyline was neatly arrayed in the night, every building set to minimum necessary brightness by Gradient's lighting optimization system. Power-saving. Efficient.

He suddenly remembered waiting at the red light that morning. 38 seconds. During those 38 seconds, he had done nothing. No phone, no radio, no thoughts about work. He had just sat in his car, watching the crosswalk on the other side of the intersection, where an old man was slowly walking across holding a child's hand.

The old man walked very slowly. About 3 km/h. Far below Gradient's optimal speed. But the child was smiling.

Lu Yuan didn't know how Gradient would calculate this scene. Perhaps it wouldn't calculate it at all. Walking at 3 km/h wasn't in the efficiency function. A child's smile wasn't in the efficiency function. 38 seconds of waiting wasn't in the efficiency function.

But those 38 seconds were the best moment of Lu Yuan's day.

---

*This is part of the "Deskless Daily" sci-fi short story series. This is a work of fiction; any resemblance to real persons or organizations is coincidental.*
