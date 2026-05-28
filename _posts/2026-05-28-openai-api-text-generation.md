---
layout: post
title: "How to Use OpenAI API for Text Generation"
date: 2026-05-28
categories: [Python, AI, OpenAI]
tags: [python, openai, api, text generation, llm, gpt]
image: /assets/images/openai-api-text-generation.jpg
---

OpenAI's API has become the standard interface for working with large language models in production applications. Whether you're building chatbots, content generators, code assistants, or data processing pipelines, understanding how to effectively use the API is essential.

This guide covers everything from basic setup to advanced patterns for text generation with the OpenAI API.

## Getting Started

### Installation and Authentication

```bash
pip install openai
```

```python
from openai import OpenAI

# Initialize the client
client = OpenAI()  # Uses OPENAI_API_KEY env variable

# Or pass the key directly
client = OpenAI(api_key="your-api-key")
```

### Your First Generation

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Explain quantum computing in simple terms."}
    ],
    max_tokens=500,
    temperature=0.7
)

print(response.choices[0].message.content)
```

## Understanding the API Parameters

### Temperature

Controls randomness in the output. Lower values (0-0.3) produce more focused, deterministic responses. Higher values (0.7-1.0) produce more creative, varied outputs.

```python
# Deterministic output for factual tasks
factual = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "What is 2+2?"}],
    temperature=0.0
)

# Creative output for writing tasks
creative = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a poem about the ocean."}],
    temperature=0.9
)
```

### Max Tokens and Token Management

```python
import tiktoken

def count_tokens(text: str, model: str = "gpt-4o") -> int:
    """Count the number of tokens in a text string."""
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

# Estimate cost before making a request
prompt = "Summarize this article..."
token_count = count_tokens(prompt)
cost_per_1k_input = 0.005  # GPT-4o pricing
estimated_cost = (token_count / 1000) * cost_per_1k_input
print(f"Estimated cost: ${estimated_cost:.4f}")
```

### Response Format (Structured Output)

```python
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Extract information from the text."},
        {"role": "user", "content": "Apple was founded by Steve Jobs in 1976."}
    ],
    response_format={
        "type": "json_schema",
        "json_schema": {
            "name": "entity_extraction",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "company": {"type": "string"},
                    "founder": {"type": "string"},
                    "year": {"type": "integer"}
                },
                "required": ["company", "founder", "year"]
            }
        }
    }
)

import json
data = json.loads(response.choices[0].message.content)
# {'company': 'Apple', 'founder': 'Steve Jobs', 'year': 1976}
```

## Advanced Patterns

### System Prompts Engineering

The system prompt is your most powerful tool for controlling output quality:

```python
SYSTEM_PROMPT = """You are an expert technical writer. Follow these rules:

1. Use clear, concise language
2. Include code examples for all technical concepts
3. Structure responses with headers and bullet points
4. When explaining errors, always show the fix
5. Add "Pro Tip" sections for advanced insights
6. Never use filler phrases like "In conclusion" or "It's important to note"
"""

def generate_technical_explanation(topic: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Explain {topic}"}
        ],
        temperature=0.3
    )
    return response.choices[0].message.content
```

### Multi-Turn Conversations

```python
class ConversationManager:
    def __init__(self, system_prompt: str, model: str = "gpt-4o"):
        self.client = OpenAI()
        self.model = model
        self.messages = [
            {"role": "system", "content": system_prompt}
        ]
        self.max_history = 20  # Keep last 20 messages

    def add_message(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})
        # Trim history to manage token usage
        if len(self.messages) > self.max_history + 1:
            self.messages = [self.messages[0]] + self.messages[-(self.max_history):]

    def get_response(self, user_input: str) -> str:
        self.add_message("user", user_input)

        response = self.client.chat.completions.create(
            model=self.model,
            messages=self.messages,
            temperature=0.7
        )

        assistant_message = response.choices[0].message.content
        self.add_message("assistant", assistant_message)

        return assistant_message

    def get_token_count(self) -> int:
        total = 0
        for msg in self.messages:
            total += count_tokens(msg["content"])
        return total
```

### Streaming Responses

```python
def stream_response(prompt: str):
    """Stream responses for real-time display."""
    stream = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        stream=True
    )

    full_response = ""
    for chunk in stream:
        if chunk.choices[0].delta.content:
            content = chunk.choices[0].delta.content
            full_response += content
            print(content, end='', flush=True)

    print()  # New line after streaming
    return full_response
```

### Function Calling

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "City name, e.g. 'San Francisco'"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"]
                    }
                },
                "required": ["location"]
            }
        }
    }
]

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "What's the weather in Tokyo?"}],
    tools=tools,
    tool_choice="auto"
)

# Check if the model wants to call a function
if response.choices[0].message.tool_calls:
    tool_call = response.choices[0].message.tool_calls[0]
    function_name = tool_call.function.name
    arguments = json.loads(tool_call.function.arguments)
    # Execute your function here
    print(f"Call {function_name} with args: {arguments}")
```

## Error Handling and Retry Logic

```python
from openai import APITimeoutError, RateLimitError, APIConnectionError
import time

def robust_completion(messages, max_retries=3, **kwargs):
    """Call the API with robust error handling."""
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model=kwargs.get('model', 'gpt-4o'),
                messages=messages,
                **kwargs
            )
            return response

        except RateLimitError:
            wait_time = (2 ** attempt) + random.uniform(0, 1)
            print(f"Rate limited. Waiting {wait_time:.1f}s...")
            time.sleep(wait_time)

        except APITimeoutError:
            print(f"Timeout on attempt {attempt + 1}")
            if attempt == max_retries - 1:
                raise

        except APIConnectionError:
            print(f"Connection error on attempt {attempt + 1}")
            time.sleep(2 ** attempt)

        except Exception as e:
            print(f"Unexpected error: {e}")
            raise

    raise RuntimeError("Max retries exceeded")
```

## Cost Optimization

```python
class CostTracker:
    def __init__(self):
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_cost = 0.0

    def track(self, response, model="gpt-4o"):
        usage = response.usage
        self.total_input_tokens += usage.prompt_tokens
        self.total_output_tokens += usage.completion_tokens

        # GPT-4o pricing (as of 2026)
        pricing = {
            "gpt-4o": (2.5, 10.0),       # per 1M tokens
            "gpt-4o-mini": (0.15, 0.60),
            "gpt-4-turbo": (10.0, 30.0),
        }

        input_price, output_price = pricing.get(model, (2.5, 10.0))
        cost = (usage.prompt_tokens * input_price / 1_000_000 +
                usage.completion_tokens * output_price / 1_000_000)
        self.total_cost += cost

    def report(self):
        print(f"Total input tokens: {self.total_input_tokens:,}")
        print(f"Total output tokens: {self.total_output_tokens:,}")
        print(f"Total cost: ${self.total_cost:.4f}")
```

## Key Takeaways

1. **Choose the right model**: Use GPT-4o-mini for simple tasks to save costs, GPT-4o for complex reasoning
2. **Engineer your system prompts**: They have an outsized impact on output quality
3. **Use structured output**: JSON mode ensures reliable, parseable responses
4. **Implement streaming**: For user-facing applications, streaming provides a better experience
5. **Track your costs**: Token usage can grow quickly — monitor and optimize
6. **Handle errors gracefully**: Rate limits and timeouts are normal — plan for them
7. **Use function calling**: It's the most reliable way to integrate LLMs with external tools

The OpenAI API is a powerful tool, and mastering these patterns will help you build more reliable, cost-effective, and capable AI-powered applications.
