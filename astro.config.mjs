// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';

// `site` 用于生成 RSS 的绝对链接与规范链接；`base` 用于子路径部署（Gitee Pages 设为 /moyue-blog/）。
// 部署时可通过环境变量覆盖，例如：SITE_URL=https://<user>.gitee.io/moyue-blog SITE_BASE=/moyue-blog/ npm run build
const SITE_URL = process.env.SITE_URL || 'https://gitee.com/wangyidao/moyue-blog';
const SITE_BASE = process.env.SITE_BASE || '';

export default defineConfig({
  site: SITE_URL,
  base: SITE_BASE,
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    // 代码高亮：使用 GitHub Dark 主题，与原 highlight.js 视觉一致
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
    },
    // GFM：表格、删除线、任务列表、自动链接等
    // 通过 unified() 传入 remark 插件，替代已弃用的 markdown.remarkPlugins
    processor: unified({
      remarkPlugins: [[remarkGfm, { singleTitle: false }]],
    }),
  },
});
