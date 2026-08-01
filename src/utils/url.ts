// 处理 Astro 的 base 路径（子目录部署时如 /moyue-blog/），保证内部链接正确
export const base = import.meta.env.BASE_URL || '/';

export function withBase(path: string): string {
  if (!path.startsWith('/')) path = '/' + path;
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  return b + path;
}
