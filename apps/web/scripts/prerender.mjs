// Build step 3 of 3 (after `vite build` and the SSR build): writes one HTML file per
// route into dist/ (dist/<route>.html) with the page's title, description, social tags, canonical URL and
// structured data (JSON-LD), plus the prerendered markup for pages marked
// `prerender: true` in src/seo.ts.
// Also writes:
//   dist/404.html     the empty app shell; Cloudflare Pages serves it, with a 404, for unknown URLs
//   dist/robots.txt   allow everything, point at the sitemap
//   dist/sitemap.xml
// The site URL is https://llamapoker.com; set SITE_URL to build for another address
// (SITE_URL="" skips canonical links and the sitemap).

import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";

const DIST = "dist";
const SSR = "dist-ssr";
const site = (process.env.SITE_URL ?? "https://llamapoker.com").replace(/\/$/, "");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const template = readFileSync(join(DIST, "index.html"), "utf8");
const { render, ROUTES, NOT_FOUND } = await import(pathToFileURL(join(process.cwd(), SSR, "entry-server.js")).href);

function page(route, body, extraHead = "") {
  const url = site ? site + (route.path === "/" ? "/" : route.path) : "";
  // Structured data (JSON-LD) from the route's schema() in src/seo.ts.
  const jsonLd = (route.schema ? route.schema(site) : [])
    .map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`)
    .join("\n    ");
  const head = [
    jsonLd,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="LlamaPoker" />`,
    `<meta property="og:title" content="${esc(route.title)}" />`,
    `<meta property="og:description" content="${esc(route.description)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    // Link-preview image: public/og.png, rendered from scripts/og-image.html.
    site && `<meta property="og:image" content="${site}/og.png" />`,
    site && `<meta property="og:image:width" content="1200" />`,
    site && `<meta property="og:image:height" content="630" />`,
    site && `<meta property="og:image:alt" content="LlamaPoker — free poker odds calculator and trainer" />`,
    site && `<meta name="twitter:image" content="${site}/og.png" />`,
    url && `<meta property="og:url" content="${url}" />`,
    url && `<link rel="canonical" href="${url}" />`,
    extraHead,
  ]
    .filter(Boolean)
    .join("\n    ");
  return template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(route.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(route.description)}" />`)
    .replace("</head>", `    ${head}\n  </head>`)
    // data-path tells src/main.tsx which URL the markup was rendered for: it hydrates only when
    // that matches the address bar (a fallback page served for another URL gets a fresh render).
    .replace('<div id="root"></div>', body ? `<div id="root" data-path="${esc(route.path)}">${body}</div>` : `<div id="root"></div>`);
}

// "/table" → dist/table.html (not table/index.html): Cloudflare Pages serves it at /table
// with no redirect, so the URL matches the canonical link and the sitemap exactly.
function write(path, html) {
  const file = path === "/" ? join(DIST, "index.html") : join(DIST, path.slice(1) + ".html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

for (const route of ROUTES) {
  const body = route.prerender ? render(route.path) : "";
  write(route.path, page(route, body));
  console.log(`  prerendered ${route.path.padEnd(10)} ${route.prerender ? "full page" : "shell + meta"}`);
}

// Unknown URLs: the app shell renders the 404 page client-side.
writeFileSync(join(DIST, "404.html"), page(NOT_FOUND, "", `<meta name="robots" content="noindex" />`));

writeFileSync(join(DIST, "robots.txt"), `User-agent: *\nAllow: /\n${site ? `\nSitemap: ${site}/sitemap.xml\n` : ""}`);
if (site) {
  const urls = ROUTES.map((r) => `  <url><loc>${site}${r.path === "/" ? "/" : r.path}</loc></url>`).join("\n");
  writeFileSync(
    join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
  console.log(`  sitemap.xml for ${site}`);
} else {
  console.log("  SITE_URL is empty — skipped canonical links and sitemap.xml");
}

rmSync(SSR, { recursive: true, force: true });
