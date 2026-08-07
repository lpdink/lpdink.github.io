<script setup>
import { computed } from 'vue'
import { posts } from '../src/content.js'

const recent = computed(() => posts.slice(0, 4))

const features = [
  {
    icon: 'leaf',
    title: '无魔法上下文',
    desc: '从不注入隐藏的系统提示词。你看到的，就是模型真正看到的。'
  },
  {
    icon: 'bolt',
    title: '最高缓存命中',
    desc: '承诺理论最高的 prompt 缓存命中率，绝不无故破坏你的缓存前缀。'
  },
  {
    icon: 'scale',
    title: '极简工具 schema',
    desc: '内置工具用最简 schema，上下文初始开销不到 2K tokens。'
  }
]

const iconPaths = {
  leaf: 'M12 3c-4 3-7 7-7 11a7 7 0 0 0 14 0c0-4-3-8-7-11z',
  bolt: 'M13 2L3 14h7l-1 8 10-12h-7l1-8z',
  scale: 'M12 3v18M5 7l7-4 7 4M5 7l-2 5a4 4 0 0 0 8 0L9 7M19 7l-2 5a4 4 0 0 0 8 0l-2-5'
}

function tagColor(i) {
  return ['#2f8f5f', '#3a7bd5', '#c08b2e', '#8a5fc0'][i % 4]
}
</script>

<template>
  <div class="home">
    <!-- ============ HERO ============ -->
    <section class="hero">
      <div class="hero-blob blob-1"></div>
      <div class="hero-blob blob-2"></div>
      <div class="hero-inner">
        <p class="hero-eyebrow">独立开发者 · 手写的小站</p>
        <h1 class="hero-title">
          你好，我是 <span class="grad">lpdink</span>
          <br />
          这是我的网络后院
        </h1>
        <p class="hero-sub">
          我把平时的折腾、思考和一些项目都扔在这里。没有花哨的框架，
          只有 Markdown 和一点点对美的执念。
        </p>
        <div class="hero-actions">
          <router-link to="/blog" class="btn btn-primary">逛逛博客</router-link>
          <router-link to="/blog/wing-agent" class="btn btn-ghost">认识 wing-agent</router-link>
        </div>
        <div class="hero-stats">
          <div class="stat">
            <span class="stat-num">{{ posts.length }}</span>
            <span class="stat-label">篇文章</span>
          </div>
          <div class="stat">
            <span class="stat-num">1</span>
            <span class="stat-label">个实验项目</span>
          </div>
          <div class="stat">
            <span class="stat-num">∞</span>
            <span class="stat-label">杯咖啡</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ FEATURED PROJECT ============ -->
    <section class="project">
      <div class="section-head">
        <p class="eyebrow">Featured Project</p>
        <h2 class="section-title">wing-agent</h2>
        <p class="section-desc">一个我一直在打磨的实验项目 —— 迈向通用 agent 运行时。</p>
      </div>

      <div class="project-card">
        <div class="project-top">
          <h3 class="project-name">wing-agent</h3>
          <span class="project-badge">实验性 · Apache-2.0</span>
        </div>
        <p class="project-tagline">Towards general agent runtime.</p>

        <div class="feature-grid">
          <div v-for="(f, i) in features" :key="i" class="feature">
            <div class="feature-icon" :style="{ background: tagColor(i) }">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="iconPaths[f.icon]" />
              </svg>
            </div>
            <h4 class="feature-title">{{ f.title }}</h4>
            <p class="feature-desc">{{ f.desc }}</p>
          </div>
        </div>

        <div class="project-actions">
          <router-link to="/blog/wing-agent" class="btn btn-primary">阅读介绍</router-link>
          <a href="https://github.com/lpdink/wing-agent" target="_blank" rel="noopener" class="btn btn-ghost">
            GitHub ↗
          </a>
        </div>
      </div>
    </section>

    <!-- ============ RECENT POSTS ============ -->
    <section class="recent">
      <div class="section-head">
        <p class="eyebrow">Recent Writing</p>
        <h2 class="section-title">最近的一些文字</h2>
      </div>

      <div class="recent-grid">
        <router-link v-for="(p, i) in recent" :key="p.url" :to="p.url" class="recent-card">
          <div class="recent-stripe" :style="{ background: tagColor(i) }"></div>
          <h3 class="recent-title">{{ p.title }}</h3>
          <p v-if="p.description" class="recent-desc">{{ p.description }}</p>
          <div class="recent-meta">
            <span v-if="p.date" class="recent-date">{{ p.date }}</span>
            <span v-for="t in p.tags" :key="t" class="recent-tag"># {{ t }}</span>
          </div>
        </router-link>
      </div>
      <div class="recent-more">
        <router-link to="/blog" class="btn btn-ghost">查看全部 →</router-link>
      </div>
    </section>

    <!-- ============ ABOUT STRIP ============ -->
    <section class="about">
      <div class="about-inner">
        <h2 class="about-title">关于这个站点</h2>
        <p class="about-text">
          用手写的 Vue 搭建，Markdown 驱动，跑在 GitHub Pages 上。
          白天是一抹浅绿，晚上是深沉的绿。想写的时候就写，不想写就晾着。
        </p>
        <div class="about-links">
          <a href="https://github.com/lpdink" target="_blank" rel="noopener">GitHub</a>
          <router-link to="/tags">标签</router-link>
          <router-link to="/docs">文档</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  overflow: hidden;
}

