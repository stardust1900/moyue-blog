// 自定义 Astro Loader：扫描 src/content/notebooks/**/*.ipynb，
// 解析 JSON 并渲染为统一 Post 数据（含已渲染 HTML 正文 bodyHtml）。
// 不重新执行内核，仅渲染 notebook 中已保存的单元格与输出。
import type { Loader, LoaderContext } from 'astro/loaders';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderNotebook } from '../utils/notebook-render';

const NOTEBOOKS_DIR = 'src/content/notebooks';

// 递归收集目录下所有 .ipynb 文件
async function collectIpynb(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out; // 目录不存在则视为无 notebook
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await collectIpynb(full)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.ipynb')) {
      out.push(full);
    }
  }
  return out;
}

export function notebookLoader(): Loader {
  return {
    name: 'notebook-loader',
    async load(context: LoaderContext): Promise<void> {
      const root = fileURLToPath(context.config.root);
      const basePath = path.resolve(root, NOTEBOOKS_DIR);
      const files = await collectIpynb(basePath);

      // 清空旧数据（保证增量构建正确）
      const store = context.store;
      store.clear();

      for (const file of files) {
        const raw = await fs.readFile(file, 'utf-8');
        const relName = path.relative(basePath, file); // 形如 2026-01-01-my-note.ipynb
        const id = relName.replace(/\.ipynb$/i, ''); // entry.id：去扩展名，保留子目录/日期前缀
        try {
          const { meta, html, headings, plain } = await renderNotebook(raw, relName);
          store.set({
            id,
            data: {
              title: meta.title,
              date: meta.date,
              category: meta.category,
              tags: meta.tags,
              description: meta.description,
              coverEmoji: meta.coverEmoji,
              draft: meta.draft,
              // 扩展字段：notebook 专用
              bodyHtml: html,
              headings,
              plain,
            },
            // body 设为纯文本，供 estimateReadingTime 兜底
            body: plain,
          });
        } catch (err) {
          context.logger.warn(`跳过 notebook ${relName}：${(err as Error).message}`);
        }
      }
    },
  };
}
