import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire("/Users/a/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json");
const { chromium } = require("playwright");

const root = "/Users/a/Desktop/作品/citywalk-agent";
const outDir = path.join(root, "docs", "project-screenshots");
const baseUrl = "http://localhost:3000";

const pages = [
  ["01-home.png", "/"],
  ["02-play.png", "/play"],
  ["03-clues.png", "/clues"],
  ["04-me.png", "/me"],
  ["05-location.png", "/location"],
  ["06-dossier.png", "/dossier"],
  ["07-photo.png", "/photo"]
];

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true
});
const page = await browser.newPage({
  deviceScaleFactor: 1,
  viewport: { width: 430, height: 932 }
});

for (const [fileName, route] of pages) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(outDir, fileName),
    fullPage: false
  });
}

await browser.close();
console.log(outDir);
