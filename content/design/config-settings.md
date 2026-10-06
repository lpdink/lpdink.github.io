---
title: Config v2 · 配置项自己描述自己，设置不再改文件
date: 2026-10-06
status: proposed
order: 2
tags: [wing-agent, 配置系统, RFC]
description: 从"手写默认配置字符串"到"每个配置项自描述"：一份声明生成默认模板 / 设置目录 / 校验，并以 Setting API（HTTP + TUI）支撑改设置、即时生效、持久化。
---

> 状态：待评审。本文只谈设计、不动代码；与同系列《[Session 数据模型 v2](/design/session-format)》共用同一套方法论。

## TL;DR

- **现状**：配置的"默认值 + 注释"维护在两个地方 —— 一个 247 行的手写 YAML 字符串（`default_config.py`）和一个 383 行的 pydantic 模型（`models.py`）。两边互相写着 `SYNC` 注释 —— 这是纪律，不是机制。
- **后果**：没有一份**机器可读的设置面**。必填靠字符串占位符（`ChangeHere`）、枚举含义只存在于注释里 —— 于是 TUI 和 HTTP 接口根本"不认识"配置，用户只能打开文件手改。
- **方案**：每个配置项**声明一次**：默认值、说明、层次（归属哪个节）、必填、枚举及每种选项的含义、密文、生效域。由这份声明**生成**三样东西：默认配置模板（带注释）、设置目录（给 API / TUI 用）、校验规则。
- **产品面**：新增 **Setting API**（`GET schema` / `GET settings` / `PATCH settings`）。TUI 里改、HTTP 调用改；校验通过才落盘，落盘后走现有热重载管道**即时生效**，且跨重启持久化。
- **标准流程**：以后新增一个配置项 = 加一行声明 → 跑生成器 → 完成。文档、模板、API、界面、校验全部自动跟上。

## 一、问题：配置系统被"只用 pydantic"困住了

### 1.1 现状的两处死结

**死结一：同一份知识，维护两遍。** 默认值和文档文案，在两个文件里各写一遍：

<figure class="dsg-fig">
<div class="dsg-grid2">
<div>
<p class="dsg-col-h">default_config.py · 247 行</p>
<pre><code># 流式首块超时（秒）。
timeout_first_chunk: 300.0
&#160;
# SYNC: If Config gains new fields,
# this template must be updated
# manually.</code></pre>
</div>
<div>
<p class="dsg-col-h">models.py · 383 行</p>
<pre><code>timeout_first_chunk: float = 300.0
"""流式首块超时（秒）。"""
&#160;
# SYNC: Keep this file in sync with
# default_config.py when adding or
# removing fields.</code></pre>
</div>
</div>
<figcaption class="dsg-cap">两个文件互为镜像：同一份默认值与文档，一个活在字符串里被人类读，一个活在模型里被机器读；两边都标注"记得同步"。加一个配置项要动两处，漏一处就漂移。</figcaption>
</figure>

**死结二：没有机器可读的设置面。** 配置的全部"元信息"都锁在人类读的文本里：

- **必填**：用字符串占位符 `ChangeHere` 表达 —— 不是一种机制，是文本约定；
- **枚举**：`preset: opencode | qwen-code` 的可选值与含义只写在注释里，代码和 API 看不见；
- **生效域**：改了某项要重启还是即时生效？只有注释（和口口相传）知道。

结论：**任何设置界面（TUI 面板、HTTP 接口）都不可能凭空长出来** —— 因为没有任何一处声明告诉它"有哪些字段、是什么类型、可选值是什么、改完何时生效"。

### 1.2 为什么会这样

当时的想法是"只用 pydantic，不在上面做额外的东西"。于是：

- 默认模板只能是**手写的字符串**（pydantic 不会帮你生成带注释的 YAML）；
- 注释只能写进字符串里（模型的 docstring 不会被任何消费者读取）；
- 枚举含义、必填语义只能靠约定（pydantic 的类型系统不承载"含义"）。

