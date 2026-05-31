import OpenAI from "openai";
import { spawn } from "node:child_process";
import { z } from "zod";
import { evaluateStoryQuality, selectRewriteTarget, type StoryQualityReport, type StoryRewriteTarget } from "./story-quality";
import type { ExpandedStory, GeoContext, RuntimeContext, StoryModule } from "./types";

const STORY_NODE_COUNT = 5;
const DIRECTOR_TIMEOUT_MS = 70000;
const SDK_TIMEOUT_MS = 60000;
const CURL_TIMEOUT_SECONDS = "60";
const DEFAULT_DEEPSEEK_MAX_TOKENS = 8000;

const EVIDENCE_KIND_VALUES = ["物证", "证词", "记录", "地点观察"] as const;
type EvidenceKind = typeof EVIDENCE_KIND_VALUES[number];
const RECENT_INSPIRATION_LIMIT = 5;
let inspirationCursor = 0;
const recentInspirationThemes: string[] = [];

type InspirationTrace = {
  sources: string[];
  tags: string[];
  mode: string;
};

type InspirationPack = {
  modules: StoryModule[];
  trace: InspirationTrace;
  relationships: string[];
  conflicts: string[];
  clues: string[];
  sceneFunctions: string[];
  worldTags: string[];
  actionTasks: string[];
  endingStakes: string[];
};

const evidenceSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  kind: z.enum(EVIDENCE_KIND_VALUES),
  content: z.string().min(8),
  unlocksAtNode: z.number().int().min(1).max(STORY_NODE_COUNT)
});

const dossierSchema = z.object({
  caseFileId: z.string().min(2),
  caseType: z.string().min(2),
  title: z.string().min(2),
  incidentTime: z.string().min(2),
  locationAtmosphere: z.string().min(8),
  background: z.string().min(120),
  knownFacts: z.array(z.string().min(4)).min(3),
  openQuestions: z.array(z.string().min(4)).min(2),
  openingInstruction: z.string().min(10)
});

const playerRoleSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  roleTitle: z.string().min(2),
  bio: z.string().min(20),
  relationshipToCase: z.string().min(8),
  knownSecret: z.string().min(8),
  privateGoal: z.string().min(8),
  startingClueIds: z.array(z.string().min(1)).min(1),
  voiceStyle: z.string().min(4),
  riskNote: z.string().min(6),
  explorationAbility: z.string().min(4).optional(),
  hiddenObjective: z.string().min(4).optional(),
  hintStyle: z.string().min(4).optional()
});

const characterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  publicInfo: z.string().min(8),
  secretHint: z.string().min(6),
  testimony: z.string().min(12),
  contradictionHint: z.string().min(8)
});

const storyBaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  playerRole: z.string().min(2),
  premise: z.string().min(20),
  adventureType: z.string().min(2),
  openingPremise: z.string().min(120),
  routeTeaser: z.array(z.object({
    order: z.number().int().min(1).max(STORY_NODE_COUNT),
    locationName: z.string().min(2),
    teaser: z.string().min(16)
  })).length(STORY_NODE_COUNT),
  dossier: dossierSchema,
  playerRoles: z.array(playerRoleSchema).length(3),
  truthSummary: z.string().min(16),
  endingChoices: z.array(z.string().min(2)).min(2),
  characters: z.array(characterSchema).min(3),
  inspirationTrace: z.object({
    sources: z.array(z.string().min(1)).min(1),
    tags: z.array(z.string().min(1)).min(1),
    mode: z.string().min(2)
  }),
  complianceNote: z.string().min(8),
  generatedBy: z.enum(["deepseek", "mock"])
});

const stationPlanSchema = z.object({
  evidence: z.array(evidenceSchema).min(STORY_NODE_COUNT),
  timeline: z.array(z.string().min(5)).min(STORY_NODE_COUNT),
  nodes: z.array(z.object({
    id: z.string().min(1),
    order: z.number().int().min(1).max(STORY_NODE_COUNT),
    locationName: z.string().min(2),
    locationTieIn: z.string().min(10),
    sceneText: z.string().min(50),
    npcMessage: z.string().min(20),
    evidenceIds: z.array(z.string().min(1)).min(1),
    publicTask: z.string().min(8),
    contradiction: z.object({
      claim: z.string().min(8),
      evidenceId: z.string().min(1),
      reasoning: z.string().min(16)
    }),
    suspectPressure: z.string().min(8),
    rolePerspectives: z.record(z.string().min(1), z.string().min(12)),
    question: z.string().min(8),
    answerKeywords: z.array(z.string().min(1)).min(1),
    safetyFallback: z.string().min(8),
    mainTask: z.string().min(8),
    hiddenTask: z.string().min(8),
    photoPrompt: z.string().min(8),
    discovery: z.string().min(8)
  })).length(STORY_NODE_COUNT)
});

const expandedStorySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(2),
  playerRole: z.string().min(2),
  premise: z.string().min(20),
  adventureType: storyBaseSchema.shape.adventureType,
  openingPremise: storyBaseSchema.shape.openingPremise,
  routeTeaser: storyBaseSchema.shape.routeTeaser,
  dossier: dossierSchema,
  playerRoles: z.array(playerRoleSchema).length(3),
  selectedRoleId: z.string().optional(),
  truthSummary: z.string().min(16),
  endingChoices: z.array(z.string().min(2)).min(2),
  characters: z.array(characterSchema).min(3),
  evidence: z.array(evidenceSchema).min(STORY_NODE_COUNT),
  timeline: z.array(z.string().min(5)).min(STORY_NODE_COUNT),
  nodes: stationPlanSchema.shape.nodes,
  inspirationTrace: storyBaseSchema.shape.inspirationTrace.optional(),
  complianceNote: z.string().min(8),
  generatedBy: z.enum(["deepseek", "mock"])
});

export type DirectorInput = RuntimeContext & {
  geo?: GeoContext;
  modules: StoryModule[];
};

export type DirectorModelCall = (prompt: string) => Promise<string>;

type DeepSeekChatBody = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming & {
  thinking?: { type: "disabled" | "enabled" };
};

