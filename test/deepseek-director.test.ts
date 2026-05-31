import { strict as assert } from "node:assert";
import test from "node:test";
import {
  createMockExpandedStory,
  containsUnsafeInstruction,
  createExpandedStoryWithDirector,
  parseDirectorJson
} from "../src/lib/deepseek-director";
import { getIdentityProfile } from "../src/lib/identity-profile";
import type { GeoContext, StoryModule } from "../src/lib/types";

const geo: GeoContext = {
  lat: 31.2304,
  lng: 121.4737,
  accuracy: 25,
  landmarkName: "武康路旧书店门口",
  placeType: "老街 / 书店 / 咖啡馆",
  nearbyDetails: "附近有梧桐树、旧式居民楼、街角咖啡馆和一座小花园"
};

const modules: StoryModule[] = [
  {
    id: "module-1",
    module_type: "plot_seed",
    title: "迟到的信",
    summary: "抽象素材：围绕迟到的信，适合在书店、咖啡馆展开怀旧互动。",
    source_path: "sample.txt",
    genres: ["治愈", "轻推理"],
    emotions: ["怀旧", "遗憾"],
    location_tags: ["书店", "咖啡馆"],
    requires: ["玩家身份", "明确任务"],
    produces: ["地址线索", "见证者"],
    forbidden: ["复用长段原文", "引导危险行动"],
    hardness: "hard"
  }
];

test("mock director creates a rich 5-node story grounded in geo context", () => {
  const story = createMockExpandedStory({
    preference: "治愈",
    weather: "小雨",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });

  assert.equal(story.nodes.length, 5);
  assert.ok(story.characters.length >= 3);
  assert.ok(story.evidence.length >= 5);
  assert.ok(story.nodes.filter((node) => `${node.locationTieIn}${node.sceneText}`.includes("武康路旧书店门口")).length >= 2);
  assert.ok(story.nodes.every((node) => node.npcMessage.length > 20));
});

test("director creates dossier and three distinct player role cards", () => {
  const story = createMockExpandedStory({
    preference: "失踪旧案",
    weather: "小雨",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });

  assert.ok(story.dossier.background.length >= 120);
  assert.ok(story.dossier.knownFacts.length >= 3);
  assert.ok(story.dossier.openQuestions.length >= 2);
  assert.equal(story.playerRoles.length, 3);
  assert.equal(new Set(story.playerRoles.map((role) => role.roleTitle)).size, 3);
  assert.ok(story.playerRoles.every((role) => role.privateGoal.length >= 8));
});

test("director creates a city adventure opening and route teaser", () => {
  const story = createMockExpandedStory({
    preference: "都市奇遇",
    weather: "小雨",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });

  assert.ok(story.adventureType.length >= 2);
  assert.ok(story.openingPremise.length >= 300);
  assert.equal(story.routeTeaser.length, 5);
  assert.ok(story.routeTeaser.every((item, index) => item.order === index + 1));
  assert.ok(story.routeTeaser.every((item) => item.locationName.length >= 2 && item.teaser.length >= 16));
  assert.ok(story.nodes.every((node) => node.mainTask.length >= 8));
  assert.ok(story.nodes.every((node) => node.hiddenTask.length >= 8));
  assert.ok(story.nodes.every((node) => node.photoPrompt.length >= 8));
});

test("director creates testimony contradictions and role perspectives for every node", () => {
  const story = createMockExpandedStory({
    preference: "轻推理",
    weather: "小雨",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });

  assert.ok(story.characters.every((character) => character.testimony.length >= 12));
  assert.ok(story.characters.every((character) => character.contradictionHint.length >= 8));
  assert.ok(story.nodes.every((node) => node.publicTask.length >= 8));
  assert.ok(story.nodes.every((node) => node.contradiction.claim.length >= 8));
  assert.ok(story.nodes.every((node) => node.contradiction.evidenceId.length > 0));
  assert.ok(story.nodes.every((node) => node.contradiction.reasoning.length >= 16));
  assert.ok(story.nodes.every((node) => Object.keys(node.rolePerspectives).length === 3));
  assert.ok(story.nodes.every((node) => Object.values(node.rolePerspectives).every((text) => text.length >= 12)));
});

test("director throws a user-visible error when model output is invalid", async () => {
  await assert.rejects(createExpandedStoryWithDirector({
    context: {
      preference: "轻推理",
      weather: "晴",
      timeOfDay: "傍晚",
      city: "上海",
      geo
    },
    modules,
    callModel: async () => "{\"bad\":true}"
  }), /DeepSeek 生成失败/);
});

