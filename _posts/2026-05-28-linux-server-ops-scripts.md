---
layout: post
title: "Linux服务器运维必备：10个一键排查脚本解决80%的日常问题"
date: 2026-05-28 12:00:00 +0800
image: /assets/images/linux-server-ops-2026.jpg
tags: [Linux, 运维, Shell脚本, 服务器管理, DevOps]
---

作为运维工程师或后端开发者，日常工作中最耗时的往往不是写代码，而是排查服务器问题。CPU飙高、内存泄漏、磁盘满了、网络不通、进程僵死...这些问题反复出现，每次都手动敲命令排查效率太低。

本文分享10个经过实战检验的一键排查脚本，覆盖CPU、内存、磁盘、网络、进程、日志等常见场景。每个脚本都可以直接保存使用。

## 1. 系统整体健康检查

```bash
#!/bin/bash
# 文件名: health-check.sh
# 用途: 一键检查服务器整体健康状况

echo "========== 系统健康检查 =========="
echo "检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "主机名: $(hostname)"
echo ""

# 系统运行时间
echo "--- 运行时间 ---"
uptime
echo ""

# CPU使用率
echo "--- CPU使用率 (Top 5进程) ---"
ps aux --sort=-%cpu | head -6
echo ""

# 内存使用
echo "--- 内存使用 ---"
free -h
echo ""

# 磁盘使用
echo "--- 磁盘使用 ---"
df -h | grep -E '(Filesystem|/dev/)'
echo ""

# 系统负载
echo "--- 系统负载 ---"
cat /proc/loadavg
echo ""

# 网络连接数
echo "--- 网络连接统计 ---"
ss -s
echo ""

# 最近登录
echo "--- 最近5次登录 ---"
last -5
```

## 2. 端口占用排查

```bash
#!/bin/bash
# 文件名: check-port.sh
# 用途: 检查指定端口是否被占用，以及被谁占用
# 用法: ./check-port.sh 8080

PORT=${1:?"用法: $0 <端口号>"}

echo "========== 端口 $PORT 排查 =========="

# 检查端口是否在监听
echo "--- 监听状态 ---"
ss -tlnp | grep ":$PORT " || echo "端口 $PORT 未被监听"

# 检查占用进程
echo "--- 占用进程 ---"
lsof -i :$PORT 2>/dev/null || fuser $PORT/tcp 2>/dev/null

# 检查防火墙规则
echo "--- 防火墙状态 ---"
if command -v ufw &> /dev/null; then
    ufw status | grep $PORT || echo "UFW: 未找到端口 $PORT 的规则"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --list-ports | grep $PORT || echo "firewalld: 未找到端口 $PORT 的规则"
fi

# 测试端口连通性
echo "--- 连通性测试 ---"
timeout 3 bash -c "echo > /dev/tcp/127.0.0.1/$PORT" 2>/dev/null && \
    echo "本地端口 $PORT 可连接" || echo "本地端口 $PORT 不可连接"
```

## 3. 内存占用分析

```bash
#!/bin/bash
# 文件名: mem-analysis.sh
# 用途: 深度分析内存使用情况

echo "========== 内存分析 =========="

# 基本内存信息
echo "--- 内存概况 ---"
free -h
echo ""

# 内存占用Top 10进程
echo "--- 内存占用Top 10 ---"
ps aux --sort=-%mem | head -11 | awk '{printf "%-12s %-8s %-8s %s\n", $1, $4"%", $6/1024"MB", $11}'
echo ""

# 共享内存
echo "--- 共享内存段 ---"
ipcs -m 2>/dev/null || echo "ipcs命令不可用"
echo ""

# 内存碎片
echo "--- 内存碎片信息 ---"
cat /proc/buddyinfo 2>/dev/null | head -3
echo ""

# Swap使用情况
echo "--- Swap使用Top 10 ---"
for file in /proc/*/status; do
    awk '/VmSwap|Name/{printf $2 " " $3}END{print ""}' "$file"
done 2>/dev/null | sort -k 2 -n -r | head -10
echo ""

# 大页内存
echo "--- 大页内存 ---"
cat /proc/meminfo | grep -i huge
```

