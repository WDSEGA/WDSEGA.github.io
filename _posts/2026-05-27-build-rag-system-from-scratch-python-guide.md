---
layout: post
title: "从零构建RAG系统：Python实现检索增强生成的完整指南"
date: 2026-05-27
categories: [Python, AI, 教程]
tags: [代码产品]
image: /assets/images/python-rag-implementation.jpg
---

## 什么是RAG？为什么它如此重要？

RAG（Retrieval-Augmented Generation，检索增强生成）是当前大语言模型应用中最热门的架构之一。它的核心思想很简单：**在生成回答之前，先从知识库中检索相关信息，然后将检索到的内容作为上下文提供给大模型，从而生成更准确、更有依据的回答。**

![RAG系统架构](/assets/images/python-rag-implementation.jpg)

传统的纯LLM方案存在几个致命问题：

- **知识截止日期**：模型的训练数据有固定的时间边界，无法获取最新信息
- **幻觉问题**：模型可能"一本正经地胡说八道"，编造不存在的事实
- **领域知识匮乏**：对于企业内部文档、专业领域知识，通用模型往往力不从心
- **可追溯性差**：无法验证回答的来源和依据

RAG通过引入外部知识检索环节，有效解决了这些问题。它让AI不再仅仅依赖参数化的记忆，而是能够实时访问和引用外部知识源。

## RAG系统架构全景

一个完整的RAG系统通常包含以下核心组件：

```
用户提问 → 查询预处理 → 向量检索 → 上下文组装 → LLM生成 → 回答返回
                ↑
文档加载 → 文本分块 → 向量化 → 存入向量数据库
```

让我们从零开始，逐步构建这个系统。

## 第一步：环境准备与依赖安装

首先创建项目并安装必要的依赖：

```bash
mkdir rag-system && cd rag-system
python -m venv venv
source venv/bin/activate

pip install langchain langchain-openai chromadb sentence-transformers
pip install pypdf unstructured tiktoken
```

创建一个基础的配置文件：

```python
# config.py
import os

# OpenAI API配置（也可替换为其他LLM提供商）
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-api-key-here")
OPENAI_MODEL = "gpt-4o"

# Embedding模型配置
EMBEDDING_MODEL = "all-MiniLM-L6-v2"  # 本地模型，无需API
EMBEDDING_DIMENSION = 384

# 向量数据库配置
CHROMA_PERSIST_DIR = "./chroma_db"

# 检索配置
TOP_K_RESULTS = 5
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
```

## 第二步：文档加载与分块策略

文档分块是RAG系统中极其关键的一步。分块质量直接影响检索的准确性和最终回答的质量。

```python
# document_loader.py
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.document_loaders import UnstructuredMarkdownLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List
from langchain_core.documents import Document


class DocumentProcessor:
    """文档加载与分块处理器"""

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", "。", "！", "？", ".", " ", ""],
        )

    def load_document(self, file_path: str) -> List[Document]:
        """根据文件类型自动选择加载器"""
        if file_path.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
        elif file_path.endswith(".md"):
            loader = UnstructuredMarkdownLoader(file_path)
        elif file_path.endswith(".txt"):
            loader = TextLoader(file_path, encoding="utf-8")
        else:
            raise ValueError(f"不支持的文件格式: {file_path}")

        return loader.load()

    def process(self, file_path: str) -> List[Document]:
        """加载文档并进行分块"""
        documents = self.load_document(file_path)
        chunks = self.text_splitter.split_documents(documents)

        # 为每个分块添加元数据
        for i, chunk in enumerate(chunks):
            chunk.metadata["chunk_index"] = i
            chunk.metadata["source_file"] = file_path

        print(f"文档 '{file_path}' 已处理: {len(documents)} 页 → {len(chunks)} 个分块")
        return chunks
```

### 分块策略对比

不同的分块策略适用于不同场景：

| 策略 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| 固定长度分块 | 通用场景 | 实现简单 | 可能截断语义 |
| 递归字符分块 | 结构化文档 | 保留语义边界 | 需要调参 |
| 语义分块 | 长文档 | 语义完整性高 | 计算成本高 |
| 句子级分块 | 精确检索 | 粒度细 | 上下文可能不足 |

