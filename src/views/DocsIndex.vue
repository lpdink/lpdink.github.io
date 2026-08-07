<script setup>
import { computed } from 'vue'
import { posts } from '../content.js'
import DocNode from '../components/DocNode.vue'

// docs = everything not under /blog
const docs = computed(() => posts.filter((p) => !p.url.startsWith('/blog')))

// group docs by their directory structure for a tree-ish listing
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
    for (const p of node.posts) out.push({ ...p, type: 'post' })
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
      <DocNode v-for="n in tree" :key="n.url || n.name" :node="n" />
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
  gap: 24px;
}
</style>