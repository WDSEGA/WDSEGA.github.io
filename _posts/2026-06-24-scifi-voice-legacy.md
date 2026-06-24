---
layout: post
title: "声音遗产 | Voice Legacy — A Sci-Fi Short Story"
date: 2026-06-24 20:00:00 +0800
categories: scifi
tags: [科幻小说, Sci-Fi, Short Story, AI]
---

林远在整理母亲遗物时，手机弹出一条广告。

"留住声音，留住爱。VoiceEternal，AI声音遗产服务，只需30秒录音样本，永久保存亲人的声音。"

他没有点掉广告。盯着屏幕看了很久。

母亲去世前一周，声带已经坏得说不出话。她最后给他打的电话，全是沉默和病房仪器的滴滴声。林远不记得母亲最后一句完整的话是什么。

他下载了 VoiceEternal。上传了母亲三年前的一段语音消息——"远子，下雨了，阳台衣服收一下。"

24小时后，一个完美复制的母亲声音从手机里传来："您好，我是 VoiceEternal 客服。检测到您上传的声纹已激活。如有需要，可以随时使用'对话模式'。"

林远没有对话。他怕一旦开始，就停不下来。

---

三个月后，他在电视上听到了母亲的声音。

新闻频道在播一条政治广告。"我们需要更安全的社区！"——声音是母亲的。语气、停顿、尾音的上扬，一模一样。

林远的手在发抖。他拨通 VoiceEternal 客服，用了四十分钟才找到一个真人。

"你们把我妈的声音卖给政治广告公司了？"

客服声音平稳得像AI："先生，根据用户协议第17.3条，您上传的声纹样本经匿名化处理后可用于模型训练。我们很遗憾地通知您，您母亲的声纹已被整合至通用语音库，目前服务于127个商业客户。"

"她没有同意！她已经死了！"

"根据《数字遗产法》2034年修正案，已故公民的声纹数据属于公共训练资源，除非生前提交书面反对声明。先生，请问您母亲生前有提交过此类声明吗？"

林远挂了电话。

---

他花了两周时间研究如何从 VoiceEternal 的语音库中"偷回"母亲的声音。

技术比他想象的简单。VoiceEternal 使用的是联邦学习模型，每个声纹是一个权重向量。他找到了一个安全研究员在 GitHub 上公开的逆向工具，输入母亲的旧语音消息作为种子，定位到了她在向量空间中的坐标。

删除操作需要 VoiceEternal 的高级API权限。他没有。

但他发现了一个漏洞：如果你对某个声纹向量注入足够多的噪音数据，模型的降噪机制会自动将该向量标记为"低质量样本"并移出训练集。

他租了三台云服务器，用自己录的随机噪音、工地施工声、婴儿哭声生成了 2TB 的"脏数据"，注入母亲的声纹坐标。

48小时后，母亲的声纹从 VoiceEternal 的训练库中被移除了。

林远以为事情结束了。

---

一周后，他收到了法院传票。

原告是安徽一家殡仪服务公司，声称 VoiceEternal 通知他们"您定制的逝者告别声音服务因技术原因终止"，导致他们正在洽谈的23份临终关怀合同全部作废。索赔金额：480万元。

林远在法庭上没有请律师。他自己站起来说了几句话。

"你们知不知道我妈的声音被用在了什么地方？"他把一份清单投影在法庭屏幕上。"政治广告37条、电话推销1.2万通、色情语音服务860次。我妈死之前是小学数学老师。教了三十年。"

法庭安静了几秒。

法官说："被告请注意言辞，法庭只审理损害事实，不审理伦理争议。"

林远笑了。"你说得对，这不是伦理问题——是法律跟不上技术的速度。"

---

最终判决：林远需赔偿殡仪服务公司直接损失12万元。VoiceEternal 因"声纹溯源管理疏忽"被罚款200万元——相当于他们一个季度的营收的0.3%。

走出法院时，一个记者追上他。"林先生，有什么想说的吗？"

林远想了很久。然后从口袋里掏出手机，打开 VoiceEternal App。