推荐使用 `RecursiveCharacterTextSplitter`，它在大多数场景下表现良好，且支持自定义分隔符来适配中文文档。

## 第三步：向量数据库与Embedding

我们使用ChromaDB作为向量数据库，它轻量、易用，非常适合入门和中小规模应用。

```python
# vector_store.py
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from typing import List, Optional
from config import EMBEDDING_MODEL, CHROMA_PERSIST_DIR


class VectorStoreManager:
    """向量数据库管理器"""

    def __init__(self, persist_directory: str = CHROMA_PERSIST_DIR):
        self.embeddings = HuggingFaceEmbeddings(
            model_name=EMBEDDING_MODEL,
            model_kwargs={"device": "cpu"},
            encode_kwargs={"normalize_embeddings": True},
        )
        self.persist_directory = persist_directory
        self.vectorstore: Optional[Chroma] = None

    def create_vectorstore(
        self, documents: List[Document], collection_name: str = "default"
    ) -> Chroma:
        """从文档创建向量数据库"""
        self.vectorstore = Chroma.from_documents(
            documents=documents,
            embedding=self.embeddings,
            persist_directory=self.persist_directory,
            collection_name=collection_name,
        )
        self.vectorstore.persist()
        print(f"向量数据库已创建，共 {len(documents)} 条记录")
        return self.vectorstore

    def load_vectorstore(self, collection_name: str = "default") -> Chroma:
        """加载已有的向量数据库"""
        self.vectorstore = Chroma(
            persist_directory=self.persist_directory,
            embedding_function=self.embeddings,
            collection_name=collection_name,
        )
        return self.vectorstore

    def add_documents(self, documents: List[Document]) -> List[str]:
        """向已有数据库添加新文档"""
        if self.vectorstore is None:
            raise ValueError("请先加载或创建向量数据库")
        return self.vectorstore.add_documents(documents)

    def similarity_search(self, query: str, top_k: int = 5) -> List[Document]:
        """相似度检索"""
        if self.vectorstore is None:
            raise ValueError("请先加载或创建向量数据库")
        return self.vectorstore.similarity_search(query, k=top_k)

    def similarity_search_with_score(
        self, query: str, top_k: int = 5
    ) -> List[tuple]:
        """带相似度分数的检索"""
        if self.vectorstore is None:
            raise ValueError("请先加载或创建向量数据库")
        return self.vectorstore.similarity_search_with_score(query, k=top_k)
```

### Embedding模型选择

选择合适的Embedding模型至关重要：

- **all-MiniLM-L6-v2**：轻量级，速度快，适合入门
- **bge-large-zh-v1.5**：中文场景表现优秀
- **text-embedding-3-small**：OpenAI提供，质量高但需API调用
- **gte-Qwen2-7B-instruct**：2025年新模型，中英文表现俱佳

## 第四步：检索算法优化

基础的相似度检索往往不够，我们需要更智能的检索策略：

```python
# retriever.py
from langchain_community.vectorstores import Chroma
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import CrossEncoderReranker
from langchain_community.cross_encoders import HuggingFaceCrossEncoder
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever
from typing import List


class AdvancedRetriever:
    """高级检索器：混合检索 + 重排序"""

    def __init__(self, vectorstore: Chroma, documents: List):
        self.vectorstore = vectorstore
        self.documents = documents

    def create_hybrid_retriever(self, top_k: int = 10) -> EnsembleRetriever:
        """创建混合检索器（向量检索 + BM25关键词检索）"""
        # 向量检索器
        vector_retriever = vectorstore.as_retriever(
            search_type="mmr",  # 使用MMR算法增加多样性
            search_kwargs={"k": top_k, "fetch_k": top_k * 3},
        )

        # BM25关键词检索器
        bm25_retriever = BM25Retriever.from_documents(
            self.documents, k=top_k
        )

        # 混合检索
        ensemble_retriever = EnsembleRetriever(
            retrievers=[vector_retriever, bm25_retriever],
            weights=[0.6, 0.4],  # 向量检索权重更高
        )
        return ensemble_retriever

    def create_reranking_retriever(self, top_k: int = 5):
        """创建带重排序的检索器"""
        # 使用Cross-Encoder进行精排
        cross_encoder = HuggingFaceCrossEncoder(
            model_name="BAAI/bge-reranker-v2-m3"
        )
        compressor = CrossEncoderReranker(
            model=cross_encoder, top_n=top_k
        )

        base_retriever = self.vectorstore.as_retriever(
            search_kwargs={"k": top_k * 3}
        )
        reranking_retriever = ContextualCompressionRetriever(
            base_compressor=compressor, base_retriever=base_retriever
        )
        return reranking_retriever
```

