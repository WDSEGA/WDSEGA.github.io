---
layout: post
title: "Building a Multi-Agent AI System with Python"
date: 2026-05-28
categories: [Python, AI, Architecture]
tags: [代码产品]
image: /assets/images/multi-agent-ai-python.jpg
---

The era of single-prompt AI interactions is behind us. As large language models become more capable, the real challenge has shifted from "can AI do this?" to "how do we coordinate multiple AI agents to solve complex problems together?"

In this guide, we'll explore the architecture patterns, implementation strategies, and practical considerations for building multi-agent AI systems with Python.

## Why Multi-Agent Systems?

A single LLM, no matter how powerful, has limitations. It can only process one task at a time, lacks persistent memory across sessions, and struggles with tasks that require different expertise or tools.

Multi-agent systems solve these problems by:

- **Specialization**: Each agent focuses on a specific domain (research, coding, analysis, communication)
- **Parallelism**: Multiple agents can work on different subtasks simultaneously
- **Resilience**: If one agent fails, others can continue or retry
- **Scalability**: Add new capabilities by adding new agents without changing existing ones

Think of it like a software team. You wouldn't expect one developer to handle frontend, backend, DevOps, and QA simultaneously. The same principle applies to AI agents.

## Core Architecture Patterns

### Pattern 1: Orchestrator-Worker

The most common pattern. A central orchestrator agent receives the user's request, breaks it down into subtasks, and delegates to specialized workers.

```python
from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

class AgentRole(Enum):
    ORCHESTRATOR = "orchestrator"
    RESEARCHER = "researcher"
    CODER = "coder"
    REVIEWER = "reviewer"
    SUMMARIZER = "summarizer"

@dataclass
class AgentMessage:
    sender: AgentRole
    content: str
    metadata: dict = None
    parent_id: Optional[str] = None

class BaseAgent:
    def __init__(self, role: AgentRole, llm_client):
        self.role = role
        self.llm = llm_client
        self.memory: List[AgentMessage] = []

    def process(self, message: AgentMessage) -> AgentMessage:
        """Process incoming message and return response."""
        raise NotImplementedError

    def remember(self, message: AgentMessage):
        self.memory.append(message)
```

### Pattern 2: Pipeline

Agents are arranged in a sequential pipeline where the output of one feeds into the next. This works well for workflows with clear stages.

```python
class AgentPipeline:
    def __init__(self, agents: List[BaseAgent]):
        self.agents = agents

    def execute(self, initial_input: str) -> str:
        result = initial_input
        for agent in self.agents:
            message = AgentMessage(
                sender=AgentRole.ORCHESTRATOR,
                content=result
            )
            response = agent.process(message)
            result = response.content
        return result
```

### Pattern 3: Blackboard

A shared knowledge base where agents can read and write information asynchronously. This pattern is ideal for research-heavy tasks.

```python
class Blackboard:
    def __init__(self):
        self.knowledge = {}
        self.subscribers = defaultdict(list)

    def write(self, key: str, value: str, agent: BaseAgent):
        self.knowledge[key] = {
            "value": value,
            "author": agent.role.value,
            "timestamp": datetime.now().isoformat()
        }
        self._notify(key, value, agent)

    def read(self, key: str) -> Optional[str]:
        entry = self.knowledge.get(key)
        return entry["value"] if entry else None
```

## Building a Real Multi-Agent System

Let's build a practical example: a content research and writing system.

### Step 1: Define Agent Roles

```python
class ResearchAgent(BaseAgent):
    """Gathers information from various sources."""
    def process(self, message: AgentMessage) -> AgentMessage:
        self.remember(message)
        prompt = f"""Research the following topic thoroughly:
        {message.content}

        Provide:
        1. Key facts and statistics
        2. Recent developments (last 6 months)
        3. Expert opinions and quotes
        4. Contrasting viewpoints
        """
        response = self.llm.generate(prompt)
        return AgentMessage(
            sender=self.role,
            content=response,
            parent_id=message.content
        )

class WritingAgent(BaseAgent):
    """Creates content based on research."""
    def process(self, message: AgentMessage) -> AgentMessage:
        self.remember(message)
        prompt = f"""Based on this research, write an engaging article:
        {message.content}

        Requirements:
        - Professional but accessible tone
        - Include specific examples
        - Structure with clear headings
        - Minimum 800 words
        """
        response = self.llm.generate(prompt)
        return AgentMessage(
            sender=self.role,
            content=response,
            parent_id=message.content
        )

class ReviewAgent(BaseAgent):
    """Reviews and provides feedback on content."""
    def process(self, message: AgentMessage) -> AgentMessage:
        self.remember(message)
        prompt = f"""Review this article critically:
        {message.content}

        Check for:
        1. Factual accuracy
        2. Logical flow
        3. Clarity and readability
        4. Missing perspectives

        Provide specific improvement suggestions.
        """
        response = self.llm.generate(prompt)
        return AgentMessage(
            sender=self.role,
            content=response,
            parent_id=message.content
        )
```

### Step 2: Implement the Orchestrator

