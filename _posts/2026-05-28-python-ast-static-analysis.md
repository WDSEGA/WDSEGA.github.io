---
layout: post
title: "Understanding Python AST for Static Code Analysis"
date: 2026-05-28
categories: [Python, Code Analysis, Advanced]
tags: [代码产品]
image: /assets/images/python-ast-analysis.jpg
---

The Abstract Syntax Tree (AST) is one of Python's most powerful yet underappreciated features. Every Python program you write is first parsed into an AST before being compiled to bytecode. Understanding how ASTs work opens the door to building linters, code transformers, static analyzers, and other metaprogramming tools.

In this article, we'll dive deep into Python's `ast` module and learn how to leverage it for practical static code analysis.

## What Is an AST?

An Abstract Syntax Tree is a tree representation of the syntactic structure of source code. Each node in the tree represents a construct in the code — function definitions, variable assignments, loops, expressions, and so on.

Consider this simple function:

```python
def greet(name):
    return f"Hello, {name}"
```

When Python parses this, it creates an AST that looks roughly like:

```
Module
 └── FunctionDef (name='greet')
      ├── arguments
      │    └── arg (arg='name')
      └── Return
           └── JoinedStr
                ├── Constant ('Hello, ')
                └── FormattedValue
                     └── Name (id='name')
```

## Exploring the AST Module

### Basic Parsing

```python
import ast

code = """
def greet(name):
    return f"Hello, {name}"
"""

tree = ast.parse(code)
print(ast.dump(tree, indent=2))
```

The `ast.dump()` function gives you a complete string representation of the tree. The `indent` parameter (Python 3.9+) makes it readable.

### Walking the Tree

There are two main ways to traverse an AST:

**1. `ast.walk()` — Simple iteration over all nodes**

```python
for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
        print(f"Found function: {node.name}")
    elif isinstance(node, ast.Name):
        print(f"Found variable: {node.id}")
```

**2. `ast.NodeVisitor` — Object-oriented traversal**

```python
class CodeAnalyzer(ast.NodeVisitor):
    def __init__(self):
        self.functions = []
        self.classes = []
        self.imports = []

    def visit_FunctionDef(self, node):
        self.functions.append({
            'name': node.name,
            'lineno': node.lineno,
            'args': [arg.arg for arg in node.args.args],
        })
        self.generic_visit(node)  # Continue to child nodes

    def visit_ClassDef(self, node):
        self.classes.append({
            'name': node.name,
            'lineno': node.lineno,
            'methods': [
                n.name for n in node.body
                if isinstance(n, ast.FunctionDef)
            ]
        })
        self.generic_visit(node)

    def visit_Import(self, node):
        for alias in node.names:
            self.imports.append(alias.name)
        self.generic_visit(node)

    def visit_ImportFrom(self, node):
        module = node.module or ''
        for alias in node.names:
            self.imports.append(f"{module}.{alias.name}")
        self.generic_visit(node)

analyzer = CodeAnalyzer()
analyzer.visit(tree)
print(f"Functions: {analyzer.functions}")
print(f"Classes: {analyzer.classes}")
print(f"Imports: {analyzer.imports}")
```

## Practical Example 1: Detect Code Smells

Let's build a static analyzer that detects common Python code smells.

```python
class CodeSmellDetector(ast.NodeVisitor):
    def __init__(self):
        self.issues = []

    def _add_issue(self, lineno, message, severity="warning"):
        self.issues.append({
            'line': lineno,
            'message': message,
            'severity': severity
        })

    def visit_FunctionDef(self, node):
        # Check for functions that are too long
        if len(node.body) > 20:
            self._add_issue(
                node.lineno,
                f"Function '{node.name}' is too long "
                f"({len(node.body)} statements, max 20)",
                "warning"
            )

        # Check for too many parameters
        arg_count = len(node.args.args) + len(node.args.kwonlyargs)
        if node.args.vararg:
            arg_count += 1
        if node.args.kwarg:
            arg_count += 1
        if arg_count > 5:
            self._add_issue(
                node.lineno,
                f"Function '{node.name}' has {arg_count} parameters "
                f"(max 5 recommended)",
                "warning"
            )

        self.generic_visit(node)

    def visit_ExceptHandler(self, node):
        # Bare except clauses
        if node.type is None:
            self._add_issue(
                node.lineno,
                "Bare 'except:' clause catches all exceptions, "
                "including KeyboardInterrupt and SystemExit",
                "error"
            )
        self.generic_visit(node)

    def visit_Compare(self, node):
        # Detect mutable default arguments
        pass  # Handled in visit_FunctionDef

    def visit_Call(self, node):
        # Detect mutable default arguments in function definitions
        pass

    def visit_ListComp(self, node):
        # Check for overly complex list comprehensions
        nested_depth = self._get_comprehension_depth(node)
        if nested_depth > 2:
            self._add_issue(
                node.lineno,
                f"Nested comprehension depth {nested_depth} "
                f"(max 2 recommended)",
                "warning"
            )
        self.generic_visit(node)

    def _get_comprehension_depth(self, node, depth=1):
        max_depth = depth
        for generator in node.generators:
            if isinstance(generator.iter, (ast.ListComp, ast.SetComp,
                                           ast.DictComp, ast.GeneratorExp)):
                max_depth = max(
                    max_depth,
                    self._get_comprehension_depth(generator.iter, depth + 1)
                )
        return max_depth


def analyze_code(source: str) -> list:
    tree = ast.parse(source)
    detector = CodeSmellDetector()
    detector.visit(tree)
    return detector.issues
```

## Practical Example 2: Finding Mutable Default Arguments

