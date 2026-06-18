---
layout: post
title: "用Python Click库构建专业CLI工具的实战教程"
date: 2026-06-04 09:00:00 +0800
tags: [时事新闻]
tags: python, cli, click, tutorial
categories: Python
image: /assets/images/python-click-cli.jpg
description: "从零开始使用Python Click库构建一个功能完善的文件管理CLI工具，包含文件整理、搜索、重复清理等功能。"
---

## 前言

命令行工具（CLI）是开发者的日常利器。无论是文件管理、数据处理还是自动化脚本，一个好用的CLI工具能极大提升工作效率。Python的Click库以其简洁的API和强大的功能，成为构建CLI工具的首选。本文将带你从零开始，用Click构建一个功能完善的文件管理CLI工具。

---

## 项目初始化

首先创建项目结构和依赖配置。

```
file-manager/
├── pyproject.toml
├── src/
│   └── filemanager/
│       ├── __init__.py
│       ├── cli.py
│       ├── organizer.py
│       ├── searcher.py
│       └── cleaner.py
└── tests/
```

```toml
# pyproject.toml
[project]
name = "filemanager"
version = "1.0.0"
description = "专业的文件管理CLI工具"
requires-python = ">=3.10"
dependencies = [
    "click>=8.1",
    "rich>=13.0",
    "send2trash>=1.8",
]

[project.scripts]
filemanager = "filemanager.cli:main"

[build-system]
requires = ["setuptools>=68.0"]
build-backend = "setuptools.backends._legacy:_Backend"
```

---

## 基础架构：CLI入口

```python
# src/filemanager/cli.py
import click
from pathlib import Path

@click.group()
@click.version_option(version="1.0.0", prog_name="filemanager")
def main():
    """FileManager - 专业的文件管理CLI工具"""
    pass


@main.command()
@click.argument("directory", type=click.Path(exists=True, file_okay=False))
@click.option("--dry-run", is_flag=True, help="预览模式，不实际执行操作")
@click.option("--verbose", "-v", is_flag=True, help="显示详细输出")
def organize(directory: str, dry_run: bool, verbose: bool):
    """整理指定目录中的文件"""
    from .organizer import FileOrganizer

    organizer = FileOrganizer(Path(directory), dry_run=dry_run, verbose=verbose)
    organizer.run()


@main.command()
@click.argument("directory", type=click.Path(exists=True, file_okay=False))
@click.option("--pattern", "-p", required=True, help="搜索模式（支持通配符）")
@click.option("--extension", "-e", multiple=True, help="按扩展名过滤")
@click.option("--min-size", type=int, help="最小文件大小（字节）")
@click.option("--max-size", type=int, help="最大文件大小（字节）")
@click.option("--modified-after", type=click.DateTime(), help="修改时间晚于指定日期")
def search(directory: str, pattern: str, extension: tuple, min_size: int, max_size: int, modified_after):
    """在目录中搜索文件"""
    from .searcher import FileSearcher

    searcher = FileSearcher(Path(directory))
    results = searcher.search(
        pattern=pattern,
        extensions=list(extension),
        min_size=min_size,
        max_size=max_size,
        modified_after=modified_after,
    )
    searcher.display_results(results)


@main.command()
@click.argument("directory", type=click.Path(exists=True, file_okay=False))
@click.option("--algorithm", "-a", type=click.Choice(["md5", "sha1", "sha256"]), default="sha256", help="哈希算法")
@click.option("--interactive", "-i", is_flag=True, help="交互式选择要删除的重复文件")
@click.option("--dry-run", is_flag=True, help="预览模式")
def clean(directory: str, algorithm: str, interactive: bool, dry_run: bool):
    """清理重复文件"""
    from .cleaner import DuplicateCleaner

    cleaner = DuplicateCleaner(
        Path(directory),
        algorithm=algorithm,
        interactive=interactive,
        dry_run=dry_run,
    )
    cleaner.run()


if __name__ == "__main__":
    main()
```

---

## 子命令一：文件整理

