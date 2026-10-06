---
title: Session 数据模型 v2 · 同一份历史，只存一遍
date: 2026-10-06
status: proposed
order: 1
tags: [wing-agent, 数据模型, RFC]
description: 把会话存储从"同一份内容存好几遍"收敛为单份事实 + 使用时投影；记录格式 v2、存留兼容策略、迁移工具与收益测算。
---

> 状态：待评审。本文只谈设计、不动代码；评审通过后按文末计划分阶段实施。

## TL;DR

- **现状**：同一条 assistant 记录里，同一份内容被存了两遍 —— thinking 文本一份变两份，工具调用参数一份变两份。本机实测：197 个 session 共 246.7 MiB 历史，**其中 30.3% 是纯副本**。
- **成因**：引入 Anthropic provider 时，assistant 消息升级为"内容块数组"，但为了兼容旧格式，把平铺字段的派生物一并写进了落盘记录。当时的权宜之计，后来没人拆。
- **方案**：定义**记录格式 v2** —— 落盘只有一份事实（内容块等），其他一切形态（Anthropic / OpenAI 请求体、前端投影）都在**使用的那一刻派生**。同时给 thinking 预留"加密载荷"的正式字段位。
- **兼容**：老数据**不迁移也能读**（读侧双读；且字段没改名，旧代码实测可以直接读新记录）。迁移工具只负责把老文件整容成新格式、回收空间 —— 幂等、可回滚、默认 dry-run。
- **代价**：前端与 wire 协议零改动；迁移是可选动作，不是升级前置。

## 一、问题：同一份数据，为什么会被存几遍

### 1.1 它长什么样

这是从真实会话里摘的一条 assistant 记录（已裁剪、脱敏）：

<figure class="dsg-fig">
<pre><code>{"uuid": "01cbe3…", "parent_uuid": "1c4597…", "role": "assistant",
 "content_blocks": [                                     <span class="dsg-cmt">← 事实在这里（唯一应保留的）</span>
   {"type": "thinking",  "thinking": "Let me start by reading the review request.",
    "signature": null, "redacted": false},
   {"type": "tool_use",  "id": "call_00_…", "name": "Bash",
    "input": {"command": "git log --oneline …"}, "input_error": null}
 ],
 "usage": {"prompt_tokens": 8153, "completion_tokens": 203, "cached_tokens": 3584},
 <span class="dsg-dup">"reasoning_content": "Let me start by reading the review request.",  ← 副本①：逐字相同</span>
 <span class="dsg-dup">"tool_calls": [{"id": "call_00_…", "name": "Bash",                    ← 副本②：逐字相同</span>
 <span class="dsg-dup">               "arguments": {"command": "git log --oneline …"}}],</span>
 "ts": "2026-10-01T02:24:18"}</code></pre>
<figcaption class="dsg-cap">一条真实记录（示意裁剪版）：内容块里存一份事实，平铺字段里再存一份副本；再叠加散落的 null 键（signature / input_error）与恒为 false 的 redacted 标记。</figcaption>
</figure>

三种重复都在这条记录里：

- `content_blocks[0].thinking` 与 `reasoning_content`：**逐字相同**的 thinking 文本；
- `content_blocks[1].input` 与 `tool_calls[0].arguments`：**逐字相同**的工具参数；
- 键层面的噪声：`signature: null`、`input_error: null` 这类"没有值的键"也一路写进磁盘。

### 1.2 它是怎么来的

诚实地说，这不是谁拍板的"设计"，是一次**权宜之计被默许为常态**：

1. 最早 assistant 消息只有平铺三件套：`content` / `reasoning_content` / `tool_calls`；
2. 引入 Anthropic provider 后，为了让 thinking 签名能**逐字节回放**，消息升级为有序的 `content_blocks`；
3. 为了不让"存量消费者"（旧日志、旧脚本、旧前端）炸掉，序列化时把平铺字段继续导出；
4. 于是每写一条 assistant 记录 = 内容块 + 平铺副本。代码注释里写着"导出是派生行为，不是第二份存储" —— 这句话对**内存**成立，对**磁盘**不成立。

### 1.3 为什么不只是"多占点磁盘"

