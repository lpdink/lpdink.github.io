<script setup>
import { ref, computed } from 'vue'
import { tags, tagMap } from '../content.js'

const active = ref('')

const shown = computed(() => {
  if (!active.value) return []
  return tagMap[active.value] || []
})

function select(t) {
  active.value = active.value === t ? '' : t
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="page-title">标签</h1>
      <p class="page-sub">按主题检索文章。点击一个标签查看相关文章。</p>
    </header>

    <div class="tag-cloud">
      <button
        v-for="t in tags"
        :key="t"
        class="cloud-tag"
        :class="{ active: active === t }"
        @click="select(t)"
      >
        # {{ t }}
        <span class="cloud-count">{{ tagMap[t].length }}</span>
      </button>
    </div>

    <div v-if="active" class="tag-posts">
      <h3 class="tag-posts-title">「{{ active }}」下的文章</h3>
      <router-link v-for="p in shown" :key="p.url" :to="p.url" class="tag-post">
        <span class="tp-title">{{ p.title }}</span>
        <span v-if="p.date" class="tp-date">{{ p.date }}</span>
      </router-link>
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
  margin: 0 0 36px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 40px;
}

.cloud-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-soft);
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.18s;
}

.cloud-tag:hover {
  border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
  color: var(--accent);
  transform: translateY(-2px);
}

.cloud-tag.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.cloud-count {
  font-size: 0.78rem;
  opacity: 0.7;
}

.tag-posts-title {
  font-family: var(--font-display);
  color: var(--text-strong);
  margin: 0 0 16px;
}

.tag-posts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tag-post {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  text-decoration: none;
  transition: border-color 0.15s, color 0.15s;
}

.tag-post:hover {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
}

.tp-date {
  color: var(--text-faint);
  font-size: 0.85rem;
  flex-shrink: 0;
}
</style>