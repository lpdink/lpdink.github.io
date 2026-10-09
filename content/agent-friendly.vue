<script setup>
// Agent 友好化 —— 产品/演示页。
// 内容与《tui-probe 方案设计》(/design/tui-probe) 同一份事实：本页面向大众，
// 讲"为什么"与"怎么做到"；机制细节去设计文档。
</script>

<template>
  <div class="page">
    <!-- ================= HERO ================= -->
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">wing-agent · 工程实践</p>
        <h1>
          让 AI 自己<br />
          <span class="grad">坐到 TUI 面前</span>
        </h1>
        <p class="sub">
          我们正在把 wing-agent 项目本身改造成 <strong>Agent 友好</strong>：
          不是让 AI 替你写代码，而是让 AI 能<strong>亲自上手</strong>——
          驱动真的程序、观察真的屏幕、验收真的体验，然后把发现带回评审。
        </p>
        <div class="actions">
          <router-link to="/design/tui-probe" class="btn btn-primary">读设计文档</router-link>
          <a
            class="btn btn-ghost"
            href="https://github.com/lpdink/wing-agent"
            target="_blank"
            rel="noopener"
          >
            GitHub ↗
          </a>
        </div>
      </div>

      <div class="hero-art">
        <div class="mascot">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 29 23" shape-rendering="crispEdges" role="img" aria-label="wing mascot">
          <title>wing mascot</title>
          <g class="k1">
          <rect x="17" y="0" width="4" height="1"/>
          <rect x="15" y="1" width="2" height="1"/>
          <rect x="21" y="1" width="2" height="1"/>
          <rect x="14" y="2" width="1" height="1"/>
          <rect x="23" y="2" width="1" height="1"/>
          <rect x="13" y="3" width="1" height="1"/>
          <rect x="24" y="3" width="1" height="1"/>
          <rect x="13" y="4" width="1" height="1"/>
          <rect x="24" y="4" width="1" height="1"/>
          <rect x="12" y="5" width="1" height="1"/>
          <rect x="25" y="5" width="1" height="1"/>
          <rect x="7" y="6" width="6" height="1"/>
          <rect x="25" y="6" width="3" height="1"/>
          <rect x="6" y="7" width="1" height="1"/>
          <rect x="28" y="7" width="1" height="1"/>
          <rect x="6" y="8" width="1" height="1"/>
          <rect x="27" y="8" width="1" height="1"/>
          <rect x="6" y="9" width="1" height="1"/>
          <rect x="24" y="9" width="3" height="1"/>
          <rect x="5" y="10" width="1" height="1"/>
          <rect x="24" y="10" width="1" height="1"/>
          <rect x="5" y="11" width="1" height="1"/>
          <rect x="24" y="11" width="1" height="1"/>
          <rect x="4" y="12" width="1" height="1"/>
          <rect x="25" y="12" width="1" height="1"/>
          <rect x="4" y="13" width="1" height="1"/>
          <rect x="25" y="13" width="1" height="1"/>
          <rect x="3" y="14" width="3" height="1"/>
          <rect x="24" y="14" width="1" height="1"/>
          <rect x="2" y="15" width="1" height="1"/>
          <rect x="24" y="15" width="1" height="1"/>
          <rect x="1" y="16" width="1" height="1"/>
          <rect x="23" y="16" width="1" height="1"/>
          <rect x="2" y="17" width="1" height="1"/>
          <rect x="22" y="17" width="1" height="1"/>
          <rect x="3" y="18" width="7" height="1"/>
          <rect x="20" y="18" width="2" height="1"/>
          <rect x="10" y="19" width="2" height="1"/>
          <rect x="18" y="19" width="2" height="1"/>
          <rect x="11" y="20" width="1" height="1"/>
          <rect x="18" y="20" width="1" height="1"/>
          <rect x="10" y="21" width="1" height="1"/>
          <rect x="19" y="21" width="1" height="1"/>
          <rect x="11" y="22" width="8" height="1"/>
          </g>
          <g fill="#f7f9fc">
          <rect x="17" y="1" width="4" height="1"/>
          <rect x="15" y="2" width="8" height="1"/>
          <rect x="14" y="3" width="10" height="1"/>
          <rect x="14" y="4" width="10" height="1"/>
          <rect x="13" y="5" width="7" height="1"/>
          <rect x="22" y="5" width="3" height="1"/>
          <rect x="13" y="6" width="7" height="1"/>
          <rect x="22" y="6" width="2" height="1"/>
          <rect x="11" y="7" width="13" height="1"/>
          <rect x="13" y="8" width="11" height="1"/>
          <rect x="7" y="9" width="2" height="1"/>
          <rect x="14" y="9" width="10" height="1"/>
          <rect x="6" y="10" width="4" height="1"/>
          <rect x="17" y="10" width="7" height="1"/>
          <rect x="6" y="11" width="4" height="1"/>
          <rect x="18" y="11" width="6" height="1"/>
          <rect x="5" y="12" width="4" height="1"/>
          <rect x="19" y="12" width="6" height="1"/>
          <rect x="5" y="13" width="4" height="1"/>
          <rect x="18" y="13" width="7" height="1"/>
          <rect x="6" y="14" width="3" height="1"/>
          <rect x="17" y="14" width="7" height="1"/>
          <rect x="3" y="15" width="6" height="1"/>
          <rect x="16" y="15" width="8" height="1"/>
          <rect x="6" y="16" width="17" height="1"/>
          <rect x="6" y="17" width="16" height="1"/>
          <rect x="10" y="18" width="10" height="1"/>
          <rect x="14" y="19" width="2" height="1"/>
          </g>
          <g fill="#ffffff">
          <rect x="20" y="5" width="1" height="1"/>
          </g>
          <g fill="#141c33">
          <rect x="21" y="5" width="1" height="1"/>
          <rect x="20" y="6" width="2" height="1"/>
          </g>
          <g fill="#f5a93c">
          <rect x="24" y="6" width="1" height="1"/>
          <rect x="24" y="7" width="4" height="1"/>
          <rect x="26" y="8" width="1" height="1"/>
          </g>
          <g fill="#c9d2e0">
          <rect x="7" y="7" width="4" height="1"/>
          <rect x="7" y="8" width="6" height="1"/>
          <rect x="9" y="9" width="5" height="1"/>
          <rect x="10" y="10" width="7" height="1"/>
          <rect x="10" y="11" width="8" height="1"/>
          <rect x="9" y="12" width="10" height="1"/>
          <rect x="12" y="13" width="4" height="1"/>
          <rect x="17" y="13" width="1" height="1"/>
          <rect x="11" y="15" width="2" height="1"/>
          </g>
          <g fill="#c77e22">
          <rect x="24" y="8" width="2" height="1"/>
          <rect x="12" y="19" width="2" height="1"/>
          <rect x="16" y="19" width="2" height="1"/>
          <rect x="12" y="20" width="2" height="1"/>
          <rect x="16" y="20" width="2" height="1"/>
          <rect x="11" y="21" width="8" height="1"/>
          </g>
          <g class="k2">
          <rect x="9" y="13" width="3" height="1"/>
          <rect x="9" y="14" width="3" height="1"/>
          <rect x="9" y="15" width="2" height="1"/>
          <rect x="2" y="16" width="4" height="1"/>
          <rect x="3" y="17" width="3" height="1"/>
          </g>
          <g class="k3">
          <rect x="16" y="13" width="1" height="1"/>
          <rect x="12" y="14" width="5" height="1"/>
          <rect x="13" y="15" width="3" height="1"/>
          </g>
          </svg>
        </div>
        <div class="badges">
          <span class="badge">真二进制</span>
          <span class="badge">真终端</span>
          <span class="badge">真事件循环</span>
        </div>
      </div>
    </section>

    <!-- ================= STATS ================= -->
    <section class="stats">
      <div class="stat">
        <span class="num">100%</span>
        <span class="lab">真实路径：真二进制 + 真终端语义</span>
      </div>
      <div class="stat">
        <span class="num">0</span>
        <span class="lab">联网依赖：假 Provider，离线可重复</span>
      </div>
      <div class="stat">
        <span class="num">121</span>
        <span class="lab">已有的协议级确定性用例，全部可复用</span>
      </div>
      <div class="stat">
        <span class="num">1 条</span>
        <span class="lab">命令跑完一整条用户旅程</span>
      </div>
    </section>

    <!-- ================= PROBLEM ================= -->
    <section class="problem">
      <p class="eyebrow">为什么做这件事</p>
      <h2>代码能写，手感没人验</h2>
      <p class="lead">
        AI 已经能大段大段地写代码、改架构、修测试。但有一样东西它一直验不了：
        <strong>用户的手感</strong>。一个面板在 80 列终端里会不会挤、按 Esc
        会不会退出错层、保存回执有没有被盖住——这些不产生崩溃、不挂在 CI 上，
        只在一个真实用户坐下来操作时才会现形。
      </p>

      <div class="case">
        <div class="case-head">
          <span class="case-tag">真实案例</span>
          <h3>设置面板（PR #180）：几乎全是"手感"的一次改动</h3>
        </div>
        <div class="case-grid">
          <div class="case-item">
            <h4>键位与 Esc 阶梯</h4>
            <p>七级撤销、编辑器、搜索、脏改动确认——错一级就是"按了没反应"。</p>
          </div>
          <div class="case-item">
            <h4>回执与错误清单</h4>
            <p>保存成功看不见、失败看不懂；密钥会不会回显，写盘到底发生没有。</p>
          </div>
          <div class="case-item">
            <h4>首次运行向导</h4>
            <p>配置坏掉才走的那条路：修复 → 保存 → 继续进入主界面，真的走得通吗？</p>
          </div>
        </div>
      </div>

      <p class="callout">
        评审看得见 diff，看不见手感——<strong>直到有人真的去用一遍。</strong>
      </p>
    </section>

    <!-- ================= FOUNDATION ================= -->
    <section class="foundation">
      <p class="eyebrow">地基</p>
      <h2>三层已经建好：Agent 已经能验"后端"</h2>

      <div class="cards">
        <article class="card">
          <div class="card-no">01</div>
          <h3>会话说来就来</h3>
          <p>
            <code>wing run / wait / info / tail</code>：后台建会话、等结果、随时翻记录。
            Agent 不需要界面，也能把一个任务跑完、把过程读全。
          </p>
        </article>
        <article class="card">
          <div class="card-no">02</div>
          <h3>确定性整机测试台</h3>
          <p>
            <code>wing-probe</code>：假 Provider 喂剧本、真网关跑逻辑。121
            个协议级用例覆盖上下文红线、落盘语义与工具链路——离线、无 API key、可并行。
          </p>
        </article>
        <article class="card">
          <div class="card-no">03</div>
          <h3>真进程的红线测试</h3>
          <p>
            二进制级 e2e：stdio / ACP / 启动预检。真进程、真通道、真退出码——
            "stdout 一个字节都不许脏"这种红线，由真进程来钉。
          </p>
        </article>
      </div>

      <p class="bridge">
        它们把<strong>后端</strong>变成了 Agent 可验证的黑盒。还差最后一块——<strong>前端</strong>。
      </p>
    </section>

    <!-- ================= SOLUTION ================= -->
    <section class="solution">
      <p class="eyebrow">新的拼图 · 设计已定稿</p>
      <h2>体验测试台 tui-probe：让 Agent 坐到 TUI 面前</h2>
      <p class="lead">
        把"真 wing 二进制 + 真终端语义"做成一套可编程装置。假掉的只有模型输出，
        其余全真：真终端、真网关、真工具执行。Agent 像用户一样敲键、看屏，
        再拿屏幕和后端<strong>两面同拍</strong>地验收。
      </p>

      <div class="steps">
        <div class="step">
          <span class="step-no">①</span>
          <h4>起一台"假模型、真世界"</h4>
          <p>临时家目录 + 假 Provider 剧本 + 真网关，不碰你的环境，跑完即焚。</p>
        </div>
        <div class="step">
          <span class="step-no">②</span>
          <h4>把真 TUI 放进真终端</h4>
          <p>真 wing 二进制跑在 tmux 里，终端尺寸就是测试参数（80×24 到 130×40）。</p>
        </div>
        <div class="step">
          <span class="step-no">③</span>
          <h4>像用户一样操作</h4>
          <p>按键、鼠标、粘贴、窗口缩放——字节级注入，和真终端发的一模一样。</p>
        </div>
        <div class="step">
          <span class="step-no">④</span>
          <h4>两面同拍地验收</h4>
          <p>屏幕帧 + 后端事实（文件、事件、落盘）一起断言，谁也骗不了谁。</p>
        </div>
      </div>

      <div class="term">
        <div class="term-bar">
          <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
          <span class="term-title">make test-tui · TUI_SCENARIO=settings-save</span>
        </div>
        <pre class="term-body"><span class="dim">$</span> make test-tui <span class="hl">TUI_SCENARIO=settings-save</span>

