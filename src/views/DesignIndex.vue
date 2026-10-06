<script setup>
import { computed } from 'vue'
import { postsInSection, STATUS } from '../content.js'

// Design docs live under content/design/*.md (URL /design/<slug>).
// Future docs are picked up automatically: drop a file in, push, done.
// A subfolder under content/design/ becomes a series group on this page.
const docs = computed(() => postsInSection('design'))

function groupOf(p) {
  const segs = p.rel.split('/') // design/<group?>/<slug>
  return segs.length > 2 ? segs[1] : ''
}

// Sort: group name → explicit `order` → newest date first.
const sorted = computed(() =>
  [...docs.value].sort((a, b) => {
    const ga = groupOf(a)
    const gb = groupOf(b)
    if (ga !== gb) return (ga || '').localeCompare(gb || '', 'zh')
    if (a.order !== b.order) return (a.order || 99) - (b.order || 99)
    return String(b.date).localeCompare(String(a.date))
  })
)

// Fold into contiguous groups (series), keeping a global № numbering.
const groups = computed(() => {
  const out = []
  let i = 0
  for (const p of sorted.value) {
    const name = groupOf(p)
    if (!out.length || out[out.length - 1].name !== name) {
      out.push({ name, items: [] })
    }
    out[out.length - 1].items.push({ ...p, no: i + 1 })
    i += 1
  }
  return out
})

const total = computed(() => docs.value.length)

function statusLabel(s) {
  return s ? STATUS[s] || s : ''
}
function formatDate(d) {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${y}.${Number(m)}.${Number(day)}`
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <h1 class="page-title">方案设计</h1>
      <p class="page-sub">
        先讲清楚，再动手改 —— 涉及核心数据模型、协议与产品面的改动，都在这里以方案的形式先评审。
      </p>
    </header>

    <section class="brief">
      <div class="brief-line">
        这里收录 <b>{{ total }}</b> 份方案。每份方案应讲清四件事：<b>问题是什么</b>、<b>核心设计是什么</b>、<b>旧数据怎么兼容</b>、<b>分几步落地</b>。
      </div>
      <div class="chips">
        <span class="chip">单一事实源</span>
        <span class="chip">自描述 Schema</span>
        <span class="chip">空值不存储（0 / False 保留）</span>
        <span class="chip">生成与投影，不复制</span>
      </div>
      <p class="brief-note">
        本期两案一起立地基：<b>存储面</b>（Session 数据模型：同一份历史只存一遍）与
        <b>设置面</b>（Config：不再手改配置文件，接口与界面直接改、即时生效）。二者共享上面同一套方法论。
      </p>
    </section>

    <section class="list">
      <template v-for="g in groups" :key="g.name || 'flat'">
        <h2 v-if="g.name" class="series">{{ g.name }}</h2>
        <article v-for="d in g.items" :key="d.url" class="card">
          <div class="no">№{{ String(d.no).padStart(2, '0') }}</div>
          <div class="main">
            <div class="top">
              <router-link :to="d.url" class="title">{{ d.title }}</router-link>
              <span v-if="d.status" class="st" :class="'st-' + d.status">{{ statusLabel(d.status) }}</span>
            </div>
            <p v-if="d.description" class="desc">{{ d.description }}</p>
            <div class="meta">
              <span v-if="d.date">{{ formatDate(d.date) }}</span>
              <span v-for="t in d.tags" :key="t" class="tag"># {{ t }}</span>
            </div>
          </div>
          <router-link :to="d.url" class="go" aria-label="阅读">→</router-link>
        </article>
      </template>

      <p v-if="!groups.length" class="empty">还没有方案。往 content/design/ 里丢一个 .md 就会出现在这里。</p>
    </section>

    <section class="howto">
      <h2 class="howto-title">怎么写一篇 / 增量约定</h2>
      <ol>
        <li>在 <code>content/design/</code> 新建 <code>&lt;slug&gt;.md</code>（放进子目录 = 归入某个系列）。</li>
        <li>frontmatter 写五件套：<code>title</code> / <code>date</code> / <code>status</code> / <code>description</code> / <code>tags</code>（系列内排序可加 <code>order</code>）。</li>
        <li>推上去。本页与侧栏自动收录，不需要改任何代码。</li>
      </ol>
      <div class="legend">
        <span v-for="(label, key) in STATUS" :key="key" class="st" :class="'st-' + key">{{ label }}</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.page {
  max-width: 880px;
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
  margin: 0 0 32px;
}

.brief {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 22px 24px;
  margin-bottom: 40px;
}

.brief-line {
  color: var(--text);
  font-size: 0.98rem;
}

.brief-note {
  color: var(--text-soft);
  font-size: 0.92rem;
  margin: 16px 0 0;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.chip {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.series {
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--text-faint);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 20px 0 4px;
}

.card {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 20px 22px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  text-decoration: none;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
}

.card:hover {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.no {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  color: var(--text-faint);
  padding-top: 3px;
  min-width: 44px;
}

.main {
  flex: 1;
  min-width: 0;
}

.top {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.title {
  font-size: 1.12rem;
  font-weight: 600;
  color: var(--text-strong);
  text-decoration: none;
}

.card:hover .title {
  color: var(--accent);
}

.desc {
  margin: 8px 0 10px;
  color: var(--text-soft);
  font-size: 0.94rem;
  line-height: 1.6;
}

.meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--text-faint);
  font-size: 0.82rem;
}

.go {
  color: var(--text-faint);
  font-size: 1.1rem;
  padding-top: 2px;
  transition: color 0.15s, transform 0.15s;
}

.card:hover .go {
  color: var(--accent);
  transform: translateX(3px);
}

.empty {
  color: var(--text-faint);
  padding: 24px 0;
}

.howto {
  margin: 56px 0 0;
  padding: 24px 26px;
  border: 1px dashed var(--border-strong);
  border-radius: 16px;
  background: var(--bg-soft);
}

.howto-title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  color: var(--text-strong);
  margin: 0 0 12px;
}

.howto ol {
  margin: 0 0 14px;
  padding-left: 1.3em;
  color: var(--text-soft);
  font-size: 0.92rem;
}

.howto li {
  margin: 6px 0;
}

.howto code {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.1em 0.35em;
  font-size: 0.85em;
  color: var(--accent);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* status chips (shared visual language with PostView) */
.st {
  padding: 2px 12px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
  border: 1px solid;
  flex: none;
}
.st-draft {
  color: var(--text-soft);
  border-color: var(--border-strong);
  background: var(--surface-2);
}
.st-proposed {
  color: #a97a1c;
  border-color: #d9b25e;
  background: color-mix(in srgb, #d9b25e 16%, transparent);
}
.st-accepted,
.st-implementing {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  background: var(--accent-soft);
}
.st-done {
  color: #fff;
  border-color: var(--accent);
  background: var(--accent);
}
.st-superseded {
  color: var(--text-faint);
  border-color: var(--border);
  background: transparent;
  text-decoration: line-through;
}
</style>
