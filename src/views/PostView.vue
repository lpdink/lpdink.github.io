<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { findPost, siblingsOf, posts } from '../content.js'
import { renderMarkdown, extractToc } from '../markdown.js'
import Sidebar from '../components/Sidebar.vue'
import Toc from '../components/Toc.vue'

const route = useRoute()

const post = computed(() => findPost(route.path))
const html = computed(() => (post.value ? renderMarkdown(post.value.body) : ''))
const toc = computed(() => (post.value ? extractToc(post.value.body) : []))
const siblings = computed(() => (post.value ? siblingsOf(route.path) : []))
const section = computed(() => (post.value ? post.value.section : ''))

function formatDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${y} 年 ${Number(m)} 月 ${Number(day)} 日`
}
</script>

<template>
  <div v-if="post" class="post-layout">
    <aside class="post-sidebar">
      <Sidebar :items="siblings" :current="route.path" :section="section" :posts="posts" />
    </aside>

    <article class="post">
      <header class="post-head">
        <h1 class="post-title">{{ post.title }}</h1>
        <div class="post-meta">
          <span v-if="post.date" class="meta-date">发布于 {{ formatDate(post.date) }}</span>
          <span v-if="post.updated" class="meta-updated">更新于 {{ formatDate(post.updated) }}</span>
          <span class="meta-tags">
            <router-link v-for="t in post.tags" :key="t" class="tag" :to="'/tags'">
              # {{ t }}
            </router-link>
          </span>
        </div>
      </header>

      <div class="post-body" v-html="html"></div>

      <footer class="post-foot">
        <div class="post-tags" v-if="post.tags.length">
          <span class="foot-label">标签</span>
          <router-link v-for="t in post.tags" :key="t" class="tag tag-lg" :to="'/tags'"># {{ t }}</router-link>
        </div>
      </footer>
    </article>

    <aside class="post-toc-col">
      <Toc v-if="toc.length" :toc="toc" />
    </aside>
  </div>
  <div v-else class="not-found">
    <h1>页面不存在</h1>
    <router-link to="/blog" class="back-link">← 回到博客</router-link>
  </div>
</template>

<style scoped>
.post-layout {
  max-width: 1180px;
  margin: 0 auto;
  padding: 40px 24px 0;
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr) 240px;
  column-gap: 48px;
  align-items: start;
}

.post {
  min-width: 0;
  max-width: 700px;
  margin: 0 auto;
}

/* Sticky columns: stick relative to the viewport while the article scrolls,
   with a solid background so nothing overlaps unreadably. */
.post-sidebar,
.post-toc-col {
  position: sticky;
  top: 84px;
  align-self: start;
  max-height: calc(100vh - 104px);
  overflow-y: auto;
  background: var(--bg);
  border-radius: 12px;
  padding: 4px;
}

/* Extra breathing room so the TOC never touches the article. */
.post-toc-col {
  padding-left: 12px;
}

.post-head {
  margin-bottom: 32px;
}

.post-title {
  font-family: var(--font-display);
  font-size: clamp(1.6rem, 4vw, 2.3rem);
  line-height: 1.25;
  color: var(--text-strong);
  margin: 0 0 16px;
  letter-spacing: -0.01em;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  color: var(--text-faint);
  font-size: 0.9rem;
}

.meta-tags {
  display: flex;
  gap: 10px;
}

.meta-updated {
  color: var(--accent);
  font-size: 0.85rem;
}

.tag {
  color: var(--accent);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.9rem;
}

.tag:hover {
  text-decoration: underline;
}

.post-body {
  font-size: 1.02rem;
  line-height: 1.85;
  color: var(--text);
}

.post-foot {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--border);
}

.post-tags {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.foot-label {
  color: var(--text-faint);
  font-size: 0.9rem;
}

.tag-lg {
  padding: 4px 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  font-size: 0.85rem;
}

.not-found {
  text-align: center;
  padding: 120px 24px;
}

.back-link {
  color: var(--accent);
  text-decoration: none;
}

@media (max-width: 1024px) {
  .post-layout {
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 24px;
  }
  .post-toc-col {
    display: none;
  }
}

@media (max-width: 720px) {
  .post-layout {
    grid-template-columns: 1fr;
    padding: 24px 18px 0;
  }
  .post-sidebar {
    display: none;
  }
}
</style>