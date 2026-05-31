"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
import { useCitywalkApp } from "../app-client";
import { getIdentityProfile } from "../../lib/identity-profile";
import type { ExpandedSceneOutput, ExpandedStoryNode, OverlayMarker, PhotoOverlay } from "../../lib/types";
import { citywalkAssets, ClueToast, GameCard, PhotoHudStage, StatPill } from "../ui";

const scanAdventureVars = {
  "--scan-bg-city": `url(${citywalkAssets.scanAdventure.bgCitySunny})`,
  "--scan-top-route": `url(${citywalkAssets.scanAdventure.decoTopRoute})`,
  "--scan-card-pattern": `url(${citywalkAssets.scanAdventure.missionCardPattern})`,
  "--scan-main-deco": `url(${citywalkAssets.scanAdventure.questMainDeco})`,
  "--scan-hidden-deco": `url(${citywalkAssets.scanAdventure.questHiddenDeco})`,
  "--scan-hud-frame": `url(${citywalkAssets.scanAdventure.hudFrameOverlay})`,
  "--scan-marker-main": `url(${citywalkAssets.scanAdventure.markerMainBase})`,
  "--scan-marker-hidden": `url(${citywalkAssets.scanAdventure.markerHiddenBase})`,
  "--scan-info-deco": `url(${citywalkAssets.scanAdventure.infoPanelDeco})`,
  "--scan-action-bar": `url(${citywalkAssets.scanAdventure.actionBarBg})`,
  "--scan-cta-glow": `url(${citywalkAssets.scanAdventure.scanCtaGlow})`,
  "--scan-side-button": `url(${citywalkAssets.scanAdventure.sideButtonBg})`,
  "--scan-leaves": `url(${citywalkAssets.scanAdventure.leafForeground})`
} as CSSProperties;

const demoOverlay: PhotoOverlay = {
  nodeId: "demo",
  imageSummary: "上传现场照片后，AI 会把公共可见元素转换成可点击的城市冒险标记。",
  mainTask: "拍下旧书店门口的信箱和留言条，注意梧桐树下的光影。",
  hiddenTask: "在武康路旧书店门口照片里寻找一个不影响通行的公共边角细节。",
  markers: [
    { id: "demo-main", type: "main", label: "MAIN QUEST", x: 0.42, y: 0.42, clueText: "主线标记会推动你前往下一站。", actionLabel: "完成主线" },
    { id: "demo-hidden", type: "hidden", label: "HIDDEN EGG", x: 0.72, y: 0.28, clueText: "隐藏彩蛋会加入图鉴，不强制推进。", actionLabel: "收集彩蛋" }
  ],
  arrows: [{ fromX: 0.16, fromY: 0.82, toX: 0.42, toY: 0.42, label: "NEXT" }]
};

