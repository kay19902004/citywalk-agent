import path from "node:path";
import { scanStoryLibrary } from "./content-pipeline";
import { createExpandedStoryWithDirector } from "./deepseek-director";
import { advanceExpandedSession, completeOverlayMarker, createExpandedSession, outputForDossier, selectPlayerRole } from "./expanded-session";
import { generateMissionCover } from "./qwen-image";
import {
  advanceSession,
  createSession,
  seedLocations,
  seedModules,
  storyTemplates
} from "./story-engine";
import type {
  AgentSceneOutput,
  ExpandedGameSession,
  ExpandedSceneOutput,
  GameSession,
  GeoContext,
  RuntimeContext,
  StoryModule
} from "./types";

const sessions = new Map<string, GameSession>();
const expandedSessions = new Map<string, ExpandedGameSession>();
let latestExpandedSessionId: string | null = null;
let cachedModules: StoryModule[] | null = null;
let cachedStats: { scanned: number; accepted: number; rejected: number } | null = null;

export function resolveStoryLibraryRoot(): string | null {
  const configuredRoot = process.env.STORY_LIBRARY_ROOT?.trim();
  if (configuredRoot) return path.resolve(configuredRoot);
  if (process.env.NODE_ENV === "production") return null;
  return path.resolve(process.cwd(), "..");
}

export async function startGame(context: RuntimeContext): Promise<AgentSceneOutput & { stats: typeof cachedStats }> {
  const modules = await getModules();
  const session = createSession({
    ...context,
    availableModules: modules,
    availableLocations: seedLocations,
    templates: storyTemplates
  });
  sessions.set(session.id, session);
  const first = advanceSession(session, {
    weather: context.weather,
    timeOfDay: context.timeOfDay,
    locationDistanceMeters: 0
  });
  return { ...first, stats: cachedStats };
}

export function continueGame(input: {
  sessionId: string;
  answer?: string;
  locationDistanceMeters?: number;
  weather?: string;
  timeOfDay?: string;
}): AgentSceneOutput {
  const session = sessions.get(input.sessionId);
  if (!session) {
    return {
      scene_text: "这个存档已经不存在，请重新开始一条路线。",
      new_clues: [],
      question: "是否返回开局？",
      next_action: "show_ending",
      safety_status: "fallback",
      fallback_available: false,
      hint_level: 0
    };
  }
  const output = advanceSession(session, input);
  sessions.set(session.id, session);
  return output;
}

export function getSession(sessionId: string): GameSession | undefined {
  return sessions.get(sessionId);
}

export async function startExpandedGame(context: RuntimeContext): Promise<ExpandedSceneOutput & { stats: typeof cachedStats }> {
  const modules = await getModules();
  const story = await createExpandedStoryWithDirector({ context, modules });
  const session = createExpandedSession(story, context);
  expandedSessions.set(session.id, session);
  latestExpandedSessionId = session.id;
  return { ...outputForDossier(session), stats: cachedStats };
}

export function selectExpandedRole(input: {
  sessionId?: string;
  roleId: string;
  sessionSnapshot?: ExpandedGameSession;
}): ExpandedSceneOutput | null {
  const sessionId = input.sessionId || latestExpandedSessionId;
  const session = sessionId ? expandedSessions.get(sessionId) : undefined;
  if (!session && input.sessionSnapshot) {
    expandedSessions.set(input.sessionSnapshot.id, input.sessionSnapshot);
    latestExpandedSessionId = input.sessionSnapshot.id;
  }
  const recoveredSession = session ?? input.sessionSnapshot;
  if (!recoveredSession) return null;
  const output = selectPlayerRole(recoveredSession, input.roleId);
  expandedSessions.set(recoveredSession.id, output.session);
  latestExpandedSessionId = recoveredSession.id;
  return output;
}

