export type ModuleType =
  | "character"
  | "plot_seed"
  | "location_scene"
  | "emotion_curve"
  | "conflict"
  | "turning_point"
  | "clue"
  | "ending";
export type SafetyStatus = "safe" | "fallback" | "blocked";

export type StoryModule = {
  id: string;
  module_type: ModuleType;
  title: string;
  summary: string;
  source_path: string;
  author?: string;
  genres: string[];
  emotions: string[];
  location_tags: string[];
  requires: string[];
  produces: string[];
  forbidden: string[];
  hardness: "hard" | "soft";
  facets?: {
    characters?: string[];
    conflicts?: string[];
    twists?: string[];
    clueInterfaces?: string[];
    endings?: string[];
    sceneFunctions?: string[];
    motifs?: string[];
    relationships?: string[];
    dilemmas?: string[];
    worldTags?: string[];
    actionTasks?: string[];
    endingStakes?: string[];
    sourceTitles?: string[];
  };
};

export type StoryTemplate = {
  id: string;
  title: string;
  genres: string[];
  node_functions: string[];
  opening_task: string;
  truth_frame: string;
  ending_types: string[];
};

export type LocationNode = {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  radius: number;
  safety: "normal" | "night_safe" | "indoor" | "avoid_night";
  fallback: string;
};

export type RuntimeContext = {
  preference: string;
  weather: string;
  timeOfDay: string;
  city?: string;
  geo?: GeoContext;
};

export type GeoContext = {
  lat?: number;
  lng?: number;
  accuracy?: number;
  landmarkName?: string;
  placeType?: string;
  nearbyDetails?: string;
};

export type StoryNode = {
  id: string;
  order: number;
  location: LocationNode;
  core_function: string;
  fixed_clue: string;
  question: string;
  answer_keywords: string[];
  prompt_rules: string[];
  fallback: string;
};

export type ComposedStory = {
  id: string;
  title: string;
  theme: string;
  genre: string[];
  main_task: string;
  truth_summary: string;
  emotional_curve: string[];
  nodes: StoryNode[];
  safety_status: SafetyStatus;
  compliance_note: string;
};

export type GameSession = {
  id: string;
  story: ComposedStory;
  currentNodeIndex: number;
  knownClues: string[];
  answers: Array<{ nodeId: string; answer: string; correct: boolean }>;
  hintLevel: number;
  createdAt: string;
  updatedAt: string;
};

export type AgentSceneOutput = {
  scene_text: string;
  new_clues: string[];
  question: string;
  next_action: "ask_player_answer" | "go_next_location" | "show_ending";
  safety_status: SafetyStatus;
  fallback_available: boolean;
  hint_level: number;
  reason?: string;
  session?: GameSession;
};

export type CharacterCard = {
  id: string;
  name: string;
  role: string;
  publicInfo: string;
  secretHint: string;
  testimony: string;
  contradictionHint: string;
};

export type StoryDossier = {
  caseFileId: string;
  caseType: string;
  title: string;
  generatedMissionCoverUrl?: string;
  incidentTime: string;
  locationAtmosphere: string;
  background: string;
  knownFacts: string[];
  openQuestions: string[];
  openingInstruction: string;
};

export type PlayerRoleCard = {
  id: string;
  name: string;
  roleTitle: string;
  bio: string;
  relationshipToCase: string;
  knownSecret: string;
  privateGoal: string;
  startingClueIds: string[];
  voiceStyle: string;
  riskNote: string;
  explorationAbility?: string;
  hiddenObjective?: string;
  hintStyle?: string;
};

export type EvidenceCard = {
  id: string;
  title: string;
  kind: "物证" | "证词" | "记录" | "地点观察";
  content: string;
  unlocksAtNode: number;
};

export type ExpandedStoryNode = {
  id: string;
  order: number;
  locationName: string;
  locationTieIn: string;
  sceneText: string;
  npcMessage: string;
  evidenceIds: string[];
  publicTask: string;
  contradiction: {
    claim: string;
    evidenceId: string;
    reasoning: string;
  };
  suspectPressure: string;
  rolePerspectives: Record<string, string>;
  question: string;
  answerKeywords: string[];
  safetyFallback: string;
  mainTask: string;
  hiddenTask: string;
  photoPrompt: string;
  discovery: string;
};

export type RouteTeaser = {
  order: number;
  locationName: string;
  teaser: string;
};

export type OverlayMarkerType = "main" | "hidden";

export type OverlayMarker = {
  id: string;
  type: OverlayMarkerType;
  label: string;
  x: number;
  y: number;
  clueText: string;
  actionLabel: string;
};

export type OverlayArrow = {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label: string;
};

export type PhotoOverlay = {
  nodeId: string;
  imageSummary: string;
  mainTask: string;
  hiddenTask: string;
  markers: OverlayMarker[];
  arrows: OverlayArrow[];
};

export type ExpandedStory = {
  id: string;
  title: string;
  playerRole: string;
  premise: string;
  adventureType: string;
  openingPremise: string;
  routeTeaser: RouteTeaser[];
  dossier: StoryDossier;
  playerRoles: PlayerRoleCard[];
  selectedRoleId?: string;
  truthSummary: string;
  endingChoices: string[];
  characters: CharacterCard[];
  evidence: EvidenceCard[];
  timeline: string[];
  nodes: ExpandedStoryNode[];
  complianceNote: string;
  generatedBy: "deepseek" | "mock";
  inspirationTrace?: {
    sources: string[];
    tags: string[];
    mode: string;
  };
};

export type ExpandedGameSession = {
  id: string;
  story: ExpandedStory;
  currentNodeIndex: number;
  selectedRoleId?: string;
  knownEvidenceIds: string[];
  answers: Array<{ nodeId: string; answer: string; correct: boolean }>;
  completedMainMarkers: string[];
  photoDiscoveries: Array<{
    nodeId: string;
    markerId: string;
    markerType: OverlayMarkerType;
    clueText: string;
    discoveredAt: string;
  }>;
  hintLevel: number;
  context: RuntimeContext;
  currentScene: ExpandedStoryNode;
  createdAt: string;
  updatedAt: string;
};

export type ExpandedSceneOutput = {
  scene_text: string;
  npc_message: string;
  new_evidence: EvidenceCard[];
  question: string;
  next_action: "select_role" | "ask_player_answer" | "go_next_location" | "show_ending" | "take_photo";
  safety_status: SafetyStatus;
  fallback_available: boolean;
  hint_level: number;
  reason?: string;
  session: ExpandedGameSession;
};