## 4. 磁盘空间深度分析

```bash
#!/bin/bash
# 文件名: disk-analysis.sh
# 用途: 分析磁盘空间占用，找出大文件和目录

echo "========== 磁盘分析 =========="

# 总体使用情况
echo "--- 文件系统使用率 ---"
df -h | grep -E '(Filesystem|/dev/)'
echo ""

# inode使用情况
echo "--- Inode使用率 ---"
df -i | grep -E '(Filesystem|/dev/)'
echo ""

# 当前目录下最大的20个文件
echo "--- 当前目录最大20个文件 ---"
find . -type f -exec du -h {} + 2>/dev/null | sort -rh | head -20
echo ""

# 当前目录下最大的10个目录
echo "--- 当前目录最大10个子目录 ---"
du -sh */ 2>/dev/null | sort -rh | head -10
echo ""

# 已删除但仍占用空间的文件
echo "--- 已删除但仍占用空间的文件 ---"
lsof +L1 2>/dev/null | awk '{printf "%s %s %s %s\n", $1, $2, $7, $NF}' | head -10 || \
    echo "无已删除文件占用空间"
echo ""

# 临时文件大小
echo "--- 临时文件目录大小 ---"
du -sh /tmp /var/tmp 2>/dev/null
echo ""

# 日志文件大小
echo "--- 日志文件大小 ---"
du -sh /var/log/* 2>/dev/null | sort -rh | head -10
```

## 5. 网络连通性诊断

```bash
#!/bin/bash
# 文件名: net-diagnose.sh
# 用途: 诊断网络连通性问题
# 用法: ./net-diagnose.sh example.com

TARGET=${1:-"8.8.8.8"}

echo "========== 网络诊断: $TARGET =========="

# DNS解析
echo "--- DNS解析 ---"
dig +short $TARGET 2>/dev/null || nslookup $TARGET 2>/dev/null | grep Address
echo ""

# Ping测试
echo "--- Ping测试 (5次) ---"
ping -c 5 -W 2 $TARGET 2>&1
echo ""

# 路由追踪
echo "--- 路由追踪 (前10跳) ---"
traceroute -m 10 -w 2 $TARGET 2>/dev/null || tracepath -m 10 $TARGET 2>/dev/null
echo ""

# 端口扫描（常用端口）
echo "--- 常用端口检测 ---"
for port in 22 80 443 3306 6379 8080; do
    timeout 2 bash -c "echo > /dev/tcp/$TARGET/$port" 2>/dev/null && \
        echo "  端口 $port: 开放" || echo "  端口 $port: 关闭/超时"
done
echo ""

# 网络接口状态
echo "--- 网络接口状态 ---"
ip -brief addr show 2>/dev/null || ifconfig 2>/dev/null
echo ""

# 路由表
echo "--- 路由表 ---"
ip route 2>/dev/null || route -n 2>/dev/null
```

## 6. 进程异常检测

