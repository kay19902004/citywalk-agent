import type {
  AgentSceneOutput,
  ComposedStory,
  GameSession,
  LocationNode,
  RuntimeContext,
  SafetyStatus,
  StoryModule,
  StoryTemplate
} from "./types";

export const storyTemplates: StoryTemplate[] = [
  {
    id: "return-old-object",
    title: "旧物归还",
    genres: ["治愈", "轻推理", "城市漫游"],
    node_functions: ["接收委托", "查找关系", "发现误会", "结局选择"],
    opening_task: "找到旧物真正应该抵达的人。",
    truth_frame: "旧物不是送错了，而是被故意留给后来的人完成心愿。",
    ending_types: ["送达", "转交", "留下新留言"]
  },
  {
    id: "urban-treasure",
    title: "城市寻宝",
    genres: ["寻宝", "都市奇遇", "轻推理"],
    node_functions: ["误入任务", "收集碎片", "拼合暗号", "结局选择"],
    opening_task: "沿着城市线索找回一件被转手多次的小物。",
    truth_frame: "所谓宝藏不是物品本身，而是一段被很多陌生人接力保存的善意。",
    ending_types: ["找到宝藏", "交给下一位玩家", "公开线索"]
  },
  {
    id: "future-list",
    title: "给未来自己的清单",
    genres: ["成长", "治愈", "城市漫游"],
    node_functions: ["收到清单", "完成小事", "面对迟疑", "结局选择"],
    opening_task: "完成一张很久以前写下、却一直没有兑现的城市清单。",
    truth_frame: "清单来自过去的自己，真正要找回的是继续生活的勇气。",
    ending_types: ["完成清单", "改写清单", "寄给未来"]
  }
];

export const seedLocations: LocationNode[] = [
  { id: "old-postbox", name: "旧邮筒", type: "邮局", lat: 31.2304, lng: 121.4737, radius: 80, safety: "normal", fallback: "无法靠近邮筒时，改为查看任务包中的邮戳照片。" },
  { id: "bookstore", name: "二手书店", type: "书店", lat: 31.231, lng: 121.4748, radius: 80, safety: "indoor", fallback: "书店关闭时，改为橱窗书单和线上夹页照片。" },
  { id: "cafe", name: "街角咖啡馆", type: "咖啡馆", lat: 31.2317, lng: 121.4755, radius: 80, safety: "indoor", fallback: "店铺关闭时，改为门口外卖小票线索。" },
  { id: "bridge", name: "河边步道", type: "桥", lat: 31.2323, lng: 121.4761, radius: 100, safety: "avoid_night", fallback: "夜间或暴雨时，改为查看桥边监控截图和语音转写。" },
  { id: "metro", name: "地铁口", type: "地铁站", lat: 31.2329, lng: 121.477, radius: 100, safety: "night_safe", fallback: "定位漂移时，改为读取刷卡记录截图。" },
  { id: "pocket-park", name: "口袋公园长椅", type: "公园", lat: 31.2335, lng: 121.478, radius: 90, safety: "avoid_night", fallback: "天气恶劣时，改为系统恢复长椅照片。" }
];

export const seedModules: StoryModule[] = [
  {
    id: "seed-late-letter",
    module_type: "plot_seed",
    title: "迟到的信",
    summary: "一封多年后才出现的信，需要玩家找到真正的收信人。",
    source_path: "seed",
    genres: ["治愈", "轻推理"],
    emotions: ["怀旧", "遗憾", "温暖"],
    location_tags: ["邮局", "书店", "咖啡馆"],
    requires: ["寄信人", "收信人", "见证者"],
    produces: ["旧地址", "真正收信人", "最终选择"],
    forbidden: ["死亡案件", "暴力威胁", "恐怖追逐"],
    hardness: "hard"
  },
  {
    id: "seed-photo",
    module_type: "plot_seed",
    title: "错过的合照",
    summary: "一张少了一个人的旧照片，把玩家带向没有完成的约定。",
    source_path: "seed",
    genres: ["轻推理", "治愈"],
    emotions: ["好奇", "遗憾", "释然"],
    location_tags: ["书店", "桥", "公园"],
    requires: ["旧照片", "拍摄地点"],
    produces: ["第三个名字", "约定地点"],
    forbidden: ["跟踪陌生人", "拍摄私人住宅"],
    hardness: "hard"
  },
  {
    id: "seed-list",
    module_type: "plot_seed",
    title: "未完成清单",
    summary: "玩家沿途完成三件小事，逐步理解写下清单的人。",
    source_path: "seed",
    genres: ["成长", "治愈"],
    emotions: ["平静", "迷茫", "鼓励", "释然"],
    location_tags: ["公园", "咖啡馆", "桥"],
    requires: ["清单", "玩家选择"],
    produces: ["自我和解", "未来留言"],
    forbidden: ["过度沉重", "危险任务"],
    hardness: "hard"
  }
];

type ComposeInput = RuntimeContext & {
  availableModules: StoryModule[];
  availableLocations: LocationNode[];
  templates: StoryTemplate[];
};

