import type { ExpandedStory, ExpandedStoryNode } from "./types";

export type StoryQualityIssue = {
  code:
    | "unsupported_repeated_motif"
    | "duplicate_station"
    | "weak_contradiction"
    | "early_truth_reveal"
    | "weak_photo_anchor"
    | "similar_role_perspectives"
    | "weak_ending_recovery";
  severity: "minor" | "major";
  target: string;
  message: string;
};

export type StoryRewriteTarget =
  | { kind: "nodes"; nodeIds: string[] }
  | { kind: "ending" }
  | { kind: "opening" };

export type StoryQualityReport = {
  score: number;
  passed: boolean;
  issues: StoryQualityIssue[];
  rewriteTargets: StoryRewriteTarget[];
};

const PASSING_SCORE = 70;
const LETTER_MOTIF = /信件|信封|一封信|封信|邮戳|收件人|旧书店|书店老板/g;
const LETTER_TAG = /信|邮|收件|书店/;
const PUBLIC_ANCHOR = /公共|招牌|店招|门牌|门头|橱窗|导视|入口|路牌|地铁口|公告栏|长椅|花园|路口|街角|墙面|装置|方向牌|标识|标记|楼层|扶梯|电梯/;
const CONCRETE_MISMATCH = /矛盾|不一致|推翻|证明|显示|时间|地点|方向|关系|证词|小票|记录|照片|倒影|编号|导视|路线|偏航|身份|署名/;

export function evaluateStoryQuality(story: ExpandedStory): StoryQualityReport {
  try {
    const issues = collectIssues(story);
    const penalty = issues.reduce((sum, issue) => sum + (issue.severity === "major" ? 15 : 7), 0);
    const score = Math.max(0, 100 - penalty);
    const rewriteTargets = buildRewriteTargets(story, issues);
    return {
      score,
      passed: score >= PASSING_SCORE && issues.every((issue) => issue.severity !== "major") && issues.length <= 1,
      issues,
      rewriteTargets
    };
  } catch {
    return { score: 100, passed: true, issues: [], rewriteTargets: [] };
  }
}

export function selectRewriteTarget(report: StoryQualityReport): StoryRewriteTarget | null {
  const nodeTarget = report.rewriteTargets.find((target): target is { kind: "nodes"; nodeIds: string[] } => target.kind === "nodes");
  if (nodeTarget && nodeTarget.nodeIds.length > 0 && nodeTarget.nodeIds.length <= 2) return nodeTarget;
  const endingTarget = report.rewriteTargets.find((target) => target.kind === "ending");
  if (endingTarget) return endingTarget;
  const openingTarget = report.rewriteTargets.find((target) => target.kind === "opening");
  if (openingTarget) return openingTarget;
  return null;
}

function collectIssues(story: ExpandedStory): StoryQualityIssue[] {
  const issues: StoryQualityIssue[] = [];
  issues.push(...checkUnsupportedRepeatedMotifs(story));
  issues.push(...checkStationDistinctness(story.nodes));
  issues.push(...checkContradictions(story));
  issues.push(...checkProgressiveReveal(story));
  issues.push(...checkPhotoAnchors(story.nodes));
  issues.push(...checkRolePerspectives(story.nodes));
  issues.push(...checkEndingRecovery(story));
  return issues;
}

function checkUnsupportedRepeatedMotifs(story: ExpandedStory): StoryQualityIssue[] {
  const tags = story.inspirationTrace?.tags.join(" ") ?? "";
  if (LETTER_TAG.test(tags)) return [];
  const text = [
    story.title,
    story.premise,
    story.openingPremise,
    story.truthSummary,
    ...story.routeTeaser.map((item) => item.teaser),
    ...story.evidence.map((item) => `${item.title}${item.content}`),
    ...story.nodes.map((node) => `${node.sceneText}${node.discovery}${node.publicTask}`)
  ].join(" ");
  const count = text.match(LETTER_MOTIF)?.length ?? 0;
  return count >= 5 ? [{
    code: "unsupported_repeated_motif",
    severity: "major",
    target: "story",
    message: "信件、邮戳或旧书店母题反复出现，但灵感标签没有支持该方向。"
  }] : [];
}

function checkStationDistinctness(nodes: ExpandedStoryNode[]): StoryQualityIssue[] {
  const issues: StoryQualityIssue[] = [];
  const seenLocation = new Set<string>();
  const seenDiscovery = new Set<string>();
  for (const node of nodes) {
    const locationKey = compactText(node.locationName);
    const discoveryKey = compactText(node.discovery);
    if (seenLocation.has(locationKey) || seenDiscovery.has(discoveryKey)) {
      issues.push({
        code: "duplicate_station",
        severity: "major",
        target: node.id,
        message: "站点地点或发现内容与其他站点过于重复。"
      });
    }
    seenLocation.add(locationKey);
    seenDiscovery.add(discoveryKey);
  }
  return issues;
}

