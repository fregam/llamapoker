// Search Console through Google's API with a service-account key. No dependencies: the token
// is a JWT signed with node:crypto and exchanged at Google's token endpoint.
// Used by: scripts/gsc-check.mjs, scripts/scoreboard.mjs. `fetch` is injectable for the tests.
//
// The key is the JSON file Google gives for a service account ({ client_email, private_key, … }),
// kept in credentials.json under `google_search_console` (see scripts/wizards/search-console-access.sh).
import { createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/webmasters";
export const SITE = "sc-domain:llamapoker.com";

const b64url = (v) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64url");

/** The signed assertion Google exchanges for an access token (valid one hour). */
export function assertion(key, now = Date.now()) {
  const iat = Math.floor(now / 1000);
  const body = `${b64url({ alg: "RS256", typ: "JWT" })}.${b64url({
    iss: key.client_email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat,
    exp: iat + 3600,
  })}`;
  return `${body}.${createSign("RSA-SHA256").update(body).sign(key.private_key).toString("base64url")}`;
}

async function json(res, what) {
  const text = await res.text();
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : {};
}

export function searchConsole(key, { fetch = globalThis.fetch, site = SITE } = {}) {
  if (!key?.client_email || !key?.private_key)
    throw new Error("no Search Console key: credentials.json needs google_search_console (run scripts/wizards/search-console-access.sh)");
  let token;
  async function call(url, body) {
    token ??= (
      await json(
        await fetch(TOKEN_URL, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: assertion(key),
          }),
        }),
        "token"
      )
    ).access_token;
    return json(
      await fetch(url, {
        method: body ? "POST" : "GET",
        headers: { authorization: `Bearer ${token}`, ...(body ? { "content-type": "application/json" } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      }),
      url
    );
  }
  const siteUrl = encodeURIComponent(site);
  return {
    /** Properties this key can read: [{ siteUrl, permissionLevel }]. */
    sites: async () => (await call("https://www.googleapis.com/webmasters/v3/sites")).siteEntry ?? [],
    /** Search performance rows: { keys: [query, page], clicks, impressions, ctr, position }. */
    queries: async ({ startDate, endDate, dimensions = ["query", "page"], rowLimit = 5000 }) =>
      (
        await call(`https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`, {
          startDate,
          endDate,
          dimensions,
          rowLimit,
        })
      ).rows ?? [],
    /** Index status of one URL: { verdict, coverageState, lastCrawlTime, googleCanonical, … }. */
    inspect: async (url) =>
      (
        await call("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
          inspectionUrl: url,
          siteUrl: site,
        })
      ).inspectionResult?.indexStatusResult ?? {},
  };
}