<div class="dsg-stats">
<div class="dsg-stat hot"><b>2</b><span>两处维护：模板字符串 + 模型定义</span></div>
<div class="dsg-stat hot"><b>0</b><span>机器可读的设置面（字段 / 枚举含义 / 生效域）</span></div>
<div class="dsg-stat"><b>1 行</b><span>加配置项的理想成本（声明一次）</span></div>
<div class="dsg-stat cool"><b>3 份</b><span>产品化必需：模板、目录、校验（全部生成）</span></div>
</div>

## 二、设计原则（与 Session 方案同源）

<div class="dsg-chips">
<span class="dsg-chip is-accent">声明一次，其余生成</span>
<span class="dsg-chip is-accent">机器可读优先</span>
<span class="dsg-chip is-accent">缺席即默认</span>
<span class="dsg-chip is-accent">不可信输入在边缘校验</span>
</div>

- **声明一次，其余生成**：默认模板、设置目录、校验规则、文档 —— 都是**生成物**，不是手写物。和 Session 方案同一个思路：事实（声明）只有一份，其他形态靠生成。
- **机器可读优先**：任何"人类注释里才有的信息"（枚举含义、必填、生效域）必须同时是结构化数据 —— 否则界面和接口就无法消费它。
- **缺席即默认**：配置文件里不写的键 = 跟随代码里的默认值。想钉住旧值就显式写，想跟随升级就删掉它。
- **不可信输入在边缘校验**：配置文件是用户手写的，属于不可信输入 —— pydantic 继续作为**校验引擎**留在解析边界（这正是它与 Session 记录层的分工差别：那边是可信记录，这边是不可信输入）。

## 三、核心对象：SettingSpec（每个配置项的自我描述）

### 3.1 一个配置项要回答的问题

| 声明项 | 回答什么问题 | 例子 |
| --- | --- | --- |
| `default` | 默认值是什么 | `300.0` |
| `doc` | 这是什么 | "流式首块超时（秒）" |
| `required` | 不填能不能跑 | `base_url: 必填`（模板自动生成占位符） |
| `choices` | 枚举可选值 + **每种含义** | `openai: OpenAI 兼容协议…` |
| `secret` | 是否密文 | `api_key` |
| `apply` | 改完何时生效 | `hot` / `next-session` / `restart` |
| 层次 | 属于哪个节、如何复用 | 由 Section 类的继承与组合表达 |

### 3.2 声明长什么样（示意）

```python
# 配置声明：每一行都自带 默认值 / 说明 / 必填 / 枚举含义 / 生效域
class ProviderConfig(Section):
    name = S(required=True, doc="用户自定义标识，全局唯一")
    protocol = S(default="openai", doc="协议类型", choices={
        "openai":    "OpenAI 兼容协议（/chat/completions）",
        "anthropic": "Anthropic Messages 协议",
    })
    base_url = S(required=True, doc="服务端点", example="https://api.openai.com/v1")
    api_key  = S(required=True, doc="API 密钥", secret=True)
    timeout_first_chunk = S(default=300.0, doc="流式首块超时（秒）", apply=HOT)
    timeout_total       = S(default=600.0, doc="整单超时（秒）", apply=HOT)

# 复用靠继承 / 组合，而不是复制注释
class Eviction(Section):
    enabled          = S(default=True,    doc="空闲会话逐出总开关")
    idle_ttl_seconds = S(default=1800.0,  doc="空闲多少秒后逐出", apply=RESTART)
```

（`S(...)` 是声明速记，正式命名评审时定；底层仍是 pydantic 字段 —— 校验引擎不变，变的是"元信息第一次成为结构化数据"。）

### 3.3 生效域（apply）词表

| 值 | 含义 | 例子 |
| --- | --- | --- |
| `hot` | 保存后走热重载，立即生效 | provider 的超时 / 密钥 / extra_body |
| `next-session` | 新会话生效，进行中的会话保持不变 | agents 模板 |
| `restart` | 进程级设置，重启网关才生效 | `gateway.host` / `gateway.port` |

每个字段**必须**声明生效域 —— 这正是现状里"只有注释知道"的那类知识。API 回执与 TUI 徽标都据此展示"改完会发生什么"。

## 四、一份声明，三份生成物

