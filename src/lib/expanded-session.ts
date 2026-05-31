import { evaluateSafety } from "./story-engine";
import type {
  ExpandedGameSession,
  ExpandedSceneOutput,
  ExpandedStory,
  ExpandedStoryNode,
  OverlayMarkerType,
  PlayerRoleCard,
  RuntimeContext
} from "./types";

export function createExpandedSession(story: ExpandedStory, context: RuntimeContext): ExpandedGameSession {
  const now = new Date().toISOString();
  const firstNode = story.nodes[0];
  return {
    id: crypto.randomUUID(),
    story,
    currentNodeIndex: 0,
    selectedRoleId: undefined,
    knownEvidenceIds: [],
    answers: [],
    completedMainMarkers: [],
    photoDiscoveries: [],
    hintLevel: 0,
    context,
    currentScene: firstNode,
    createdAt: now,
    updatedAt: now
  };
}

export function completeOverlayMarker(
  session: ExpandedGameSession,
  input: {
    nodeId: string;
    markerId: string;
    markerType: OverlayMarkerType;
    clueText: string;
  }
): ExpandedSceneOutput {
  if (!session.selectedRoleId) return outputForDossier(session);
  const node = session.story.nodes[session.currentNodeIndex];
  if (!node || node.id !== input.nodeId) {
    return outputForNode(session, session.currentScene, {
      nextAction: "take_photo",
      safetyStatus: "fallback",
      reason: "这个照片标记不属于当前站点，请回到当前任务重新拍摄。"
    });
  }

  if (!session.photoDiscoveries.some((item) => item.nodeId === input.nodeId && item.markerId === input.markerId)) {
    session.photoDiscoveries.push({
      nodeId: input.nodeId,
      markerId: input.markerId,
      markerType: input.markerType,
      clueText: input.clueText,
      discoveredAt: new Date().toISOString()
    });
  }

  if (input.markerType !== "main") {
    session.updatedAt = new Date().toISOString();
    return outputForNode(session, node, {
      nextAction: "take_photo",
      safetyStatus: "safe",
      reason: `隐藏发现：${input.clueText}`
    });
  }

  if (!session.completedMainMarkers.includes(input.nodeId)) {
    session.completedMainMarkers.push(input.nodeId);
  }

  const isFinal = session.currentNodeIndex === session.story.nodes.length - 1;
  if (isFinal) {
    session.currentNodeIndex += 1;
    session.updatedAt = new Date().toISOString();
    return outputForEnding(session, "safe");
  }

  session.currentNodeIndex += 1;
  const nextNode = session.story.nodes[session.currentNodeIndex];
  session.currentScene = nextNode;
  for (const evidenceId of nextNode.evidenceIds) {
    if (!session.knownEvidenceIds.includes(evidenceId)) session.knownEvidenceIds.push(evidenceId);
  }
  session.updatedAt = new Date().toISOString();
  return outputForNode(session, nextNode, {
    nextAction: "go_next_location",
    safetyStatus: "safe",
    reason: input.clueText
  });
}

export function outputForDossier(session: ExpandedGameSession): ExpandedSceneOutput {
  const dossier = session.story.dossier;
  return {
    scene_text: `${dossier.title}\n\n${dossier.background}`,
    npc_message: dossier.openingInstruction,
    new_evidence: [],
    question: "请选择一张玩家身份卡，再开始第一站调查。",
    next_action: "select_role",
    safety_status: "safe",
    fallback_available: false,
    hint_level: session.hintLevel,
    session
  };
}

export function selectPlayerRole(session: ExpandedGameSession, roleId: string): ExpandedSceneOutput {
  const role = session.story.playerRoles.find((item) => item.id === roleId) ?? session.story.playerRoles[0];
  const node = session.story.nodes[0];

  session.selectedRoleId = role.id;
  session.story.selectedRoleId = role.id;
  session.currentNodeIndex = 0;
  session.hintLevel = 0;
  session.currentScene = node;
  for (const evidenceId of [...role.startingClueIds, ...node.evidenceIds]) {
    if (!session.knownEvidenceIds.includes(evidenceId)) session.knownEvidenceIds.push(evidenceId);
  }
  session.updatedAt = new Date().toISOString();

  return outputForNode(session, node, {
    nextAction: "take_photo",
    safetyStatus: "safe",
    role
  });
}

