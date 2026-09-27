import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const requiredFiles = [
  "manifest.json",
  "src/patterns.js",
  "src/dom.js",
  "src/panel.js",
  "src/content.js",
  "README.md"
];

for (const file of requiredFiles) {
  if (!existsSync(file)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));

if (manifest.manifest_version !== 3) {
  throw new Error("Manifest must use version 3.");
}

const scripts = manifest.content_scripts?.flatMap((entry) => entry.js || []) || [];
for (const script of scripts) {
  if (!existsSync(script)) {
    throw new Error(`Manifest references missing script: ${script}`);
  }
}

const permissions = new Set(manifest.permissions || []);
if (permissions.has("storage")) {
  throw new Error("Storage permission is intentionally not used in this version.");
}

const hosts = manifest.host_permissions || [];
const expectedHosts = ["https://chatgpt.com/*", "https://chat.openai.com/*", "https://claude.ai/*"];
for (const host of expectedHosts) {
  if (!hosts.includes(host)) {
    throw new Error(`Missing host permission: ${host}`);
  }
}

console.log("Extension validation passed.");