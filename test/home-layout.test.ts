import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readCssWithImports } from "./helpers/css-source";

const pageSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const homePageSource = readFileSync(new URL("../src/app/home/page.tsx", import.meta.url), "utf8");
const appClientSource = readFileSync(new URL("../src/app/app-client.tsx", import.meta.url), "utf8");
const componentSource = readFileSync(new URL("../src/pages/CityAdventureHome.tsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/styles/city-adventure.css", import.meta.url), "utf8");
const globalCssSource = readCssWithImports(new URL("../src/app/globals.css", import.meta.url));

test("homepage routes to the CityAdventureHome mobile game screen", () => {
  assert.match(pageSource, /import CityAdventureHome/);
  assert.match(pageSource, /return <CityAdventureHome \/>/);
  assert.match(homePageSource, /function CityWalkHome/);
  assert.match(appClientSource, /\{ href: "\/home", label: "首页"/);
  assert.match(appClientSource, /const hiddenRoutes = \["\/", "\/photo", "\/location", "\/dossier"\]/);
  assert.match(componentSource, /navigate\("\/home"\)/);
});

test("home change-location actions open the compact location dialog", () => {
  assert.match(homePageSource, /href="\/location"[\s\S]{0,120}换地点/);
  assert.match(homePageSource, /href="\/location"[\s\S]{0,120}换个地点/);
  assert.doesNotMatch(homePageSource, /换地点<\/button>/);
  assert.doesNotMatch(homePageSource, /换个地点<\/button>/);
});

test("home hero utility actions use a compact glass toolbar", () => {
  assert.match(globalCssSource, /\.home-hero-actions\s*\{[\s\S]*?display:\s*flex[\s\S]*?padding:\s*5px/);
  assert.match(globalCssSource, /\.home-top-action,\s*\n\.home-settings-menu summary\s*\{[\s\S]*?width:\s*auto[\s\S]*?min-height:\s*42px/);
  assert.match(globalCssSource, /\.home-top-action span,\s*\n\.home-settings-menu summary span\s*\{[\s\S]*?grid-template-columns:\s*22px auto[\s\S]*?border-radius:\s*16px/);
  assert.doesNotMatch(globalCssSource, /\.home-top-action,\s*\n\.home-settings-menu summary\s*\{[\s\S]{0,220}width:\s*66px/);
});

test("city adventure home presents the requested game home hierarchy", () => {
  const order = [
    "ca-top-actions",
    "ca-title-block",
    "ca-left-stack",
    "ca-route",
    "ca-landmark-card",
    "ca-right-tasks",
    "ca-quick-actions",
    "ca-bottom-panel"
  ].map((token) => componentSource.indexOf(token));

  for (const index of order) assert.ok(index > -1);
  assert.ok(order[0] < order[1]);
  assert.ok(order[1] < order[2]);
  assert.ok(order[6] < order[7]);

  for (const copy of [
    "CITY ADVENTURE",
    "城市冒险",
    "今日探索",
    "探索宝箱",
    "晴天",
    "城市地标",
    "探索点",
    "神秘任务",
    "剧情任务",
    "开始冒险",
    "游客体验"
  ]) {
    assert.match(componentSource, new RegExp(copy));
  }
});

test("city adventure CSS keeps the page mobile framed and game-like", () => {
  assert.match(cssSource, /body:has\(\.city-adventure-home\) \.mobile-app/);
  assert.match(cssSource, /max-width:\s*430px/);
  assert.match(cssSource, /height:\s*100dvh/);
  assert.match(cssSource, /aspect-ratio:\s*9\s*\/\s*16/);
  assert.match(cssSource, /overflow-x:\s*hidden/);
  assert.match(cssSource, /backdrop-filter:\s*blur/);
  assert.match(cssSource, /drop-shadow/);
  assert.match(cssSource, /box-shadow/);
  assert.match(cssSource, /@media \(max-width:\s*390px\)/);
});

test("home generation modal uses animated icon-only mission assembly", () => {
  assert.match(homePageSource, /const homeGenerationSteps = \[/);
  assert.match(homePageSource, /正在生成任务地图/);
  assert.match(homePageSource, /home-generation-stage/);
  assert.match(homePageSource, /home-generation-node/);
  assert.match(homePageSource, /home-generation-glyph/);
  assert.match(homePageSource, /home-generation-scan/);
  assert.match(homePageSource, /--generation-progress/);
  assert.doesNotMatch(homePageSource, /const label = \{ archive: "档案", route: "路线", clue: "线索" \}/);
  assert.doesNotMatch(homePageSource, /<h2>\{props\.activeStage \|\| "正在生成城市任务地图"\}<\/h2>/);

  assert.match(globalCssSource, /\.home-generation-node\.active/);
  assert.match(globalCssSource, /@keyframes generationScan/);
  assert.match(globalCssSource, /@keyframes generationGlyphFloat/);
  assert.match(globalCssSource, /\.home-generation-progress i[\s\S]*width:\s*var\(--generation-progress\)/);
});
