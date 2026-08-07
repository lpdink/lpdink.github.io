<script setup>
import { computed } from 'vue'
import SidebarNode from './SidebarNode.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  current: { type: String, default: '' },
  section: { type: String, default: '' }
})

// Build a nested tree from sibling rel-paths so subfolders show as groups.
const tree = computed(() => {
  const root = { name: '', children: {}, posts: [] }
  for (const item of props.items) {
    const segs = item.rel.split('/').filter(Boolean)
    let node = root
    for (let i = 0; i < segs.length - 1; i++) {
      if (!node.children[segs[i]]) node.children[segs[i]] = { name: segs[i], children: {}, posts: [] }
      node = node.children[segs[i]]
    }
    node.posts.push(item)
  }
  const fold = (node) => {
    const out = []
    const names = Object.keys(node.children).sort((a, b) => a.localeCompare(b, 'zh'))
    for (const n of names) {
      out.push({ type: 'group', name: n, children: fold(node.children[n]) })
    }
    const sorted = [...node.posts].sort((a, b) => a.title.localeCompare(b.title, 'zh'))
    for (const p of sorted) out.push({ ...p, type: 'post' })
    return out
  }
  return fold(root)
})

const label = computed(() => {
  const map = { blog: '博客', docs: '文档', notes: '笔记' }
  return map[props.section] || props.section || '目录'
})
</script>

<template>
  <nav class="sidebar">
    <div class="sidebar-title">{{ label }}</div>
    <ul class="sidebar-list">
      <SidebarNode v-for="n in tree" :key="n.url || n.name" :node="n" :current="current" />
    </ul>
  </nav>
</template>

<style scoped>
.sidebar {
  padding-right: 6px;
}

.sidebar-title {
  font-family: var(--font-display);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-faint);
  margin-bottom: 14px;
}

.sidebar-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>