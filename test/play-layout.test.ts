import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readCssWithImports } from "./helpers/css-source";

const pageSource = readFileSync(new URL("../src/app/play/page.tsx", import.meta.url), "utf8");
const photoSource = readFileSync(new URL("../src/app/photo/page.tsx", import.meta.url), "utf8");
const cssSource = readCssWithImports(new URL("../src/app/globals.css", import.meta.url));
const sunnyCss = cssSource.slice(cssSource.indexOf("/* Sunny CityWalk play page */"));

test("play page is split into sunny hero, current task, route map, shortcuts, and details", () => {
  const topbarIndex = pageSource.indexOf("<PlayMissionTopbar");
  const heroIndex = pageSource.indexOf("<PlayHeroOverview");
  const taskIndex = pageSource.indexOf("<CurrentTaskModule");
  const routeIndex = pageSource.indexOf("<RouteOverviewModule");
  const intelIndex = pageSource.indexOf("<PlayIntelGrid");
  const ctaIndex = pageSource.indexOf("开始扫描本站");
  const shortcutsIndex = pageSource.indexOf("task-hub-actions compact");
  const panelIndex = pageSource.indexOf("<MissionIntelPanel");
  const activeBranch = pageSource.slice(pageSource.indexOf("return ("), pageSource.indexOf("function QuestNotReady"));

  assert.ok(topbarIndex > -1, "play page should render a compact CityWalk topbar");
  assert.ok(heroIndex > -1, "play page should render a hero overview module");
  assert.ok(heroIndex > topbarIndex, "hero overview should follow topbar");
  assert.ok(taskIndex > heroIndex, "current task module should follow hero overview");
  assert.ok(routeIndex > taskIndex, "route map module should follow current task module");
  assert.ok(intelIndex > routeIndex, "reference-style intel cards should follow route module");
  assert.ok(ctaIndex > taskIndex);
  assert.ok(shortcutsIndex > intelIndex);
  assert.ok(panelIndex > shortcutsIndex);
  assert.equal(activeBranch.includes("<PageTitle"), false, "active play page should not render the large PageTitle header");
  assert.equal(activeBranch.includes("<MissionPanel"), false, "active play page should not concentrate the first screen in MissionPanel");
  assert.equal(activeBranch.includes("<details className=\"secondary-drawer\""), false, "active play page should not append a long details drawer");
  assert.match(pageSource, /playSunnyVars/);
  assert.match(pageSource, /现实城市冒险/);
  assert.match(pageSource, /查看档案/);
  assert.match(pageSource, /FIELD NOTE/);
  assert.match(pageSource, /EXTRA[\s\S]*CLUE/);
});

test("play mission intel uses a stateful half-screen panel with route, clue, and system tabs", () => {
  assert.match(pageSource, /const \[intelOpen, setIntelOpen\] = useState\(false\)/);
  assert.match(pageSource, /const \[intelTab, setIntelTab\] = useState<IntelTab>\("route"\)/);
  assert.match(pageSource, /type IntelTab = "route" \| "clues" \| "system"/);
  assert.match(pageSource, /function MissionIntelPanel/);
  assert.match(pageSource, /activeTab/);
  assert.match(pageSource, /onTabChange/);
  assert.match(pageSource, /路线/);
  assert.match(pageSource, /线索/);
  assert.match(pageSource, /系统/);
  assert.match(cssSource, /\.mission-intel-panel/);
  assert.match(cssSource, /max-height:\s*72dvh/);
  assert.match(cssSource, /\.mission-intel-tabs/);
  assert.match(cssSource, /\.mission-intel-scroll/);
  assert.match(cssSource, /\.mission-intel-backdrop/);
});

