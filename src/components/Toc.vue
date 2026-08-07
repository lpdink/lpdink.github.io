<script setup>
defineProps({
  toc: { type: Array, default: () => [] }
})
</script>

<template>
  <nav class="toc">
    <div class="toc-label">本页目录</div>
    <ul class="toc-list">
      <li v-for="h in toc" :key="h.id">
        <a :href="'#' + h.id" class="toc-link" :class="'lv-' + h.level">{{ h.text }}</a>
        <ul v-if="h.children.length" class="toc-sub">
          <li v-for="c in h.children" :key="c.id">
            <a :href="'#' + c.id" class="toc-link" :class="'lv-' + c.level">{{ c.text }}</a>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.toc {
  position: sticky;
  top: 84px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  border-left: 1px solid var(--border);
  padding-left: 16px;
}

.toc-label {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-faint);
  margin-bottom: 12px;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toc-sub {
  list-style: none;
  margin: 6px 0 0;
  padding: 0 0 0 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.toc-link {
  display: block;
  color: var(--text-soft);
  text-decoration: none;
  font-size: 0.86rem;
  line-height: 1.4;
  transition: color 0.15s;
}

.toc-link:hover {
  color: var(--accent);
}

.toc-link.lv-2 {
  font-weight: 600;
  color: var(--text);
}

.toc-link.lv-3 {
  font-size: 0.82rem;
  color: var(--text-faint);
}
</style>