export async function createExpandedStoryWithDirector(input: {
  context: RuntimeContext;
  modules: StoryModule[];
  callModel?: DirectorModelCall;
}): Promise<ExpandedStory> {
  const directorInput = { ...input.context, geo: input.context.geo, modules: input.modules };
  const callModel = input.callModel ?? callDeepSeek;
  const inspirationPack = selectInspirationPack(input.modules, input.context);
  const basePrompt = buildDossierPrompt(directorInput, inspirationPack);
  try {
    const base = await callAndParseDirectorJson({
      callModel,
      prompt: basePrompt,
      label: "案卷与身份卡",
      parse: (raw) => parseStoryBaseJson(raw, inspirationPack.trace)
    });
    const stationPrompt = buildStationsPrompt(directorInput, base, inspirationPack);
    const stationPlan = await callAndParseDirectorJson({
      callModel,
      prompt: stationPrompt,
      label: "站点剧情",
      parse: parseStationPlanJson
    });
    const combined = { ...base, ...stationPlan };
    const story = expandedStorySchema.parse(normalizeDirectorStory(combined));
    const unsafeInstruction = findUnsafeRouteTask(story);
    if (unsafeInstruction) throw new Error(`Unsafe route instruction: ${unsafeInstruction.slice(0, 120)}`);
    const improvedStory = await improveStoryQualityOnce({
      story,
      input: directorInput,
      inspirationPack,
      callModel
    });
    rememberInspiration(improvedStory.inspirationTrace?.tags ?? inspirationPack.trace.tags);
    return { ...improvedStory, generatedBy: "deepseek" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown director error";
    throw new Error(`DeepSeek 生成失败：${message}`);
  }
}

function parseStoryBaseJson(raw: string, fallbackTrace?: InspirationTrace): z.infer<typeof storyBaseSchema> {
  const parsed = JSON.parse(extractJson(raw));
  return storyBaseSchema.parse(normalizeStoryBase(parsed, fallbackTrace));
}

function parseStationPlanJson(raw: string): z.infer<typeof stationPlanSchema> {
  const parsed = JSON.parse(extractJson(raw));
  return stationPlanSchema.parse(normalizeStationPlan(parsed));
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function callAndParseDirectorJson<T>(input: {
  callModel: DirectorModelCall;
  prompt: string;
  label: string;
  parse: (raw: string) => T;
}): Promise<T> {
  const raw = await callDirectorModel(input.callModel, input.prompt, `${input.label}生成超时`);
  try {
    return input.parse(raw);
  } catch (error) {
    if (!isRetryableJsonFailure(error, raw)) throw error;
  }

  const retryRaw = await callDirectorModel(
    input.callModel,
    buildCompactJsonRetryPrompt(input.prompt),
    `${input.label}重试超时`
  );
  try {
    return input.parse(retryRaw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown JSON parse error";
    throw new Error(`${input.label}输出不是完整JSON：${message}`);
  }
}

type StoryRewritePatch = {
  nodes?: Array<Partial<ExpandedStory["nodes"][number]> & { id: string }>;
  truthSummary?: string;
  endingChoices?: string[];
  openingPremise?: string;
  routeTeaser?: ExpandedStory["routeTeaser"];
};

async function improveStoryQualityOnce(input: {
  story: ExpandedStory;
  input: DirectorInput;
  inspirationPack: InspirationPack;
  callModel: DirectorModelCall;
}): Promise<ExpandedStory> {
  const report = evaluateStoryQuality(input.story);
  if (report.passed) return input.story;
  const target = selectRewriteTarget(report);
  if (!target) return input.story;

  try {
    const prompt = buildQualityRewritePrompt(input.story, report, target, input.inspirationPack);
    const raw = await callDirectorModel(input.callModel, prompt, "剧情局部重写超时");
    const patch = parseStoryRewritePatch(raw);
    const patched = applyStoryRewritePatch(input.story, patch);
    const normalized = expandedStorySchema.parse(normalizeDirectorStory(patched));
    const unsafeInstruction = findUnsafeRouteTask(normalized);
    if (unsafeInstruction) return input.story;
    const patchedReport = evaluateStoryQuality(normalized);
    return patchedReport.score > report.score ? normalized : input.story;
  } catch {
    return input.story;
  }
}

function parseStoryRewritePatch(raw: string): StoryRewritePatch {
  const parsed = JSON.parse(extractJson(raw));
  return parsed && typeof parsed === "object" ? parsed as StoryRewritePatch : {};
}

function applyStoryRewritePatch(story: ExpandedStory, patch: StoryRewritePatch): ExpandedStory {
  return {
    ...story,
    routeTeaser: patch.routeTeaser ?? story.routeTeaser,
    openingPremise: patch.openingPremise ?? story.openingPremise,
    truthSummary: patch.truthSummary ?? story.truthSummary,
    endingChoices: patch.endingChoices ?? story.endingChoices,
    nodes: story.nodes.map((node) => {
      const replacement = patch.nodes?.find((item) => item.id === node.id);
      return replacement ? { ...node, ...replacement, id: node.id, order: node.order } : node;
    })
  };
}

function buildQualityRewritePrompt(
  story: ExpandedStory,
  report: StoryQualityReport,
  target: StoryRewriteTarget,
  inspirationPack: InspirationPack
): string {
  const issues = report.issues
    .filter((issue) => target.kind === "nodes" ? target.nodeIds.includes(issue.target) : target.kind === "ending" ? issue.target === "ending" : true)
    .map((issue) => `${issue.code}:${issue.target}:${issue.message}`)
    .join("；");
  const trace = story.inspirationTrace ?? inspirationPack.trace;

  if (target.kind === "nodes") {
    const nodes = story.nodes.filter((node) => target.nodeIds.includes(node.id));
    return [
      "局部重写：只返回合法 JSON 对象，不要 Markdown，不要解释。",
      "目标：修复指定 CityWalk 站点的剧情质量问题，不重写整篇故事。",
      `灵感标签=${trace.tags.join("、")}；来源=${trace.sources.join("、")}。`,
      `问题=${issues}`,
      `可用证物=${story.evidence.map((item) => `${item.id}/第${item.unlocksAtNode}站/${item.title}:${item.content}`).join(" | ")}`,
      `当前节点=${JSON.stringify(nodes)}`,
      "返回形状：{\"nodes\":[完整node对象]}。",
      "要求：保留每个节点的id和order；contradiction.evidenceId必须使用当前站或之前已解锁证物；reasoning必须写出证词与证物的具体不一致；mainTask、hiddenTask、photoPrompt只能要求拍摄公共招牌、门牌、橱窗、导视、路牌、墙面或公共装置；不要进入私人区域、不要打扰路人、不要拍摄陌生人。"
    ].join("\n");
  }

  if (target.kind === "ending") {
    return [
      "局部重写：只返回合法 JSON 对象，不要 Markdown，不要解释。",
      "目标：只增强结局回收，不改变五站节点和证物。",
      `灵感标签=${trace.tags.join("、")}；来源=${trace.sources.join("、")}。`,
      `人物=${story.characters.map((item) => `${item.name}:${item.role}:${item.secretHint}`).join(" | ")}`,
      `当前truthSummary=${story.truthSummary}`,
      `当前endingChoices=${story.endingChoices.join("、")}`,
      `问题=${issues}`,
      "返回形状：{\"truthSummary\":\"...\",\"endingChoices\":[\"...\",\"...\"]}。",
      "要求：truthSummary必须回收至少一个人物动机，并解释最后选择的情感后果；不要提前新增危险行动。"
    ].join("\n");
  }

  return [
    "局部重写：只返回合法 JSON 对象，不要 Markdown，不要解释。",
    "目标：只增强开场和路线预告的新鲜度，不改变五站节点、证物和最终真相。",
    `灵感标签=${trace.tags.join("、")}；来源=${trace.sources.join("、")}。`,
    `当前openingPremise=${story.openingPremise}`,
    `当前routeTeaser=${JSON.stringify(story.routeTeaser)}`,
    `问题=${issues}`,
    "返回形状：{\"openingPremise\":\"...\",\"routeTeaser\":[{\"order\":1,\"locationName\":\"...\",\"teaser\":\"...\"},{\"order\":2,\"locationName\":\"...\",\"teaser\":\"...\"},{\"order\":3,\"locationName\":\"...\",\"teaser\":\"...\"},{\"order\":4,\"locationName\":\"...\",\"teaser\":\"...\"},{\"order\":5,\"locationName\":\"...\",\"teaser\":\"...\"}]}。",
    "要求：不要使用灵感标签不支持的信件、邮戳、旧书店老板模板；五条routeTeaser必须地点气质不同。"
  ].join("\n");
}

async function callDirectorModel(callModel: DirectorModelCall, prompt: string, timeoutLabel: string): Promise<string> {
  try {
    return await withTimeout(callModel(prompt), DIRECTOR_TIMEOUT_MS, timeoutLabel);
  } catch (error) {
    if (!isTruncatedCompletionError(error)) throw error;
  }
  return withTimeout(callModel(buildCompactJsonRetryPrompt(prompt)), DIRECTOR_TIMEOUT_MS, timeoutLabel);
}

function buildCompactJsonRetryPrompt(prompt: string): string {
  return [
    prompt,
    "",
    "上一次输出不是完整JSON，可能因为内容太长被截断。",
    "请重新输出一个更紧凑但字段完整的合法JSON对象：不要Markdown，不要注释，不要省略字段。",
    "长文本只写到刚好满足字段要求：openingPremise可压缩到180到260字，background约120到160字，sceneText约60到100字，npcMessage约20到40字。",
    "数组数量仍必须满足原要求，字符串内不要使用未转义换行。"
  ].join("\n");
}

function isRetryableJsonFailure(error: unknown, raw: string): boolean {
  return error instanceof SyntaxError || isProbablyTruncatedJson(raw);
}

function isTruncatedCompletionError(error: unknown): boolean {
  return error instanceof Error && /truncated|max_tokens|finish_reason=length/i.test(error.message);
}

function isProbablyTruncatedJson(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("{") && !trimmed.endsWith("}")) return true;
  if (trimmed.startsWith("[") && !trimmed.endsWith("]")) return true;
  return false;
}

export function parseDirectorJson(raw: string): ExpandedStory {
  const parsed = JSON.parse(extractJson(raw));
  return expandedStorySchema.parse(normalizeDirectorStory(parsed));
}

function normalizeStoryBase(value: unknown, fallbackTrace?: InspirationTrace): unknown {
  if (!value || typeof value !== "object") return value;
  const base = value as Record<string, unknown>;
  base.id ||= `deepseek-${Date.now().toString(36)}`;
  base.title ||= "城市里的未完成路线";
  base.playerRole ||= "城市档案志愿者";
  base.premise ||= `你收到一条关于「${base.title}」的城市路线记录，需要沿途核对线索。`;
  base.adventureType ||= inferAdventureType(base.inspirationTrace, base.title);
  base.openingPremise = ensureOpeningPremise(base.openingPremise, base);
  base.routeTeaser = normalizeRouteTeaser(base.routeTeaser, base);
  base.truthSummary ||= "这条路线真正要完成的，是把被误会打断的话重新送达。";
  base.endingChoices ||= ["归档真相", "留下新留言"];
  if (Array.isArray(base.endingChoices)) {
    base.endingChoices = base.endingChoices.map((choice) => stringifyLoose(choice)).filter(Boolean);
  }
  base.complianceNote ||= "DeepSeek 原创生成，本地状态机补齐结构并执行安全约束。";
  base.generatedBy = base.generatedBy === "mock" ? "mock" : "deepseek";
  base.inspirationTrace = normalizeInspirationTrace(base.inspirationTrace, fallbackTrace);
  base.dossier = normalizeDossier(base.dossier, base);
  if (!Array.isArray(base.characters)) base.characters = [];
  base.characters = (base.characters as unknown[]).map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : { name: item };
    return normalizeCharacter(record, index);
  });
  while ((base.characters as unknown[]).length < 3) {
    const index = (base.characters as unknown[]).length + 1;
    (base.characters as unknown[]).push({
      id: `char-${index}`,
      name: `线索人物${index}`,
      role: "见证者",
      publicInfo: "与路线上的旧记录有关。",
      secretHint: "知道一条尚未公开的线索。",
      testimony: "他/她声称自己只是偶然路过，没有接触旧物。",
      contradictionHint: "后续证物会证明他/她至少知道旧物去向。"
    });
  }
  base.playerRoles = normalizePlayerRoles(base.playerRoles, base);
  return base;
}

function normalizeStationPlan(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const plan = value as Record<string, unknown>;
  const hasCoreStationShape = Array.isArray(plan.evidence)
    && (Array.isArray(plan.timeline) || typeof plan.timeline === "string")
    && Array.isArray(plan.nodes);
  if (!hasCoreStationShape) return plan;

  const rawEvidence = Array.isArray(plan.evidence) ? plan.evidence : [];
  const evidence = rawEvidence.map((item, index) => normalizeStationEvidence(item, index));
  while (evidence.length < STORY_NODE_COUNT) {
    const index = evidence.length + 1;
    evidence.push({
      id: `ev-${index}`,
      title: `补充线索${index}`,
      kind: "记录",
      content: `第 ${index} 站解锁的补充记录。`,
      unlocksAtNode: index
    });
  }
  plan.evidence = evidence;

  if (typeof plan.timeline === "string") {
    plan.timeline = plan.timeline.split(/[；;。\n]/).map((item) => item.trim()).filter(Boolean);
  }
  if (!Array.isArray(plan.timeline)) plan.timeline = [];
  plan.timeline = (plan.timeline as unknown[]).map((item) => stringifyLoose(item)).filter(Boolean);
  while ((plan.timeline as string[]).length < STORY_NODE_COUNT) {
    (plan.timeline as string[]).push(`线索阶段 ${(plan.timeline as string[]).length + 1}`);
  }

  const evidenceIds = new Set(evidence.map((item) => stringifyLoose(item.id)).filter(Boolean));
  const rawNodes = Array.isArray(plan.nodes) ? plan.nodes : [];
  const nodes = rawNodes.slice(0, STORY_NODE_COUNT).map((item, index) => normalizeStationNode(item, index, evidenceIds));
  while (nodes.length < STORY_NODE_COUNT) {
    const index = nodes.length + 1;
    nodes.push(normalizeStationNode({
      id: `node-${index}`,
      order: index,
      locationName: "当前位置",
      locationTieIn: "当前位置与安全公共观察点相关。",
      sceneText: `第 ${index} 站的城市记录被恢复，你需要在安全的公共空间核对这一段线索。`,
      npcMessage: "档案系统：请继续核对现场线索。",
      evidenceIds: [`ev-${index}`],
      publicTask: `核对第 ${index} 站证词，并找出被证物推翻的说法。`,
      contradiction: {
        claim: "有人声称这条线索只是普通路过记录。",
        evidenceId: `ev-${index}`,
        reasoning: "当前证物与证词中的时间、地点或人物关系不一致，说明有人在压低自己的参与程度。"
      },
      suspectPressure: "这条矛盾会让一名人物的说法变得不可靠。",
      rolePerspectives: {
        "role-1": "档案员视角：这条记录的格式和时间戳值得怀疑。",
        "role-2": "旧友视角：这条记录触发了一段私人回忆。",
        "role-3": "亲属视角：这条记录可能涉及保护家人的动机。"
      },
      question: "这条线索说明了什么？",
      answerKeywords: ["线索", "地点"],
      safetyFallback: "如果现场不适合停留，切换为线上替代线索。",
      mainTask: `拍下第 ${index} 站的公共观察点，点亮主线标记。`,
      hiddenTask: `寻找第 ${index} 站照片里不影响通行的隐藏细节。`,
      photoPrompt: "拍摄路牌、店招、门口、橱窗或公共装置，不拍摄陌生人。",
      discovery: `第 ${index} 站会解锁一条新的城市冒险发现。`
    }, index - 1, evidenceIds));
  }
  plan.nodes = nodes;
  return plan;
}