<div class="dsg-callout is-bad">
<p><span class="dsg-ct">按危害排序：</span></p>
<p>① <b>两处真相 = 漂移面</b>。只要有任何一条路径只改了一处（改块忘了平铺、迁移脚本只动一半、前端消费补丁），回放给模型的字节就变了 —— Anthropic 的 thinking 签名会失配（请求直接 400），或请求前缀变化导致 KV cache 全灭。</p>
<p>② <b>体积</b>。本机实测 30.3% 的历史字节是纯副本；磁盘、加载、同步、切帧都在为它买单（出网 WS 帧有 16 MiB 上限、8 MiB 切分阈值）。</p>
<p>③ <b>字段语义不清</b>。新人会问"content 和 content_blocks 哪个是真的" —— 格式本身在鼓励错误。</p>
<p>④ <b>演进被堵死</b>。想加"加密 thinking"这类新概念时，平铺形态根本表达不了（它没有"块的顺序"概念），只能继续打补丁叠罗汉。</p>
</div>

### 1.4 顺带说：代码库里已有两处把这件事做对了

- **图片媒体**：消息里只存引用，字节按内容寻址存一份，天然去重；
- **事件双胞胎**：`tool_call_result` / `llm_call_metrics` 这类"同一事实的事件副本"已从落盘中退役（`persist=False` / `disk_exclude`）。

这次就是把同一原则推到底：**落盘只存事实，一切形态都是投影**。

## 二、设计原则

<div class="dsg-chips">
<span class="dsg-chip is-accent">P1 单一事实源</span>
<span class="dsg-chip is-accent">P2 协议中立</span>
<span class="dsg-chip is-accent">P3 空值不存储，0 / False 是事实</span>
<span class="dsg-chip is-accent">P4 版本化演进，读侧兼容</span>
<span class="dsg-chip is-accent">P5 可信记录与不可信输入分边界</span>
</div>

- **P1 单一事实源**：任何事实只存一份；一切其他表示都是投影，在**使用的那一刻**从事实派生（越晚派生越便宜）。
- **P2 协议中立**：落盘与内存模型不出现任何厂商概念。格式里没有 `anthropic_version`，没有 `enable_thinking`；"思考"、"回放凭证"、"加密载荷"这些是中立的通用概念，Anthropic / OpenAI 只是投影目标。
- **P3 空值不存储**：值为 null 的键不写（"没有"）；`0` / `false` / `""` 是有意义的值，必须保留。绝不做"假值省略"。
- **P4 版本化演进**：记录带版本号，读侧双读、写侧单写；升级靠工具自动化，不要求用户手工改文件。
- **P5 边界清晰**：核心记录是我们自己产出的**可信数据**——用显式编解码保真往返，不需要校验框架；外部输入（HTTP 请求、配置文件）是**不可信数据**——继续在边缘用校验框架兜住。两种职责不混。

## 三、目标形态：一句话与图

一句话：**落盘只有事实；加载器负责把记录变成对象；模型请求与前端投影在需要时从对象派生。**

<figure class="dsg-fig">
<svg viewBox="0 0 880 428" role="img" aria-label="目标架构：单份事实经加载器进入领域对象，在请求期派生为各协议格式">
  <defs>
    <marker id="f2m" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z"/>
    </marker>
  </defs>
  <text x="30" y="36" class="tt">目标形态：一份事实 → 一个内存模型 → 多个投影</text>
  <rect x="30" y="118" width="196" height="158" rx="12" class="bx-soft"/>
  <text x="46" y="146" class="tt">history.jsonl · 记录 v2</text>
  <text x="46" y="176" class="ts">content_blocks：唯一内容</text>
  <text x="46" y="200" class="ts">media：只存引用</text>
  <text x="46" y="224" class="ts">uuid / parent_uuid：链拓扑</text>
  <text x="46" y="248" class="ts">usage / stop_reason：审计</text>
  <text x="226" y="190" class="ts" text-anchor="start">加载</text>
  <line x1="226" y1="210" x2="262" y2="210" class="ln" marker-end="url(#f2m)"/>
  <rect x="268" y="160" width="142" height="84" rx="12" class="bx"/>
  <text x="284" y="188" class="tt">Loader</text>
  <text x="284" y="210" class="ts">v2 原生读</text>
  <text x="284" y="230" class="ts">v1 旧记录映射</text>
  <line x1="410" y1="202" x2="446" y2="202" class="ln" marker-end="url(#f2m)"/>
  <rect x="450" y="126" width="180" height="152" rx="12" class="bx-accent"/>
  <text x="466" y="154" class="tt">领域对象（唯一形态）</text>
  <text x="466" y="182" class="ts">Message：role + 内容块</text>
  <text x="466" y="206" class="ts">Text / Thinking / ToolUse</text>
  <text x="466" y="230" class="ts">MediaRef · Usage</text>
  <text x="466" y="256" class="tm2">内存里不存在第二份</text>
  <line x1="630" y1="166" x2="668" y2="98" class="ln-dash" marker-end="url(#f2m)"/>
  <line x1="630" y1="202" x2="668" y2="202" class="ln-dash" marker-end="url(#f2m)"/>
  <line x1="630" y1="238" x2="668" y2="308" class="ln-dash" marker-end="url(#f2m)"/>
  <text x="650" y="150" class="ts">请求期派生</text>
  <rect x="672" y="58" width="180" height="64" rx="10" class="bx-good"/>
  <text x="688" y="84" class="tm">to_anthropic()</text>
  <text x="688" y="106" class="ts">Anthropic Messages 请求体</text>
  <rect x="672" y="170" width="180" height="64" rx="10" class="bx-good"/>
  <text x="688" y="196" class="tm">to_openai()</text>
  <text x="688" y="218" class="ts">OpenAI 兼容请求体</text>
  <rect x="672" y="282" width="180" height="64" rx="10" class="bx-good"/>
  <text x="688" y="308" class="tm">serialize_message()</text>
  <text x="688" y="330" class="ts">前端回放投影（形状不变）</text>
  <rect x="30" y="360" width="822" height="48" rx="10" class="bx-dash"/>
  <text x="441" y="389" class="ts" text-anchor="middle">不变量：存储层不出现任何厂商字段；派生只发生在内存，落盘永远是事实本身。</text>