export function continueExpandedGame(input: {
  sessionId?: string;
  answer?: string;
  locationDistanceMeters?: number;
  weather?: string;
  timeOfDay?: string;
}): ExpandedSceneOutput | null {
  const sessionId = input.sessionId || latestExpandedSessionId;
  const session = sessionId ? expandedSessions.get(sessionId) : undefined;
  if (!session) return null;
  const output = advanceExpandedSession(session, input);
  expandedSessions.set(session.id, output.session);
  latestExpandedSessionId = session.id;
  return output;
}

export function completeExpandedPhotoMarker(input: {
  sessionId?: string;
  nodeId: string;
  markerId: string;
  markerType: "main" | "hidden";
  clueText: string;
}): ExpandedSceneOutput | null {
  const sessionId = input.sessionId || latestExpandedSessionId;
  const session = sessionId ? expandedSessions.get(sessionId) : undefined;
  if (!session) return null;
  const output = completeOverlayMarker(session, {
    nodeId: input.nodeId,
    markerId: input.markerId,
    markerType: input.markerType,
    clueText: input.clueText
  });
  expandedSessions.set(output.session.id, output.session);
  latestExpandedSessionId = output.session.id;
  return output;
}

export function updateExpandedLocation(input: { sessionId?: string; geo: GeoContext; city?: string }): ExpandedGameSession | null {
  const sessionId = input.sessionId || latestExpandedSessionId;
  const session = sessionId ? expandedSessions.get(sessionId) : undefined;
  if (!session) return null;
  if (input.city) session.context.city = input.city;
  session.context.geo = { ...session.context.geo, ...input.geo };
  session.updatedAt = new Date().toISOString();
  expandedSessions.set(session.id, session);
  latestExpandedSessionId = session.id;
  return session;
}

export function getExpandedSession(sessionId?: string): ExpandedGameSession | undefined {
  return expandedSessions.get(sessionId || latestExpandedSessionId || "");
}

export async function generateExpandedMissionCover(input: { sessionId?: string }): Promise<{
  session: ExpandedGameSession;
  status: "cached" | "generated" | "failed";
  url: string | null;
} | null> {
  const sessionId = input.sessionId || latestExpandedSessionId;
  const session = sessionId ? expandedSessions.get(sessionId) : undefined;
  if (!session) return null;

  const cachedUrl = session.story.dossier.generatedMissionCoverUrl;
  if (cachedUrl) {
    return { session, status: "cached", url: cachedUrl };
  }

  const heroNode = session.story.nodes[0] ?? session.currentScene;
  const url = await generateMissionCover({
    missionTitle: session.story.dossier.title,
    city: session.context.city ?? "本地城市",
    landmarkName: heroNode?.locationName ?? session.context.geo?.landmarkName ?? "CityWalk 起点",
    mode: session.context.preference,
    environmentBuff: `${session.context.weather} ${session.context.timeOfDay}`.trim()
  });

  if (!url) {
    return { session, status: "failed", url: null };
  }

  session.story.dossier.generatedMissionCoverUrl = url;
  session.updatedAt = new Date().toISOString();
  expandedSessions.set(session.id, session);
  latestExpandedSessionId = session.id;
  return { session, status: "generated", url };
}

async function getModules(): Promise<StoryModule[]> {
  if (cachedModules) return cachedModules;
  const root = resolveStoryLibraryRoot();
  if (!root) {
    cachedStats = { scanned: 0, accepted: 0, rejected: 0 };
    cachedModules = seedModules;
    return cachedModules;
  }
  try {
    const scanned = await scanStoryLibrary(root, 120);
    cachedStats = { scanned: scanned.scanned, accepted: scanned.accepted, rejected: scanned.rejected.length };
    cachedModules = scanned.modules.length >= 8 ? [...seedModules, ...scanned.modules] : seedModules;
  } catch {
    cachedStats = { scanned: 0, accepted: 0, rejected: 0 };
    cachedModules = seedModules;
  }
  return cachedModules;
}
