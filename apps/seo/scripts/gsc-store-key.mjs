#!/usr/bin/env node
// Copies a downloaded Google service-account key into credentials.json under
// `google_search_console`, keeping every other key. Prints the account's email (public, it is
// the address added to Search Console) and never the private key.
//   node apps/seo/scripts/gsc-store-key.mjs "C:\Users\me\Downloads\llamapoker-seo-1234.json"
import { readFileSync } from "node:fs";
import { writeCredential } from "../src/credentials.mjs";

const file = process.argv[2]?.replace(/^["']|["']$/g, "");
if (!file) {
  console.error("usage: gsc-store-key.mjs <path to the downloaded .json key>");
  process.exit(2);
}
let key;
try {
  key = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error(`could not read ${file}: ${e.message}`);
  process.exit(1);
}
if (key.type !== "service_account" || !key.client_email || !key.private_key) {
  console.error("that file is not a service-account key (expected type, client_email and private_key)");
  process.exit(1);
}
const path = writeCredential("google_search_console", {
  client_email: key.client_email,
  private_key: key.private_key,
  project_id: key.project_id,
});
console.log(`stored google_search_console in ${path}`);
console.log(`service account: ${key.client_email}`);