<span class="ok">▶</span> env      假 Provider + 真网关 · 临时 WING_HOME           <span class="ok">ok</span> <span class="dim">0.4s</span>
<span class="ok">▶</span> launch   真 wing · tmux 100×30 · 就绪信号 <span class="hl">☾ wing</span>         <span class="ok">ok</span> <span class="dim">1.2s</span>
<span class="ok">▶</span> 步骤 01  type "/settings" ⏎    → 帧 001 · 面板打开           差异 27 行
<span class="ok">▶</span> 步骤 02  Tab → 搜索 "color"    → 帧 002 · 命中 6 项          差异 12 行
<span class="ok">▶</span> 步骤 03  编辑 theme.background → 帧 003 · 实时预览           差异 41 行
<span class="ok">▶</span> 步骤 04  s 保存                → 帧 004 · 回执 <span class="ok">✓ 已保存</span>
<span class="ok">✓</span> 屏幕断言 回执出现 · 密钥不明文 · 键位栏未越界
<span class="ok">✓</span> 语义断言 config.yaml 已写入 · 会话仍 idle · 无瞬态落盘
<span class="ok">✓</span> 收尾     退出码 0 · 终端恢复序列完整
<span class="dim">产物 → target/tui-runs/settings-save/{frames,diffs,transcript,report.md}</span></pre>
        <p class="term-cap">示意输出 · 设计目标（实现按路线图推进）</p>
      </div>

      <div class="chips">
        <span class="chip">pytest 场景（回归 / CI）</span>
        <span class="chip">CLI 原子动词 / steps（Agent 探索）</span>
        <span class="chip">产物：帧 · 差异 · 逐字记录 · 报告</span>
      </div>
    </section>

    <!-- ================= TRUST ================= -->
    <section class="trust">
      <p class="eyebrow">为什么可信</p>
      <h2>四条铁律</h2>
      <div class="cards four">
        <article class="card">
          <h3><span class="mk real">真</span>真实优先</h3>
          <p>真二进制、真终端、真事件循环。假掉的只有模型输出——它是唯一可以剧本化的部分。</p>
        </article>
        <article class="card">
          <h3><span class="mk det">定</span>确定性</h3>
          <p>等待全部锚在可观测事实上：屏幕文本、终端标题、会话状态、文件字节。不拿 sleep 赌运气。</p>
        </article>
        <article class="card">
          <h3><span class="mk ev">证</span>证据链</h3>
          <p>每一步都有帧、差异与逐字记录；失败现场连原始字节流一起留存。给 Agent 复盘，也给 PR 附证。</p>
        </article>
        <article class="card">
          <h3><span class="mk sep">分</span>分工明确</h3>
          <p>机械断言进 CI 当门禁；"好不好看、顺不顺手"由 Agent 走查、按级报告。机器守红线，Agent 管品味。</p>
        </article>
      </div>
    </section>

    <!-- ================= ROADMAP ================= -->
    <section class="roadmap">
      <p class="eyebrow">路线图</p>
      <h2>分四步落地</h2>
      <ol class="tl">
        <li>
          <span class="ph">M0</span><b>驱动验证</b>
          <p>tmux 后端骨架 + 冒烟场景跑通：启动 → 提问 → 流式 → 干净退出。</p>
        </li>
        <li>
          <span class="ph">M1</span><b>基建</b>
          <p>TuiDriver 全量原语 + 产物层 + CLI + pytest 夹具 + 文档；种子场景落地。</p>
        </li>
        <li>
          <span class="ph">M2</span><b>实战</b>
          <p>设置面板 / 保存 / 首次运行向导等场景铺开；第一次 Agent UX 走查，把方法固化成技能。</p>
        </li>
        <li>
          <span class="ph">M3</span><b>收口</b>
          <p>接入 CI 与评审流程（wing-review 的 UX 段）；可选增强：截图 / 录屏证据。</p>
        </li>
      </ol>
    </section>

    <!-- ================= LINKS ================= -->
    <section class="cta">
      <h2>阅读更多</h2>
      <div class="links">
        <router-link to="/design/tui-probe" class="link-card">
          <span class="link-title">《tui-probe 方案设计》</span>
          <span class="link-desc">机制、原语、产物与边界，写给技术团队</span>
          <span class="link-go">→</span>
        </router-link>
        <router-link to="/blog/wing-agent" class="link-card">
          <span class="link-title">认识 wing-agent</span>
          <span class="link-desc">一个对上下文极其吝啬的通用 agent 运行时</span>
          <span class="link-go">→</span>
        </router-link>
        <a
          class="link-card"
          href="https://github.com/lpdink/wing-agent"
          target="_blank"
          rel="noopener"
        >
          <span class="link-title">GitHub</span>
          <span class="link-desc">源码与 issue，Apache-2.0</span>
          <span class="link-go">↗</span>
        </a>
      </div>
      <p class="note">
        tui-probe 是 wing-agent 的内部工程装置，随仓库一同演进；设计文档与实现同步更新。
      </p>
    </section>
  </div>
