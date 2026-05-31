import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componentSource = readFileSync(new URL("../src/pages/CityAdventureHome.tsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/styles/city-adventure.css", import.meta.url), "utf8");
const appPageSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../src/app/layout.tsx", import.meta.url), "utf8");

test("CityAdventureHome wires the mobile game home content and interactions", () => {
  assert.match(componentSource, /export default function CityAdventureHome/);
  assert.match(componentSource, /function navigate/);
  assert.match(appPageSource, /<CityAdventureHome \/>/);
  assert.match(layoutSource, /..\/styles\/city-adventure\.css/);

  for (const copy of [
    "CITY ADVENTURE",
    "城市冒险",
    "今日探索",
    "神秘任务",
    "剧情任务",
    "开始冒险",
    "游客体验",
    "登录后保存角色、路线和探索记录"
  ]) {
    assert.match(componentSource, new RegExp(copy));
  }

  for (const log of ["console.log(\"start adventure\")", "console.log(\"guest mode\")"]) {
    assert.match(componentSource, new RegExp(log.replace(/[()]/g, "\\$&")));
  }

  for (const path of ["/location", "/play", "/clues", "/dossier", "/me"]) {
    assert.match(componentSource, new RegExp(`navigate\\("${path}"\\)`));
  }

  for (const label of ["活动", "背包", "邮件", "城市地图", "附近探索", "足迹"]) {
    assert.match(componentSource, new RegExp(`aria-label="${label}"`));
  }
});

