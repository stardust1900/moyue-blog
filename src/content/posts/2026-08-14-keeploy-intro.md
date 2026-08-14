---
title: "Keeploy产品介绍"
date: 2026-08-14
category: "技术笔记"
tags: ["作品","部署","python"]
description: "Keeploy — 零停机滚动部署，一行命令搞定"
coverEmoji: "🚀"
draft: false
---

# Keeploy — 零停机滚动部署，一行命令搞定

> 基于 KeePass 凭据托管的 Nginx 零停机滚动部署工具。**密码纯本地、无需 Docker（dockerless）**，CLI + 桌面 GUI 双形态。

---

## 一句话

把「拉代码 → 打包 → 备份 → 逐台上传 → Nginx 摘流量 → 停服替换 → 健康检查 → Nginx 恢复流量」这套上线流程，做成一个**可重复、可回滚、fail-fast**的工具。

---

## 为什么你需要它？

### 痛点一：手动发布 = 人肉运维

每次上线：SSH 登每台机器 → 手动停服 → 上传包 → 重启 →祈祷没报错。漏了一台？忘了恢复 Nginx？凌晨三点手抖敲错命令？

**Keeploy 把这一切自动化。**

### 痛点二：密码散落各处

服务器密码写在配置文件里、Nginx 密码记在便签上、KeePass 里存了一份但每次手动复制。安全审计一查全是明文。

**Keeploy 让密码只活在本地 KeePass 里，绝不上云、绝不落盘明文。**

### 痛点三：出了问题不敢回滚

上次成功的是哪个版本？备份在哪台机器的哪个目录？回滚要重新走一遍流程吗？

**Keeploy 每次部署自动打时间戳备份，一键原样回退。**

### 痛点四：容器化部署太重，小团队用不起

K8s 要搭一套环境、Docker 要维护镜像构建流水线和 registry……为了一次上线，先养一堆基础设施。虚拟主机 / 裸金属 / 小集群只想把文件 rsync 上去、Nginx 摘个流就完事。

**Keeploy 是 dockerless 的：只需 Nginx + SSH，文件直传、原地替换，不引入任何容器编排。**

---

## 核心特性

| 特性 | 说明 |
|------|------|
| **密码纯本地** | SSH / Nginx 密码统一存进本地 KeePass（`.kdbx`），绝不上云、配置文件不写明文。支持环境变量 → 配置文件 → KeyFile → 交互输入四级回退。 |
| **无感滚动发布** | 逐台发布，任意时刻最多一台离线。发布前自动摘 Nginx 流量，完成后自动恢复，业务零感知。 |
| **dockerless 部署** | 无需 Docker / K8s / 镜像仓库。只需 Nginx + SSH，文件直传目标机、原地替换，不引入任何容器编排与额外基础设施。 |
| **一键回滚** | 基于远程时间戳备份（`{time_dir}/bak/`）原样回滚，复用同一套滚动流程。 |
| **Fail-Fast 安全中止** | 任一步失败立即终止后续机器；若失败发生在「已摘流量」之后，输出带恢复命令的告警，避免节点长期离线。 |
| **断点续发** | `resume` 仅对上次失败且已摘流量未恢复的节点继续发布。 |
| **双形态入口** | 纯 CLI（Click 命令行）+ 桌面 GUI（Tkinter，深/浅色主题），GUI 不改任何 CLI 代码。纯本地运行，无需 Web 服务、无需容器。 |
| **两类产物支持** | `jar`（Java 服务，停服替换后重启）与 `static`（前端静态资源，上传解压覆盖，无需重启）。 |
| **可观测** | 本地 SQLite 记录每次部署/回滚历史，支持 `status` 查询与 `--dry-run` 演练。 |

---

## 工作原理

```
滚动发布流程（每台机器依次执行）：

  ① 本地打包 + 上传新包        ← 此阶段不影响线上
  ② Nginx 注释该节点 server 行   ← nginx -t && nginx -s reload
  ③ 等待存量连接 drain
  ④ 停服 → 替换包 → 启服
  ⑤ 健康检查轮询（未配置则固定等待）
  ⑥ Nginx 恢复该节点           ← nginx -t && nginx -s reload

回滚走完全相同的流程，
区别只在第 ④ 步从 bak/ 取包而非 new/。
```

---

## 快速开始

```bash
# 1. 安装
pip install -r requirements.txt          # CLI
pip install -r requirements-gui.txt      # 如需桌面 GUI

# 2. 复制并编辑配置
cp config/example.json config/prod.json
# 填写主机、应用、KeePass 信息

# 3. 校验配置
python main.py status -c config/prod.json

# 4. 先演练（不实际改线上）
python main.py deploy -c config/prod.json --dry-run

# 5. 正式部署
python main.py deploy -c config/prod.json

# 6. （可选）启动 GUI
python keeploy_gui.py -c config/prod.json
```