<figure class="dsg-fig">
<svg viewBox="0 0 880 360" role="img" aria-label="一份声明生成三样东西：默认模板、设置目录、校验规则">
  <defs>
    <marker id="b1m" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z"/>
    </marker>
  </defs>
  <rect x="24" y="86" width="238" height="170" rx="12" class="bx-accent"/>
  <text x="40" y="114" class="tt">每个配置项 · 声明一次</text>
  <text x="40" y="142" class="ts">默认值 · 说明 · 注释</text>
  <text x="40" y="166" class="ts">必填 · 枚举 + 每种含义</text>
  <text x="40" y="190" class="ts">密文标记 · 生效域（apply）</text>
  <text x="40" y="214" class="ts">层次：Section 继承与组合</text>
  <text x="40" y="240" class="tm2">（唯一事实源）</text>
  <path d="M262 171 H298" class="ln" marker-end="url(#b1m)"/>
  <rect x="306" y="147" width="96" height="48" rx="10" class="bx"/>
  <text x="354" y="176" class="tt" text-anchor="middle">生成器</text>
  <path d="M402 171 H432 V76 H464" class="ln" marker-end="url(#b1m)"/>
  <line x1="402" y1="171" x2="464" y2="184" class="ln" marker-end="url(#b1m)"/>
  <path d="M402 171 H432 V292 H464" class="ln" marker-end="url(#b1m)"/>
  <rect x="470" y="40" width="386" height="72" rx="10" class="bx-good"/>
  <text x="486" y="68" class="tt">① 默认 config.yaml（带注释）</text>
  <text x="486" y="92" class="ts">必填自动生成 ChangeHere 占位 —— 取代手写模板</text>
  <rect x="470" y="148" width="386" height="72" rx="10" class="bx-good"/>
  <text x="486" y="176" class="tt">② 设置目录 Settings Catalog</text>
  <text x="486" y="200" class="ts">字段 / 枚举含义 / 生效域 / 密文 —— API 与 TUI 的渲染来源</text>
  <rect x="470" y="256" width="386" height="72" rx="10" class="bx-good"/>
  <text x="486" y="284" class="tt">③ 校验规则</text>
  <text x="486" y="308" class="ts">必填 / 枚举 / 范围 / 交叉检查 —— 解析与 PATCH 时执行</text>
  <rect x="24" y="304" width="412" height="44" rx="10" class="bx-dash"/>
  <text x="230" y="331" class="ts" text-anchor="middle">新增配置项 = 声明一次，其余全部自动跟上</text>
</svg>
<figcaption class="dsg-cap">图 1 · 声明 → 生成物。CI 增加一步"对账"：生成物必须与仓库里的文件完全一致，从机制上防漂移。</figcaption>
</figure>

### 4.1 生成物 ①：默认配置模板

```yaml
# ── LLM Providers ───────────────────────────────
# 配置一个或多个 LLM provider。每个 provider 声明协议、端点与凭据。
providers:
  - name: default
    protocol: openai            # openai | anthropic
                                #   openai    OpenAI 兼容协议（/chat/completions）
                                #   anthropic Anthropic Messages 协议
    base_url: ChangeHere        # 必填。如 https://api.openai.com/v1
    api_key: ChangeHere         # 必填。如 sk-xxx
    timeout_first_chunk: 300.0  # 流式首块超时（秒）
```

这段和现在的默认模板长得一样 —— **区别是它不再是手写的**：注释、默认值、枚举含义、必填占位全部来自声明，改声明即改模板。

### 4.2 生成物 ②：设置目录（Catalog）

```json
{
  "path": "providers[].timeout_first_chunk",
  "type": "float",
  "default": 300.0,
  "required": false,
  "doc": "流式首块超时（秒）",
  "choices": null,
  "secret": false,
  "apply": "hot"
}
```

这份目录是 Setting API 的骨架、TUI 表单的全部数据源，也是自动生成的配置文档的原料。

### 4.3 生成物 ③：校验与生成物对账

- 校验：解析配置文件 / 接受 PATCH 时，按声明执行必填、枚举、范围检查（pydantic 引擎不变）；
- 对账：CI 跑生成器，校验"生成物 == 仓库文件"，任何人改声明忘了跑生成器，直接红灯。

