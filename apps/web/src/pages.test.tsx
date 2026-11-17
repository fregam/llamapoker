/**
 * Page smoke tests: every route in the route table (src/seo.ts) renders to HTML through the
 * same server entry the build uses (entry-server.tsx), without touching `window`, and
 * carries the page's single <h1>. This is what Cloudflare Pages builds; if a page throws
 * during render, the build (and this test) fails before anything deploys.
 * Also checks the invariants the search strategy depends on: unique titles and descriptions,
 * every prerendered route in LEARN_PATH exists, and the signup form is present where the
 * path audit requires it.
 */

import { describe, expect, it } from "vitest";
import { render, ROUTES, NOT_FOUND } from "./entry-server";
import { AUTHOR, LEARN_PATH, longDate, routeFor } from "./seo";

const h1 = (html: string) => (html.match(/<h1[^>]*>/g) ?? []).length;

describe("routes", () => {
  it("every route has a unique title and description of a sane length", () => {
    const titles = new Set(ROUTES.map((r) => r.title));
    const descs = new Set(ROUTES.map((r) => r.description));
    expect(titles.size).toBe(ROUTES.length);
    expect(descs.size).toBe(ROUTES.length);
    for (const r of ROUTES) {
      expect(r.title.length, r.path).toBeLessThanOrEqual(90);
      expect(r.description.length, r.path).toBeGreaterThan(50);
      expect(r.description.length, r.path).toBeLessThanOrEqual(220);
    }
  });

  it("the learn path only points at real routes", () => {
    for (const p of LEARN_PATH) expect(routeFor(p).page, p).not.toBe("notfound");
  });

  for (const route of ROUTES.filter((r) => r.prerender)) {
    it(`${route.path} renders with exactly one <h1>`, () => {
      const html = render(route.path);
      expect(html.length).toBeGreaterThan(2000);
      expect(h1(html), route.path).toBe(1);
      expect(html).toContain('class="colophon"');
    });
  }

  it("the trainer (not prerendered) still renders without throwing", () => {
    expect(() => render("/trainer")).not.toThrow();
  });

  it("an unknown URL renders the not-found page", () => {
    const html = render("/this-does-not-exist");
    expect(routeFor("/this-does-not-exist")).toBe(NOT_FOUND);
    expect(html).toContain("notfound");
  });
});

describe("authorship", () => {
  const guides = ROUTES.filter((r) => r.path.startsWith("/learn/"));

  it("every guide names its author and its date, on the page and in its Article data", () => {
    expect(guides.length).toBe(6);
    for (const r of guides) {
      const html = render(r.path);
      expect(html, r.path).toContain(AUTHOR.name);
      expect(html, r.path).toContain(longDate(r.modified!));
      const article = r.schema!("https://x.test").find((o: any) => o["@type"] === "Article") as any;
      expect(article.author, r.path).toEqual({ "@type": "Person", name: AUTHOR.name, url: "https://x.test/about" });
      expect(article.dateModified, r.path).toBe(r.modified);
      expect(article.datePublished <= article.dateModified, r.path).toBe(true);
    }
  });

  it("the author's page exists and names the same person", () => {
    expect(routeFor(AUTHOR.path).page).toBe("about");
    expect(render(AUTHOR.path)).toContain(AUTHOR.name);
  });

  it("dates read as written, with no clock involved", () => {
    expect(longDate("2026-11-06")).toBe("6 November 2026");
    expect(longDate("2027-01-31")).toBe("31 January 2027");
  });
});

describe("hydration", () => {
  // main.tsx hydrates prerendered pages; the browser's first render must equal the HTML.
  // Anything random or clock-based during render would break that, so render each twice.
  it("every prerendered page renders the same HTML twice", () => {
    for (const r of ROUTES.filter((r) => r.prerender)) {
      expect(render(r.path), r.path).toBe(render(r.path));
    }
  });
});

describe("signup path", () => {
  it("the home page carries the letter signup form", () => {
    const html = render("/");
    expect(html).toContain('class="signup"');
    expect(html).toContain('name="email"');
  });

  for (const path of LEARN_PATH.filter((p) => p.startsWith("/learn/"))) {
    it(`${path} carries the compact letter form with its own source`, () => {
      const html = render(path);
      expect(html).toContain('class="signup signup-compact"');
      expect(html).toContain('name="email"');
    });
  }

  it("the table and the glossary carry the letter form in the colophon", () => {
    for (const path of ["/table", "/glossary", "/strategy"]) {
      const html = render(path);
      expect(html, path).toContain('class="colophon-letter"');
    }
  });

  it("no prerendered page shows the form twice", () => {
    for (const r of ROUTES.filter((x) => x.prerender)) {
      const html = render(r.path);
      const forms = (html.match(/<form class="signup/g) ?? []).length;
      expect(forms, r.path).toBe(1);
    }
  });
});
