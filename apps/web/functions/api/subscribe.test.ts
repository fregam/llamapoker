/**
 * Tests for the signup function (subscribe.ts) with `fetch` mocked: no network, no Beehiiv.
 * Covers every branch a visitor or a bot can hit, and the exact payload Beehiiv receives
 * (attribution mapping), so a change there is a deliberate one.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestPost, verifyTurnstile, type Env } from "./subscribe";

const ENV: Env = { BEEHIIV_API_KEY: "test-key", BEEHIIV_PUBLICATION_ID: "pub_test" };

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://llamapoker.com/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

describe("POST /api/subscribe", () => {
  it("rejects a body that is not JSON", async () => {
    const res = await onRequestPost({ request: post("not json"), env: ENV });
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid or oversized email without calling Beehiiv", async () => {
    for (const email of ["", "nope", "a@b", "x".repeat(250) + "@a.io"]) {
      const res = await onRequestPost({ request: post({ email }), env: ENV });
      expect(res.status, email).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("gives a bot that filled the honeypot a fake success and does nothing", async () => {
    const res = await onRequestPost({ request: post({ email: "bot@example.com", company: "Acme" }), env: ENV });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("answers 503 while the newsletter is not configured", async () => {
    const res = await onRequestPost({ request: post({ email: "a@b.co" }), env: {} });
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("subscribes a valid email and maps the attribution onto Beehiiv's fields", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));
    const res = await onRequestPost({
      request: post({ email: "  Reader@Example.COM ", source: "guide-outs", channel: "instagram", medium: "social", campaign: "bio" }),
      env: ENV,
    });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.beehiiv.com/v2/publications/pub_test/subscriptions");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    expect(JSON.parse(init.body as string)).toEqual({
      email: "reader@example.com",
      reactivate_existing: true,
      send_welcome_email: true,
      utm_source: "instagram",
      utm_medium: "social",
      utm_campaign: "guide-outs.bio",
      referring_site: "https://llamapoker.com",
    });
  });

  it("defaults the attribution when the visit was direct", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));
    await onRequestPost({ request: post({ email: "a@b.co" }), env: ENV });
    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.utm_source).toBe("llamapoker.com");
    expect(body.utm_medium).toBe("website");
    expect(body.utm_campaign).toBe("site");
  });

  it("strips anything odd out of the attribution fields", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));
    await onRequestPost({ request: post({ email: "a@b.co", source: "<script>", channel: "Insta gram!", campaign: "x".repeat(100) }), env: ENV });
    const body = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(body.utm_source).toBe("instagram");
    expect(body.utm_campaign.length).toBeLessThanOrEqual(121);
    expect(body.utm_campaign).toMatch(/^script\.x+$/);
  });

  it("answers 502 when Beehiiv fails, without leaking its reply", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));
    const res = await onRequestPost({ request: post({ email: "a@b.co" }), env: ENV });
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "newsletter error" });
  });

  it("requires a valid Turnstile token once the secret is configured", async () => {
    const env: Env = { ...ENV, TURNSTILE_SECRET_KEY: "ts-secret" };
    // No token at all: refused before Beehiiv is called.
    let res = await onRequestPost({ request: post({ email: "a@b.co" }), env });
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
    // A token Cloudflare rejects.
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: false }), { status: 200 }));
    res = await onRequestPost({ request: post({ email: "a@b.co", token: "bad" }), env });
    expect(res.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // A token Cloudflare accepts: verified, then subscribed.
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: true }), { status: 200 }));
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 201 }));
    res = await onRequestPost({ request: post({ email: "a@b.co", token: "good" }, { "CF-Connecting-IP": "203.0.113.9" }), env });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const verify = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(verify[0]).toContain("turnstile/v0/siteverify");
    expect(String(verify[1].body)).toContain("remoteip=203.0.113.9");
  });
});

describe("verifyTurnstile", () => {
  it("is false for an empty token, a non-200 reply or success:false", async () => {
    expect(await verifyTurnstile("s", "", null, fetchMock)).toBe(false);
    fetchMock.mockResolvedValueOnce(new Response("", { status: 500 }));
    expect(await verifyTurnstile("s", "t", null, fetchMock)).toBe(false);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: false }), { status: 200 }));
    expect(await verifyTurnstile("s", "t", null, fetchMock)).toBe(false);
  });

  it("tells the wall's event store about the outcome when WALL_URL and WALL_INGEST_KEY are set", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));
    const pending: Promise<unknown>[] = [];
    const env: Env = { ...ENV, WALL_URL: "https://wall.example/", WALL_INGEST_KEY: "ingest-key" };
    const res = await onRequestPost({ request: post({ email: "a@b.co", source: "learn.outs", channel: "ig" }), env, waitUntil: (p) => void pending.push(p) });
    expect(res.status).toBe(200);
    await Promise.all(pending);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [url, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(url).toBe("https://wall.example/api/event");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer ingest-key");
    expect(JSON.parse(String(init.body))).toMatchObject({ kind: "signup", station: "signup", channel: "ig", subject: "learn.outs", amount: 1 });
  });

  it("never calls the wall when it is not configured", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 201 }));
    await onRequestPost({ request: post({ email: "a@b.co" }), env: ENV });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
