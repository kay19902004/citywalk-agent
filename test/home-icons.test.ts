import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const componentSource = readFileSync(new URL("../src/pages/CityAdventureHome.tsx", import.meta.url), "utf8");

test("city adventure home uses bundled PNG and WebP assets instead of glyph icons", () => {
  for (const asset of [
    "icon_gift.png",
    "icon_bag.png",
    "icon_mail.png",
    "icon_map.png",
    "icon_compass.png",
    "icon_footprint.png",
    "icon_chest.png",
    "icon_weather_sun.png",
    "icon_star.png",
    "icon_book.png",
    "logo_city_adventure.webp",
    "bg_city_day.webp",
    "route_glow.webp"
  ]) {
    assert.match(componentSource, new RegExp(asset.replace(".", "\\.")));
  }

  assert.doesNotMatch(componentSource, /[⌂◇☀🎁🎒✉🧭]/);
  assert.doesNotMatch(componentSource, /https?:\/\//);
});
