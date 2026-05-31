import { strict as assert } from "node:assert";
import test from "node:test";
import {
  advanceExpandedSession,
  completeOverlayMarker,
  createExpandedSession,
  selectPlayerRole
} from "../src/lib/expanded-session";
import { createMockExpandedStory } from "../src/lib/deepseek-director";
import { selectExpandedRole } from "../src/lib/session-store";
import type { GeoContext, RuntimeContext, StoryModule } from "../src/lib/types";

const geo: GeoContext = {
  lat: 31.2304,
  lng: 121.4737,
  accuracy: 30,
  landmarkName: "街角咖啡馆",
  placeType: "咖啡馆 / 老街",
  nearbyDetails: "门口有雨棚、旧路牌和一排梧桐树"
};

const context: RuntimeContext = {
  preference: "治愈",
  weather: "小雨",
  timeOfDay: "下午",
  city: "上海",
  geo
};

const modules: StoryModule[] = [];

test("expanded session starts with characters, evidence, and no final truth in first scene", () => {
  const story = createMockExpandedStory({ ...context, modules });
  const session = createExpandedSession(story, context);

  assert.equal(session.currentNodeIndex, 0);
  assert.equal(session.selectedRoleId, undefined);
  assert.deepEqual(session.knownEvidenceIds, []);
  assert.ok(session.story.characters.length >= 3);
  assert.ok(session.story.evidence.length >= 5);
  assert.ok(!session.currentScene.sceneText.includes(session.story.truthSummary));
});

test("selecting a player role unlocks the first scene and starting clues", () => {
  const story = createMockExpandedStory({ ...context, modules });
  const session = createExpandedSession(story, context);
  const role = story.playerRoles[0];
  const output = selectPlayerRole(session, role.id);

  assert.equal(output.session.selectedRoleId, role.id);
  assert.equal(output.session.story.selectedRoleId, role.id);
  assert.ok(output.session.knownEvidenceIds.includes(role.startingClueIds[0]));
  assert.match(output.scene_text, new RegExp(role.roleTitle));
  assert.equal(output.next_action, "take_photo");
});

test("selecting a role can recover from a client-held session snapshot after dev memory resets", () => {
  const story = createMockExpandedStory({ ...context, modules });
  const session = createExpandedSession(story, context);
  const role = story.playerRoles[1];
  const output = selectExpandedRole({
    sessionId: "missing-after-dev-reload",
    roleId: role.id,
    sessionSnapshot: session
  });

  assert.ok(output);
  assert.equal(output.session.id, session.id);
  assert.equal(output.session.selectedRoleId, role.id);
  assert.equal(output.next_action, "take_photo");
});

test("selected player role changes the station perspective text", () => {
  const story = createMockExpandedStory({ ...context, modules });
  const archivistSession = createExpandedSession(story, context);
  const friendSession = createExpandedSession(createMockExpandedStory({ ...context, modules }), context);

  const archivist = selectPlayerRole(archivistSession, "role-1");
  const friend = selectPlayerRole(friendSession, "role-2");

  assert.notEqual(archivist.npc_message, friend.npc_message);
  assert.match(archivist.scene_text, /公开任务/);
  assert.match(archivist.scene_text, /矛盾点/);
  assert.match(friend.npc_message, /身份视角/);
});

test("text answers give hints but do not advance during normal photo-first play", () => {
  const story = createMockExpandedStory({ ...context, modules });
  const session = createExpandedSession(story, context);
  const selected = selectPlayerRole(session, story.playerRoles[0].id).session;
  const firstNode = session.story.nodes[0];

  const wrong = advanceExpandedSession(selected, { answer: "完全不知道", locationDistanceMeters: 10 });
  assert.equal(wrong.session.currentNodeIndex, 0);
  assert.equal(wrong.session.hintLevel, 1);
  assert.equal(wrong.next_action, "ask_player_answer");

  const right = advanceExpandedSession(wrong.session, { answer: firstNode.answerKeywords[0], locationDistanceMeters: 10 });
  assert.equal(right.session.currentNodeIndex, 0);
  assert.equal(right.next_action, "take_photo");
  assert.equal(right.fallback_available, false);
  assert.match(right.reason ?? "", /拍照/);
});

test("correct text answer can advance only as a safety fallback", () => {
  const story = createMockExpandedStory({ ...context, modules });
  const session = createExpandedSession(story, context);
  const selected = selectPlayerRole(session, story.playerRoles[0].id).session;
  const firstNode = session.story.nodes[0];

  const fallback = advanceExpandedSession(selected, {
    answer: firstNode.answerKeywords[0],
    locationDistanceMeters: 800
  });

  assert.equal(fallback.session.currentNodeIndex, 1);
  assert.equal(fallback.next_action, "go_next_location");
  assert.equal(fallback.fallback_available, true);
  assert.match(fallback.scene_text, new RegExp(fallback.session.story.nodes[1].locationName));
});

test("clicking a main photo marker advances while hidden marker only unlocks a clue", () => {
  const story = createMockExpandedStory({ ...context, modules });
  const session = selectPlayerRole(createExpandedSession(story, context), story.playerRoles[0].id).session;
  const firstNode = session.currentScene;

  const hidden = completeOverlayMarker(session, {
    nodeId: firstNode.id,
    markerId: "hidden-1",
    markerType: "hidden",
    clueText: "雨棚背面有一行被贴纸遮住的小字。"
  });
  assert.equal(hidden.session.currentNodeIndex, 0);
  assert.equal(hidden.next_action, "take_photo");
  assert.ok(hidden.session.photoDiscoveries.some((item) => item.markerId === "hidden-1"));

  const main = completeOverlayMarker(hidden.session, {
    nodeId: firstNode.id,
    markerId: "main-1",
    markerType: "main",
    clueText: "旧路牌上的箭头和手机路线不一致。"
  });
  assert.equal(main.session.currentNodeIndex, 1);
  assert.equal(main.next_action, "go_next_location");
  assert.match(main.reason ?? "", /旧路牌上的箭头/);
  assert.match(main.scene_text, new RegExp(story.nodes[1].locationName));
  assert.ok(main.session.completedMainMarkers.includes(firstNode.id));
});

test("photo-first completion earns the primary ending even without text answers", () => {
  const story = createMockExpandedStory({ ...context, modules });
  let session = selectPlayerRole(createExpandedSession(story, context), story.playerRoles[0].id).session;
  let ending = null as ReturnType<typeof completeOverlayMarker> | null;

  for (const node of story.nodes) {
    ending = completeOverlayMarker(session, {
      nodeId: node.id,
      markerId: `main-${node.order}`,
      markerType: "main",
      clueText: `完成第 ${node.order} 站主线照片。`
    });
    session = ending.session;
  }

  assert.equal(session.completedMainMarkers.length, story.nodes.length);
  assert.equal(ending?.next_action, "show_ending");
  assert.match(ending?.scene_text ?? "", new RegExp(story.endingChoices[0]));
});
