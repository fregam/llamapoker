/**
 * The home page FAQ, kept as data so the same questions feed both the visible FAQ
 * (views/Home.tsx) and the FAQPage structured data search engines read (seo.ts).
 * Keep answers true — they are shown in Google results.
 * Used by: views/Home.tsx, seo.ts.
 */

export const FAQ: [string, string][] = [
  ["Is it free?", "Yes. No account, no download, no paywall. Everything runs in your browser."],
  [
    "I'm new to poker — is this for me?",
    "Yes. If you know how a hand is played, the Table tells you what to do and why, and the Learn guides cover positions, starting hands and hand rankings from zero.",
  ],
  [
    "Can I use it while I'm playing online?",
    "Use it to study, review hands and train — not during real-money play. Most online poker sites forbid real-time assistance tools and can close accounts that use them. Check your site's rules.",
  ],
  [
    "How accurate are the numbers?",
    "Equity comes from simulating 20,000 random run-outs against the ranges you choose, so it's within a fraction of a percent. Outs and hit chances are exact. The recommended move follows standard strategy — a strong default, not a solver.",
  ],
  [
    "What do you store?",
    "Nothing about your hands leaves your device. Trainer stats are saved in your own browser. If you join the letter, we keep your email address — that's it.",
  ],
  ["Does it work on my phone?", "Yes. The guides and the trainer are made for it; the Table is best on a laptop, where the whole spot fits on one screen."],
];
