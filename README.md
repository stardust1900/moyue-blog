# 墨阅 (moyue-blog)

一个关于读书与技术分享的个人博客，**使用 Astro 重写、采用类 Jekyll 的纯静态内容架构**。

> 由原 React SPA 项目（`gitee.com/wangyidao/moyue-blog`）改造而来：丢弃 Node 后端，内容即 Markdown，零运行时依赖。

## 特性

- ⚡ **Astro 5** + 内容合集（Content Collections），构建为纯静态站点
- 🎨 **Tailwind CSS v4**，沿用原「墨阅」暖色阅读双主题（浅色 / 深色）
- 📝 Markdown 文章，支持 GFM（表格、任务列表、删除线）与 GitHub Dark 代码高亮
- 📑 文章详情右侧 **目录（TOC）**，带滚动高亮（scrollspy）与平滑跳转
- 🏷️ 分类 / 标签浏览、相关文章推荐（按共享标签）
- 📰 **RSS 订阅**（`/rss.xml`）
- 🌗 **暗色模式**切换（防闪烁，偏好持久化）
- 📄 首页 **分页**
- 💬 **Giscus 评论**（基于 GitHub Discussions 的静态评论）
- 🚀 部署友好：`base` 可配置，适配 Gitee Pages / GitHub Pages 子路径

## 快速开始

```bash
npm install
npm run dev        # 本地预览 http://localhost:4321
npm run build      # 产物输出到 dist/
npm run preview    # 预览构建产物
```

## 目录结构（类 Jekyll）

```
src/
├── consts.ts            # 站点配置（≈ Jekyll _config.yml）：标题/导航/分类元信息/技能/阅读清单/Giscus
├── content.config.ts    # 文章集合 schema（frontmatter 校验）
├── content/posts/       # 文章（≈ Jekyll _posts）：YYYY-MM-DD-slug.md
├── styles/global.css    # 设计 token + 排版 + 暗色主题
├── utils/posts.ts       # 文章查询/排序/分类/标签/相关文章/阅读时间
├── layouts/             # 布局（≈ Jekyll _layouts）
├── components/          # 可复用组件（≈ Jekyll _includes）
└── pages/               # 路由页面
```

## 写一篇新文章

在 `src/content/posts/` 下新建 `YYYY-MM-DD-your-slug.md`：

```markdown
---
title: "文章标题"
date: 2026-08-01
category: "前端技术"
tags: ["Astro", "前端"]
description: "一句话摘要，用于列表与 RSS。"
coverEmoji: "✨"
draft: false
---

正文 Markdown……
```

`readingTime` 会自动根据字数估算，无需手写。`draft: true` 的文章不会被发布。

## 暗色模式

由 `src/components/ThemeToggle.astro` 切换，偏好保存在 `localStorage`；
`<head>` 中有防闪烁脚本在首屏前应用主题。

## RSS

`src/pages/rss.xml.js` 自动生成 `/rss.xml`，无需额外配置。

## Giscus 评论

1. 在 GitHub 安装 [Giscus App](https://github.com/apps/giscus)，并在一个**启用 Discussions** 的公开仓库中开启。
2. 在仓库的 Giscus 设置页获取 `data-repo` / `data-repo-id` / `data-category` / `data-category-id`。
3. 填入 `src/consts.ts` 的 `giscus` 字段（替换 `YOUR_*` 占位符）。

未配置时，文章底部会显示「待启用」提示，不会报错。

## 部署

`astro.config.mjs` 通过环境变量支持子路径部署：

```bash
# Gitee Pages（仓库名 moyue-blog，项目页路径 /moyue-blog/）
SITE_URL=https://<用户名>.gitee.io/moyue-blog SITE_BASE=/moyue-blog/ npm run build

# GitHub Pages（项目页）
SITE_URL=https://<用户名>.github.io/moyue-blog SITE_BASE=/moyue-blog/ npm run build
```

构建后将 `dist/` 内容推送到 Pages 源分支即可。也可使用 `.github/workflows/deploy.yml`（GitHub Pages）自动化。

环境变量：

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `SITE_URL` | 站点绝对地址（RSS / canonical 用） | `https://gitee.com/wangyidao/moyue-blog` |
| `SITE_BASE` | 子路径前缀（如 `/moyue-blog/`） | 空（根路径） |
