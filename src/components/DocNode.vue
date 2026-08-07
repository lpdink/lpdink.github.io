<script setup>
import DocNode from './DocNode.vue'

defineProps({
  node: { type: Object, required: true }
})
</script>

<template>
  <div v-if="node.type === 'group'" class="d-group">
    <h3 class="d-group-title">{{ node.name }}</h3>
    <div class="d-group-children">
      <DocNode v-for="c in node.children" :key="c.url || c.name" :node="c" />
    </div>
  </div>
  <router-link v-else :to="node.url" class="d-item">{{ node.title }}</router-link>
</template>

<style scoped>
.d-group-title {
  font-family: var(--font-display);
  font-size: 1.1rem;
  color: var(--text-strong);
  margin: 0 0 12px;
  border-left: 3px solid var(--accent);
  padding-left: 12px;
}

.d-group-children {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 16px;
  margin-top: 10px;
  border-left: 1px solid var(--border);
  padding-left: 16px;
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
</style>