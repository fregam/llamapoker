#!/usr/bin/env node
// Proves the Search Console key works: asks Google which properties it can read and whether
// llamapoker.com is one of them with enough permission. Exit 0 = the agent can run unattended.
//   node apps/seo/scripts/gsc-check.mjs          the check
//   node apps/seo/scripts/gsc-check.mjs --email  only print the service account's address
import { readCredentials } from "../src/credentials.mjs";
import { searchConsole, SITE } from "../src/google.mjs";

const key = readCredentials().google_search_console;
if (process.argv.includes("--email")) {
  if (!key?.client_email) process.exit(1);
  console.log(key.client_email);
  process.exit(0);
}
try {
  const sites = await searchConsole(key).sites();
  const mine = sites.find((s) => s.siteUrl === SITE);
  if (!mine) {
    console.error(`the key works, but it cannot see ${SITE}.`);
    console.error(`add ${key.client_email} as a user in Search Console (Settings → Users and permissions).`);
    process.exit(1);
  }
  const level = mine.permissionLevel;
  console.log(`ok: ${SITE} readable as ${level}`);
  if (level === "siteRestrictedUser") {
    console.error("permission is Restricted: index checks need Full. Change it in Users and permissions.");
    process.exit(1);
  }
} catch (e) {
  console.error(`failed: ${e.message}`);
  process.exit(1);
}