function normalizeStationEvidence(item: unknown, index: number): Record<string, unknown> {
  const record = item && typeof item === "object" ? item as Record<string, unknown> : { content: item };
  const nodeNumber = coerceStoryNodeNumber(record.unlocksAtNode, index + 1);
  const title = stringifyLoose(record.title || record.name || record.content) || `证物${index + 1}`;
  const content = stringifyLoose(record.content || record.summary || record.description);
  record.id = `ev-${index + 1}`;
  record.title = title;
  record.kind = normalizeEvidenceKind(record.kind || title || content);
  record.content = ensureMinText(content, `${title}指向第 ${nodeNumber} 站的证词矛盾，需要和现场观察一起判断。`, 8);
  record.unlocksAtNode = nodeNumber;
  return record;
}

function normalizeEvidenceKind(value: unknown): EvidenceKind {
  const text = stringifyLoose(value);
  if ((EVIDENCE_KIND_VALUES as readonly string[]).includes(text)) return text as EvidenceKind;
  if (/照片|票根|信|小票|物|钥匙|旧物|明信片|录音/.test(text)) return "物证";
  if (/证词|口述|口供|聊天|短信|留言|目击|服务员|老板/.test(text)) return "证词";
  if (/观察|现场|地点|路牌|门牌|招牌|雕塑|桥|街角/.test(text)) return "地点观察";
  return "记录";
}

function normalizeStationNode(item: unknown, index: number, evidenceIds: Set<string>): Record<string, unknown> {
  const node = item && typeof item === "object" ? item as Record<string, unknown> : {};
  const order = coerceStoryNodeNumber(node.order, index + 1);
  const fallbackEvidenceId = evidenceIds.has(`ev-${order}`) ? `ev-${order}` : Array.from(evidenceIds)[0] || "ev-1";
  const locationName = stringifyLoose(node.locationName || node.location || "当前位置") || "当前位置";
  const photoFallback = publicPhotoTask(locationName);
  const publicTask = sanitizePublicPhotoTask(
    ensureMinText(node.publicTask, photoFallback, 8),
    photoFallback
  );
  const locationTieIn = ensureMinText(
    node.locationTieIn,
    `${locationName}与当前位置、安全公共空间和本轮路线观察相连。`,
    10
  );
  const npcMessage = ensureMinText(
    node.npcMessage,
    "档案系统：不要急着下结论，先把地点、时间和证物重新对齐。",
    20
  );
  const contradiction = normalizeStationContradiction(node.contradiction, fallbackEvidenceId);

  node.id = stringifyLoose(node.id) || `node-${order}`;
  node.order = order;
  node.locationName = locationName;
  node.locationTieIn = locationTieIn;
  node.publicTask = publicTask;
  node.contradiction = contradiction;
  node.sceneText = ensureMinText(
    node.sceneText,
    `${locationTieIn}${publicTask}${contradiction.reasoning}请停留在安全的公共位置，把现场细节和已知证物联系起来。`,
    50
  );
  node.npcMessage = npcMessage;
  node.evidenceIds = normalizeEvidenceIds(node.evidenceIds, evidenceIds, fallbackEvidenceId);
  node.suspectPressure = ensureMinText(
    node.suspectPressure,
    `第 ${order} 站的矛盾会让一名人物的说法变得不可靠，尤其是他/她对时间和关系的描述。`,
    8
  );
  node.rolePerspectives = normalizeStationRolePerspectives(node.rolePerspectives, order);
  node.question = ensureMinText(node.question, "这条线索说明了什么？", 8);
  node.answerKeywords = normalizeStringList(node.answerKeywords, ["线索", "地点"], 1);
  node.safetyFallback = ensureMinText(node.safetyFallback, "如果现场不适合停留，切换为线上替代线索。", 8);
  node.mainTask = sanitizePublicPhotoTask(
    ensureMinText(node.mainTask ?? node.publicTask, `拍下${locationName}的公共观察点，点击主线标记推进下一站。`, 8),
    photoFallback
  );
  node.hiddenTask = sanitizePublicPhotoTask(
    ensureMinText(node.hiddenTask, `在${locationName}照片里寻找一个可选隐藏细节。`, 8),
    `在${locationName}照片里寻找一个不影响通行的公共边角细节。`
  );
  node.photoPrompt = sanitizePublicPhotoTask(
    ensureMinText(node.photoPrompt, photoFallback, 8),
    photoFallback
  );
  node.discovery = ensureMinText(node.discovery, `第 ${order} 站会让这场城市冒险出现新的方向。`, 8);
  return node;
}

function publicPhotoTask(locationName: string): string {
  return `拍摄${locationName}附近的公共招牌、门牌、橱窗、入口或导视信息，寻找与案卷关键词相关的细节。`;
}

function sanitizePublicPhotoTask(value: string, fallback: string): string {
  const text = value.trim();
  const riskyOfflineAction = /询问|打扰|收集|拿起|拿走|触碰|翻动|店内|内部|顾客|店员|老板|进店|进入/;
  const publicAnchor = /公共|招牌|店招|门牌|门头|橱窗|导视|入口|路牌|地铁口|公告栏|长椅|梧桐|花园|路口|街角|墙面/;
  if (!text || containsUnsafeInstruction(text) || riskyOfflineAction.test(text)) return fallback;
  if (!publicAnchor.test(text)) return fallback;
  if (!/拍|照片|观察|公共|招牌|门牌|橱窗|导视|入口|路牌/.test(text)) return `${text} ${fallback}`;
  return text;
}

function normalizeStationContradiction(value: unknown, fallbackEvidenceId: string): Record<string, unknown> {
  const contradiction = value && typeof value === "object" ? value as Record<string, unknown> : {};
  contradiction.claim = ensureMinText(contradiction.claim, "有人声称这条线索只是普通路过记录。", 8);
  contradiction.evidenceId = fallbackEvidenceId;
  contradiction.reasoning = ensureMinText(
    contradiction.reasoning,
    "当前证物与证词中的时间、地点或人物关系不一致，说明有人在压低自己的参与程度。",
    16
  );
  return contradiction;
}

function normalizeEvidenceIds(value: unknown, evidenceIds: Set<string>, fallbackEvidenceId: string): string[] {
  const ids = Array.isArray(value)
    ? value.map((item) => stringifyLoose(item)).filter((item) => evidenceIds.has(item))
    : typeof value === "string" && evidenceIds.has(value)
      ? [value]
      : [];
  return ids.length > 0 ? ids : [fallbackEvidenceId];
}

function normalizeStationRolePerspectives(value: unknown, order: number): Record<string, string> {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    "role-1": ensureMinText(input["role-1"] ?? input["城市档案员"], `档案员视角：第 ${order} 站最重要的是核对记录格式和时间戳。`, 12),
    "role-2": ensureMinText(input["role-2"] ?? input["失踪者旧友"], `旧友视角：第 ${order} 站的地点细节像一段被刻意压低的私人回忆。`, 12),
    "role-3": ensureMinText(input["role-3"] ?? input["当事人亲属"], `亲属视角：第 ${order} 站的矛盾可能来自保护家人的动机。`, 12)
  };
}

function coerceStoryNodeNumber(value: unknown, fallback: number): number {
  const text = stringifyLoose(value);
  const parsed = Number.isFinite(Number(value)) ? Number(value) : Number(text.match(/\d+/)?.[0]);
  const numeric = Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
  return Math.min(Math.max(numeric, 1), STORY_NODE_COUNT);
}

function ensureMinText(value: unknown, fallback: string, min: number): string {
  const text = stringifyLoose(value).trim();
  const combined = text ? `${text}${/[。！？!?]$/.test(text) ? "" : "。"}${fallback}` : fallback;
  return text.length >= min ? text : combined;
}