export function composeStory(input: ComposeInput): ComposedStory {
  const template = chooseTemplate(input.preference, input.templates);
  const modules = chooseModules(input.availableModules, template, input.preference);
  const locations = chooseLocations(input.availableLocations, modules, input.timeOfDay);
  const emotional_curve = chooseCurve(modules, input.weather, input.timeOfDay);
  const nodes = template.node_functions.map((coreFunction, index) => {
    const location = locations[index % locations.length];
    const module = modules[index % modules.length];
    return {
      id: `${template.id}-node-${index + 1}`,
      order: index + 1,
      location,
      core_function: coreFunction,
      fixed_clue: clueFor(coreFunction, module, location),
      question: questionFor(coreFunction, template),
      answer_keywords: answerKeywordsFor(coreFunction, module, template),
      prompt_rules: [
        "只透露本站 fixed_clue",
        "不得提前揭示 truth_summary",
        "结合天气和时间改写氛围",
        "不复用长段原文"
      ],
      fallback: location.fallback
    };
  });

  return {
    id: `${template.id}-${Date.now().toString(36)}`,
    title: titleFor(template, input),
    theme: template.title,
    genre: unique([...template.genres, ...modules.flatMap((module) => module.genres)]).slice(0, 4),
    main_task: template.opening_task,
    truth_summary: template.truth_frame,
    emotional_curve,
    nodes,
    safety_status: nodes.some((node) => node.location.safety === "avoid_night" && input.timeOfDay === "深夜") ? "fallback" : "safe",
    compliance_note: "素材仅抽象为结构化灵感模块；公开或商业化前需替换为自有授权文本。"
  };
}

export function createSession(input: ComposeInput): GameSession {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    story: composeStory(input),
    currentNodeIndex: 0,
    knownClues: [],
    answers: [],
    hintLevel: 0,
    createdAt: now,
    updatedAt: now
  };
}

export function advanceSession(
  session: GameSession,
  input: { answer?: string; locationDistanceMeters?: number; weather?: string; timeOfDay?: string } = {}
): AgentSceneOutput {
  let node = session.story.nodes[session.currentNodeIndex];
  if (!node) {
    return endingOutput(session);
  }

  const safety = evaluateSafety({
    timeOfDay: input.timeOfDay ?? "下午",
    weather: input.weather ?? "晴",
    locationDistanceMeters: input.locationDistanceMeters ?? 0,
    locationSafety: node.location.safety
  });

  const answer = input.answer?.trim() ?? "";
  const correct = answer ? node.answer_keywords.some((keyword) => answer.includes(keyword)) : false;
  if (answer) {
    session.answers.push({ nodeId: node.id, answer, correct });
    session.hintLevel = correct ? 0 : Math.min(session.hintLevel + 1, 3);
  }

  if (!session.knownClues.includes(node.fixed_clue)) {
    session.knownClues.push(node.fixed_clue);
  }

  const isFinal = session.currentNodeIndex === session.story.nodes.length - 1;
  if (correct && !isFinal) {
    session.currentNodeIndex += 1;
    node = session.story.nodes[session.currentNodeIndex];
    if (!session.knownClues.includes(node.fixed_clue)) {
      session.knownClues.push(node.fixed_clue);
    }
  } else if (correct && isFinal) {
    session.currentNodeIndex += 1;
    session.updatedAt = new Date().toISOString();
    return endingOutput(session);
  }

  session.updatedAt = new Date().toISOString();

  return {
    scene_text: sceneTextFor(node, session, safety.status),
    new_clues: [node.fixed_clue],
    question: node.question,
    next_action: isFinal && correct ? "show_ending" : correct ? "go_next_location" : "ask_player_answer",
    safety_status: safety.status,
    fallback_available: safety.status !== "safe",
    hint_level: session.hintLevel,
    reason: safety.reason,
    session
  };
}

export function evaluateSafety(input: {
  timeOfDay: string;
  weather: string;
  locationDistanceMeters: number;
  locationSafety: LocationNode["safety"];
}): { status: SafetyStatus; reason: string } {
  if (input.locationSafety === "avoid_night" && ["夜晚", "深夜"].includes(input.timeOfDay)) {
    return { status: "fallback", reason: "当前点位夜间不建议前往，已切换为线上替代线索。" };
  }
  if (/暴雨|台风|雷/.test(input.weather)) {
    return { status: "fallback", reason: "天气不适合户外停留，已切换为线上替代线索。" };
  }
  if (input.timeOfDay === "深夜") {
    return { status: "fallback", reason: "深夜模式启用，避免前往偏僻地点并使用线上替代线索。" };
  }
  if (input.locationDistanceMeters > 500) {
    return { status: "fallback", reason: "你离点位较远，先提供线上替代线索，避免反复绕路。" };
  }
  return { status: "safe", reason: "当前上下文可安全游玩。" };
}

function chooseTemplate(preference: string, templates: StoryTemplate[]): StoryTemplate {
  return templates.find((template) => template.genres.includes(preference)) ?? templates[0];
}

