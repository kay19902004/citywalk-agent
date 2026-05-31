import { containsUnsafeInstruction } from "./deepseek-director";
import type { OverlayArrow, OverlayMarker, OverlayMarkerType, PhotoOverlay } from "./types";

type NormalizeContext = {
  nodeId: string;
  fallbackMainTask: string;
  fallbackHiddenTask: string;
};

type LooseRecord = Record<string, unknown>;

export function normalizePhotoOverlay(raw: unknown, context: NormalizeContext): PhotoOverlay {
  const input = raw && typeof raw === "object" ? raw as LooseRecord : {};
  const markerSource = input.markers ?? input.hotspots ?? input.marks;
  const markers = normalizeMarkers(markerSource).filter((marker) => !containsUnsafeInstruction(`${marker.label}。${marker.clueText}。${marker.actionLabel}`));
  const hasMain = markers.some((marker) => marker.type === "main");
  const safeMarkers = hasMain ? markers : [
    {
      id: "main-1",
      type: "main" as OverlayMarkerType,
      label: "主线任务",
      x: 0.5,
      y: 0.5,
      clueText: context.fallbackMainTask,
      actionLabel: "查看主线"
    },
    ...markers
  ];

  return {
    nodeId: stringify(input.nodeId) || context.nodeId,
    imageSummary: stringify(input.imageSummary) || "照片中存在可用于城市冒险的公共观察点。",
    mainTask: stringify(input.mainTask) || context.fallbackMainTask,
    hiddenTask: stringify(input.hiddenTask) || context.fallbackHiddenTask,
    markers: safeMarkers.slice(0, 8),
    arrows: normalizeArrows(input.arrows).slice(0, 4)
  };
}

function normalizeMarkers(value: unknown): OverlayMarker[] {
  const items = Array.isArray(value) ? value : [];
  return items.map((item, index) => {
    const record = item && typeof item === "object" ? item as LooseRecord : {};
    const typeText = stringify(record.type);
    const type: OverlayMarkerType = typeText === "hidden" ? "hidden" : "main";
    return {
      id: stringify(record.id) || `${type}-${index + 1}`,
      type,
      label: stringify(record.label) || (type === "main" ? "主线任务" : "隐藏任务"),
      x: clamp01(record.x),
      y: clamp01(record.y),
      clueText: stringify(record.clueText) || "这里出现了一个适合继续观察的城市线索。",
      actionLabel: stringify(record.actionLabel) || (type === "main" ? "查看主线" : "查看隐藏")
    };
  });
}

function normalizeArrows(value: unknown): OverlayArrow[] {
  const items = Array.isArray(value) ? value : [];
  return items.map((item) => {
    const record = item && typeof item === "object" ? item as LooseRecord : {};
    return {
      fromX: clamp01(record.fromX),
      fromY: clamp01(record.fromY),
      toX: clamp01(record.toX),
      toY: clamp01(record.toY),
      label: stringify(record.label) || "沿箭头继续观察"
    };
  });
}

function clamp01(value: unknown): number {
  const number = typeof value === "number" ? value : Number(stringify(value));
  if (!Number.isFinite(number)) return 0.5;
  return Math.min(1, Math.max(0, number));
}

function stringify(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}