混合检索结合了语义检索（向量）和关键词检索（BM25），能同时捕获语义相似性和精确匹配。重排序则用更精确的Cross-Encoder模型对初步检索结果进行精排，显著提升最终结果的质量。

## 第五步：与LLM集成生成回答

```python
# rag_engine.py
from langchain_openai import ChatOpenAI
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.vectorstores import Chroma
from typing import List
from config import OPENAI_API_KEY, OPENAI_MODEL, TOP_K_RESULTS


class RAGEngine:
    """RAG引擎：检索 + 生成"""

    SYSTEM_PROMPT = """你是一个专业的知识助手。请根据以下检索到的上下文信息回答用户问题。

规则：
1. 仅基于提供的上下文信息回答，不要编造信息
2. 如果上下文中没有足够信息，请明确说明
3. 回答时引用信息来源
4. 使用专业但易懂的语言

上下文信息：
{context}

用户问题：{input}
"""

    def __init__(self, vectorstore: Chroma, top_k: int = TOP_K_RESULTS):
        self.llm = ChatOpenAI(
            api_key=OPENAI_API_KEY,
            model=OPENAI_MODEL,
            temperature=0.1,  # 低温度保证回答稳定性
        )
        self.vectorstore = vectorstore
        self.top_k = top_k
        self.chain = self._build_chain()

    def _build_chain(self):
        """构建RAG链"""
        retriever = self.vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={
                "k": self.top_k,
                "fetch_k": self.top_k * 3,
                "lambda_mult": 0.7,  # MMR多样性参数
            },
        )

        prompt = ChatPromptTemplate.from_template(self.SYSTEM_PROMPT)
        question_answer_chain = create_stuff_documents_chain(
            self.llm, prompt
        )
        rag_chain = create_retrieval_chain(retriever, question_answer_chain)
        return rag_chain

    def query(self, question: str) -> dict:
        """执行RAG查询"""
        result = self.chain.invoke({"input": question})
        return {
            "answer": result["answer"],
            "source_documents": result["context"],
            "sources": [
                {
                    "content": doc.page_content[:200],
                    "source": doc.metadata.get("source_file", "unknown"),
                    "chunk_index": doc.metadata.get("chunk_index", -1),
                    "score": doc.metadata.get("score", None),
                }
                for doc in result["context"]
            ],
        }

    def chat(self, question: str) -> str:
        """简洁的聊天接口"""
        result = self.query(question)
        response = result["answer"]
        response += "\n\n---\n**参考来源：**\n"
        for i, src in enumerate(result["sources"], 1):
            response += f"{i}. {src['source']} (分块 #{src['chunk_index']})\n"
        return response
```

## 第六步：完整系统整合

将所有组件整合到一起：

