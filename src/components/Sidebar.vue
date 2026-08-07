<script setup>
import { computed } from 'vue'

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
    // drop the last segment (the file name) for grouping
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
    for (const p of sorted) out.push({ type: 'post', ...p })
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
      <template v-for="(node, i) in tree" :key="i">
        <li v-if="node.type === 'group'" class="s-group">
          <span class="s-group-name">{{ node.name }}</span>
          <ul class="s-sub">
            <li v-for="(child, j) in node.children" :key="j">
              <router-link
                v-if="child.type === 'post'"
                :to="child.url"
                class="s-link"
                :class="{ active: child.url === current }"
              >
                {{ child.title }}
              </router-link>
            </li>
          </ul>
        </li>
        <li v-else>
          <router-link :to="node.url" class="s-link" :class="{ active: node.url === current }">
            {{ node.title }}
          </router-link>
        </li>
      </template>
    </ul>
  </nav>
</template>

<style scoped>
.sidebar {
  position: sticky;
  top: 84px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
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

.s-link {
  display: block;
  padding: 7px 10px;
  border-radius: 8px;
  color: var(--text-soft);
  text-decoration: none;
  font-size: 0.9rem;
  line-height: 1.4;
  border-left: 2px solid transparent;
  transition: color 0.15s, background 0.15s;
}

.s-link:hover {
  color: var(--text-strong);
  background: var(--hover);
}

.s-link.active {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 9%, transparent);
  border-left-color: var(--accent);
  font-weight: 600;
}

.s-group-name {
  display: block;
  padding: 10px 10px 4px;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-faint);
}

.s-sub {
  list-style: none;
  margin: 0;
  padding: 0 0 0 10px;
  border-left: 1px solid var(--border);
}
</style>