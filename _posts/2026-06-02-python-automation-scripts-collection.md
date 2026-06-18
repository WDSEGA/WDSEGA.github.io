---
layout: post
title: "10个实用Python自动化脚本：从文件整理到数据备份"
date: 2026-06-02 08:00:00 +0800
categories: [Python, 自动化]
tags: [代码产品]
image: /assets/images/python-automation-scripts.jpg
author: 大D
---

每天重复做同样的事情——整理下载文件夹、备份重要文件、批量重命名图片、清理桌面……这些琐碎的任务单个看起来不值一提，但加在一起，每周可能浪费你好几个小时。

我之前也是这样。后来开始用Python把这些重复操作自动化，效果立竿见影。今天分享10个我实际在用的自动化脚本，每个都是解决真实痛点的，不是那种"看起来很酷但从来不会用"的demo。

## 1. 智能文件整理器

下载文件夹永远是重灾区。这个脚本按文件类型自动归类：

```python
import shutil
import os
from pathlib import Path

FILE_CATEGORIES = {
    "文档": [".pdf", ".docx", ".doc", ".txt", ".xlsx", ".csv", ".pptx"],
    "图片": [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"],
    "视频": [".mp4", ".mov", ".avi", ".mkv", ".webm"],
    "音频": [".mp3", ".wav", ".flac", ".aac", ".ogg"],
    "压缩包": [".zip", ".rar", ".7z", ".tar", ".gz"],
    "代码": [".py", ".js", ".ts", ".html", ".css", ".json", ".yaml"],
    "安装包": [".dmg", ".exe", ".msi", ".deb", ".rpm", ".pkg"],
}

def organize_downloads(folder_path):
    """按文件类型整理文件夹"""
    folder = Path(folder_path)
    organized_count = 0

    for file in folder.iterdir():
        if not file.is_file():
            continue

        # 找到文件所属分类
        target_category = None
        for category, extensions in FILE_CATEGORIES.items():
            if file.suffix.lower() in extensions:
                target_category = category
                break

        if not target_category:
            target_category = "其他"

        # 创建分类目录并移动文件
        target_dir = folder / target_category
        target_dir.mkdir(exist_ok=True)
        target_path = target_dir / file.name

        # 避免文件名冲突
        if target_path.exists():
            stem = file.stem
            counter = 1
            while target_path.exists():
                target_path = target_dir / f"{stem}_{counter}{file.suffix}"
                counter += 1

        shutil.move(str(file), str(target_path))
        organized_count += 1

    print(f"整理完成！共移动 {organized_count} 个文件")

# 使用
organize_downloads(os.path.expanduser("~/Downloads"))
```

## 2. 自动备份脚本

重要数据定期备份，这个脚本支持增量备份（只备份变化的文件）：

```python
import shutil
import hashlib
import json
from pathlib import Path
from datetime import datetime

BACKUP_MANIFEST = ".backup_manifest.json"

def get_file_hash(filepath):
    """计算文件MD5哈希"""
    hasher = hashlib.md5()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            hasher.update(chunk)
    return hasher.hexdigest()

def backup_folder(source, backup_root):
    """增量备份文件夹"""
    source_path = Path(source)
    backup_root_path = Path(backup_root)
    manifest_path = backup_root_path / BACKUP_MANIFEST

    # 读取上次的备份记录
    manifest = {}
    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text())

    # 创建带时间戳的备份目录
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = backup_root_path / timestamp
    backup_path.mkdir(parents=True, exist_ok=True)

    new_manifest = {}
    backed_up = 0
    skipped = 0

    for file in source_path.rglob("*"):
        if not file.is_file():
            continue

        rel_path = str(file.relative_to(source_path))
        file_hash = get_file_hash(file)

        # 检查文件是否变化
        if rel_path in manifest and manifest[rel_path] == file_hash:
            skipped += 1
            new_manifest[rel_path] = file_hash
            continue

        # 复制变化的文件
        target = backup_path / rel_path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(file, target)
        new_manifest[rel_path] = file_hash
        backed_up += 1

    # 更新备份记录
    manifest_path.write_text(json.dumps(new_manifest, indent=2))

    print(f"备份完成！新增/更新 {backed_up} 个文件，跳过 {skipped} 个未变化文件")
    print(f"备份位置: {backup_path}")

# 使用
backup_folder(
    source=os.path.expanduser("~/Documents/重要项目"),
    backup_root=os.path.expanduser("~/Backup")
)
```

