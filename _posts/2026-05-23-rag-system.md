---
layout: post
title: "从零构建RAG系统：基于LangChain的本地知识库问答"
date: 2026-05-23 12:00:00 +0800
categories: [技术, AI应用]
tags: [代码产品]
image: /assets/images/covers/rag-system-cover.jpg
---

RAG（Retrieval-Augmented Generation，检索增强生成）是当前最实用的AI应用技术之一。它让大语言模型能够基于你的私有数据回答问题，解决了模型知识截止和幻觉问题。这篇文章带你从零构建一个完整的本地RAG系统。

## 什么是RAG？

简单来说，RAG就是"先搜索，再回答"。

传统的大模型问答完全依赖训练时的知识，有三个明显缺陷：
1. **知识截止**：模型不知道训练日期之后的事
2. **无法访问私有数据**：你的公司内部文档、个人笔记，模型一概不知
3. **幻觉问题**：遇到不确定的问题，模型可能编造答案

RAG的工作流程：
1. **索引阶段**：将文档切分成小块，用Embedding模型转成向量，存入向量数据库
2. **查询阶段**：用户提问时，先用同样的问题去向量数据库检索相关文档片段
3. **生成阶段**：将检索到的片段作为上下文，让大模型基于这些证据回答问题

这样，模型既保留了强大的理解和生成能力，又能基于最新、最相关的信息作答。

## 系统架构

我们要构建的系统包含以下组件：
- **文档加载器**：支持PDF、Word、TXT、Markdown等多种格式
- **文本分割器**：将长文档切分成适合检索的片段
- **Embedding模型**：将文本转为向量（使用开源模型，无需API）
- **向量数据库**：存储和检索向量（使用ChromaDB，纯本地）
- **大模型接口**：支持OpenAI API或本地Ollama模型
- **Web界面**：用Gradio搭建简单的问答界面

## 完整代码实现

