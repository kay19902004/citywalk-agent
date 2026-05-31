import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const envExample = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
const amapSource = readFileSync(new URL("../src/lib/amap.ts", import.meta.url), "utf8");
const routeSource = readFileSync(new URL("../src/app/api/location/context/route.ts", import.meta.url), "utf8");
const appClientSource = readFileSync(new URL("../src/app/app-client.tsx", import.meta.url), "utf8");

test("amap local development env keeps web service key server side", () => {
  assert.match(envExample, /NEXT_PUBLIC_AMAP_JS_KEY=/);
  assert.match(envExample, /NEXT_PUBLIC_AMAP_SECURITY_CODE=/);
  assert.match(envExample, /AMAP_WEB_SERVICE_KEY=/);
  assert.match(amapSource, /process\.env\.AMAP_WEB_SERVICE_KEY/);
  assert.doesNotMatch(appClientSource, /AMAP_WEB_SERVICE_KEY/);
});

test("location context endpoint enriches GPS with AMap nearby places", () => {
  assert.match(routeSource, /enrichGeoContextWithAmap/);
  assert.match(routeSource, /places:\s*amapContext\.places/);
  assert.match(routeSource, /geo:\s*amapContext\.geo/);
  assert.match(routeSource, /city:\s*amapContext\.city/);
  assert.match(amapSource, /\/geocode\/regeo/);
  assert.match(amapSource, /\/place\/around/);
  assert.match(amapSource, /sortrule:\s*"distance"/);
  assert.match(amapSource, /function deriveCity/);
  assert.match(amapSource, /province\?:\s*string/);
});

test("GPS helper applies enriched AMap geo back into the app state", () => {
  assert.match(appClientSource, /postJson<\{/);
  assert.match(appClientSource, /city\?:\s*string;/);
  assert.match(appClientSource, /geo\?:\s*GeoContext;/);
  assert.match(appClientSource, /payload\?\.geo/);
  assert.match(appClientSource, /updateGeo\(\(current\) => \(\{ \.\.\.current, \.\.\.payload\.geo \}\)\)/);
  assert.match(appClientSource, /if \(payload\?\.city\) \{\s*setCity\(payload\.city\);/);
});