```python
# src/filemanager/organizer.py
import shutil
from pathlib import Path
from datetime import datetime
from collections import defaultdict
import click
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn

console = Console()

# 文件分类规则
CATEGORY_RULES = {
    "Images": {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"},
    "Documents": {".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".md", ".csv"},
    "Code": {".py", ".js", ".ts", ".java", ".cpp", ".c", ".go", ".rs", ".html", ".css", ".json", ".yaml", ".yml", ".toml"},
    "Videos": {".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm"},
    "Audio": {".mp3", ".wav", ".flac", ".aac", ".ogg", ".wma"},
    "Archives": {".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"},
    "Fonts": {".ttf", ".otf", ".woff", ".woff2"},
}


class FileOrganizer:
    def __init__(self, directory: Path, dry_run: bool = False, verbose: bool = False):
        self.directory = directory
        self.dry_run = dry_run
        self.verbose = verbose
        self.stats = defaultdict(int)

    def get_category(self, file_path: Path) -> str:
        """根据扩展名确定文件分类"""
        ext = file_path.suffix.lower()
        for category, extensions in CATEGORY_RULES.items():
            if ext in extensions:
                return category
        return "Others"

    def run(self):
        """执行文件整理"""
        console.print(f"\n[bold blue]开始整理目录: {self.directory}[/bold blue]\n")

        if self.dry_run:
            console.print("[yellow]预览模式 - 不会实际移动文件[/yellow]\n")

        files = [f for f in self.directory.rglob("*") if f.is_file()]

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("整理文件中...", total=len(files))

            for file_path in files:
                category = self.get_category(file_path)
                target_dir = self.directory / category
                target_path = target_dir / file_path.name

                # 处理文件名冲突
                counter = 1
                while target_path.exists():
                    stem = file_path.stem
                    target_path = target_dir / f"{stem}_{counter}{file_path.suffix}"
                    counter += 1

                if not self.dry_run:
                    target_dir.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(file_path), str(target_path))

                self.stats[category] += 1

                if self.verbose:
                    console.print(f"  [green]{file_path.name}[/green] -> {category}/")

                progress.advance(task)

        # 显示统计结果
        self._display_stats()

    def _display_stats(self):
        """显示整理统计"""
        table = Table(title="整理统计")
        table.add_column("分类", style="cyan")
        table.add_column("文件数", justify="right", style="green")
        table.add_column("占比", justify="right")

        total = sum(self.stats.values())
        for category, count in sorted(self.stats.items(), key=lambda x: -x[1]):
            percentage = f"{count / total * 100:.1f}%"
            table.add_row(category, str(count), percentage)

        table.add_row("[bold]总计[/bold]", f"[bold]{total}[/bold]", "100%")
        console.print(table)
```

---

## 子命令二：文件搜索

```python
# src/filemanager/searcher.py
import fnmatch
from pathlib import Path
from datetime import datetime
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()


class FileSearcher:
    def __init__(self, directory: Path):
        self.directory = directory

    def search(
        self,
        pattern: str = "*",
        extensions: list = None,
        min_size: int = None,
        max_size: int = None,
        modified_after: datetime = None,
    ) -> list:
        """搜索文件"""
        results = []
        extensions = [e.lower() if not e.startswith(".") else e.lower() for e in (extensions or [])]

        for file_path in self.directory.rglob("*"):
            if not file_path.is_file():
                continue

            # 文件名模式匹配
            if not fnmatch.fnmatch(file_path.name.lower(), pattern.lower()):
                continue

            # 扩展名过滤
            if extensions and file_path.suffix.lower() not in extensions:
                continue

            # 文件大小过滤
            stat = file_path.stat()
            if min_size and stat.st_size < min_size:
                continue
            if max_size and stat.st_size > max_size:
                continue

            # 修改时间过滤
            if modified_after:
                file_mtime = datetime.fromtimestamp(stat.st_mtime)
                if file_mtime < modified_after:
                    continue

            results.append({
                "path": file_path,
                "size": stat.st_size,
                "modified": datetime.fromtimestamp(stat.st_mtime),
            })

        return results

    def display_results(self, results: list):
        """格式化显示搜索结果"""
        if not results:
            console.print("[yellow]未找到匹配的文件[/yellow]")
            return

        console.print(Panel(
            f"找到 [bold green]{len(results)}[/bold green] 个匹配文件",
            style="blue",
        ))

        table = Table(show_lines=True)
        table.add_column("文件路径", style="cyan", max_width=60)
        table.add_column("大小", justify="right", style="green")
        table.add_column("修改时间", style="yellow")

        for item in results:
            size_str = self._format_size(item["size"])
            time_str = item["modified"].strftime("%Y-%m-%d %H:%M")
            table.add_row(str(item["path"]), size_str, time_str)

        console.print(table)

        # 显示总大小
        total_size = sum(item["size"] for item in results)
        console.print(f"\n总大小: [bold]{self._format_size(total_size)}[/bold]")

    @staticmethod
    def _format_size(size: int) -> str:
        """格式化文件大小"""
        for unit in ["B", "KB", "MB", "GB"]:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"
```

---

## 子命令三：重复文件清理