```python
"""
本地RAG知识库系统
支持多格式文档、本地Embedding、向量检索、大模型问答
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Optional, Callable
from dataclasses import dataclass
import hashlib
import json

# 向量数据库
import chromadb
from chromadb.config import Settings

# Embedding模型
from sentence_transformers import SentenceTransformer

# 文档处理
import PyPDF2
import docx
from markdown import markdown
from bs4 import BeautifulSoup

# LLM接口
import openai
import requests

# Web界面
import gradio as gr


@dataclass
class DocumentChunk:
    """文档片段"""
    content: str
    source: str
    chunk_id: str
    metadata: Dict


class DocumentLoader:
    """多格式文档加载器"""
    
    @staticmethod
    def load_pdf(file_path: str) -> str:
        """加载PDF文件"""
        text = ""
        with open(file_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text
    
    @staticmethod
    def load_docx(file_path: str) -> str:
        """加载Word文档"""
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    
    @staticmethod
    def load_txt(file_path: str) -> str:
        """加载文本文件"""
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    
    @staticmethod
    def load_md(file_path: str) -> str:
        """加载Markdown文件，转为纯文本"""
        with open(file_path, 'r', encoding='utf-8') as f:
            md_content = f.read()
        html = markdown(md_content)
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text()
    
    def load(self, file_path: str) -> str:
        """根据扩展名自动选择加载器"""
        ext = Path(file_path).suffix.lower()
        loaders = {
            '.pdf': self.load_pdf,
            '.docx': self.load_docx,
            '.txt': self.load_txt,
            '.md': self.load_md,
        }
        loader = loaders.get(ext)
        if loader:
            return loader(file_path)
        raise ValueError(f"不支持的文件格式: {ext}")


class TextSplitter:
    """递归字符文本分割器"""
    
    def __init__(
        self,
        chunk_size: int = 500,
        chunk_overlap: int = 50,
        separators: Optional[List[str]] = None
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", "。", "，", " ", ""]
    
    def split_text(self, text: str) -> List[str]:
        """递归分割文本"""
        return self._recursive_split(text, 0)
    
    def _recursive_split(self, text: str, separator_idx: int) -> List[str]:
        """递归分割实现"""
        if separator_idx >= len(self.separators):
            # 最后一个分隔符，直接按长度切
            return [text[i:i+self.chunk_size] 
                    for i in range(0, len(text), self.chunk_size - self.chunk_overlap)]
        
        separator = self.separators[separator_idx]
        
        if separator == "":
            # 字符级分割
            chunks = []
            start = 0
            while start < len(text):
                end = min(start + self.chunk_size, len(text))
                chunks.append(text[start:end])
                start = end - self.chunk_overlap if end < len(text) else end
            return chunks
        
        # 按当前分隔符分割
        parts = text.split(separator)
        chunks = []
        current_chunk = ""
        
        for part in parts:
            if not part.strip():
                continue
                
            test_chunk = current_chunk + separator + part if current_chunk else part
            
            if len(test_chunk) <= self.chunk_size:
                current_chunk = test_chunk
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                    # 保留重叠部分
                    overlap_text = current_chunk[-self.chunk_overlap:] if len(current_chunk) > self.chunk_overlap else current_chunk
                    current_chunk = overlap_text + separator + part if overlap_text else part
                else:
                    # 单个部分就超过限制，递归用下一个分隔符
                    sub_chunks = self._recursive_split(part, separator_idx + 1)
                    chunks.extend(sub_chunks)
                    current_chunk = ""
        
        if current_chunk:
            chunks.append(current_chunk)
        
        return chunks


class LocalEmbedding:
    """本地Embedding模型封装"""
    
    def __init__(self, model_name: str = "BAAI/bge-large-zh-v1.5"):
        """
        默认使用BGE中文模型，支持多语言
        其他可选模型：
        - "sentence-transformers/all-MiniLM-L6-v2" (英文，轻量)
        - "BAAI/bge-m3" (多语言，更强)
        """
        print(f"正在加载Embedding模型: {model_name}...")
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        print(f"模型加载完成，向量维度: {self.dimension}")
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """批量编码文档"""
        embeddings = self.model.encode(texts, convert_to_numpy=True, show_progress_bar=True)
        return embeddings.tolist()
    
    def embed_query(self, text: str) -> List[float]:
        """编码查询"""
        # BGE模型推荐在查询前加前缀
        query_text = f"为这个句子生成表示：{text}"
        embedding = self.model.encode(query_text, convert_to_numpy=True)
        return embedding.tolist()


class VectorStore:
    """基于ChromaDB的向量存储"""
    
    def __init__(
        self,
        collection_name: str = "knowledge_base",
        persist_dir: str = "./chroma_db",
        embedding_model: Optional[LocalEmbedding] = None
    ):
        self.embedding = embedding_model or LocalEmbedding()
        
        # 初始化ChromaDB客户端
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=persist_dir,
            anonymized_telemetry=False
        ))
        
        # 获取或创建集合
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        
        print(f"向量存储初始化完成，当前文档数: {self.collection.count()}")
    
    def add_documents(self, chunks: List[DocumentChunk]):
        """添加文档到向量库"""
        if not chunks:
            return
        
        texts = [chunk.content for chunk in chunks]
        embeddings = self.embedding.embed_documents(texts)
        
        ids = [chunk.chunk_id for chunk in chunks]
        metadatas = [
            {
                "source": chunk.source,
                **chunk.metadata
            }
            for chunk in chunks
        ]
        
        self.collection.add(
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
            ids=ids
        )
        
        print(f"成功添加 {len(chunks)} 个文档片段")
    
    def similarity_search(
        self,
        query: str,
        top_k: int = 5,
        filter_dict: Optional[Dict] = None
    ) -> List[Dict]:
        """相似度搜索"""
        query_embedding = self.embedding.embed_query(query)
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=filter_dict
        )
        
        documents = []
        for i in range(len(results['ids'][0])):
            documents.append({
                'content': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i],
                'id': results['ids'][0][i]
            })
        
        return documents
    
    def delete_by_source(self, source: str):
        """删除指定来源的文档"""
        self.collection.delete(where={"source": source})
        print(f"已删除来源为 {source} 的文档")


class LLMInterface:
    """大模型接口，支持多种后端"""
    
    def __init__(
        self,
        backend: str = "ollama",  # "ollama" 或 "openai"
        model: str = "qwen2.5:7b",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None
    ):
        self.backend = backend
        self.model = model
        
        if backend == "openai":
            self.client = openai.OpenAI(
                api_key=api_key or os.getenv("OPENAI_API_KEY"),
                base_url=base_url
            )
        elif backend == "ollama":
            self.base_url = base_url or "http://localhost:11434"
        else:
            raise ValueError(f"不支持的后端: {backend}")
    
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """生成回答"""
        if self.backend == "openai":
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens
            )
            return response.choices[0].message.content
        
        elif self.backend == "ollama":
            url = f"{self.base_url}/api/generate"
            payload = {
                "model": self.model,
                "prompt": prompt,
                "system": system_prompt or "",
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                }
            }
            response = requests.post(url, json=payload)
            return response.json()["response"]


class RAGSystem:
    """完整的RAG系统"""
    
    def __init__(
        self,
        embedding_model: str = "BAAI/bge-large-zh-v1.5",
        llm_backend: str = "ollama",
        llm_model: str = "qwen2.5:7b",
        chunk_size: int = 500,
        chunk_overlap: int = 50,
        top_k: int = 5
    ):
        self.doc_loader = DocumentLoader()
        self.text_splitter = TextSplitter(chunk_size, chunk_overlap)
        self.embedding = LocalEmbedding(embedding_model)
        self.vector_store = VectorStore(embedding_model=self.embedding)
        self.llm = LLMInterface(llm_backend, llm_model)
        self.top_k = top_k
        
        # 系统提示词
        self.system_prompt = """你是一个专业的知识库问答助手。你的任务是基于提供的参考文档回答用户问题。

重要规则：
1. 只使用提供的参考文档中的信息回答问题
2. 如果参考文档中没有相关信息，明确告知用户"根据现有资料无法回答"
3. 不要编造信息，不要依赖预训练知识
4. 回答时引用参考文档的来源
5. 保持回答简洁准确"""
    
    def process_file(self, file_path: str) -> List[DocumentChunk]:
        """处理单个文件"""
        print(f"正在处理: {file_path}")
        
        # 加载文档
        text = self.doc_loader.load(file_path)
        
        # 分割文本
        chunks = self.text_splitter.split_text(text)
        print(f"  分割为 {len(chunks)} 个片段")
        
        # 创建DocumentChunk对象
        doc_chunks = []
        for i, chunk in enumerate(chunks):
            chunk_id = hashlib.md5(f"{file_path}_{i}".encode()).hexdigest()
            doc_chunks.append(DocumentChunk(
                content=chunk,
                source=file_path,
                chunk_id=chunk_id,
                metadata={
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                    "file_name": Path(file_path).name
                }
            ))
        
        return doc_chunks
    
    def add_documents(self, file_paths: List[str]):
        """批量添加文档"""
        all_chunks = []
        for file_path in file_paths:
            try:
                chunks = self.process_file(file_path)
                all_chunks.extend(chunks)
            except Exception as e:
                print(f"处理文件失败 {file_path}: {e}")
        
        if all_chunks:
            self.vector_store.add_documents(all_chunks)
    
    def add_directory(self, dir_path: str, extensions: Optional[List[str]] = None):
        """添加整个目录的文档"""
        extensions = extensions or [".pdf", ".docx", ".txt", ".md"]
        file_paths = []
        
        for ext in extensions:
            file_paths.extend(Path(dir_path).glob(f"**/*{ext}"))
        
        self.add_documents([str(p) for p in file_paths])
    
    def query(self, question: str) -> Dict:
        """查询知识库"""
        # 检索相关文档
        retrieved_docs = self.vector_store.similarity_search(question, top_k=self.top_k)
        
        if not retrieved_docs:
            return {
                "answer": "知识库中没有找到相关资料。",
                "sources": [],
                "context": ""
            }
        
        # 构建上下文
        context_parts = []
        sources = []
        for i, doc in enumerate(retrieved_docs):
            context_parts.append(f"[文档{i+1}]\n{doc['content']}\n来源: {doc['metadata']['source']}")
            sources.append(doc['metadata']['source'])
        
        context = "\n\n".join(context_parts)
        
        # 构建提示词
        prompt = f"""参考文档：
{context}

用户问题：{question}

请基于上述参考文档回答问题。如果文档中没有相关信息，请明确说明。"""
        
        # 生成回答
        answer = self.llm.generate(prompt, system_prompt=self.system_prompt)
        
        return {
            "answer": answer,
            "sources": list(set(sources)),
            "context": context
        }


# Gradio界面
def create_ui(rag_system: RAGSystem):
    """创建Web界面"""
    
    def respond(message, history):
        result = rag_system.query(message)
        response = result["answer"]
        if result["sources"]:
            response += f"\n\n---\n参考来源: {', '.join(result['sources'])}"
        return response
    
    def upload_files(files):
        if files:
            file_paths = [f.name for f in files]
            rag_system.add_documents(file_paths)
            return f"成功上传并处理 {len(file_paths)} 个文件"
        return "未选择文件"
    
    with gr.Blocks(title="本地RAG知识库") as demo:
        gr.Markdown("# 本地RAG知识库问答系统")
        gr.Markdown("上传文档后，即可基于文档内容提问")
        
        with gr.Row():
            with gr.Column(scale=1):
                file_output = gr.File(
                    file_count="multiple",
                    label="上传文档 (PDF/DOCX/TXT/MD)"
                )
                upload_btn = gr.Button("添加到知识库")
                upload_status = gr.Textbox(label="上传状态", interactive=False)
                upload_btn.click(upload_files, file_output, upload_status)
            
            with gr.Column(scale=2):
                chatbot = gr.ChatInterface(
                    respond,
                    title="知识库问答",
                    description="基于上传的文档回答问题"
                )
    
    return demo


# 使用示例
if __name__ == "__main__":
    # 初始化RAG系统
    rag = RAGSystem(
        embedding_model="BAAI/bge-large-zh-v1.5",  # 中文Embedding模型
        llm_backend="ollama",  # 使用本地Ollama
        llm_model="qwen2.5:7b",  # 通义千问7B模型
        chunk_size=500,
        chunk_overlap=50,
        top_k=5
    )
    
    # 示例：添加文档
    # rag.add_documents(["./docs/手册.pdf", "./docs/说明.txt"])
    # rag.add_directory("./知识库文档/")
    
    # 启动Web界面
    demo = create_ui(rag)
    demo.launch(server_name="0.0.0.0", server_port=7860)
```

## 安装依赖

```bash
pip install chromadb sentence-transformers PyPDF2 python-docx markdown beautifulsoup4 openai requests gradio

# 如果使用Ollama，需要先安装并下载模型
# ollama pull qwen2.5:7b
```

## 使用说明

**1. 准备文档**
将你的知识文档放在指定目录，支持PDF、Word、TXT、Markdown格式。

**2. 启动系统**
```python
python rag_system.py
```

**3. 通过Web界面上传文档**
打开 http://localhost:7860，拖拽或选择文件上传。

**4. 开始问答**
上传完成后，直接在对话框中提问。系统会基于文档内容生成回答。

## 进阶优化方向

**1. 混合检索**
结合关键词检索（BM25）和向量检索，提升召回率。

**2. 重排序（Rerank）**
使用Cross-Encoder模型对检索结果进行精排。

**3. 查询重写**
对用户问题进行扩展和改写，提高检索质量。

**4. 多轮对话**
维护对话历史，支持基于上下文的连续问答。

**5. 文档更新**
实现增量更新机制，避免全量重建索引。

这套RAG系统完全本地化运行，无需担心数据隐私问题，适合企业内部知识库、个人笔记管理等场景。
