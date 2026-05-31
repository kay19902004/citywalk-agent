import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readCssWithImports } from "./helpers/css-source";

const pageSource = readFileSync(new URL("../src/app/dossier/page.tsx", import.meta.url), "utf8");
const cssSource = readCssWithImports(new URL("../src/app/globals.css", import.meta.url));
const typeSource = readFileSync(new URL("../src/lib/types.ts", import.meta.url), "utf8");
const uiSource = readFileSync(new URL("../src/app/ui.tsx", import.meta.url), "utf8");

test("dossier page uses a paper mission file structure", () => {
  for (const token of [
    "taskDossierAssets",
    "dossier-page",
    "dossier-topbar",
    "StampBadge",
    "MissionCover",
    "DossierStatusStrip",
    "ObjectiveItem",
    "RewardCard",
    "dossier-action-bar",
    "dossier-primary-cta"
  ]) {
    assert.match(pageSource, new RegExp(token));
  }

  assert.match(pageSource, /TOP SECRET|FIELD FILE/);
  assert.doesNotMatch(pageSource, /MISSION DOSSIER/);
  assert.match(pageSource, /STORY BRIEF/);
  assert.match(pageSource, /OBJECTIVES/);
  assert.match(pageSource, /REWARDS/);
  assert.match(pageSource, /CLASS SELECT/);
  assert.match(pageSource, /选择探索职业/);
  assert.match(pageSource, /选择探索职业/);
  assert.match(pageSource, /处据点/);
  assert.match(pageSource, /预计 45~60分/);
  assert.doesNotMatch(pageSource, /generateMissionCoverForSession/);
  assert.doesNotMatch(pageSource, /missionCoverStatus/);
});

test("dossier page uses the local sunny task dossier asset pack", () => {
  for (const asset of [
    "bg-dossier-sunny.webp",
    "hero-case-mermaid-bookstore.webp",
    "deco-top-secret-stamp.webp",
    "deco-paper-texture.webp",
    "deco-map-lines.webp",
    "deco-gold-corners.webp",
    "deco-sparkles.webp",
    "icon-compass-gold.webp",
    "icon-location-pin.webp",
    "icon-flag.webp",
    "icon-mainline.webp",
    "icon-hidden-cube.webp",
    "icon-clock.webp",
    "icon-objective-search.webp",
    "icon-objective-camera.webp",
    "icon-objective-chat.webp",
    "icon-objective-lock.webp",
    "reward-exp-star.webp",
    "reward-coin.webp",
    "reward-crystal.webp",
    "reward-trophy.webp",
    "avatar-collector-chenyu.webp",
    "avatar-barista-linxiao.webp",
    "avatar-resident-zhouyuan.webp"
  ]) {
    assert.match(pageSource, new RegExp(asset.replace(".", "\\.")));
  }

  assert.doesNotMatch(pageSource, /citywalkAssets\.dossier\.missionCoverFallback/);
  assert.doesNotMatch(pageSource, /function DossierIcon/);
  assert.match(pageSource, /src=\{taskDossierAssets\.topSecretStamp\}/);
  assert.match(pageSource, /src=\{taskDossierAssets\.compassGold\}/);
});

test("dossier progress labels are derived from the current session", () => {
  assert.match(pageSource, /const completedMain/);
  assert.match(pageSource, /const hiddenDiscoveries/);
  assert.match(pageSource, /const knownClues/);
  assert.match(pageSource, /<DossierStatusStrip[\s\S]*completedMain=\{completedMain\}/);
  assert.doesNotMatch(pageSource, /主线 0\/5/);
});

test("dossier page has paper, stamp, objective, reward, and responsive styles", () => {
  for (const selector of [
    ".dossier-page",
    ".dossier-topbar",
    ".stamp-badge",
    ".mission-cover",
    ".dossier-status-strip",
    ".objective-item",
    ".reward-grid",
    ".reward-item",
    ".dossier-action-bar",
    ".dossier-primary-cta"
  ]) {
    assert.match(cssSource, new RegExp(selector.replace(".", "\\.")));
  }

  assert.match(cssSource, /--dossier-text:\s*#082B55/);
  assert.match(cssSource, /--dossier-blue:\s*#1D8CFF/);
  assert.match(cssSource, /--dossier-gold:\s*#F4B94D/);
  assert.match(cssSource, /rgba\(255,\s*250,\s*238,\s*0\.86\)/);
  assert.match(cssSource, /rgba\(78,\s*167,\s*255,\s*0\.24\)/);
  assert.match(cssSource, /linear-gradient\(135deg,\s*#1D8CFF,\s*#0B74E8\)/);
  assert.match(cssSource, /\.mobile-app:has\(\.dossier-page\)[\s\S]*\.floating-compass/);
  assert.match(cssSource, /-webkit-line-clamp:\s*2/);
  assert.match(cssSource, /\.dossier-action-bar[\s\S]*position:\s*fixed/);
  assert.match(cssSource, /\.mission-cover img[\s\S]*object-fit:\s*cover/);
  assert.match(cssSource, /@media \(max-width: 390px\)[\s\S]*\.dossier-main-card/);
  assert.match(cssSource, /\.dossier-primary-cta[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*42px/);
  assert.match(cssSource, /\.dossier-primary-cta img[\s\S]*grid-column:\s*2/);
  assert.match(cssSource, /\.dossier-secondary-cta[\s\S]*min-height:\s*64px/);
  assert.ok(
    cssSource.lastIndexOf(".dossier-page .dossier-main-card") > cssSource.lastIndexOf("SVG asset integration"),
    "dossier main card paper background should override shared asset fallback styles"
  );
});

test("dossier cover uses the local hero asset without generating a new image", () => {
  assert.match(typeSource, /generatedMissionCoverUrl\?:\s*string/);
  assert.match(uiSource, /dossier:\s*\{/);
  assert.match(uiSource, /missionCoverFallback:\s*"\/assets\/citywalk\/dossier\/mission-cover-fallback\.png"/);
  assert.match(pageSource, /<img/);
  assert.match(pageSource, /const missionCoverSrc = taskDossierAssets\.heroCase/);
  assert.doesNotMatch(pageSource, /dossier\.generatedMissionCoverUrl \|\|/);
});

test("dossier page keeps state hooks before the empty-session return", () => {
  const emptyStateIndex = pageSource.indexOf("if (!session)");
  const selectedRoleStateIndex = pageSource.indexOf("const [selectedRoleId");
  const expandedStateIndex = pageSource.indexOf("const [expanded");

  assert.ok(emptyStateIndex > -1, "dossier page should still render an empty state without a session");
  assert.ok(selectedRoleStateIndex > -1, "dossier page should keep the selected role state");
  assert.ok(expandedStateIndex > -1, "dossier page should keep the story expansion state");
  assert.ok(
    selectedRoleStateIndex < emptyStateIndex && expandedStateIndex < emptyStateIndex,
    "state hooks must run before the conditional empty-session return to keep hook order stable"
  );
});