## 3. 批量图片重命名

从相机或手机导出的图片名字都是IMG_0001这种，这个脚本按拍摄日期重命名：

```python
from pathlib import Path
from datetime import datetime
from PIL import Image
import os

def rename_photos_by_date(folder_path):
    """按拍摄日期重命名照片"""
    folder = Path(folder_path)
    renamed = 0

    for file in sorted(folder.iterdir()):
        if not file.is_file():
            continue
        if file.suffix.lower() not in [".jpg", ".jpeg", ".png", ".heic"]:
            continue

        try:
            img = Image.open(file)
            exif_data = img._getexif()
            if exif_data and 36867 in exif_data:
                # 36867 是EXIF中的拍摄日期字段
                date_str = exif_data[36867]
                date = datetime.strptime(date_str, "%Y:%m:%d %H:%M:%S")
            else:
                # 没有EXIF信息，使用文件修改时间
                date = datetime.fromtimestamp(file.stat().st_mtime)

            new_name = date.strftime("%Y%m%d_%H%M%S") + file.suffix
            new_path = file.parent / new_name

            # 避免重名
            counter = 1
            while new_path.exists():
                new_name = date.strftime("%Y%m%d_%H%M%S") + f"_{counter}" + file.suffix
                new_path = file.parent / new_name
                counter += 1

            file.rename(new_path)
            renamed += 1

        except Exception as e:
            print(f"处理失败: {file.name} - {e}")

    print(f"重命名完成！共处理 {renamed} 张照片")

# 使用
rename_photos_by_date(os.path.expanduser("~/Pictures/待整理"))
```

## 4. 桌面清理助手

超过30天未使用的桌面文件自动归档：

```python
import shutil
import os
import time
from pathlib import Path

def clean_desktop(desktop_path, archive_path, days_threshold=30):
    """清理桌面：将超过指定天数的文件移到归档目录"""
    desktop = Path(desktop_path)
    archive = Path(archive_path)
    archive.mkdir(parents=True, exist_ok=True)

    now = time.time()
    threshold_seconds = days_threshold * 86400
    moved = 0

    for file in desktop.iterdir():
        if not file.is_file():
            continue

        last_access = file.stat().st_atime
        if (now - last_access) > threshold_seconds:
            # 按原始日期归档
            file_date = time.strftime(
                "%Y-%m", time.localtime(file.stat().st_mtime)
            )
            target_dir = archive / file_date
            target_dir.mkdir(exist_ok=True)

            target = target_dir / file.name
            if target.exists():
                target = target_dir / f"{file.stem}_{int(now)}{file.suffix}"

            shutil.move(str(file), str(target))
            moved += 1
            print(f"归档: {file.name} -> {target_dir.name}/")

    print(f"\n清理完成！归档 {moved} 个文件")

# 使用
clean_desktop(
    desktop_path=os.path.expanduser("~/Desktop"),
    archive_path=os.path.expanduser("~/DesktopArchive"),
    days_threshold=30
)
```

## 5. 网页截图批量工具

批量截取网页的长截图，适合做竞品分析或存档：

