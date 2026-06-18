---
layout: post
title: "2026年构建本地RAG系统完全指南：LangChain + Chroma实战"
date: 2026-05-24
categories: [AI]
tags: [代码产品]
---

## 什么是 RAG？为什么选择本地部署？

RAG（Retrieval-Augmented Generation，检索增强生成）是大模型应用中最实用的架构之一。它的核心思路很简单：先从你的知识库中检索相关文档，再把这些文档作为上下文喂给大模型，从而让模型基于你的私有数据来回答问题。

2026年，本地RAG方案已经非常成熟。相比云端API方案，本地部署有三大优势：

- **数据隐私**：文档不出本机，适合企业内部知识库
- **零API成本**：无需付费调用OpenAI等云端接口
- **离线可用**：断网环境也能正常运行

本文将手把手带你用 LangChain + Chroma + Ollama 构建一个完整的本地RAG系统。

## 环境准备

### 系统要求

- Python 3.10+
- 8GB 以上内存（推荐16GB）
- 操作系统：macOS / Linux / Windows 均可

### 安装 Ollama（本地大模型运行时）

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# 安装完成后，拉取中文能力较好的模型
ollama pull qwen2.5:7b
```

### 安装 Python 依赖

```bash
# 创建虚拟环境
python -m venv rag_env
source rag_env/bin/activate  # Windows: rag_env\Scripts\activate

# 安装核心依赖
pip install langchain langchain-community langchain-ollama \
    chromadb sentence-transformers pypdf
```

> **注意**：ChromaDB 0.4+ 版本已内置持久化支持，无需手动调用 `persist()` 方法。

## 第一步：文档加载与切分

RAG系统的第一步是将你的文档加载进来并切分成合适的片段（chunk）。切分策略直接影响检索质量。

```python
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 方式一：加载单个PDF文件
loader = PyPDFLoader("knowledge_base.pdf")
documents = loader.load()

# 方式二：加载整个目录的文档（支持PDF、TXT、Markdown等）
# loader = DirectoryLoader(
#     "./docs",
#     glob="**/*.pdf",
#     loader_cls=PyPDFLoader
# )
# documents = loader.load()

print(f"加载了 {len(documents)} 个文档页面")

# 使用递归字符切分器
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,       # 每个片段的最大字符数
    chunk_overlap=100,    # 片段之间的重叠字符数
    separators=["\n\n", "\n", "。", "！", "？", " ", ""],
    length_function=len,
)

chunks = text_splitter.split_documents(documents)
print(f"切分为 {len(chunks)} 个文本片段")
```

**切分参数建议**：
- `chunk_size=500`：适合中文问答场景，太大会稀释相关性，太小会丢失上下文
- `chunk_overlap=100`：保证相邻片段有足够重叠，避免关键信息被截断

## 第二步：向量化与存储

使用 ChromaDB 作为向量数据库，配合 HuggingFace 的本地嵌入模型，整个过程完全离线运行。

```python
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# 使用本地嵌入模型（无需API Key）
# all-MiniLM-L6-v2 是轻量级模型，适合快速上手
# 中文场景可替换为 sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"},  # 有GPU可改为 "cuda"
)

# 创建持久化的向量存储
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db",  # 数据持久化目录
)

print(f"向量库已创建，包含 {vectorstore._collection.count()} 条记录")
```

> ChromaDB 0.4+ 默认自动持久化，重启程序后只需指定相同的 `persist_directory` 即可加载数据，无需重新向量化。

## 第三步：构建检索链

LangChain 提供了简洁的链式调用接口，将检索器和大模型串联起来。

```python
from langchain_ollama import ChatOllama
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

# 初始化本地大模型
llm = ChatOllama(
    model="qwen2.5:7b",
    temperature=0.3,  # 低温度保证回答更准确
)

# 创建检索器
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 4},  # 检索最相关的4个片段
)

# 定义提示模板
system_prompt = (
    "你是一个专业的知识库助手。请根据以下检索到的上下文信息回答用户问题。"
    "如果上下文中没有相关信息，请如实告知，不要编造答案。\n\n"
    "上下文信息：\n{context}"
)

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])