</template>

<style scoped>
.page {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 56px 24px 88px;
}

/* ---------- hero ---------- */
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 40px;
  align-items: center;
  padding: 26px 0 34px;
}
.eyebrow {
  margin: 0 0 10px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
}
.hero h1 {
  margin: 0 0 18px;
  font-family: var(--font-display);
  font-size: clamp(2.1rem, 4.6vw, 3.4rem);
  line-height: 1.14;
  color: var(--text-strong);
  letter-spacing: -0.01em;
}
.hero h1 .grad {
  background: linear-gradient(120deg, var(--accent), var(--accent-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero .sub {
  max-width: 560px;
  margin: 0 0 26px;
  font-size: 1.02rem;
  line-height: 1.85;
  color: var(--text-soft);
}
.hero .sub strong {
  color: var(--text-strong);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-art {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.mascot {
  width: clamp(150px, 22vw, 240px);
  padding: 22px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  box-shadow: var(--shadow-lg);
}
.mascot :deep(svg.gull) {
  display: block;
  width: 100%;
  height: auto;
}
.mascot :deep(.k1 rect) {
  fill: var(--text-strong);
}
.mascot :deep(.k2 rect) {
  fill: var(--accent);
}
.mascot :deep(.k3 rect) {
  fill: var(--text-faint);
}
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}
.badge {
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  border-radius: 999px;
}

/* ---------- stats ---------- */
.stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 18px 0 10px;
}
.stat {
  padding: 18px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.stat .num {
  display: block;
  font-family: var(--font-display);
  font-size: 1.5rem;
  color: var(--accent);
}
.stat .lab {
  display: block;
  margin-top: 4px;
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--text-faint);
}

/* ---------- shared section rhythm ---------- */
section + section {
  margin-top: 74px;
}
h2 {
  margin: 0 0 18px;
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 2.6vw, 2rem);
  color: var(--text-strong);
  letter-spacing: -0.01em;
}
.lead {
  max-width: 780px;
  margin: 0 0 20px;
  font-size: 1rem;
  line-height: 1.9;
  color: var(--text-soft);
}
.lead strong {
  color: var(--text-strong);
}

/* ---------- problem ---------- */
.case {
  margin: 26px 0;
  padding: 22px 24px 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 18px;
}
.case-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}
.case-tag {
  padding: 3px 10px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  color: var(--dsg-bad);
  border: 1px solid color-mix(in srgb, var(--dsg-bad) 45%, transparent);
  background: color-mix(in srgb, var(--dsg-bad) 8%, transparent);
  border-radius: 999px;
}
.case h3 {
  margin: 0;
  font-size: 1.02rem;
  color: var(--text-strong);
}
.case-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.case-item h4 {
  margin: 0 0 6px;
  font-size: 0.92rem;
  color: var(--text-strong);
}
.case-item p {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.7;
  color: var(--text-soft);
}
.callout {
  max-width: 780px;
  margin: 26px 0 0;
  padding: 16px 20px;
  font-size: 0.98rem;
  line-height: 1.8;
  color: var(--text-soft);
  background: color-mix(in srgb, var(--accent) 6%, var(--surface));
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent);
  border-radius: 12px;
}
.callout strong {
  color: var(--text-strong);
}

