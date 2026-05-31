import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readCssWithImports } from "./helpers/css-source";

const appClientSource = readFileSync(new URL("../src/app/app-client.tsx", import.meta.url), "utf8");
const cssSource = readCssWithImports(new URL("../src/app/globals.css", import.meta.url));
const unifiedNavCss = cssSource.slice(cssSource.indexOf("/* Unified bottom navigation */"));

test("bottom nav keeps the four public tabs and marks the current route accessibly", () => {
  assert.match(appClientSource, /href:\s*"\/home"[\s\S]*label:\s*"首页"[\s\S]*icon:\s*"home"/);
  assert.match(appClientSource, /href:\s*"\/play"[\s\S]*label:\s*"任务"[\s\S]*icon:\s*"quest"/);
  assert.match(appClientSource, /href:\s*"\/clues"[\s\S]*label:\s*"图鉴"[\s\S]*icon:\s*"codex"/);
  assert.match(appClientSource, /href:\s*"\/me"[\s\S]*label:\s*"我的"[\s\S]*icon:\s*"profile"/);
  assert.match(appClientSource, /aria-current=\{pathname === item\.href \? "page" : undefined\}/);
  assert.match(appClientSource, /className=\{pathname === item\.href \? "active" : ""\}/);
});

test("bottom nav uses one CityWalk icon set without a clues-only collection skin", () => {
  const bottomNavSource = appClientSource.slice(appClientSource.indexOf("function BottomNav"));

  assert.doesNotMatch(bottomNavSource, /collectionSkin/);
  assert.doesNotMatch(bottomNavSource, /collectionSrcByName/);
  assert.doesNotMatch(bottomNavSource, /collectionAssets\.nav/);
  assert.match(bottomNavSource, /citywalkAssets\.home\.navHomeActive/);
  assert.match(bottomNavSource, /citywalkAssets\.home\.navTask/);
  assert.match(bottomNavSource, /citywalkAssets\.home\.navAlbum/);
  assert.match(bottomNavSource, /citywalkAssets\.home\.navProfile/);
});

test("bottom nav final CSS overrides page-specific skins with one blue pill style", () => {
  assert.ok(cssSource.includes("/* Unified bottom navigation */"), "missing final unified bottom nav CSS block");
  assert.match(unifiedNavCss, /\.bottom-nav\s*\{/);
  assert.match(unifiedNavCss, /width:\s*min\(calc\(100% - 24px\), 398px\)/);
  assert.match(unifiedNavCss, /min-height:\s*calc\(72px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(unifiedNavCss, /margin:\s*0/);
  assert.match(unifiedNavCss, /border-radius:\s*30px/);
  assert.match(unifiedNavCss, /backdrop-filter:\s*blur\(18px\)/);
  assert.match(unifiedNavCss, /\.bottom-nav a\.active,[\s\S]*background:\s*rgba\(221,\s*243,\s*255,\s*0\.86\)/);
  assert.match(unifiedNavCss, /\.bottom-nav a:active\s*\{[\s\S]*transform:\s*translateY\(1px\) scale\(0\.98\)/);
  assert.match(unifiedNavCss, /\.bottom-nav a\.active \.bottom-nav-icon,[\s\S]*transform:\s*translateY\(-1px\)/);
  assert.match(unifiedNavCss, /\.mobile-app:has\(\.collection-page\) \.bottom-nav a\.active::before\s*\{[\s\S]*background:\s*none/);
  assert.doesNotMatch(unifiedNavCss, /nav_bar_bg\.webp|nav_active_panel\.png/);
});
