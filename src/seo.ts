/**
 * Every route of the site: its page, <title>, meta description, whether it's prerendered,
 * and its structured data (JSON-LD) — the single source for the browser (App.tsx sets
 * document.title on navigation) and the build-time prerender (scripts/prerender.mjs writes
 * all of it into each page's HTML, plus the sitemap).
 * Titles and descriptions target what people actually search ("poker odds calculator",
 * "poker positions explained", "online poker helper"…) — keep that when editing.
 * `prerender: true` pages are rendered to full HTML; the Trainer is random on every load,
 * so it ships as an empty shell with the right meta.
 * `schema(site)` returns JSON-LD objects; it receives the absolute site URL ("" when unknown,
 * in which case URL-dependent schema is skipped).
 * Used by: App.tsx, entry-server.tsx (→ scripts/prerender.mjs).
 */

import { FAQ } from "./content/faq";

export type PageId =
  | "home"
  | "tool"
  | "trainer"
  | "strategy"
  | "glossary"
  | "privacy"
  | "learn"
  | "positions"
  | "starting-hands"
  | "hand-rankings"
  | "poker-helper"
  | "notfound";

export interface Route {
  path: string;
  page: PageId;
  title: string;
  description: string;
  prerender: boolean;
  /** Short name for breadcrumbs and link lists. */
  name: string;
  schema?: (site: string) => object[];
}

const BRAND = { "@type": "Organization", name: "LlamaPoker" };

function article(path: string, headline: string, description: string) {
  return (site: string): object[] => {
    const out: object[] = [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline,
        description,
        author: BRAND,
        publisher: BRAND,
        ...(site ? { mainEntityOfPage: site + path } : {}),
      },
    ];
    if (site)
      out.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Learn", item: site + "/learn" },
          { "@type": "ListItem", position: 2, name: headline, item: site + path },
        ],
      });
    return out;
  };
}

const webApp = (name: string, path: string, description: string) => (site: string) => [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    applicationCategory: "GameApplication",
    operatingSystem: "Any (web browser)",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    ...(site ? { url: site + path } : {}),
  },
];

