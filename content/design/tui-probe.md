---
title: 让 Agent 坐到 TUI 面前 · 用户路径体验测试台（tui-probe）
date: 2026-10-10
status: accepted
order: 3
tags: [wing-agent, 测试, Agent, RFC]
description: 把真 wing 二进制与真终端语义做成可编程测试台——假 Provider 喂模型、场景代码当用户、帧产物当眼睛、后端断言当语义对账，让 Agent 与 CI 像用户一样验收体验。
---

> 状态：已采纳（方向与形态定稿，实现按文末里程碑推进）。本文只谈设计与机制；与同系列《[Session 数据模型 v2](/design/session-format)》《[Config v2](/design/config-settings)》共享同一套方法论——事实只有一份，其余靠生成/投影。

## TL;DR

- **现状**：整机测试已经很强，但全部**绕开前端**。协议级 probe（48 个场景文件 / 121 个用例）把网关当黑盒；app 层单测（`app/tests/**`，15 个文件）把 widget 当可断言对象——**没有一层覆盖"真二进制 + 真终端 + 真事件循环"的用户路径**。
- **后果**：像 PR 180（设置面板 / 首次运行向导 / `wing config`）这类"几乎全是手感"的改动，只能靠人肉验收。Agent 写代码很快，但"按一个键屏幕该有什么反应"没人替它验。
- **方案**：建**用户路径体验测试台（tui-probe）**——把 "真 wing 二进制 + 真终端语义" 做成可编程装置：假设 Provider 喂模型（复用 probe 的假 Provider），tmux 当真终端（按键注入 / 屏幕捕获），场景代码当用户，帧产物当眼睛，后端断言当语义对账。
- **形态**：两种用法同一套内核——**pytest 场景**（回归 / CI，仓库"场景=代码"的惯例）与 **CLI 原子动词 / steps**（Agent 探索，一条命令一个动作、产物落盘）。
- **边界**：不追像素级 golden；不覆盖 IME / 真终端协议差异 / Windows；机械断言进 CI，主观体验判定归 Agent 报告。
- **落位**：`libs/wing-probe/wing_probe/tui/` + `libs/wing-probe/scenarios_tui/`；`make test-tui` 独立目标，CI 新增 `tui-check` job；评审流程（wing-review）增补 UX 段。

## 一、问题：用户坐在前面，测试却都绕着他走

### 1.1 现有测试矩阵里的盲区

<div class="dsg-stats">
<div class="dsg-stat cool"><b>121</b><span>协议级整机用例（wing-probe）——后端语义的红线全部钉死</span></div>
<div class="dsg-stat"><b>15</b><span>app 层单测文件（TestBackend + 合成事件）——widget 与布局的真实渲染</span></div>
<div class="dsg-stat hot"><b>0</b><span>覆盖"真 TUI 用户路径"的自动化装置</span></div>
<div class="dsg-stat"><b>1</b><span>条被反复依赖的替代品——人肉点一遍</span></div>
</div>

