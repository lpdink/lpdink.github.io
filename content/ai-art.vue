<script setup>
import { reactive } from 'vue'

// 像素资产：每张都能在「像素化成品」和「模型原图」之间点着切
const assets = [
  { slug: 'farmer-hero', name: '农夫主角', tag: '角色' },
  { slug: 'chicken', name: '小鸡', tag: '角色' },
  { slug: 'cat-pet', name: '农场猫', tag: '宠物' },
  { slug: 'crop-parsnip', name: '欧防风作物', tag: '作物' },
  { slug: 'tool-wateringcan', name: '洒水壶', tag: '道具' },
  { slug: 'building-coop', name: '鸡舍', tag: '建筑' },
  { slug: 'tree-oak', name: '橡树', tag: '场景' },
  { slug: 'ui-dialogue', name: '对话框', tag: 'UI' }
]

const memes = [
  { slug: 'shocked-cat', text: '啊?' },
  { slug: 'doge-agree', text: '太对了' },
  { slug: 'panda-sleepy', text: '我不困' },
  { slug: 'fish-lieflat', text: '躺平' },
  { slug: 'cat-cool', text: '小场面' },
  { slug: 'doge-broken', text: '我裂开了' },
  { slug: 'whale-thanks', text: '谢谢老板' },
  { slug: 'duck-question', text: '什么意思' }
]

const raw = reactive({})
const isRaw = (slug) => !!raw[slug]
const toggle = (slug) => { raw[slug] = !raw[slug] }

const crispUrl = (slug) => `/images/ai-art/crisp/${slug}.png`
const rawUrl = (slug) => `/images/ai-art/raw/${slug}.png`

const stats = [
  { num: '26', label: '张图 / 一批次约 4 分钟' },
  { num: '~20s', label: '每张（512², 4 步）' },
  { num: '64×64', label: 'snap 后的真实像素网格' },
  { num: '24', label: '色上限' }
]
</script>

<template>
  <div class="studio">
    <!-- HERO -->
    <section class="hero">
      <p class="eyebrow">本地出图 · Qwen-Image 2.1 · 一台 Mac mini M6</p>
      <h1>AI 画室</h1>
      <p class="sub">
        拿本地跑的文生图模型试着做游戏美术资产。下面这批是同一套 prompt 的产出：
        <strong>像素游戏资产</strong>、<strong>头像</strong> 和 <strong>表情包</strong>。
        像素那组可以直接点着看「模型原图 ↔ 吸附到像素网格后的成品」。
      </p>
      <div class="stats">
        <div v-for="s in stats" :key="s.label" class="stat">
          <span class="num">{{ s.num }}</span>
          <span class="lab">{{ s.label }}</span>
        </div>
      </div>
    </section>

    <!-- 像素资产 -->
    <section class="block">
      <div class="block-head">
        <h2>像素游戏资产</h2>
        <p class="hint">
          模型画出来的其实是「像素风插画」，边缘是糊的。用
          <code>pixelize.py</code> 按 64 格重采样 → 压到 24 色 → 整数倍最近邻放大，
          才变成真能进引擎的 sprite。<span class="accent">点任意一张切换对比。</span>
        </p>
      </div>

      <div class="grid">
        <figure v-for="a in assets" :key="a.slug" class="card" :class="{ raw: isRaw(a.slug) }">
          <button class="shot" type="button" @click="toggle(a.slug)" :aria-label="`切换 ${a.name} 的原图/成品`">
            <img
              :src="isRaw(a.slug) ? rawUrl(a.slug) : crispUrl(a.slug)"
              :alt="a.name"
              width="512" height="512" loading="lazy" decoding="async"
            />
            <span class="mode">{{ isRaw(a.slug) ? '模型原图' : '像素成品' }}</span>
          </button>
          <figcaption>
            <span class="name">{{ a.name }}</span>
            <span class="tag">{{ a.tag }}</span>
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- 头像 -->
    <section class="block">
      <div class="block-head">
        <h2>头像</h2>
        <p class="hint">同一批里的像素机器人头像，512² 直出，没做后处理。</p>
      </div>
      <figure class="solo">
        <img src="/images/ai-art/avatar/robot.png" alt="像素机器人头像" width="512" height="512" loading="lazy" />
        <figcaption>avatar_pixel_robot · 512×512</figcaption>
      </figure>
    </section>

    <!-- 表情包 -->
    <section class="block">
      <div class="block-head">
        <h2>表情包</h2>
        <p class="hint">中文大字 + 一致底色的贴纸，方块里那句就是 prompt 里点名的文案。</p>
      </div>
      <div class="grid memes">
        <figure v-for="m in memes" :key="m.slug" class="card">
          <span class="shot static">
            <img :src="`/images/ai-art/memes/${m.slug}.png`" :alt="m.text" width="512" height="512" loading="lazy" decoding="async" />
          </span>
          <figcaption>
            <span class="name">{{ m.text }}</span>
          </figcaption>
        </figure>
      </div>
    </section>

    <!-- 脚注 -->
    <section class="note">
      <h3>怎么做的</h3>
      <ul>
        <li>推理：<code>stable-diffusion.cpp</code> 的 <code>sd-server</code>，模型 Qwen-Image 2.1 turbo Q8_0，4 步 / CFG 1.0，Metal 加速，512² 约 20 秒一张。</li>
        <li>出图：<code>POST /sdcpp/v1/img_gen</code> 提交任务，轮询 <code>/sdcpp/v1/jobs/&lt;id&gt;</code> 取 base64 PNG。</li>
        <li>后处理：<code>pixelize.py</code> —— BOX 降到 64 格、MEDIANCUT 压到 24 色、NEAREST ×8 放大（可选按边缘主色抠背景）。</li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.studio {
  max-width: var(--maxw);
  margin: 0 auto;
  padding: 0 24px 96px;
}