export default function PhotoPage() {
  const app = useCitywalkApp();
  const router = useRouter();
  const [toast, setToast] = useState<{ title: string; text: string } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<OverlayMarker | null>(null);
  const [storyReveal, setStoryReveal] = useState<ExpandedSceneOutput | null>(null);

  useEffect(() => {
    setToast(null);
    setSelectedMarker(null);
    setStoryReveal(null);
  }, [app.photoOverlay, app.photoDataUrl]);

  if (!app.session) {
    return (
      <section className="photo-screen scan-adventure-page" style={scanAdventureVars}>
        <img className="scan-leaf-foreground scan-decoration" src={citywalkAssets.scanAdventure.leafForeground} alt="" />
        <Link className="scan-back-button" href="/play">‹ 返回任务</Link>
        <header className="scan-progress-card">
          <img className="scan-route-deco scan-decoration" src={citywalkAssets.scanAdventure.decoTopRoute} alt="" />
          <div className="scan-progress-main">
            <span className="scan-status-chip">
              <img src={citywalkAssets.scanAdventure.icons.target} alt="" aria-hidden="true" />
              扫描就绪
            </span>
            <strong>第 1/5 关 · 武康路旧书店门口</strong>
          </div>
          <div className="scan-found-count">
            <img src={citywalkAssets.scanAdventure.icons.binoculars} alt="" aria-hidden="true" />
            <b>0/2</b>
            <span>发现</span>
          </div>
        </header>
        <GameCard className="scan-target-card scan-mission-card" variant="mission">
          <img className="scan-card-pattern scan-decoration" src={citywalkAssets.scanAdventure.missionCardPattern} alt="" />
          <div className="scan-target-heading">
            <div>
              <p className="eyebrow">SCAN TARGET</p>
              <h2>武康路旧书店门口</h2>
            </div>
            <span>READY</span>
          </div>
          <div className="scan-target-list">
            <p className="scan-objective-row main">
              <img src={citywalkAssets.scanAdventure.icons.starBadge} alt="" aria-hidden="true" />
              <span>
                <b>MAIN QUEST</b>
                {demoOverlay.mainTask}
              </span>
              <img className="scan-objective-deco scan-decoration" src={citywalkAssets.scanAdventure.questMainDeco} alt="" />
            </p>
            <p className="scan-objective-row hidden">
              <img src={citywalkAssets.scanAdventure.icons.eggQuestion} alt="" aria-hidden="true" />
              <span>
                <b>HIDDEN EGG</b>
                {demoOverlay.hiddenTask}
              </span>
              <em>EXTRA CLUE</em>
              <img className="scan-objective-deco scan-decoration" src={citywalkAssets.scanAdventure.questHiddenDeco} alt="" />
            </p>
          </div>
          <small className="scan-hint-strip">
            <img src={citywalkAssets.scanAdventure.icons.lightbulb} alt="" aria-hidden="true" />
            <span>提示：请拍摄公共可见元素。城市寻物者：更容易发现被忽略的街角物件、门牌、橱窗和入口招牌。</span>
          </small>
        </GameCard>
        <PhotoHudStage demo imageUrl={citywalkAssets.scanAdventure.hudStreetDemo} overlay={demoOverlay} />
        <GameCard className="scan-info-panel demo-explain-card" variant="hud">
          <img src={citywalkAssets.scanAdventure.icons.cameraSmall} alt="" aria-hidden="true" />
          <div>
            <p className="eyebrow">HUD 示例演示</p>
            <p>上传现场照片后，AI 会把门牌、路牌、橱窗和公共装置变成可点击线索。</p>
          </div>
        </GameCard>
        <nav className="scan-actions scan-bottom-actions" aria-label="扫描演示操作">
          <button disabled type="button">
            <img src={citywalkAssets.scanAdventure.icons.album} alt="" aria-hidden="true" />
            <strong>相册</strong>
          </button>
          <Link className="upload-tab primary" href="/">
            <img src={citywalkAssets.scanAdventure.icons.scanCamera} alt="" aria-hidden="true" />
            <strong>扫描</strong>
          </Link>
          <Link href="/play">
            <img src={citywalkAssets.scanAdventure.icons.hintQuestion} alt="" aria-hidden="true" />
            <strong>提示</strong>
          </Link>
        </nav>
      </section>
    );
  }

  const node = app.session.currentScene;
  const selectedRole = app.session.story.playerRoles.find((role) => role.id === app.session?.selectedRoleId);
  const identity = getIdentityProfile(selectedRole);
  const discoveries = app.session.photoDiscoveries.filter((item) => item.nodeId === node.id);
  const discoveredIds = new Set(discoveries.map((item) => item.markerId));
  const currentTaskPreview = createCurrentTaskPreviewOverlay(node);
  const overlay = app.photoOverlay ?? currentTaskPreview;
  const photoTasks = buildPhotoTasks(node, overlay);
  const discoveredCount = app.photoOverlay ? overlay.markers.filter((marker) => discoveredIds.has(marker.id)).length : 0;
  const hiddenCount = discoveries.filter((item) => item.markerType === "hidden").length;
  const mainDiscovered = discoveries.some((item) => item.markerType === "main");
  const hiddenTotal = overlay.markers.filter((marker) => marker.type === "hidden").length;

  const handleMarkerClick = (marker: OverlayMarker) => {
    if (discoveredIds.has(marker.id) || app.loading) return;
    setSelectedMarker(null);
    setToast({
      title: marker.type === "main" ? "剧情触发" : "隐藏彩蛋 +1",
      text: marker.type === "main" ? "关键线索已加入案卷，正在展开下一段剧情。" : `隐藏线索已加入图鉴：${marker.clueText}`
    });
    void app.completePhotoMarker(marker).then((result) => {
      if (!result || marker.type !== "main") return;
      setStoryReveal(result);
    });
  };
  const storyRevealPath = storyReveal?.next_action === "show_ending" ? "/clues" : "/play";

  return (
    <section className="photo-screen scan-adventure-page" style={scanAdventureVars}>
      <img className="scan-leaf-foreground scan-decoration" src={citywalkAssets.scanAdventure.leafForeground} alt="" />
      <Link className="scan-back-button" href="/play">‹ 返回任务</Link>
      <header className="scan-progress-card">
        <img className="scan-route-deco scan-decoration" src={citywalkAssets.scanAdventure.decoTopRoute} alt="" />
        <div className="scan-progress-main">
          <span className="scan-status-chip">
            <img src={citywalkAssets.scanAdventure.icons.target} alt="" aria-hidden="true" />
            {app.loading ? "扫描中" : "扫描就绪"}
          </span>
          <strong>{app.loading ? "自动识别中..." : `第 ${node.order}/5 关 · ${node.locationName}`}</strong>
        </div>
        <div className="scan-found-count">
          <img src={citywalkAssets.scanAdventure.icons.binoculars} alt="" aria-hidden="true" />
          <b>{discoveredCount}/{overlay.markers.length}</b>
          <span>发现</span>
        </div>
      </header>

      <GameCard className="scan-target-card scan-mission-card" variant="mission">
        <img className="scan-card-pattern scan-decoration" src={citywalkAssets.scanAdventure.missionCardPattern} alt="" />
        <div className="scan-target-heading">
          <div>
            <p className="eyebrow">SCAN TARGET</p>
            <h2>{node.locationName}</h2>
          </div>
          <span>READY</span>
        </div>
        <div className="scan-target-list">
          <p className="scan-objective-row main">
            <img src={citywalkAssets.scanAdventure.icons.starBadge} alt="" aria-hidden="true" />
            <span>
              <b>MAIN QUEST</b>
              {photoTasks.main}
            </span>
            <img className="scan-objective-deco scan-decoration" src={citywalkAssets.scanAdventure.questMainDeco} alt="" />
          </p>
          <p className="scan-objective-row hidden">
            <img src={citywalkAssets.scanAdventure.icons.eggQuestion} alt="" aria-hidden="true" />
            <span>
              <b>HIDDEN EGG</b>
              {photoTasks.hidden}
            </span>
            <em>EXTRA CLUE</em>
            <img className="scan-objective-deco scan-decoration" src={citywalkAssets.scanAdventure.questHiddenDeco} alt="" />
          </p>
        </div>
        <small className="scan-hint-strip">
          <img src={citywalkAssets.scanAdventure.icons.lightbulb} alt="" aria-hidden="true" />
          <span>{photoTasks.hint} {identity.title}：{identity.bonus}</span>
        </small>
      </GameCard>

      {app.loading ? (
        <div className="scan-phase-list" aria-live="polite">
          <span>正在识别公共可见元素</span>
          <span>正在定位主线锚点</span>
          <span>正在搜索隐藏彩蛋</span>
          <span>正在生成下一站方向</span>
        </div>
      ) : null}

      <PhotoHudStage
        demo={!app.photoOverlay || !app.photoDataUrl}
        discoveredIds={discoveredIds}
        imageUrl={app.photoDataUrl || citywalkAssets.scanAdventure.hudStreetDemo}
        onMarkerSelect={setSelectedMarker}
        overlay={overlay}
        scanning={app.loading}
      />

      <ScanMarkerSheet
        disabled={app.loading}
        marker={selectedMarker}
        onClose={() => setSelectedMarker(null)}
        onMarkerConfirm={handleMarkerClick}
      />

      {storyReveal ? (
        <StoryRevealSheet
          output={storyReveal}
          onClose={() => setStoryReveal(null)}
          onContinue={() => {
            setStoryReveal(null);
            router.push(storyReveal.next_action === "show_ending" ? "/clues" : "/play");
          }}
          targetPath={storyRevealPath}
        />
      ) : null}

      {!app.photoOverlay || !app.photoDataUrl ? (
        <GameCard className="scan-info-panel demo-explain-card" variant="hud">
          <img src={citywalkAssets.scanAdventure.icons.cameraSmall} alt="" aria-hidden="true" />
          <div>
            <p className="eyebrow">HUD 示例演示</p>
            <p>上传现场照片后，AI 会把门牌、路牌、橱窗和公共装置变成可点击线索。</p>
          </div>
        </GameCard>
      ) : (
        <GameCard className="scan-info-panel photo-summary-card" variant="hud">
          <img src={citywalkAssets.scanAdventure.icons.magnifier} alt="" aria-hidden="true" />
          <div>
            <p className="eyebrow">SCAN RESULT</p>
            <p>{overlay.imageSummary}</p>
          </div>
        </GameCard>
      )}

      {app.error ? (
        <GameCard className="fallback-card" variant="hud">
          <h2>现场信号有点弱</h2>
          <p>先为你生成临时线索，仍可继续探索。</p>
          <div className="button-row">
            <button className="primary-action" onClick={app.clearError} type="button">使用临时线索继续</button>
            <UploadButton analyzePhoto={app.analyzePhoto} disabled={app.loading} label="重新识别" icon="◎" />
          </div>
        </GameCard>
      ) : null}

      <div className="scan-status-bar">
        <StatPill label="主线" value={`${mainDiscovered ? 1 : 0}/1`} tone="blue" />
        <StatPill label="隐藏" value={`${hiddenCount}/${hiddenTotal}`} tone="orange" />
        <StatPill label="状态" value={app.error ? "临时" : app.photoOverlay ? "已识别" : "演示"} tone={app.photoOverlay ? "teal" : "gray"} />
      </div>

      <nav className="scan-actions scan-bottom-actions" aria-label="扫描操作">
        <UploadButton
          analyzePhoto={app.analyzePhoto}
          disabled={app.loading}
          label="相册"
          iconSrc={citywalkAssets.scanAdventure.icons.album}
        />
        <UploadButton
          analyzePhoto={app.analyzePhoto}
          disabled={app.loading}
          label={app.loading ? "扫描中" : "扫描"}
          iconSrc={citywalkAssets.scanAdventure.icons.scanCamera}
          primary
        />
        <Link href="/play">
          <img src={citywalkAssets.scanAdventure.icons.hintQuestion} alt="" aria-hidden="true" />
          <strong>提示</strong>
        </Link>
      </nav>

      {toast ? <ClueToast title={toast.title} text={toast.text} onClose={() => setToast(null)} /> : null}
    </section>
  );
}