```python
import asyncio
from playwright.async_api import async_playwright
from pathlib import Path

async def batch_screenshot(urls_file, output_dir):
    """批量截取网页截图"""
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)

    urls = Path(urls_file).read_text().strip().split("\n")

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1440, "height": 900})

        for url in urls:
            url = url.strip()
            if not url:
                continue

            try:
                await page.goto(url, wait_until="networkidle")
                # 等待页面完全加载
                await page.wait_for_timeout(2000)

                filename = url.replace("https://", "").replace("http://", "").replace("/", "_")[:50]
                filepath = output / f"{filename}.png"

                await page.screenshot(path=str(filepath), full_page=True)
                print(f"截图完成: {filename}")

            except Exception as e:
                print(f"截图失败: {url} - {e}")

        await browser.close()

    print(f"\n全部完成！截图保存在: {output_dir}")

# 使用
asyncio.run(batch_screenshot("urls.txt", "./screenshots"))
```

## 6. CSV数据清洗工具

自动清洗CSV文件中的常见问题：空值、重复行、格式不统一：

```python
import pandas as pd
from pathlib import Path

def clean_csv(input_path, output_path=None):
    """清洗CSV文件"""
    input_file = Path(input_path)
    if output_path is None:
        output_path = input_file.parent / f"cleaned_{input_file.name}"

    df = pd.read_csv(input_file)

    original_rows = len(df)
    print(f"原始数据: {original_rows} 行, {len(df.columns)} 列")

    # 删除完全重复的行
    df = df.drop_duplicates()
    print(f"去重后: {len(df)} 行 (删除 {original_rows - len(df)} 行)")

    # 清理列名（去除空格和特殊字符）
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")

    # 填充或删除空值
    for col in df.columns:
        null_count = df[col].isnull().sum()
        if null_count > 0:
            if df[col].dtype in ["int64", "float64"]:
                df[col] = df[col].fillna(df[col].median())
            else:
                df[col] = df[col].fillna("未知")
            print(f"  列 '{col}': 填充 {null_count} 个空值")

    # 去除字符串列的前后空格
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].str.strip()

    # 保存清洗后的数据
    df.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"\n清洗完成！保存到: {output_path}")

# 使用
clean_csv("raw_data.csv")
```

## 7. 定时提醒脚本

在长时间工作时定时提醒休息：

```python
import time
import subprocess
import platform

REMINDERS = [
    "站起来活动一下！",
    "喝杯水吧，你已经很久没喝水了",
    "看看远处，放松一下眼睛",
    "深呼吸三次，缓解肩颈紧张",
]

def send_notification(title, message):
    """发送系统通知"""
    system = platform.system()
    try:
        if system == "Darwin":  # macOS
            subprocess.run([
                "osascript", "-e",
                f'display notification "{message}" with title "{title}"'
            ])
        elif system == "Linux":
            subprocess.run([
                "notify-send", title, message
            ])
        elif system == "Windows":
            subprocess.run([
                "powershell", "-Command",
                f'[System.Reflection.Assembly]::LoadWithPartialName("System.Windows.Forms"); '
                f'[System.Windows.Forms.MessageBox]::Show("{message}", "{title}")'
            ])
    except Exception as e:
        print(f"[通知] {title}: {message}")

def pomodoro_timer(work_minutes=25, break_minutes=5):
    """番茄钟定时器"""
    cycle = 1
    while True:
        print(f"\n--- 第 {cycle} 个工作周期 ({work_minutes}分钟) ---")
        time.sleep(work_minutes * 60)

        reminder = REMINDERS[(cycle - 1) % len(REMINDERS)]
        send_notification("休息时间到！", reminder)

        print(f"--- 休息时间 ({break_minutes}分钟) ---")
        time.sleep(break_minutes * 60)

        send_notification("休息结束", "开始下一个工作周期吧！")
        cycle += 1

# 使用
pomodoro_timer(work_minutes=25, break_minutes=5)
```

## 8. Markdown文件批量转换

把Markdown文件批量转换为HTML或PDF：

