// 文章详情页搜索高亮：读取 URL 中的 ?q=，在正文中定位首个匹配并高亮、滚动到该位置。

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function initArticleHighlight(): void {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q')?.trim() ?? '';
  if (!q) return;

  const container = document.querySelector<HTMLElement>('.prose-blog');
  if (!container) return;

  const re = new RegExp(`(${escapeRegExp(q)})`, 'gi');
  const lowerQ = q.toLowerCase();

  // 收集需要处理的文本节点（跳过 script / style）
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const value = node.nodeValue ?? '';
      if (!value.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (parent && (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE')) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const targets: Text[] = [];
  let current: Node | null;
  while ((current = walker.nextNode())) {
    const text = (current as Text).nodeValue ?? '';
    if (text.toLowerCase().includes(lowerQ)) targets.push(current as Text);
  }

  let firstMark: HTMLElement | null = null;

  for (const node of targets) {
    const text = node.nodeValue ?? '';
    const parts = text.split(re);
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (!part) continue;
      if (part.toLowerCase() === lowerQ) {
        const mark = document.createElement('mark');
        mark.className = 'search-hit';
        mark.textContent = part;
        frag.appendChild(mark);
        if (!firstMark) firstMark = mark;
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    }
    node.parentNode?.replaceChild(frag, node);
  }

  if (firstMark) {
    firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
