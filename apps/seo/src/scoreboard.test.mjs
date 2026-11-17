// node --test apps/seo/src  (no dependencies)
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, createVerify } from "node:crypto";
import { scoreTargets, sitemapUrls, isIndexed, longQuestions, summarize } from "./scoreboard.mjs";
import { assertion, searchConsole } from "./google.mjs";

const row = (query, page, position, impressions = 10, clicks = 0) => ({
  keys: [query, `https://llamapoker.com${page}`],
  position,
  impressions,
  clicks,
  ctr: impressions ? clicks / impressions : 0,
});

test("a target is on page one at position 10 or better, on its best row", () => {
  const targets = [
    { query: "poker outs chart", page: "/learn/outs" },
    { query: "pot odds", page: "/learn/pot-odds" },
    { query: "poker positions explained", page: "/learn/positions" },
  ];
  const scores = scoreTargets(targets, [
    row("Poker  Outs Chart", "/learn/outs", 10),
    row("poker outs chart", "/glossary", 31),
    row("pot odds", "/table", 10.4),
  ]);
  assert.deepEqual(
    scores.map((s) => [s.pageOne, s.position, s.rightPage]),
    [
      [true, 10, true],
      [false, 10.4, false],
      [false, null, null],
    ]
  );
  assert.deepEqual(summarize(scores, [{ indexed: true }, { indexed: false }]), {
    pageOne: 1,
    targets: 3,
    indexed: 1,
    pages: 2,
  });
});

test("sitemap urls and index verdicts", () => {
  assert.deepEqual(sitemapUrls("<urlset><url><loc>https://a/</loc></url><url><loc> https://a/b </loc></url></urlset>"), [
    "https://a/",
    "https://a/b",
  ]);
  assert.equal(isIndexed({ verdict: "PASS" }), true);
  assert.equal(isIndexed({ verdict: "NEUTRAL", coverageState: "Discovered - currently not indexed" }), false);
  assert.equal(isIndexed(undefined), false);
});

test("long questions: eight words or more, shown but not clicked, most shown first", () => {
  const out = longQuestions([
    row("how many outs do i have with a flush draw", "/learn/outs", 12, 40, 0),
    row("what are the odds of hitting a flush on the river", "/learn/outs", 9, 90, 1),
    row("poker outs", "/learn/outs", 20, 500, 0),
    row("how do you work out pot odds in texas holdem quickly", "/learn/pot-odds", 8, 30, 9),
    row("is it ever right to fold pocket aces before the flop", "/strategy", 15, 2, 0),
  ]);
  assert.deepEqual(
    out.map((q) => q.impressions),
    [90, 40]
  );
});

test("the assertion is a JWT Google can verify with the key's public half", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const key = { client_email: "seo@x.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) };
  const [h, p, s] = assertion(key, 1_700_000_000_000).split(".");
  const claims = JSON.parse(Buffer.from(p, "base64url").toString());
  assert.equal(claims.iss, key.client_email);
  assert.equal(claims.exp - claims.iat, 3600);
  assert.equal(claims.aud, "https://oauth2.googleapis.com/token");
  assert.ok(createVerify("RSA-SHA256").update(`${h}.${p}`).verify(publicKey, Buffer.from(s, "base64url")));
});

test("the client fetches one token, then calls with it; errors carry the status", async () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const key = { client_email: "seo@x", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) };
  const calls = [];
  const fetch = async (url, init) => {
    calls.push([url, init.headers.authorization]);
    if (url.includes("oauth2")) return new Response(JSON.stringify({ access_token: "T" }));
    if (url.endsWith("/sites")) return new Response(JSON.stringify({ siteEntry: [{ siteUrl: "sc-domain:llamapoker.com" }] }));
    if (url.includes("searchAnalytics")) return new Response(JSON.stringify({}));
    return new Response("nope", { status: 403 });
  };
  const sc = searchConsole(key, { fetch });
  assert.equal((await sc.sites())[0].siteUrl, "sc-domain:llamapoker.com");
  assert.deepEqual(await sc.queries({ startDate: "2026-11-01", endDate: "2026-11-14" }), []);
  await assert.rejects(sc.inspect("https://llamapoker.com/"), /HTTP 403/);
  assert.equal(calls.filter(([u]) => u.includes("oauth2")).length, 1);
  assert.ok(calls[1][0].includes("sc-domain%3Allamapoker.com") || calls[2][0].includes("sc-domain%3Allamapoker.com"));
  assert.equal(calls[1][1], "Bearer T");
  assert.throws(() => searchConsole({}), /no Search Console key/);
});
