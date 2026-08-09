// Jupyter .ipynb -> HTML 渲染器（纯 Node，不依赖 Python/nbconvert）
// 仅渲染 notebook 中已保存的单元格与执行输出，不重新执行内核，保证构建可复现。
import { marked } from 'marked';
import { codeToHtml } from 'shiki';
import * as yaml from 'js-yaml';

// 与 posts 集合对齐的元信息字段
export interface NotebookMeta {
  title: string;
  date: Date;
  category: string;
  tags: string[];
  description: string;
  coverEmoji: string;
  draft: boolean;
}

export interface NotebookRenderResult {
  meta: NotebookMeta;
  // 已渲染的正文 HTML（markdown 单元格 + 代码单元格 + 输出）
  html: string;
  // 供目录使用的标题列表（从 markdown 单元格的 # 标题提取）
  headings: { depth: number; slug: string; text: string }[];
  // 纯文本，用于估算阅读时间
  plain: string;
}

// marked 启用 GFM（表格、删除线、任务列表、自动链接等），与站点其余 Markdown 行为一致
marked.setOptions({ gfm: true, breaks: false });

// 由 github-slugger 风格生成锚点（中文保留）
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-');
}

// 将一组源文本行拼成字符串
function cellText(source: unknown): string {
  if (Array.isArray(source)) return source.map((s) => (typeof s === 'string' ? s : s?.text ?? '')).join('');
  if (typeof source === 'string') return source;
  return '';
}

// 拆分 markdown 文本中的 frontmatter 与正文，格式与站点 .md 文章一致：
// 以单独一行的 `---` 起始，并以另一个单独一行的 `---` 结束，之间为 YAML 元数据。
interface ParsedFrontmatter {
  body: string; // frontmatter 之后的正文
  data: Record<string, unknown>; // 解析出的元信息键值
}

function splitFrontmatter(md: string): ParsedFrontmatter {
  const lines = md.split('\n');
  if (lines[0]?.trim() !== '---') return { body: md, data: {} };
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (end === -1) return { body: md, data: {} };
  const fm = lines.slice(1, end).join('\n');
  const body = lines.slice(end + 1).join('\n');
  let data: Record<string, unknown> = {};
  try {
    data = (yaml.load(fm) as Record<string, unknown>) ?? {};
  } catch {
    data = {};
  }
  return { body, data };
}

// 从首个 markdown cell 解析 frontmatter 得到元信息；缺失字段回退到文件名/默认值
function parseMetaFromFrontmatter(
  frontmatter: Record<string, unknown>,
  filename: string
): NotebookMeta {
  const dateMatch = /(\d{4}-\d{2}-\d{2})/.exec(filename);
  const fileSlug = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.ipynb$/i, '');

  const rawDate = frontmatter.date;
  const date =
    rawDate instanceof Date
      ? rawDate
      : typeof rawDate === 'string' && rawDate
        ? new Date(rawDate)
        : dateMatch
          ? new Date(dateMatch[1])
          : new Date();

  const rawTags = frontmatter.tags;
  const tags = Array.isArray(rawTags) ? rawTags.map(String) : [];

  const title =
    typeof frontmatter.title === 'string' && frontmatter.title
      ? frontmatter.title
      : fileSlug
        ? fileSlug.replace(/-/g, ' ')
        : '未命名笔记';

  return {
    title,
    date,
    category: typeof frontmatter.category === 'string' && frontmatter.category ? frontmatter.category : '技术笔记',
    tags,
    description: typeof frontmatter.description === 'string' ? frontmatter.description : '',
    coverEmoji: typeof frontmatter.coverEmoji === 'string' && frontmatter.coverEmoji ? frontmatter.coverEmoji : '📓',
    draft: frontmatter.draft === true,
  };
}

// 当 notebook 没有 frontmatter 时，基于文件名 / 默认值生成默认文章元数据（绝不读取 nb.metadata，也不会报错）
function defaultMetaFromFilename(filename: string): NotebookMeta {
  const dateMatch = /(\d{4}-\d{2}-\d{2})/.exec(filename);
  const fileSlug = filename.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.ipynb$/i, '');
  return {
    title: fileSlug ? fileSlug.replace(/-/g, ' ') : '未命名笔记',
    date: dateMatch ? new Date(dateMatch[1]) : new Date(),
    category: '技术笔记',
    tags: [],
    description: '',
    coverEmoji: '📓',
    draft: false,
  };
}

