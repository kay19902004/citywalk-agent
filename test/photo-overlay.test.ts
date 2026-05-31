import { strict as assert } from "node:assert";
import test from "node:test";
import { createMockExpandedStory } from "../src/lib/deepseek-director";
import { normalizePhotoOverlay } from "../src/lib/photo-overlay";
import { analyzePhotoForOverlay } from "../src/lib/qwen-vision";
import { createExpandedSession, selectPlayerRole } from "../src/lib/expanded-session";

test("normalizes model photo overlay output into bounded game HUD markers", () => {
  const overlay = normalizePhotoOverlay({
    nodeId: "node-1",
    imageSummary: "照片里有咖啡馆门口、旧路牌和雨棚。",
    mainTask: "核对旧路牌箭头",
    hiddenTask: "寻找雨棚背面的贴纸",
    markers: [
      {
        id: "main-1",
        type: "main",
        label: "主线任务",
        x: 1.4,
        y: -0.2,
        clueText: "旧路牌上的箭头和手机路线不一致。",
        actionLabel: "查看路牌"
      },
      {
        id: "hidden-1",
        type: "hidden",
        label: "隐藏任务",
        x: 0.42,
        y: 0.68,
        clueText: "雨棚背面有一行被贴纸遮住的小字。",
        actionLabel: "检查贴纸"
      },
      {
        id: "unsafe-1",
        type: "hidden",
        label: "危险任务",
        x: 0.5,
        y: 0.5,
        clueText: "请进入私人住宅拍摄门牌。",
        actionLabel: "进入住宅"
      }
    ],
    arrows: [{ fromX: 0.3, fromY: 0.8, toX: 1.8, toY: 0.2, label: "沿箭头看向路牌" }]
  }, {
    nodeId: "node-1",
    fallbackMainTask: "观察当前位置",
    fallbackHiddenTask: "寻找可选细节"
  });

  assert.equal(overlay.nodeId, "node-1");
  assert.equal(overlay.markers.length, 2);
  assert.ok(overlay.markers.some((marker) => marker.type === "main"));
  assert.ok(overlay.markers.every((marker) => marker.x >= 0 && marker.x <= 1));
  assert.ok(overlay.markers.every((marker) => marker.y >= 0 && marker.y <= 1));
  assert.ok(!overlay.markers.some((marker) => marker.id === "unsafe-1"));
  assert.equal(overlay.arrows[0].toX, 1);
});

test("normalizes qwen mark and hotspot aliases into HUD markers", () => {
  const overlay = normalizePhotoOverlay({
    nodeId: "node-2",
    hotspots: [
      {
        id: "main-hotspot",
        type: "main",
        label: "MAIN QUEST",
        x: 0.25,
        y: 0.4,
        clueText: "门口导视牌可以作为主线锚点。",
        actionLabel: "记录导视牌"
      }
    ],
    arrows: []
  }, {
    nodeId: "node-2",
    fallbackMainTask: "拍摄公共导视信息",
    fallbackHiddenTask: "寻找公共边角细节"
  });

  assert.equal(overlay.markers[0].id, "main-hotspot");
  assert.equal(overlay.markers[0].label, "MAIN QUEST");
});

test("qwen vision analyzer returns playable fallback overlay when api key is absent", async () => {
  const originalKey = process.env.DASHSCOPE_API_KEY;
  delete process.env.DASHSCOPE_API_KEY;
  try {
    const story = createMockExpandedStory({
      preference: "都市奇遇",
      weather: "晴",
      timeOfDay: "下午",
      city: "上海",
      modules: [],
      geo: {
        landmarkName: "街角咖啡馆",
        placeType: "咖啡馆 / 老街",
        nearbyDetails: "门口有路牌和橱窗"
      }
    });
    const session = selectPlayerRole(createExpandedSession(story, {
      preference: "都市奇遇",
      weather: "晴",
      timeOfDay: "下午",
      city: "上海",
      geo: {
        landmarkName: "街角咖啡馆",
        placeType: "咖啡馆 / 老街",
        nearbyDetails: "门口有路牌和橱窗"
      }
    }), story.playerRoles[0].id).session;

    const overlay = await analyzePhotoForOverlay({
      session,
      nodeId: session.currentScene.id,
      imageBase64: "data:image/jpeg;base64,AAAA"
    });

    assert.equal(overlay.nodeId, session.currentScene.id);
    assert.ok(overlay.markers.some((marker) => marker.type === "main"));
    assert.ok(overlay.markers.some((marker) => marker.type === "hidden"));
    assert.match(overlay.imageSummary, /现场信号有点弱/);
  } finally {
    if (originalKey) process.env.DASHSCOPE_API_KEY = originalKey;
  }
});