function ScanMarkerSheet(props: {
  disabled: boolean;
  marker: OverlayMarker | null;
  onClose: () => void;
  onMarkerConfirm: (marker: OverlayMarker) => void;
}) {
  if (!props.marker) return null;
  const isMain = props.marker.type === "main";
  return (
    <aside className={`scan-marker-sheet ${isMain ? "main" : "hidden"}`} role="dialog" aria-modal="false">
      <button aria-label="关闭线索详情" className="scan-marker-close" onClick={props.onClose} type="button">×</button>
      <p className="eyebrow">{isMain ? "MAIN QUEST" : "HIDDEN EGG"}</p>
      <h3>{props.marker.label || (isMain ? "主线任务" : "隐藏彩蛋")}</h3>
      <p>{props.marker.clueText}</p>
      <button disabled={props.disabled} onClick={() => props.onMarkerConfirm(props.marker!)} type="button">
        {props.marker.actionLabel || (isMain ? "完成主线" : "收集彩蛋")}
      </button>
    </aside>
  );
}

function StoryRevealSheet(props: {
  output: ExpandedSceneOutput;
  onClose: () => void;
  onContinue: () => void;
  targetPath: "/clues" | "/play";
}) {
  const isEnding = props.output.next_action === "show_ending";
  const evidence = props.output.new_evidence.slice(0, 2);
  return (
    <aside className="story-reveal-sheet" role="dialog" aria-modal="true" aria-labelledby="story-reveal-title">
      <button aria-label="关闭剧情发现" className="story-reveal-close" onClick={props.onClose} type="button">×</button>
      <p className="eyebrow">STORY REVEAL</p>
      <h2 id="story-reveal-title">{isEnding ? "最终发现" : "剧情触发"}</h2>
      <p className="story-reveal-reason">{props.output.reason || "照片里的主线标记让案卷出现了新的方向。"}</p>
      <blockquote>{trimRevealText(props.output.scene_text)}</blockquote>
      {evidence.length ? (
        <div className="story-reveal-evidence" aria-label="解锁证物">
          {evidence.map((item) => (
            <span key={item.id}>{item.title}</span>
          ))}
        </div>
      ) : null}
      <p className="story-reveal-next">{props.output.npc_message}</p>
      <button className="story-reveal-primary" onClick={props.onContinue} type="button">
        {props.targetPath === "/clues" ? "查看结局" : "前往下一站"}
      </button>
    </aside>
  );
}

