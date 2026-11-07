import { getCollection } from 'astro:content';

export async function getPosts(includeDrafts = import.meta.env.DEV) {
  const posts = await getCollection('blog', ({ data }) => includeDrafts || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf() || a.id.localeCompare(b.id));
}

const dateFormat = new Intl.DateTimeFormat('en', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
});

export function formatDate(date: Date) {
  return dateFormat.format(date);
}
