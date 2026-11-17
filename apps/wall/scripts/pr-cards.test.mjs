// Pull request cards against a pretend wall and a pretend GitHub.
import { createServer } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { decisionFor, prOf, syncPrCards } from "./pr-cards.mjs";

describe("prOf", () => {
  it("reads the pull request number from a waiting card of that kind, and nothing else", () => {
    expect(prOf({ id: "pr-47", kind: "pull-request", status: "waiting" })).toBe(47);
    expect(prOf({ id: "pr-47", kind: "pull-request", status: "called" })).toBeNull(); // already decided
    expect(prOf({ id: "pr-47", kind: "reel", status: "waiting" })).toBeNull();
    expect(prOf({ id: "0b0e3c0e-5a0f-4b7e-9a51-2f3c1d2e4f5a", kind: "pull-request", status: "waiting" })).toBeNull();
    expect(prOf({ id: "pr-47x", kind: "pull-request", status: "waiting" })).toBeNull();
    expect(prOf(undefined)).toBeNull();
  });
});

describe("decisionFor", () => {
  it("clears a merged or closed pull request and leaves an open or unknown one", () => {
    expect(decisionFor("MERGED")).toEqual({ action: "call", note: "merged on GitHub" });
    expect(decisionFor("CLOSED")).toEqual({ action: "fold", note: "closed on GitHub without merging" });
    expect(decisionFor("OPEN")).toBeNull();
    expect(decisionFor(null)).toBeNull(); // gh missing or offline: never guess
  });
});

describe("syncPrCards", () => {
  let wall;
  let url;
  let posts;
  let queue;

  beforeAll(async () => {
    wall = createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        res.setHeader("Content-Type", "application/json");
        if (req.method === "GET" && req.url === "/api/queue") return res.end(JSON.stringify({ queue }));
        posts.push({ path: req.url, body: JSON.parse(body) });
        res.end('{"ok":true}');
      });
    });
    await new Promise((r) => wall.listen(0, "127.0.0.1", r));
    url = `http://127.0.0.1:${wall.address().port}`;
  });
  afterAll(() => new Promise((r) => wall.close(r)));
  beforeEach(() => {
    posts = [];
    queue = [
      { id: "pr-43", kind: "pull-request", status: "waiting", title: "SEO 2026-11-17" },
      { id: "pr-47", kind: "pull-request", status: "waiting", title: "SEO 2026-11-23" },
      { id: "pr-48", kind: "pull-request", status: "waiting", title: "closed one" },
      { id: "pr-49", kind: "pull-request", status: "waiting", title: "gh can't say" },
      { id: "pr-40", kind: "pull-request", status: "called", title: "decided on the wall already" },
      { id: "abc", kind: "reel", status: "waiting", title: "a reel" },
    ];
  });

  it("clears the cards whose pull request is merged or closed, and only asks about waiting pull request cards", async () => {
    const asked = [];
    const stateOf = (n) => {
      asked.push(n);
      return { 43: "MERGED", 47: "OPEN", 48: "CLOSED", 49: null }[n];
    };
    const cleared = await syncPrCards({ url, stateOf });
    expect(asked).toEqual([43, 47, 48, 49]);
    expect(cleared).toEqual([
      { id: "pr-43", number: 43, action: "call" },
      { id: "pr-48", number: 48, action: "fold" },
    ]);
    expect(posts).toEqual([
      { path: "/api/queue/pr-43", body: { action: "call", note: "merged on GitHub" } },
      { path: "/api/queue/pr-48", body: { action: "fold", note: "closed on GitHub without merging" } },
    ]);
  });

  it("does nothing against a closed wall, without asking GitHub", async () => {
    let asked = 0;
    expect(await syncPrCards({ url: "http://127.0.0.1:9", stateOf: () => asked++ })).toEqual([]);
    expect(asked).toBe(0);
  });
});
