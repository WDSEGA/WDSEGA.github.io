---
title: "微软用自研MAI模型替换Excel和Outlook中的OpenAI，NVIDIA联合Hugging Face开源人形机器人GR00T 1.7 | Microsoft Swaps In-House MAI Models Into Excel and Outlook, NVIDIA and Hugging Face Open-Source Humanoid Robot GR00T 1.7"
date: 2026-07-12
categories: [AI新闻]
tags: [AI, Microsoft, NVIDIA, 机器人]
excerpt: "微软开始在Excel和Outlook中用自研MAI系列模型替换OpenAI和Anthropic的模型。NVIDIA和Hugging Face联合开源人形机器人基础模型GR00T 1.7，首个商业化可行的机器人基础模型。"
---

## 微软用自研MAI模型替换Excel和Outlook中的OpenAI，NVIDIA联合Hugging Face开源人形机器人GR00T 1.7

2026年7月12日，两条重磅消息分别来自AI软件和AI硬件领域：微软开始用自研MAI模型替换Office产品中的第三方AI模型；NVIDIA和Hugging Face联合开源了首个商业化可行的人形机器人基础模型GR00T 1.7。

### 微软：MAI模型进入Excel和Outlook

据Bloomberg 7月8日报道，微软已悄然开始在核心Office产品中用自研MAI系列模型替换第三方AI模型（包括OpenAI和Anthropic的模型）。

关键信息：

- Excel和Outlook现在每周处理数万次AI提示，全部由MAI模型完成
- 这是此前未公开的部署规模
- Mustafa Suleyman领导的AI团队正在构建完整的模型独立性
- MAI系列旨在以极低成本处理Copilot的海量token消耗

这一替换标志着微软AI战略的重要转折：不再愿意为OpenAI和Anthropic的模型支付溢价。虽然当前的合作关系仍提供折扣访问，但条款正在收紧。

**战略含义**：微软从"依赖OpenAI"转向"自研+合作"双轨制。MAI模型的部署证明，当AI推理规模达到Microsoft 365的量级时，自研模型的经济优势变得不可忽视。

### NVIDIA + Hugging Face：开源人形机器人

7月7日，NVIDIA和Hugging Face宣布大幅扩展机器人合作，将NVIDIA的Isaac GR00T 1.7视觉-语言-动作模型和Isaac Teleop数据采集框架集成到Hugging Face的开源LeRobot库中。

**GR00T 1.7关键特性：**

| 特性 | 说明 |
|------|------|
| 模型类型 | 视觉-语言-动作（VLA）模型 |
| 定位 | 首个开源的、商业化可行的人形机器人基础模型 |
| 部署方式 | 通过标准LeRobot工作流进行后训练和部署 |
| 无需专有工具链 | 开发者无需购买NVIDIA专有软件即可使用 |

**Isaac Teleop功能：**
- 高质量人类示范数据采集
- 互操作格式，直接输入LeRobot数据集
- 为机器人提供"看人怎么做然后模仿"的学习能力

**路线图**：Cosmos 3——一个前沿世界基础模型，用于在真实数据过于昂贵或危险时生成合成机器人训练数据。

**生态连接**：此次合作将NVIDIA的300万机器人开发者与Hugging Face的1600万AI构建者连接起来，形成统一流水线：遥操作 → GR00T训练 → Cosmos仿真 → LeRobot部署。

### 两条线索的交汇

微软的自研模型替换和NVIDIA的开源机器人模型，看似不相关，实则指向同一个趋势：**AI正在从"少数巨头提供API"走向"多方自研+开源生态"**。

- 微软的MAI模型意味着，即使是最依赖OpenAI的客户也在寻求模型自主权
- NVIDIA的GR00T开源意味着，人形机器人的"大脑"不再是少数公司的专利
- 两者共同推动AI从云服务向端侧、向物理世界的扩展

---

### Microsoft Swaps In-House MAI Models Into Excel and Outlook, NVIDIA and Hugging Face Open-Source Humanoid Robot GR00T 1.7

**Microsoft's MAI Integration:**

Bloomberg reported on July 8 that Microsoft has started replacing third-party AI models (including OpenAI's and Anthropic's) with its in-house MAI series in core Office products. Excel and Outlook now process tens of thousands of weekly AI prompts entirely on MAI models — a deployment scale not previously disclosed.

Mustafa Suleyman's AI team is building toward full model independence, with MAI designed to handle Copilot's massive token consumption at a fraction of the cost. The current OpenAI partnership still provides discounted access, but terms are narrowing.

**NVIDIA + Hugging Face Robotics Partnership:**

On July 7, NVIDIA and Hugging Face announced a major expansion of their robotics partnership:

- **GR00T 1.7**: First open, commercially viable robot foundation model for humanoid robots
- **Isaac Teleop**: High-quality human demonstration capture in interoperable formats
- **LeRobot integration**: Developers can post-train and deploy through standard open-source workflows
- **Cosmos 3 roadmap**: A frontier world foundation model for generating synthetic robotics data
- **Ecosystem**: Connects NVIDIA's 3M robotics developers with Hugging Face's 16M AI builders

The unified pipeline: teleoperate → train on GR00T → simulate with Cosmos → deploy through LeRobot.

Both developments point to the same trend: AI is moving from "APIs from a few giants" to "multi-party self-developed + open-source ecosystems." Microsoft's MAI proves even OpenAI's closest partner seeks model autonomy, while GR00T's open-source release democratizes humanoid robot intelligence.

*Follow 无人日报 | Deskless Daily for daily AI frontier coverage.*
