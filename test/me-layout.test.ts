import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readCssWithImports } from "./helpers/css-source";

const pageSource = readFileSync(new URL("../src/app/me/page.tsx", import.meta.url), "utf8");
const assetSource = readFileSync(new URL("../src/app/profile-assets.ts", import.meta.url), "utf8");
const cssSource = readCssWithImports(new URL("../src/app/globals.css", import.meta.url));

test("profile mission log reflects the active session instead of hard-coded progress", () => {
  assert.match(pageSource, /const activeMissionTitle/);
  assert.match(pageSource, /const collected/);
  assert.match(pageSource, /完成 \$\{completed\}\/\$\{total\}/);
  assert.doesNotMatch(pageSource, /完成 2\/5 · 收集 3 条线索/);
});

test("profile page uses the citywalker artpack through a central asset index", () => {
  assert.match(pageSource, /citywalkerProfileAssets/);
  assert.match(pageSource, /licenseCard/);
  assert.match(pageSource, /citySeal/);
  assert.match(pageSource, /shanghaiSkyline/);
  assert.match(pageSource, /completedSpot/);
  assert.match(pageSource, /lockedBadge/);
  assert.doesNotMatch(pageSource, /<svg/);

  assert.match(assetSource, /\/assets\/profile\/backgrounds\/license-card-bg\.webp/);
  assert.match(assetSource, /\/assets\/profile\/decorations\/city-seal\.png/);
  assert.match(assetSource, /\/assets\/profile\/decorations\/shanghai-skyline-watermark\.png/);
  assert.match(assetSource, /\/assets\/profile\/icons\/stats\/completed-spot\.png/);
  assert.match(assetSource, /\/assets\/profile\/empty-states\/badge-empty-state\.png/);
  assert.match(assetSource, /badges: \[/);
  assert.equal((assetSource.match(/\/assets\/profile\/badges\/(?!locked\.png)[^"]+\.png/g) ?? []).length, 12);
});

test("app shell remains a vertical touch scroll container for long profile content", () => {
  assert.match(cssSource, /\.mobile-app\s*\{[\s\S]{0,260}height:\s*100dvh/);
  assert.match(cssSource, /\.mobile-app\s*\{[\s\S]{0,320}overflow-y:\s*auto/);
  assert.match(cssSource, /\.mobile-app\s*\{[\s\S]{0,360}-webkit-overflow-scrolling:\s*touch/);
});
