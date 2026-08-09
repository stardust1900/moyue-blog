// 站点级配置（类 Jekyll 的 _config.yml）
export const SITE = {
  title: '墨阅',
  description: '一个关于读书与技术分享的个人博客。记录阅读的思考，分享编程的实践。',
  author: '墨阅',
  url: 'https://github.com/stardust1900/moyue-blog',
  lang: 'zh-CN',
};

export const NAV = [
  { label: '首页', path: '/' },
  { label: '浏览', path: '/posts' },
  { label: '分类', path: '/categories' },
  { label: '标签', path: '/tags' },
  { label: '书籍', path: '/books' },
  { label: '关于', path: '/about' },
];

export const SOCIAL = {
  github: 'https://github.com/stardust1900',
  email: 'mailto:stardust1900@hotmail.com',
  rss: '/rss.xml',
};

// 分类元信息（图标 + 描述），新增分类在此补充
export const categoryMeta: Record<string, { icon: string; description: string }> = {
  '前端技术': { icon: '💻', description: 'React、TypeScript、CSS 等前端开发技术与实践' },
  '后端技术': { icon: '⚙️', description: 'Node.js、数据库、系统设计等后端开发技术' },
  '读书笔记': { icon: '📖', description: '技术书籍与思维类书籍的读书心得与笔记' },
};

export const readingList = [
  { title: '思考，快与慢', author: '丹尼尔·卡尼曼', status: '已读', emoji: '🧠' },
  { title: '代码整洁之道', author: 'Robert C. Martin', status: '已读', emoji: '📘' },
  { title: '程序员修炼之道', author: 'Andrew Hunt', status: '已读', emoji: '🛠️' },
  { title: '深入理解计算机系统', author: 'Randal E. Bryant', status: '阅读中', emoji: '💻' },
  { title: '设计模式', author: 'GoF', status: '计划中', emoji: '🏗️' },
];

export const skills = [
  { name: 'TypeScript', level: 90 },
  { name: 'React', level: 88 },
  { name: 'Node.js', level: 82 },
  { name: 'CSS / Tailwind', level: 85 },
  { name: '数据库', level: 75 },
];

// Giscus 评论配置（需替换为你自己的 GitHub 仓库信息，见 README）
export const giscus = {
  repo: 'stardust1900/moyue-blog',
  repoId: 'R_kgDOTvfv7g',
  category: 'Announcements',
  categoryId: 'DIC_kwDOTvfv7s4DCx9Q',
  mapping: 'pathname',
  lang: 'zh-CN',
};

export const POSTS_PER_PAGE = 6;
