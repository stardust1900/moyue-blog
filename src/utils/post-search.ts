// 客户端文章表格搜索与高亮逻辑。
// 读取 ?q= 参数，对表格行进行过滤，并在命中字段注入 <mark class="search-hit"> 高亮。

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(el: HTMLElement, q: string): void {
  const field = el.dataset.searchField;
  if (!field) return;
  // 清除旧高亮：用原始文本节点还原
  const original = el.getAttribute('data-original');
  const text = original ?? el.textContent ?? '';
  if (!original) el.setAttribute('data-original', text);

  if (!q) {
    el.textContent = text;
    return;
  }
  const re = new RegExp(`(${escapeRegExp(q)})`, 'gi');
  const parts = text.split(re);
  const lowerQ = q.toLowerCase();
  el.textContent = '';
  for (const part of parts) {
    if (part && part.toLowerCase() === lowerQ) {
      const mark = document.createElement('mark');
      mark.className = 'search-hit';
      mark.textContent = part;
      el.appendChild(mark);
    } else {
      el.appendChild(document.createTextNode(part));
    }
  }
}

function applySearch(q: string): void {
  const tables = document.querySelectorAll<HTMLTableElement>('[data-post-table]');
  for (const table of tables) {
    const rows = table.querySelectorAll<HTMLTableRowElement>('[data-search-row]');
    let visible = 0;
    for (const row of rows) {
      const title = row.dataset.title ?? '';
      const category = row.dataset.category ?? '';
      const tags = row.dataset.tags ?? '';
      const body = row.dataset.body ?? '';
      const haystack = `${title} ${category} ${tags} ${body}`.toLowerCase();
      const match = !q || haystack.includes(q.toLowerCase());
      row.style.display = match ? '' : 'none';
      const fields = row.querySelectorAll<HTMLElement>('[data-search-field]');
      if (match) {
        visible++;
        for (const f of fields) highlight(f, q);
      } else {
        for (const f of fields) {
          const orig = f.getAttribute('data-original');
          if (orig !== null) f.textContent = orig;
        }
      }
    }
    const countEl = document.querySelector<HTMLElement>('[data-search-count]');
    if (countEl) {
      countEl.textContent = q ? `找到 ${visible} 篇匹配「${q}」的文章` : '';
    }
    // 搜索激活时，分页按钮基于服务端全量分页，无法反映过滤结果，故隐藏
    const paginations = document.querySelectorAll<HTMLElement>('nav[aria-label="分页"]');
    for (const nav of paginations) {
      nav.style.display = q ? 'none' : '';
    }
  }
}

function syncDetailLinks(q: string): void {
  const links = document.querySelectorAll<HTMLAnchorElement>('a[data-search-field="title"]');
  for (const link of links) {
    const baseHref = link.dataset.hrefBase ?? link.getAttribute('href') ?? '';
    if (!link.dataset.hrefBase) link.dataset.hrefBase = baseHref;
    link.setAttribute('href', q ? `${baseHref}?q=${encodeURIComponent(q)}` : baseHref);
  }
}

export function initPostSearch(): void {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q')?.trim() ?? '';
  applySearch(q);
  syncDetailLinks(q);
  window.addEventListener('post-search', (e: Event) => {
    const detail = (e as CustomEvent<{ q: string }>).detail;
    const qq = detail.q.trim();
    applySearch(qq);
    syncDetailLinks(qq);
  });
}