/* ---------- foundation ---------- */
.cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 8px;
}
.cards.four {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.card {
  padding: 22px 22px 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
}
.card-no {
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: var(--accent);
  margin-bottom: 12px;
}
.card h3 {
  margin: 0 0 10px;
  font-size: 1rem;
  color: var(--text-strong);
}
.card p {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.8;
  color: var(--text-soft);
}
.card code {
  font-size: 0.82em;
}
.bridge {
  margin: 26px 0 0;
  font-size: 1rem;
  line-height: 1.9;
  color: var(--text-soft);
}
.bridge strong {
  color: var(--text-strong);
}

/* ---------- solution ---------- */
.steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 26px 0 30px;
}
.step {
  padding: 18px 18px 20px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 14px;
}
.step-no {
  display: inline-block;
  margin-bottom: 10px;
  font-size: 1rem;
  color: var(--accent);
}
.step h4 {
  margin: 0 0 8px;
  font-size: 0.92rem;
  color: var(--text-strong);
  line-height: 1.5;
}
.step p {
  margin: 0;
  font-size: 0.82rem;
  line-height: 1.7;
  color: var(--text-soft);
}

/* terminal mockup */
.term {
  margin: 8px 0 22px;
  background: var(--code-bg);
  border: 1px solid var(--border-strong);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}
