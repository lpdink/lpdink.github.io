---
title: wing-agent：迈向通用 agent 运行时
date: 2026-08-07
tags: [wing-agent, AI, 开源]
description: 我一直在打磨的一个实验项目：一个对「上下文」极其吝啬的通用 agent 运行时。
---

# wing-agent：迈向通用 agent 运行时

> **Towards general agent runtime.**
> 一个实验性的项目，在 v1.0 之前可能包含 breaking change。

## 为什么叫 wing

因为想让它像翅膀一样：**轻**。这个项目最基本的一个执念，就是不给上下文添加任何多余的东西。

### 1. 不在上下文中施加魔法

很多 agent 框架会偷偷往上下文里塞隐藏的系统提示词，你根本不知道模型到底"看"到了什么。

wing 的原则是：

> **你看到的就是模型看到的。** 你的 system prompt、你的工具、你的对话。没有多余的东西。

### 2. 理论最高缓存命中率

我们承诺达到理论最高的 prompt 缓存命中率。除了必要的压缩，**绝不主动破坏缓存前缀**。

这意味着长期跑下来，你的 token 成本会省下一个量级。

### 3. 极简工具 schema

内置工具全部使用最简化的 schema。上下文窗口初始的工具开销控制在 **2K tokens 以内**——而不是 10K。

## 快速开始

```bash
pip install wing-agent
wing
```

首次运行会生成配置模板，填入你的 provider、key 与模型：

```yaml
openai:
  base_url: "https://your-api-endpoint/v1"   # ← 你的 API 地址
  api_key: "sk-xxx"                          # ← 你的密钥

agents:
  - name: default
    model: "gpt-4o"                          # ← 你的模型
    default: true
    tools: [Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion, TodoWrite, Explorer]
```

然后：

```bash
wing stop
wing
```

## 内置工具

| 工具 | 说明 |
| --- | --- |
| `Bash` | 带安全审查的 shell 命令执行 |
| `Read` | 按行范围读取文件 |
| `Write` | 创建或覆盖文件 |
| `Edit` | 精准的字符串替换 |
| `Glob` / `Grep` | 按模式找文件 / 正则搜内容 |
| `AskUserQuestion` | 向用户提问 |
| `TodoWrite` | 跟踪任务进度 |
| `Explorer` | 自主代码探索子代理（阻塞或后台） |

## 无头模式（stdio）

`wing` 也支持 headless 运行，兼容 Claude Code 的 stdio 协议。甚至可以把它 `alias` 成 `claude`，接入外部编排器：

```bash
wing -p "list the files in this directory"          # 文本（默认）：只输出最终结果
wing -p "list files" --output-format json           # 单个 JSON 对象
wing -p "list files" --output-format stream-json    # 实时 NDJSON 流
```

## 更多文档

完整的配置、魔法命令、自定义工具说明，都在本站的 [文档](/docs) 里：

- [配置文档](/docs/zh/config)
- [魔法命令](/docs/zh/magic-commands)
- [自定义工具](/docs/zh/custom-tools)

## 状态

**实验阶段** ⚠️ —— 期待你用，也期待你的反馈。Breaking change 会提前说明。

项目在 [GitHub](https://github.com/lpdink/wing-agent) 上开源（Apache-2.0）。