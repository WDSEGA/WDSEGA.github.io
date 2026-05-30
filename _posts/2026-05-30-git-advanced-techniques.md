---
layout: post
title: "Git高级技巧：交互式rebase、cherry-pick与bisect实战"
date: 2026-05-30 11:00:00 +0800
categories: [Git, 版本控制, 开发工具]
tags: [git, rebase, cherry-pick, bisect]
image: /assets/images/git-advanced.jpg
---

## 引言

Git不只是commit和push。交互式rebase、cherry-pick、bisect等高级命令能大幅提升你的开发效率。本文通过实际场景介绍这些技巧。

## 1. 交互式Rebase

### 合并提交

```bash
# 合并最近3个提交
git rebase -i HEAD~3

# 编辑器显示：
pick abc1234 First commit
pick def5678 Second commit
pick ghi9012 Third commit

# 改为：
pick abc1234 First commit
squash def5678 Second commit
squash ghi9012 Third commit

# 保存后编辑合并后的提交信息
```

### 重新排序提交

```bash
git rebase -i HEAD~3

# 调整顺序：
pick ghi9012 Third commit
pick abc1234 First commit
pick def5678 Second commit
```

### 修改历史提交

```bash
git rebase -i HEAD~3

# 标记要修改的提交：
pick abc1234 First commit
edit def5678 Second commit  # 改为edit
pick ghi9012 Third commit

# Git会停在第二个提交，你可以：
# 1. 修改文件
git add .
git commit --amend
# 2. 继续rebase
git rebase --continue
```

### 拆分提交

```bash
git rebase -i HEAD~2

# 标记要拆分的提交：
pick abc1234 First commit
edit def5678 Large commit  # 改为edit

# Git停在这个提交后：
git reset HEAD^
# 现在文件都在暂存区外，可以分多次提交
git add file1.py
git commit -m "Part 1: Add file1"
git add file2.py
git commit -m "Part 2: Add file2"
git rebase --continue
```

## 2. Cherry-pick

### 选择性合并提交

```bash
# 从其他分支挑选特定提交
git cherry-pick abc1234

# 挑选多个提交
git cherry-pick abc1234 def5678

# 挑选提交范围
git cherry-pick abc1234..ghi9012

# 只应用更改但不提交
git cherry-pick -n abc1234

# 解决冲突后继续
git cherry-pick --continue
# 或放弃
git cherry-pick --abort
```

### 实战：热修复

```bash
# 在feature分支修复了bug
git checkout feature
git commit -m "Fix critical bug"

# 将修复应用到main分支
git checkout main
git cherry-pick <commit-hash>

# 推送到生产
git push origin main
```

## 3. Git Bisect

### 二分查找问题提交

```bash
# 开始bisect
git bisect start

# 标记当前提交为坏提交
git bisect bad

# 标记某个已知的好提交
git bisect good v1.0.0

# Git会自动checkout中间提交
# 测试后标记：
git bisect good  # 如果没问题
# 或
git bisect bad   # 如果有问题

# 最终Git会告诉你哪个提交引入了问题
# abc1234 is the first bad commit

# 结束bisect
git bisect reset
```

### 自动化bisect

```bash
# 使用脚本自动判断
git bisect start HEAD v1.0.0
git bisect run python test.py

# test.py返回0表示好，非0表示坏
```

### 实战：查找性能回归

```python
# test_performance.py
import subprocess
import time

def test():
    # 运行性能测试
    start = time.time()
    result = subprocess.run(["python", "benchmark.py"], capture_output=True)
    elapsed = time.time() - start
    
    # 如果超过阈值，返回1（坏提交）
    if elapsed > 5.0:
        return 1
    return 0

if __name__ == "__main__":
    exit(test())
```

```bash
git bisect start HEAD v2.0.0
git bisect run python test_performance.py
```

## 4. Git Stash高级用法

```bash
# 带消息的stash
git stash push -m "Work in progress on feature X"

# 只stash部分文件
git stash push -p  # 交互式选择

# stash包括未跟踪的文件
git stash push -u

# 查看stash内容
git stash show -p stash@{0}

# 应用特定stash
git stash apply stash@{2}

# 从stash创建分支
git stash branch feature-from-stash stash@{0}
```

## 5. Git Reflog

```bash
# 查看操作历史
git reflog

# 恢复误删的提交
git checkout HEAD@{5}
git checkout -b recovery-branch

# 恢复误删的分支
git checkout -b recovered-branch HEAD@{3}

# 撤销rebase
git reset --hard HEAD@{1}
```

## 6. 实用别名配置

```bash
# 添加到 ~/.gitconfig
[alias]
    # 美化日志
    lg = log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit
    
    # 查看最近分支
    br = branch -vv
    
    # 撤销最后一次提交（保留更改）
    undo = reset --soft HEAD^
    
    # 撤销最后一次提交（丢弃更改）
    reset-hard = reset --hard HEAD^
    
    # 查看贡献者
    contributors = shortlog -sn
    
    # 交互式添加
    add-p = add -p
    
    # 快速stash
    st = stash push
    stp = stash pop
    stl = stash list
```

## 7. Git Hooks自动化

```bash
# .git/hooks/pre-commit
#!/bin/bash

# 运行代码检查
if ! python -m flake8 .; then
    echo "Code style check failed!"
    exit 1
fi

# 运行测试
if ! python -m pytest tests/; then
    echo "Tests failed!"
    exit 1
fi

exit 0
```

```bash
# .git/hooks/pre-push
#!/bin/bash

# 防止直接推送到main
branch=$(git symbolic-ref HEAD | sed -e 's,.*/\(.*\),\1,')
if [ "$branch" = "main" ]; then
    echo "Direct push to main is forbidden!"
    exit 1
fi

exit 0
```

## 8. 子模块管理

```bash
# 添加子模块
git submodule add https://github.com/user/repo.git libs/repo

# 克隆包含子模块的项目
git clone --recursive https://github.com/user/main-repo.git

# 更新子模块
git submodule update --remote

# 在所有子模块中执行命令
git submodule foreach 'git checkout main'
```

## 总结

Git高级技巧速查表：

| 命令 | 用途 |
|------|------|
| `rebase -i` | 合并、重排、修改历史提交 |
| `cherry-pick` | 选择性合并特定提交 |
| `bisect` | 二分查找问题提交 |
| `stash -p` | 部分暂存 |
| `reflog` | 恢复误操作 |
| `hook` | 自动化检查 |

> 💡 **工具推荐**：如果你需要管理多个Git仓库，可以试试**FeishuAgent Orchestrator**——一个多Agent协作框架，支持智能任务调度和并行执行。

---

*本文首发于 [WD Tech Blog](https://wdsega.github.io)，转载请注明出处。*