.term-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px 16px;
  background: color-mix(in srgb, var(--code-bg) 82%, #000);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  opacity: 0.85;
}
.dot.r {
  background: #ff5f57;
}
.dot.y {
  background: #febc2e;
}
.dot.g {
  background: #28c840;
}
.term-title {
  margin-left: 8px;
  font-family: var(--font-mono);
  font-size: 0.76rem;
  color: rgba(220, 232, 223, 0.65);
}
.term-body {
  margin: 0;
  padding: 18px 20px 20px;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  line-height: 1.85;
  color: #dce8df;
  overflow-x: auto;
}
.term-body .dim {
  color: #7c8a80;
}
.term-body .ok {
  color: #7fd0a5;
  font-weight: 600;
}
.term-body .hl {
  color: #e8c98a;
}
.term-cap {
  margin: 0;
  padding: 0 20px 14px;
  font-size: 0.76rem;
  color: rgba(220, 232, 223, 0.5);
  text-align: right;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  padding: 5px 13px;
  font-size: 0.8rem;
  color: var(--text-soft);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 999px;
}

/* ---------- trust ---------- */
.trust .card h3 {
  display: flex;
  align-items: center;
  gap: 9px;
}
.mk {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
  border-radius: 8px;
  font-size: 0.82rem;
  color: #fff;
}
.mk.real {
  background: var(--accent);
}
.mk.det {
  background: var(--dsg-info);
}
.mk.ev {
  background: var(--dsg-warn);
}
.mk.sep {
  background: var(--dsg-ok);
}