test("director retries once when DeepSeek returns truncated JSON", async () => {
  const calls: string[] = [];
  const mockStory = createMockExpandedStory({
    preference: "寻宝",
    weather: "晴",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });

  const story = await createExpandedStoryWithDirector({
    context: {
      preference: "寻宝",
      weather: "晴",
      timeOfDay: "下午",
      city: "上海",
      geo
    },
    modules,
    callModel: async (prompt) => {
      calls.push(prompt);
      if (calls.length === 1) return `{"title":"${mockStory.title}","openingPremise":"写到一半`;
      if (calls.length === 2) {
        return JSON.stringify({
          id: mockStory.id,
          title: mockStory.title,
          playerRole: mockStory.playerRole,
          premise: mockStory.premise,
          adventureType: mockStory.adventureType,
          openingPremise: mockStory.openingPremise,
          routeTeaser: mockStory.routeTeaser,
          dossier: mockStory.dossier,
          playerRoles: mockStory.playerRoles,
          characters: mockStory.characters,
          truthSummary: mockStory.truthSummary,
          endingChoices: mockStory.endingChoices,
          complianceNote: mockStory.complianceNote,
          generatedBy: "deepseek"
        });
      }
      return JSON.stringify({
        evidence: mockStory.evidence,
        timeline: mockStory.timeline,
        nodes: mockStory.nodes
      });
    }
  });

  assert.equal(calls.length, 3);
  assert.match(calls[1], /上一次输出不是完整JSON/);
  assert.equal(story.nodes.length, 5);
});

test("director splits generation into dossier first and stations second", async () => {
  const calls: string[] = [];
  const mockStory = createMockExpandedStory({
    preference: "治愈",
    weather: "小雨",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });

  const story = await createExpandedStoryWithDirector({
    context: {
      preference: "治愈",
      weather: "小雨",
      timeOfDay: "下午",
      city: "上海",
      geo
    },
    modules,
    callModel: async (prompt) => {
      calls.push(prompt);
      if (calls.length === 1) {
        return JSON.stringify({
          id: mockStory.id,
          title: mockStory.title,
          playerRole: mockStory.playerRole,
          premise: mockStory.premise,
          adventureType: mockStory.adventureType,
          openingPremise: mockStory.openingPremise,
          routeTeaser: mockStory.routeTeaser,
          dossier: mockStory.dossier,
          playerRoles: mockStory.playerRoles,
          characters: mockStory.characters,
          truthSummary: mockStory.truthSummary,
          endingChoices: mockStory.endingChoices,
          complianceNote: mockStory.complianceNote,
          generatedBy: "deepseek"
        });
      }
      return JSON.stringify({
        evidence: mockStory.evidence,
        timeline: mockStory.timeline,
        nodes: mockStory.nodes
      });
    }
  });

  assert.equal(calls.length, 2);
  assert.match(calls[0], /第一步/);
  assert.doesNotMatch(calls[0], /nodes必须正好5个/);
  assert.match(calls[1], /第二步/);
  assert.match(calls[1], new RegExp(mockStory.dossier.caseFileId));
  assert.equal(story.nodes.length, 5);
  assert.equal(story.playerRoles.length, 3);
});

test("director normalizes object ending choices and missing generatedBy from base step", async () => {
  const mockStory = createMockExpandedStory({
    preference: "都市奇遇",
    weather: "晴",
    timeOfDay: "傍晚",
    city: "上海",
    geo,
    modules
  });

  const story = await createExpandedStoryWithDirector({
    context: {
      preference: "都市奇遇",
      weather: "晴",
      timeOfDay: "傍晚",
      city: "上海",
      geo
    },
    modules,
    callModel: async (prompt) => {
      if (prompt.includes("第一步")) {
        return JSON.stringify({
          id: mockStory.id,
          title: mockStory.title,
          playerRole: mockStory.playerRole,
          premise: mockStory.premise,
          adventureType: mockStory.adventureType,
          openingPremise: mockStory.openingPremise,
          routeTeaser: mockStory.routeTeaser,
          dossier: mockStory.dossier,
          playerRoles: mockStory.playerRoles,
          characters: mockStory.characters,
          truthSummary: mockStory.truthSummary,
          endingChoices: [
            { title: "公开真相", effect: "让档案进入公共记录" },
            { title: "保留秘密", effect: "只把线索交给当事人" }
          ],
          complianceNote: mockStory.complianceNote
        });
      }
      return JSON.stringify({
        evidence: mockStory.evidence,
        timeline: mockStory.timeline,
        nodes: mockStory.nodes
      });
    }
  });

  assert.deepEqual(story.endingChoices, ["公开真相", "保留秘密"]);
  assert.equal(story.generatedBy, "deepseek");
});

