// markdown.js — markdown rendering pipeline
// Uses markdown-it (+anchor) for rendering and highlight.js for code.
// Extracts a heading tree (TOC) from the token stream.

import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import yaml from 'highlight.js/lib/languages/yaml'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'
import rust from 'highlight.js/lib/languages/rust'
import go from 'highlight.js/lib/languages/go'
import toml from 'highlight.js/lib/languages/ini'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import sql from 'highlight.js/lib/languages/sql'
import markdown from 'highlight.js/lib/languages/markdown'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('python', python)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('json', json)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('rust', rust)
hljs.registerLanguage('go', go)
hljs.registerLanguage('toml', toml)
hljs.registerLanguage('ini', toml)
hljs.registerLanguage('dockerfile', dockerfile)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('markdown', markdown)

// stable slugify for heading anchors
function slugify(s) {
  const slug = s
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 's'
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
      } catch (e) {
        /* fall through */
      }
    }
    return '' // use default escaping
  }
})

md.use(anchor, { slugify, permalink: false })

// Render a markdown body to HTML string.
function renderMarkdown(body) {
  return md.render(body)
}

// Extract a heading tree [ { level, text, id, children: [] } ] from the body.
function extractToc(body) {
  const tokens = md.parse(body, {})
  const root = []
  const stack = []
  for (const tok of tokens) {
    if (tok.type !== 'heading_open') continue
    const level = Number(tok.tag.slice(1))
    // heading text is the concatenation of inline children
    const inline = tokens[tokens.indexOf(tok) + 1]
    let text = ''
    if (inline && inline.type === 'inline') {
      text = inline.children
        .filter((c) => c.type === 'text' || c.type === 'code_inline')
        .map((c) => c.content)
        .join('')
    }
    const id = slugify(text)
    const node = { level, text, id, children: [] }
    // place in tree based on level
    while (stack.length && stack[stack.length - 1].level >= level) stack.pop()
    if (stack.length) stack[stack.length - 1].children.push(node)
    else root.push(node)
    stack.push(node)
  }
  return root
}

export { renderMarkdown, extractToc, slugify }