This is one of the most common Python gotchas:

```python
class MutableDefaultDetector(ast.NodeVisitor):
    """Detect mutable default arguments in function definitions."""

    MUTABLE_TYPES = (ast.List, ast.Dict, ast.Set, ast.Call)

    def __init__(self):
        self.violations = []

    def visit_FunctionDef(self, node):
        for default in node.args.defaults + node.args.kw_defaults:
            if default and isinstance(default, self.MUTABLE_TYPES):
                self.violations.append({
                    'function': node.name,
                    'line': node.lineno,
                    'type': type(default).__name__
                })
        self.generic_visit(node)


# Test it
code = """
def add_item(item, items=[]):
    items.append(item)
    return items

def create_cache(cache={}):
    return cache
"""

tree = ast.parse(code)
detector = MutableDefaultDetector()
detector.visit(tree)
for v in detector.violations:
    print(f"Line {v['line']}: '{v['function']}' has mutable "
          f"default argument (type: {v['type']})")
```

## Practical Example 3: Code Complexity Metrics

```python
class ComplexityAnalyzer(ast.NodeVisitor):
    def __init__(self):
        self.function_complexity = {}

    def _calculate_complexity(self, node):
        """Calculate cyclomatic complexity of a function."""
        complexity = 1  # Base complexity

        for child in ast.walk(node):
            # Each decision point adds 1 to complexity
            if isinstance(child, (ast.If, ast.While, ast.For,
                                  ast.ExceptHandler)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                # and/or add complexity for each additional operand
                complexity += len(child.values) - 1
            elif isinstance(child, ast.comprehension):
                complexity += 1
                if child.ifs:
                    complexity += len(child.ifs)

        return complexity

    def visit_FunctionDef(self, node):
        complexity = self._calculate_complexity(node)
        self.function_complexity[node.name] = {
            'complexity': complexity,
            'line': node.lineno,
            'end_line': node.end_lineno or node.lineno,
        }

        if complexity > 10:
            print(f"WARNING: '{node.name}' has high complexity "
                  f"({complexity}). Consider refactoring.")

        self.generic_visit(node)
```

## Practical Example 4: AST-Based Code Transformation

The `ast` module isn't just for analysis — you can also modify and generate code:

```python
class PrintToLoggerTransformer(ast.NodeTransformer):
    """Replace print() calls with logger calls."""

    def visit_Call(self, node):
        if (isinstance(node.func, ast.Name) and
                node.func.id == 'print'):
            # Transform: print("message") → logger.info("message")
            new_call = ast.Call(
                func=ast.Attribute(
                    value=ast.Name(id='logger', ctx=ast.Load()),
                    attr='info',
                    ctx=ast.Load()
                ),
                args=node.args,
                keywords=node.keywords
            )
            return ast.copy_location(new_call, node)
        return self.generic_visit(node)

    def visit_Module(self, node):
        self.generic_visit(node)
        # Add logger import at the top
        import_node = ast.ImportFrom(
            module='logging',
            names=[ast.alias(name='getLogger', asname=None)],
            level=0
        )
        logger_assign = ast.Assign(
            targets=[ast.Name(id='logger', ctx=ast.Store())],
            value=ast.Call(
                func=ast.Name(id='getLogger', ctx=ast.Load()),
                args=[ast.Constant(value=__name__)],
                keywords=[]
            )
        )
        node.body.insert(0, ast.copy_location(
            logger_assign, node
        ))
        node.body.insert(0, ast.copy_location(
            import_node, node
        ))
        return node


# Usage
source = """
def process_data(data):
    print(f"Processing {len(data)} items")
    result = [x * 2 for x in data]
    print("Done!")
    return result
"""

tree = ast.parse(source)
transformer = PrintToLoggerTransformer()
new_tree = transformer.visit(tree)
ast.fix_missing_locations(new_tree)

# Convert back to source code
import astunparse
new_source = astunparse.unparse(new_tree)
print(new_source)
```

## Integrating with Your Workflow

```python
# analyze_project.py
import os
import ast
from pathlib import Path

def analyze_project(project_path: str):
    """Analyze all Python files in a project."""
    results = {}

    for py_file in Path(project_path).rglob('*.py'):
        try:
            with open(py_file) as f:
                source = f.read()

            tree = ast.parse(source)

            # Run all analyzers
            smell_detector = CodeSmellDetector()
            mutable_detector = MutableDefaultDetector()
            complexity_analyzer = ComplexityAnalyzer()

            smell_detector.visit(tree)
            mutable_detector.visit(tree)
            complexity_analyzer.visit(tree)

            if (smell_detector.issues or mutable_detector.violations or
                    complexity_analyzer.function_complexity):
                results[str(py_file)] = {
                    'smells': smell_detector.issues,
                    'mutable_defaults': mutable_detector.violations,
                    'complexity': complexity_analyzer.function_complexity,
                }

        except SyntaxError as e:
            results[str(py_file)] = {'error': str(e)}

    return results
```

## Key Takeaways

1. **AST is your friend for code analysis**: Every Python developer should understand the basics of AST manipulation
2. **Use `NodeVisitor` for analysis**: It's cleaner than manual `ast.walk()` loops
3. **Use `NodeTransformer` for modifications**: When you need to change code, not just analyze it
4. **Combine with other tools**: AST analysis pairs well with type checking (mypy) and linting (ruff)
5. **Handle edge cases**: Always wrap `ast.parse()` in try/except for SyntaxError

Understanding AST opens up a world of possibilities for building developer tools, enforcing coding standards, and automating code quality improvements in your projects.