```python
class OrchestratorAgent(BaseAgent):
    def __init__(self, llm_client, workers: List[BaseAgent]):
        super().__init__(AgentRole.ORCHESTRATOR, llm_client)
        self.workers = {w.role: w for w in workers}
        self.max_iterations = 5

    def execute(self, task: str) -> str:
        plan = self._create_plan(task)

        for step in plan:
            agent = self.workers.get(step["role"])
            if not agent:
                continue

            result = agent.process(AgentMessage(
                sender=AgentRole.ORCHESTRATOR,
                content=step["input"]
            ))

            # Feed results to next agent
            if step.get("next_role"):
                next_agent = self.workers[step["next_role"]]
                final = next_agent.process(result)

        return final.content

    def _create_plan(self, task: str) -> list:
        prompt = f"""Break down this task into agent steps:
        {task}

        Available agents: {list(self.workers.keys())}
        Return a JSON plan with role, input, and next_role fields.
        """
        return json.loads(self.llm.generate(prompt))
```

### Step 3: Add Error Handling and Retry Logic

```python
class ResilientOrchestrator(OrchestratorAgent):
    def execute(self, task: str) -> str:
        plan = self._create_plan(task)
        results = {}

        for attempt in range(self.max_iterations):
            try:
                for step in plan:
                    agent = self.workers.get(step["role"])
                    if not agent:
                        continue

                    try:
                        result = agent.process(AgentMessage(
                            sender=AgentRole.ORCHESTRATOR,
                            content=step["input"]
                        ))
                        results[step["role"].value] = result.content
                    except Exception as e:
                        print(f"Agent {step['role']} failed: {e}")
                        continue

                # Validate results
                if self._validate_results(results, task):
                    return self._synthesize(results)

            except Exception as e:
                print(f"Attempt {attempt + 1} failed: {e}")
                continue

        raise RuntimeError("Max iterations reached")
```

## Communication Patterns Between Agents

### Direct Messaging

Agents communicate directly with each other through the orchestrator. This is simple but can create bottlenecks.

### Event-Driven

Agents emit events that other agents can subscribe to. This is more scalable and decoupled.

```python
class EventBus:
    def __init__(self):
        self.handlers = defaultdict(list)

    def subscribe(self, event_type: str, handler):
        self.handlers[event_type].append(handler)

    def emit(self, event_type: str, data: dict):
        for handler in self.handlers[event_type]:
            handler(data)

# Usage
bus = EventBus()
bus.subscribe("research_complete", writing_agent.on_research_done)
bus.subscribe("draft_ready", review_agent.on_draft_ready)
```

### Shared Memory with Context Window Management

One of the biggest challenges in multi-agent systems is managing context. Each agent has a limited context window, and passing full conversation histories between agents quickly becomes impractical.

```python
class ContextManager:
    def __init__(self, max_tokens: int = 8000):
        self.max_tokens = max_tokens
        self.summaries = {}

    def compress(self, messages: List[AgentMessage]) -> str:
        """Compress message history into a summary."""
        total_tokens = sum(
            len(m.content.split()) for m in messages
        )

        if total_tokens <= self.max_tokens:
            return "\n".join(m.content for m in messages)

        # Summarize older messages, keep recent ones
        recent = messages[-5:]
        older = messages[:-5]
        summary = self._summarize(older)

        return f"[Summary of earlier context]\n{summary}\n\n[Recent messages]\n" + \
               "\n".join(m.content for m in recent)
```

## State Management and Persistence

For production systems, you need persistent state management:

```python
import sqlite3
import json

class AgentStateStore:
    def __init__(self, db_path: str = "agent_state.db"):
        self.conn = sqlite3.connect(db_path)
        self._init_db()

    def _init_db(self):
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS agent_states (
                task_id TEXT PRIMARY KEY,
                agent_role TEXT,
                state JSON,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

    def save_state(self, task_id: str, role: str, state: dict):
        self.conn.execute(
            "INSERT OR REPLACE INTO agent_states VALUES (?, ?, ?, ?)",
            (task_id, role, json.dumps(state), datetime.now())
        )
        self.conn.commit()

    def load_state(self, task_id: str, role: str) -> Optional[dict]:
        cursor = self.conn.execute(
            "SELECT state FROM agent_states WHERE task_id=? AND agent_role=?",
            (task_id, role)
        )
        row = cursor.fetchone()
        return json.loads(row[0]) if row else None
```

## Related Tools and Reference Implementations

Building a multi-agent system from scratch is a great learning exercise, but for production use, you might want to look at existing frameworks and tools:

- **LangGraph** provides a graph-based approach to agent orchestration with built-in state management
- **CrewAI** offers a role-based framework for multi-agent collaboration
- **AutoGen** from Microsoft Research enables multi-agent conversations with code execution

For those looking for a more integrated solution, **FeishuAgent Orchestrator** is an open-source reference implementation that demonstrates how to coordinate multiple AI agents in a real-world workflow. It includes pre-built agents for common tasks like document processing, data analysis, and notification management, making it a useful starting point for teams wanting to deploy multi-agent systems quickly.

## Best Practices

1. **Start simple**: Begin with 2-3 agents and add complexity gradually
2. **Define clear interfaces**: Each agent should have well-defined inputs and outputs
3. **Implement observability**: Log all inter-agent communications for debugging
4. **Set timeouts**: Prevent agents from running indefinitely
5. **Use structured outputs**: Agents should return structured data (JSON) rather than free text when possible
6. **Test in isolation**: Test each agent independently before integrating
7. **Monitor token usage**: Multi-agent systems can consume tokens quickly

## Conclusion

Multi-agent AI systems represent the next evolution in how we build intelligent applications. By carefully designing agent roles, communication patterns, and orchestration logic, you can create systems that tackle complex tasks far beyond what a single LLM can achieve.

The key is to start with a clear understanding of your problem domain, choose the right architectural pattern, and iterate based on real-world performance. As the ecosystem matures, expect more tools and frameworks to make multi-agent development even more accessible.