```python
# main.py
from document_loader import DocumentProcessor
from vector_store import VectorStoreManager
from rag_engine import RAGEngine
import os


def build_knowledge_base(directory: str):
    """从目录构建知识库"""
    processor = DocumentProcessor(chunk_size=500, chunk_overlap=50)
    vs_manager = VectorStoreManager()

    all_chunks = []
    supported_extensions = [".pdf", ".md", ".txt"]

    for filename in os.listdir(directory):
        ext = os.path.splitext(filename)[1].lower()
        if ext in supported_extensions:
            file_path = os.path.join(directory, filename)
            chunks = processor.process(file_path)
            all_chunks.extend(chunks)

    if not all_chunks:
        print("未找到可处理的文档")
        return None

    vectorstore = vs_manager.create_vectorstore(all_chunks)
    return vectorstore


def main():
    import argparse

    parser = argparse.ArgumentParser(description="RAG系统")
    parser.add_argument("--build", type=str, help="构建知识库的目录路径")
    parser.add_argument("--query", type=str, help="查询问题")
    args = parser.parse_args()

    if args.build:
        vectorstore = build_knowledge_base(args.build)
        print("知识库构建完成！")
    elif args.query:
        vs_manager = VectorStoreManager()
        vectorstore = vs_manager.load_vectorstore()
        engine = RAGEngine(vectorstore)
        answer = engine.chat(args.query)
        print(answer)
    else:
        # 交互模式
        vs_manager = VectorStoreManager()
        vectorstore = vs_manager.load_vectorstore()
        engine = RAGEngine(vectorstore)

        print("RAG系统已就绪，输入问题开始查询（输入 'quit' 退出）")
        while True:
            question = input("\n问题: ").strip()
            if question.lower() == "quit":
                break
            if question:
                print(engine.chat(question))


if __name__ == "__main__":
    main()
```

## 性能优化最佳实践

### 1. 分块优化

分块大小是影响RAG效果最关键的参数之一。建议根据你的文档类型进行实验：

```python
# 针对不同文档类型的推荐配置
CHUNK_CONFIGS = {
    "技术文档": {"chunk_size": 800, "chunk_overlap": 100},
    "法律合同": {"chunk_size": 1200, "chunk_overlap": 200},
    "新闻文章": {"chunk_size": 500, "chunk_overlap": 50},
    "学术论文": {"chunk_size": 1000, "chunk_overlap": 150},
}
```

### 2. 查询预处理

对用户查询进行预处理可以显著提升检索质量：

```python
from langchain_core.prompts import ChatPromptTemplate

# 查询重写：将用户问题改写为更适合检索的形式
query_rewrite_prompt = ChatPromptTemplate.from_template(
    """请将以下用户问题改写为一个更适合在知识库中检索的查询语句。
要求：提取关键概念，去除无关信息，保持语义完整。

原始问题：{question}

改写后的查询："""
)

# HyDE（假设性文档嵌入）：先生成一个假设性回答，再用它进行检索
hyde_prompt = ChatPromptTemplate.from_template(
    """请针对以下问题写一段简短的假设性回答（约100字）。
即使你不确定答案，也请根据常识给出一个合理的回答。

问题：{question}

假设性回答："""
)
```

### 3. 缓存策略

对于频繁查询的内容，添加缓存可以大幅降低成本和延迟：

```python
from functools import lru_cache
import hashlib
import json


class RAGCache:
    """RAG查询缓存"""

    def __init__(self, max_size: int = 1000):
        self.cache = {}

    def _get_cache_key(self, query: str) -> str:
        return hashlib.md5(query.encode()).hexdigest()

    def get(self, query: str):
        key = self._get_cache_key(query)
        return self.cache.get(key)

    def set(self, query: str, result: dict, ttl: int = 3600):
        key = self._get_cache_key(query)
        self.cache[key] = {"result": result, "expires_at": time.time() + ttl}

    def get_or_query(self, query: str, query_func):
        cached = self.get(query)
        if cached and cached["expires_at"] > time.time():
            return cached["result"]
        result = query_func(query)
        self.set(query, result)
        return result
```

## 总结

本文从零开始构建了一个完整的RAG系统，涵盖了从文档处理到最终生成的全部流程。核心要点回顾：

1. **文档分块**是基础，选择合适的分块策略和参数至关重要
2. **向量数据库**（ChromaDB）提供了高效的相似度检索能力
3. **混合检索**（向量 + BM25）比单一检索方式效果更好
4. **重排序**能显著提升最终检索结果的质量
5. **查询预处理**（重写、HyDE）可以优化检索效果
6. **缓存策略**有助于降低成本和提升响应速度

RAG系统的优化是一个持续迭代的过程，建议在实际应用中不断监控检索质量和生成效果，针对性地调整各个组件的参数。随着RAG技术的快速发展，未来还可以探索多模态RAG、Agentic RAG等更高级的架构模式。