```bash
#!/bin/bash
# 文件名: process-monitor.sh
# 用途: 检测异常进程（僵尸进程、CPU/内存异常等）

echo "========== 进程异常检测 =========="

# 僵尸进程
echo "--- 僵尸进程 ---"
ZOMBIE_COUNT=$(ps aux | awk '{if($8=="Z") print}' | wc -l)
if [ "$ZOMBIE_COUNT" -gt 0 ]; then
    echo "发现 $ZOMBIE_COUNT 个僵尸进程:"
    ps aux | awk '{if($8=="Z") print}'
else
    echo "未发现僵尸进程"
fi
echo ""

# CPU占用超过80%的进程
echo "--- CPU占用>80%的进程 ---"
ps aux --sort=-%cpu | awk 'NR>1 && $3>80 {printf "PID: %s, CPU: %s%%, CMD: %s\n", $2, $3, $11}'
echo ""

# 内存占用超过50%的进程
echo "--- 内存占用>50%的进程 ---"
ps aux --sort=-%mem | awk 'NR>1 && $4>50 {printf "PID: %s, MEM: %s%%, CMD: %s\n", $2, $4, $11}'
echo ""

# 运行时间超过7天的进程
echo "--- 运行超过7天的进程 ---"
ps -eo pid,etime,cmd | awk '$2 ~ /^[0-9]{4,}/ {print "PID:", $1, "运行时间:", $2, "CMD:", $3}'
echo ""

# 重复进程
echo "--- 可能的重复进程 ---"
ps aux | awk '{print $11}' | sort | uniq -c | sort -rn | head -10 | awk '$1>3 {print "进程:", $2, "数量:", $1}'
```

## 7. Nginx/Apache日志快速分析

```bash
#!/bin/bash
# 文件名: log-analysis.sh
# 用途: 快速分析Web服务器访问日志
# 用法: ./log-analysis.sh /var/log/nginx/access.log

LOG_FILE=${1:-"/var/log/nginx/access.log"}

if [ ! -f "$LOG_FILE" ]; then
    echo "日志文件不存在: $LOG_FILE"
    exit 1
fi

echo "========== 日志分析: $LOG_FILE =========="
echo "日志总行数: $(wc -l < "$LOG_FILE")"
echo ""

# Top 10 访问IP
echo "--- Top 10 访问IP ---"
awk '{print $1}' "$LOG_FILE" | sort | uniq -c | sort -rn | head -10
echo ""

# Top 10 访问URL
echo "--- Top 10 访问URL ---"
awk '{print $7}' "$LOG_FILE" | sort | uniq -c | sort -rn | head -10
echo ""

# HTTP状态码分布
echo "--- HTTP状态码分布 ---"
awk '{print $9}' "$LOG_FILE" | sort | uniq -c | sort -rn
echo ""

# 5xx错误
echo "--- 5xx错误 (最近20条) ---"
grep ' 5[0-9][0-9] ' "$LOG_FILE" | tail -20
echo ""

# 每小时请求量
echo "--- 每小时请求量 ---"
awk '{print substr($4,14,2)}' "$LOG_FILE" | sort | uniq -c | sort -k2n
```

## 8. SSL证书检查

```bash
#!/bin/bash
# 文件名: ssl-check.sh
# 用途: 检查SSL证书有效期
# 用法: ./ssl-check.sh example.com

DOMAIN=${1:?"用法: $0 <域名>"}

echo "========== SSL证书检查: $DOMAIN =========="

# 获取证书信息
echo "--- 证书详情 ---"
echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null | \
    openssl x509 -noout -subject -issuer -dates -ext subjectAltName 2>/dev/null
echo ""

# 计算剩余天数
EXPIRY_DATE=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN":443 2>/dev/null | \
    openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)

if [ -n "$EXPIRY_DATE" ]; then
    EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s 2>/dev/null)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( (EXPIRY_EPOCH - NOW_EPOCH) / 86400 ))

    echo "--- 剩余天数: $DAYS_LEFT 天 ---"

    if [ "$DAYS_LEFT" -lt 0 ]; then
        echo "!!! 证书已过期 !!!"
    elif [ "$DAYS_LEFT" -lt 7 ]; then
        echo "!!! 警告: 证书将在7天内过期 !!!"
    elif [ "$DAYS_LEFT" -lt 30 ]; then
        echo "注意: 证书将在30天内过期"
    else
        echo "证书状态正常"
    fi
else
    echo "无法获取证书信息"
fi
```

## 9. 一键安全检查

