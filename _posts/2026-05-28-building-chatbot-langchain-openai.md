---
layout: post
title: "Building a Chatbot with LangChain and OpenAI"
date: 2026-05-28
categories: [Python, AI, Chatbot]
tags: [代码产品]
image: /assets/images/langchain-openai-chatbot.jpg
---

Building a chatbot that can maintain context, access external knowledge, and provide accurate responses is one of the most practical applications of large language models. LangChain provides the framework to orchestrate these capabilities, while OpenAI's models power the intelligence.

In this guide, we'll build a production-ready chatbot step by step, covering conversation memory, retrieval-augmented generation (RAG), tool integration, and deployment considerations.

## Prerequisites

```bash
pip install langchain langchain-openai langchain-community chromadb tiktoken
```

## Step 1: Basic Chatbot with Memory

A chatbot without memory is just a stateless Q&A system. Let's start by building one that remembers the conversation:

```python
import os
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

# Initialize the LLM
llm = ChatOpenAI(model="gpt-4o", temperature=0.7)

# Create a prompt template with conversation history
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful, knowledgeable assistant.
Answer questions accurately and concisely. If you're unsure,
say so rather than guessing. Use a friendly but professional tone."""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
])

# Conversation memory
class ConversationMemory:
    def __init__(self, max_messages: int = 20):
        self.messages = []
        self.max_messages = max_messages

    def add_message(self, message):
        self.messages.append(message)
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]

    def get_messages(self):
        return self.messages.copy()

    def clear(self):
        self.messages = []

# Build the chain
from langchain_core.output_parsers import StrOutputParser

memory = ConversationMemory()
chain = prompt | llm | StrOutputParser()

def chat(user_input: str) -> str:
    memory.add_message(HumanMessage(content=user_input))

    response = chain.invoke({
        "chat_history": memory.get_messages(),
        "input": user_input
    })

    memory.add_message(AIMessage(content=response))
    return response
```

## Step 2: Adding RAG (Retrieval-Augmented Generation)

RAG allows your chatbot to access external knowledge bases, making it much more useful for domain-specific questions.

### Document Loading and Processing

```python
from langchain_community.document_loaders import (
    TextLoader,
    PyPDFLoader,
    DirectoryLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# Load documents
def load_documents(directory: str):
    loader = DirectoryLoader(
        directory,
        glob="**/*.md",
        loader_cls=TextLoader,
        loader_kwargs={'encoding': 'utf-8'}
    )
    return loader.load()

# Split into chunks
def split_documents(documents, chunk_size=1000, chunk_overlap=200):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )
    return splitter.split_documents(documents)

# Create vector store
def create_vector_store(chunks, persist_dir: str = "./chroma_db"):
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_dir
    )
    return vectorstore

# Usage
documents = load_documents("./knowledge_base")
chunks = split_documents(documents)
vectorstore = create_vector_store(chunks)
```

### RAG Chain

```python
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

# Create retriever
retriever = vectorstore.as_retriever(
    search_type="mmr",  # Maximal Marginal Relevance for diverse results
    search_kwargs={"k": 5, "fetch_k": 10}
)

# RAG prompt
rag_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a knowledgeable assistant. Use the following
context to answer the user's question. If the context doesn't contain
relevant information, say so and answer from your general knowledge.

Context:
{context}"""),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
])

# Create the RAG chain
from langchain.chains import create_history_aware_retriever

contextualize_prompt = ChatPromptTemplate.from_messages([
    ("system", "Given the chat history, formulate a search query."),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
])

history_aware_retriever = create_history_aware_retriever(
    llm, retriever, contextualize_prompt
)

question_answer_chain = create_stuff_documents_chain(llm, rag_prompt)
rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

def rag_chat(user_input: str) -> str:
    memory.add_message(HumanMessage(content=user_input))

    response = rag_chain.invoke({
        "chat_history": memory.get_messages(),
        "input": user_input
    })

    memory.add_message(AIMessage(content=response['answer']))
    return response['answer']
```

## Step 3: Adding Tools

Give your chatbot the ability to perform actions:

