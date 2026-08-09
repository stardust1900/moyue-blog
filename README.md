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
- 📚 **书籍模块**：书籍列表 + 三栏阅读模式（章节树 / 正文 / 内容大纲）
- 🌗 **暗色模式**切换（防闪烁，偏好持久化）
- 📄 首页 **分页**
- 💬 **Giscus 评论**（基于 GitHub Discussions 的静态评论）
- 🚀 部署友好：`base` 可配置，适配 Gitee Pages / GitHub Pages 子路径

## 快速开始

**环境要求**：Node.js 18.20.8+（或 20 / 22 LTS），npm 9+。

```bash
npm install        # 安装依赖
npm run dev        # 本地开发预览 http://localhost:4321
npm run build      # 构建静态站点，产物输出到 dist/
npm run preview    # 本地预览构建产物
npm run check      # 类型检查（需首次交互安装 @astrojs/check）
```

依赖安装一次后，日常只需 `npm run dev`（开发）或 `npm run build`（发布）。

## 目录结构（类 Jekyll）

```
src/
├── consts.ts            # 站点配置（≈ Jekyll _config.yml）：标题/导航/分类元信息/技能/阅读清单/Giscus
├── content.config.ts    # 文章集合 schema（frontmatter 校验）
├── content/posts/       # 文章（≈ Jekyll _posts）：YYYY-MM-DD-slug.md
├── content/notebooks/   # Jupyter 笔记本文章：YYYY-MM-DD-slug.ipynb
├── content/books/       # 书籍（书名/章节名/内容.md）：元信息与封面放书名目录
├── styles/global.css    # 设计 token + 排版 + 暗色主题
├── utils/posts.ts       # 文章查询/排序/分类/标签/相关文章/阅读时间
├── utils/books.ts       # 书籍扫描/章节排序/封面解析
├── layouts/             # 布局（≈ Jekyll _layouts）
├── components/          # 可复用组件（≈ Jekyll _includes）
└── pages/               # 路由页面
    ├── books/index.astro          # 书籍列表页（/books）
    └── books/[book]/[chapter].astro  # 阅读页（/books/书名/章节名）
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

> 文件名必须以 `YYYY-MM-DD-slug` 开头（如 `2026-08-01-my-post.md`），日期用于排序与默认发布时间；`slug`（连字符分隔）同时作为访问 URL，`title` 可自由书写。

**通用 frontmatter 字段**（Markdown 与 Notebook 文章一致）：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 建议 | 文章标题，缺省时按文件名生成 |
| `date` | 否 | 发布日期，缺省时按文件名推导 |
| `category` | 否 | 分类，缺省 `技术笔记` |
| `tags` | 否 | 标签数组，用于聚合与推荐 |
| `description` | 否 | 列表 / RSS 摘要 |
| `coverEmoji` | 否 | 列表封面 emoji，缺省 `📓` |
| `draft` | 否 | `true` 时不发布 |

## 写一篇 Jupyter Notebook 文章

在 `src/content/notebooks/` 下放置 `YYYY-MM-DD-your-slug.ipynb`，博客会自动将其渲染为一篇文章，并复用与 Markdown 文章一致的详情页、目录、相关文章与评论。**代码单元格会使用 GitHub Dark 主题高亮，已保存的执行输出（图片 / 表格 / 文本 / 错误）也会被渲染**，但不会重新执行内核，构建稳定可复现。

### 元信息（frontmatter）

元信息写在 **notebook 第一个 Markdown 单元格的顶部**，格式与 Markdown 文章完全一致（`---` 包裹的 YAML），正文写在 frontmatter 之后：

```markdown
---
title: "用 Pandas 分析销售数据"
date: 2026-08-01
category: "后端技术"
tags: ["Python", "数据分析"]
description: "一句话摘要，用于列表与 RSS。"
coverEmoji: "📊"
draft: false
---

# 正文标题

你的 notebook 正文……
```

| 字段 | 说明 | 默认值 |
| --- | --- | --- |
| `title` | 文章标题 | 文件名（去日期前缀，连字符转空格） |
| `date` | 发布日期 | 从文件名 `YYYY-MM-DD` 推导，否则取当前日期 |
| `category` | 分类 | `技术笔记` |
| `tags` | 标签数组 | `[]` |
| `description` | 摘要（列表 / RSS 用） | 空 |
| `coverEmoji` | 封面 emoji | `📓` |
| `draft` | 是否为草稿 | `false` |

> 若 notebook 没有 frontmatter，**不会报错**，会基于文件名与默认值自动生成上述默认元数据，正常发布。

notebook 文章与 Markdown 文章在首页、分类、标签、RSS、分页中**自动合并展示**；详情页路由为 `/notebooks/<slug>/`，与 `/posts/<slug>/` 相互独立，不会发生 slug 冲突。

## 添加一本书

书籍内容存放在 `src/content/books/`，采用 `书名/章节名/内容.md` 的组织方式。导航栏「书籍」菜单（`/books`）会列出所有书籍，点击卡片进入阅读模式：**左侧章节树、中间正文、右侧内容大纲（基于 Markdown 标题）**。

### 目录结构

```
src/content/books/
└── 思考快与慢/              # 书名目录（= 书籍 slug，用于 URL）
    ├── book.json           # 书籍元信息 + 有序章节列表
    ├── cover.svg           # 封面图（png/jpg/jpeg/webp/svg/gif 均可）
    ├── 第一章/
    │   └── 内容.md         # 章节正文
    └── 第二章/
        └── 内容.md
```

### book.json

```json
{
  "title": "思考，快与慢",
  "author": "丹尼尔·卡尼曼",
  "cover": "cover.svg",
  "chapters": [
    { "slug": "第一章", "title": "第一章 系统1与系统2" },
    { "slug": "第二章", "title": "第二章 注意力与效能" }
  ]
}
```

| 字段 | 说明 |
| --- | --- |
| `title` | 书名（展示用） |
| `author` | 作者 |
| `cover` | 封面文件名，须与书名目录下的图片同名 |
| `chapters` | **有序**章节列表（可选）。`slug` 对应章节目录名；`title` 可选，覆盖目录名作为展示标题 |

章节会严格按 `chapters` 数组定义的顺序展示；未在该数组中声明的章节会自动排在后面（按目录名排序），不会遗漏。

### 正文

每个章节目录下放置 `内容.md`，内容即为该章正文。正文中的 `##` / `###` 等 Markdown 标题会自动生成右侧大纲锚点。

### 导航与路由

- 书籍列表：`/books`
- 阅读页：`/books/<书名>/<章节名>`（书名、章节名会自动 URL 编码，中文无需处理）
- 新增书籍只需在 `src/content/books/` 下放置上述结构，重新构建即可自动收录。

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

## 常见问题

- **Notebook 代码会重新执行吗？** 不会。只渲染 notebook 中已保存的单元格与输出，保证构建可复现、无需 Python 环境。
- **Notebook 没有写元信息会报错吗？** 不会。未写 frontmatter 时按文件名与默认值生成文章元数据并正常发布。
- **草稿如何不被发布？** Markdown / Notebook 的 frontmatter 加 `draft: true` 即可（首页、RSS、详情页均会排除）。
- **修改站点信息 / 导航 / Giscus / 阅读清单？** 统一在 `src/consts.ts` 配置，无需改动组件。
- **分类、标签、相关文章需要额外配置吗？** 不需要，均由文章 frontmatter 自动聚合；相关文章按共享标签推荐。
- **本地开发端口被占用？** 用 `npm run dev -- --port 4000` 指定其他端口。
