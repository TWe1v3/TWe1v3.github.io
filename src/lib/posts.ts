export interface PostMeta {
  title: string;
  date: string;
  desc: string;
  href: string;
  tags: string[];
}

interface PostModule {
  postMeta?: Partial<PostMeta>;
  frontmatter?: Partial<PostMeta>;
}

const postModules = import.meta.glob<PostModule>('../pages/posts/*.{astro,md}', { eager: true });

function inferHref(sourcePath: string) {
  return sourcePath
    .replace('../pages', '')
    .replace(/\/index$/, '')
    .replace(/\.astro$/, '')
    .replace(/\.md$/, '');
}

function normalizePost(sourcePath: string, mod: PostModule): PostMeta | null {
  const raw = mod.postMeta ?? mod.frontmatter;
  if (!raw?.title || !raw?.date) return null;

  return {
    title: raw.title,
    date: raw.date,
    desc: raw.desc ?? '',
    href: raw.href ?? inferHref(sourcePath),
    tags: raw.tags ?? []
  };
}

export function getAllPosts() {
  return Object.entries(postModules)
    .map(([sourcePath, mod]) => normalizePost(sourcePath, mod))
    .filter((post): post is PostMeta => Boolean(post))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getArchiveGroups() {
  const grouped = getAllPosts().reduce<Record<string, PostMeta[]>>((acc, post) => {
    const month = post.date.slice(0, 7);
    acc[month] ??= [];
    acc[month].push(post);
    return acc;
  }, {});

  return Object.entries(grouped);
}

export function getTagGroups() {
  const grouped = getAllPosts().reduce<Record<string, PostMeta[]>>((acc, post) => {
    for (const tag of post.tags) {
      acc[tag] ??= [];
      acc[tag].push(post);
    }
    return acc;
  }, {});

  return Object.entries(grouped).sort((a, b) => {
    if (b[1].length !== a[1].length) return b[1].length - a[1].length;
    return a[0].localeCompare(b[0], 'zh-CN');
  });
}
