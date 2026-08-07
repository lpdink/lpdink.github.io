<script setup>
import SidebarNode from './SidebarNode.vue'

defineProps({
  node: { type: Object, required: true },
  current: { type: String, default: '' }
})
</script>

<template>
  <li v-if="node.type === 'post'" class="s-item">
    <router-link :to="node.url" class="s-link" :class="{ active: node.url === current }">
      {{ node.title }}
    </router-link>
  </li>
  <li v-else class="s-group">
    <span class="s-group-name">{{ node.name }}</span>
    <ul class="s-sub">
      <SidebarNode v-for="c in node.children" :key="c.url || c.name" :node="c" :current="current" />
    </ul>
  </li>
</template>

<style scoped>
.s-item {
  list-style: none;
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