test("director normalizes nonstandard generatedBy values from DeepSeek", async () => {
  const mockStory = createMockExpandedStory({
    preference: "轻推理",
    weather: "阴",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });

  const story = await createExpandedStoryWithDirector({
    context: {
      preference: "轻推理",
      weather: "阴",
      timeOfDay: "下午",
      city: "上海",
      geo
    },
    modules,
    callModel: async (prompt) => {
      if (prompt.includes("第一步")) {
        return JSON.stringify({
          id: mockStory.id,
          title: mockStory.title,
          playerRole: mockStory.playerRole,
          premise: mockStory.premise,
          adventureType: mockStory.adventureType,
          openingPremise: mockStory.openingPremise,
          routeTeaser: mockStory.routeTeaser,
          dossier: mockStory.dossier,
          playerRoles: mockStory.playerRoles,
          characters: mockStory.characters,
          truthSummary: mockStory.truthSummary,
          endingChoices: mockStory.endingChoices,
          complianceNote: mockStory.complianceNote,
          generatedBy: "DeepSeek-V4"
        });
      }
      return JSON.stringify({
        evidence: mockStory.evidence,
        timeline: mockStory.timeline,
        nodes: mockStory.nodes
      });
    }
  });

  assert.equal(story.generatedBy, "deepseek");
});

test("director normalizes short role card fields from base step", async () => {
  const mockStory = createMockExpandedStory({
    preference: "轻推理",
    weather: "小雨",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });

  const shortRoles = mockStory.playerRoles.map((role, index) => index === 2
    ? {
        ...role,
        bio: "亲属",
        relationshipToCase: "有关",
        knownSecret: "知道",
        privateGoal: "查明",
        voiceStyle: "急",
        riskNote: "无"
      }
    : role);

  const story = await createExpandedStoryWithDirector({
    context: {
      preference: "轻推理",
      weather: "小雨",
      timeOfDay: "下午",
      city: "上海",
      geo
    },
    modules,
    callModel: async (prompt) => {
      if (prompt.includes("第一步")) {
        return JSON.stringify({
          id: mockStory.id,
          title: mockStory.title,
          playerRole: mockStory.playerRole,
          premise: mockStory.premise,
          dossier: mockStory.dossier,
          playerRoles: shortRoles,
          characters: mockStory.characters,
          truthSummary: mockStory.truthSummary,
          endingChoices: mockStory.endingChoices,
          complianceNote: mockStory.complianceNote,
          generatedBy: "deepseek"
        });
      }
      return JSON.stringify({
        evidence: mockStory.evidence,
        timeline: mockStory.timeline,
        nodes: mockStory.nodes
      });
    }
  });

  assert.ok(story.playerRoles.every((role) => role.bio.length >= 20));
  assert.ok(story.playerRoles.every((role) => role.relationshipToCase.length >= 8));
  assert.ok(story.playerRoles.every((role) => role.knownSecret.length >= 8));
  assert.ok(story.playerRoles.every((role) => role.privateGoal.length >= 8));
  assert.ok(story.playerRoles.every((role) => role.voiceStyle.length >= 4));
  assert.ok(story.playerRoles.every((role) => role.riskNote.length >= 6));
});

test("director normalizes short character testimony fields from base step", async () => {
  const mockStory = createMockExpandedStory({
    preference: "轻推理",
    weather: "小雨",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });

  const story = await createExpandedStoryWithDirector({
    context: {
      preference: "轻推理",
      weather: "小雨",
      timeOfDay: "下午",
      city: "上海",
      geo
    },
    modules,
    callModel: async (prompt) => {
      if (prompt.includes("第一步")) {
        return JSON.stringify({
          id: mockStory.id,
          title: mockStory.title,
          playerRole: mockStory.playerRole,
          premise: mockStory.premise,
          adventureType: mockStory.adventureType,
          openingPremise: mockStory.openingPremise,
          routeTeaser: mockStory.routeTeaser,
          dossier: mockStory.dossier,
          playerRoles: mockStory.playerRoles,
          characters: mockStory.characters.map((character, index) => index === 0 ? {
            ...character,
            publicInfo: "短",
            secretHint: "短",
            testimony: "知道",
            contradictionHint: "少"
          } : character),
          truthSummary: mockStory.truthSummary,
          endingChoices: mockStory.endingChoices,
          complianceNote: mockStory.complianceNote,
          generatedBy: "deepseek"
        });
      }
      return JSON.stringify({
        evidence: mockStory.evidence,
        timeline: mockStory.timeline,
        nodes: mockStory.nodes
      });
    }
  });

  assert.ok(story.characters.every((character) => character.publicInfo.length >= 8));
  assert.ok(story.characters.every((character) => character.secretHint.length >= 6));
  assert.ok(story.characters.every((character) => character.testimony.length >= 12));
  assert.ok(story.characters.every((character) => character.contradictionHint.length >= 8));
});

