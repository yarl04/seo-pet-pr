/** Добавляет base из конфигурации Astro к пути приложения, сохраняя уже готовые URL. */
export function withBase(path: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|[?#])/i.test(path)) return path;

  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const rooted = `/${path.replace(/^\/+/, '')}`;
  const pathname = rooted.split(/[?#]/, 1)[0];
  if (pathname === base || pathname.startsWith(`${base}/`)) return rooted;
  return `${base}${rooted}`;
}
