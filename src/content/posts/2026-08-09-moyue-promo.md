---
title: "墨阅：把阅读变成作品"
date: 2026-08-09
category: "技术笔记"
tags: ["墨阅","编程","作品"]
description: "墨阅要做的，就是帮每一个爱读书、爱写字的人，把散落的文章与笔记，汇成一座安静的数字书房。"
coverEmoji: "📚"
draft: false
---

# 墨阅：把阅读变成作品

> 开源阅读 · 知识沉淀 · 个人知识库

![墨阅封面](https://photo.wangxuan.me/.compressed/2026-08-09-moyue/poster.png)

在这个信息过载的时代，我们缺的不是内容，而是**沉淀**。墨阅要做的，就是帮每一个爱读书、爱写字的人，把散落的文章与笔记，汇成一座安静的数字书房。

> 像磨墨一样写文章，像翻书一样逛博客。

它基于 **Astro 5** 与 **Tailwind CSS v4** 重写，丢掉了 Node 后端，内容即 Markdown，构建为纯静态站点。没有数据库、没有运行时依赖、没有黑盒逻辑——你的文字，就是你的网站。

## 三个让人心动的设计

### ⚡ 纯静态，零运行时
Astro 5 + Content Collections，构建后只有 HTML/CSS/JS。秒开、低成本、可部署到 Gitee Pages / GitHub Pages。

### 📚 书籍三栏阅读
专为长内容设计：左侧章节目录、中间正文、右侧内容大纲。读技术书、读大部头，像用 Kindle 般沉浸。

### 🌗 暖色双主题
继承原「墨阅」的暖色阅读主题，并加入防闪烁的暗色模式。深夜读书，也能温柔护眼。

## 把一本书，搬进浏览器

![墨阅三栏书籍阅读](https://photo.wangxuan.me/.compressed/2026-08-09-moyue/article-books.png)

墨阅的书籍模块不是「一篇文章」，而是一套完整的书籍结构。只需在 `src/content/books/` 下按 `书名/章节名/内容.md` 组织，再写一个 `book.json`，博客就会自动生成三栏阅读页。

- ✦ 有序章节列表
- ✦ 右侧 Markdown 大纲
- ✦ 自动封面解析
- ✦ 阅读进度不丢失

## 暗下来，也温柔

![墨阅暗色模式](https://photo.wangxuan.me/.compressed/2026-08-09-moyue/article-dark.png)

很多暗色模式只是「把白底变黑」，刺眼又单调。墨阅的暗色主题重新调色，让深夜阅读也能沉静如水。主题偏好保存在 localStorage，并在首屏渲染前注入，彻底杜绝闪烁。无论白天还是深夜，打开即是最舒服的阅读状态。

## 博客该有的，一样不少

墨阅不是玩具项目。它把个人博客真正会用到的能力，都打磨到了顺手。

- ✦ Markdown + GFM（表格、任务列表、删除线）
- ✦ GitHub Dark 代码高亮
- ✦ 右侧目录 + 滚动高亮（Scrollspy）
- ✦ 分类 / 标签 / 相关文章推荐
- ✦ 自动阅读时间估算 · 首页分页 · 自动 RSS
- ✦ Giscus 评论（基于 GitHub Discussions）

**而且，它也爱 Jupyter Notebook。** 技术博客常常需要跑代码、秀图表。墨阅支持把 `.ipynb` 文件直接作为文章发布，已保存的输出（图片、表格、文本、错误）都会被渲染，构建稳定，无需 Python 环境。

## 三分钟，部署你的墨阅

所有配置集中在 `src/consts.ts`，目录结构类似 Jekyll，上手几乎没有学习成本。

```bash
# 克隆仓库
git clone https://gitee.com/wangyidao/moyue-blog.git

# 安装依赖
npm install

# 本地预览
npm run dev

# 构建静态站点（产物在 dist/）
npm run build
```

部署到 Gitee Pages 或 GitHub Pages 时，只需设置 `SITE_URL` 与 `SITE_BASE` 环境变量，即可自动适配子路径。

## 它适合谁？

- 📖 **读书博主**：想系统整理读书笔记，把一本书拆解成章节长期更新。
- 💻 **技术写作者**：需要代码高亮、Jupyter Notebook、RSS、标签聚合的工程师。
- 🧠 **知识管理控**：想用纯文本 + Git 管理自己的知识体系，拒绝复杂数据库。

## 来，把阅读变成作品

墨阅已开源。给一个 Star，Fork 一份，或者直接把它的灵魂装进你的下一座知识库。

🔗 https://gitee.com/wangyidao/moyue-blog
