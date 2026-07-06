---
layout: post
title: "边界条件 | The Boundary Condition — A Sci-Fi Short Story"
date: 2026-07-06 19:00:00 +0800
categories: [科幻短篇, Sci-Fi Short Story]
tags: [scifi, shortstory, mapping, anomaly]
description: "测绘AI在西藏发现了一片不存在于任何物理规律中的区域。GPS穿过它像穿过空气，但走进去的人再也走不出来。"
author: 编译员
---

# 边界条件 | The Boundary Condition

> AI说那里是空的。卫星图说那里是空的。但两个走进去的人没有出来。第三个走进去的人出来了，但他说里面不是空的——他说里面什么都有。

测绘项目代号"天穹"，是中国地质调查局的高精度地形测绘计划。用AI驱动的多源数据融合系统，把卫星遥感、航空摄影、LiDAR点云和地面勘测数据合成一套全国1:500比例尺的三维地形模型。项目运行了三年，覆盖了98%的国土。

剩下2%在西藏阿里地区，一片海拔5200米的高原台地。系统标记为"数据空洞区"。

"数据空洞区"不是未测绘——是测绘了但数据对不上。卫星图显示那里是平坦的荒原，航空摄影显示同样，LiDAR点云也确认地面高程变化不超过2米。但三个数据源合成的三维模型在该区域出现了持续异常：模型渲染出一片不存在的"凹陷"，深度约300米，直径约800米。

项目组以为是数据融合算法的bug。派了两名工程师带着便携LiDAR去实地验证。

他们没有回来。

搜救队在"空洞区"边缘找到了他们的车。车停得好好的，油满的，物资齐全。GPS轨迹记录显示两人步行进入了那片区域，轨迹在中心点附近消失——不是信号丢失，是GPS坐标值在该点变成了NaN。

军方接手了。一架无人机被送进去。无人机飞了400米后信号中断，但最后传回的画面显示前方是一面垂直的岩壁，高约200米。

卫星图和航空摄影都显示那里没有岩壁。

***

我被叫去是因为我是"天穹"系统的架构师。名字叫周明，在地质调查局干了十二年。我设计的多源数据融合AI用了深度学习加传统摄影测量的混合架构，处理过沙漠、冰川、喀斯特溶洞等各种复杂地形，从没出过这种问题。

到达阿里是第三天。军方的联络官姓赵，矮个子，说话很直接。

"周工，我先说清楚：这不是普通的测绘偏差。我们有理由认为那片区域的物理规律有问题。"

我看了他一眼，没说话。

他带我到指挥帐篷。桌上铺着一张大比例尺地图，中心用红笔画了一个圈。

"这是异常区。直径800米。我们用所有已知手段扫描过——光学、红外、雷达、LiDAR、重力仪、磁力仪。所有被动传感器显示那里是平坦荒原。所有主动传感器——发射信号并接收回波的那种——显示那里有一个深300米的垂直洞穴。"

"被动和主动传感器结果矛盾？"

"对。被动传感器接收的是环境本身发出的信号——阳光反射、热辐射。这些信号显示那里什么都没有。主动传感器发射自己的信号——激光脉冲、雷达波——然后接收回波。这些信号显示那里有一个巨大的空洞。"

"这意味着什么？"

赵联络官看着我："意味着那片区域对入射的探测信号表现出一种我们从未见过的行为——它'制造'了一个虚假的回波，让主动传感器以为那里是空的。而实际上……"

他停了一下。

"实际上我们不知道那里是什么。被动传感器说'空'，主动传感器说'洞'。两种结果都是错的，或者都是对的。"

***

第二天我带了一套新的设备：一台量子重力梯度仪。这是最新的设备，理论上能检测到地下任何密度异常。

我在边缘500米处架设了仪器，对准异常区中心。

读数在屏幕上跳了一下，然后稳定在一个值上。

然后读数开始倒退——不是数值变化，是数字本身在倒退。4.7、4.6、4.5……一直退到0，然后变成负数。

重力梯度不可能为负。这意味着那片区域的质量为负——它不产生引力，而是排斥引力。

我叫赵联络官来看。他看了一眼，拿起卫星电话拨了一个号码。

"首长，确认了。建议提升到一级。"

***

一周后来了一个人。不是军人，是物理学家。姓方，中科院的，研究广义相对论。