test("CityAdventureHome uses bundled city adventure assets and mobile absolute layout", () => {
  for (const asset of [
    "bg_city_day.webp",
    "logo_city_adventure.webp",
    "route_glow.webp",
    "btn_primary_glow.webp",
    "btn_secondary_frost.webp",
    "panel_daily.webp",
    "panel_task_gold.webp",
    "panel_task_white.webp",
    "panel_small_blue.webp",
    "panel_small_green.webp",
    "icon_gift.png",
    "icon_bag.png",
    "icon_mail.png",
    "icon_map.png",
    "icon_compass.png",
    "icon_footprint.png",
    "icon_weather_sun.png",
    "icon_chest.png",
    "icon_star.png",
    "icon_book.png",
    "icon_pin_blue.png",
    "icon_pin_green.png",
    "icon_pin_orange.png",
    "avatar_boy.webp",
    "fx_sparkles.png",
    "nav_sign.webp"
  ]) {
    assert.match(componentSource, new RegExp(asset.replace(".", "\\.")));
  }

  assert.match(cssSource, /\.city-adventure-home/);
  assert.match(cssSource, /max-width:\s*430px/);
  assert.match(cssSource, /aspect-ratio:\s*9\s*\/\s*16/);
  assert.match(cssSource, /env\(safe-area-inset-top\)/);
  assert.match(cssSource, /position:\s*absolute/);
  assert.match(cssSource, /clamp\(/);
  assert.match(cssSource, /overflow-x:\s*hidden/);
  assert.match(cssSource, /:active/);
}
);

test("place cards do not render duplicate large pin icons over route markers", () => {
  assert.doesNotMatch(componentSource, /className="ca-place-icon"/);
  assert.match(componentSource, /className="ca-panel-bg"/);
  assert.match(componentSource, /className="ca-route-dot ca-route-start"/);
  assert.match(cssSource, /\.ca-place-card span,[\s\S]*?\.ca-place-card strong,[\s\S]*?\.ca-place-card small[\s\S]{0,180}margin-left:\s*clamp\(58px,\s*14vw,\s*76px\)/);
  assert.doesNotMatch(cssSource, /\.ca-place-icon\s*\{/);
});

test("city adventure home keeps reference-style right shortcuts and readable map cards", () => {
  assert.match(cssSource, /\.ca-quick-actions[\s\S]*?right:\s*clamp\(9px,\s*2\.4vw,\s*14px\)[\s\S]*?grid-template-columns:\s*1fr/);
  assert.match(cssSource, /\.ca-quick-action b[\s\S]*?position:\s*static/);
  assert.match(cssSource, /\.ca-place-card\s*\{[\s\S]*?width:\s*41%/);
  assert.match(cssSource, /\.ca-right-tasks\s*\{[\s\S]*?height:\s*30%/);
});

test("city adventure home separates task art, shortcuts, and title elements", () => {
  assert.match(cssSource, /\.ca-title-block p\s*\{[\s\S]*?border:\s*0/);
  assert.match(cssSource, /\.ca-title-block p\s*\{[\s\S]*?background:\s*transparent/);
  assert.match(cssSource, /\.ca-title-block h1\s*\{[\s\S]*?width:\s*96%/);
  assert.match(cssSource, /\.ca-right-tasks\s*\{[\s\S]*?right:\s*3%[\s\S]*?width:\s*40%/);
  assert.match(cssSource, /\.ca-task-icon\s*\{[\s\S]*?left:\s*4%/);
  assert.doesNotMatch(cssSource, /\.ca-task-icon\s*\{[\s\S]*?left:\s*-/);
  assert.match(cssSource, /\.ca-task-card span,[\s\S]*?\.ca-task-card strong,[\s\S]*?\.ca-task-card small[\s\S]{0,240}margin-left:\s*clamp\(48px,\s*10\.5vw,\s*58px\)[\s\S]{0,120}margin-right:\s*clamp\(38px,\s*8\.5vw,\s*48px\)/);
  assert.match(cssSource, /\.ca-mini-chest\s*\{[\s\S]*?right:\s*clamp\(4px,\s*1\.2vw,\s*8px\)[\s\S]*?width:\s*clamp\(34px,\s*8vw,\s*40px\)[\s\S]*?height:\s*clamp\(34px,\s*8vw,\s*40px\)/);
  assert.match(cssSource, /\.ca-avatar\s*\{[\s\S]*?right:\s*clamp\(2px,\s*0\.8vw,\s*5px\)[\s\S]*?bottom:\s*7%[\s\S]*?width:\s*clamp\(34px,\s*8\.5vw,\s*44px\)[\s\S]*?height:\s*clamp\(34px,\s*8\.5vw,\s*44px\)/);
  assert.match(cssSource, /\.ca-quick-actions\s*\{[\s\S]*?bottom:\s*calc\(env\(safe-area-inset-bottom\) \+ clamp\(48px,\s*11vw,\s*64px\)\)/);
});

test("city adventure task cards sit inside the route without overpowering map points", () => {
  assert.match(cssSource, /\.ca-route\s*\{[\s\S]*?width:\s*50%[\s\S]*?height:\s*38%[\s\S]*?opacity:\s*0\.92/);
  assert.match(cssSource, /\.ca-route\s*\{[\s\S]*?drop-shadow\(0 0 8px rgba\(75,\s*255,\s*238,\s*0\.92\)\)/);
  assert.match(cssSource, /\.ca-route-mid\s*\{[\s\S]*?top:\s*44\.9%[\s\S]*?right:\s*37%/);
  assert.match(cssSource, /\.ca-landmark-card\s*\{[\s\S]*?top:\s*43\.4%[\s\S]*?left:\s*38\.8%/);
  assert.match(cssSource, /\.ca-explore-card\s*\{[\s\S]*?top:\s*56\.8%[\s\S]*?left:\s*31\.5%/);
});

test("city adventure home matches the reference phone-stage polish", () => {
  assert.match(cssSource, /html:has\(\.city-adventure-home\)\s*\{[\s\S]*?background:\s*#071a38/);
  assert.match(cssSource, /body:has\(\.city-adventure-home\)\s*\{[\s\S]*?background:\s*#071a38/);
  assert.match(cssSource, /body:has\(\.city-adventure-home\) \.mobile-app\s*\{[\s\S]*?height:\s*100dvh[\s\S]*?min-height:\s*100dvh/);
  assert.match(cssSource, /\.city-adventure-home\s*\{[\s\S]*?height:\s*100dvh[\s\S]*?min-height:\s*100dvh[\s\S]*?max-height:\s*100dvh/);
  assert.doesNotMatch(cssSource, /height:\s*min\(100dvh,\s*853px\)/);
  assert.doesNotMatch(cssSource, /max-height:\s*853px/);
  assert.match(cssSource, /body:has\(\.city-adventure-home\) \.mobile-app\s*\{[\s\S]*?border-radius:\s*clamp\(0px,\s*4vw,\s*24px\)/);
  assert.match(cssSource, /\.ca-top-actions\s*\{[\s\S]*?top:\s*calc\(env\(safe-area-inset-top\) \+ clamp\(14px,\s*3\.8vw,\s*22px\)\)/);
  assert.match(cssSource, /\.ca-action-icon\s*\{[\s\S]*?width:\s*clamp\(40px,\s*10\.5vw,\s*52px\)[\s\S]*?height:\s*clamp\(40px,\s*10\.5vw,\s*52px\)/);
  assert.match(cssSource, /\.ca-left-stack\s*\{[\s\S]*?width:\s*27\.5%/);
  assert.match(cssSource, /\.ca-side-card strong\s*\{[\s\S]*?font-size:\s*clamp\(13px,\s*3\.6vw,\s*18px\)/);
  assert.match(cssSource, /\.ca-start-button,[\s\S]*?\.ca-guest-button\s*\{[\s\S]*?filter:\s*drop-shadow\(0 0 18px rgba\(86,\s*235,\s*255,\s*0\.62\)\)/);
});

test("city adventure home breathes on short in-app browser viewports", () => {
  assert.match(cssSource, /@media \(max-height:\s*740px\)/);
  assert.match(cssSource, /@media \(max-height:\s*740px\)[\s\S]*?\.ca-action-icon\s*\{[\s\S]*?width:\s*clamp\(34px,\s*8\.8vw,\s*42px\)[\s\S]*?height:\s*clamp\(34px,\s*8\.8vw,\s*42px\)/);
  assert.match(cssSource, /@media \(max-height:\s*740px\)[\s\S]*?\.ca-title-block h1\s*\{[\s\S]*?width:\s*88%/);
  assert.match(cssSource, /@media \(max-height:\s*740px\)[\s\S]*?\.ca-left-stack\s*\{[\s\S]*?top:\s*38\.4%/);
  assert.match(cssSource, /@media \(max-height:\s*740px\)[\s\S]*?\.ca-right-tasks\s*\{[\s\S]*?top:\s*39%[\s\S]*?height:\s*27\.5%/);
  assert.match(cssSource, /@media \(max-height:\s*740px\)[\s\S]*?\.ca-quick-actions\s*\{[\s\S]*?z-index:\s*8/);
  assert.match(cssSource, /@media \(max-height:\s*740px\)[\s\S]*?\.ca-bottom-panel\s*\{[\s\S]*?left:\s*9\.5%[\s\S]*?right:\s*9\.5%/);
  assert.match(cssSource, /@media \(max-height:\s*740px\)[\s\S]*?\.ca-start-button\s*\{[\s\S]*?min-height:\s*clamp\(48px,\s*11\.5vw,\s*58px\)/);
});