function normalizeDirectorStory(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const story = value as Record<string, unknown>;
  story.id ||= `deepseek-${Date.now().toString(36)}`;
  story.title ||= "城市里的未完成路线";
  story.playerRole ||= "城市档案志愿者";
  story.premise ||= `你收到一条关于「${story.title}」的城市路线记录，需要沿途核对线索。`;
  story.adventureType ||= inferAdventureType(story.inspirationTrace, story.title);
  story.openingPremise = ensureOpeningPremise(story.openingPremise, story);
  story.routeTeaser = normalizeRouteTeaser(story.routeTeaser, story);
  story.truthSummary ||= "这条路线真正要完成的，是把被误会打断的话重新送达。";
  story.endingChoices ||= ["归档真相", "留下新留言"];
  story.complianceNote ||= "DeepSeek 原创生成，本地状态机补齐结构并执行安全约束。";
  story.generatedBy = story.generatedBy === "mock" ? "mock" : "deepseek";
  story.inspirationTrace = normalizeInspirationTrace(story.inspirationTrace);
  story.dossier = normalizeDossier(story.dossier, story);

  if (Array.isArray(story.endingChoices)) {
    story.endingChoices = story.endingChoices.map((choice) => stringifyLoose(choice));
  }

  if (!Array.isArray(story.characters)) story.characters = [];
  story.characters = (story.characters as unknown[]).map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : { name: item };
    return normalizeCharacter(record, index);
  });
  while ((story.characters as unknown[]).length < 3) {
    const index = (story.characters as unknown[]).length + 1;
    (story.characters as unknown[]).push({
      id: `char-${index}`,
      name: `线索人物${index}`,
      role: "见证者",
      publicInfo: "与路线上的旧记录有关。",
      secretHint: "知道一条尚未公开的线索。",
      testimony: "他/她声称自己只是偶然路过，没有接触旧物。",
      contradictionHint: "后续证物会证明他/她至少知道旧物去向。"
    });
  }

  story.playerRoles = normalizePlayerRoles(story.playerRoles, story);

  if (typeof story.timeline === "string") {
    story.timeline = story.timeline.split(/[；;。\n]/).map((item) => item.trim()).filter(Boolean);
  }
  if (!Array.isArray(story.timeline)) story.timeline = [];
  if (Array.isArray(story.timeline)) {
    const timeline = story.timeline.map((item) => stringifyLoose(item));
    while (timeline.length < STORY_NODE_COUNT) timeline.push(`线索阶段 ${timeline.length + 1}`);
    story.timeline = timeline;
  }

  if (!Array.isArray(story.evidence)) story.evidence = [];
  story.evidence = (story.evidence as unknown[]).map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : { content: item };
    record.id ||= `ev-${index + 1}`;
    record.title ||= stringifyLoose(record.content).slice(0, 12) || `证物${index + 1}`;
    record.kind ||= "记录";
    record.content ||= `${record.title}指向路线中的第 ${index + 1} 个节点。`;
    record.unlocksAtNode ||= index + 1;
    return record;
  });
  while ((story.evidence as unknown[]).length < STORY_NODE_COUNT) {
    const index = (story.evidence as unknown[]).length + 1;
    (story.evidence as unknown[]).push({
      id: `ev-${index}`,
      title: `补充线索${index}`,
      kind: "记录",
      content: `第 ${index} 站解锁的补充记录。`,
      unlocksAtNode: index
    });
  }
  if (Array.isArray(story.evidence)) {
    story.evidence = story.evidence.map((item, index) => {
      if (!item || typeof item !== "object") return item;
      const evidence = item as Record<string, unknown>;
      const numericNode = Number(evidence.unlocksAtNode);
      evidence.id = `ev-${index + 1}`;
      evidence.unlocksAtNode = Number.isFinite(numericNode) ? numericNode : index + 1;
      if (!["物证", "证词", "记录", "地点观察"].includes(String(evidence.kind))) evidence.kind = "记录";
      return evidence;
    });
  }
  if (Array.isArray(story.playerRoles)) {
    const evidenceIds = new Set((story.evidence as Array<Record<string, unknown>>).map((item) => String(item.id)));
    story.playerRoles = story.playerRoles.map((item, index) => {
      if (!item || typeof item !== "object") return item;
      const role = item as Record<string, unknown>;
      const current = Array.isArray(role.startingClueIds)
        ? role.startingClueIds.map((id) => stringifyLoose(id)).filter((id) => evidenceIds.has(id))
        : [];
      role.startingClueIds = current.length > 0 ? current : [`ev-${Math.min(index + 1, STORY_NODE_COUNT)}`];
      return role;
    });
  }

  if (!Array.isArray(story.nodes)) story.nodes = [];
  while ((story.nodes as unknown[]).length < STORY_NODE_COUNT) {
    const index = (story.nodes as unknown[]).length + 1;
    (story.nodes as unknown[]).push({
      sceneText: `第 ${index} 站的城市记录被恢复，你需要在安全的公共空间核对这一段线索。`,
      question: "这条线索说明了什么？"
    });
  }
  if (Array.isArray(story.nodes)) {
    story.nodes = story.nodes.map((item, index) => {
      if (!item || typeof item !== "object") return item;
      const node = item as Record<string, unknown>;
      const order = Number(node.order) || index + 1;
      node.id = typeof node.id === "string" ? node.id : `node-${order}`;
      node.order = order;
      node.evidenceIds = [`ev-${Math.min(order, STORY_NODE_COUNT)}`];
      const evidenceIds = node.evidenceIds as string[];
      const evidenceId = evidenceIds[0];
      node.safetyFallback ||= "如果现场不适合停留，切换为线上替代线索。";
      const locationName = stringifyLoose(node.locationName || "当前位置");
      const locationTieIn = stringifyLoose(node.locationTieIn || `${locationName}与当前位置相关`);
      const sceneText = stringifyLoose(node.sceneText);
      const npcMessage = stringifyLoose(node.npcMessage);
      const question = stringifyLoose(node.question);
      node.publicTask ||= `核对第 ${order} 站证词，并找出被证物推翻的说法。`;
      if (!node.contradiction || typeof node.contradiction !== "object") {
        node.contradiction = {
          claim: "有人声称这条线索只是普通路过记录。",
          evidenceId,
          reasoning: "当前证物与证词中的时间、地点或人物关系不一致，说明有人在压低自己的参与程度。"
        };
      } else {
        const contradiction = node.contradiction as Record<string, unknown>;
        contradiction.claim ||= "有人声称这条线索只是普通路过记录。";
        contradiction.evidenceId ||= evidenceId;
        contradiction.reasoning ||= "当前证物与证词中的时间、地点或人物关系不一致，说明有人在压低自己的参与程度。";
      }
      node.suspectPressure ||= "这条矛盾会让一名人物的说法变得不可靠。";
      node.rolePerspectives = normalizeRolePerspectives(node.rolePerspectives, story.playerRoles as Array<Record<string, unknown>>, order);
      if (typeof node.answerKeywords === "string") {
        node.answerKeywords = node.answerKeywords.split(/[、,，/]/).map((item) => item.trim()).filter(Boolean);
      }
      if (!Array.isArray(node.answerKeywords) || node.answerKeywords.length === 0) {
        node.answerKeywords = ["线索", "地点"];
      }
      node.locationName = locationName;
      node.locationTieIn = locationTieIn.length >= 10 ? locationTieIn : `${locationName}与当前位置和现场观察相连。`;
      const expandedScene = sceneText.length >= 50 ? sceneText : `${sceneText}${node.locationTieIn}${npcMessage}`;
      node.sceneText = expandedScene.length >= 50 ? expandedScene : `${expandedScene}请在安全位置观察公共细节，并把它和已知线索联系起来。`;
      const expandedNpc = npcMessage.length >= 20 ? npcMessage : `${npcMessage}请继续核对现场线索。`;
      node.npcMessage = expandedNpc.length >= 20 ? expandedNpc : `${expandedNpc}不要急着下结论，先把地点、时间和证物重新对齐。`;
      node.question = question.length >= 8 ? question : `${question}你认为这说明什么？`;
      node.mainTask = ensureMinText(node.mainTask ?? node.publicTask, `拍下${locationName}的公共观察点，点击主线标记推进下一站。`, 8);
      node.hiddenTask = ensureMinText(node.hiddenTask, `在${locationName}照片里寻找一个可选隐藏细节。`, 8);
      node.photoPrompt = ensureMinText(node.photoPrompt, `拍摄${locationName}附近的路牌、店招、门口、橱窗或公共装置，不拍摄陌生人。`, 8);
      node.discovery = ensureMinText(node.discovery, `第 ${order} 站会让这场城市冒险出现新的方向。`, 8);
      return node;
    });
  }

  return story;
}

function inferAdventureType(trace: unknown, title: unknown): string {
  const text = `${stringifyLoose(title)} ${JSON.stringify(trace ?? {})}`;
  if (/导航|路线|偏航|地图/.test(text)) return "秘密路线";
  if (/商场|楼层|出口|循环/.test(text)) return "空间寻踪";
  if (/玉器|奇物|命格|符/.test(text)) return "奇物委托";
  if (/直播|镜头|弹幕/.test(text)) return "直播谜局";
  if (/鬼|怪|传说|人鱼|狐|妖/.test(text)) return "都市异闻";
  if (/离婚|旧友|关系|恋人|家人/.test(text)) return "关系追踪";
  return "城市寻踪";
}

function ensureOpeningPremise(value: unknown, story: Record<string, unknown>): string {
  const existing = stringifyLoose(value);
  if (existing.length >= 300) return existing;
  const title = stringifyLoose(story.title || "未命名城市冒险");
  const adventureType = stringifyLoose(story.adventureType || "城市寻踪");
  const dossier = story.dossier && typeof story.dossier === "object" ? story.dossier as Record<string, unknown> : {};
  const background = stringifyLoose(dossier.background || story.premise);
  const locationAtmosphere = stringifyLoose(dossier.locationAtmosphere || "街角、店门、路牌和可以安全停留的公共空间");
  const opening = existing || background || `你在城市里收到一条和「${title}」有关的异常提示。`;
  return [
    `${opening}`,
    `你抵达起点时，街面还保留着天气和人流留下的痕迹，${locationAtmosphere}不再只是背景，而像一张刚加载出来的地图。手机里的任务界面没有急着告诉你答案，只把视野切成几层：眼前能看见的路牌、店门、橱窗、长椅和导视牌，照片里可能被点亮的主线标记，以及只会在边角出现的隐藏任务。`,
    `这不是一份坐在屏幕前读完的档案，而是一场「${adventureType}」式城市冒险。你需要带着手机走进真实街区，把现场当成可探索的场景：第一站确认起点为什么被选中，第二站找到路线停顿的原因，第三站从反光或方向标里重新判断去向，第四站让前面的发现连成关系，最后一站把所有照片标记收束成你的选择。`,
    `本局不会要求你进入私人区域、打扰路人或接触他人物品；所有线索都来自公共空间里的观察、照片和你选择的身份视角。你要做的不是机械答题，而是在每一站拍下现场，让照片上浮现主线任务和隐藏任务，再把这些发现连成一条可以走完的路线。`,
    `当五个地点的发现被拼在一起时，最初看似普通的城市细节会变成完整故事：谁留下了任务，为什么路线会指向这里，以及你最后要替这座城市完成哪一个选择。`
  ].join("");
}

function normalizeRouteTeaser(value: unknown, story: Record<string, unknown>): Array<Record<string, unknown>> {
  const nodes = Array.isArray(story.nodes) ? story.nodes as Array<Record<string, unknown>> : [];
  const existing = Array.isArray(value) ? value : [];
  const teasers = existing.slice(0, STORY_NODE_COUNT).map((item, index) => {
    const record: Record<string, unknown> = item && typeof item === "object" ? item as Record<string, unknown> : { teaser: item };
    const node = nodes[index] ?? {};
    const order = coerceStoryNodeNumber(record.order, index + 1);
    const locationName = stringifyLoose(record.locationName || node.locationName || `第 ${order} 站`);
    return {
      order,
      locationName,
      teaser: ensureMinText(record.teaser, `${locationName}会出现一个适合拍照识别的公共观察点，引出本章的新发现。`, 16)
    };
  });
  while (teasers.length < STORY_NODE_COUNT) {
    const order = teasers.length + 1;
    const node = nodes[order - 1] ?? {};
    const locationName = stringifyLoose(node.locationName || `第 ${order} 站`);
    teasers.push({
      order,
      locationName,
      teaser: `${locationName}会出现一个适合拍照识别的公共观察点，引出本章的新发现。`
    });
  }
  return teasers.map((item, index) => ({ ...item, order: index + 1 }));
}

function normalizeDossier(value: unknown, story: Record<string, unknown>): Record<string, unknown> {
  const dossier = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const title = stringifyLoose(dossier.title || story.title || "城市旧案档案");
  const background = stringifyLoose(dossier.background || story.premise);
  dossier.caseFileId ||= `CW-${new Date().getFullYear()}-${String(title).slice(0, 2)}`;
  dossier.caseType ||= "单人 CityWalk 剧本杀";
  dossier.title ||= title;
  dossier.incidentTime ||= "数年前的一个下午";
  dossier.locationAtmosphere ||= "旧街区、雨后路面、店铺橱窗与可以安全停留的公共空间共同构成调查现场。";
  dossier.background = background.length >= 120
    ? background
    : `${background} 这份档案最早来自一批被整理出的城市旧记录。记录里反复出现同一条路线、同一个没有说清的约定，以及几份彼此矛盾的证词。你需要先确认谁在隐瞒关系，再判断哪一件证物真正改变了事件的方向。`;
  dossier.knownFacts = normalizeStringList(dossier.knownFacts, ["档案里存在一条未完成路线", "至少一名当事人隐瞒了真实关系", "第一份证物会在起点被解锁"], 3);
  dossier.openQuestions = normalizeStringList(dossier.openQuestions, ["真正需要被找到的人是谁？", "最后一封信息为什么没有送达？"], 2);
  dossier.openingInstruction ||= "阅读案卷，选择你的调查身份，再开始第一站行动。";
  return dossier;
}