function UploadButton(props: {
  analyzePhoto: (file: File) => Promise<void>;
  disabled: boolean;
  label: string;
  icon?: string;
  iconSrc?: string;
  primary?: boolean;
}) {
  return (
    <label className={props.primary ? "upload-tab primary" : "upload-tab"}>
      {props.iconSrc ? <img src={props.iconSrc} alt="" aria-hidden="true" /> : <span>{props.icon ?? ""}</span>}
      <strong>{props.label}</strong>
      <input
        accept="image/*"
        capture="environment"
        disabled={props.disabled}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void props.analyzePhoto(file);
          event.currentTarget.value = "";
        }}
        type="file"
      />
    </label>
  );
}

function buildPhotoTasks(node: ExpandedStoryNode, overlay: PhotoOverlay) {
  const anchor = extractPhotoAnchor(node.photoPrompt || node.mainTask || overlay.mainTask);
  const storyPurpose = compactTaskSentence(node.contradiction.claim || node.discovery || node.publicTask);
  const main = `拍下${node.locationName}附近的${anchor}，确认${storyPurpose}`;
  const hidden = `寻找照片里与「${node.discovery}」方向相反、被遮住或容易忽略的贴纸、编号、路牌边角或橱窗反光。`;
  const hint = `提示：请拍摄公共可见的${anchor}，不要拍摄陌生人正脸，也不要进入私人空间。`;

  return {
    main,
    hidden,
    hint
  };
}