/* ---------- roadmap ---------- */
.tl {
  list-style: none;
  padding: 0;
  margin: 8px 0 0;
}
.tl > li {
  position: relative;
  margin: 0 0 0 10px;
  padding: 2px 0 22px 28px;
  border-left: 2px solid var(--border-strong);
}
.tl > li:last-child {
  border-left-color: transparent;
  padding-bottom: 4px;
}
.tl > li::before {
  content: '';
  position: absolute;
  left: -7px;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  border: 2px solid var(--bg);
}
.tl b {
  color: var(--text-strong);
}
.ph {
  display: inline-block;
  margin-right: 10px;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  color: var(--accent);
}
.tl p {
  margin: 5px 0 0;
  font-size: 0.9rem;
  line-height: 1.75;
  color: var(--text-soft);
}

/* ---------- cta ---------- */
.cta .links {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 6px 0 18px;
}
.link-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px 20px 22px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  text-decoration: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}
.link-card:hover {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  box-shadow: var(--shadow);
  transform: translateY(-1px);
}
.link-title {
  font-size: 0.98rem;
  font-weight: 600;
  color: var(--text-strong);
}
.link-desc {
  font-size: 0.84rem;
  line-height: 1.7;
  color: var(--text-soft);
}
.link-go {
  position: absolute;
  right: 18px;
  bottom: 16px;
  font-size: 1.05rem;
  color: var(--accent);
}
.note {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-faint);
}

/* ---------- responsive ---------- */
@media (max-width: 1080px) {
  .cards.four {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .hero {
    grid-template-columns: 1fr;
  }
  .hero-art {
    order: -1;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    gap: 16px;
  }
  .mascot {
    width: 120px;
    padding: 14px;
  }
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .case-grid,
  .cards,
  .cta .links {
    grid-template-columns: 1fr;
  }
  .steps {
    grid-template-columns: 1fr;
  }
}
</style>