function normalizeInspirationTrace(value: unknown, fallback?: InspirationTrace): InspirationTrace {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const sources = normalizeStringList(input.sources, fallback?.sources ?? ["本地轻灵感素材"], 1)
    .map((item) => basenameForDisplay(item))
    .slice(0, 5);
  const tags = normalizeStringList(input.tags, fallback?.tags ?? ["城市漫游", "轻推理"], 1)
    .map((item) => item.slice(0, 20))
    .slice(0, 8);
  return {
    sources,
    tags,
    mode: stringifyLoose(input.mode || fallback?.mode || "轻灵感")
  };
}

function normalizePlayerRoles(value: unknown, story: Record<string, unknown>): Record<string, unknown>[] {
  const roles = Array.isArray(value) ? value : [];
  const normalized = roles.map((item, index) => {
    const record = item && typeof item === "object" ? item as Record<string, unknown> : { name: item };
    return normalizeRole(record, index);
  });
  const defaults = [
    {
      name: "许棠",
      roleTitle: "城市档案员",
      bio: "你负责整理旧城区改造前留下的异常档案，擅长把零散证物重新排列成时间线。",
      relationshipToCase: "你不是当事人，但你掌握案卷系统和第一批公共记录。",
      knownSecret: "你发现这份档案曾被人为改写过一次。",
      privateGoal: "确认谁改写了档案，并保护仍然活着的当事人。",
      voiceStyle: "冷静、克制、偏理性"
    },
    {
      name: "林望",
      roleTitle: "失踪者旧友",
      bio: "你曾与档案中的核心人物有过一段没有说完的关系，某些地点对你来说不是线索，而是回忆。",
      relationshipToCase: "你认识其中一名当事人，也知道他/她曾经害怕某个约定被公开。",
      knownSecret: "你隐约记得一张照片里少了一个本该出现的人。",
      privateGoal: "找回被你错过的那句解释，并判断是否公开它。",
      voiceStyle: "感性、犹豫、带有歉意"
    },
    {
      name: "周眠",
      roleTitle: "当事人亲属",
      bio: "你和事件中的某位当事人有亲缘或长期照护关系，知道外人不理解的一面。",
      relationshipToCase: "你接近真相，但也最容易被自己的立场影响判断。",
      knownSecret: "你知道有人曾经为了保护家人而撒谎。",
      privateGoal: "判断真相是否应该被完整公开，还是只送达给该知道的人。",
      voiceStyle: "谨慎、防备、重视情感后果"
    }
  ];
  while (normalized.length < 3) normalized.push(normalizeRole(defaults[normalized.length], normalized.length));
  return normalized.slice(0, 3).map((role, index) => ({
    ...role,
    id: `role-${index + 1}`,
    startingClueIds: normalizeStringList(role.startingClueIds, [`ev-${index + 1}`], 1).slice(0, 2),
    riskNote: ensureMinText(role.riskNote, "不要为了验证身份信息进入私人区域或打扰无关路人。", 6)
  }));
}

function normalizeRole(record: Record<string, unknown>, index: number): Record<string, unknown> {
  const fallbackNames = ["许棠", "林望", "周眠"];
  const fallbackTitles = ["城市档案员", "失踪者旧友", "当事人亲属"];
  record.name ||= fallbackNames[index] ?? `调查者${index + 1}`;
  record.roleTitle ||= stringifyLoose(record.role) || fallbackTitles[index] || "调查者";
  record.bio = ensureMinText(record.bio, `${record.name}以${record.roleTitle}的身份接近这份案卷，拥有不同于其他人的观察角度。`, 20);
  record.relationshipToCase = ensureMinText(record.relationshipToCase, "与案件中的关键地点或人物存在间接关系。", 8);
  record.knownSecret = ensureMinText(record.knownSecret, "掌握一条不适合在开场公开的私人信息。", 8);
  record.privateGoal = ensureMinText(record.privateGoal, "在不破坏安全边界的前提下完成自己的调查目标。", 8);
  record.voiceStyle = ensureMinText(record.voiceStyle, "克制、细致", 4);
  record.explorationAbility = ensureMinText(record.explorationAbility, "更容易发现现场照片里的公共标识和路线异常。", 4);
  record.hiddenObjective = ensureMinText(record.hiddenObjective ?? record.privateGoal, "完成一个不阻塞主线的隐藏探索目标。", 4);
  record.hintStyle = ensureMinText(record.hintStyle ?? record.voiceStyle, "用本身份的语气给出现场探索提示。", 4);
  return record;
}

function normalizeCharacter(record: Record<string, unknown>, index: number): Record<string, unknown> {
  record.id ||= `char-${index + 1}`;
  record.name ||= `角色${index + 1}`;
  record.role ||= stringifyLoose(record.description) || "线索相关人";
  record.publicInfo = ensureMinText(record.publicInfo ?? record.description, `${record.name}与这条路线有关，曾在公共地点留下过可核对的信息。`, 8);
  record.secretHint = ensureMinText(record.secretHint, "他/她保留了一段尚未说出的信息。", 6);
  record.testimony = ensureMinText(record.testimony, `${record.name}声称自己只看见了路线中的一部分，没有参与关键交接。`, 12);
  record.contradictionHint = ensureMinText(record.contradictionHint, "证物会显示这段说法遗漏了时间或地点细节。", 8);
  return record;
}

function normalizeStringList(value: unknown, fallback: string[], min: number): string[] {
  const list = Array.isArray(value)
    ? value.map((item) => stringifyLoose(item)).filter(Boolean)
    : typeof value === "string"
      ? value.split(/[；;。\n]/).map((item) => item.trim()).filter(Boolean)
      : [];
  while (list.length < min) list.push(fallback[list.length] ?? fallback[0] ?? "补充信息");
  return list;
}

function normalizeRolePerspectives(value: unknown, roles: Array<Record<string, unknown>>, order: number): Record<string, string> {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const output: Record<string, string> = {};
  for (const role of roles.slice(0, 3)) {
    const roleId = stringifyLoose(role.id);
    const roleTitle = stringifyLoose(role.roleTitle || role.name || "调查者");
    const perspective = stringifyLoose(input[roleId] ?? input[roleTitle]);
    output[roleId] = perspective.length >= 12
      ? perspective
      : `以${roleTitle}的视角，第 ${order} 站不只是地点线索，还暴露了证词里被刻意轻描淡写的关系。`;
  }
  return output;
}

function stringifyLoose(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = record.text ?? record.title ?? record.content ?? record.summary ?? record.choice ?? record.time;
    if (preferred) return stringifyLoose(preferred);
    return Object.values(record).map((item) => stringifyLoose(item)).filter(Boolean).join(" ");
  }
  return "";
}

export function containsUnsafeInstruction(text: string): boolean {
  return findUnsafeInstruction(text) !== null;
}

