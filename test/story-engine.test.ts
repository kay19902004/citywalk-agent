import { strict as assert } from "node:assert";
import test from "node:test";
import {
  advanceSession,
  composeStory,
  createSession,
  evaluateSafety,
  seedModules,
  seedLocations,
  storyTemplates
} from "../src/lib/story-engine";

test("composes a 4-stop citywalk story with coherent node outputs", () => {
  const story = composeStory({
    preference: "治愈",
    weather: "雨",
    timeOfDay: "下午",
    availableModules: seedModules,
    availableLocations: seedLocations,
    templates: storyTemplates
  });

  assert.equal(story.nodes.length, 4);
  assert.ok(story.title.length > 0);
  assert.equal(story.safety_status, "safe");
  assert.ok(story.nodes.every((node) => node.fixed_clue.length > 0));
  assert.ok(story.nodes.every((node) => node.fallback.length > 0));
  assert.ok(story.nodes.at(-1)?.core_function.includes("结局"));
});

test("advances session with hints and never reveals final truth early", () => {
  const session = createSession({
    preference: "轻推理",
    weather: "晴",
    timeOfDay: "傍晚",
    availableModules: seedModules,
    availableLocations: seedLocations,
    templates: storyTemplates
  });

  const first = advanceSession(session, { answer: "不知道", locationDistanceMeters: 15 });

  assert.equal(first.next_action, "ask_player_answer");
  assert.equal(first.safety_status, "safe");
  assert.ok(first.new_clues.length >= 1);
  assert.ok(!first.scene_text.includes(session.story.truth_summary));
  assert.equal(session.hintLevel, 1);
});

test("returns the next station scene immediately after a correct answer", () => {
  const session = createSession({
    preference: "治愈",
    weather: "晴",
    timeOfDay: "下午",
    availableModules: seedModules,
    availableLocations: seedLocations,
    templates: storyTemplates
  });
  const firstNode = session.story.nodes[0];
  const secondNode = session.story.nodes[1];

  const output = advanceSession(session, {
    answer: firstNode.answer_keywords[0],
    locationDistanceMeters: 10
  });

  assert.equal(session.currentNodeIndex, 1);
  assert.match(output.scene_text, new RegExp(secondNode.location.name));
  assert.doesNotMatch(output.scene_text, new RegExp(`第 ${firstNode.order} 站`));
});

test("switches to fallback when context is unsafe", () => {
  const safety = evaluateSafety({
    timeOfDay: "深夜",
    weather: "暴雨",
    locationDistanceMeters: 900,
    locationSafety: "normal"
  });

  assert.equal(safety.status, "fallback");
  assert.match(safety.reason, /线上替代线索/);
});