export const ROUTES: Route[] = [
  {
    path: "/",
    page: "home",
    name: "Home",
    title: "Free Poker Odds Calculator & Trainer for Hold'em | LlamaPoker",
    description:
      "Know what to do with any poker hand: your odds against real ranges, pot odds, outs and the right move — plus a free trainer and beginner guides. In your browser, no sign-up.",
    prerender: true,
    schema: (site) => [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "LlamaPoker",
        ...(site ? { url: site + "/" } : {}),
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ.map(([q, a]) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  },
  {
    path: "/table",
    page: "tool",
    name: "Poker odds calculator",
    title: "Poker Odds Calculator — Should I Call? Equity, Pot Odds & Outs | LlamaPoker",
    description:
      "Free poker hand calculator: enter your cards, the board and what your opponents could hold. See your equity, the pot odds, your outs and the recommended move — call, raise or fold.",
    prerender: true,
    schema: webApp(
      "LlamaPoker odds calculator",
      "/table",
      "Free Texas Hold'em odds calculator: equity against ranges, pot odds, outs, implied odds and a recommended move."
    ),
  },
  {
    path: "/trainer",
    page: "trainer",
    name: "Poker trainer",
    title: "Free Poker Trainer — Practice Full Hands, Pot Odds & Outs | LlamaPoker",
    description:
      "Practice poker free: play whole hands against a realistic opponent, drill preflop charts, pot odds and counting outs, beat the shot clock and find your leaks.",
    prerender: false,
    schema: webApp(
      "LlamaPoker poker trainer",
      "/trainer",
      "Free poker training drills: full hands, preflop, call-or-fold pot odds and counting outs, with grading and leak tracking."
    ),
  },
  {
    path: "/learn",
    page: "learn",
    name: "Learn",
    title: "Learn Poker — A Beginner's Path from Rules to Real Strategy | LlamaPoker",
    description:
      "New to poker? Start here: hand rankings, table positions, starting hand charts, pot odds and outs — short, clear guides that build on each other.",
    prerender: true,
  },
  {
    path: "/learn/hand-rankings",
    page: "hand-rankings",
    name: "Hand rankings",
    title: "Poker Hand Rankings — What Beats What (with Odds) | LlamaPoker",
    description:
      "All ten poker hands from royal flush to high card, with examples, how often each one happens in Texas Hold'em, and how ties and kickers are decided.",
    prerender: true,
    schema: article(
      "/learn/hand-rankings",
      "Poker hand rankings",
      "All ten poker hands, what beats what, how often each happens in Hold'em, and how ties are broken."
    ),
  },
  {
    path: "/learn/positions",
    page: "positions",
    name: "Positions",
    title: "Poker Positions Explained — UTG, Cutoff, Button & Blinds | LlamaPoker",
    description:
      "What UTG, MP, CO, BTN, SB and BB mean, who acts first before and after the flop, and why position changes which hands you should play — with a table diagram.",
    prerender: true,
    schema: article(
      "/learn/positions",
      "Poker positions explained",
      "Every seat at a 6-max table, the order of action and why position matters."
    ),
  },
  {
    path: "/learn/starting-hands",
    page: "starting-hands",
    name: "Starting hands",
    title: "Poker Starting Hands Chart by Position (6-Max Preflop) | LlamaPoker",
    description:
      "Which hands to open from every seat, and which to 3-bet or call against a raise. Free 6-max preflop charts with how to read them.",
    prerender: true,
    schema: article(
      "/learn/starting-hands",
      "Poker starting hands chart by position",
      "6-max preflop opening, 3-bet and calling charts for every seat, and how to read them."
    ),
  },
  {
    path: "/learn/online-poker-helper",
    page: "poker-helper",
    name: "Online poker helpers",
    title: "Online Poker Helper & Live Poker Tools — What's Allowed | LlamaPoker",
    description:
      "Looking for a poker helper to use while you play? What online sites and card rooms allow, why real-time assistance gets accounts closed, and how to get the same edge legally.",
    prerender: true,
    schema: article(
      "/learn/online-poker-helper",
      "Online poker helpers and live poker tools: what's allowed",
      "What poker sites and card rooms allow, why real-time assistance is banned, and how to improve legally."
    ),
  },
  {
    path: "/strategy",
    page: "strategy",
    name: "Strategy",
    title: "No-Limit Hold'em Strategy for Beginners, Street by Street | LlamaPoker",
    description:
      "A clear game plan for preflop, the flop, the turn and the river: position, ranges, pot odds, semi-bluffs, value bets and when to fold.",
    prerender: true,
  },
  {
    path: "/glossary",
    page: "glossary",
    name: "Glossary",
    title: "Poker Glossary — Equity, Pot Odds, Outs & SPR Explained | LlamaPoker",
    description:
      "Plain-language definitions of equity, pot odds, break-even equity, outs, the rule of 2 and 4, implied odds, ranges, SPR and more, with worked examples.",
    prerender: true,
  },
  {
    path: "/privacy",
    page: "privacy",
    name: "Privacy",
    title: "Privacy | LlamaPoker",
    description: "What LlamaPoker stores, what it doesn't, and how to get in touch.",
    prerender: true,
  },
];

export const NOT_FOUND: Route = {
  path: "/404",
  page: "notfound",
  name: "Not found",
  title: "Page not found | LlamaPoker",
  description: "This page doesn't exist.",
  prerender: false,
};

export function routeFor(path: string): Route {
  return ROUTES.find((r) => r.path === path) ?? NOT_FOUND;
}

/** The beginner path, in reading order (Learn hub, home page, guide footers). */
export const LEARN_PATH = [
  "/learn/hand-rankings",
  "/learn/positions",
  "/learn/starting-hands",
  "/glossary",
  "/strategy",
  "/learn/online-poker-helper",
];
