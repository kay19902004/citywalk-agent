import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { layoutHudMarkers } from "../src/app/ui";
import type { OverlayMarker } from "../src/lib/types";
import { readCssWithImports } from "./helpers/css-source";

const pageSource = readFileSync(new URL("../src/app/photo/page.tsx", import.meta.url), "utf8");
const appClientSource = readFileSync(new URL("../src/app/app-client.tsx", import.meta.url), "utf8");
const uiSource = readFileSync(new URL("../src/app/ui.tsx", import.meta.url), "utf8");
const cssSource = readCssWithImports(new URL("../src/app/globals.css", import.meta.url));

test("HUD marker layout keeps markers inside the tappable camera area", () => {
  const markers: OverlayMarker[] = [
    { id: "main-edge", type: "main", label: "MAIN QUEST", x: 0.02, y: 0.02, clueText: "拍摄门牌", actionLabel: "完成" },
    { id: "hidden-edge", type: "hidden", label: "HIDDEN EGG", x: 0.98, y: 0.96, clueText: "寻找角落细节", actionLabel: "收集" }
  ];

  const laidOut = layoutHudMarkers(markers);

  assert.equal(laidOut.length, markers.length);
  assert.ok(laidOut.every((marker) => marker.x >= 0.18 && marker.x <= 0.82));
  assert.ok(laidOut.every((marker) => marker.y >= 0.22 && marker.y <= 0.78));
});

test("HUD marker layout separates overlapping markers", () => {
  const markers: OverlayMarker[] = [
    { id: "main-1", type: "main", label: "MAIN QUEST", x: 0.5, y: 0.5, clueText: "拍摄门牌", actionLabel: "完成" },
    { id: "hidden-1", type: "hidden", label: "HIDDEN EGG", x: 0.51, y: 0.5, clueText: "寻找角落细节", actionLabel: "收集" },
    { id: "hidden-2", type: "hidden", label: "HIDDEN EGG", x: 0.5, y: 0.51, clueText: "观察橱窗", actionLabel: "收集" }
  ];

  const laidOut = layoutHudMarkers(markers);

  for (let index = 1; index < laidOut.length; index += 1) {
    const previous = laidOut[index - 1];
    const current = laidOut[index];
    const distance = Math.hypot(current.x - previous.x, current.y - previous.y);
    assert.ok(distance >= 0.13, `markers ${previous.id} and ${current.id} should not overlap`);
  }
});

test("photo scan page uses the sunny AR local asset pack without changing scan actions", () => {
  assert.match(uiSource, /scanAdventure/);
  assert.match(uiSource, /bg_city_sunny\.webp/);
  assert.match(uiSource, /hud_street_demo\.webp/);
  assert.match(uiSource, /hud_frame_overlay\.png/);
  assert.match(uiSource, /marker_main_base\.png/);
  assert.match(uiSource, /marker_hidden_base\.png/);
  assert.match(uiSource, /icon_scan_camera\.png/);

  assert.match(pageSource, /citywalkAssets\.scanAdventure\.hudStreetDemo/);
  assert.match(pageSource, /app\.photoDataUrl \|\| citywalkAssets\.scanAdventure\.hudStreetDemo/);
  assert.match(pageSource, /label="相册"/);
  assert.match(pageSource, /label=\{app\.loading \? "扫描中" : "扫描"\}/);
  assert.match(pageSource, /iconSrc=\{citywalkAssets\.scanAdventure\.icons\.album\}/);
  assert.match(pageSource, /iconSrc=\{citywalkAssets\.scanAdventure\.icons\.scanCamera\}/);
  assert.match(pageSource, /href="\/play"/);
});

