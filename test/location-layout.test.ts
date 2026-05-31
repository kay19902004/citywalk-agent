import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { readCssWithImports } from "./helpers/css-source";

const pageSource = readFileSync(new URL("../src/app/location/page.tsx", import.meta.url), "utf8");
const cssSource = readCssWithImports(new URL("../src/app/globals.css", import.meta.url));

test("location page is a compact manual-first place dialog with optional GPS", () => {
  assert.match(pageSource, /role="dialog"/);
  assert.match(pageSource, /选择出发地点/);
  assert.match(pageSource, /手动填写最稳/);
  assert.match(pageSource, /value=\{app\.city/);
  assert.match(pageSource, /onChange=\{\(event\) => app\.setCity\(event\.target\.value\)\}/);
  assert.match(pageSource, /value=\{app\.geo\.landmarkName/);
  assert.match(pageSource, /value=\{app\.geo\.placeType/);
  assert.match(pageSource, /value=\{app\.geo\.nearbyDetails/);
  assert.match(pageSource, /onClick=\{app\.requestGps\}/);
  assert.match(pageSource, /GPS 辅助/);
  assert.doesNotMatch(pageSource, /系统检测/);
  assert.doesNotMatch(pageSource, /校准精度/);
  assert.doesNotMatch(pageSource, /SafetyNote/);

  assert.match(cssSource, /\.location-modal-page/);
  assert.match(cssSource, /\.location-modal-card[\s\S]{0,240}max-height:\s*min\(calc\(100dvh - 32px\),\s*640px\)/);
  assert.match(cssSource, /\.location-modal-form/);
});
