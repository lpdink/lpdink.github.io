<script setup>
import { postsInSection } from '../content.js'

const posts = postsInSection('blog')

function formatDate(d) {
  if (!d) return '未标注日期'
  const [y, m, day] = d.split('-')
  return `${y} 年 ${Number(m)} 月 ${Number(day)} 日`
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="page-title">博客</h1>
      <p class="page-sub">记录、折腾与思考。写在 markdown 里的流水账。</p>
    </header>

    <div v-if="posts.length" class="post-list">
      <router-link v-for="p in posts" :key="p.url" :to="p.url" class="post-card">
        <div class="post-card-body">
          <h2 class="post-card-title">{{ p.title }}</h2>
          <p v-if="p.description" class="post-card-desc">{{ p.description }}</p>
          <div class="post-card-meta">
            <span v-if="p.date" class="m-date">{{ formatDate(p.date) }}</span>
            <span v-for="t in p.tags" :key="t" class="m-tag"># {{ t }}</span>
          </div>
        </div>
        <span class="post-card-arrow" aria-hidden="true">→</span>
      </router-link>
    </div>

    <div v-else class="empty">
      <p>还没有文章。往 <code>content/blog/</code> 里放一个 .md 文件就会出现。</p>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 820px;
  margin: 0 auto;
  padding: 56px 24px 0;
}

.page-head {
  margin-bottom: 40px;
}

.page-title {
  font-family: var(--font-display);
  font-size: clamp(2rem, 5vw, 2.8rem);
  color: var(--text-strong);
  margin: 0 0 10px;
  letter-spacing: -0.02em;
}

.page-sub {
  color: var(--text-soft);
  font-size: 1.05rem;
  margin: 0;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  text-decoration: none;
  transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s;
}

.post-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  box-shadow: 0 12px 30px color-mix(in srgb, var(--accent) 12%, transparent);
}

.post-card-title {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--text-strong);
  margin: 0 0 8px;
}

.post-card-desc {
  color: var(--text-soft);
  margin: 0 0 12px;
  font-size: 0.95rem;
  line-height: 1.6;
}

.post-card-meta {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  align-items: center;
  font-size: 0.84rem;
}

.m-date {
  color: var(--text-faint);
}

.m-tag {
  color: var(--accent);
}

.post-card-arrow {
  color: var(--accent);
  font-size: 1.4rem;
  flex-shrink: 0;
}

.empty {
  color: var(--text-faint);
  padding: 40px 0;
}

.empty code {
  background: var(--surface);
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid var(--border);
}
</style>