export function advanceExpandedSession(
  session: ExpandedGameSession,
  input: { answer?: string; locationDistanceMeters?: number; weather?: string; timeOfDay?: string }
): ExpandedSceneOutput {
  if (!session.selectedRoleId) return outputForDossier(session);

  const node = session.story.nodes[session.currentNodeIndex];
  const safety = evaluateSafety({
    timeOfDay: input.timeOfDay ?? session.context.timeOfDay,
    weather: input.weather ?? session.context.weather,
    locationDistanceMeters: input.locationDistanceMeters ?? 0,
    locationSafety: "normal"
  });

  const answer = input.answer?.trim() ?? "";
  const correct = answer.length > 0 && node.answerKeywords.some((keyword) => answer.includes(keyword));
  const canUseTextFallback = safety.status !== "safe";
  if (answer) {
    session.answers.push({ nodeId: node.id, answer, correct });
    session.hintLevel = correct ? 0 : Math.min(session.hintLevel + 1, 3);
  }

  let outputNode: ExpandedStoryNode = node;
  const isFinal = session.currentNodeIndex === session.story.nodes.length - 1;
  let nextAction: ExpandedSceneOutput["next_action"] = "ask_player_answer";

  if (correct && canUseTextFallback && isFinal) {
    session.currentNodeIndex += 1;
    nextAction = "show_ending";
  } else if (correct && canUseTextFallback) {
    session.currentNodeIndex += 1;
    outputNode = session.story.nodes[session.currentNodeIndex];
    nextAction = "go_next_location";
  } else if (correct) {
    nextAction = "take_photo";
  }

  if (outputNode) {
    for (const evidenceId of outputNode.evidenceIds) {
      if (!session.knownEvidenceIds.includes(evidenceId)) session.knownEvidenceIds.push(evidenceId);
    }
    session.currentScene = outputNode;
  }
  session.updatedAt = new Date().toISOString();

  if (nextAction === "show_ending") {
    return outputForEnding(session, safety.status);
  }

  return outputForNode(session, outputNode, {
    nextAction,
    safetyStatus: safety.status,
    reason: correct && !canUseTextFallback ? "推理已记录，主线仍需要拍照完成。" : safety.reason
  });
}

function outputForEnding(session: ExpandedGameSession, safetyStatus: ExpandedSceneOutput["safety_status"]): ExpandedSceneOutput {
  const correctCount = session.answers.filter((answer) => answer.correct).length;
  const mainPhotoCount = session.completedMainMarkers.length;
  const hiddenPhotoCount = session.photoDiscoveries.filter((item) => item.markerType === "hidden").length;
  const completedMainRoute = mainPhotoCount >= session.story.nodes.length;
  const score = mainPhotoCount * 2 + hiddenPhotoCount + correctCount;
  const primaryThreshold = Math.max(3, session.story.nodes.length + 2);
  const choice =
    completedMainRoute || score >= primaryThreshold
      ? session.story.endingChoices[0]
      : session.story.endingChoices[1] ?? session.story.endingChoices[0];
  const role = getSelectedRole(session);
  const roleEnding = role
    ? `\n\n作为${role.roleTitle}，你的私人目标是：${role.privateGoal}。这会改变你写下结案记录的语气，但不会改变主线真相。`
    : "";
  return {
    scene_text: `结局选择：${choice}\n\n${session.story.truthSummary}${roleEnding}`,
    npc_message: "档案系统：路线已封存，新的版本会从你的选择开始。",
    new_evidence: [],
    question: "本次故事已结束。",
    next_action: "show_ending",
    safety_status: safetyStatus,
    fallback_available: false,
    hint_level: session.hintLevel,
    session
  };
}

function outputForNode(
  session: ExpandedGameSession,
  node: ExpandedStoryNode,
  options: {
    nextAction: ExpandedSceneOutput["next_action"];
    safetyStatus: ExpandedSceneOutput["safety_status"];
    reason?: string;
    role?: PlayerRoleCard;
  }
): ExpandedSceneOutput {
  const role = options.role ?? getSelectedRole(session);
  const rolePerspective = role ? node.rolePerspectives[role.id] : "";
  return {
    scene_text: decorateScene(node, session.hintLevel, options.safetyStatus !== "safe", role),
    npc_message: role ? `${node.npcMessage}\n\n身份视角：${role.voiceStyle}。${rolePerspective || role.knownSecret}` : node.npcMessage,
    new_evidence: session.story.evidence.filter((item) => node.evidenceIds.includes(item.id) || session.knownEvidenceIds.includes(item.id)),
    question: node.question,
    next_action: options.nextAction,
    safety_status: options.safetyStatus,
    fallback_available: options.safetyStatus !== "safe",
    hint_level: session.hintLevel,
    reason: options.reason,
    session
  };
}

function getSelectedRole(session: ExpandedGameSession): PlayerRoleCard | undefined {
  return session.story.playerRoles.find((role) => role.id === session.selectedRoleId);
}

function decorateScene(node: ExpandedStoryNode, hintLevel: number, fallback: boolean, role?: PlayerRoleCard): string {
  const roleText = role ? `当前身份：${role.name} / ${role.roleTitle}\n私人目标：${role.privateGoal}\n\n` : "";
  const taskText = `公开任务：${node.publicTask}\n矛盾点：${node.contradiction.claim}\n证物推理：${node.contradiction.reasoning}\n嫌疑压力：${node.suspectPressure}\n\n`;
  const hint = hintLevel > 0 ? `\n\n提示 ${hintLevel}：先看本节点证物，再判断它推翻了哪一句叙述。` : "";
  const safe = fallback ? `\n\n安全替代：${node.safetyFallback}` : "";
  return `${roleText}${taskText}${node.locationName}\n${node.sceneText}${safe}${hint}`;
}
