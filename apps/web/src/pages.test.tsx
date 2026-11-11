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
import { LEARN_PATH, routeFor } from "./seo";

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

describe("signup path", () => {
  it("the home page carries the letter signup form", () => {
    const html = render("/");
    expect(html).toContain('class="signup"');
    expect(html).toContain('name="email"');
  });
});