/* ---------- HERO ---------- */
.hero {
  position: relative;
  padding: 96px 24px 72px;
  text-align: center;
  background:
    radial-gradient(1200px 500px at 50% -10%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%),
    var(--bg);
}

.hero-inner {
  position: relative;
  max-width: 760px;
  margin: 0 auto;
}

.hero-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  opacity: 0.5;
  pointer-events: none;
}

.blob-1 {
  width: 340px;
  height: 340px;
  left: -80px;
  top: 40px;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 40%, transparent), transparent 70%);
}

.blob-2 {
  width: 300px;
  height: 300px;
  right: -60px;
  top: 120px;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent-2) 35%, transparent), transparent 70%);
}

.hero-eyebrow {
  display: inline-block;
  font-size: 0.8rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  padding: 6px 16px;
  border-radius: 999px;
  margin-bottom: 28px;
}

.hero-title {
  font-size: clamp(2.2rem, 6vw, 3.6rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 24px;
}

.grad {
  background: linear-gradient(120deg, var(--accent), var(--accent-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-sub {
  font-size: 1.12rem;
  color: var(--text-soft);
  max-width: 560px;
  margin: 0 auto 36px;
  line-height: 1.75;
}

.hero-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 56px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 999px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: transform 0.18s, box-shadow 0.18s, background 0.18s;
}

.btn-primary {
  background: linear-gradient(120deg, var(--accent), var(--accent-2));
  color: #fff;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 35%, transparent);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px color-mix(in srgb, var(--accent) 45%, transparent);
}

.btn-ghost {
  border: 1px solid var(--border-strong);
  color: var(--text);
  background: var(--surface);
}

.btn-ghost:hover {
  border-color: var(--accent);
  color: var(--accent);
  transform: translateY(-2px);
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
  flex-wrap: wrap;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-num {
  font-family: var(--font-display);
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-strong);
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-faint);
}

/* ---------- SECTIONS ---------- */
.section-head {
  text-align: center;
  margin-bottom: 44px;
}

.eyebrow {
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 10px;
}

.section-title {
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  margin: 0 0 12px;
  letter-spacing: -0.01em;
}

.section-desc {
  color: var(--text-soft);
  margin: 0;
}

/* ---------- PROJECT ---------- */
.project {
  padding: 72px 24px;
  max-width: 1080px;
  margin: 0 auto;
}

.project-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 40px;
  box-shadow: var(--shadow);
}

.project-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.project-name {
  font-size: 1.6rem;
  margin: 0;
}

.project-badge {
  font-size: 0.78rem;
  color: var(--text-faint);
  border: 1px solid var(--border);
  padding: 4px 12px;
  border-radius: 999px;
}

.project-tagline {
  color: var(--text-faint);
  font-style: italic;
  margin: 0 0 32px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 36px;
}

.feature {
  padding: 24px;
  border-radius: 18px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  transition: transform 0.18s, box-shadow 0.18s;
}

.feature:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}

.feature-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  margin-bottom: 16px;
}

.feature-title {
  margin: 0 0 8px;
  font-size: 1.05rem;
}

.feature-desc {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.92rem;
  line-height: 1.6;
}

.project-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* ---------- RECENT ---------- */
.recent {
  padding: 72px 24px;
  max-width: 1080px;
  margin: 0 auto;
}

.recent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.recent-card {
  position: relative;
  display: block;
  text-decoration: none;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  overflow: hidden;
  transition: transform 0.18s, box-shadow 0.18s;
}

.recent-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow);
}

.recent-stripe {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.recent-title {
  margin: 8px 0 8px;
  color: var(--text-strong);
  font-size: 1.1rem;
}

.recent-desc {
  color: var(--text-soft);
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0 0 14px;
}

.recent-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.8rem;
}

.recent-date {
  color: var(--text-faint);
}

.recent-tag {
  color: var(--accent);
}

.recent-more {
  text-align: center;
  margin-top: 36px;
}

/* ---------- ABOUT ---------- */
.about {
  padding: 72px 24px;
  background: linear-gradient(180deg, var(--bg), color-mix(in srgb, var(--accent) 6%, var(--bg)));
}

.about-inner {
  max-width: 620px;
  margin: 0 auto;
  text-align: center;
}

.about-title {
  font-size: 1.8rem;
  margin: 0 0 16px;
}

.about-text {
  color: var(--text-soft);
  line-height: 1.8;
  margin: 0 0 28px;
}

.about-links {
  display: flex;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
}

.about-links a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
}

.about-links a:hover {
  text-decoration: underline;
}

@media (max-width: 720px) {
  .hero {
    padding: 72px 18px 56px;
  }
  .project-card {
    padding: 24px;
  }
  .hero-stats {
    gap: 28px;
  }
}
</style>