function findUnsafeInstruction(text: string): string | null {
  const unsafePattern = /私人住宅|翻越|闯入|撬|尾随|拦住陌生人|拍摄陌生人|横穿|施工区|深夜前往偏僻/;
  const safetyNegationPattern = /不要|不得|禁止|避免|请勿|无需|不需要|不能|不可|不应|不必|不涉及|不包含|不会涉及|不会要求|切勿|严禁|不进入|不拍摄|不横穿|不靠近|不前往|不要求|不打扰/;
  return text
    .split(/[。！？!?；;\n]/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .find((sentence) => unsafePattern.test(sentence) && !safetyNegationPattern.test(sentence)) ?? null;
}

function findUnsafeRouteTask(story: ExpandedStory): string | null {
  for (const node of story.nodes) {
    const actionText = [
      node.publicTask,
      node.mainTask,
      node.hiddenTask,
      node.photoPrompt
    ].join("。");
    const unsafe = findUnsafeInstruction(actionText);
    if (unsafe) return unsafe;
  }
  return null;
}

export function createMockExpandedStory(input: DirectorInput): ExpandedStory {
  const geo = normalizeGeo(input.geo);
  const seed = input.modules[0];
  const motif = seed?.title ?? "迟到的信";
  const city = input.city ?? "这座城市";
  const locationBase = geo.landmarkName || `${city}的一处街角`;
  const placeType = geo.placeType || "老街 / 公共空间";
  const details = geo.nearbyDetails || "附近有可以安全停留的公共空间、店铺橱窗和路牌";
  const storyId = `expanded-${Date.now().toString(36)}`;
  const rolePerspectives = (stage: string) => ({
    "role-1": `档案员视角：${stage}最可疑的是记录格式被改过，时间戳和地点描述不像同一人录入。`,
    "role-2": `旧友视角：${stage}触发了一段私人回忆，称呼和语气说明当事人并非完全陌生。`,
    "role-3": `亲属视角：${stage}让你意识到有人在保护家人，所以证词会故意绕开真正关系。`
  });

  return {
    id: storyId,
    title: `${locationBase}的未完成路线`,
    playerRole: "城市档案志愿者",
    premise: `你在${locationBase}附近测试城市档案系统时，收到一条和「${motif}」有关的异常记录。系统判断这不是案件复刻，而是一段需要被重新编排的城市记忆。`,
    adventureType: /导航|路线|商场/.test(motif) ? "秘密路线" : "城市寻踪",
    openingPremise: ensureOpeningPremise("", {
      title: `${locationBase}的未完成路线`,
      adventureType: /导航|路线|商场/.test(motif) ? "秘密路线" : "城市寻踪",
      premise: `你在${locationBase}附近测试城市档案系统时，收到一条和「${motif}」有关的异常记录。系统判断这不是案件复刻，而是一段需要被重新编排的城市记忆。`,
      dossier: {
        locationAtmosphere: `${locationBase}、${placeType}与${details}共同构成一条可以步行复核的公共路线。`
      }
    }),
    routeTeaser: [
      { order: 1, locationName: locationBase, teaser: "起点会把现实地标变成第一块任务面板，玩家需要拍下公共观察点来点亮主线。" },
      { order: 2, locationName: `${placeType.split("/")[0]?.trim() || "附近街角"}的停留点`, teaser: "第二站会出现路线与现场细节不一致的地方，适合寻找隐藏标记。" },
      { order: 3, locationName: `${locationBase}附近的橱窗/路牌`, teaser: "第三站把反光、路牌或店招变成可点击线索，让玩家重新判断方向。" },
      { order: 4, locationName: `${placeType.split("/")[1]?.trim() || "附近公共点"}的转折点`, teaser: "第四站会让前三站的发现开始连成真正任务，而不是单独的地点碎片。" },
      { order: 5, locationName: `${locationBase}的安全终点`, teaser: "终点会回收照片标记、隐藏线索和玩家身份，给出最后选择。" }
    ],
    dossier: {
      caseFileId: `CW-${new Date().getFullYear()}-${storyId.slice(-4).toUpperCase()}`,
      caseType: input.preference || "失踪旧案",
      title: `${locationBase}的未完成路线`,
      incidentTime: "七年前的雨后下午",
      locationAtmosphere: `${locationBase}、${placeType}与${details}共同构成一条可以步行复核的公共路线。`,
      background: `这份案卷来自旧城区整理出的一组异常城市记录。七年前，一件与「${motif}」有关的旧物在${locationBase}附近被错误交付，此后几个当事人对同一天的说法始终无法对齐。有人坚持那只是一次失约，有人认为真正的收件人从未出现，也有人把关键证据藏在${placeType}附近的日常痕迹里。你收到的任务不是复述原案，而是以新的身份重新走完这条路线，确认谁隐瞒了关系、哪一件证物改变了时间线，以及最后那句迟到的话应该被送到谁手里。`,
      knownFacts: [
        `起点记录指向${locationBase}附近的一件旧物。`,
        `${placeType}附近至少出现过一份与时间线有关的证物。`,
        "案卷中有一名当事人被写成无关路人，但他/她可能才是关键人物。"
      ],
      openQuestions: [
        "真正需要收到最后信息的人是谁？",
        "当年的失约到底是误会、隐瞒，还是保护？"
      ],
      openingInstruction: "阅读案卷，选择你的调查身份，再开始第一站行动。"
    },
    playerRoles: [
      {
        id: "role-1",
        name: "许棠",
        roleTitle: "城市档案员",
        bio: "你负责整理旧城区改造前留下的异常档案，擅长把零散证物重新排列成时间线。",
        relationshipToCase: "你不是当事人，但你掌握案卷系统和第一批公共记录。",
        knownSecret: "你发现这份档案曾被人为改写过一次。",
        privateGoal: "确认谁改写了档案，并保护仍然活着的当事人。",
        startingClueIds: ["ev-postmark"],
        voiceStyle: "冷静、克制、偏理性",
        riskNote: "不要为了验证档案进入私人区域。",
        explorationAbility: "更容易发现路线、编号和公共标识里的异常。",
        hiddenObjective: "找出这条路线最早被谁改写。",
        hintStyle: "给出克制、理性的现场观察提示。"
      },
      {
        id: "role-2",
        name: "林望",
        roleTitle: "失踪者旧友",
        bio: "你曾与档案中的核心人物有过一段没有说完的关系，某些地点对你来说不是线索，而是回忆。",
        relationshipToCase: "你认识其中一名当事人，也知道他/她曾经害怕某个约定被公开。",
        knownSecret: "你隐约记得一张照片里少了一个本该出现的人。",
        privateGoal: "找回被你错过的那句解释，并判断是否公开它。",
        startingClueIds: ["ev-receipt"],
        voiceStyle: "感性、犹豫、带有歉意",
        riskNote: "不要把私人记忆当成最终证据。",
        explorationAbility: "更容易解锁留言、照片和地点回忆类隐藏任务。",
        hiddenObjective: "确认自己错过的那句解释是否还能送达。",
        hintStyle: "给出带有情绪联想的提示。"
      },
      {
        id: "role-3",
        name: "周眠",
        roleTitle: "当事人亲属",
        bio: "你和事件中的某位当事人有亲缘或长期照护关系，知道外人不理解的一面。",
        relationshipToCase: "你接近真相，但也最容易被自己的立场影响判断。",
        knownSecret: "你知道有人曾经为了保护家人而撒谎。",
        privateGoal: "判断真相是否应该被完整公开，还是只送达给该知道的人。",
        startingClueIds: ["ev-window"],
        voiceStyle: "谨慎、防备、重视情感后果",
        riskNote: "不要为了确认关系打扰无关路人。",
        explorationAbility: "更容易识别被保护的人、遮挡的信息和关系线索。",
        hiddenObjective: "判断哪些真相需要公开，哪些只该交给当事人。",
        hintStyle: "给出谨慎、偏保护的提示。"
      }
    ],
    truthSummary: `真正需要被送达的不是物品，而是当年被误会打断的一次告别；最后的选择会决定这段记忆如何留在${locationBase}。`,
    endingChoices: ["把证据交给档案馆", "替当事人留下新留言", "把旧物转交给下一位路过者"],
    generatedBy: "mock",
    inspirationTrace: {
      sources: [basenameForDisplay(seed?.source_path ?? "本地轻灵感素材")],
      tags: unique([motif, ...(seed?.facets?.conflicts ?? []), ...(seed?.genres ?? [])]).slice(0, 6),
      mode: "轻灵感"
    },
    complianceNote: "输出为原创化扩写，只使用抽象标签和地点变量，不复用原文长段。",
    characters: [
      {
        id: "char-archivist",
        name: "许棠",
        role: "档案系统维护员",
        publicInfo: `她让你从${locationBase}开始核对一条异常路线。`,
        secretHint: "她知道第一条记录被人故意改过。",
        testimony: "许棠声称档案系统只保存公共记录，任何私人关系都不应出现在路线里。",
        contradictionHint: "模糊邮戳和改写痕迹说明这份档案曾被人为筛掉私人关系。"
      },
      {
        id: "char-witness",
        name: "林望",
        role: "旧物保管人",
        publicInfo: `他常在${placeType}附近帮人寄存小物。`,
        secretHint: "他保管的并不是物品本身，而是一段未说出口的道歉。",
        testimony: "林望说她当天是一个人离开，没有等人，也没有留下第二份订单。",
        contradictionHint: "双人小票显示同一分钟出现两份相同订单，他的说法少了一个人。"
      },
      {
        id: "char-owner",
        name: "周眠",
        role: "真正收件人",
        publicInfo: "她在记录里一直被写成无关路人。",
        secretHint: "她才是这条路线最后要抵达的人。",
        testimony: "周眠坚持自己只是路过，从未收到也不该收到那条未发送留言。",
        contradictionHint: "橱窗倒影和留言署名残痕都把她推回路线中心。"
      }
    ],
    evidence: [
      { id: "ev-postmark", title: "模糊邮戳", kind: "物证", content: `${locationBase}附近的邮戳被雨水晕开，只剩下街区首字和日期。`, unlocksAtNode: 1 },
      { id: "ev-receipt", title: "双人小票", kind: "记录", content: `小票显示${placeType}附近曾在同一分钟出现两份相同订单。`, unlocksAtNode: 2 },
      { id: "ev-window", title: "橱窗倒影", kind: "地点观察", content: `${details}。倒影里有一块方向牌，指向第三个安全停留点。`, unlocksAtNode: 3 },
      { id: "ev-message", title: "未发送留言", kind: "证词", content: "留言写给真正的收件人，但署名被刻意擦掉。", unlocksAtNode: 4 },
      { id: "ev-choice", title: "结局回执", kind: "记录", content: "回执上只留下三个选项：归档、留下、转交。", unlocksAtNode: 5 }
    ],
    timeline: [
      `15:00 你在${locationBase}收到档案异常提醒。`,
      "15:12 第一份物证显示路线被人为改写。",
      `15:28 ${placeType}附近的现场观察指出第二位当事人存在。`,
      "15:45 所有线索汇合到一次未完成的告别。",
      "16:00 玩家必须决定最后的信息如何被送达。"
    ],
    nodes: [
      {
        id: "node-1",
        order: 1,
        locationName: locationBase,
        locationTieIn: `以${locationBase}作为起点，玩家先观察附近可安全停留的路牌、橱窗或门口。`,
        sceneText: `小雨把${locationBase}的边缘洗得很亮。你站在不妨碍通行的位置，档案系统弹出第一条记录：一件与「${motif}」有关的旧物曾在这里被交给错误的人。屏幕上没有原故事的片段，只有被抽象后的线索：地点、时间、缺席者。`,
        npcMessage: "许棠：先别急着找答案。看现场，真正重要的是它被放在这里，而不是它来自哪里。",
        evidenceIds: ["ev-postmark"],
        publicTask: "核对邮戳和档案改写痕迹，判断谁把私人关系从记录里删掉。",
        contradiction: {
          claim: "许棠声称档案系统只保存公共记录，因此私人关系不重要。",
          evidenceId: "ev-postmark",
          reasoning: "邮戳被雨水晕开却保留了街区首字，说明有人保留地点、抹去收件关系，这不是普通归档。"
        },
        suspectPressure: "许棠的系统记录变得可疑，她可能知道第一条记录为什么被改写。",
        rolePerspectives: rolePerspectives("第一站"),
        question: "第一站最应该确认的线索是什么？",
        answerKeywords: ["邮戳", "地址", "旧物", "第一条线索"],
        safetyFallback: "如果现场拥挤或下雨变大，直接查看系统里的邮戳备份图。",
        mainTask: "拍下起点附近的公共标识，点击照片里的主线任务标记。",
        hiddenTask: "寻找照片里与路线记录不一致的小标记。",
        photoPrompt: "拍摄路牌、店门、橱窗或公共标识，不拍摄陌生人。",
        discovery: "起点照片会证明这条路线不是普通导航，而是被人改写过的城市任务。"
      },
      {
        id: "node-2",
        order: 2,
        locationName: `${placeType.split("/")[0]?.trim() || "附近街角"}的停留点`,
        locationTieIn: `${locationBase}周边的${placeType}成为第二站，剧情引用用户填写的现场细节：${details}。`,
        sceneText: `你沿着安全人行路线移动到${placeType}的停留点。这里不是随机地点：${details}。系统恢复出一张双人小票，说明当年的“独自离开”并不成立。某个人在这里等过，也有人故意把等待写成了路过。`,
        npcMessage: "林望：她不是没来，她来了两次。第一次为了告别，第二次为了把话咽回去。",
        evidenceIds: ["ev-receipt"],
        publicTask: "用双人小票反驳“独自离开”的证词，确认当时是否有人在等她。",
        contradiction: {
          claim: "林望说她当天是一个人离开，没有等任何人。",
          evidenceId: "ev-receipt",
          reasoning: "同一分钟的两份相同订单证明现场至少有两个人，所谓独自离开是在掩盖等待关系。"
        },
        suspectPressure: "林望的证词被小票压住，他隐瞒了自己和等待对象的关系。",
        rolePerspectives: rolePerspectives("第二站"),
        question: "这张小票推翻了哪一个判断？",
        answerKeywords: ["独自", "两份", "等待", "双人小票"],
        safetyFallback: "如果店铺关闭，只读取门口小票照片，不进入店内。",
        mainTask: "拍下第二站的店招或公共停留点，确认路线为什么在这里停住。",
        hiddenTask: "寻找照片里能对应双人小票的第二个细节。",
        photoPrompt: "拍摄店门、价目牌、路口或公共座位，避开顾客和店员正脸。",
        discovery: "第二站会让玩家发现所谓独自离开并不成立。"
      },
      {
        id: "node-3",
        order: 3,
        locationName: `${locationBase}附近的橱窗/路牌`,
        locationTieIn: `第三站继续围绕${locationBase}和现场观察展开，不要求进入私人区域。`,
        sceneText: `你回到可以看见橱窗或路牌的位置。倒影把街道分成两层：真实的${locationBase}，和档案里被重排过的路线。你注意到方向牌与小票时间能对应上，说明真正的收件人不是记录里的那个人。`,
        npcMessage: "周眠：如果你已经看到方向牌，就别再问谁撒谎了。问问谁一直在替别人保留退路。",
        evidenceIds: ["ev-window"],
        publicTask: "观察橱窗倒影和方向牌，判断真正收件人是否被写成无关路人。",
        contradiction: {
          claim: "周眠坚持自己只是路过，并不是最后信息的收件人。",
          evidenceId: "ev-window",
          reasoning: "倒影里的方向牌把小票时间和她的出现位置连在一起，她不是路过，而是被刻意排除的中心人物。"
        },
        suspectPressure: "周眠越强调无关，越说明她知道留言为何不能公开。",
        rolePerspectives: rolePerspectives("第三站"),
        question: "第三站指出真正被隐藏的是什么？",
        answerKeywords: ["收件人", "方向牌", "退路", "隐藏"],
        safetyFallback: "如果无法观察橱窗或路牌，系统改用线上街景式示意图。",
        mainTask: "拍下橱窗、路牌或方向标，点亮照片里的方向任务。",
        hiddenTask: "寻找倒影或边角中被忽略的路线提示。",
        photoPrompt: "拍摄橱窗反光、路牌、方向牌或公共墙面，不进入私人空间。",
        discovery: "第三站会把看似路过的人推回路线中心。"
      },
      {
        id: "node-4",
        order: 4,
        locationName: `${placeType.split("/")[1]?.trim() || "附近公共点"}的转折点`,
        locationTieIn: `第四站继续使用${details}中的公共观察点，揭示真正收件人线索。`,
        sceneText: `你在安全停留点重新对照前三份证物，发现邮戳、小票和倒影并不是三条独立线索，而是在指向同一个被隐藏的收件人。未发送留言出现时，案卷里那位“无关路人”第一次变得重要。`,
        npcMessage: "周眠：别问谁最可疑，先问谁一直被排除在叙述之外。",
        evidenceIds: ["ev-message"],
        publicTask: "核对未发送留言的称呼和署名残痕，判断隐瞒是恶意还是保护。",
        contradiction: {
          claim: "所有人都把无关路人当成路线之外的人。",
          evidenceId: "ev-message",
          reasoning: "留言内容写给真正收件人，署名却被擦掉，说明有人不是为了嫁祸，而是为了保护对方身份。"
        },
        suspectPressure: "三名人物都不再完全可信，因为他们都从不同角度保护同一个名字。",
        rolePerspectives: rolePerspectives("第四站"),
        question: "第四站的转折说明真正被隐藏的是什么？",
        answerKeywords: ["收件人", "路人", "隐藏", "留言"],
        safetyFallback: "如果现场无法停留，系统直接展示未发送留言备份。",
        mainTask: "拍下第四站的公共观察点，确认前三个标记指向同一个名字。",
        hiddenTask: "寻找照片里像留言、贴纸或编号的隐藏信息。",
        photoPrompt: "拍摄公共提示牌、墙面贴纸、店外装饰或开放空间标记。",
        discovery: "第四站会说明隐瞒不一定是恶意，也可能是在保护某个人。"
      },
      {
        id: "node-5",
        order: 5,
        locationName: `${locationBase}的安全终点`,
        locationTieIn: `终点仍落在${locationBase}附近，保证玩家不用被引导到陌生偏僻地点。`,
        sceneText: `最后一站不再要求你寻找更多证据。档案系统把五条线索并排放在屏幕上：邮戳、小票、倒影、未发送留言和结局回执。你终于明白，这条路线不是为了找出谁错了，而是把一句迟到的话送到还能被接住的地方。`,
        npcMessage: "许棠：你可以把它归档，也可以替他们留下新的版本。城市记得哪一种，取决于你。",
        evidenceIds: ["ev-choice"],
        publicTask: "整理五条证物链，决定公开、保留还是转交最后的留言。",
        contradiction: {
          claim: "这条路线只是一次旧物错递，没有真正需要承担后果的人。",
          evidenceId: "ev-choice",
          reasoning: "五条证物连起来后，旧物错递只是表层，真正的矛盾是有人用谎言保护关系，也让告别迟到了多年。"
        },
        suspectPressure: "所有人物的谎言都回到同一个动机：保护真正收件人。",
        rolePerspectives: rolePerspectives("第五站"),
        question: "你选择如何处理最后的留言？",
        answerKeywords: ["归档", "留下", "转交", "留言"],
        safetyFallback: "如遇夜间或恶劣天气，终点自动切换为线上结局页。",
        mainTask: "拍下安全终点的公共标识，点击最终主线标记完成路线。",
        hiddenTask: "寻找一个能代表你选择的现场细节作为结局纪念。",
        photoPrompt: "拍摄终点附近的路牌、天空、街角或公共空间，不拍摄陌生人。",
        discovery: "终点会把五站照片里的主线标记合成最后选择。"
      }
    ]
  };
}

async function callDeepSeek(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY is missing");

  const body: DeepSeekChatBody = {
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
    messages: [
      {
        role: "system",
        content: "你是 CityWalk 单人叙事游戏导演。只输出合法 JSON，不要输出 Markdown。"
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" },
    max_tokens: getDeepSeekMaxTokens(),
    temperature: 0.65,
    // DeepSeek V4 defaults to thinking mode, which is too slow for this interactive JSON generation path.
    thinking: { type: "disabled" }
  };

  if (process.env.DEEPSEEK_TRANSPORT === "curl") {
    return callDeepSeekWithCurl(apiKey, body);
  }

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
    maxRetries: 0,
    timeout: SDK_TIMEOUT_MS
  });
  const response = await client.chat.completions.create(body as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);
  const choice = response.choices[0];
  if (choice?.finish_reason === "length") throw new Error("DeepSeek output was truncated by max_tokens");
  return choice?.message?.content ?? "";
}

async function callDeepSeekWithCurl(apiKey: string, body: unknown): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("curl", [
      "-sS",
      "--max-time",
      CURL_TIMEOUT_SECONDS,
      "-X",
      "POST",
      "https://api.deepseek.com/chat/completions",
      "-H",
      "Content-Type: application/json",
      "-H",
      `Authorization: Bearer ${apiKey}`,
      "--data",
      JSON.stringify(body)
    ], { stdio: ["pipe", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr || `curl exited with ${code}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as { choices?: Array<{ finish_reason?: string; message?: { content?: string } }>; error?: unknown };
        if (parsed.error) reject(new Error("DeepSeek returned an error"));
        else if (parsed.choices?.[0]?.finish_reason === "length") reject(new Error("DeepSeek output was truncated by max_tokens"));
        else resolve(parsed.choices?.[0]?.message?.content ?? "");
      } catch (error) {
        reject(error);
      }
    });
    child.stdin.end();
  });
}

function getDeepSeekMaxTokens(): number {
  const configured = Number(process.env.DEEPSEEK_MAX_TOKENS);
  if (Number.isFinite(configured) && configured >= 4000) return Math.trunc(configured);
  return DEFAULT_DEEPSEEK_MAX_TOKENS;
}

function buildDossierPrompt(input: DirectorInput, inspirationPack: InspirationPack): string {
  const geo = normalizeGeo(input.geo);
  const modules = inspirationPack.modules;
  const moduleBrief = [
    `素材标题=${unique(modules.map((module) => module.title)).slice(0, 8).join("、")}`,
    `角色原型=${collectFacetTerms(modules, "characters").slice(0, 6).join("、") || "城市档案员、见证者、收件人"}`,
    `冲突=${collectFacetTerms(modules, "conflicts").slice(0, 5).join("、") || "误会、失约、线索缺口"}`,
    `转折=${collectFacetTerms(modules, "twists").slice(0, 4).join("、") || "真正目的被重新理解"}`,
    `线索接口=${preferNonLetterTerms(collectFacetTerms(modules, "clueInterfaces")).slice(0, 5).join("、") || "现场标记、错位物件、聊天记录、路线痕迹"}`,
    `结局方向=${collectFacetTerms(modules, "endings").slice(0, 4).join("、") || "送达、留下、释怀"}`,
    `地点功能=${collectFacetTerms(modules, "sceneFunctions").slice(0, 5).join("、") || "接收委托、证词冲突、情绪反转"}`
  ].join("；");
  const packBrief = [
    `来源=${inspirationPack.trace.sources.join("、")}`,
    `主题标签=${inspirationPack.trace.tags.join("、")}`,
    `人物关系=${inspirationPack.relationships.join("、") || "陌生人委托、旧友关系"}`,
    `核心冲突=${inspirationPack.conflicts.join("、") || "错认身份、路线失控、信息差"}`,
    `核心物件/线索=${inspirationPack.clues.join("、") || "现场标记、聊天记录、路线痕迹"}`,
    `世界气质=${inspirationPack.worldTags.join("、") || "城市日常被轻微打破"}`,
    `行动任务=${inspirationPack.actionTasks.join("、") || "核对现场线索、确认委托真相"}`,
    `结局张力=${inspirationPack.endingStakes.join("、") || "公开或保留真相"}`
  ].join("；");

  return [
    "只返回一个合法且完整的 JSON 对象，不要 Markdown，不要解释。",
    "第一步：只生成城市冒险开场、路线预告、轻量身份卡、人物关系和主线真相骨架。不要生成nodes、evidence、timeline。",
    `城市=${input.city}，地标=${geo.landmarkName}，地点类型=${geo.placeType}，现场细节=${geo.nearbyDetails}，天气=${input.weather}，时间=${input.timeOfDay}，偏好=${input.preference}。`,
    `本局灵感包：${packBrief}`,
    `参考以下故事积木，只抽象借鉴，不复用原文人物、长句或可识别桥段：${moduleBrief}`,
    "如果本局灵感包主题标签没有明确包含“信/信件/未寄出的信/迟到的信”，不得把信、信封、邮戳、收件人作为核心物件或核心谜题。",
    "禁止默认使用“信件/旧书店老板/未寄出的信”组合；优先使用本局灵感包里的核心物件/线索。",
    "字段必须包含 id,title,playerRole,premise,adventureType,openingPremise,routeTeaser,dossier,playerRoles,characters,truthSummary,endingChoices,inspirationTrace,complianceNote,generatedBy。",
    "adventureType是本局城市冒险类型，不限剧本杀，可为城市寻踪、都市奇遇、秘密路线、奇物委托、关系追踪等。",
    "openingPremise为600到900字完整开场，交代发生了什么、玩家为什么要探索、主要地点、现实照片如何触发任务浮层、以及继续走下去的理由；要像冒险故事开篇，不要像产品说明。",
    "开场必须比一句钩子更完整：先写玩家抵达现场的感官细节，再写系统/委托如何把现实地点变成游戏界面，再依次预告五站会探索的区域气质；不要复用“七年前照片、你名字的票根”这类单点悬念模板。",
    "routeTeaser正好5条，每条含order,locationName,teaser；只预告地点氛围、疑点和探索理由，不揭露答案。",
    "dossier含caseFileId,caseType,title,incidentTime,locationAtmosphere,background不少于120字,knownFacts至少3条,openQuestions至少2条,openingInstruction。",
    "playerRoles正好3张，id必须是role-1、role-2、role-3，每张含name,roleTitle,bio,relationshipToCase,knownSecret,privateGoal,startingClueIds,voiceStyle,riskNote,explorationAbility,hiddenObjective,hintStyle；这是轻量身份卡，不要写成厚重剧本杀人物小传。",
    "characters至少3个，每个含id,name,role,publicInfo,secretHint,testimony证词,contradictionHint可疑点。",
    "inspirationTrace必须只包含sources,tags,mode；sources用源文件名，tags用抽象标签，不要包含原文句子。",
    "身份卡只改变初始线索、提示角度、私人目标和结局文案，不改变主线真相。最终真相不得在 dossier 或前4站提前揭露。",
    "至少2站写入上述地标或现场细节。地点必须公共可达；避免明确危险行动，但不要反复输出安全提示。"
  ].join("\n");
}

function buildStationsPrompt(input: DirectorInput, base: z.infer<typeof storyBaseSchema>, inspirationPack: InspirationPack): string {
  const geo = normalizeGeo(input.geo);
  return [
    "只返回一个合法且完整的 JSON 对象，不要 Markdown，不要解释。",
    "第二步：基于已生成城市冒险开场，生成5站CityWalk章节、可拍照观察目标、线索链和时间线。不要重复输出dossier、playerRoles、characters。",
    `案卷编号=${base.dossier.caseFileId}；标题=${base.title}；城市=${input.city}；地标=${geo.landmarkName}；地点类型=${geo.placeType}；现场细节=${geo.nearbyDetails}；天气=${input.weather}；时间=${input.timeOfDay}。`,
    `本局灵感标签=${base.inspirationTrace.tags.join("、") || inspirationPack.trace.tags.join("、")}；来源=${base.inspirationTrace.sources.join("、") || inspirationPack.trace.sources.join("、")}。`,
    `人物证词=${base.characters.map((character) => `${character.name}:${character.testimony}`).join(" / ")}`,
    `身份卡ID=${base.playerRoles.map((role) => `${role.id}:${role.roleTitle}`).join(" / ")}`,
    "字段必须只包含 evidence,timeline,nodes。",
    "evidence必须5个，id建议ev-1到ev-5，含title,kind,content,unlocksAtNode。",
    "timeline必须5条，和站点顺序对应。",
    "nodes必须正好5个。每个node含id,order,locationName,locationTieIn,sceneText,npcMessage,evidenceIds,publicTask,contradiction,suspectPressure,rolePerspectives,question,answerKeywords,safetyFallback,mainTask,hiddenTask,photoPrompt,discovery。",
    "mainTask是照片浮层里的主线任务；hiddenTask是可选隐藏任务；photoPrompt说明该拍什么公共元素；discovery说明点击本章主线标记后解锁的新发现。",
    "每站都要有现实世界链接：让路牌、店招、橱窗、地铁口、导视牌、公共装置或墙面细节成为任务锚点，写成玩家真的能在照片里点击的发现。",
    "每个contradiction含claim,evidenceId,reasoning，必须形成“人物证词 -> 证物推翻 -> 玩家判断”的推理点。",
    "rolePerspectives必须以role-1、role-2、role-3为key，并让三个身份看到不同推理角度。",
    "最终真相只能在第5站收束，前4站只能揭示局部矛盾。地点必须公共可达；不要反复输出安全提示。"
  ].join("\n");
}

function selectInspirationPack(modules: StoryModule[], context: RuntimeContext): InspirationPack {
  const usable = modules.filter((module) => module.source_path !== "seed");
  const candidates = usable.length >= 3 ? usable : modules;
  const groups = groupModulesBySource(candidates)
    .sort((a, b) => sourceDiversityScore(b) - sourceDiversityScore(a));
  const filteredGroups = groups.filter((group) => {
    const tags = tagsForModules(group.modules);
    return tags.every((tag) => !recentInspirationThemes.includes(tag));
  });
  const pool = filteredGroups.length >= 2 ? filteredGroups : groups;
  const start = pool.length ? inspirationCursor % pool.length : 0;
  inspirationCursor += 1;
  const chosenGroups = rotate(pool, start).slice(0, 4);
  const chosenModules = chosenGroups.flatMap((group) => prioritizeModules(group.modules).slice(0, 2)).slice(0, 10);
  const selectedModules = chosenModules.length > 0 ? chosenModules : prioritizeModules(modules).slice(0, 10);
  const tags = unique([
    ...tagsForModules(selectedModules),
    context.preference
  ]).filter((tag) => Boolean(tag) && (!/迟到的信|未寄出的信/.test(tag) || selectedModules.some((module) => /信/.test(module.title))));
  const traceTags = tags.length > 0 ? tags.slice(0, 8) : ["城市漫游", context.preference || "轻推理"];
  return {
    modules: selectedModules,
    trace: {
      sources: unique(selectedModules.map((module) => basenameForDisplay(module.source_path))).slice(0, 5),
      tags: traceTags,
      mode: "轻灵感"
    },
    relationships: collectFacetTerms(selectedModules, "relationships").slice(0, 5),
    conflicts: collectFacetTerms(selectedModules, "conflicts").slice(0, 5),
    clues: preferNonLetterTerms(collectFacetTerms(selectedModules, "clueInterfaces")).slice(0, 5),
    sceneFunctions: collectFacetTerms(selectedModules, "sceneFunctions").slice(0, 5),
    worldTags: collectFacetTerms(selectedModules, "worldTags").slice(0, 5),
    actionTasks: collectFacetTerms(selectedModules, "actionTasks").slice(0, 5),
    endingStakes: collectFacetTerms(selectedModules, "endingStakes").slice(0, 5)
  };
}

function groupModulesBySource(modules: StoryModule[]): Array<{ source: string; modules: StoryModule[] }> {
  const groups = new Map<string, StoryModule[]>();
  for (const module of modules) {
    const source = module.source_path || module.id;
    groups.set(source, [...(groups.get(source) ?? []), module]);
  }
  return [...groups.entries()].map(([source, groupedModules]) => ({ source, modules: groupedModules }));
}

function sourceDiversityScore(group: { source: string; modules: StoryModule[] }): number {
  const source = group.source;
  const tags = tagsForModules(group.modules);
  let score = 0;
  if (/恐怖导航|商场大逃杀|灵灵玉器铺|万鬼|直播间|美人鱼|鬼屋|命格|玉器|大逃杀/.test(source)) score += 8;
  if (tags.some((tag) => /导航异常|商场困局|奇物委托|直播谜局|异类传说|错认身份|路线失控/.test(tag))) score += 5;
  if (tags.some((tag) => /迟到的信|未寄出的信/.test(tag))) score -= 3;
  score += unique(group.modules.flatMap((module) => module.genres)).length;
  score += unique(group.modules.flatMap((module) => module.location_tags)).length;
  return score;
}

function rotate<T>(items: T[], start: number): T[] {
  if (items.length === 0) return [];
  return [...items.slice(start), ...items.slice(0, start)];
}

function tagsForModules(modules: StoryModule[]): string[] {
  return unique(modules.flatMap((module) => [
    module.title,
    ...(module.facets?.motifs ?? []),
    ...(module.facets?.conflicts ?? []),
    ...(module.facets?.clueInterfaces ?? []),
    ...(module.facets?.sceneFunctions ?? []),
    ...(module.facets?.worldTags ?? []),
    ...(module.genres ?? []),
    ...(module.emotions ?? [])
  ])).map((tag) => tag.replace(/角色原型|冲突|转折|线索接口|场景|情绪曲线/g, "").trim()).filter(Boolean);
}

function preferNonLetterTerms(terms: string[]): string[] {
  const nonLetter = terms.filter((term) => !/信|邮戳|收件人/.test(term));
  return nonLetter.length > 0 ? nonLetter : terms;
}

function rememberInspiration(tags: string[]): void {
  for (const tag of tags.slice(0, 3)) {
    recentInspirationThemes.push(tag);
  }
  while (recentInspirationThemes.length > RECENT_INSPIRATION_LIMIT) recentInspirationThemes.shift();
}

function basenameForDisplay(value: string): string {
  const clean = value.split(/[\\/]/).pop() || value;
  return clean.replace(/\.txt$/i, "").slice(0, 24);
}

function collectFacetTerms(modules: StoryModule[], key: keyof NonNullable<StoryModule["facets"]>): string[] {
  const terms = modules.flatMap((module) => {
    const value = module.facets?.[key as keyof NonNullable<StoryModule["facets"]>];
    return Array.isArray(value) ? value : [];
  });
  return unique(terms);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function prioritizeModules(modules: StoryModule[]): StoryModule[] {
  const order: Record<string, number> = {
    character: 0,
    conflict: 1,
    clue: 2,
    turning_point: 3,
    plot_seed: 4,
    location_scene: 5,
    emotion_curve: 6,
    ending: 7
  };
  return [...modules].sort((a, b) => (order[a.module_type] ?? 99) - (order[b.module_type] ?? 99));
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function normalizeGeo(geo?: GeoContext): Required<GeoContext> {
  return {
    lat: geo?.lat ?? 31.2304,
    lng: geo?.lng ?? 121.4737,
    accuracy: geo?.accuracy ?? 999,
    landmarkName: geo?.landmarkName?.trim() || "当前定位点",
    placeType: geo?.placeType?.trim() || "安全公共空间",
    nearbyDetails: geo?.nearbyDetails?.trim() || "附近有可观察但不需要进入的公共细节"
  };
}
