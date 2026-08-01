---
title: "现代 CSS 布局完全指南"
date: 2026-07-08
category: "前端技术"
tags: ["CSS","前端","设计"]
description: "Flexbox、Grid、Container Queries——现代 CSS 布局的三大支柱，让响应式设计更简单优雅。"
coverEmoji: "🎨"
draft: false
---

## CSS 布局的演进

从早期的 table 布局，到 float + clearfix，再到 Flexbox 和 Grid，CSS 布局技术经历了一场革命。如今我们有了更强大、更直观的布局工具。

## Flexbox：一维布局之王

Flexbox 适用于一维布局（行或列）：

```css
.flex-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}
```

### 核心属性

| 属性 | 作用 |
|------|------|
| `justify-content` | 主轴对齐 |
| `align-items` | 交叉轴对齐 |
| `flex-grow` | 放大比例 |
| `flex-shrink` | 缩小比例 |
| `gap` | 间距（替代 margin） |

## Grid：二维布局的王者

CSS Grid 是目前最强大的布局系统，适合二维布局：

```css
.grid-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-template-rows: auto 1fr auto;
  gap: 2rem;
}
```

### Grid Areas 实现复杂布局

```css
.page-layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 250px;
  grid-template-rows: auto 1fr auto;
  min-height: 100vh;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }
```

## Container Queries：响应式设计的未来

传统媒体查询基于视口大小，而 Container Queries 基于容器大小：

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}

@container card (max-width: 399px) {
  .card {
    display: flex;
    flex-direction: column;
  }
}
```

这意味着组件可以根据其所在容器的大小自适应，而不依赖整个视口。

## 实战：博客文章布局

```css
.article-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2.5fr) minmax(0, 1fr);
  gap: 3rem;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .article-layout {
    grid-template-columns: 1fr;
  }
}
```

## 现代 CSS 单位

- `fr` — 弹性单位，按比例分配剩余空间
- `ch` — 字符宽度，适合限制阅读行宽
- `min()` / `max()` — 取最小/最大值
- `clamp()` — 在范围内动态调整

```css
/* 响应式字体大小 */
h1 {
  font-size: clamp(1.5rem, 4vw, 3rem);
}

/* 行宽限制 */
.article-content {
  max-width: 65ch;
}
```

## 总结

现代 CSS 布局的三大支柱各有分工：

- **Flexbox** — 一维布局（导航栏、工具栏）
- **Grid** — 二维布局（页面结构、卡片网格）
- **Container Queries** — 组件级响应式

掌握这些技术，几乎可以应对任何布局需求。
