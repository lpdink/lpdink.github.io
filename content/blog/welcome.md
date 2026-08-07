---
title: 开张了：手写一个小站
date: 2024-08-07
tags: [随笔, 建站]
description: 关于这个站点是怎么来的，为什么不用现成框架，以及以后会写点什么。
---

# 开张了：手写一个小站

> 这个站点今天正式开张了。没有用任何成熟的博客框架，是我自己用 Vue 手搭的。

## 为什么又要折腾

市面上的博客框架其实都很好用，Hugo、Jekyll、VuePress、Astro……随便挑一个都能在十分钟内上线。但**千篇一律**，每个人都长得差不多，没什么意思。

我想要的其实很简单：

- 想写的时候就写，**只写 Markdown**，剩下的交给它自己长出来；
- 目录结构自动变成导航，标题自动变成目录，标签自动聚合成页；
- 还需要一个漂亮的落地页，感觉对了比什么都重要。

于是干脆自己写了一个小的内容引擎，把 `content/` 目录扫描成站点。

## 内容模型

在 `content/` 里，一个 Markdown 文件就是一篇内容，文件路径就是它的网址：

```
content/
  index.vue          →  /              （首页落地页）
  blog/
    welcome.md       →  /blog/welcome
    wing-agent.md    →  /blog/wing-agent
  docs/
    zh/config.md     →  /docs/zh/config
```

每篇 Markdown 顶部可以写一点 frontmatter：

```yaml
---
title: 开张了：手写一个小站
date: 2024-08-07
tags: [随笔, 建站]
description: 一段摘要
---
```

## 技术栈

| 部分 | 选择 |
| --- | --- |
| 框架 | Vue 3 + Vite |
| 渲染 | markdown-it + highlight.js |
| 部署 | GitHub Actions → GitHub Pages |
| 主题 | 浅绿 + 暗色一键切换 |

## 以后写点什么

大概会写一些折腾记录、技术笔记、还有一些零碎的思考。不保证高产，但保证真实。

感谢你路过这片后院。🌿