## 五、Setting API：把设置变成产品能力

<figure class="dsg-fig">
<svg viewBox="0 0 880 400" role="img" aria-label="Setting API 流程：客户端 PATCH，服务端校验、写盘、热重载、回执">
  <defs>
    <marker id="b2m" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z"/>
    </marker>
  </defs>
  <rect x="24" y="88" width="168" height="56" rx="10" class="bx"/>
  <text x="108" y="112" class="tt" text-anchor="middle">TUI 设置面板</text>
  <text x="108" y="132" class="ts" text-anchor="middle">/settings 命令</text>
  <rect x="24" y="252" width="168" height="56" rx="10" class="bx"/>
  <text x="108" y="276" class="tt" text-anchor="middle">HTTP 应用层</text>
  <text x="108" y="296" class="ts" text-anchor="middle">curl / CI / SDK</text>
  <line x1="192" y1="106" x2="242" y2="106" class="ln" marker-end="url(#b2m)"/>
  <text x="217" y="96" class="ts" text-anchor="middle">PATCH</text>
  <line x1="242" y1="130" x2="192" y2="130" class="ln-dash" marker-end="url(#b2m)"/>
  <text x="217" y="146" class="ts" text-anchor="middle">回执</text>
  <line x1="192" y1="270" x2="242" y2="270" class="ln" marker-end="url(#b2m)"/>
  <text x="217" y="260" class="ts" text-anchor="middle">PATCH</text>
  <line x1="242" y1="294" x2="192" y2="294" class="ln-dash" marker-end="url(#b2m)"/>
  <text x="217" y="310" class="ts" text-anchor="middle">回执</text>
  <rect x="248" y="36" width="372" height="328" rx="14" class="bx-soft"/>
  <text x="268" y="64" class="tt">Settings Service</text>
  <rect x="268" y="78" width="332" height="58" rx="10" class="bx"/>
  <text x="284" y="102" class="tm">① 对照设置目录校验</text>
  <text x="284" y="122" class="ts">任何一项非法 → 422，不写盘</text>
  <rect x="268" y="150" width="332" height="58" rx="10" class="bx"/>
  <text x="284" y="174" class="tm">② 合并 + 原子写 config.yaml</text>
  <text x="284" y="194" class="ts">tmp + fsync + rename；文件被外部改过 → 409</text>
  <rect x="268" y="222" width="332" height="58" rx="10" class="bx"/>
  <text x="284" y="246" class="tm">③ 热重载编排</text>
  <text x="284" y="266" class="ts">config → hooks → commands → provider → skills</text>
  <rect x="268" y="294" width="332" height="58" rx="10" class="bx"/>
  <text x="284" y="318" class="tm">④ 回执</text>
  <text x="284" y="338" class="ts">逐项结果；需重启的键单独标记</text>
  <line x1="620" y1="99" x2="658" y2="99" class="ln" marker-end="url(#b2m)"/>
  <line x1="620" y1="209" x2="658" y2="209" class="ln" marker-end="url(#b2m)"/>
  <line x1="620" y1="319" x2="658" y2="319" class="ln" marker-end="url(#b2m)"/>
  <rect x="664" y="70" width="192" height="58" rx="10" class="bx-good"/>
  <text x="680" y="94" class="tm">config.yaml</text>
  <text x="680" y="114" class="ts">磁盘上的规范形（持久化）</text>
  <rect x="664" y="180" width="192" height="58" rx="10" class="bx-good"/>
  <text x="680" y="204" class="tm">运行中的网关 / 会话</text>
  <text x="680" y="224" class="ts">provider 重建后即时生效</text>
  <rect x="664" y="290" width="192" height="58" rx="10" class="bx-good"/>
  <text x="680" y="314" class="tm">审计日志</text>
  <text x="680" y="334" class="ts">谁在何时改了什么（密文脱敏）</text>
</svg>
<figcaption class="dsg-cap">图 2 · Setting API：校验 → 写盘 → 热重载 → 回执，一条事务管道。写盘成功才谈生效；回执如实告知每一项的结果。</figcaption>
</figure>