test("photo scan CSS builds a bright AR game layer from bitmap assets", () => {
  const scanCss = cssSource.slice(cssSource.indexOf("/* Sunny AR scan page */"));

  assert.match(pageSource, /"--scan-bg-city": `url\(\$\{citywalkAssets\.scanAdventure\.bgCitySunny\}\)`/);
  assert.match(pageSource, /"--scan-hud-frame": `url\(\$\{citywalkAssets\.scanAdventure\.hudFrameOverlay\}\)`/);
  assert.match(pageSource, /"--scan-marker-main": `url\(\$\{citywalkAssets\.scanAdventure\.markerMainBase\}\)`/);
  assert.match(pageSource, /"--scan-marker-hidden": `url\(\$\{citywalkAssets\.scanAdventure\.markerHiddenBase\}\)`/);
  assert.match(scanCss, /\.scan-adventure-page/);
  assert.match(scanCss, /\.scan-progress-card/);
  assert.match(scanCss, /\.scan-target-card/);
  assert.match(scanCss, /\.scan-hud-demo-stage/);
  assert.match(scanCss, /\.scan-hud-frame-overlay/);
  assert.match(scanCss, /\.scan-hud-reticle/);
  assert.match(scanCss, /\.scan-hud-radar/);
  assert.match(scanCss, /\.scan-hud-compass/);
  assert.match(scanCss, /\.hud-marker[\s\S]*pointer-events:\s*auto/);
  assert.match(scanCss, /\.scan-decoration[\s\S]*pointer-events:\s*none/);
  assert.match(scanCss, /\.scan-bottom-actions/);
  assert.match(scanCss, /background:\s*#EAF7FF|linear-gradient\(180deg,\s*#EAF7FF/);
  assert.doesNotMatch(scanCss, /#06182c|#052035|#04192b/);
});

test("photo scan page demo state keeps the mission briefing hierarchy close to the target art", () => {
  const emptySessionBranch = pageSource.slice(pageSource.indexOf("if (!app.session)"), pageSource.indexOf("const node = app.session.currentScene"));

  assert.match(emptySessionBranch, /SCAN TARGET/);
  assert.match(emptySessionBranch, /武康路旧书店门口/);
  assert.match(emptySessionBranch, /MAIN QUEST/);
  assert.match(emptySessionBranch, /HIDDEN EGG/);
  assert.match(emptySessionBranch, /scan-objective-row main/);
  assert.match(emptySessionBranch, /scan-objective-row hidden/);
  assert.doesNotMatch(emptySessionBranch, /先看一眼照片变游戏界面/);
  assert.doesNotMatch(emptySessionBranch, /街角旧书店/);
});

test("photo scan demo keeps the bottom action area clean", () => {
  const emptySessionBranch = pageSource.slice(pageSource.indexOf("if (!app.session)"), pageSource.indexOf("const node = app.session.currentScene"));
  const scanCss = cssSource.slice(cssSource.indexOf("/* Sunny AR scan page */"));

  assert.doesNotMatch(emptySessionBranch, /scan-start-link/);
  assert.doesNotMatch(emptySessionBranch, /生成任务地图/);
  assert.match(scanCss, /\.mobile-app:has\(\.scan-adventure-page\) \.floating-compass[\s\S]*display:\s*none !important/);
});

test("photo scan CSS target-match pass tightens card density, HUD crop, and bottom action proportions", () => {
  const scanCss = cssSource.slice(cssSource.indexOf("/* Sunny AR scan page */"));

  assert.match(scanCss, /\/\* Target-match scan page refinement \*\//);
  assert.match(scanCss, /\.scan-adventure-page[\s\S]*padding:\s*calc\(8px \+ env\(safe-area-inset-top\)\) 12px/);
  assert.match(scanCss, /\.scan-progress-card[\s\S]*min-height:\s*88px/);
  assert.match(scanCss, /\.scan-target-card[\s\S]*padding:\s*12px/);
  assert.match(scanCss, /\.scan-objective-row[\s\S]*min-height:\s*76px/);
  assert.match(scanCss, /\.scan-objective-row\.hidden span[\s\S]*max-width:\s*calc\(100% - 112px\)/);
  assert.match(scanCss, /\.scan-hud-demo-stage\.photo-hud-stage[\s\S]*aspect-ratio:\s*1\.18/);
  assert.match(scanCss, /\.scan-hud-demo-stage \.scan-hud-photo[\s\S]*object-position:\s*center 45%/);
  assert.match(scanCss, /\.scan-hud-demo-stage\.photo-hud-stage \.scan-hud-frame-overlay[\s\S]*inset:\s*0/);
  assert.match(scanCss, /\.scan-hud-demo-stage\.photo-hud-stage \.scan-hud-reticle[\s\S]*display:\s*none/);
  assert.match(scanCss, /\.scan-hud-demo-stage\.photo-hud-stage \.scan-hud-radar[\s\S]*inset:\s*auto auto 24px 12px/);
  assert.match(scanCss, /\.scan-hud-demo-stage\.photo-hud-stage \.scan-hud-radar[\s\S]*width:\s*112px/);
  assert.match(scanCss, /\.scan-hud-demo-stage\.photo-hud-stage \.scan-hud-compass[\s\S]*inset:\s*auto 17px 30px auto/);
  assert.match(scanCss, /\.scan-bottom-actions\.scan-actions[\s\S]*position:\s*sticky/);
  assert.match(scanCss, /\.scan-bottom-actions\.scan-actions[\s\S]*left:\s*auto/);
  assert.match(scanCss, /\.scan-bottom-actions\.scan-actions[\s\S]*width:\s*100%/);
  assert.match(scanCss, /\.scan-bottom-actions\.scan-actions[\s\S]*transform:\s*none/);
  assert.match(scanCss, /\.scan-bottom-actions \.upload-tab\.primary[\s\S]*min-height:\s*92px/);
  assert.match(scanCss, /\.scan-bottom-actions \.upload-tab\.primary[\s\S]*background-position:\s*center/);
  assert.match(scanCss, /\.scan-bottom-actions \.upload-tab\.primary[\s\S]*overflow:\s*visible/);

  const primaryButtonRule = scanCss.match(/\.scan-bottom-actions \.upload-tab\.primary \{[\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(primaryButtonRule, /background:\s*linear-gradient/);
  assert.doesNotMatch(primaryButtonRule, /var\(--scan-cta-glow\)/);
});

test("photo scan top controls keep leaf decoration behind readable actions", () => {
  const scanCss = cssSource.slice(cssSource.indexOf("/* Target-match scan page refinement */"));

  assert.match(scanCss, /\.scan-leaf-foreground[\s\S]*z-index:\s*0/);
  assert.match(scanCss, /\.scan-leaf-foreground[\s\S]*pointer-events:\s*none/);
  assert.match(scanCss, /\.scan-adventure-page \.scan-back-button[\s\S]*z-index:\s*3/);
  assert.match(scanCss, /\.scan-progress-card[\s\S]*z-index:\s*2/);
  assert.match(scanCss, /\.scan-adventure-page \.scan-back-button[\s\S]*background:\s*linear-gradient/);
});

test("photo page reveals story after main marker instead of auto navigating", () => {
  assert.match(appClientSource, /completePhotoMarker:\s*\(marker: OverlayMarker\) => Promise<ExpandedSceneOutput \| null>/);
  assert.match(appClientSource, /return result;/);
  const completePhotoBlock = appClientSource.slice(
    appClientSource.indexOf("completePhotoMarker: async"),
    appClientSource.indexOf("requestGps: async")
  );
  assert.doesNotMatch(completePhotoBlock, /router\.push/);

  assert.match(pageSource, /const \[storyReveal, setStoryReveal\] = useState<ExpandedSceneOutput \| null>\(null\)/);
  assert.match(pageSource, /<StoryRevealSheet/);
  assert.match(pageSource, /setStoryReveal\(result\)/);
  assert.match(pageSource, /storyReveal\.next_action === "show_ending" \? "\/clues" : "\/play"/);
});

test("photo page derives concrete task copy from station story context", () => {
  assert.match(pageSource, /buildPhotoTasks\(node, overlay\)/);
  assert.match(pageSource, /node\.contradiction\.claim/);
  assert.match(pageSource, /node\.discovery/);
  assert.match(pageSource, /拍下\$\{node\.locationName\}/);
  assert.match(pageSource, /寻找照片里/);
});
