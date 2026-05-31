import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readCssWithImports } from "./helpers/css-source";

const pageSource = readFileSync(new URL("../src/app/clues/page.tsx", import.meta.url), "utf8");
const uiSource = readFileSync(new URL("../src/app/ui.tsx", import.meta.url), "utf8");
const appClientSource = readFileSync(new URL("../src/app/app-client.tsx", import.meta.url), "utf8");
const collectionAssetsSource = readFileSync(new URL("../src/lib/collection-assets.ts", import.meta.url), "utf8");
const cssSource = readCssWithImports(new URL("../src/app/globals.css", import.meta.url));
const renderedCollectionSource = `${pageSource}\n${uiSource}\n${appClientSource}\n${cssSource}`;

test("collection empty state routes new users to generation and active users to scanning", () => {
  assert.match(pageSource, /<CollectionGuideCard[\s\S]*href="\/"[\s\S]*action="生成任务地图"/);
  assert.match(pageSource, /<CollectionGuideCard[\s\S]*href="\/photo"[\s\S]*action="去扫描"/);
  assert.match(pageSource, /function CollectionGuideCard\(props:/);
  assert.doesNotMatch(pageSource, /<Link className="primary-action" href="\/photo">去扫描<\/Link>/);
});

test("collection page keeps text and actions in code", () => {
  assert.match(pageSource, /className="collection-page-title"/);
  assert.match(pageSource, /className="collection-guide-action primary-action"/);
  assert.match(uiSource, /className="collection-locked-tag"/);
  assert.match(uiSource, /<span>LOCKED<\/span>/);
  assert.match(uiSource, /<h3>\{item\.locked \? "\?\?\?" : item\.title\}<\/h3>/);
  assert.doesNotMatch(cssSource, /content:\s*"LOCKED"/);
  assert.doesNotMatch(cssSource, /content:\s*"\?\?\?"/);
  assert.doesNotMatch(renderedCollectionSource, /\/assets\/collection_adventure\//);
});

test("collection active-session middle section stays compact", () => {
  assert.match(cssSource, /\.mobile-app:has\(\.collection-page\) \.collection-dashboard[\s\S]{0,260}padding:\s*22px 22px 18px/);
  assert.match(cssSource, /\.collection-dashboard-head[\s\S]{0,180}grid-template-columns:\s*1fr 96px/);
  assert.match(cssSource, /\.collection-dashboard-head > strong\.collection-progress-badge[\s\S]{0,220}width:\s*104px[\s\S]{0,90}height:\s*104px/);
  assert.match(cssSource, /\.collection-dashboard-head p:not\(\.eyebrow\)[\s\S]{0,220}-webkit-line-clamp:\s*2/);
  assert.match(cssSource, /\.collection-stat-chip[\s\S]{0,180}min-height:\s*58px/);
  assert.match(cssSource, /\.mobile-app:has\(\.collection-page\) \.collection-role-card[\s\S]{0,260}padding:\s*20px 132px 18px 22px/);
  assert.match(cssSource, /\.collection-role-card p:not\(\.eyebrow\)[\s\S]{0,220}-webkit-line-clamp:\s*2/);
  assert.match(cssSource, /\.mobile-app:has\(\.collection-page\) \.collection-tabs[\s\S]{0,260}padding:\s*0 0 2px/);
  assert.match(cssSource, /\.mobile-app:has\(\.collection-page\) \.collection-tabs button[\s\S]{0,180}min-height:\s*46px/);
});

test("collection page uses the final art pack through the collection asset map", () => {
  for (const assetName of [
    "bg_sunny_city.webp",
    "bg_light_particles.png",
    "hero_card_frame.webp",
    "hero_map_route.png",
    "hero_compass_large.png",
    "hero_city_stamp.png",
    "progress_card_bg.webp",
    "progress_badge_ring.png",
    "progress_ribbon.png",
    "stat_chip_blue.png",
    "stat_chip_gold.png",
    "stat_chip_green.png",
    "owner_card_bg.webp",
    "owner_id_badge.png",
    "owner_photo_stack.png",
    "owner_stamp_watermark.png",
    "filter_pill_active.png",
    "filter_pill_default.png",
    "icon_filter_all.png",
    "icon_filter_main.png",
    "icon_filter_branch.png",
    "icon_filter_hidden.png",
    "icon_filter_mystery.png",
    "clue_card_locked_bg.webp",
    "clue_card_unlocked_bg.webp",
    "clue_card_unlocked_image_frame.png",
    "tag_unlocked_plate.png",
    "stamp_collected.png",
    "locked_bottom_badge.png",
    "nav_bar_bg.webp",
    "nav_active_panel.png",
    "icon_nav_collection_active.png"
  ]) {
    assert.match(collectionAssetsSource, new RegExp(`${assetName.replace(".", "\\.")}`));
  }

  assert.match(collectionAssetsSource, /export const collectionAssets/);
  assert.match(pageSource, /collectionAssets\.hero\.cardFrame/);
  assert.match(uiSource, /collectionAssets\.clueCards\.lockedBg/);
  assert.match(uiSource, /collectionAssets\.clueCards\.unlockedBg/);
  assert.match(pageSource, /className="collection-stat-chip-icon"/);
  assert.match(pageSource, /collection-filter-icon/);
  assert.match(uiSource, /collection-collected-stamp/);
  assert.match(cssSource, /bg_sunny_city\.webp/);
  assert.match(cssSource, /progress_card_bg\.webp/);
  assert.match(cssSource, /owner_card_bg\.webp/);
  assert.match(cssSource, /nav_bar_bg\.webp/);
});

test("collection render path uses processed transparent art assets", () => {
  for (const pattern of [
    /collectionAssets\.hero\.mapRoute/,
    /collectionAssets\.hero\.cityStamp/,
    /collectionAssets\.hero\.compassLarge/,
    /collectionAssets\.hero\.collectionTileIcon/,
    /collectionAssets\.progress\.badgeRing/,
    /collectionAssets\.progress\.ribbon/,
    /collectionAssets\.progress\.iconMainClue/,
    /collectionAssets\.progress\.iconHiddenEgg/,
    /collectionAssets\.progress\.iconArchiveBook/,
    /collectionAssets\.owner\.idBadge/,
    /collectionAssets\.owner\.photoStack/,
    /collectionAssets\.owner\.stampWatermark/,
    /collectionAssets\.filters\./,
    /collectionAssets\.clueCards\.lockedTagPlate/,
    /collectionAssets\.clueCards\.lockIconSmall/,
    /collectionAssets\.clueCards\.lockedBottomBadge/,
    /collectionAssets\.clueCards\.unlockedImageFrame/,
    /collectionAssets\.clueCards\.collectedStamp/,
    /collectionAssets\.clueCards\.unlockedTagPlate/
  ]) {
    assert.match(`${pageSource}\n${uiSource}\n${appClientSource}`, pattern);
  }

  for (const assetName of [
    "bg_light_particles.png",
    "stat_chip_blue.png",
    "stat_chip_gold.png",
    "stat_chip_green.png",
    "filter_pill_active.png",
    "filter_pill_default.png"
  ]) {
    assert.match(cssSource, new RegExp(assetName.replace(".", "\\.")));
  }
});

test("collection final compact pass stays after legacy collection overrides", () => {
  const compactIndex = cssSource.lastIndexOf("Collection compact empty-state final pass");
  assert.ok(compactIndex > cssSource.lastIndexOf("Collection reference-art pass"));
  assert.ok(compactIndex > cssSource.lastIndexOf("Final checkerboard-free Collection fallbacks"));
  assert.match(cssSource.slice(compactIndex), /collection-page-title[\s\S]{0,180}min-height:\s*218px/);
  assert.match(cssSource.slice(compactIndex), /collection-dashboard[\s\S]{0,180}min-height:\s*202px/);
  assert.match(cssSource.slice(compactIndex), /collection-guide-card[\s\S]{0,220}min-height:\s*132px/);
  assert.match(cssSource.slice(compactIndex), /bottom-nav[\s\S]{0,220}min-height:\s*calc\(78px \+ env\(safe-area-inset-bottom\)\)/);
});

test("collection reference polish pass refines proportions after unified navigation", () => {
  const polishIndex = cssSource.lastIndexOf("Collection reference polish pass");
  assert.ok(polishIndex > cssSource.lastIndexOf("Unified bottom navigation"));
  assert.match(cssSource.slice(polishIndex), /collection-page-title[\s\S]{0,180}min-height:\s*226px/);
  assert.match(cssSource.slice(polishIndex), /collection-dashboard[\s\S]{0,180}min-height:\s*210px/);
  assert.match(cssSource.slice(polishIndex), /collection-role-card[\s\S]{0,180}min-height:\s*132px/);
  assert.match(cssSource.slice(polishIndex), /collection-tabs button[\s\S]{0,180}min-height:\s*42px/);
  assert.match(cssSource.slice(polishIndex), /bottom-nav[\s\S]{0,220}min-height:\s*calc\(68px \+ env\(safe-area-inset-bottom\)\)/);
});