</svg>
<figcaption class="dsg-cap">图 1 · 目标数据流：记录 → 加载器（版本分发）→ 领域对象 → 使用时刻派生多个投影。存储、领域、协议三层各管一段，互不越界。</figcaption>
</figure>

这个形状带来三个对用户可见的承诺：

1. **老 session 升级后立即可用**：不迁移也能读（读侧双读），迁移只是可选优化；
2. **迁移完全可选、幂等、可回滚**：跑不跑都不影响使用；
3. **前端 / CLI / SDK 输出格式不变**：wire 投影保持既有形状，由新对象派生。

## 四、记录格式 v2

### 4.1 记录头（所有记录共有）

| 键 | 类型 | 说明 |
| --- | --- | --- |
| `v` | 整数 | 记录格式版本。新记录写 `2`；老记录没有这个键，按 v1 读 |
| `uuid` / `parent_uuid` / `unzip_last_uuid` | 字符串 | 链拓扑（fork / rewind / 压缩用）；无值不写 |
| `role` | 字符串 | `user` / `assistant` / `tool` / `system`；事件记录为 `event` |
| `ts` | 字符串 | 写入时间（审计） |

### 4.2 assistant 消息

| 键 | 说明 |
| --- | --- |
| `content_blocks` | **唯一的内容存储**：文本 / 思考 / 工具调用按时间顺序排列 |
| `usage` | token 审计（输入 / 输出 / 缓存命中、模型名、请求 id、耗时指标） |
| `stop_reason` | 终止原因（`end_turn` / `max_tokens` / `tool_use` …） |

### 4.3 非 assistant 消息

| 键 | 说明 |
| --- | --- |
| `content` | 文本内容 |
| `tool_call_id` | tool 消息：对应的工具调用 id |
| `media` | 图片引用（只有引用；字节在媒体池里存一份，天生去重） |

### 4.4 内容块规范

块是封闭的三种类型。每个字段只表达一件事：

| 块 | 字段 | 含义 | 缺席语义 |
| --- | --- | --- | --- |
| 文本 `text` | `text` | 正文片段 | 空文本不构成块 |
| 思考 `thinking` | `thinking` | 推理文本 | 空思考不构成块 |
| 思考 `thinking` | `signature` | provider 签发的**回放凭证**（不透明，回放时一个字节都不改） | 没有凭证就缺席 |
| 思考 `thinking` | `encrypted` | **预留位**：加密推理载荷（Anthropic `redacted_thinking` 的回放槽位） | 现在没有生产者；位置先留好 |
| 工具调用 `tool_use` | `id` / `name` / `input` | 调用 id、工具名、解析后的参数 | 必有 |
| 工具调用 `tool_use` | `input_error` | 参数解析失败的现场记录 | 没有错误就缺席 |

<div class="dsg-callout is-info">
<p><span class="dsg-ct">为什么现在就给"加密思考"留位：</span>Anthropic 有一种不可读、只能原样回放的加密思考块（redacted_thinking）。现在代码里把它借存在 <code>signature</code> 字段里（注释里自认是"复用"）。v2 给它一个正式的家：<code>thinking.encrypted</code>。今天没有生产者会写它，但格式、加载器、回放投影都按"它存在"来设计 —— 这就是留好位置。</p>
</div>