# 构建RAG链
question_answer_chain = create_stuff_documents_chain(llm, prompt)
rag_chain = create_retrieval_chain(retriever, question_answer_chain)
```

## 第四步：运行问答

```python
# 单次问答
question = "请介绍一下文档中关于系统架构的核心内容"
response = rag_chain.invoke({"input": question})

print(f"问题：{question}")
print(f"回答：{response['answer']}")
print(f"引用的文档片段数：{len(response['context'])}")

# 多轮对话（带历史记忆）
from langchain.chains import create_history_aware_retriever
from langchain_core.prompts import MessagesPlaceholder

# 基于对话历史重新表述问题
contextualize_prompt = ChatPromptTemplate.from_messages([
    ("system", "根据对话历史，将用户的后续问题改写为独立的问题。"),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

history_aware_retriever = create_history_aware_retriever(
    llm, retriever, contextualize_prompt
)

# 带历史的完整RAG链
history_prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

history_chain = create_stuff_documents_chain(llm, history_prompt)
history_rag_chain = create_retrieval_chain(history_aware_retriever, history_chain)

# 模拟多轮对话
chat_history = []

# 第一轮
q1 = "项目的核心技术栈是什么？"
r1 = history_rag_chain.invoke({"input": q1, "chat_history": chat_history})
chat_history.extend([
    {"role": "user", "content": q1},
    {"role": "assistant", "content": r1["answer"]},
])

# 第二轮（可以引用上文）
q2 = "它和传统方案相比有什么优势？"
r2 = history_rag_chain.invoke({"input": q2, "chat_history": chat_history})
print(r2["answer"])
```

## 进阶优化技巧

### 1. 混合检索（BM25 + 向量检索）

```python
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever

# BM25关键词检索器
bm25_retriever = BM25Retriever.from_documents(chunks)
bm25_retriever.k = 4

# 向量检索器
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 4})

# 混合检索
ensemble_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.4, 0.6],  # BM25权重0.4，向量权重0.6
)
```

### 2. 元数据过滤

```python
# 在文档加载时添加元数据
for doc in documents:
    doc.metadata["source_type"] = "technical_doc"
    doc.metadata["department"] = "engineering"

# 检索时按元数据过滤
filtered_retriever = vectorstore.as_retriever(
    search_kwargs={
        "k": 4,
        "filter": {"department": "engineering"},
    }
)
```

### 3. 使用更好的嵌入模型

对于中文场景，推荐以下模型（按效果排序）：

| 模型 | 维度 | 特点 |
|------|------|------|
| `BAAI/bge-large-zh-v1.5` | 1024 | 中文效果最佳 |
| `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` | 384 | 多语言，速度快 |
| `all-MiniLM-L6-v2` | 384 | 英文为主，通用场景 |

## 完整项目结构

```
local-rag/
├── app.py                  # 主程序入口
├── requirements.txt        # 依赖清单
├── docs/                   # 知识库文档目录
│   ├── guide.pdf
│   └── faq.md
├── chroma_db/              # 向量数据库（自动生成）
└── README.md
```

`requirements.txt` 内容：

```
langchain>=0.3
langchain-community>=0.3
langchain-ollama>=0.2
chromadb>=0.4
sentence-transformers>=3.0
pypdf>=4.0
```

## 总结

本文从零构建了一个完全本地化的RAG系统，核心组件包括：

1. **LangChain**：负责文档加载、切分、链式调用
2. **ChromaDB**：轻量级向量数据库，自动持久化
3. **HuggingFace Embeddings**：本地嵌入模型，无需API
4. **Ollama + Qwen2.5**：本地大模型推理

整个系统无需任何云端API，数据完全本地处理，适合对隐私有要求的场景。进阶优化方面，可以通过混合检索、元数据过滤和更好的嵌入模型来提升检索准确率。

如果你在搭建过程中遇到问题，欢迎在评论区交流讨论。