```bash
#!/bin/bash
# 文件名: security-check.sh
# 用途: 基础安全检查

echo "========== 安全检查 =========="

# SSH配置检查
echo "--- SSH安全配置 ---"
grep -E "^(PermitRootLogin|PasswordAuthentication|Port|PubkeyAuthentication)" /etc/ssh/sshd_config 2>/dev/null
echo ""

# 防火墙状态
echo "--- 防火墙状态 ---"
if command -v ufw &> /dev/null; then
    ufw status
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --state
    firewall-cmd --list-all
fi
echo ""

# 失败登录尝试
echo "--- 最近失败登录 (Top 10 IP) ---"
grep "Failed password" /var/log/auth.log 2>/dev/null | \
    awk '{print $(NF-3)}' | sort | uniq -c | sort -rn | head -10 || \
    journalctl -u sshd --no-pager | grep "Failed" | tail -10
echo ""

# SUID文件检查
echo "--- 可疑SUID文件 ---"
find / -perm -4000 -type f 2>/dev/null | head -20
echo ""

# 开放端口
echo "--- 监听端口 ---"
ss -tlnp | awk 'NR>1 {print $4, $6}' | sort
echo ""

# 当前登录用户
echo "--- 当前登录用户 ---"
who
echo ""

# 计划任务
echo "--- 当前用户的计划任务 ---"
crontab -l 2>/dev/null || echo "无计划任务"
```

## 10. 快速备份脚本

```bash
#!/bin/bash
# 文件名: quick-backup.sh
# 用途: 快速备份指定目录，支持增量备份
# 用法: ./quick-backup.sh /var/www/html

SOURCE_DIR=${1:?"用法: $0 <源目录>"}
BACKUP_DIR="/backup"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_NAME=$(basename "$SOURCE_DIR")_${TIMESTAMP}.tar.gz
MAX_BACKUPS=7

echo "========== 快速备份 =========="
echo "源目录: $SOURCE_DIR"
echo "备份目录: $BACKUP_DIR"
echo "备份文件: $BACKUP_NAME"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 执行备份（排除日志和临时文件）
echo "正在备份..."
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}" \
    --exclude="*.log" \
    --exclude="*.tmp" \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="__pycache__" \
    -C "$(dirname "$SOURCE_DIR")" \
    "$(basename "$SOURCE_DIR")" 2>/dev/null

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -sh "${BACKUP_DIR}/${BACKUP_NAME}" | cut -f1)
    echo "备份成功: ${BACKUP_DIR}/${BACKUP_NAME} ($BACKUP_SIZE)"
else
    echo "备份失败!"
    exit 1
fi

# 清理旧备份（保留最近N个）
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}/"*.tar.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    echo "清理旧备份 (保留最近${MAX_BACKUPS}个)..."
    ls -1t "${BACKUP_DIR}/"*.tar.gz | tail -n +$((MAX_BACKUPS + 1)) | xargs rm -f
    echo "清理完成"
fi

echo "当前备份列表:"
ls -lh "${BACKUP_DIR}/"*.tar.gz 2>/dev/null
```

## 使用建议

1. **保存到统一目录**：将所有脚本保存到 `/usr/local/bin/` 或 `~/scripts/`，添加到PATH中
2. **设置定时任务**：将健康检查和安全检查加入crontab，每天自动执行
3. **结合告警**：将脚本输出对接到告警系统（如企业微信、钉钉、邮件）
4. **定期更新**：根据实际需求调整阈值和检查项

```bash
# 设置crontab定时执行
# 每天早上8点执行健康检查
0 8 * * * /root/scripts/health-check.sh > /var/log/health-check.log 2>&1

# 每周一早上9点执行安全检查
0 9 * * 1 /root/scripts/security-check.sh > /var/log/security-check.log 2>&1

# 每天凌晨2点自动备份
0 2 * * * /root/scripts/quick-backup.sh /var/www/html
```

---

*你日常运维中还有哪些常用的脚本？欢迎在评论区分享。*