### 4.5 统一规则（五条，写死在编解码层）

1. **值为 null → 键不写**（递归到嵌套对象与数组元素）。"没有"只有这一种表示。
2. **`0` / `false` / `""` 是事实**，必须照写。禁止任何"假值一律省略"的优化。
3. **未知块类型原样保留**：读得到、不参与投影、可以原样回写（前向兼容，不丢数据）；未知顶层键忽略。
4. **键序按规范顺序输出**：diff 干净、可以对账哈希。
5. **写侧永远写 v2；读侧 v1 / v2 都会读。**

### 4.6 完整样例

```json
{
  "v": 2,
  "uuid": "01cbe31d-632a-4724-b8d6-2004cab6f602",
  "parent_uuid": "1c4597bb-37b1-431d-bf9f-1eea5cdde18a",
  "role": "assistant",
  "content_blocks": [
    { "type": "thinking", "thinking": "Let me start by reading the review request.", "signature": "EqQBCgIY…" },
    { "type": "tool_use", "id": "call_00_CLmW3…", "name": "Bash", "input": { "command": "git log --oneline …" } }
  ],
  "usage": { "prompt_tokens": 8153, "completion_tokens": 203, "cached_tokens": 3584 },
  "stop_reason": "tool_use",
  "ts": "2026-10-01T02:24:18"
}
```

加密思考（预留形态，当前不产生）：

```json
{ "type": "thinking", "encrypted": "ErsXQm…（不透明载荷）" }
```

回放到 Anthropic 时映射为 `{"type": "redacted_thinking", "data": "ErsXQm…"}` —— 原始字节原样进、原样出。

### 4.7 前后对比（同一条消息）

<div class="dsg-grid2">
<div>
<p class="dsg-col-h">v1 · 现在（事实 + 副本）</p>
<pre><code>{"role": "assistant",
 "content_blocks": [
   {"type": "thinking",
    "thinking": "Let me start…"},
   {"type": "tool_use", "id": "call_00_…",
    "name": "Bash",
    "input": {"command": "git log…"}}
 ],
<span class="dsg-dup"> "reasoning_content": "Let me start…",</span>
<span class="dsg-dup"> "tool_calls": [{"id": "call_00_…",</span>
<span class="dsg-dup">   "name": "Bash",</span>
<span class="dsg-dup">   "arguments": {"command": "git log…"}}],</span>
 "ts": "…"}</code></pre>
</div>
<div>
<p class="dsg-col-h">v2 · 目标（只有事实）</p>
<pre><code>{"v": 2, "role": "assistant",
 "content_blocks": [
   {"type": "thinking",
    "thinking": "Let me start…"},
   {"type": "tool_use", "id": "call_00_…",
    "name": "Bash",
    "input": {"command": "git log…"}}
 ],
 "ts": "…"}</code></pre>
</div>
</div>

<div class="dsg-stats">
<div class="dsg-stat hot"><b>30.3%</b><span>全库历史字节是平铺副本（本机 197 个 session 实测）</span></div>
<div class="dsg-stat hot"><b>1879 → 1024 B</b><span>单条样例记录 -46%（thinking + 工具调用较重的消息）</span></div>
<div class="dsg-stat"><b>~1.2 MiB</b><span>嵌套 null 键（signature / input_error …）的纯噪声</span></div>
<div class="dsg-stat cool"><b>0 次</b><span>前端需要改动的地方（wire 投影形状不变）</span></div>
</div>

## 五、为什么"破坏性变更"可以无感

这次格式变更对**存储**是破坏性的（落盘形态变了），但对**用户**几乎无感，靠三件事撑着：

### 5.1 读侧双读，写侧单写

- 加载器遇到没有 `v` 的老记录，按 v1 规则映射（丢掉平铺副本、剥 null、重建块）；
- 新写入的记录永远是 v2；
- 同一个文件里 v1 / v2 记录混排完全合法（日志本来就是 append-only），**迁移不是升级前置**。

### 5.2 旧读侧天然可读新记录（已实测）

这是最巧的一点：**旧代码本来就从内容块实时派生**平铺字段。所以把平铺副本从磁盘拿掉之后，旧版本软件读新记录时，`content` / `reasoning_content` / `tool_calls` 会被它自己从块里算出来。我们用旧版加载器实测过：

