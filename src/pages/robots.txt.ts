import type { APIRoute } from 'astro';
import { absoluteUrl } from '../lib/seo';
export const GET: APIRoute = ({ site }) => {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(site!.hostname);
  return new Response(`User-agent: *\n${local ? 'Disallow: /' : 'Allow: /'}\n\nSitemap: ${absoluteUrl('/sitemap.xml', site!)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