---

## 社交传播文案

### 微博 / 即刻（适合配竖版海报）

> 还在 SSH 一台台手动部署？Keeploy 让你一行命令完成零停机滚动发布。
>
> 🔹 密码纯本地：凭据只在本地 KeePass，绝不上云、不落明文
> 🔹 dockerless：无需 Docker/K8s，纯 Nginx + SSH 直传
> 🔹 零停机滚动发布，业务零感知
> 🔹 一键回滚，fail-fast 安全中止
>
> 开源 MIT · 欢迎 Star 👉 [GitHub 链接]
>
> #DevOps #开源工具 #部署自动化 #Python

### Twitter / X Thread（适合配方形卡片）

> Tired of manually SSH-ing into every server for deploys?
>
> Keeploy = zero-downtime rolling deployment backed by KeePass credentials.
>
> 🚀 One command: `keeploy deploy`
> 🔐 Local-only secrets (KeePass .kdbx, never leaves your machine)
> 📦 dockerless: no Docker/K8s — plain Nginx + SSH, files shipped direct
> ♻️ Auto rollback from timestamped backups
> ⚡ Fail-fast abort with recovery commands
>
> Pure Python 3.8+, zero web-server dependency. Open source MIT.
>
> [GitHub link] #DevOps #OpenSource #Python #SRE

### 技术社区（V2EX / 掘金 / 稀土）

> **标题：我写了一个基于 KeePass 的零停机滚动部署工具**
>
> 做后端的应该都经历过手动发布的痛苦——SSH 登每台机器、手动停服、上传包、重启、祈祷……尤其是多节点负载均衡场景，还要操心 Nginx 摘流恢复。
>
> Keeploy 把这套流程标准化了：
> - 密码纯本地：KeePass 统一管，绝不上云、不落明文
> - dockerless：无需 Docker/K8s，纯 Nginx + SSH 直传部署
> - 逐台滚动发布，Nginx 自动摘流/恢复
> - 时间戳备份 + 一键回滚
> - fail-fast 安全机制
> - CLI + GUI 双形态
>
> Python 3.8+，纯 Tkinter GUI（不需要跑 Web 服务），MIT 开源。
>
> [项目地址]

---

## 技术栈

| 层面 | 技术 |
|------|------|
| 语言 | Python 3.8+ |
| CLI | Click |
| GUI | Tkinter（纯客户端，无 Web 服务、无容器） |
| 凭据管理 | pykeepass（KeePass `.kdbx`） |
| 远程操作 | Paramiko（SSH 封装） |
| 数据存储 | SQLite（部署历史） |
| 许可证 | MIT |

---

## 项目结构概览

```
Keeploy/
├── main.py                 # CLI 入口
├── keeploy_gui.py          # 桌面 GUI 入口
├── keeploy/                # 核心库
│   ├── workflow.py         # 编排引擎
│   ├── nginx.py            # Nginx 摘/恢复流量
│   ├── strategies.py       # jar / static 部署策略
│   ├── credentials.py      # KeePass 凭据解析
│   ├── remote.py           # SSH 封装
│   └── health.py           # 健康检查轮询
├── gui/                    # 桌面 GUI（Tkinter）
│   ├── app.py              # 整体布局 / 导航 / 主题
│   ├── runner.py           # 后台部署运行器
│   └── views/              # 配置 / 部署 / 历史 视图
└── config/example.json     # 配置样例
```

---

## 对比

| | 手动 SSH 发布 | Jenkins/GitLab CI | Ansible | **Keeploy** |
|--|-------------|-------------------|----------|------------|
| 零停机滚动 | ❌ 手动控制 | ✅ 但需额外配置 | ✅ 需写 playbook | ✅ 内建 |
| 凭据安全 | ❌ 明文散落 | ❌ 通常明文 | ❌ Vault 依赖重 | ✅ 密码纯本地 KeePass |
| 回滚能力 | ❌ 靠记忆/笔记 | ✅ | ✅ | ✅ 一键时间戳回滚 |
| Fail-Fast | ❌ | ✅ | 部分 | ✅ 含恢复命令告警 |
| 依赖重量 | 无 | 重（需服务端） | 中 | **轻（纯 Python，零 Web 服务、零容器）** |
| GUI | ❌ | ✅ Web UI | ❌ | ✅ 桌面 GUI（无需浏览器） |

---

*Keeploy — 让发布像 `git push` 一样简单。*