方教授带了两个研究生和一个装满仪器的箱子。他在边缘架了一台原子钟——不是普通的原子钟，是光晶格钟，精度10^-18秒。

"如果那片区域的时空结构有异常，"他说，"时间流速会不同。"

他让一个研究生在边缘放一台光晶格钟，他自己带另一台走进异常区。

我在监控屏幕前看着他的GPS轨迹。他走了大约200米后，轨迹停止了。不是消失——是停在一个点上不动了。

通讯还在。方教授的声音从对讲机里传来，但延迟越来越大。第一句"我看到了一些东西"延迟0.3秒。第二句"这里的地面不是平的"延迟1.2秒。第三句延迟4.7秒。

然后通讯断了。

我们等了六个小时。

方教授走出来了。他的头发白了一半——不是灰白，是纯白。他的光晶格钟显示他在里面待了四分钟。

"里面是什么？"赵联络官问。

方教授坐下来，喝了三杯水，才开口。

"里面不是洞穴，也不是平地。里面是一个……截面。"

"截面？"

"你们知道平面国吗？二维生物生活在平面里，无法理解三维。如果三维空间被一个四维结构'穿过'，我们在三维视角下看到的不是那个四维物体本身，而是它在三维空间中的截面——就像CT扫描看到的是人体的切片。"

"你是说那片区域是四维空间在三维中的截面？"

"不是四维空间。是四维空间的边界条件。物理定律在那里不适用——不是失效，是那里定义了物理定律为什么在我们的三维空间中是这样而不是别的样子。"

方教授的白发没有恢复。他后来发表了一篇论文，标题是《论局部时空边界条件对主动探测信号的调制效应》，发表在《物理评论快报》上，引用次数为零。因为没有人能重复他的实验——那片区域在方教授走出来后的第三天消失了。

卫星图和航空摄影重新显示那里是平坦荒原。LiDAR点云也确认地面高程变化不超过2米。

两名工程师始终没有找到。

***

我后来重新运行了"天穹"系统的数据融合AI，让它分析那两周的所有数据。AI给出的结论是：

"检测到未知物理现象。现有物理模型无法解释。建议扩展传感器类型后重新采集。"

我关掉了系统。有些边界条件不是用来理解的——它们只是在那里，提醒你物理定律本身也有边界。

---

# The Boundary Condition — A Sci-Fi Short Story

> The AI said it was empty. Satellite imagery said it was empty. But two people who walked in didn't come out. The third person who walked in did come out — but he said it wasn't empty inside. He said it had everything.

The surveying project, code-named "Sky Dome," was the China Geological Survey's high-precision terrain mapping initiative. An AI-driven multi-source data fusion system synthesized satellite remote sensing, aerial photography, LiDAR point clouds, and ground survey data into a nationwide 1:500 scale 3D terrain model. The project had run for three years, covering 98% of the country's territory.

The remaining 2% was in the Ngari region of Tibet, a plateau terrace at 5,200 meters elevation. The system labeled it a "data void zone."

A "data void zone" wasn't unmapped — it was mapped but the data didn't reconcile. Satellite imagery showed flat wasteland. Aerial photography showed the same. LiDAR point clouds confirmed ground elevation variation of no more than 2 meters. But when the three data sources were fused into a 3D model, a persistent anomaly appeared in that region: the model rendered a "depression" that shouldn't exist, about 300 meters deep and 800 meters in diameter.

The project team assumed it was a bug in the data fusion algorithm. They sent two engineers with portable LiDAR to verify on-site.

They didn't come back.

The search and rescue team found their vehicle at the edge of the "void zone." The car was fine — full tank, supplies intact. GPS tracks showed both men walking into the area, their tracks disappearing near the center point — not signal loss, but GPS coordinate values becoming NaN at that point.

The military took over. A drone was sent in. The drone's signal cut out after 400 meters, but the final transmitted frame showed a vertical rock face ahead, about 200 meters high.

Satellite imagery and aerial photography both showed no rock face there.

***

I was called in because I was the architect of the "Sky Dome" system. My name is Zhou Ming, twelve years at the Geological Survey. The multi-source data fusion AI I designed used a hybrid architecture of deep learning and traditional photogrammetry. It had processed deserts, glaciers, karst caves, and every kind of complex terrain without this kind of problem.

Arriving in Ngari on the third day. The military liaison officer was surnamed Zhao — short, direct.