```python
# src/filemanager/cleaner.py
import hashlib
from pathlib import Path
from collections import defaultdict
from typing import Dict, List
import click
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, BarColumn, TextColumn

console = Console()


class DuplicateCleaner:
    def __init__(self, directory: Path, algorithm: str = "sha256", interactive: bool = False, dry_run: bool = False):
        self.directory = directory
        self.algorithm = algorithm
        self.interactive = interactive
        self.dry_run = dry_run
        self.hash_groups: Dict[str, List[Path]] = defaultdict(list)
        self.freed_space = 0

    def _compute_hash(self, file_path: Path) -> str:
        """计算文件哈希值"""
        hash_func = hashlib.new(self.algorithm)
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                hash_func.update(chunk)
        return hash_func.hexdigest()

    def _find_duplicates(self) -> Dict[str, List[Path]]:
        """查找重复文件"""
        files = [f for f in self.directory.rglob("*") if f.is_file()]

        # 先按大小分组，减少哈希计算量
        size_groups = defaultdict(list)
        for file_path in files:
            size_groups[file_path.stat().st_size].append(file_path)

        # 只对大小相同的文件计算哈希
        with Progress(
            BarColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
        ) as progress:
            task = progress.add_task("扫描重复文件...", total=sum(len(v) for v in size_groups.values() if len(v) > 1))

            for size, group in size_groups.items():
                if len(group) < 2:
                    continue
                for file_path in group:
                    file_hash = self._compute_hash(file_path)
                    self.hash_groups[file_hash].append(file_path)
                    progress.advance(task)

        # 只保留有重复的组
        return {h: files for h, files in self.hash_groups.items() if len(files) > 1}

    def run(self):
        """执行重复文件清理"""
        console.print(f"\n[bold blue]扫描目录: {self.directory}[/bold blue]\n")

        if self.dry_run:
            console.print("[yellow]预览模式 - 不会实际删除文件[/yellow]\n")

        duplicates = self._find_duplicates()

        if not duplicates:
            console.print("[green]未发现重复文件[/green]")
            return

        # 显示重复文件
        table = Table(title="发现的重复文件组")
        table.add_column("哈希值", style="dim", max_width=16)
        table.add_column("文件路径", style="cyan", max_width=50)
        table.add_column("大小", justify="right", style="green")

        total_duplicates = 0
        for file_hash, files in duplicates.items():
            for i, file_path in enumerate(files):
                style = "bold red" if i > 0 else "bold green"
                table.add_row(
                    file_hash[:16] if i == 0 else "",
                    str(file_path),
                    self._format_size(file_path.stat().st_size),
                    style=style,
                )
            total_duplicates += len(files) - 1

        console.print(table)

        if self.interactive and not self.dry_run:
            self._interactive_clean(duplicates)
        elif not self.dry_run:
            self._auto_clean(duplicates)

        console.print(f"\n[bold green]释放空间: {self._format_size(self.freed_space)}[/bold green]")

    def _auto_clean(self, duplicates: dict):
        """自动清理：每组保留第一个文件"""
        from send2trash import send2trash

        for file_hash, files in duplicates.items():
            # 保留第一个，删除其余
            for file_path in files[1:]:
                self.freed_space += file_path.stat().st_size
                send2trash(str(file_path))
                console.print(f"  [red]已删除:[/red] {file_path.name}")

    def _interactive_clean(self, duplicates: dict):
        """交互式清理"""
        from send2trash import send2trash

        for file_hash, files in duplicates.items():
            console.print(f"\n[bold]重复组 (哈希: {file_hash[:16]}...)[/bold]")
            for i, file_path in enumerate(files):
                console.print(f"  [{i}] {file_path} ({self._format_size(file_path.stat().st_size)})")

            keep = click.prompt("保留哪个文件？(输入编号)", type=int, default=0)
            for i, file_path in enumerate(files):
                if i != keep:
                    self.freed_space += file_path.stat().st_size
                    send2trash(str(file_path))
                    console.print(f"  [red]已删除:[/red] {file_path.name}")

    @staticmethod
    def _format_size(size: int) -> str:
        for unit in ["B", "KB", "MB", "GB"]:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"
```

---

## 使用示例

```bash
# 整理下载目录
filemanager organize ~/Downloads --dry-run

# 搜索Python文件
filemanager search ~/Projects -p "*.py" -e .py --modified-after "2026-01-01"

# 清理重复文件
filemanager clean ~/Photos --algorithm sha256 --interactive --dry-run

# 查看帮助
filemanager --help
filemanager organize --help
```

---

## 打包发布

```bash
# 安装构建工具
pip install build

# 构建分发包
python -m build

# 发布到PyPI
twine upload dist/*
```

---

## 总结

本文构建了一个功能完善的文件管理CLI工具，涵盖了Click库的核心用法：

- **命令组**：`@click.group()` 组织多个子命令
- **参数和选项**：`@click.argument` 和 `@click.option` 定义输入
- **类型验证**：内置类型检查和自定义验证
- **彩色输出**：Rich库提供美观的终端输出
- **进度条**：长时间操作的可视化反馈
- **交互式输入**：`click.prompt` 实现用户交互

Click库的简洁API让你专注于业务逻辑，而不是命令行解析的细节。结合Rich库的终端美化能力，可以轻松构建出专业级别的CLI工具。
