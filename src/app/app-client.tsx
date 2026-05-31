"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ExpandedGameSession, ExpandedSceneOutput, ExpandedStoryNode, GeoContext, OverlayMarker, PhotoOverlay } from "../lib/types";
import { ChoiceChips, citywalkAssets } from "./ui";

type AppState = {
  preference: string;
  weather: string;
  timeOfDay: string;
  city: string;
  geo: GeoContext;
  distance: number;
  session: ExpandedGameSession | null;
  output: (ExpandedSceneOutput & { stats?: { scanned: number; accepted: number; rejected: number } | null }) | null;
  photoOverlay: PhotoOverlay | null;
  photoDataUrl: string;
  loading: boolean;
  error: string;
  generationStage: string;
  missionCoverStatus: "idle" | "generating" | "failed";
  clearError: () => void;
  setPreference: (value: string) => void;
  setWeather: (value: string) => void;
  setTimeOfDay: (value: string) => void;
  setCity: (value: string) => void;
  setGeo: (value: GeoContext) => void;
  setDistance: (value: number) => void;
  startStory: () => Promise<void>;
  generateMissionCoverForSession: () => Promise<void>;
  selectRole: (roleId: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  analyzePhoto: (file: File) => Promise<void>;
  completePhotoMarker: (marker: OverlayMarker) => Promise<ExpandedSceneOutput | null>;
  requestGps: () => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

const generationStages = [
  "正在读取城市信息",
  "正在生成 5 站任务地图",
  "正在匹配公共可见拍摄点",
  "正在写入任务档案",
  "正在完成安全检查"
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const [preference, setPreference] = useState("奇遇");
  const [weather, setWeather] = useState("小雨");
  const [timeOfDay, setTimeOfDay] = useState("下午");
  const [city, setCity] = useState("上海");
  const [geo, updateGeo] = useState<GeoContext>({
    landmarkName: "武康路旧书店门口",
    placeType: "老街 / 书店 / 咖啡馆",
    nearbyDetails: "附近有梧桐树、旧式居民楼、街角咖啡馆和一座小花园"
  });
  const [distance, setDistance] = useState(30);
  const [session, setSession] = useState<ExpandedGameSession | null>(null);
  const [output, setOutput] = useState<AppState["output"]>(null);
  const [photoOverlay, setPhotoOverlay] = useState<PhotoOverlay | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generationStage, setGenerationStage] = useState("");
  const [missionCoverStatus, setMissionCoverStatus] = useState<AppState["missionCoverStatus"]>("idle");
  const router = useRouter();

  useEffect(() => {
    if (session || loading) return;
    let cancelled = false;
    fetch("/api/game/session")
      .then((response) => response.ok ? response.json() as Promise<{ session: ExpandedGameSession | null }> : null)
      .then((payload) => {
        if (cancelled || !payload?.session) return;
        const nextSession = payload.session;
        setSession(nextSession);
        setCity(nextSession.context.city ?? "上海");
        setPreference(nextSession.context.preference ?? "治愈");
        setWeather(nextSession.context.weather ?? "小雨");
        setTimeOfDay(nextSession.context.timeOfDay ?? "下午");
        if (nextSession.context.geo) {
          updateGeo((current) => ({ ...current, ...nextSession.context.geo }));
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [loading, session]);

  const value = useMemo<AppState>(() => ({
    preference,
    weather,
    timeOfDay,
    city,
    geo,
    distance,
    session,
    output,
    photoOverlay,
    photoDataUrl,
    loading,
    error,
    generationStage,
    missionCoverStatus,
    clearError: () => setError(""),
    setPreference,
    setWeather,
    setTimeOfDay,
    setCity,
    setDistance,
    setGeo: (value) => {
      updateGeo((current) => ({ ...current, ...value }));
    },
    startStory: async () => {
      setLoading(true);
      setError("");
      setGenerationStage(generationStages[0]);
      let stageIndex = 0;
      const stageTimer = window.setInterval(() => {
        stageIndex = Math.min(stageIndex + 1, generationStages.length - 1);
        setGenerationStage(generationStages[stageIndex]);
      }, 1600);
      try {
        const result = await postJson<AppState["output"]>("/api/game/start", {
          preference,
          weather,
          timeOfDay,
          city,
          geo
        });
        setOutput(result);
        setSession(result?.session ?? null);
        setMissionCoverStatus("idle");
        setPhotoOverlay(null);
        setPhotoDataUrl("");
        router.push("/dossier");
      } catch (error) {
        setError("这条街区线索暂时没有串起来，要不要重新生成一局？");
      } finally {
        window.clearInterval(stageTimer);
        setGenerationStage("");
        setLoading(false);
      }
    },
    generateMissionCoverForSession: async () => {
      if (!session || session.story.dossier.generatedMissionCoverUrl || missionCoverStatus !== "idle") return;
      setMissionCoverStatus("generating");
      try {
        const result = await postJson<{
          session: ExpandedGameSession;
          status: "cached" | "generated" | "failed";
          url: string | null;
        }>("/api/dossier/mission-cover", {
          sessionId: session.id
        });
        setSession(result.session);
        setMissionCoverStatus(result.url ? "idle" : "failed");
      } catch {
        setMissionCoverStatus("failed");
      }
    },
    selectRole: async (roleId: string) => {
      if (!session) return;
      setLoading(true);
      setError("");
      try {
        const result = await postJson<ExpandedSceneOutput>("/api/game/select-role", {
          sessionId: session.id,
          roleId,
          session
        });
        setOutput(result);
        setSession(result.session);
        setPhotoOverlay(null);
        setPhotoDataUrl("");
        router.push("/play");
      } catch {
        setError("身份选择失败，请重新打开案卷再试。");
      } finally {
        setLoading(false);
      }
    },
    submitAnswer: async (answer: string) => {
      if (!session) return;
      setLoading(true);
      setError("");
      try {
        const result = await postJson<ExpandedSceneOutput>("/api/game/advance", {
          sessionId: session.id,
          answer,
          weather,
          timeOfDay,
          locationDistanceMeters: distance
        });
        setOutput(result);
        setSession(result.session);
      } catch {
        setError("提交失败，请稍后重试。");
      } finally {
        setLoading(false);
      }
    },
    analyzePhoto: async (file: File) => {
      if (!session) return;
      setLoading(true);
      setError("");
      let imageBase64 = "";
      try {
        imageBase64 = await fileToDataUrl(file);
        const result = await postJson<{ overlay: PhotoOverlay }>("/api/photo/analyze", {
          sessionId: session.id,
          nodeId: session.currentScene.id,
          imageBase64
        });
        setPhotoDataUrl(imageBase64);
        setPhotoOverlay(result.overlay);
        router.push("/photo");
      } catch (error) {
        setError("现场信号有点弱，先为你生成一版临时线索。");
        if (imageBase64) {
          setPhotoDataUrl(imageBase64);
          setPhotoOverlay(createLocalFallbackOverlay(session.currentScene));
          router.push("/photo");
        }
      } finally {
        setLoading(false);
      }
    },
    completePhotoMarker: async (marker: OverlayMarker) => {
      if (!session) return null;
      setLoading(true);
      setError("");
      try {
        const result = await postJson<ExpandedSceneOutput>("/api/photo/complete-marker", {
          sessionId: session.id,
          nodeId: session.currentScene.id,
          markerId: marker.id,
          markerType: marker.type,
          clueText: marker.clueText
        });
        setOutput(result);
        setSession(result.session);
        if (marker.type === "main") {
          setPhotoOverlay(null);
          setPhotoDataUrl("");
        }
        return result;
      } catch {
        setError("线索提交失败，请重试。");
        return null;
      } finally {
        setLoading(false);
      }
    },
    requestGps: async () => {
      if (!navigator.geolocation) return;
      setLoading(true);
      try {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const nextGeo = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: position.coords.accuracy
              };
              updateGeo((current) => ({ ...current, ...nextGeo }));
              void postJson<{
                city?: string;
                geo?: GeoContext;
                session?: ExpandedGameSession | null;
              }>("/api/location/context", {
                sessionId: session?.id,
                geo: nextGeo
              }).then((payload) => {
                if (payload?.city) {
                  setCity(payload.city);
                }
                if (payload?.geo) {
                  updateGeo((current) => ({ ...current, ...payload.geo }));
                }
                if (payload?.session) {
                  setSession(payload.session);
                }
              }).finally(resolve);
            },
            () => {
              setError("暂时没有获得 GPS 定位，可以先手动输入出发地点。");
              resolve();
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
          );
        });
      } finally {
        setLoading(false);
      }
    }
  }), [city, distance, error, generationStage, geo, loading, missionCoverStatus, output, photoDataUrl, photoOverlay, preference, router, session, timeOfDay, weather]);

  return (
    <AppContext.Provider value={value}>
      <main className="mobile-app">
        <div className="app-content">{children}</div>
        <BottomNav />
      </main>
    </AppContext.Provider>
  );
}

export function useCitywalkApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useCitywalkApp must be used inside AppShell");
  return value;
}