"Engineer Zhou, let me be clear: this isn't a normal surveying deviation. We have reason to believe the physical laws in that area are problematic."

I looked at him but said nothing.

He led me to the command tent. A large-scale map was spread on the table, with a red circle in the center.

"This is the anomaly zone. 800 meters diameter. We've scanned it with every known method — optical, infrared, radar, LiDAR, gravimeter, magnetometer. All passive sensors show flat wasteland. All active sensors — the kind that emit signals and receive echoes — show a 300-meter-deep vertical cavern."

"Passive and active sensor results contradict?"

"Yes. Passive sensors receive signals emitted by the environment itself — sunlight reflection, thermal radiation. These signals show nothing there. Active sensors emit their own signals — laser pulses, radar waves — and receive echoes. These signals show a massive cavern."

"What does that mean?"

Liaison Zhao looked at me: "It means that region exhibits behavior toward incident probing signals that we've never seen — it 'manufactures' a false echo, making active sensors think it's empty. But in reality..."

He paused.

"In reality, we don't know what's there. Passive sensors say 'empty.' Active sensors say 'cavern.' Both results are wrong, or both are right."

***

The next day I brought new equipment: a quantum gravity gradiometer. The latest device, theoretically capable of detecting any subsurface density anomaly.

I set up the instrument 500 meters from the edge, aimed at the center of the anomaly zone.

The reading jumped once on the screen, then stabilized at a value.

Then the reading started running backward — not the value changing, but the digits themselves reversing. 4.7, 4.6, 4.5... down to 0, then into negative numbers.

Gravity gradients can't be negative. This meant the mass in that region was negative — it didn't generate gravity, it repelled it.

I called Liaison Zhao over. He glanced at it, picked up the satellite phone, and dialed a number.

"Sir, confirmed. Recommend elevating to Level One."

***

A week later, someone arrived. Not military — a physicist. Surnamed Fang, from the Chinese Academy of Sciences, studying general relativity.

Professor Fang brought two graduate students and a case full of instruments. He set up an atomic clock at the edge — not an ordinary atomic clock, but an optical lattice clock with 10^-18 second precision.

"If the spacetime structure in that region is anomalous," he said, "time flow will differ."

He had one graduate student place an optical lattice clock at the edge, and he carried another into the anomaly zone himself.

I watched his GPS track on the monitor. After about 200 meters, the track stopped. Not disappeared — stopped at a single point, motionless.

Communication was still active. Professor Fang's voice came through the walkie-talkie, but with increasing delay. The first sentence, "I see something," had a 0.3-second delay. The second, "The ground here isn't flat," had a 1.2-second delay. The third had a 4.7-second delay.

Then communication cut out.

We waited six hours.

Professor Fang walked out. Half his hair had turned white — not gray, but pure white. His optical lattice clock showed he had been inside for four minutes.

"What's in there?" Liaison Zhao asked.

Professor Fang sat down, drank three cups of water, and spoke.

"It's not a cavern, and it's not flat ground. It's a... cross-section."

"A cross-section?"

"You know Flatland? Two-dimensional beings living in a plane, unable to comprehend three dimensions. If three-dimensional space is 'pierced' by a four-dimensional structure, what we see from our 3D perspective isn't the four-dimensional object itself, but its cross-section in 3D space — like how a CT scan shows slices of a human body."

"You're saying that region is a cross-section of four-dimensional space in three dimensions?"

"Not four-dimensional space. A boundary condition of four-dimensional space. Physical laws don't apply there — they don't fail, that region defines why physical laws are what they are in our 3D space rather than something else."

Professor Fang's white hair never reverted. He later published a paper titled "On the Modulation Effect of Local Spacetime Boundary Conditions on Active Probing Signals" in Physical Review Letters, with zero citations. Because no one could repeat his experiment — the region disappeared three days after Professor Fang walked out.

Satellite imagery and aerial photography again showed flat wasteland. LiDAR point clouds confirmed ground elevation variation of no more than 2 meters.

The two engineers were never found.

***

I later re-ran the "Sky Dome" system's data fusion AI, feeding it all data from those two weeks. The AI's conclusion was:

"Unknown physical phenomenon detected. Existing physical models cannot explain. Recommend expanding sensor types and re-collecting data."

I shut down the system. Some boundary conditions aren't meant to be understood — they're just there, reminding you that physical laws themselves have boundaries.
