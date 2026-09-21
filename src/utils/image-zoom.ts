// 文章内图片与 Mermaid 图表的点击放大查看器（无第三方依赖的轻量 lightbox）
// 交互：点击打开 → 滚轮缩放（以光标为中心）/ 拖拽平移 / 双击复位 / Esc 或点击遮罩关闭

const MIN_SCALE = 0.2;
const MAX_SCALE = 10;
const ZOOM_STEP = 1.15;

export function initImageZoom(): void {
  if (typeof document === 'undefined') return;

  let overlay: HTMLDivElement | null = null;
  let stage: HTMLDivElement | null = null;
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  const apply = () => {
    if (stage) stage.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') close();
  };

  function close() {
    overlay?.remove();
    overlay = null;
    stage = null;
    scale = 1;
    tx = 0;
    ty = 0;
    dragging = false;
    document.removeEventListener('keydown', onKey);
  }

  function open(node: Element) {
    overlay = document.createElement('div');
    overlay.className = 'lightbox';

    stage = document.createElement('div');
    stage.className = 'lightbox-stage';

    if (node instanceof HTMLImageElement) {
      const img = document.createElement('img');
      img.src = node.currentSrc || node.src;
      img.alt = node.alt || '';
      stage.appendChild(img);
    } else {
      // Mermaid SVG：克隆后按 viewBox 等比缩放显示（居中由 .lightbox 的 flex 处理）。
      // 关键：用 viewBox 的实际宽高作为 svg 固有尺寸，否则 mermaid 默认 width="100%"
      // 在 flex 容器里会被解析成 0，导致整图空白。再用 max-width/height 限制不超过视口。
      const svg = node.cloneNode(true) as SVGElement;
      svg.removeAttribute('style');
      const vb = svg.viewBox?.baseVal;
      if (vb && vb.width && vb.height) {
        svg.setAttribute('width', String(vb.width));
        svg.setAttribute('height', String(vb.height));
      }
      svg.style.maxWidth = '92vw';
      svg.style.maxHeight = '92vh';
      svg.style.width = 'auto';
      svg.style.height = 'auto';
      stage.appendChild(svg);
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', '关闭');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });

    const hint = document.createElement('div');
    hint.className = 'lightbox-hint';
    hint.textContent = '滚轮缩放 · 拖拽移动 · 双击复位 · Esc 关闭';

    overlay.appendChild(stage);
    overlay.appendChild(closeBtn);
    overlay.appendChild(hint);

    // 点击遮罩空白处关闭
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    // 滚轮缩放（以光标位置为中心）
    overlay.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const rect = overlay!.getBoundingClientRect();
        const cx = e.clientX - rect.left - rect.width / 2;
        const cy = e.clientY - rect.top - rect.height / 2;
        const next = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, scale * (e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP))
        );
        const ratio = next / scale;
        tx = cx - (cx - tx) * ratio;
        ty = cy - (cy - ty) * ratio;
        scale = next;
        if (scale === 1) {
          tx = 0;
          ty = 0;
        }
        apply();
      },
      { passive: false }
    );

    // 双击复位
    overlay.addEventListener('dblclick', () => {
      scale = 1;
      tx = 0;
      ty = 0;
      apply();
    });

    // 拖拽平移
    overlay.addEventListener('pointerdown', (e) => {
      if ((e.target as Element).closest('.lightbox-close')) return;
      dragging = true;
      startX = e.clientX - tx;
      startY = e.clientY - ty;
      overlay!.classList.add('dragging');
      overlay!.setPointerCapture(e.pointerId);
    });
    overlay.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      tx = e.clientX - startX;
      ty = e.clientY - startY;
      apply();
    });
    const endDrag = () => {
      dragging = false;
      overlay?.classList.remove('dragging');
    };
    overlay.addEventListener('pointerup', endDrag);
    overlay.addEventListener('pointercancel', endDrag);

    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKey);
  }

  // 事件委托：只绑定一次；mermaid 客户端替换 DOM 后依然能命中
  document.addEventListener('click', (e) => {
    if (overlay) return; // lightbox 打开期间由其自身处理点击
    const hit = (e.target as Element).closest('.prose-blog .mermaid svg, .prose-blog img');
    if (!hit) return;
    e.preventDefault();
    open(hit);
  });
}