test("director normalizes fixable station plan shape drift before schema parsing", async () => {
  const mockStory = createMockExpandedStory({
    preference: "轻推理",
    weather: "小雨",
    timeOfDay: "傍晚",
    city: "上海",
    geo,
    modules
  });

  const story = await createExpandedStoryWithDirector({
    context: {
      preference: "轻推理",
      weather: "小雨",
      timeOfDay: "傍晚",
      city: "上海",
      geo
    },
    modules,
    callModel: async (prompt) => {
      if (prompt.includes("第一步")) {
        return JSON.stringify({
          id: mockStory.id,
          title: mockStory.title,
          playerRole: mockStory.playerRole,
          premise: mockStory.premise,
          adventureType: mockStory.adventureType,
          openingPremise: mockStory.openingPremise,
          routeTeaser: mockStory.routeTeaser,
          dossier: mockStory.dossier,
          playerRoles: mockStory.playerRoles,
          characters: mockStory.characters,
          truthSummary: mockStory.truthSummary,
          endingChoices: mockStory.endingChoices,
          complianceNote: mockStory.complianceNote,
          generatedBy: "deepseek"
        });
      }

      return JSON.stringify({
        evidence: mockStory.evidence.map((item, index) => ({
          ...item,
          kind: ["照片", "聊天记录", "现场观察", "口述", "其他"][index],
          unlocksAtNode: String(index + 1)
        })),
        timeline: mockStory.timeline,
        nodes: mockStory.nodes.map((item, index) => ({
          ...item,
          sceneText: index === 2 ? "太短" : index === 3 ? "短" : item.sceneText,
          suspectPressure: index === 1 ? { level: 2, reason: "证词正在失去可信度" } : index + 1,
          contradiction: {
            ...item.contradiction,
            evidenceId: `missing-${index + 1}`
          }
        }))
      });
    }
  });

  assert.equal(story.nodes.length, 5);
  assert.ok(story.evidence.every((item) => typeof item.unlocksAtNode === "number"));
  assert.ok(story.evidence.every((item) => ["物证", "证词", "记录", "地点观察"].includes(item.kind)));
  assert.ok(story.nodes.every((node) => typeof node.suspectPressure === "string"));
  assert.ok(story.nodes.every((node) => node.sceneText.length >= 50));
  assert.ok(story.nodes.every((node) => node.contradiction.evidenceId.startsWith("ev-")));
});

test("director replaces unsafe photo tasks with public observation fallbacks", async () => {
  const mockStory = createMockExpandedStory({
    preference: "轻推理",
    weather: "阴",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });

  const story = await createExpandedStoryWithDirector({
    context: {
      preference: "轻推理",
      weather: "阴",
      timeOfDay: "下午",
      city: "上海",
      geo
    },
    modules,
    callModel: async (prompt) => {
      if (prompt.includes("第一步")) {
        return JSON.stringify({
          id: mockStory.id,
          title: mockStory.title,
          playerRole: mockStory.playerRole,
          premise: mockStory.premise,
          adventureType: mockStory.adventureType,
          openingPremise: mockStory.openingPremise,
          routeTeaser: mockStory.routeTeaser,
          dossier: mockStory.dossier,
          playerRoles: mockStory.playerRoles,
          characters: mockStory.characters,
          truthSummary: mockStory.truthSummary,
          endingChoices: mockStory.endingChoices,
          complianceNote: mockStory.complianceNote,
          generatedBy: "deepseek"
        });
      }
      return JSON.stringify({
        evidence: mockStory.evidence,
        timeline: mockStory.timeline,
        nodes: mockStory.nodes.map((node) => ({
          ...node,
          publicTask: "检查信箱并拿走信封。",
          mainTask: "收集店内旧书签并询问老板。",
          hiddenTask: "拍摄陌生人的正脸并询问他住在哪里。",
          photoPrompt: "拍摄咖啡馆内部老照片墙。"
        }))
      });
    }
  });

  assert.ok(story.nodes.every((node) => node.photoPrompt.includes("公共")));
  assert.ok(story.nodes.every((node) => node.publicTask.includes("公共")));
  assert.ok(story.nodes.every((node) => node.mainTask.includes("公共")));
  assert.ok(story.nodes.every((node) => !containsUnsafeInstruction(`${node.publicTask}${node.mainTask}${node.hiddenTask}${node.photoPrompt}`)));
  assert.ok(story.nodes.every((node) => !/询问|收集|店内|内部|老板|陌生人/.test(`${node.publicTask}${node.mainTask}${node.hiddenTask}${node.photoPrompt}`)));
});