### 5.1 端点

| 方法 / 路径 | 作用 | 说明 |
| --- | --- | --- |
| `GET /api/settings/schema` | 设置目录 | 驱动 TUI 表单与外部集成；含枚举含义、生效域、密文标记 |
| `GET /api/settings` | 当前生效值 | 密文掩码；附每项来源（默认 / 文件覆盖） |
| `PATCH /api/settings` | 修改设置 | `{set: {...}, unset: [...]}`；事务管道见上 |
| `POST /api/system/reload`（已有） | 重新加载 | "文件被手工改了"的入口；与 PATCH 共用同一条热重载管道 |

### 5.2 一次修改长什么样

```http
PATCH /api/settings
Authorization: Bearer <admin 角色的 key>

{ "set":   { "providers[0].timeout_first_chunk": 120.0,
             "gateway.auth.enabled": true },
  "unset": [ "log.level" ] }
```

```json
{
  "ok": true,
  "applied": {
    "providers[0].timeout_first_chunk": 120.0,
    "gateway.auth.enabled": true,
    "log.level": "（已回退默认）"
  },
  "reload": {
    "ok": true,
    "items": [
      { "name": "config.yaml", "ok": true },
      { "name": "provider", "ok": true, "detail": "rebuilt 3 session(s)" }
    ]
  },
  "restart_required": []
}
```

### 5.3 事务与安全语义

- **全有或全无**：任一字段非法 → 422 且定位到字段，**不写盘**；
- **原子写**：tmp + fsync + rename，永远不会留下半截文件；
- **冲突检测**：写前比对外部文件指纹（被编辑器改过）→ 409，提示先 reload 再改；
- **权限**：写操作要求 admin 角色；读走常规鉴权；
- **审计**：记录"谁 / 何时 / 改了哪些键"，密文值脱敏。

## 六、TUI 设置面板：设置目录的"免费"界面

<figure class="dsg-fig">
<svg viewBox="0 0 880 360" role="img" aria-label="TUI 设置面板线框：左分类、右表单、底部操作栏">
  <rect x="20" y="20" width="840" height="320" rx="14" class="bx-soft"/>
  <text x="40" y="46" class="tt">wing · 设置</text>
  <text x="840" y="46" class="ts" text-anchor="end">界面由设置目录渲染 · 新增配置项零界面代码</text>
  <line x1="20" y1="58" x2="860" y2="58" class="ln-dash"/>
  <rect x="36" y="72" width="200" height="26" rx="8" class="bx-accent"/>
  <text x="48" y="90" class="tm">Providers</text>
  <text x="48" y="122" class="tm2">Agents</text>
  <text x="48" y="148" class="tm2">Gateway</text>
  <text x="48" y="174" class="tm2">Auth</text>
  <text x="48" y="200" class="tm2">Sessions</text>
  <text x="48" y="226" class="tm2">Images</text>
  <text x="48" y="252" class="tm2">Logging</text>
  <text x="48" y="278" class="tm2">User-Agent</text>
  <rect x="268" y="72" width="576" height="46" rx="10" class="bx"/>
  <text x="284" y="99" class="tm">timeout_first_chunk</text>
  <rect x="470" y="82" width="104" height="26" rx="6" class="bx-soft"/>
  <text x="486" y="99" class="tm">300.0</text>
  <text x="592" y="99" class="ts">默认 300.0 · 生效：热（provider 重建）</text>
  <rect x="268" y="130" width="576" height="46" rx="10" class="bx"/>
  <text x="284" y="157" class="tm">protocol</text>
  <rect x="470" y="140" width="104" height="26" rx="6" class="bx-soft"/>
  <text x="486" y="157" class="tm">openai ▾</text>
  <text x="592" y="157" class="ts">枚举：openai / anthropic · 含义随目录下发</text>
  <rect x="268" y="188" width="576" height="46" rx="10" class="bx"/>
  <text x="284" y="215" class="tm">api_key</text>
  <rect x="470" y="198" width="104" height="26" rx="6" class="bx-soft"/>
  <text x="486" y="215" class="tm">●●●●●●</text>
  <text x="592" y="215" class="ts">密文：只写不回显，审计脱敏</text>
  <rect x="268" y="246" width="576" height="46" rx="10" class="bx"/>
  <text x="284" y="273" class="tm">gateway.port</text>
  <rect x="470" y="256" width="104" height="26" rx="6" class="bx-soft"/>
  <text x="486" y="273" class="tm">32523</text>
  <text x="592" y="273" class="ts">生效：重启网关进程</text>
  <line x1="20" y1="306" x2="860" y2="306" class="ln-dash"/>
  <text x="40" y="330" class="ts">[a] 应用　[r] 重置为默认　[Esc] 关闭</text>
  <text x="840" y="330" class="ts" text-anchor="end">应用后展示逐项回执：config → hooks → commands → provider → skills</text>