<div class="dsg-callout is-good">
<p><span class="dsg-ct">实测结论：</span>v2 形状的记录经旧代码 <code>model_validate</code> 加载通过；旧代码派生出全部平铺字段，投影出的请求体与"含全量副本的旧记录"的投影<b>逐字节相等</b>。</p>
</div>

之所以成立，是因为我们**刻意不改字段名**（`content_blocks` / `thinking` / `signature` 保持原样）——这不是偷懒，是为兼容放行的工程决定：字段改名会让"旧读侧可读"这个红利消失，收益却为零。

### 5.3 前端与协议零改动

回放给 TUI / VSCode / CLI / SDK 的"消息投影"（扁平形状）保持原样，由新对象**按需派生**。`wing tail --json` 逐字输出这些投影，因此输出也不变。**这次治理不碰 wire 协议。**

<div class="dsg-callout is-warn">
<p><span class="dsg-ct">唯一的边界（提前声明）：</span>将来真正开始产生"加密思考"块时，旧版本软件会忽略 <code>encrypted</code> 字段、无法正确回放。实施阶段会在启动时加记录版本检查：发现含新块类型的记录，给出明确的"请升级"提示，而不是静默出错。今天不存在这类记录，属于给未来上的保险。</p>
</div>

## 六、迁移工具：把老文件整容

<figure class="dsg-fig">
<svg viewBox="0 0 880 240" role="img" aria-label="迁移流程：扫描、判版本、备份、重写对账、报告">
  <defs>
    <marker id="f3m" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z"/>
    </marker>
  </defs>
  <text x="25" y="42" class="tt">wing-gateway migrate sessions</text>
  <text x="262" y="42" class="ts">默认 dry-run；显式 --apply 才写盘；要求网关停止（离线运行）</text>
  <rect x="25" y="76" width="112" height="72" rx="10" class="bx"/>
  <text x="39" y="102" class="tm">扫描 session</text>
  <text x="39" y="126" class="ts">逐目录遍历</text>
  <line x1="137" y1="112" x2="149" y2="112" class="ln" marker-end="url(#f3m)"/>
  <rect x="153" y="76" width="132" height="72" rx="10" class="bx"/>
  <text x="167" y="102" class="tm">判版本</text>
  <text x="167" y="126" class="ts">v2 记录跳过（幂等）</text>
  <line x1="285" y1="112" x2="297" y2="112" class="ln" marker-end="url(#f3m)"/>
  <rect x="301" y="76" width="132" height="72" rx="10" class="bx"/>
  <text x="315" y="102" class="tm">备份原文件</text>
  <text x="315" y="126" class="ts">.bak 保留，可回滚</text>
  <line x1="433" y1="112" x2="445" y2="112" class="ln" marker-end="url(#f3m)"/>
  <rect x="449" y="66" width="212" height="92" rx="10" class="bx-good"/>
  <text x="463" y="92" class="tm">规范化重写 + 语义对账 + 原子替换</text>
  <text x="463" y="116" class="ts">tmp 写好后逐条对账：</text>
  <text x="463" y="136" class="ts">v1→v2 的语义投影 hash 必须为 0 差异</text>
  <line x1="661" y1="112" x2="673" y2="112" class="ln" marker-end="url(#f3m)"/>
  <rect x="677" y="66" width="178" height="92" rx="10" class="bx"/>
  <text x="691" y="92" class="tm">报告</text>
  <text x="691" y="116" class="ts">条数 / 字节数</text>
  <text x="691" y="136" class="ts">对账结果 · 失败明细</text>
  <path d="M 555 158 L 555 186 L 483 186 L 483 162" class="ln-dash" marker-end="url(#f3m)"/>
  <text x="583" y="190" class="ts">对账不一致 → 不动原文件、报错退出</text>
  <text x="25" y="222" class="ts">任何一步失败都不留半截状态：原文件在备份目录，重跑幂等。</text>
</svg>
<figcaption class="dsg-cap">图 2 · 迁移流程。"对账"是关键一步：迁移前后对每条记录做语义投影哈希比对，差异必须为零才允许替换。</figcaption>
</figure>

```bash
# 预演：只报告会改什么、能省多少字节，不写盘
wing-gateway migrate sessions --all --dry-run

# 真跑：逐 session 备份 + 重写 + 对账
wing-gateway migrate sessions --all --apply

# 回滚：从 .bak 恢复
wing-gateway migrate sessions --all --rollback
```

验收口径：