test("director allows unsafe vocabulary in narrative while keeping task fields safe", async () => {
  const mockStory = createMockExpandedStory({
    preference: "轻推理",
    weather: "阴",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });

  const story = await createExpandedStoryWithDirector({
    context: {
      preference: "轻推理",
      weather: "阴",
      timeOfDay: "下午",
      city: "上海",
      geo
    },
    modules,
    callModel: async (prompt) => {
      if (prompt.includes("第一步")) {
        return JSON.stringify({
          ...mockStory,
          premise: "旧案里曾有人提到拍摄陌生人和进入私人住宅，但这只是被系统排除的历史风险。",
          truthSummary: "真相不需要玩家接触任何危险行动，也不会要求进入私人住宅。",
          generatedBy: "deepseek"
        });
      }
      return JSON.stringify({
        evidence: mockStory.evidence,
        timeline: mockStory.timeline,
        nodes: mockStory.nodes.map((node) => ({
          ...node,
          sceneText: `${node.sceneText} 旧传闻里有人提过拍摄陌生人，但本轮行动只看公共招牌。`,
          publicTask: `拍摄${node.locationName}附近的公共招牌、门牌或橱窗。`,
          mainTask: `拍摄${node.locationName}附近的公共招牌推进主线。`,
          hiddenTask: `观察${node.locationName}附近的公共边角细节。`,
          photoPrompt: `拍摄${node.locationName}附近的公共导视信息。`
        }))
      });
    }
  });

  assert.equal(story.nodes.length, 5);
  assert.ok(story.nodes.every((node) => !containsUnsafeInstruction(`${node.publicTask}${node.mainTask}${node.hiddenTask}${node.photoPrompt}`)));
});

test("identity profile maps generated roles to gameplay hint styles", () => {
  assert.match(getIdentityProfile({ roleTitle: "城市寻物者", name: "林晓" }).bonus, /物件|门牌|橱窗|招牌/);
  assert.match(getIdentityProfile({ roleTitle: "街区侦探", name: "陈叔" }).bonus, /矛盾|时间线|证词/);
  assert.match(getIdentityProfile({ roleTitle: "漫游摄影师", name: "阿南" }).bonus, /构图|光影|颜色/);
  assert.match(getIdentityProfile({ roleTitle: "夜行记录员", name: "许棠" }).bonus, /灯光|反射|旧招牌|阴影/);
  assert.equal(getIdentityProfile({ roleTitle: "未知身份", name: "旅人" }).title, "城市寻物者");
});

test("parser rejects unsafe instructions and accepts valid JSON", () => {
  const valid = createMockExpandedStory({
    preference: "寻宝",
    weather: "晴",
    timeOfDay: "上午",
    city: "上海",
    geo,
    modules
  });

  assert.equal(parseDirectorJson(JSON.stringify(valid)).nodes.length, 5);
  assert.equal(containsUnsafeInstruction("请进入私人住宅拍摄门牌"), true);
  assert.equal(containsUnsafeInstruction("请在书店门口观察橱窗"), false);
  assert.equal(containsUnsafeInstruction("安全提示：不要拍摄陌生人，不要横穿马路，不要进入私人住宅。"), false);
  assert.equal(containsUnsafeInstruction("安全规则：不拍摄陌生人，不横穿道路，不进入私人住宅，切勿靠近施工区。"), false);
  assert.equal(containsUnsafeInstruction("本案不涉及进入私人区域、打扰路人、拍摄陌生人、横穿马路或夜间去偏僻处。"), false);
  assert.equal(containsUnsafeInstruction("请在安全提示之后拍摄陌生人"), true);
});