test("play hero uses local sunny CityWalk assets instead of generated or remote imagery", () => {
  assert.match(pageSource, /citywalkAssets\.playSunny\.heroWukangBookstore/);
  assert.match(pageSource, /citywalkAssets\.playSunny\.bgCitySunny/);
  assert.match(pageSource, /citywalkAssets\.playSunny\.decoLeavesTop/);
  assert.match(pageSource, /citywalkAssets\.playSunny\.decoMapPattern/);
  assert.match(pageSource, /citywalkAssets\.playSunny\.iconCompassGold/);
  assert.match(pageSource, /citywalkAssets\.playSunny\.iconTreasure/);
  assert.match(pageSource, /citywalkAssets\.playSunny\.thumbBookstorePolaroid/);
  assert.doesNotMatch(pageSource, /generatedMissionCoverUrl/);
  assert.match(pageSource, /--play-sunny-bg/);
  assert.match(pageSource, /--play-hero-image/);
  assert.match(pageSource, /--play-leaves-top/);
  assert.match(pageSource, /--play-map-pattern/);
  assert.match(pageSource, /play-hero-cover/);
  assert.match(sunnyCss, /\.play-hero-overview::before/);
  assert.match(sunnyCss, /\.play-hero-cover::after/);
  assert.match(sunnyCss, /\.play-mission-topbar/);
  assert.match(sunnyCss, /\.play-hero-photo-pin/);
  assert.doesNotMatch(sunnyCss, /\/assets\/citywalk_ui_art_assets_final\/webp\//);
});

test("play current task and route map use bright sunny glass hierarchy", () => {
  assert.match(sunnyCss, /\.play-dashboard/);
  assert.match(sunnyCss, /--play-bg-start:\s*#EAF7FF/);
  assert.match(sunnyCss, /--play-text-main:\s*#07346B/);
  assert.match(sunnyCss, /--play-primary:\s*#1E9BFF/);
  assert.match(sunnyCss, /--play-glass:\s*rgba\(255,\s*255,\s*255,\s*0\.88\)/);
  assert.match(sunnyCss, /padding-bottom:\s*calc\(96px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(sunnyCss, /\.play-current-task/);
  assert.match(sunnyCss, /\.play-main-objective/);
  assert.match(sunnyCss, /\.play-hidden-objective/);
  assert.match(sunnyCss, /\.play-route-map/);
  assert.match(sunnyCss, /\.play-map-node\.current/);
  assert.match(sunnyCss, /\.play-map-node\.finish/);
  assert.match(sunnyCss, /\.play-evidence-note/);
  assert.match(sunnyCss, /\.play-extra-stamp/);
  assert.match(sunnyCss, /\.play-intel-grid/);
  assert.match(sunnyCss, /\.play-intel-card/);
  assert.match(sunnyCss, /var\(--play-sunny-bg\)/);
  assert.match(sunnyCss, /var\(--play-hero-image\)/);
  assert.match(sunnyCss, /var\(--play-leaves-top\)/);
  assert.match(sunnyCss, /var\(--play-map-pattern\)/);
  assert.match(sunnyCss, /var\(--play-treasure-icon\)/);
  assert.match(sunnyCss, /var\(--play-field-note-icon\)/);
  assert.match(sunnyCss, /var\(--play-polaroid-thumb\)/);
  assert.match(sunnyCss, /\.play-map-node\.next/);
  assert.match(sunnyCss, /\.mobile-app:has\(\.play-dashboard\) \.floating-compass/);
  assert.match(sunnyCss, /body:has\(\.play-dashboard\) nextjs-portal/);
  assert.match(sunnyCss, /\.scan-quest-action[\s\S]*linear-gradient\(135deg, #1E9BFF/);
  assert.doesNotMatch(sunnyCss, /\.scan-quest-action[\s\S]{0,220}#ff8a1c/);
  assert.doesNotMatch(sunnyCss, /#06182c|#052035|#04192b/);
});

test("photo page previews the active station task before upload instead of a fixed demo task", () => {
  assert.match(photoSource, /createCurrentTaskPreviewOverlay/);
  assert.match(photoSource, /const overlay = app\.photoOverlay \?\? currentTaskPreview/);
  assert.match(photoSource, /node\.photoPrompt \|\| node\.mainTask/);
  assert.doesNotMatch(photoSource, /MAIN QUEST<\/b>\{overlay\.mainTask \|\| node\.photoPrompt \|\| node\.mainTask\}/);
});

test("photo page counts main and hidden scan discoveries independently", () => {
  assert.match(photoSource, /const mainDiscovered = discoveries\.some\(\(item\) => item\.markerType === "main"\)/);
  assert.match(photoSource, /const hiddenTotal = overlay\.markers\.filter\(\(marker\) => marker\.type === "hidden"\)\.length/);
  assert.match(photoSource, /value=\{`\$\{mainDiscovered \? 1 : 0\}\/1`\}/);
  assert.match(photoSource, /value=\{`\$\{hiddenCount\}\/\$\{hiddenTotal\}`\}/);
  assert.doesNotMatch(photoSource, /discoveredIds\.size > 0 \? 1 : 0/);
  assert.doesNotMatch(photoSource, /value=\{`\$\{hiddenCount\}\/2`\}/);
});

test("photo HUD moves long task copy out of the camera overlay and lays out markers", () => {
  assert.match(photoSource, /const \[selectedMarker, setSelectedMarker\] = useState<OverlayMarker \| null>\(null\)/);
  assert.match(photoSource, /<ScanMarkerSheet/);
  assert.match(photoSource, /onMarkerSelect=\{setSelectedMarker\}/);
  assert.match(photoSource, /onMarkerConfirm=\{handleMarkerClick\}/);
  assert.match(cssSource, /\.scan-marker-sheet/);
  assert.match(cssSource, /\.hud-marker[\s\S]*?transform:\s*translate\(-50%, -50%\)/);
  assert.doesNotMatch(cssSource, /\.hud-label-card\.main/);
  assert.doesNotMatch(cssSource, /\.hud-label-card\.hidden/);
});

test("debug answer control is gated out of production UI", () => {
  assert.match(pageSource, /const showDebugAnswer/);
  assert.match(pageSource, /process\.env\.NODE_ENV !== "production"/);
  assert.match(pageSource, /\{showDebugAnswer \? \(/);
});

test("text progression is presented only as a safety fallback or dev aid", () => {
  assert.match(pageSource, /const showTextFallback/);
  assert.match(pageSource, /app\.output\?\.fallback_available === true/);
  assert.match(pageSource, /const showTextProgression = showTextFallback \|\| showDebugAnswer/);
  assert.match(pageSource, /\{showTextProgression \? \(/);
  assert.match(pageSource, /安全替代推理/);
  assert.doesNotMatch(pageSource, /<GameCard className="legacy-answer">\s*<label>/);
});