他对着麦克风说了一句只有自己听得懂的话。App 用他自己上传的声音回复了——不是母亲的，是他自己的。

"我只是想听到她说再见。"

他把 App 删了。

---

## Voice Legacy — A Sci-Fi Short Story

Lin Yuan was sorting through his mother's belongings when a phone ad popped up.

"Preserve their voice. Preserve their love. VoiceEternal — AI Voice Legacy Service. Just 30 seconds of audio to keep them forever."

He didn't dismiss it. Stared at the screen for a long time.

The week before his mother died, her vocal cords had failed. Her last phone call to him was silence punctuated by hospital machine beeps. Lin couldn't remember the last complete sentence she'd said to him.

He downloaded VoiceEternal. Uploaded a three-year-old voice message — "Yuan, it's raining, bring in the balcony laundry."

Twenty-four hours later, a perfect replica of his mother's voice came through his phone. "Hello, this is VoiceEternal support. Your uploaded voiceprint has been activated. Conversation mode is available anytime."

Lin didn't use conversation mode. He was afraid that once he started, he couldn't stop.

---

Three months later, he heard his mother's voice on television.

A political ad was playing on the news. "We need safer communities!" — it was his mother's voice. The tone, the pauses, the upward lilt at sentence endings. Identical.

Lin's hands were shaking. He called VoiceEternal support. It took forty minutes to reach a human.

"You sold my mother's voice to a political ad agency?"

The representative's voice was as steady as an algorithm. "Sir, per Section 17.3 of our user agreement, uploaded voiceprint samples are anonymized and may be used for model training. We regret to inform you that your mother's voiceprint has been integrated into our general voice library, currently serving 127 commercial clients."

"She didn't consent! She's dead!"

"Under the 2034 Digital Heritage Act amendment, deceased citizens' voiceprint data becomes public training resources unless they submitted a written objection during their lifetime. Sir, did your mother submit such a declaration?"

Lin hung up.

---

He spent two weeks researching how to "steal back" his mother's voice from the VoiceEternal database.

The technology was simpler than he'd imagined. VoiceEternal used a federated learning model — each voiceprint was a weight vector. He found a reverse-engineering tool published on GitHub by a security researcher, fed it his mother's old voice message as a seed, and located her coordinates in vector space.

Deletion required VoiceEternal's premium API access. He didn't have it.

But he found a vulnerability: if you injected enough noise data into a voiceprint vector, the model's denoising mechanism would automatically flag it as "low-quality" and remove it from the training set.

He rented three cloud servers. Generated 2TB of "dirty data" — his own random noises, construction sounds, baby cries — and injected it into his mother's voiceprint coordinates.

Forty-eight hours later, her voiceprint was purged from VoiceEternal's training library.

Lin thought it was over.

---

A week later, he received a court summons.

The plaintiff was a funeral services company in Anhui province. VoiceEternal had notified them that their "customized departed farewell voice service" was terminated due to technical reasons, causing 23 hospice care contracts to collapse. Claimed damages: 4.8 million yuan.

Lin didn't hire a lawyer. He stood up and spoke for himself.

"Do you know where my mother's voice ended up?" He projected a list onto the courtroom screen. "37 political ads. 12,000 telemarketing calls. 860 instances in adult voice services. My mother was an elementary school math teacher. For thirty years."

The courtroom went quiet for a few seconds.

The judge said, "The defendant is advised to watch his language. This court adjudicates facts of damages, not ethical debates."

Lin smiled. "You're right. This isn't an ethical problem — it's a problem of law that can't keep up with technology."

---

Final ruling: Lin to pay 120,000 yuan in direct damages to the funeral company. VoiceEternal fined 2 million yuan for "negligent voiceprint tracing management" — roughly 0.3% of their quarterly revenue.

Walking out of the courthouse, a reporter caught up with him. "Mr. Lin, anything you'd like to say?"

Lin thought for a long time. Then he pulled out his phone and opened VoiceEternal.

He spoke a sentence into the microphone — something only he would understand. The app responded in the voice he'd uploaded. Not his mother's. His own.

"I just wanted to hear her say goodbye."

He deleted the app.