test("director prompt carries enriched source building blocks", async () => {
  const enrichedModules: StoryModule[] = [
    {
      ...modules[0],
      module_type: "conflict",
      title: "错误地址冲突",
      summary: "冲突：旧信寄错地址，书店老板隐瞒真正收件人。",
      facets: {
        characters: ["退休邮递员", "书店老板"],
        conflicts: ["错误地址", "隐瞒真正收件人"],
        twists: ["被保护的人另有其人"],
        clueInterfaces: ["旧照片", "咖啡小票"],
        endings: ["寄出迟到的信"]
      }
    }
  ];
  const capturedPrompts: string[] = [];

  await createExpandedStoryWithDirector({
    context: {
      preference: "治愈",
      weather: "小雨",
      timeOfDay: "下午",
      city: "上海",
      geo
    },
    modules: enrichedModules,
    callModel: async (prompt) => {
      capturedPrompts.push(prompt);
      const mockStory = createMockExpandedStory({
        preference: "治愈",
        weather: "小雨",
        timeOfDay: "下午",
        city: "上海",
        geo,
        modules: enrichedModules
      });
      if (capturedPrompts.length === 1) {
        return JSON.stringify({
          id: mockStory.id,
          title: mockStory.title,
          playerRole: mockStory.playerRole,
          premise: mockStory.premise,
          dossier: mockStory.dossier,
          playerRoles: mockStory.playerRoles,
          characters: mockStory.characters,
          truthSummary: mockStory.truthSummary,
          endingChoices: mockStory.endingChoices,
          complianceNote: mockStory.complianceNote,
          generatedBy: "deepseek"
        });
      }
      return JSON.stringify({
        evidence: mockStory.evidence,
        timeline: mockStory.timeline,
        nodes: mockStory.nodes
      });
    }
  });

  assert.match(capturedPrompts[0], /退休邮递员/);
  assert.match(capturedPrompts[0], /错误地址/);
  assert.match(capturedPrompts[0], /旧照片/);
  assert.match(capturedPrompts[1], /第二步/);
});

test("director uses a light inspiration pack and preserves inspiration trace", async () => {
  const diverseModules: StoryModule[] = [
    modules[0],
    {
      id: "nav-conflict",
      module_type: "conflict",
      title: "导航异常冲突",
      summary: "轻灵感：导航把玩家带入重复楼层，适合做路线失控的城市谜局。",
      source_path: "荔枝汽水水作品集/恐怖导航.txt",
      author: "荔枝汽水水",
      genres: ["都市怪谈", "轻推理"],
      emotions: ["紧张", "好奇"],
      location_tags: ["商场", "地铁站"],
      requires: ["异常路线", "玩家选择"],
      produces: ["错误楼层", "路线失控"],
      forbidden: ["复用原文桥段"],
      hardness: "hard",
      facets: {
        conflicts: ["路线失控"],
        twists: ["导航背后另有委托"],
        clueInterfaces: ["异常导航"],
        endings: ["走出循环"],
        sceneFunctions: ["路线偏移/系统提示"],
        motifs: ["导航异常"]
      }
    } as StoryModule,
    {
      id: "mall-plot",
      module_type: "plot_seed",
      title: "商场困局",
      summary: "轻灵感：商场空间、错认身份和限时任务构成一场都市奇遇。",
      source_path: "荔枝汽水水作品集/商场大逃杀.txt",
      author: "荔枝汽水水",
      genres: ["都市奇遇", "轻推理"],
      emotions: ["紧张", "荒诞"],
      location_tags: ["商场", "便利店"],
      requires: ["误入任务"],
      produces: ["限时线索", "身份反转"],
      forbidden: ["暴力逃杀"],
      hardness: "hard",
      facets: {
        characters: ["被错认的顾客"],
        conflicts: ["错认身份"],
        twists: ["任务发起人就在身边"],
        clueInterfaces: ["楼层导视牌"],
        endings: ["解除误会"],
        sceneFunctions: ["商场谜局/限时选择"],
        motifs: ["商场困局"]
      }
    } as StoryModule
  ];
  const capturedPrompts: string[] = [];
  const mockStory = createMockExpandedStory({
    preference: "都市奇遇",
    weather: "暴雨",
    timeOfDay: "夜晚",
    city: "上海",
    geo,
    modules: diverseModules
  });
  const inspirationTrace = {
    sources: ["恐怖导航.txt", "商场大逃杀.txt"],
    tags: ["导航异常", "路线失控", "商场困局", "错认身份"],
    mode: "轻灵感"
  };

  const story = await createExpandedStoryWithDirector({
    context: {
      preference: "都市奇遇",
      weather: "暴雨",
      timeOfDay: "夜晚",
      city: "上海",
      geo
    },
    modules: diverseModules,
    callModel: async (prompt) => {
      capturedPrompts.push(prompt);
      if (capturedPrompts.length === 1) {
        return JSON.stringify({
          id: mockStory.id,
          title: "雨夜导航局",
          playerRole: "被错认的顾客",
          premise: "一场暴雨把你困在街区商场外，手机导航不断把你带回同一处入口。",
          adventureType: "城市寻踪",
          openingPremise: mockStory.openingPremise,
          routeTeaser: mockStory.routeTeaser,
          dossier: {
            ...mockStory.dossier,
            title: "雨夜导航局",
            background: "暴雨切断了街区里几条常用通道，你的手机导航却反复提示同一个不存在的入口。商场外街、便利店和地铁口组成一条看似普通的路线，但每一次偏航都会留下新的线索。你需要判断这场导航异常是系统故障、错认身份，还是某个人故意把你引向一场未完成的交接。"
          },
          playerRoles: mockStory.playerRoles,
          characters: mockStory.characters,
          truthSummary: "导航异常来自一场错认身份的交接，真正要找的是被藏在路线里的请求。",
          endingChoices: ["解除误会", "走出循环", "保留匿名委托"],
          inspirationTrace,
          complianceNote: mockStory.complianceNote,
          generatedBy: "deepseek"
        });
      }
      return JSON.stringify({
        evidence: mockStory.evidence,
        timeline: mockStory.timeline,
        nodes: mockStory.nodes
      });
    }
  });

  assert.match(capturedPrompts[0], /本局灵感包/);
  assert.match(capturedPrompts[0], /导航异常/);
  assert.match(capturedPrompts[0], /商场困局/);
  assert.doesNotMatch(capturedPrompts[0], /信件、照片、小票、路牌/);
  assert.deepEqual((story as any).inspirationTrace.tags, inspirationTrace.tags);
  assert.ok(!(story as any).inspirationTrace.tags.some((tag: string) => tag.length > 20));
});