```python
from langchain.tools import tool
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

@tool
def search_knowledge_base(query: str) -> str:
    """Search the knowledge base for relevant information."""
    docs = retriever.invoke(query)
    return "\n\n".join(doc.page_content for doc in docs[:3])

@tool
def calculate(expression: str) -> str:
    """Evaluate a mathematical expression safely."""
    try:
        # Only allow safe mathematical operations
        allowed = set('0123456789+-*/.() ')
        if not all(c in allowed for c in expression):
            return "Error: Invalid characters in expression"
        result = eval(expression)
        return f"Result: {result}"
    except Exception as e:
        return f"Error: {e}"

@tool
def get_current_date() -> str:
    """Get the current date and time."""
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

tools = [search_knowledge_base, calculate, get_current_date]

# Bind tools to the LLM
llm_with_tools = llm.bind_tools(tools)

def chat_with_tools(user_input: str) -> str:
    messages = memory.get_messages() + [HumanMessage(content=user_input)]

    response = llm_with_tools.invoke(messages)

    # Handle tool calls
    while response.tool_calls:
        for tool_call in response.tool_calls:
            tool_name = tool_call['name']
            tool_args = tool_call['args']

            # Find and execute the tool
            selected_tool = next(
                t for t in tools if t.name == tool_name
            )
            result = selected_tool.invoke(tool_args)

            # Add tool result to messages
            messages.append(response)
            messages.append({
                "role": "tool",
                "content": str(result),
                "tool_call_id": tool_call['id']
            })

        # Get next response
        response = llm_with_tools.invoke(messages)

    memory.add_message(HumanMessage(content=user_input))
    memory.add_message(AIMessage(content=response.content))
    return response.content
```

## Step 4: Building a Web Interface

```python
from flask import Flask, request, jsonify, Response
import json

app = Flask(__name__)

@app.route('/chat', methods=['POST'])
def handle_chat():
    data = request.json
    user_input = data.get('message', '')

    if not user_input.strip():
        return jsonify({'error': 'Message cannot be empty'}), 400

    try:
        response = rag_chat(user_input)
        return jsonify({'response': response})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/chat/stream', methods=['POST'])
def handle_stream_chat():
    """Streaming response endpoint."""
    data = request.json
    user_input = data.get('message', '')

    def generate():
        # For streaming, use the LLM directly with stream mode
        messages = memory.get_messages() + [
            HumanMessage(content=user_input)
        ]
        for chunk in llm.stream(messages):
            if chunk.content:
                yield f"data: {json.dumps({'chunk': chunk.content})}\n\n"
        yield "data: [DONE]\n\n"

    return Response(generate(), mimetype='text/event-stream')

@app.route('/clear', methods=['POST'])
def clear_conversation():
    memory.clear()
    return jsonify({'status': 'cleared'})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

## Step 5: Evaluation and Testing

```python
from langchain.evaluation import load_evaluator, EvaluatorType

# Answer relevance evaluator
evaluator = load_evaluator(
    EvaluatorType.QA,
    llm=ChatOpenAI(model="gpt-4o-mini", temperature=0)
)

# Test cases
test_cases = [
    {
        "question": "What is our refund policy?",
        "expected_keywords": ["30 days", "full refund", "condition"]
    },
    {
        "question": "How do I reset my password?",
        "expected_keywords": ["settings", "email", "link"]
    },
]

def evaluate_chatbot():
    results = []
    for case in test_cases:
        response = rag_chat(case["question"])
        eval_result = evaluator.evaluate_strings(
            prediction=response,
            input=case["question"],
            reference=" ".join(case["expected_keywords"])
        )
        results.append({
            'question': case["question"],
            'response': response[:100],
            'score': eval_result['score'],
            'reasoning': eval_result['reasoning']
        })

    avg_score = sum(r['score'] for r in results) / len(results)
    print(f"Average relevance score: {avg_score:.2f}/1.0")
    return results
```

## Best Practices

1. **Use conversation summarization** for long sessions to manage token usage
2. **Implement guardrails** to prevent the chatbot from discussing off-topic subjects
3. **Log all interactions** for quality improvement and debugging
4. **Use A/B testing** to compare different prompts and configurations
5. **Set up monitoring** to track response quality and latency over time
6. **Implement rate limiting** to prevent abuse in production

This chatbot architecture provides a solid foundation that you can extend with more sophisticated features like multi-modal input, user authentication, and analytics dashboards.