</svg>
<figcaption class="dsg-cap">图 3 · TUI 设置面板线框（复用已有选择面板内核）。因为它完全由设置目录驱动，以后新增配置项不需要写任何 TUI 代码。</figcaption>
</figure>

## 七、新增配置项的标准流程

这就是"让代码变干净"的直接兑现 —— 从今往后，加配置项是一条**固定流水线**：

<ol class="dsg-tl">
<li><span class="ph">STEP 1</span><b>加一行声明</b><p>在所属 Section 里写清：默认值、说明、必填与否、枚举与含义、生效域。</p></li>
<li><span class="ph">STEP 2</span><b>跑生成器</b><p>模板与设置目录随声明更新；CI 对账兜底，漏跑直接红灯。</p></li>
<li><span class="ph">STEP 3</span><b>完成</b><p>默认模板、Setting API、TUI 面板、校验、配置文档 —— 全部自动覆盖。</p></li>
</ol>

## 八、兼容与迁移

- **现有 config.yaml 原样可读**：未知键忽略、缺失键取默认 —— 升级后不用改文件、不用重启即用；
- **默认模板从手写切换为生成物**：首迁做一次人工 diff 评审，确认注释与结构与现模板等价后替换；
- **首次经 API 写盘**会把文件重写成规范形（注释来自声明，永远最新）。注意：**重写会丢用户手写的自定义注释** —— 写前支持 dry-run 预览 diff，文件顶部也有一段固定注释说明这一点；
- **键改名 / 删除**：声明层预留 deprecated 标记与迁移提示（后续版本，不在本期范围）。

## 九、计划与验收

<ul class="dsg-tl">
<li><span class="ph">阶段 1</span><b>声明层 + 生成器</b><p>默认模板改由生成；CI 加对账。可独立合并、无产品面风险。</p></li>
<li><span class="ph">阶段 2</span><b>只读设置面</b><p>设置目录 + <code>GET schema</code> / <code>GET settings</code>；TUI 可先渲染只读视图。</p></li>
<li><span class="ph">阶段 3</span><b>写面</b><p><code>PATCH</code> + 热重载编排 + 鉴权与审计。</p></li>
<li><span class="ph">阶段 4</span><b>TUI 设置面板</b><p>目录驱动渲染；应用回执展示。</p></li>
</ul>

验收标准：

- 首迁模板 diff 评审通过；CI `check-config` 常绿；
- probe 场景：PATCH 生效（假 provider 断言请求体变化）、重启后保持、非法值 422 不写盘、外部改文件后 PATCH 409；
- TUI smoke：目录驱动渲染、枚举可选、应用回执展示。

## 十、开放问题（评审时定）

1. `providers` / `agents` 这类**列表项的增删**（新增一个 provider、删除一个 agent）本期明确为边界外：只改既有键；结构调整仍走文件编辑。二期评估。
2. `gateway.host` / `port` / `auth` 的进程级热应用需要网关启动流程改造 —— 本期标记 `restart`，不做假热更。
3. TUI 自己的配置文件（Rust 侧，`~/.wing/tui/config.yaml`）是否并入同一设置目录 —— 跨语言，另行评估。
4. 写盘时用户手写注释的保留策略：推荐"规范形重写"（简单、可版本化）；若后续有强诉求再考虑保留式 YAML 读写。