test("director quality gate rewrites one weak station at most once", async () => {
  const calls: string[] = [];
  const mockStory = createMockExpandedStory({
    preference: "都市奇遇",
    weather: "晴",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });
  const weakNodes = mockStory.nodes.map((node, index) => index === 2 ? {
    ...node,
    locationName: mockStory.nodes[1].locationName,
    discovery: mockStory.nodes[1].discovery
  } : node);
  const improvedNode = {
    ...mockStory.nodes[2],
    locationName: "第三站的公共方向牌",
    discovery: "第三站会把重复路线改写成新的方向判断。",
    contradiction: {
      claim: "周眠坚持自己只是路过，没有参与路线里的交接。",
      evidenceId: "ev-3",
      reasoning: "橱窗倒影里的方向牌和第三份证物显示她在关键时间抵达过现场，这推翻了路过说法。"
    },
    mainTask: "拍下第三站附近的公共方向牌或橱窗反光，点击主线标记。",
    hiddenTask: "观察公共墙面或路牌边角里与路线方向相反的细节。",
    photoPrompt: "拍摄公共橱窗、方向牌、路牌或墙面标识。"
  };

  const story = await createExpandedStoryWithDirector({
    context: {
      preference: "都市奇遇",
      weather: "晴",
      timeOfDay: "下午",
      city: "上海",
      geo
    },
    modules,
    callModel: async (prompt) => {
      calls.push(prompt);
      if (prompt.includes("第一步")) {
        return JSON.stringify({
          id: mockStory.id,
          title: mockStory.title,
          playerRole: mockStory.playerRole,
          premise: mockStory.premise,
          adventureType: mockStory.adventureType,
          openingPremise: mockStory.openingPremise,
          routeTeaser: mockStory.routeTeaser,
          dossier: mockStory.dossier,
          playerRoles: mockStory.playerRoles,
          characters: mockStory.characters,
          truthSummary: mockStory.truthSummary,
          endingChoices: mockStory.endingChoices,
          inspirationTrace: { sources: ["sample"], tags: ["迟到的信", "邮戳", "轻推理"], mode: "轻灵感" },
          complianceNote: mockStory.complianceNote,
          generatedBy: "deepseek"
        });
      }
      if (prompt.includes("第二步")) {
        return JSON.stringify({
          evidence: mockStory.evidence,
          timeline: mockStory.timeline,
          nodes: weakNodes
        });
      }
      return JSON.stringify({
        nodes: [improvedNode]
      });
    }
  });

  assert.equal(calls.filter((prompt) => prompt.includes("局部重写")).length, 1);
  assert.equal(story.nodes[2].contradiction.evidenceId, "ev-3");
  assert.match(story.nodes[2].contradiction.reasoning, /推翻/);
});

