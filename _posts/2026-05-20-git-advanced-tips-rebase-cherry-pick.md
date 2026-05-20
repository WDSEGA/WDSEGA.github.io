---
layout: post
title: "Git高级技巧：rebase、cherry-pick、stash等实用技巧"
date: 2026-05-20
categories: [编程, Git]
tags: [Git, 版本控制, 开发工具, 效率]
image: /assets/images/git-advanced-tips.jpg
---

![Git高级技巧](/assets/images/git-advanced-tips.jpg)

## 引言

Git是每个开发者的必备工具，但大多数人只用了它20%的功能。本文将分享Git的高级技巧，帮助你更高效地管理代码版本。无论你是想保持干净的提交历史，还是需要从其他分支"偷"代码，这些技巧都能帮到你。

## Git Rebase：重写提交历史

### 什么是Rebase？

Rebase可以将一系列提交"重新播放"到另一个基点上，从而创建线性的提交历史。

### 基本用法

```bash
# 假设你在feature分支上有3个提交
# main分支也有了新的提交
#
# 当前状态：
#   main:    A---B---C
#            \
#   feature: D---E---F
#
# 执行 git rebase main 后：
#   main:    A---B---C
#                     \
#   feature:           D'---E'---F'

git checkout feature
git rebase main
```

### 交互式Rebase

交互式Rebase是最强大的Git工具之一：

```bash
# 修改最近3个提交
git rebase -i HEAD~3
```

这会打开一个编辑器，显示如下内容：

```
pick e3a1b35 添加用户登录功能
pick 7c2d9f1 修复登录Bug
pick a4b8e2c 添加单元测试

# 可用命令：
# p, pick = 保留提交
# r, reword = 保留提交，修改提交信息
# e, edit = 保留提交，暂停以修改
# s, squash = 合并到前一个提交
# f, fixup = 合并到前一个提交，丢弃提交信息
# d, drop = 删除提交
```

### 实用场景

**场景1：合并多个小提交**

```
# 将最近3个提交合并为1个
git rebase -i HEAD~3

# 在编辑器中：
pick a1b2c3d 添加功能A
squash e4f5g6h 修复拼写错误
squash i7j8k9l 调整格式

# 保存后会让你编辑合并后的提交信息
```

**场景2：修改某个历史提交**

```bash
# 找到要修改的提交
git log --oneline

# 交互式rebase到该提交之前
git rebase -i <commit-hash>^

# 将该提交的pick改为edit
# 修改文件
git add .
git rebase --continue
```

**场景3：重新排序提交**

```
# 在交互式rebase中，直接调整提交的顺序
# Git会自动处理冲突（如果有的话）
pick e3a1b35 添加单元测试     # 先提交测试
pick 7c2d9f1 添加用户登录功能  # 再提交功能
pick a4b8e2c 修复登录Bug      # 最后修复Bug
```

### Rebase的注意事项

```bash
# 如果rebase过程中出现冲突
git status              # 查看冲突文件
# 解决冲突...
git add .               # 标记冲突已解决
git rebase --continue   # 继续rebase

# 如果想放弃rebase
git rebase --abort      # 回到rebase之前的状态

# 黄金法则：不要对已推送的公共分支执行rebase！
```

## Git Cherry-pick：精准摘取提交

### 基本用法

Cherry-pick可以将某个分支上的特定提交应用到当前分支。

```bash
# 在feature分支上有一个重要的Bug修复
# 你想把这个修复应用到main分支

git checkout main
git cherry-pick <commit-hash>
```

### 摘取多个提交

```bash
# 摘取连续的多个提交
git cherry-pick <start-hash>..<end-hash>

# 摘取不连续的多个提交
git cherry-pick <hash1> <hash3> <hash5>

# 摘取某个分支上的所有提交（不合并）
git cherry-pick feature-branch
```

### 摘取时修改提交

```bash
# 摘取提交但修改提交信息
git cherry-pick -e <commit-hash>

# 摘取提交但不自动提交（可以修改后再提交）
git cherry-pick -n <commit-hash>
# 修改文件...
git commit -m "修改后的提交信息"
```

### 实用场景

**场景1：紧急Bug修复**

```bash
# 在release分支发现Bug，在hotfix分支修复
git checkout -b hotfix main
# 修复Bug...
git commit -m "修复紧急Bug #123"

# 将修复应用到其他分支
git checkout develop
git cherry-pick <hotfix-commit-hash>

git checkout feature-x
git cherry-pick <hotfix-commit-hash>
```

**场景2：跨团队协作**

```bash
# 同事的分支上有一个你需要的功能
git cherry-pick <colleague-commit-hash>

# 摘取时解决冲突
git cherry-pick <hash>
# 如果有冲突，解决后：
git add .
git cherry-pick --continue
```