// 处理单个输出项，返回 HTML 字符串
async function renderOutput(output: any): Promise<string> {
  const data = output.data ?? {};
  const items: string[] = [];

  // 图片：image/png、image/jpeg、image/gif、image/svg+xml 内联为 data URI
  for (const [mime, value] of Object.entries(data)) {
    if (mime === 'image/png' || mime === 'image/jpeg' || mime === 'image/gif') {
      const b64 = Array.isArray(value) ? value.join('') : (value as string);
      const ext = mime.split('/')[1];
      items.push(
        `<img class="notebook-output-img" src="data:${mime};base64,${b64}" alt="notebook output" loading="lazy" />`
      );
    } else if (mime === 'image/svg+xml') {
      const svg = Array.isArray(value) ? value.join('') : (value as string);
      items.push(`<div class="notebook-output-svg">${svg}</div>`);
    } else if (mime === 'text/html') {
      const html = Array.isArray(value) ? value.join('') : (value as string);
      items.push(`<div class="notebook-output-html">${html}</div>`);
    } else if (mime === 'text/plain') {
      const text = Array.isArray(value) ? value.join('') : (value as string);
      if (text.trim()) items.push(`<pre class="notebook-output-text">${escapeHtml(text)}</pre>`);
    } else if (mime.startsWith('application/') && mime.includes('json')) {
      const json = Array.isArray(value) ? value.join('') : JSON.stringify(value);
      items.push(`<pre class="notebook-output-text">${escapeHtml(json)}</pre>`);
    }
  }

  // stream / error 文本
  if (output.output_type === 'stream') {
    const text = Array.isArray(output.text) ? output.text.join('') : (output.text ?? '');
    if (text.trim()) items.push(`<pre class="notebook-stream">${escapeHtml(text)}</pre>`);
  }
  if (output.output_type === 'error') {
    const trace = [output.ename, output.evalue, ...(output.traceback ?? [])].join('\n');
    items.push(`<pre class="notebook-error">${escapeHtml(trace)}</pre>`);
  }

  return items.join('\n');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 从 markdown 文本提取 # 标题，生成目录
function extractHeadings(markdown: string): { depth: number; slug: string; text: string }[] {
  const out: { depth: number; slug: string; text: string }[] = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const m = /^(#{1,6})\s+(.*)$/.exec(line.trim());
    if (!m) continue;
    const depth = m[1].length;
    const text = m[2].replace(/#+\s*$/, '').trim();
    out.push({ depth, slug: slugify(text), text });
  }
  return out;
}

// 主入口：解析 ipynb 原文，返回元信息与已渲染 HTML
export async function renderNotebook(raw: string, filename: string): Promise<NotebookRenderResult> {
  let nb: any;
  try {
    nb = JSON.parse(raw);
  } catch {
    throw new Error(`无法解析 notebook：${filename}`);
  }
  const cells: any[] = nb.cells ?? [];

  // 找到第一个 markdown cell 用于读取元信息；没有 frontmatter 时生成默认元数据（不读取 nb.metadata）
  const firstMarkdown = cells.find((c) => c.cell_type === 'markdown');

  // ---- 元信息 ----
  let meta: NotebookMeta;
  if (firstMarkdown) {
    const fmSource = cellText(firstMarkdown.source);
    const { data } = splitFrontmatter(fmSource);
    if (Object.keys(data).length > 0) {
      meta = parseMetaFromFrontmatter(data, filename);
    } else {
      // 第一个 markdown cell 没有 frontmatter：基于文件名 / 默认值生成默认元数据
      meta = defaultMetaFromFilename(filename);
    }
  } else {
    // 没有任何 markdown cell：同样基于文件名 / 默认值生成默认元数据，绝不报错
    meta = defaultMetaFromFilename(filename);
  }

  // ---- 渲染单元格 ----
  const htmlParts: string[] = [];
  const allHeadings: { depth: number; slug: string; text: string }[] = [];
  let plain = '';
  let isFirstMarkdown = true;

  for (const cell of cells) {
    const source = cellText(cell.source);

    if (cell.cell_type === 'markdown') {
      // 第一个 markdown cell：拆分 frontmatter 与正文，仅正文参与渲染/目录/阅读时间
      const md =
        isFirstMarkdown && firstMarkdown === cell
          ? splitFrontmatter(source).body
          : source;
      isFirstMarkdown = false;
      const mdText = md.trim() ? md : source;
      plain += mdText + '\n';
      allHeadings.push(...extractHeadings(mdText));
      htmlParts.push(`<section class="notebook-markdown">${marked.parse(mdText)}</section>`);
    } else if (cell.cell_type === 'code') {
      plain += source + '\n';
      const lang = cell.metadata?.vscode?.language_id ?? 'python';
      const highlighted = await codeToHtml(source, {
        lang,
        theme: 'github-dark',
      }).catch(
        () =>
          `<pre class="shiki"><code>${escapeHtml(source)}</code></pre>`
      );
      const execCount = cell.execution_count != null ? cell.execution_count : '';
      let outputsHtml = '';
      const outputs: any[] = cell.outputs ?? [];
      if (outputs.length) {
        const rendered = await Promise.all(outputs.map((o) => renderOutput(o)));
        outputsHtml = `<div class="notebook-outputs">${rendered.join('\n')}</div>`;
      }
      htmlParts.push(
        `<section class="notebook-code">` +
          `<div class="notebook-code-cell">` +
          `<div class="notebook-input">` +
          `<div class="notebook-prompt">In [${execCount}]:</div>` +
          highlighted +
          `</div>` +
          outputsHtml +
          `</div>` +
          `</section>`
      );
    }
    // 其它 cell_type（raw 等）跳过
  }

  return {
    meta,
    html: htmlParts.join('\n'),
    headings: allHeadings,
    plain,
  };
}
