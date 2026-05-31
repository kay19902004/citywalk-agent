import { strict as assert } from "node:assert";
import test from "node:test";
import { createMockExpandedStory } from "../src/lib/deepseek-director";
import { evaluateStoryQuality, selectRewriteTarget } from "../src/lib/story-quality";
import type { GeoContext, StoryModule } from "../src/lib/types";

const geo: GeoContext = {
  landmarkName: "武康路旧书店门口",
  placeType: "老街 / 书店 / 咖啡馆",
  nearbyDetails: "附近有梧桐树、旧式居民楼、街角咖啡馆和一座小花园"
};

const modules: StoryModule[] = [{
  id: "nav-1",
  module_type: "plot_seed",
  title: "导航异常",
  summary: "导航把玩家带进重复路线。",
  source_path: "荔枝汽水水作品集/恐怖导航.txt",
  genres: ["都市怪谈", "轻推理"],
  emotions: ["紧张", "好奇"],
  location_tags: ["商场", "地铁站"],
  requires: ["异常路线"],
  produces: ["偏航原因"],
  forbidden: ["复用原文桥段"],
  hardness: "hard",
  facets: {
    motifs: ["导航异常"],
    conflicts: ["路线失控"],
    clueInterfaces: ["异常导航"],
    sceneFunctions: ["路线偏移/系统提示"]
  }
}];

function baseStory() {
  const story = createMockExpandedStory({
    preference: "都市奇遇",
    weather: "晴",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });
  story.inspirationTrace = { sources: ["sample"], tags: ["迟到的信", "邮戳", "轻推理"], mode: "轻灵感" };
  return story;
}

test("strong story passes local quality gate", () => {
  const report = evaluateStoryQuality(baseStory());

  assert.equal(report.passed, true);
  assert.ok(report.score >= 70);
  assert.equal(selectRewriteTarget(report), null);
});

test("unsupported repeated letter motifs are flagged", () => {
  const story = baseStory();
  story.inspirationTrace = { sources: ["恐怖导航"], tags: ["导航异常", "路线失控"], mode: "轻灵感" };
  story.title = "旧书店邮戳之谜";
  story.premise = "一封信、一枚邮戳和旧书店老板让路线变得可疑。";
  story.nodes = story.nodes.map((node) => ({
    ...node,
    sceneText: `${node.sceneText} 信件、邮戳和旧书店反复出现。`,
    discovery: "新的邮戳线索出现。"
  }));

  const report = evaluateStoryQuality(story);

  assert.equal(report.passed, false);
  assert.ok(report.issues.some((issue) => issue.code === "unsupported_repeated_motif"));
});

test("weak contradiction chain targets the affected node", () => {
  const story = baseStory();
  story.nodes[2] = {
    ...story.nodes[2],
    contradiction: {
      claim: "有人说这不重要。",
      evidenceId: "missing-ev",
      reasoning: "这很奇怪。"
    }
  };

  const report = evaluateStoryQuality(story);
  const target = selectRewriteTarget(report);

  assert.equal(report.passed, false);
  assert.ok(report.issues.some((issue) => issue.code === "weak_contradiction" && issue.target === story.nodes[2].id));
  assert.deepEqual(target, { kind: "nodes", nodeIds: [story.nodes[2].id] });
});

test("similar role perspectives and weak ending are flagged", () => {
  const story = baseStory();
  story.nodes[0].rolePerspectives = {
    "role-1": "这里说明了同一件事。",
    "role-2": "这里说明了同一件事。",
    "role-3": "这里说明了同一件事。"
  };
  story.truthSummary = "真相就是路线结束了。";
  story.endingChoices = ["结束", "离开"];

  const report = evaluateStoryQuality(story);

  assert.equal(report.passed, false);
  assert.ok(report.issues.some((issue) => issue.code === "similar_role_perspectives"));
  assert.ok(report.issues.some((issue) => issue.code === "weak_ending_recovery"));
});
