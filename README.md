# lpdink.github.io 🌿

手写的 Vue 静态小站 —— 独立开发者的博客与作品集。跑在 GitHub Pages 上。

## 特性

- **只写 Markdown**：往 `content/` 里丢 `.md` 文件，push 就自动更新
- **目录结构感知**：文件夹层级自动变成侧边栏导航
- **标题感知**：标题自动生成锚点 + 每页右侧 TOC 目录
- **标签感知**：frontmatter 里的 `tags` 自动聚合到 `/tags` 页
- **落地页支持**：`.vue` 文件可直接作为独立页面（如首页品牌展示页）
- **浅绿主题** + 暗色模式一键切换
- Vue 3 + Vite + markdown-it + highlight.js，GitHub Actions 自动部署

## 内容怎么写

```
content/
  index.vue          →  /              （首页落地页，Vue 组件）
  blog/
    welcome.md       →  /blog/welcome   （Markdown 文章）
  docs/
    zh/config.md     →  /docs/zh/config
```

每篇 Markdown 顶部可写 frontmatter：

```markdown
---
title: 文章标题
date: 2024-08-07
tags: [随笔, 技术]
description: 一句话摘要
---
```

正文用标准 Markdown 即可，代码块自动高亮。

## 本地开发

```bash
npm install
npm run dev      # 本地预览
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
```

## 部署

GitHub Actions（`.github/workflows/deploy.yml`）在 push 到 `main` 后自动构建，并把构建产物发布到仓库根目录（`index.html` + `assets/`），同时上传 `dist` 工件。

所以 GitHub Pages 的 **Source** 无论设为 **「Deploy from a branch (main / root)」** 还是 **「GitHub Actions」**，站点都能正常显示，无需额外配置。站名用的是默认子域名 `lpdink.github.io`。

> 注意：源码入口在 `src/index.html`，`npm run dev` 会用它；仓库根目录的 `index.html` 是构建产物，由 CI 自动生成，不要手动编辑。

## 技术栈

| 部分 | 选择 |
| --- | --- |
| 框架 | Vue 3 + Vite |
| Markdown 渲染 | markdown-it + highlight.js |
| 部署 | GitHub Actions → GitHub Pages |