```python
import markdown
from pathlib import Path
from jinja2 import Template

HTML_TEMPLATE = Template("""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ title }}</title>
    <style>
        body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.8; }
        code { background: #f4f4f4; padding: 0.2rem 0.4rem; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto; }
        blockquote { border-left: 4px solid #ddd; margin: 0; padding-left: 1rem; color: #666; }
    </style>
</head>
<body>
{{ content|safe }}
</body>
</html>
""")

def convert_markdown_folder(input_dir, output_dir):
    """批量转换Markdown文件为HTML"""
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    converted = 0
    for md_file in input_path.glob("**/*.md"):
        html_content = markdown.markdown(
            md_file.read_text(encoding="utf-8"),
            extensions=["fenced_code", "tables", "toc"]
        )

        html = HTML_TEMPLATE.render(
            title=md_file.stem,
            content=html_content
        )

        rel_path = md_file.relative_to(input_path)
        output_file = output_path / rel_path.with_suffix(".html")
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_text(html, encoding="utf-8")

        converted += 1
        print(f"转换: {md_file.name} -> {output_file.name}")

    print(f"\n转换完成！共 {converted} 个文件")

# 使用
convert_markdown_folder("./markdown_notes", "./html_output")
```

## 9. 系统资源监控

持续监控CPU和内存使用情况，超过阈值时告警：

```python
import psutil
import time
from datetime import datetime

def monitor_system(cpu_threshold=80, mem_threshold=85, interval=60):
    """监控系统资源使用"""
    print(f"开始监控 (CPU阈值: {cpu_threshold}%, 内存阈值: {mem_threshold}%)")
    print("按 Ctrl+C 停止\n")

    while True:
        cpu = psutil.cpu_percent(interval=1)
        mem = psutil.virtual_memory().percent
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        status = "正常"
        if cpu > cpu_threshold:
            status = f"CPU告警 ({cpu:.1f}%)"
        elif mem > mem_threshold:
            status = f"内存告警 ({mem:.1f}%)"

        print(f"[{timestamp}] CPU: {cpu:5.1f}% | 内存: {mem:5.1f}% | {status}")

        if "告警" in status:
            # 记录告警日志
            with open("system_alerts.log", "a") as f:
                f.write(f"{timestamp} - {status}\n")

        time.sleep(interval - 1)

# 使用
monitor_system()
```

## 10. 自动化工作流调度器

把上面的脚本组合起来，定时自动执行：

```python
import schedule
import time
import subprocess
import os
from datetime import datetime

def job_backup():
    """每天凌晨2点执行备份"""
    print(f"[{datetime.now()}] 开始自动备份...")
    # 调用备份脚本
    subprocess.run(["python", "backup_script.py"])

def job_clean_desktop():
    """每周一早上9点清理桌面"""
    print(f"[{datetime.now()}] 开始清理桌面...")
    subprocess.run(["python", "clean_desktop.py"])

def job_organize_downloads():
    """每天下午6点整理下载文件夹"""
    print(f"[{datetime.now()}] 开始整理下载文件夹...")
    subprocess.run(["python", "organize_downloads.py"])

def job_system_check():
    """每小时检查系统资源"""
    subprocess.run(["python", "monitor_system.py"])

# 设置调度
schedule.every().day.at("02:00").do(job_backup)
schedule.every().monday.at("09:00").do(job_clean_desktop)
schedule.every().day.at("18:00").do(job_organize_downloads)
schedule.every().hour.do(job_system_check)

print("自动化调度器已启动...")
while True:
    schedule.run_pending()
    time.sleep(60)
```

## 最后说几句

这10个脚本解决的都是"小问题"，但正是这些小问题在不知不觉中消耗着你的时间和精力。

如果你对Python自动化感兴趣，但不想从零开始写这些脚本，我之前整理了一套更完整的[Creator Pro Bundle](https://segauser.gumroad.com/l/rrhmbb)，里面包含了这些脚本的优化版本，还附带了一个可视化的调度面板和详细的使用文档。不一定要买，但可以看看思路——有时候别人的解决方案能给你启发。

自动化不是偷懒，是把你从重复劳动中解放出来，去做更有创造性的事情。哪怕每天只省下30分钟，一年下来就是180多个小时——足够你学一门新技能或者完成一个副业项目了。