function extractPhotoAnchor(prompt: string) {
  const cleaned = prompt.replace(/[。！？；;,.，]/g, " ").replace(/\s+/g, " ").trim();
  const directMatch = cleaned.match(/拍(?:下|摄)?(.{2,24}?)(?:，|以|并|来|确认|注意|寻找|$)/);
  const anchor = directMatch?.[1]?.replace(/^(附近的|公共可见的|现场的|一个|一处)/, "").trim();
  return anchor || "公共招牌、门牌或路牌细节";
}

function compactTaskSentence(text: string) {
  return text.replace(/[。！？]+$/g, "").slice(0, 34);
}

function trimRevealText(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");
}

function createCurrentTaskPreviewOverlay(node: ExpandedStoryNode): PhotoOverlay {
  const mainTask = node.photoPrompt || node.mainTask;
  const hiddenTask = node.hiddenTask;

  return {
    nodeId: node.id,
    imageSummary: "上传现场照片后，AI 会把当前站点的公共可见元素转换成可点击的城市冒险标记。",
    mainTask,
    hiddenTask,
    markers: [
      {
        id: "preview-main",
        type: "main",
        label: "MAIN QUEST",
        x: 0.42,
        y: 0.42,
        clueText: mainTask,
        actionLabel: "完成主线"
      },
      {
        id: "preview-hidden",
        type: "hidden",
        label: "HIDDEN EGG",
        x: 0.72,
        y: 0.28,
        clueText: hiddenTask,
        actionLabel: "收集彩蛋"
      }
    ],
    arrows: [{ fromX: 0.16, fromY: 0.82, toX: 0.42, toY: 0.42, label: "NEXT" }]
  };
}
