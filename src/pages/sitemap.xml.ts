import type { APIRoute } from 'astro';
import { categories } from '../data/categories';
import { recipes } from '../data/recipes';
import { recipeUrl } from '../lib/recipes';
import { absoluteUrl } from '../lib/seo';

export const GET: APIRoute = ({ site }) => {
  const paths = ['/', '/recipes/', ...categories.map((c) => `/categories/${c.id}/`), ...recipes.map(recipeUrl)];
  const urls = paths.map((path) => `<url><loc>${absoluteUrl(path, site!).replace(/&/g, '&amp;')}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
