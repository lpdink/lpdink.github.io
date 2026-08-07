<script setup>
import { computed } from 'vue'
import { posts } from '../content.js'

// docs = everything not under /blog
const docs = computed(() => posts.filter((p) => !p.url.startsWith('/blog')))

// group docs by top-level section then subfolder for a tree-ish listing
const tree = computed(() => {
  const root = { children: {}, posts: [] }
  for (const p of docs.value) {
    const segs = p.rel.split('/').filter(Boolean)
    let node = root
    for (let i = 0; i < segs.length - 1; i++) {
      if (!node.children[segs[i]]) node.children[segs[i]] = { name: segs[i], children: {}, posts: [] }
      node = node.children[segs[i]]
    }
    node.posts.push(p)
  }
  const fold = (node) => {
    const out = []
    const names = Object.keys(node.children).sort((a, b) => a.localeCompare(b, 'zh'))
    for (const n of names) {
      out.push({ type: 'group', name: n, children: fold(node.children[n]) })
    }
    for (const p of node.posts) out.push({ type: 'post', ...p })
    return out
  }
  return fold(root)
})
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="page-title">文档</h1>
      <p class="page-sub">收录 wing-agent 及一些项目的说明文档。</p>
    </header>

    <div class="doc-tree">
      <template v-for="(node, i) in tree" :key="i">
        <div v-if="node.type === 'group'" class="d-group">
          <h3 class="d-group-title">{{ node.name }}</h3>
          <div class="d-group-list">
            <router-link v-for="c in node.children" :key="c.url" :to="c.url" class="d-item">
              {{ c.title }}
            </router-link>
          </div>
        </div>
        <router-link v-else :to="node.url" class="d-item d-item-alone">{{ node.title }}</router-link>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 820px;
  margin: 0 auto;
  padding: 56px 24px 0;
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
  margin: 0 0 40px;
}

.doc-tree {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.d-group-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--text-strong);
  margin: 0 0 12px;
  border-left: 3px solid var(--accent);
  padding-left: 12px;
}

.d-group-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.d-item {
  display: block;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  text-decoration: none;
  font-size: 0.95rem;
  transition: border-color 0.15s, color 0.15s, transform 0.15s;
}

.d-item:hover {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
  transform: translateX(4px);
}

.d-item-alone {
  margin-top: 8px;
}
</style>