## Git Stash：临时保存工作

### 基本用法

```bash
# 临时保存当前修改
git stash

# 恢复最近一次stash
git stash pop

# 查看所有stash
git stash list

# 恢复指定stash（不删除）
git stash apply stash@{0}

# 删除指定stash
git stash drop stash@{0}

# 清空所有stash
git stash clear
```

### 高级用法

```bash
# stash时添加描述
git stash push -m "正在开发登录功能"

# stash包含未跟踪的文件
git stash push -u -m "包含新文件"

# stash包含所有修改（包括忽略的文件）
git stash push -a -m "包含所有文件"

# 从stash创建分支
git stash branch new-feature stash@{0}
```

### 实用场景

**场景1：紧急切换分支**

```bash
# 正在开发功能，突然需要切换分支修复Bug
git stash push -m "功能开发中"
git checkout hotfix
# 修复Bug...
git commit -m "修复Bug"
git checkout feature
git stash pop
```

**场景2：暂存部分修改**

```bash
# 只stash某些文件
git stash push -m "暂存UI修改" src/components/

# 只stash已跟踪的修改
git stash push -k -m "保留暂存区"
```

## Git Bisect：二分法查找Bug

当你在某个版本引入了Bug，但不确定是哪个提交导致的，Git Bisect可以帮你快速定位。

```bash
# 开始二分查找
git bisect start

# 标记已知有Bug的提交
git bisect bad HEAD

# 标记已知没Bug的提交
git bisect good v1.0.0

# Git会自动checkout到中间的提交
# 测试后标记：
git bisect good  # 这个版本没问题
git bisect bad   # 这个版本有Bug

# 重复以上步骤，直到找到引入Bug的提交

# 结束查找
git bisect reset
```

## 其他实用技巧

### 1. Git Reflog：找回丢失的提交

```bash
# 查看所有操作记录
git reflog

# 找到丢失的提交hash后恢复
git reset --hard <commit-hash>

# 或创建新分支指向该提交
git branch recovered-branch <commit-hash>
```

### 2. Git Clean：清理工作区

```bash
# 预览将被删除的文件
git clean -n

# 删除未跟踪的文件
git clean -f

# 删除未跟踪的文件和目录
git clean -fd

# 删除被忽略的文件
git clean -fX
```

### 3. Git Worktree：同时处理多个分支

```bash
# 在同一仓库中同时checkout多个分支
git worktree add ../hotfix-dir hotfix-branch

# 查看所有worktree
git worktree list

# 删除worktree
git worktree remove ../hotfix-dir
```

### 4. 搜索代码历史

```bash
# 在提交历史中搜索包含特定字符串的提交
git log -S "functionName" --all

# 在提交信息中搜索
git log --grep="Bug修复"

# 查看某行代码的修改历史
git log -p -L start,end:filename
```

### 5. 子模块管理

```bash
# 添加子模块
git submodule add https://github.com/user/repo.git libs/repo

# 更新子模块
git submodule update --init --recursive

# 克隆包含子模块的仓库
git clone --recursive https://github.com/user/project.git
```

## Git别名配置

```bash
# 在 ~/.gitconfig 中添加别名
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all"
git config --global alias.last "log -1 HEAD --stat"
git config --global alias.unstage "reset HEAD --"
git config --global alias.amend "commit --amend --no-edit"

# 使用
git co feature-branch
git lg
git last
```

## 提交信息规范

### Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型**：
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档修改
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具链

**示例**：
```
feat(auth): 添加JWT令牌刷新功能

- 实现自动刷新逻辑
- 添加令牌过期检测
- 处理并发刷新请求

Closes #123
```

### Git Hooks自动化

```bash
# 安装commit-msg hook验证提交信息
# .git/hooks/commit-msg
#!/bin/bash
MSG=$(cat $1)
if ! echo "$MSG" | grep -qE "^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+"; then
    echo "错误：提交信息不符合规范"
    echo "格式：type(scope): subject"
    echo "类型：feat|fix|docs|style|refactor|test|chore"
    exit 1
fi
```

## 结语

Git是一个功能极其强大的工具，掌握这些高级技巧可以显著提升你的开发效率。记住：

1. **Rebase**保持线性历史，但不要对公共分支使用
2. **Cherry-pick**精准摘取提交，适合跨分支修复
3. **Stash**临时保存工作，让你随时切换上下文
4. **Bisect**二分法定位Bug，快速找到问题提交
5. **Reflog**是安全网，几乎可以恢复任何丢失的内容

---

*本文为完整版，更多Git工作流和团队协作技巧请持续关注本博客。*

*相关阅读：[Python异步编程实战：asyncio完全指南](/2026/05/20/python-asyncio-complete-guide)*