| 装置 | 层级 | 能覆盖 | 盖不住的 |
| --- | --- | --- | --- |
| `libs/wing-probe`（48 个场景文件） | 协议级整机 | 事件时间线、请求上下文、落盘红线、workspace 文件 | 前端一切：没人操作 TUI |
| `crates/wing/src/app/tests/**` | 组件级 | 真 widget、真布局、按键路径、Esc 阶梯；帧级断言 | 不是真进程 / 真终端 / 真事件循环；Agent 不可用 |
| `crates/wing/tests/**`（acp / stdio / preflight） | 二进制级 | headless 形态的真进程红线（如 stdout 零字节、退出码 78） | TUI 形态 |
| `scripts/demo`（record.py，820 行） | 真 TUI + 假 Provider | **机制全部可行**：隔离环境、gate、ESC[6n 应答、真彩捕获、cast/GIF | 为"录素材"而生：单向、无输入原语、无断言、无 Agent 产物 |

结论：**缺的不是"更厚的单测"，而是"假用户把 TUI 当黑盒"的整套东西** —— 驱动（输入）、观察（可读产物）、同步（等待原语）、场景（用户旅程的代码表达）、判定（体验清单 + 语义对账），一个都没有。而 demo 管线恰恰证明底层机制全都成立，只差把它"测试台化"。

### 1.2 PR 180 复盘：一个几乎全是"手感"的 PR

以设置面板那次改动（[#180](https://github.com/lpdink/wing-agent/pull/180)）为例，用户能感受到的东西是：

<figure class="dsg-fig">
<svg viewBox="0 0 880 210" role="img" aria-label="PR 180 的三类用户可见行为：键位与阶梯、回执与错误、首次运行向导">
  <rect x="30" y="26" width="256" height="156" rx="12" class="bx"/>
  <text x="50" y="56" class="tt">键位与 Esc 阶梯</text>
  <text x="50" y="84" class="ts">面板导航 / 编辑器 / 搜索 /</text>
  <text x="50" y="104" class="ts">脏改动确认，七级 Esc 命中即停</text>
  <text x="50" y="140" class="tm2">按错了会怎样？按了没反应？</text>
  <text x="50" y="160" class="tm2">80 列底下挤不挤？</text>
  <rect x="312" y="26" width="256" height="156" rx="12" class="bx"/>
  <text x="332" y="56" class="tt">回执与错误态</text>
  <text x="332" y="84" class="ts">保存成功 toast / 失败自动切到</text>
  <text x="332" y="104" class="ts">问题清单 / 需重启的提示</text>
  <text x="332" y="140" class="tm2">回执看得见吗？密钥会回显吗？</text>
  <text x="332" y="160" class="tm2">保存后到底写没写盘？</text>
  <rect x="594" y="26" width="256" height="156" rx="12" class="bx"/>
  <text x="614" y="56" class="tt">首次运行向导</text>
  <text x="614" y="84" class="ts">坏配置 → 降级启动 → 修复 →</text>
  <text x="614" y="104" class="ts">保存 → 继续进入主界面</text>
  <text x="614" y="140" class="tm2">每条出路都能走通吗？</text>
  <text x="614" y="160" class="tm2">修完之后真的能进来吗？</text>
</svg>
<figcaption class="dsg-cap">图 1 · PR 180 的用户可见面。每一格里都是"按了才知道"的东西：前面三格是体验，最后一格是体验 + 语义。</figcaption>
</figure>

现有保障对上这三格：

- **app 单测**覆盖了"组件内逻辑"——比如 Esc 阶梯的状态机、面板的绘制落点。但它走的是 `handle_key` 直调 + `TestBackend` 渲染：**没有真进程、没有真终端、没有完整事件循环**（`run_app` 的选择循环、意图队列、WS 事件流、动画档期全在它之外）。
- **probe 场景**覆盖了"后端语义"——设置 API 的保存事务、setup mode 降级、指纹冲突，全在网关上真跑。但屏幕长什么样，它不知道。
- **人肉点一遍**覆盖了全部——但不可重复、不可回归、不能交给 Agent。

<div class="dsg-callout is-bad">
<p><span class="dsg-ct">评审的盲区：</span>评审看得见 diff，看不见手感。一个 <code>Esc</code> 层级写反、一个回执被盖住、一个面板在 80 列下被截断——这些在代码里几乎不产生"可疑行"，只有真的坐在 TUI 前按一遍才会现形。</p>
</div>

### 1.3 为什么不能靠"把 app 单测写厚点"

1. **真事件循环**：节流/合帧、动画截止期、重连与意图队列、图片 lane——只有 `run_app` 里才存在；
2. **真终端**：crossterm 的按键解析（含 kitty 键盘协议与鼠标上报）、备用屏进出、尺寸变化——只有真 tty 才存在；
3. **真二进制**：参数解析、配置发现、网关接线、启动预检——只有真进程才存在。

这三样恰好是"用户路径"的定义。补法只有一条：**把真二进制放进真终端里，然后像用户一样驱动它。**

## 二、设计原则

<div class="dsg-chips">
<span class="dsg-chip is-accent">真用户路径优先</span>
<span class="dsg-chip is-accent">谓词等待，禁 sleep 断言</span>
<span class="dsg-chip is-accent">场景 = 代码</span>
<span class="dsg-chip is-accent">产物即证据</span>
<span class="dsg-chip is-accent">机械与主观分离</span>
<span class="dsg-chip is-accent">零污染隔离</span>
</div>

- **真用户路径优先**：真 `wing` 二进制、真终端语义（tmux 当那个终端）、真网关、真工具执行；假掉的只有模型输出（假 Provider 剧本）。
- **谓词等待**：所有同步都锚在可观测事实（屏幕文本 / OSC 标题 / 会话状态 / 文件字节 / 进程退出）上，不用 `sleep` 驱动断言；开屏海鸥、思考刷光是常驻动画，"屏幕静止"从来不是可靠判据。
- **场景 = 代码**：与 probe 同款纪律——剧本与步骤写在测试函数里，不发明配置文件方言；Agent 要探索时可以写 steps 文件，但它是同一套原语的另一种拼写。
- **产物即证据**：每步落下帧、diff、transcript；失败时连原始字节流（pane.raw）与网关日志一起进 artifacts——给 Agent 复盘、给 CI 排障、给 PR 附证。
- **机械与主观分离**：文本出现/消失、文件字节、退出码这类机械项进 CI；"好不好看、顺不顺手"归 Agent 按清单判定，产出分级报告，不做 CI 门禁。
- **零污染隔离**：专属 tmux socket + `-f /dev/null` + 临时 `WING_HOME` + OS 分配端口——不碰用户的 `~/.wing`、端口与 tmux；可以随便在开发机上与真实会话并存。

## 三、装置总览：四层

<figure class="dsg-fig">
<svg viewBox="0 0 880 436" role="img" aria-label="tui-probe 四层装置：场景层、驱动层、环境层、被测物与产物">
  <defs>
    <marker id="t1m" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z"/>
    </marker>
  </defs>
  <text x="34" y="42" class="tm">场景层</text>
  <rect x="180" y="14" width="520" height="50" rx="12" class="bx-accent"/>
  <text x="200" y="36" class="tt">用户旅程，写成代码或步骤</text>
  <text x="200" y="54" class="ts">pytest 场景（回归 / CI）  ·  CLI 原子动词 / steps 文件（Agent 探索）</text>
  <line x1="440" y1="64" x2="440" y2="84" class="ln" marker-end="url(#t1m)"/>
  <rect x="120" y="86" width="640" height="118" rx="14" class="bx-soft"/>
  <text x="140" y="112" class="tt">TuiDriver · tmux 真终端后端</text>
  <rect x="136" y="124" width="146" height="66" rx="10" class="bx"/>
  <text x="148" y="146" class="tm">输入</text>
  <text x="148" y="164" class="ts">键 · 鼠标 · 粘贴 · resize</text>
  <text x="148" y="181" class="tm2">等同终端字节</text>
  <rect x="294" y="124" width="146" height="66" rx="10" class="bx"/>
  <text x="306" y="146" class="tm">观察</text>
  <text x="306" y="164" class="ts">帧文本 · 风格 · 标题</text>
  <text x="306" y="181" class="tm2">会话状态</text>
  <rect x="452" y="124" width="146" height="66" rx="10" class="bx"/>
  <text x="464" y="146" class="tm">同步</text>
  <text x="464" y="164" class="ts">谓词等待（文本 / 标题</text>
  <text x="464" y="181" class="ts">/ 空闲 / 文件）</text>
  <rect x="610" y="124" width="140" height="66" rx="10" class="bx"/>
  <text x="622" y="146" class="tm">产物</text>
  <text x="622" y="164" class="ts">frames · transcript</text>
  <text x="622" y="181" class="ts">diffs · report</text>
  <line x1="260" y1="204" x2="260" y2="258" class="ln" marker-end="url(#t1m)"/>
  <text x="272" y="234" class="ts">tmux：按键 / 捕获</text>
  <line x1="620" y1="204" x2="620" y2="258" class="ln" marker-end="url(#t1m)"/>
  <text x="632" y="234" class="ts">HTTP / WS 观测</text>
  <rect x="80" y="258" width="360" height="110" rx="12" class="bx"/>
  <text x="100" y="286" class="tt">真 wing TUI</text>
  <text x="100" y="310" class="ts">真二进制 · 真终端语义 · 真事件循环</text>
  <text x="100" y="336" class="tm2">被测物：用户看到的一切</text>
  <rect x="560" y="258" width="240" height="110" rx="12" class="bx-good"/>
  <text x="580" y="286" class="tt">ProbeEnv</text>
  <text x="580" y="310" class="ts">假 Provider（剧本）</text>
  <text x="580" y="330" class="ts">真网关 · 临时 WING_HOME</text>
  <text x="580" y="352" class="tm2">隔离：不碰 ~/.wing</text>
  <line x1="440" y1="313" x2="560" y2="313" class="ln" marker-end="url(#t1m)"/>
  <text x="472" y="305" class="ts">WS</text>
  <path d="M760 145 H812 V411 H716" class="ln-dash" marker-end="url(#t1m)"/>
  <rect x="196" y="391" width="520" height="38" rx="10" class="bx-warn"/>
  <text x="216" y="415" class="ts">产物目录：Agent 复盘 / CI 门禁 / PR 证据（帧 · 差异 · 逐字记录 · 报告）</text>
</svg>
<figcaption class="dsg-cap">图 2 · 四层装置。场景代码驱动 TuiDriver；TuiDriver 用 tmux 控制并捕获真 TUI、用 HTTP / WS 观测环境；ProbeEnv 供给假 Provider 与真网关；产物供 Agent、CI 与 PR 消费。</figcaption>
</figure>

### 3.1 驱动层：为什么是 tmux，以及已实测的证据

要"像用户"，输入与观察必须走终端这一层。备选方案里（见第八节），**tmux 是那个现成的、正确的终端仿真器**：它维护屏幕状态、处理 resize、把 pane 的字节流解释成屏幕——正是我们要的"真终端语义"。以下机制已在本机（tmux 3.7c）实测：

| 机制 | 实测结论 | 用途 |
| --- | --- | --- |
| `capture-pane -p / -e` | 输出合法 UTF-8，宽字符逐字素保真，真彩 SGR 原样保留 | 文本帧 / 风格帧 / PNG 快照的原料 |
| `send-keys -l` 原始字节 | 可注入 `ESC[<0;5;3M`（SGR 鼠标）、`ESC[13;2u`（kitty 键盘协议）、`0x7f` 等任意字节 | 字节级等同真终端的按键 / 鼠标输入 |
| detached `new-session -x / -y` | pane 尺寸**精确**等于给定值（实测 40×6）；`resize-window` 生效 | 终端尺寸成为确定性测试参数 |
| OSC 0 标题 | `#{pane_title}` 可读（实测 `wing • workspace`）；应用已经写 `☾ wing`（空闲）/ spinner（工作）/ `❓ ⚠ ✓`（等待 / 出错 / 完成） | 天然的**就绪 / 状态**等待锚点，不靠猜屏幕 |
| 专属 socket + `-f /dev/null` | 不读用户 tmux 配置、不碰用户会话；可 attach 给人看 | 隔离 + 可协作 |
| 查询应答（ESC[6n 等） | detached tmux 不代答；`record.py` 的 gate 文件 + 应答方案成熟可复用 | 首帧必达 |
| 行规程边界 | raw mode 之前注入控制字节会撞行规程（实测 `C-c` 直接 SIGINT 掉 pane） | 只在 gate 放行（TUI 已接管）后注入 |

一句话：**record.py 是它的"单向兄弟"**——同一套 tmux / 假 Provider / 隔离环境经验，但 tui-probe 是双向的（输入 + 观察）、可同步的（谓词等待）、带断言的、产 Agent 读物的。

### 3.2 环境层：与 wing-probe 完全同源

场景不另起一套环境：直接复用 `ProbeEnv`——进程内假 Provider（按 model 名路由剧本）、临时 `WING_HOME`、真网关子进程、OS 分配端口。于是：

- **模型输出可编排**：流式分片、工具调用、延迟窗口——probe 剧本模型原样可用；
- **语义观测原样复用**：`watch`（事件时间线）、`history`（落盘红线）、`files`（workspace）、请求留档；
- **启动形态可编排**：`config_text` 可注入"坏到不能启动"的配置（首次运行向导场景），`connect=False` 适配 setup mode。

TUI 以 `wing tui --host 127.0.0.1 --port <env>` **直接定向启动**（跳过"自动拉起网关"的兜底路径），cwd = 场景 workspace，`WING_HOME` = 临时家目录。

### 3.3 场景层：同一内核，两种拼写

**A. pytest 场景（回归 / CI）**——仓库既有惯例，断言锚定在屏幕与后端两侧：

```python
@pytest.mark.tui
async def test_settings_save_tells_the_truth(tui, probe):
    await tui.start()                                   # 真 wing · 100x30 · 就绪=标题
    await tui.type("/settings"); await tui.key("Enter")
    await tui.wait_text("设置")                          # 面板打开（谓词等待）
    await tui.search("color")                           # 用户旅程：搜索 → 编辑 → 保存
    await tui.key("s")

    tui.screen().assert_contains("已保存")               # 屏幕侧：回执可见、密钥不明文
    assert "$WING_HOME/config.yaml" 的字节真的变了        # 语义侧：写盘发生且原子
    probe.history(...).assert_chain_invariants()         # 沿用 probe 红线
    tui.snapshot("saved")                                # 产物：帧 + diff 落盘
```

**B. CLI 原子动词 / steps（Agent 探索）**——一条命令一个动作，天然贴合 Agent 的 bash 回合：

```bash
python -m wing_probe.tui start --cols 100 --rows 30     # 自举环境 + 启动真 TUI
python -m wing_probe.tui key ctrl+r                      # 按键
python -m wing_probe.tui shot after-restart              # 拍帧（文本 / 风格 / 可选 PNG）
python -m wing_probe.tui wait text "已重启" --timeout 10  # 谓词等待
python -m wing_probe.tui screen --ruler                  # 带行号列标，便于引用
python -m wing_probe.tui status --json                   # 机读状态
python -m wing_probe.tui play steps.txt                  # 批量：每行一个动作
python -m wing_probe.tui stop                            # 收尾 + 清理
```

`--keep` 保留现场，打印 `tmux -L <socket> attach` 命令——人可以随时接手看。

### 3.4 观测层：两侧同拍，才算完整端到端

<figure class="dsg-fig">
<svg viewBox="0 0 880 224" role="img" aria-label="一次场景同时断言屏幕侧与语义侧">
  <defs>
    <marker id="t2m" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
      <path d="M0,0 L10,5 L0,10 z"/>
    </marker>
  </defs>
  <rect x="320" y="16" width="240" height="46" rx="12" class="bx-accent"/>
  <text x="440" y="44" class="tt" text-anchor="middle">一次场景 · 两侧同拍断言</text>
  <line x1="400" y1="62" x2="280" y2="92" class="ln" marker-end="url(#t2m)"/>
  <line x1="480" y1="62" x2="600" y2="92" class="ln" marker-end="url(#t2m)"/>
  <rect x="60" y="96" width="340" height="112" rx="12" class="bx"/>
  <text x="80" y="124" class="tt">屏幕侧（TUI 当黑盒）</text>
  <text x="80" y="150" class="ts">帧文本 / 风格 / 标题 / 会话状态</text>
  <text x="80" y="174" class="tm2">例：回执出现 · 未出现明文密钥 · 键位栏可读</text>
  <text x="80" y="194" class="tm2">例：按一下键屏幕确实变了（帧差异非空）</text>
  <rect x="480" y="96" width="340" height="112" rx="12" class="bx-good"/>
  <text x="500" y="124" class="tt">语义侧（后端当黑盒）</text>
  <text x="500" y="150" class="ts">事件时间线 / 请求上下文 / 落盘 / 文件</text>
  <text x="500" y="174" class="tm2">例：config.yaml 已变更 · 无瞬态落盘</text>
  <text x="500" y="194" class="tm2">例：tool 配对完整 · 会话回到 idle</text>
</svg>
<figcaption class="dsg-cap">图 3 · 体验测试的判据有两条腿：屏幕上发生了什么，和系统里真的发生了什么。tui-probe 的价值就在于把两条腿放进同一条场景。</figcaption>
</figure>

## 四、能力面

### 4.1 输入原语

| 原语 | 说明 | 底层 |
| --- | --- | --- |
| `type(text)` | 逐字键入（含中文 / emoji） | `send-keys -l` 字面字节 |
| `key(spec)` | 命名按键：`Enter` / `Tab` / `Shift+Tab` / `Esc` / 方向 / `PageUp` / `F1` / `Ctrl+R` / `Alt+Enter`… | tmux 键名 + 扩展键原始字节（CSI-u） |
| `paste(text)` | 括号粘贴（bracketed paste） | `ESC[200~ … ESC[201~` |
| `click / drag / wheel` | 鼠标：SGR 编码坐标 | `ESC[<b;x;yM/m` 原始字节 |
| `resize(cols, rows)` | 终端尺寸变化（含 SIGWINCH） | `resize-window` |

### 4.2 等待原语（全部为谓词）

| 原语 | 等待什么 |
| --- | --- |
| `wait_text / wait_text_gone` | 屏幕出现 / 消失某文本（支持正则与超时） |
| `wait_title(pred)` | OSC 标题（`☾ wing` / spinner / `❓⚠✓`）——就绪、工作中、等待用户 |
| `wait_idle()` | 网关侧会话回到空闲（HTTP 观测，绕开屏幕） |
| `wait_file(path, pred)` | 文件出现 / 内容满足条件（语义侧事实） |
| `wait_stable(quiet, max)` | 辅助：连续两次捕获一致——动画屏上明确不可靠，仅作点缀 |

### 4.3 产物规格（Agent 读什么）

| 产物 | 内容 | 用途 |
| --- | --- | --- |
| `screen-latest.txt` | 当前屏幕纯文本（保留前导空格） | Agent 随手读 |
| `frames/NNN-label.txt / .ansi` | 每步快照；`.ansi` 保留真彩 SGR | 观感 / 颜色 / 选择态检查 |
| `diffs/NNN.diff` + `transcript.jsonl` | 帧间差异；每步动作 / 耗时 / 标题 / 状态 / 变化行数 | **"按了没反应 / 屏幕跳变"类问题的第一信号** |
| `frames/*.png`（可选） | 复用 demo 的 agg 管线渲染 | 喂 `read_image`（视觉模型）或贴报告 |
| `pane.raw` | pty 原始字节流（含查询应答） | 退出序列（`?1049l` / `?1000l`）断言、深排查 |
| `logs/`、`report.md` | 网关 / TUI 日志；场景自述 + 断言结果 + 失败诊断 | 复盘与排障 |

失败现场沿用 probe 的转储纪律：帧 + transcript + pane.raw + 请求留档 + 网关日志一起进 artifacts，终端汇总打印路径。

### 4.4 判定口径

<div class="dsg-callout is-good">
<p><span class="dsg-ct">机械项进 CI：</span>文本出现 / 消失、面板开合、文件字节变化、退出码、终端恢复序列、无 panic、会话状态与落盘红线（沿用 probe 不变量）。这些不依赖"审美"，可以当门禁。</p>
</div>

<div class="dsg-callout is-warn">
<p><span class="dsg-ct">主观项归 Agent：</span>布局呼吸感、提示可发现性、颜色对比、文案、动画观感——Agent 按清单逐条走查，按阻塞 / 建议 / 提示三级报发现，附帧证据（帧文本 + 行号 + 可选 PNG）。不进 CI 门禁，进评审流程。</p>
</div>

## 五、首批场景：用 PR 180 验收基础设施

| 场景 | 抓什么（体验 + 语义同拍） |
| --- | --- |
| `smoke` 开屏 → 提问 → 流式 → 工具卡 → 收尾 | 全链路真实；退出后终端恢复序列完整、退出码干净 |
| `settings-walkthrough` | `/settings` 开面板、Tab 切根、搜索、展开 / 编辑、Esc 七级阶梯（含脏改动确认） |
| `settings-save` | 改 Gateway 值 → 保存 → 回执 toast + **配置文件字节** + 需重启提示路径 |
| `interface-preview` | Interface 根改颜色 → 屏幕真的变色（风格帧对比）→ Esc 回退且文件未写 |
| `first-run-wizard` | 坏配置 → setup 屏 → 键盘修复 → 保存 → **继续进入主界面**（真实"从坏到好"全程） |
| `ask-and-interrupt` | 危险命令确认（n / y）、流式中断；后端事件与落盘对账 |
| `resize-ladder` | 130×40 ↔ 80×24 ↔ 40×12：状态栏 / 输入卡 / 面板不塌、不倒 |
| `composer-keys` | `Shift+Enter` / `Ctrl+J` 换行、粘贴、`↑` 历史、斜杠弹窗选择 |

这套打完，PR 180 类问题（80 列挤压、Esc 阶梯错位、预览不即时、回执被盖住、向导死路）就有了可回归、可探索的抓手；同时它也是基础设施自身的验收——如果这八个场景写不顺，说明原语设计有问题。

## 六、工作流接合

- **`make test-tui`**：独立目标；`make test-probe` 显式排除 `scenarios_tui/`，两边互不拖累。场景间零共享（独立 tmux socket + 独立 ProbeEnv），可 xdist 并行；
- **CI `tui-check` job**：装 tmux（ubuntu-latest 一条 apt 即可），跑确定性最强的核心场景；`make test` 主流程默认不带上它（慢且平台敏感）；
- **评审（wing-review）增补 UX 段**：UI 相关改动，派子 agent 跑场景 + 按需探索，产出三级报告——这正是 PR 180 缺失的那一段；
- **PR 证据**：场景产物可直接附 PR（帧文本 / 差异 / 报告）；可选把整场录成 GIF（复用 demo 的 cast → agg 管线）贴进 PR；
- **文档与技能**：`docs/dev/tui-testing.md` 登记机制与用法；技能文件固化"Agent 怎么做 UX 走查"的操作步骤。

## 七、里程碑

<ul class="dsg-tl">
<li><span class="ph">M0</span><b>驱动验证（半天级）</b><p>tmux 后端骨架 + smoke 场景跑通（启动 → 提问 → 流式 → 退出），验证第六节 6 条机制全部成立。</p></li>
<li><span class="ph">M1</span><b>基建（1–3 天级）</b><p>TuiDriver 全量原语 + 产物层 + CLI + pytest fixture + 文档；2–3 个种子场景。</p></li>
<li><span class="ph">M2</span><b>实战（1–2 天级）</b><p>PR 180 类场景铺开（设置面板 / 保存 / 向导）+ 第一次 Agent UX 走查实战，把方法固化成技能。</p></li>
<li><span class="ph">M3</span><b>收口（1 天级）</b><p>make test-tui + CI job + wing-review UX 段；可选增强（PNG / GIF 证据、动画旋钮、语义状态通道）。</p></li>
</ul>

## 八、风险、边界与"为什么不是别的路"

| 风险 / 边界 | 处置 |
| --- | --- |
| tmux 依赖 | demo 管线已经依赖它（README 有明确说明）；CI 一条 apt；驱动接口与后端解耦，未来可替换为 pty + 终端仿真 |
| 动画噪声（开屏海鸥、思考刷光） | 全部等待谓词化，明确不追像素级 golden；需要静帧时用"内容区域断言"而非整屏对比 |
| 不覆盖 IME / 真终端协议差异 / Windows | 文档明示边界；中文输入直接用 `type` 注入最终文本；图形协议（kitty / iTerm）不承诺 |
| 主观判定 | 机械项与主观项分离（见 4.4），主观项只进评审报告 |
| 场景速度 | 单场景 10–30 秒量级；靠并行摊；CI 只跑核心子集 |
| PNG 字体（CJK 豆腐块） | PNG 为可选路径，字体缺失自动退纯文本，不阻塞任何断言 |

"为什么不是别的路"：

| 备选 | 为什么不是它 |
| --- | --- |
| 纯 in-process（TestBackend 跑 `run_app`） | 覆盖不到真终端 / 真二进制 / 真事件循环；app 层单测已占位；可作未来补充而非本方案 |
| Rust pty + 自研终端仿真 | 自包含，但引入终端仿真正确性风险、失去 attach 可看性、重复 tmux 已有能力——保留为可替换后端 |
| app 侧控制通道（socket 注入事件 / 状态转储） | 语义最强，但要改产品代码，且绕过 crossterm / 终端这一截"真实路径"；列为后续可选增强 |
| 解析 ANSI 自建仿真 | 没有终端仿真的可行性，脆；tmux 就是那个仿真器 |

## 九、附：与现有测试装置的分工

| 装置 | 层面 | 典型耗时 | 跑在哪 | 与 tui-probe 的关系 |
| --- | --- | --- | --- | --- |
| `cargo test`（含 app/tests） | 组件级 | 毫秒–秒 | 本地 + CI | 互补：它们管"组件内逻辑"，tui-probe 管"真用户路径" |
| `make test-probe` | 协议级整机 | 秒–十秒 | 本地 + CI | 同源复用：环境、假 Provider、观测库、转储纪律 |
| 二进制 e2e（stdio / ACP / 预检） | headless 形态 | 秒 | 本地 + CI | 互补：覆盖非 TUI 形态的进程红线 |
| `scripts/demo` | 素材生产 | 分钟 | 手动 | 共用 tmux / 捕获经验；tui-probe 是它的可编程、可断言形态 |
| **tui-probe** | **用户路径** | **十秒级** | **本地 + CI 子集** | 补齐最后一块 |