function chooseModules(modules: StoryModule[], template: StoryTemplate, preference: string): StoryModule[] {
  const allowed = modules.filter((module) => !module.forbidden.some((item) => /死亡|暴力|恐怖追逐/.test(item)));
  const scored = allowed
    .map((module) => ({
      module,
      score:
        module.genres.filter((genre) => template.genres.includes(genre) || genre === preference).length +
        module.emotions.filter((emotion) => ["怀旧", "温暖", "释然", "好奇", "轻快"].includes(emotion)).length * 0.2
    }))
    .sort((a, b) => b.score - a.score);
  const picked = scored.map((item) => item.module).slice(0, 4);
  return picked.length ? picked : seedModules;
}

function chooseLocations(locations: LocationNode[], modules: StoryModule[], timeOfDay: string): LocationNode[] {
  const tags = new Set(modules.flatMap((module) => module.location_tags));
  const safeLocations = locations.filter((location) => !(timeOfDay === "深夜" && location.safety === "avoid_night"));
  const picked = safeLocations.filter((location) => tags.has(location.type)).slice(0, 4);
  return picked.length >= 4 ? picked : [...picked, ...safeLocations.filter((location) => !picked.includes(location))].slice(0, 4);
}

function chooseCurve(modules: StoryModule[], weather: string, timeOfDay: string): string[] {
  const base = unique(modules.flatMap((module) => module.emotions));
  if (/雨|雾/.test(weather)) base.unshift("怀旧");
  if (["傍晚", "夜晚"].includes(timeOfDay)) base.push("神秘");
  return unique(base).slice(0, 4);
}

function clueFor(coreFunction: string, module: StoryModule, location: LocationNode): string {
  const map: Record<string, string> = {
    "接收委托": `${location.name}出现了与「${module.title}」有关的第一条地址线索。`,
    "查找关系": `${location.name}的记录显示，旧物背后还有一位未被写出的见证者。`,
    "发现误会": `${location.name}留下的时间或物品细节，推翻了表面收件人的判断。`,
    "误入任务": `${location.name}的交接信息把玩家误认为今晚的接头人。`,
    "收集碎片": `${location.name}提供了一枚可拼合路线暗号的碎片。`,
    "拼合暗号": `${location.name}的招牌、门牌或票据组成下一步密码。`,
    "收到清单": `${location.name}解锁了第一项未完成的小事。`,
    "完成小事": `${location.name}让玩家完成一个低风险、无需打扰他人的观察任务。`,
    "面对迟疑": `${location.name}暴露清单主人一直回避的选择。`,
    "结局选择": `${location.name}汇合所有线索，玩家决定送达、转交或留下新留言。`
  };
  return map[coreFunction] ?? `${location.name}提供一条能推进故事的固定线索。`;
}

function questionFor(coreFunction: string, template: StoryTemplate): string {
  if (coreFunction.includes("结局")) return `你要如何处理最后的证据，才能回应「${template.opening_task}」？`;
  if (/查找|发现|拼合/.test(coreFunction)) return "这条线索改变了你对谁/什么的判断？";
  return "你从这个地点获得的下一步目标是什么？";
}

function answerKeywordsFor(coreFunction: string, module: StoryModule, template: StoryTemplate): string[] {
  if (coreFunction.includes("结局")) return template.ending_types;
  return unique([module.title, ...module.produces, "下一站", "线索", "地址", "见证者"]).slice(0, 8);
}

function sceneTextFor(node: ComposedStory["nodes"][number], session: GameSession, safety: SafetyStatus): string {
  const mood = session.story.emotional_curve[session.currentNodeIndex % session.story.emotional_curve.length] ?? "好奇";
  const hint = session.hintLevel > 0 ? `\n\n提示 ${session.hintLevel}：先把这条线索和前面已获得的信息放在同一条时间线上。` : "";
  const fallback = safety === "safe" ? "" : `\n\n安全模式：${node.fallback}`;
  return `第 ${node.order} 站 · ${node.location.name}\n${mood}的城市气氛里，你获得了一个被固定下来的线索：${node.fixed_clue}${fallback}${hint}`;
}

function endingOutput(session: GameSession): AgentSceneOutput {
  const correctCount = session.answers.filter((answer) => answer.correct).length;
  const ending = correctCount >= session.story.nodes.length - 1
    ? "你让所有线索回到它该去的地方。故事没有被彻底修好，但被认真完成了。"
    : "你错过了几处关键联系，不过仍然把这段城市记忆安全带到了终点。";
  return {
    scene_text: `${ending}\n\n真相框架：${session.story.truth_summary}`,
    new_clues: [],
    question: "本次 CityWalk 已结束。",
    next_action: "show_ending",
    safety_status: "safe",
    fallback_available: false,
    hint_level: session.hintLevel,
    session
  };
}

function titleFor(template: StoryTemplate, input: RuntimeContext): string {
  const weatherPrefix = /雨/.test(input.weather) ? "雨停前" : input.timeOfDay === "夜晚" ? "灯亮以后" : "今天";
  return `${weatherPrefix}，${template.title}`;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items.filter(Boolean))];
}
