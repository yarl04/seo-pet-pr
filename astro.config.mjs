import { defineConfig } from 'astro/config';

// const site = process.env.SITE_URL || 'http://localhost:4321';
const site = 'https://yarl04.github.io';
const url = new URL(site);

export default defineConfig({ site: url.origin, base: '/seo-pet-pr/', output: 'static', trailingSlash: 'always' });