export function SegmentedControl(props: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ChoiceChips label={props.label} onChange={props.onChange} options={props.options} value={props.value} />
  );
}

function BottomNav() {
  const pathname = usePathname();
  const hiddenRoutes = ["/", "/photo", "/location", "/dossier"];
  if (pathname && hiddenRoutes.includes(pathname)) return null;

  const items = [
    { href: "/home", label: "首页", icon: "home" },
    { href: "/play", label: "任务", icon: "quest" },
    { href: "/clues", label: "图鉴", icon: "codex" },
    { href: "/me", label: "我的", icon: "profile" }
  ] as const;

  return (
    <nav className="bottom-nav" aria-label="底部导航">
      {items.map((item) => (
        <Link
          aria-label={`切换到${item.label}`}
          aria-current={pathname === item.href ? "page" : undefined}
          className={pathname === item.href ? "active" : ""}
          href={item.href}
          key={item.href}
        >
          <span><BottomNavIcon name={item.icon} /></span>
          <small>{item.label}</small>
        </Link>
      ))}
    </nav>
  );
}

type BottomNavIconName = "home" | "quest" | "codex" | "profile";

function BottomNavIcon(props: { name: BottomNavIconName }) {
  const srcByName: Record<BottomNavIconName, string> = {
    home: citywalkAssets.home.navHomeActive,
    quest: citywalkAssets.home.navTask,
    codex: citywalkAssets.home.navAlbum,
    profile: citywalkAssets.home.navProfile
  };
  return <img aria-hidden="true" className="bottom-nav-icon" src={srcByName[props.name]} alt="" />;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result ?? "")));
    reader.addEventListener("error", () => reject(new Error("读取照片失败")));
    reader.readAsDataURL(file);
  });
}

function createLocalFallbackOverlay(node: ExpandedStoryNode): PhotoOverlay {
  return {
    nodeId: node.id,
    imageSummary: "现场信号有点弱，先为你生成一版临时线索。你仍然可以点击主线或隐藏标记继续冒险。",
    mainTask: node.photoPrompt || node.mainTask,
    hiddenTask: node.hiddenTask,
    markers: [
      {
        id: "local-main",
        type: "main",
        label: "MAIN QUEST",
        x: 0.5,
        y: 0.42,
        clueText: node.photoPrompt || node.mainTask,
        actionLabel: "完成主线"
      },
      {
        id: "local-hidden",
        type: "hidden",
        label: "HIDDEN",
        x: 0.76,
        y: 0.3,
        clueText: node.hiddenTask,
        actionLabel: "记录隐藏"
      }
    ],
    arrows: [{ fromX: 0.5, fromY: 0.84, toX: 0.5, toY: 0.42, label: "NEXT" }]
  };
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => null) as T | { error?: string } | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload && payload.error
      ? String(payload.error)
      : `Request failed: ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}