- **对账零差异**：每条记录迁移前后的语义投影哈希完全一致（语义 = 投影给模型/前端的全部字节）；
- **幂等**：v2 记录直接跳过，重复跑不产生变化；
- **体积**：以本机基线为准，预期落盘减少约 30%；
- **回滚**：`.bak` 在，恢复是纯文件操作。

## 七、代码怎么落地：关于 pydantic 的去留

先说现状之痛。当前 `Message` 模型上叠了三种"魔法"：

| 现象 | 本质 |
| --- | --- |
| `model_validator(wrap)` 负责"扁平入参 / 加载路由" | 在 pydantic 上补兼容逻辑 |
| `model_serializer(wrap)` 负责"导出派生平铺字段" | 在 pydantic 上手工维护第二个形态 |
| `PrivateAttr` + 属性 setter 拦截 | 双存储留下的痕迹 |

方向建议：**把"编解码"从模型里拿出来**。记录层的职责只有两个：(a) 表达事实；(b) 忠实编解码。它**不该**负责校验（数据是我们自己产出的），也不该把兼容逻辑藏在框架钩子里。容器本身退化成普通对象 —— 用 dataclass 还是朴素的 pydantic 都行，这是第二步的低风险选择题：

| 维度 | A 显式 codec + 普通容器（推荐） | B 在 pydantic 上增强 | C 换其他序列化库 |
| --- | --- | --- | --- |
| 往返保真 | 完全可控：null / 键序 / 版本一目了然 | 继续和 serializer 博弈 | 好，但要换生态 |
| 版本迁移 | codec 天然按版本分发 | 版本逻辑要塞进钩子 | 一般 |
| 边界校验（网关入口） | 不负责（本来也不该） | 强 | 中 |
| 改造成本 | 中：一次重写 schema 包 | 低 | 中 |
| 认知负担 | 低：普通函数 | 高 | 中 |

建议分两步走：**第一步**把编解码搬出模型（对外行为不变，一个 PR 可完成）；**第二步**再决定容器形态。避免"为换而换"，也为将来的配置系统留出同款机制（见同系列《Config v2》）。

## 八、影响面与落地计划

| 位置 | 改动 | 备注 |
| --- | --- | --- |
| `schema/` 消息与块 | 重写为普通对象 + 显式 codec | 属性名不变，消费方无感 |
| `chain` / `store` | 换用 codec；加 v 分发 | 存储接口不变（记录仍是 dict） |
| `serialize_message`（wire 投影） | 不动 | 前端零改动 |
| 上下文重建路径（rewind / compact） | 小改 | 改用新构造器 |
| provider 回放（读 `encrypted`） | 小改 | 预留字段就位 |
| fork 的 uuid 重映射 | 不动 | 只动顶层键 |
| Rust 前端 / SDK | 不动 | wire 不变 |
| 测试 / probe | 新增场景 | 迁移动线 + 回放对账 |
| 新增 CLI | `wing-gateway migrate sessions` | 见第六节 |

<ul class="dsg-tl">
<li><span class="ph">阶段 1</span><b>评审冻结格式</b>（本页）——输出：《记录格式 v2 规范》定稿，字段表与不变量逐条确认。</li>
<li><span class="ph">阶段 2</span><b>codec 层 + 双读 + 写侧切 v2</b>——新老并存窗口打开；单测覆盖往返 fuzz 与老记录逐条对账。</li>
<li><span class="ph">阶段 3</span><b>迁移工具上线</b>——dry-run 报告 + 对账 + 备份；日志在检测到 v1 记录时提示"可迁移回收空间"。</li>
<li><span class="ph">阶段 4</span><b>观测与收尾</b>——汇总迁移报告；v1 读侧保留多久、何时清退，另行评审。</li>
</ul>

验收标准（全部可自动化）：

- 迁移对账：v1 ↔ v2 语义投影差异 **= 0**；
- 真实会话样本落盘 **约 -30%**（本机基线 30.3% 副本）；
- Anthropic thinking 签名回放**逐字节不变**（probe 断言）；
- resume / fork / compact / rewind 跨版本全路径通过（probe 场景）。

## 九、开放问题（评审时定）

1. 事件记录是否也统一带 `v` 键（倾向：带，内容不变）？
2. "未知块原样保留"的实现细节（不透明容器 vs 跳过并告警）。
3. wire 投影将来若升级为块结构 —— 按本方案纪律只做替换、不做并存；时机另行评审。
4. 网关运行中在线迁移需要写锁协调 —— 本期不做，离线迁移已覆盖需求。