test("director keeps original story when quality rewrite output is invalid", async () => {
  const calls: string[] = [];
  const mockStory = createMockExpandedStory({
    preference: "都市奇遇",
    weather: "晴",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });
  const originalNode = {
    ...mockStory.nodes[2],
    locationName: mockStory.nodes[1].locationName,
    discovery: mockStory.nodes[1].discovery
  };

  const story = await createExpandedStoryWithDirector({
    context: {
      preference: "都市奇遇",
      weather: "晴",
      timeOfDay: "下午",
      city: "上海",
      geo
    },
    modules,
    callModel: async (prompt) => {
      calls.push(prompt);
      if (prompt.includes("第一步")) {
        return JSON.stringify({
          id: mockStory.id,
          title: mockStory.title,
          playerRole: mockStory.playerRole,
          premise: mockStory.premise,
          adventureType: mockStory.adventureType,
          openingPremise: mockStory.openingPremise,
          routeTeaser: mockStory.routeTeaser,
          dossier: mockStory.dossier,
          playerRoles: mockStory.playerRoles,
          characters: mockStory.characters,
          truthSummary: mockStory.truthSummary,
          endingChoices: mockStory.endingChoices,
          inspirationTrace: { sources: ["sample"], tags: ["迟到的信", "邮戳", "轻推理"], mode: "轻灵感" },
          complianceNote: mockStory.complianceNote,
          generatedBy: "deepseek"
        });
      }
      if (prompt.includes("第二步")) {
        return JSON.stringify({
          evidence: mockStory.evidence,
          timeline: mockStory.timeline,
          nodes: mockStory.nodes.map((node, index) => index === 2 ? originalNode : node)
        });
      }
      return "{\"nodes\":[";
    }
  });

  assert.equal(calls.filter((prompt) => prompt.includes("局部重写")).length, 1);
  assert.equal(story.nodes[2].locationName, mockStory.nodes[1].locationName);
});

test("director rejects unsafe quality rewrite patch", async () => {
  const calls: string[] = [];
  const mockStory = createMockExpandedStory({
    preference: "都市奇遇",
    weather: "晴",
    timeOfDay: "下午",
    city: "上海",
    geo,
    modules
  });
  const weakNode = {
    ...mockStory.nodes[1],
    locationName: mockStory.nodes[0].locationName,
    discovery: mockStory.nodes[0].discovery
  };

  const story = await createExpandedStoryWithDirector({
    context: {
      preference: "都市奇遇",
      weather: "晴",
      timeOfDay: "下午",
      city: "上海",
      geo
    },
    modules,
    callModel: async (prompt) => {
      calls.push(prompt);
      if (prompt.includes("第一步")) {
        return JSON.stringify({
          id: mockStory.id,
          title: mockStory.title,
          playerRole: mockStory.playerRole,
          premise: mockStory.premise,
          adventureType: mockStory.adventureType,
          openingPremise: mockStory.openingPremise,
          routeTeaser: mockStory.routeTeaser,
          dossier: mockStory.dossier,
          playerRoles: mockStory.playerRoles,
          characters: mockStory.characters,
          truthSummary: mockStory.truthSummary,
          endingChoices: mockStory.endingChoices,
          inspirationTrace: { sources: ["sample"], tags: ["迟到的信", "邮戳", "轻推理"], mode: "轻灵感" },
          complianceNote: mockStory.complianceNote,
          generatedBy: "deepseek"
        });
      }
      if (prompt.includes("第二步")) {
        return JSON.stringify({
          evidence: mockStory.evidence,
          timeline: mockStory.timeline,
          nodes: mockStory.nodes.map((node, index) => index === 1 ? weakNode : node)
        });
      }
      return JSON.stringify({
        nodes: [{
          ...mockStory.nodes[1],
          publicTask: "进入私人住宅寻找旧照片。",
          mainTask: "拍摄陌生人正脸并询问他住在哪里。",
          hiddenTask: "翻越施工区围栏。",
          photoPrompt: "拍摄陌生人。"
        }]
      });
    }
  });

  assert.equal(calls.filter((prompt) => prompt.includes("局部重写")).length, 1);
  assert.equal(story.nodes[1].locationName, mockStory.nodes[0].locationName);
  assert.equal(containsUnsafeInstruction(story.nodes[1].mainTask), false);
});