function checkContradictions(story: ExpandedStory): StoryQualityIssue[] {
  const issues: StoryQualityIssue[] = [];
  const evidenceUnlock = new Map(story.evidence.map((item) => [item.id, item.unlocksAtNode]));
  for (const node of story.nodes) {
    const evidenceId = node.contradiction.evidenceId;
    const unlockAt = evidenceUnlock.get(evidenceId);
    const reasoning = `${node.contradiction.claim}${node.contradiction.reasoning}`;
    if (!unlockAt || unlockAt > node.order || !CONCRETE_MISMATCH.test(reasoning) || node.contradiction.reasoning.length < 24) {
      issues.push({
        code: "weak_contradiction",
        severity: "major",
        target: node.id,
        message: "节点矛盾没有引用当前可用证物，或没有写出具体不一致点。"
      });
    }
  }
  return issues;
}

function checkProgressiveReveal(story: ExpandedStory): StoryQualityIssue[] {
  const truthTokens = meaningfulTokens(story.truthSummary);
  if (truthTokens.length < 3) return [];
  return story.nodes.slice(0, 4).flatMap((node) => {
    const nodeText = `${node.sceneText}${node.discovery}${node.contradiction.reasoning}`;
    const overlap = truthTokens.filter((token) => nodeText.includes(token)).length;
    return overlap >= Math.min(4, truthTokens.length) ? [{
      code: "early_truth_reveal" as const,
      severity: "major" as const,
      target: node.id,
      message: "前四站过早复用了最终真相的核心表达。"
    }] : [];
  });
}

function checkPhotoAnchors(nodes: ExpandedStoryNode[]): StoryQualityIssue[] {
  const issues: StoryQualityIssue[] = [];
  for (const node of nodes) {
    const fields = [node.mainTask, node.hiddenTask, node.photoPrompt].join(" ");
    if (!PUBLIC_ANCHOR.test(fields)) {
      issues.push({
        code: "weak_photo_anchor",
        severity: "major",
        target: node.id,
        message: "拍照任务缺少公共可视锚点。"
      });
    }
  }
  return issues;
}

function checkRolePerspectives(nodes: ExpandedStoryNode[]): StoryQualityIssue[] {
  const issues: StoryQualityIssue[] = [];
  for (const node of nodes) {
    const values = Object.values(node.rolePerspectives).map(compactText);
    if (new Set(values).size < values.length) {
      issues.push({
        code: "similar_role_perspectives",
        severity: "minor",
        target: node.id,
        message: "三个身份视角过于相似。"
      });
    }
  }
  return issues;
}

function checkEndingRecovery(story: ExpandedStory): StoryQualityIssue[] {
  const endingText = `${story.truthSummary}${story.endingChoices.join("")}`;
  const characterSignals = story.characters.flatMap((character) => [character.name, character.role]);
  const hasCharacter = characterSignals.some((signal) => signal && endingText.includes(signal));
  const hasChoice = story.endingChoices.some((choice) => choice.length >= 4 && story.truthSummary.includes(choice.slice(0, 2)));
  return story.truthSummary.length >= 16 || hasCharacter || hasChoice ? [] : [{
    code: "weak_ending_recovery",
    severity: "minor",
    target: "ending",
    message: "结局没有明显回收人物动机或最终选择。"
  }];
}

function buildRewriteTargets(story: ExpandedStory, issues: StoryQualityIssue[]): StoryRewriteTarget[] {
  const targets: StoryRewriteTarget[] = [];
  const nodeIds = unique(issues
    .filter((issue) => issue.target.startsWith("node-") || story.nodes.some((node) => node.id === issue.target))
    .map((issue) => issue.target));
  if (nodeIds.length > 0 && nodeIds.length <= 2) targets.push({ kind: "nodes", nodeIds });
  if (issues.some((issue) => issue.target === "ending")) targets.push({ kind: "ending" });
  if (issues.some((issue) => issue.code === "unsupported_repeated_motif")) targets.push({ kind: "opening" });
  return targets;
}

function compactText(value: string): string {
  return value.replace(/\s/g, "").replace(/[，。！？、；:：/\\-]/g, "").slice(0, 80);
}

function meaningfulTokens(value: string): string[] {
  return unique((value.match(/[\u4e00-\u9fff]{2,6}/g) ?? [])
    .filter((token) => !/真正|不是|而是|这条|路线|最后|选择|城市|故事/.test(token))
    .slice(0, 8));
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
