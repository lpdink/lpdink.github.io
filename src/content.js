// content.js — the content engine
// It scans the `content/` directory at build time and turns it into:
//   - a list of markdown posts (with frontmatter metadata)
//   - a list of landing pages (Vue components)
//   - a nested navigation tree derived from the directory structure
//   - a tag index
//
// Content model:
//   content/index.vue        →  /            (home landing / brand showcase)
//   content/about.vue        →  /about       (any other .vue = landing page)
//   content/blog/a.md        →  /blog/a      (markdown = a post)
//   content/docs/zh/b.md     →  /docs/zh/b
//
// Frontmatter (YAML-ish) at the top of each .md:
//   ---
//   title: 我的文章
//   date: 2024-01-01
//   tags: [vue, 记录]
//   description: 一句话摘要
//   ---

// Glob every markdown file as raw text (resolved at build time).
const mdModules = import.meta.glob('../content/**/*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
})
// Glob every Vue landing page component.
const vueModules = import.meta.glob('../content/**/*.vue', {
  eager: true,
  import: 'default'
})

// ---- tiny YAML-ish frontmatter parser -------------------------------
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  let meta = {}
  let body = raw
  if (m) {
    for (const line of m[1].split('\n')) {
      const idx = line.indexOf(':')
      if (idx <= 0) continue
      const key = line.slice(0, idx).trim()
      let val = line.slice(idx + 1).trim()
      if (val.startsWith('[') && val.endsWith(']')) {
        val = val
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean)
      } else {
        val = val.replace(/^['"]|['"]$/g, '')
      }
      meta[key] = val
    }
    body = raw.slice(m[0].length)
  }
  return { meta, body }
}

// Derive a human title from the first H1 in the body if none given.
function deriveTitle(body) {
  const m = body.match(/^#\s+(.+)$/m)
  return m ? m[1].trim() : '未命名'
}

// ---- build manifest ---------------------------------------------------
const posts = []
for (const [absPath, raw] of Object.entries(mdModules)) {
  const rel = absPath.replace('../content/', '').replace(/\.md$/, '')
  const { meta, body } = parseFrontmatter(raw)
  const title = meta.title || deriveTitle(body)
  const tags = Array.isArray(meta.tags) ? meta.tags : meta.tags ? [meta.tags] : []
  const segments = rel.split('/')
  const isIndex = segments[segments.length - 1] === 'index'
  const url = (isIndex ? '/' + segments.slice(0, -1).join('/') : '/' + rel).replace(/\/$/, '') || '/'
  posts.push({
    type: 'md',
    rel,
    url,
    title,
    date: meta.date || '',
    tags,
    description: meta.description || '',
    body,
    raw,
    section: segments[0] === 'index' ? '' : segments[0]
  })
}

// Landing pages (.vue in content)
const pages = []
for (const [absPath, component] of Object.entries(vueModules)) {
  const rel = absPath.replace('../content/', '').replace(/\.vue$/, '')
  const segments = rel.split('/')
  const isIndex = segments[segments.length - 1] === 'index'
  const url = (isIndex ? '/' + segments.slice(0, -1).join('/') : '/' + rel).replace(/\/$/, '') || '/'
  pages.push({ type: 'vue', rel, url, component })
}

// Sort posts: newest date first (empty date → pushes to end)
posts.sort((a, b) => {
  if (!a.date && !b.date) return a.title.localeCompare(b.title, 'zh')
  if (!a.date) return 1
  if (!b.date) return -1
  return String(b.date).localeCompare(String(a.date))
})

// tag index
const tagMap = {}
for (const p of posts) {
  for (const t of p.tags) {
    if (!tagMap[t]) tagMap[t] = []
    tagMap[t].push(p)
  }
}
const tags = Object.keys(tagMap).sort((a, b) => tagMap[b].length - tagMap[a].length)

// ---- navigation tree --------------------------------------------------
// Build a nested tree from URL paths so the sidebar mirrors the folders.
function buildTree(items) {
  const root = { name: '', path: '', children: {}, items: [] }
  for (const item of items) {
    const segs = item.url.split('/').filter(Boolean)
    let node = root
    for (const seg of segs) {
      if (!node.children[seg]) {
        node.children[seg] = { name: seg, path: '', children: {}, items: [] }
      }
      node = node.children[seg]
    }
    node.path = item.url
    node.item = item
  }
  // fold into ordered array
  const fold = (node, depth) => {
    const out = []
    const keys = Object.keys(node.children).sort((a, b) => a.localeCompare(b, 'zh'))
    for (const k of keys) {
      const child = node.children[k]
      const entry = { name: k, path: child.path, depth, children: [], item: child.item }
      entry.children = fold(child, depth + 1)
      out.push(entry)
    }
    if (node.item) {
      // leaf post
      out.push({ name: node.item.title, path: node.item.url, depth, children: [], item: node.item })
    }
    return out
  }
  return fold(root, 0)
}

const navTree = buildTree(posts)

// ---- helpers -----------------------------------------------------------
// find a post by url
function findPost(url) {
  return posts.find((p) => p.url === url) || null
}

// find the sibling posts of a given url (same top-level section)
function siblingsOf(url) {
  const p = findPost(url)
  if (!p) return []
  return posts.filter((x) => x.section === p.section)
}

// posts in a given top-level section
function postsInSection(section) {
  return posts.filter((p) => p.section === section)
}

export { posts, pages, tags, tagMap, navTree, findPost, siblingsOf, postsInSection, parseFrontmatter }