/* ---------- HERO ---------- */
.hero {
  text-align: center;
  padding: 72px 0 40px;
}
.eyebrow {
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--accent);
  margin: 0 0 14px;
}
.hero h1 {
  font-family: var(--font-display);
  font-size: clamp(34px, 6vw, 54px);
  color: var(--text-strong);
  margin: 0 0 16px;
  letter-spacing: -0.02em;
}
.hero .sub {
  max-width: 680px;
  margin: 0 auto;
  color: var(--text-soft);
  line-height: 1.75;
  font-size: 15.5px;
}
.hero strong {
  color: var(--text-strong);
  font-weight: 600;
}
.stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 32px;
}
.stat {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 20px;
  min-width: 150px;
  text-align: center;
}
.stat .num {
  display: block;
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 600;
  color: var(--accent);
}
.stat .lab {
  display: block;
  font-size: 12px;
  color: var(--text-faint);
  margin-top: 3px;
}

/* ---------- 区块 ---------- */
.block {
  margin-top: 64px;
}
.block-head {
  margin-bottom: 20px;
}
.block-head h2 {
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--text-strong);
  margin: 0 0 8px;
}
.hint {
  margin: 0;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.7;
  max-width: 760px;
}
.hint .accent {
  color: var(--accent);
}
code {
  font-family: var(--font-mono);
  font-size: 0.88em;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1px 6px;
  color: var(--text-strong);
}

/* ---------- 网格 ---------- */
.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.card {
  margin: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-strong);
}
.card.raw {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
}
.shot {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: color-mix(in srgb, var(--accent) 5%, var(--surface-2));
  cursor: zoom-in;
  line-height: 0;
}
.shot.static {
  cursor: default;
}
.shot img {
  width: 100%;
  height: auto;
  display: block;
  image-rendering: pixelated;
}
.card.raw .shot img {
  image-rendering: auto; /* 模型原图不是真像素，别用最近邻 */
}
.mode {
  position: absolute;
  left: 9px;
  bottom: 9px;
  font-size: 11px;
  padding: 4px 9px;
  border-radius: 999px;
  color: #fff;
  background: color-mix(in srgb, var(--accent) 82%, #000);
  opacity: 0;
  transition: opacity 0.2s ease;
}
.card:hover .mode {
  opacity: 1;
}
.card.raw .mode {
  background: rgba(20, 26, 22, 0.82);
  opacity: 1;
}
figcaption {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 10px 12px 12px;
  font-size: 13px;
}
figcaption .name {
  color: var(--text-strong);
  font-weight: 600;
}
figcaption .tag {
  color: var(--text-faint);
  font-size: 11.5px;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 1px 8px;
  margin-left: auto;
}

/* ---------- 单图 ---------- */
.solo {
  margin: 0;
  max-width: 420px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.solo img {
  width: 100%;
  height: auto;
  display: block;
  image-rendering: pixelated;
}
.solo figcaption {
  color: var(--text-faint);
  font-size: 12px;
  justify-content: center;
}

/* ---------- 脚注 ---------- */
.note {
  margin-top: 64px;
  padding: 24px 26px;
  background: var(--bg-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}
.note h3 {
  margin: 0 0 12px;
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--text-strong);
}
.note ul {
  margin: 0;
  padding-left: 20px;
  color: var(--text-soft);
  font-size: 14px;
  line-height: 1.9;
}
</style>
