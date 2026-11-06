import config from '../astro.config.mjs';

// TEST_BASE соответствует параметру --base при проверке сборки в корне домена.
const base = process.env.TEST_BASE ?? config.base ?? '/';
export const appPath = (path: string) => `${base.replace(/\/$/, '')}${path}`;
export const siteOrigin = new URL(config.site!).origin;
export const previewOrigin = 'http://127.0.0.1:4322';
