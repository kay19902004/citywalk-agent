"use client";

import Link from "next/link";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import type {
  ExpandedGameSession,
  ExpandedStoryNode,
  OverlayArrow,
  OverlayMarker,
  PhotoOverlay,
  PlayerRoleCard
} from "../lib/types";
import type { IdentityProfile } from "../lib/identity-profile";
import { collectionAssets } from "../lib/collection-assets";

export const citywalkAssetSlots = {
  hud: "/assets/citywalk/hud/",
  badges: "/assets/citywalk/badges/",
  textures: "/assets/citywalk/textures/",
  dossier: "/assets/citywalk/dossier/",
  route: "/assets/citywalk/route/",
  codex: "/assets/citywalk/codex/",
  report: "/assets/citywalk/report/"
} as const;

export const citywalkAssets = {
  textures: {
    cityMapGrid: "/assets/citywalk/textures/city-map-grid.svg",
    homeStreetBg: "/assets/citywalk/textures/home-street-bg.png",
    scanStreetHudDemo: "/assets/citywalk/textures/scan-street-hud-demo.png",
    softMapBg: "/assets/citywalk/textures/soft-map-bg.png",
    lightMapPanel: "/assets/citywalk/textures/light-map-panel.png",
    dossierPaperBg: "/assets/citywalk/textures/dossier-paper-bg.png",
    archivePaper: "/assets/citywalk/textures/archive-paper.svg",
    scanLines: "/assets/citywalk/textures/scan-lines.svg",
    lockedPattern: "/assets/citywalk/textures/locked-pattern.svg",
    reportStampBg: "/assets/citywalk/textures/report-stamp-bg.svg"
  },
  dossier: {
    missionCoverFallback: "/assets/citywalk/dossier/mission-cover-fallback.png"
  },
  hud: {
    mainQuestFrame: "/assets/citywalk/hud/main-quest-frame.png",
    hiddenEggFrame: "/assets/citywalk/hud/hidden-egg-frame.png",
    targetFrame: "/assets/citywalk/hud/target-frame.svg",
    scanReticle: "/assets/citywalk/hud/scan-reticle.svg",
    nextArrow: "/assets/citywalk/hud/next-arrow.svg",
    nextRouteArrow: "/assets/citywalk/hud/next-route-arrow.png",
    miniMapRing: "/assets/citywalk/hud/mini-map-ring.svg",
    hudCorner: "/assets/citywalk/hud/hud-corner.svg",
    distanceMarker: "/assets/citywalk/hud/distance-marker.svg"
  },
  route: {
    routePanelMap: "/assets/citywalk/route/route-panel-map.png",
    routeWatercolorMap: "/assets/citywalk/route/route-watercolor-map.png",
    nodeStart: "/assets/citywalk/route/node-start.svg",
    nodeCurrent: "/assets/citywalk/route/node-current.svg",
    nodeDone: "/assets/citywalk/route/node-done.svg",
    nodeLocked: "/assets/citywalk/route/node-locked.svg",
    nodeFinish: "/assets/citywalk/route/node-finish.svg",
    routeLine: "/assets/citywalk/route/route-line.svg",
    routeHiddenNode: "/assets/citywalk/route/route-hidden-node.svg"
  },
  codex: {
    emptyCodexBook: "/assets/citywalk/codex/empty-codex-book.png",
    cardDiscoveredFrame: "/assets/citywalk/codex/card-discovered-frame.svg",
    cardLockedFrame: "/assets/citywalk/codex/card-locked-frame.svg",
    cardMysteryFrame: "/assets/citywalk/codex/card-mystery-frame.svg",
    cluePhotoPlaceholder: "/assets/citywalk/codex/clue-photo-placeholder.svg",
    rarityCommon: "/assets/citywalk/codex/rarity-common.svg",
    rarityRare: "/assets/citywalk/codex/rarity-rare.svg",
    rarityEpic: "/assets/citywalk/codex/rarity-epic.svg",
    rarityLegend: "/assets/citywalk/codex/rarity-legend.svg"
  },
  badges: {
    cityRoamer: "/assets/citywalk/badges/city-roamer.png",
    coordinateCalibrator: "/assets/citywalk/badges/coordinate-calibrator.png",
    interfaceObserver: "/assets/citywalk/badges/interface-observer.png",
    eggHunter: "/assets/citywalk/badges/egg-hunter.png",
    oldCityRecorder: "/assets/citywalk/badges/old-city-recorder.png",
    nightExplorer: "/assets/citywalk/badges/night-explorer.png",
    hiddenLineUnlocker: "/assets/citywalk/badges/hidden-line-unlocker.png",
    fiveStopClear: "/assets/citywalk/badges/five-stop-clear.png"
  },
  report: {
    clearReportCardBg: "/assets/citywalk/report/clear-report-card-bg.png",
    clearStamp: "/assets/citywalk/report/clear-stamp.svg",
    rankA: "/assets/citywalk/report/rank-a.svg",
    rankS: "/assets/citywalk/report/rank-s.svg",
    reportSeal: "/assets/citywalk/report/report-seal.svg",
    shareCardFrame: "/assets/citywalk/report/share-card-frame.svg"
  },
  home: {
    heroCitywalkBg: "/assets/citywalk-art-assets-transparent/hero-bg-city-sunny.webp",
    heroSkylineOverlay: "/assets/citywalk-art-assets-transparent/hero-skyline-overlay.png",
    heroRouteOverlay: "/assets/citywalk-art-assets-transparent/hero-route-path.png",
    heroBookPinGlow: "/assets/citywalk-art-assets-transparent/hero-book-pin-glow.png",
    heroScriptCitywalk: "/assets/citywalk-art-assets-transparent/hero-script-citywalk.png",
    softParticleOverlay: "/assets/citywalk-art-assets-transparent/soft-particle-overlay.png",
    topCompass: "/assets/citywalk-art-assets-transparent/icon-compass-top.png",
    topSetting: "/assets/citywalk-art-assets-transparent/icon-setting-top.png",
    stampShanghaiCitywalk: "/assets/citywalk-art-assets-transparent/stamp-shanghai-postmark.png",
    chipClock: "/assets/citywalk-art-assets-transparent/icon-chip-clock.png",
    chipRoute: "/assets/citywalk-art-assets-transparent/icon-chip-route.png",
    chipRare: "/assets/citywalk-art-assets-transparent/icon-chip-rare.png",
    rewardExp: "/assets/citywalk-art-assets-transparent/reward-exp-badge.png",
    rewardStamp: "/assets/citywalk-art-assets-transparent/reward-stamp-badge.png",
    rewardChest: "/assets/citywalk-art-assets-transparent/reward-chest-badge.png",
    ctaShoeMapLeft: "/assets/citywalk-art-assets-transparent/cta-shoe-map-left-clean.png?v=2",
    ctaCompassTicketRight: "/assets/citywalk-art-assets-transparent/cta-compass-ticket-right-clean.png?v=2",
    sparkYellowAccent: "/assets/citywalk-art-assets-transparent/spark-yellow-accent.png",
    playerMedalLv12: "/assets/citywalk-art-assets-transparent/player-medal-lv12.png",
    upgradeGift: "/assets/citywalk-art-assets-transparent/icon-upgrade-gift.png",
    quickMapClue: "/assets/citywalk-art-assets-transparent/qa-map-clue.png",
    quickNearbyTask: "/assets/citywalk-art-assets-transparent/qa-nearby-task.png",
    quickAchievement: "/assets/citywalk-art-assets-transparent/qa-achievement.png",
    quickRouteSave: "/assets/citywalk-art-assets-transparent/qa-route-save.png",
    cardWaveLines: "/assets/citywalk-art-assets-transparent/card-wave-lines.png",
    navHomeActive: "/assets/citywalk-art-assets-transparent/nav-home-active.png",
    navTask: "/assets/citywalk-art-assets-transparent/nav-task.png",
    navAlbum: "/assets/citywalk-art-assets-transparent/nav-album.png",
    navProfile: "/assets/citywalk-art-assets-transparent/nav-profile.png",
    compassGold: "/assets/citywalk-art-assets-transparent/icon-compass-top.png",
    explorerBadge: "/assets/citywalk-art-assets-transparent/player-medal-lv12.png",
    emptyClues: "/assets/citywalk/codex/empty-codex-book.png",
    avatarExplorer: "/assets/citywalk-art-assets-transparent/player-medal-lv12.png"
  },
  playSunny: {
    bgCitySunny: "/assets/citywalk_ui_art_assets_final/webp/bg-city-sunny.webp",
    heroWukangBookstore: "/assets/citywalk_ui_art_assets_final/webp/hero-wukang-bookstore.webp",
    decoLeavesTop: "/assets/citywalk_ui_art_assets_final/webp/deco-leaves-top.webp",
    decoSparkles: "/assets/citywalk_ui_art_assets_final/webp/deco-sparkles.webp",
    decoMapPattern: "/assets/citywalk_ui_art_assets_final/webp/deco-map-pattern.webp",
    decoCloudSwoosh: "/assets/citywalk_ui_art_assets_final/webp/deco-cloud-swoosh.webp",
    thumbBookstorePolaroid: "/assets/citywalk_ui_art_assets_final/webp/thumb-bookstore-polaroid.webp",
    iconTreasure: "/assets/citywalk_ui_art_assets_final/webp/icon-treasure.webp",
    iconStamp: "/assets/citywalk_ui_art_assets_final/webp/icon-stamp.webp",
    iconFieldNote: "/assets/citywalk_ui_art_assets_final/webp/icon-field-note.webp",
    iconCompassGold: "/assets/citywalk_ui_art_assets_final/webp/icon-compass-gold.webp",
    iconCompassBlue: "/assets/citywalk_ui_art_assets_final/webp/icon-compass-blue.webp",
    mainQuestIcon: "/assets/citywalk/icons/main-quest.svg",
    hiddenEggIcon: "/assets/citywalk/icons/hidden-egg.svg",
    scanReticle: "/assets/citywalk/icons/scan-reticle.svg"
  },
  scanAdventure: {
    bgCitySunny: "/assets/scan_adventure_assets_complete/scan-adventure/bg_city_sunny.webp",
    decoTopRoute: "/assets/scan_adventure_assets_complete/scan-adventure/deco_top_route.png",
    missionCardPattern: "/assets/scan_adventure_assets_complete/scan-adventure/mission_card_pattern.png",
    questMainDeco: "/assets/scan_adventure_assets_complete/scan-adventure/quest_main_deco.png",
    questHiddenDeco: "/assets/scan_adventure_assets_complete/scan-adventure/quest_hidden_deco.png",
    hudStreetDemo: "/assets/scan_adventure_assets_complete/scan-adventure/hud_street_demo.webp",
    hudFrameOverlay: "/assets/scan_adventure_assets_complete/scan-adventure/hud_frame_overlay.png",
    hudReticle: "/assets/scan_adventure_assets_complete/scan-adventure/hud_reticle.png",
    hudRadar: "/assets/scan_adventure_assets_complete/scan-adventure/hud_radar.png",
    hudCompass: "/assets/scan_adventure_assets_complete/scan-adventure/hud_compass.png",
    markerMainBase: "/assets/scan_adventure_assets_complete/scan-adventure/marker_main_base.png",
    markerHiddenBase: "/assets/scan_adventure_assets_complete/scan-adventure/marker_hidden_base.png",
    infoPanelDeco: "/assets/scan_adventure_assets_complete/scan-adventure/info_panel_deco.png",
    actionBarBg: "/assets/scan_adventure_assets_complete/scan-adventure/action_bar_bg.png",
    scanCtaGlow: "/assets/scan_adventure_assets_complete/scan-adventure/scan_cta_glow.png",
    sideButtonBg: "/assets/scan_adventure_assets_complete/scan-adventure/side_button_bg.png",
    sparkleParticles: "/assets/scan_adventure_assets_complete/scan-adventure/sparkle_particles.png",
    leafForeground: "/assets/scan_adventure_assets_complete/scan-adventure/leaf_foreground.png",
    icons: {
      target: "/assets/scan_adventure_assets_complete/scan-adventure/icons/icon_target.png",
      binoculars: "/assets/scan_adventure_assets_complete/scan-adventure/icons/icon_binoculars.png",
      pin: "/assets/scan_adventure_assets_complete/scan-adventure/icons/icon_pin.png",
      starBadge: "/assets/scan_adventure_assets_complete/scan-adventure/icons/icon_star_badge.png",
      eggQuestion: "/assets/scan_adventure_assets_complete/scan-adventure/icons/icon_egg_question.png",
      lightbulb: "/assets/scan_adventure_assets_complete/scan-adventure/icons/icon_lightbulb.png",
      cameraSmall: "/assets/scan_adventure_assets_complete/scan-adventure/icons/icon_camera_small.png",
      magnifier: "/assets/scan_adventure_assets_complete/scan-adventure/icons/icon_magnifier.png",
      album: "/assets/scan_adventure_assets_complete/scan-adventure/icons/icon_album.png",
      scanCamera: "/assets/scan_adventure_assets_complete/scan-adventure/icons/icon_scan_camera.png",
      hintQuestion: "/assets/scan_adventure_assets_complete/scan-adventure/icons/icon_hint_question.png",
      locationDot: "/assets/scan_adventure_assets_complete/scan-adventure/icons/icon_location_dot.png"
    }
  }
} as const;

export function PageTitle(props: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  icon?: string;
}) {
  return (
    <header className="page-title">
      <div className="page-title-icon" aria-hidden="true">{props.icon ?? "⌖"}</div>
      <div>
        {props.eyebrow ? <p className="eyebrow">{props.eyebrow}</p> : null}
        <h1>{props.title}</h1>
        {props.subtitle ? <div className="page-title-subtitle">{props.subtitle}</div> : null}
      </div>
    </header>
  );
}

export function GameCard(props: {
  children: ReactNode;
  className?: string;
  as?: "section" | "article" | "div";
  variant?: "mission" | "hud" | "collection" | "profile" | "plain";
}) {
  const Tag = props.as ?? "section";
  const variant = props.variant ? ` card-${props.variant}` : "";
  return <Tag className={`game-card${variant}${props.className ? ` ${props.className}` : ""}`}>{props.children}</Tag>;
}

export function AssetSlot(props: {
  kind: keyof typeof citywalkAssetSlots;
  name: string;
  className?: string;
}) {
  const path = `${citywalkAssetSlots[props.kind]}${props.name}.svg`;
  return (
    <span
      aria-hidden="true"
      className={`asset-slot asset-${props.kind}${props.className ? ` ${props.className}` : ""}`}
      data-asset-src={path}
      data-asset-slot={`${props.kind}/${props.name}`}
      style={{ backgroundImage: `url(${path})` }}
    />
  );
}

export function BadgeTag(props: {
  children: ReactNode;
  tone?: "main" | "hidden" | "success" | "locked" | "mystery";
  className?: string;
}) {
  return <span className={`badge-tag tag-${props.tone ?? "main"}${props.className ? ` ${props.className}` : ""}`}>{props.children}</span>;
}

export function HeroStartCard() {
  return (
    <section className="hero-start-card">
      <AssetSlot kind="textures" name="city-map-grid" className="hero-asset-slot" />
      <div className="hero-path" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="hero-radar" aria-hidden="true"><span /><span /><span /></div>
      <div>
        <p className="eyebrow">CITYWALK</p>
        <h1>城市探索冒险</h1>
        <p>现实街区已加载，生成你的 5 站任务地图。到站拍照，街景会浮现可点击 HUD 线索。</p>
      </div>
      <div className="hero-compass" aria-hidden="true">
        <span>N</span>
        <i />
      </div>
      <div className="hero-console">
        <span>5 STOPS</span>
        <span>PHOTO HUD</span>
        <span>LIVE MAP</span>
      </div>
      <span className="hud-badge main">MAIN QUEST</span>
    </section>
  );
}

export function ChoiceGrid(props: {
  label: string;
  options: Array<string | { label: string; detail?: string; disabled?: boolean }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="choice-grid">
      <legend>{props.label}</legend>
      <div>
        {props.options.map((option) => {
          const item = typeof option === "string" ? { label: option } : option;
          return (
            <button
              aria-pressed={props.value === item.label}
              className={props.value === item.label ? "selected" : ""}
              disabled={item.disabled}
              key={item.label}
              onClick={() => props.onChange(item.label)}
              type="button"
            >
              <strong>{item.label}</strong>
              {item.detail ? <small>{item.detail}</small> : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ChoiceChips(props: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="choice-grid compact">
      <legend>{props.label}</legend>
      <div>
        {props.options.map((option) => (
          <button
            aria-pressed={props.value === option}
            className={props.value === option ? "selected" : ""}
            disabled={props.disabled}
            key={option}
            onClick={() => props.onChange(option)}
            type="button"
          >
            <strong>{option}</strong>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function StatPill(props: { label: string; value: string | number; tone?: "blue" | "teal" | "orange" | "gold" | "gray" }) {
  return (
    <span className={`stat-pill ${props.tone ?? "blue"}`}>
      <b>{props.value}</b>
      <small>{props.label}</small>
    </span>
  );
}

export function RouteMapCard(props: {
  session: ExpandedGameSession;
  currentNode: ExpandedStoryNode;
}) {
  const completed = new Set(props.session.completedMainMarkers);
  const total = props.session.story.nodes.length;
  return (
    <GameCard className="route-map-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">ROUTE MAP</p>
          <h2>5 站任务地图</h2>
        </div>
        <StatPill label="进度" value={`${props.currentNode.order}/${props.session.story.nodes.length}`} tone="teal" />
      </div>
      <div className="route-map-track" aria-hidden="true">
        <img className="route-panel-art" src={citywalkAssets.route.routePanelMap} alt="" />
        <img className="route-line-art" src={citywalkAssets.route.routeLine} alt="" />
        <img className="route-hidden-art" src={citywalkAssets.route.routeHiddenNode} alt="" />
        {props.session.story.nodes.map((node, index) => {
          const done = completed.has(node.id) || index < props.session.currentNodeIndex;
          const current = node.id === props.currentNode.id;
          const state = done ? "completed" : current ? "current" : "locked";
          return (
            <i className={state} key={node.id}>
              <img src={routeNodeAsset(index, total, done, current)} alt="" />
            </i>
          );
        })}
      </div>
      <div className="route-map-line" aria-label="5 站路线进度">
        {props.session.story.nodes.map((node, index) => {
          const done = completed.has(node.id) || index < props.session.currentNodeIndex;
          const current = node.id === props.currentNode.id;
          const state = done ? "completed" : current ? "current" : "locked";
          return (
            <article className={`route-node ${state}`} key={node.id}>
              <i>
                <img src={routeNodeAsset(index, total, done, current)} alt="" />
                <b>{done ? "✓" : node.order}</b>
              </i>
              <div>
                <strong>{node.locationName}</strong>
                <p>{node.photoPrompt || node.mainTask}</p>
              </div>
              <span>{done ? "已完成" : current ? "进行中" : "未解锁"}</span>
            </article>
          );
        })}
      </div>
    </GameCard>
  );
}

export function MissionPanel(props: {
  node: ExpandedStoryNode;
  total: number;
  title?: string;
  cta?: ReactNode;
}) {
  const mainTask = compactTaskText(props.node.photoPrompt || props.node.mainTask);
  const targetNumber = extractTargetNumber(`${props.node.photoPrompt} ${props.node.mainTask} ${props.node.locationName}`);
  return (
    <section className="mission-panel">
      <div className="mission-panel-top">
        <span>关卡 {props.node.order}/{props.total}</span>
        <em>进行中</em>
      </div>
      {props.title ? <p className="mission-panel-kicker">{props.title}</p> : null}
      <h2>{props.node.locationName}</h2>
      <div className="mission-route-strip" aria-label="五站路线进度">
        {Array.from({ length: props.total }, (_, index) => {
          const order = index + 1;
          const current = order === props.node.order;
          const done = order < props.node.order;
          const finish = order === props.total;
          return (
            <span className={current ? "current" : done ? "done" : "pending"} key={order}>
              <b>{order}</b>
              <small>{current ? "当前站" : finish ? "终点" : done ? "已完成" : "待完成"}</small>
            </span>
          );
        })}
      </div>
      <div className="mission-target-box">
        <div>
          <span>主线目标</span>
          {targetNumber ? <em>目标编号：{targetNumber}</em> : null}
        </div>
        <p>{mainTask}</p>
      </div>
      <div className="mission-hidden-box">
        <span>隐藏彩蛋</span>
        <p>{compactHiddenText(props.node.hiddenTask)}</p>
      </div>
      {props.cta ? <div className="mission-panel-action">{props.cta}</div> : null}
    </section>
  );
}

function compactTaskText(value: string) {
  const text = value
    .replace(/^请你?/, "")
    .replace(/。.*$/, "")
    .replace(/，.*$/, "")
    .trim();
  return text.length > 28 ? `${text.slice(0, 27)}...` : text;
}

function compactHiddenText(value: string) {
  const text = value.replace(/^寻找/, "寻找").replace(/。.*$/, "").trim();
  return text.length > 32 ? `${text.slice(0, 31)}...` : text;
}

function extractTargetNumber(value: string) {
  return value.match(/\d+\s*号/)?.[0].replace(/\s+/g, "") ?? "";
}

export function IdentityBonusCard(props: {
  role?: PlayerRoleCard;
  identity: IdentityProfile;
}) {
  return (
    <GameCard className="identity-bonus-card">
      <span>你的职业</span>
      <strong>{props.role?.name ?? props.identity.title}</strong>
      <p>{props.identity.bonus}</p>
    </GameCard>
  );
}

export function PhotoHudStage(props: {
  overlay: PhotoOverlay;
  imageUrl?: string;
  demo?: boolean;
  scanning?: boolean;
  discoveredIds?: Set<string>;
  onMarkerSelect?: (marker: OverlayMarker) => void;
}) {
  const laidOutMarkers = layoutHudMarkers(props.overlay.markers);
  return (
    <div className={`photo-hud-stage scan-hud-demo-stage${props.demo ? " demo" : ""}${props.scanning ? " scanning" : ""}`}>
      {props.imageUrl ? <img className="scan-hud-photo" src={props.imageUrl} alt="现场扫描照片" /> : <DemoStreet />}
      <img className="scan-hud-frame-overlay scan-decoration" src={citywalkAssets.scanAdventure.hudFrameOverlay} alt="" />
      <img className="scan-hud-reticle scan-decoration" src={citywalkAssets.scanAdventure.hudReticle} alt="" />
      <img className="scan-hud-radar scan-decoration" src={citywalkAssets.scanAdventure.hudRadar} alt="" />
      <img className="scan-hud-compass scan-decoration" src={citywalkAssets.scanAdventure.hudCompass} alt="" />
      <img className="scan-hud-sparkles scan-decoration" src={citywalkAssets.scanAdventure.sparkleParticles} alt="" />
      <div className="hud-grid-overlay" aria-hidden="true" />
      <div className="hud-corners" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="hud-target-lock" aria-hidden="true"><i /><span>TARGET LOCK</span></div>
      <div className="hud-coordinate-chip" aria-hidden="true">X 31.23 / Y 121.48</div>
      <div className="scan-vignette" />
      <div className="hud-topline">
        <span>{props.demo ? "HUD DEMO" : "LIVE SCAN"}</span>
        <strong>{props.scanning ? "SCANNING" : "READY"}</strong>
      </div>
      {props.overlay.arrows.map((arrow, index) => (
        <HudArrow arrow={arrow} key={`${arrow.label}-${index}`} />
      ))}
      {laidOutMarkers.map((marker) => (
        <HudMarker
          discovered={props.discoveredIds?.has(marker.id) ?? false}
          disabled={props.demo}
          key={marker.id}
          marker={marker}
          onClick={() => props.onMarkerSelect?.(marker)}
        />
      ))}
    </div>
  );
}

export function layoutHudMarkers(markers: OverlayMarker[]): OverlayMarker[] {
  const minX = 0.18;
  const maxX = 0.82;
  const minY = 0.22;
  const maxY = 0.78;
  const minDistance = 0.13;
  const offsets = [
    [0, 0],
    [0.16, 0],
    [-0.16, 0],
    [0, 0.15],
    [0, -0.15],
    [0.12, 0.12],
    [-0.12, 0.12],
    [0.12, -0.12],
    [-0.12, -0.12]
  ] as const;
  const placed: OverlayMarker[] = [];

  for (const marker of markers) {
    const baseX = clamp(marker.x, minX, maxX);
    const baseY = clamp(marker.y, minY, maxY);
    let best = { ...marker, x: baseX, y: baseY };

    for (const [offsetX, offsetY] of offsets) {
      const candidate = {
        ...marker,
        x: clamp(baseX + offsetX, minX, maxX),
        y: clamp(baseY + offsetY, minY, maxY)
      };
      if (placed.every((item) => markerDistance(item, candidate) >= minDistance)) {
        best = candidate;
        break;
      }
    }

    placed.push(best);
  }

  return placed;
}

function markerDistance(first: OverlayMarker, second: OverlayMarker) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return (min + max) / 2;
  return Math.min(max, Math.max(min, value));
}

export function HudMarker(props: {
  marker: OverlayMarker;
  discovered?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const tone = props.marker.type === "main" ? "main" : "hidden";
  return (
    <button
      className={`hud-marker ${tone}${props.discovered ? " found" : ""}`}
      disabled={props.disabled || props.discovered}
      onClick={props.onClick}
      style={{ left: `${props.marker.x * 100}%`, top: `${props.marker.y * 100}%` }}
      type="button"
    >
      <span>{props.discovered ? "✓" : props.marker.type === "main" ? "!" : "?"}</span>
      <em>{props.discovered ? "FOUND" : props.marker.label || (props.marker.type === "main" ? "MAIN QUEST" : "HIDDEN EGG")}</em>
    </button>
  );
}

export function ClueToast(props: { title: string; text: string; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(props.onClose, 2500);
    return () => window.clearTimeout(timer);
  }, [props]);

  return (
    <aside className="clue-toast" role="status">
      <strong>{props.title}</strong>
      <p>{props.text}</p>
      <button aria-label="关闭提示" onClick={props.onClose} type="button">×</button>
    </aside>
  );
}

export function CollectionGrid(props: {
  items: Array<{ id: string; title: string; type: string; content?: string; locked?: boolean; rare?: boolean }>;
  onLockedClick?: (item: { id: string; title: string; type: string; content?: string; locked?: boolean; rare?: boolean }) => void;
}) {
  return (
    <div className="collection-grid">
      {props.items.map((item) => {
        const frame = item.locked
          ? collectionAssets.clueCards.lockedBg
          : collectionAssets.clueCards.unlockedBg;
        return (
        <article className={`collection-card ${collectionTone(item.type)}${item.locked ? " locked" : ""}${item.rare ? " rare" : ""}`} key={item.id}>
          <img aria-hidden="true" className="collection-card-frame" src={frame} alt="" />
          {item.locked ? (
            <div className="collection-locked-tag">
              <img className="collection-locked-tag-plate" src={collectionAssets.clueCards.lockedTagPlate} alt="" aria-hidden="true" />
              <img className="collection-locked-tag-icon" src={collectionAssets.clueCards.lockIconSmall} alt="" aria-hidden="true" />
              <span>LOCKED</span>
            </div>
          ) : null}
          <div className="collection-rarity">
            {!item.locked ? <img src={collectionAssets.clueCards.unlockedTagPlate} alt="" aria-hidden="true" /> : null}
            <span>{item.locked ? "LOCKED" : item.rare ? "HIDDEN" : "UNLOCKED"}</span>
          </div>
          <div className="collection-thumb" aria-hidden="true">
            {!item.locked ? <img className="collection-card-unlocked-frame" src={collectionAssets.clueCards.unlockedImageFrame} alt="" /> : null}
            {item.locked ? <img className="collection-photo-placeholder" src={citywalkAssets.codex.emptyCodexBook} alt="" /> : null}
            {item.locked ? "?" : item.rare ? "★" : "⌖"}
          </div>
          <span className="collection-type">{item.type}</span>
          <h3>{item.locked ? "???" : item.title}</h3>
          <p>{item.locked ? "未发现" : item.content}</p>
          <em>{item.locked ? "锁定" : "已解锁 · 可阅读"}</em>
          {!item.locked ? <img aria-hidden="true" className="collection-collected-stamp" src={collectionAssets.clueCards.collectedStamp} alt="" /> : null}
          {item.locked ? <img aria-hidden="true" className="collection-locked-bottom-badge" src={collectionAssets.clueCards.lockedBottomBadge} alt="" /> : null}
          {item.locked && props.onLockedClick ? (
            <button className="collection-lock-hit" onClick={() => props.onLockedClick?.(item)} type="button">
              查看解锁提示
            </button>
          ) : null}
        </article>
      );
      })}
    </div>
  );
}

function collectionTone(type: string) {
  if (/隐藏|彩蛋/.test(type)) return " tone-hidden";
  if (/人物/.test(type)) return " tone-person";
  if (/神秘/.test(type)) return " tone-mystery";
  if (/主线/.test(type)) return " tone-main";
  return " tone-evidence";
}

export function ClearReportCard(props: {
  title: string;
  city: string;
  weather: string;
  timeOfDay: string;
  completed: number;
  total: number;
  main: number;
  hidden: number;
  roleTitle: string;
  ending: string;
}) {
  const reportStyle = {
    "--report-bg": `url(${citywalkAssets.report.clearReportCardBg})`
  } as CSSProperties;
  return (
      <section className="clear-report-card" style={reportStyle}>
      <p className="eyebrow">CITYWALK CLEAR REPORT</p>
      <div className="clear-stamp">CLEAR</div>
      <img className="clear-stamp-art" src={citywalkAssets.report.clearStamp} alt="" />
      <img className="rank-art" src={citywalkAssets.report.rankA} alt="" />
      <img className="report-seal-art" src={citywalkAssets.report.reportSeal} alt="" />
      <h2>{props.title}</h2>
      <p>{props.city} · {props.weather} · {props.timeOfDay}</p>
      <div className="clear-metrics">
        <StatPill label="CLEAR" value={`${props.completed}/${props.total}`} tone="teal" />
        <StatPill label="主线" value={props.main} tone="blue" />
        <StatPill label="隐藏" value={props.hidden} tone="orange" />
        <StatPill label="评级" value="A" tone="gold" />
      </div>
      <strong>{props.roleTitle} / URBAN EXPLORER</strong>
      <p>{props.ending}</p>
      <div className="share-actions">
        <button type="button">保存报告</button>
        <button type="button">朋友圈</button>
        <button type="button">微博</button>
        <button type="button">小红书</button>
      </div>
    </section>
  );
}

export function SafetyNote() {
  return (
    <GameCard className="safety-note">
      <strong>安全探索边界</strong>
      <p>只拍摄公共可见区域：门牌、路牌、橱窗、导视牌和公共装置。不进入私人区域，不拍摄陌生人，不打扰路人或商户，不接触他人物品。</p>
    </GameCard>
  );
}

export function EmptyState(props: { eyebrow: string; title: string; body?: string; href: string; action: string }) {
  return (
    <section className="empty-page">
      <p className="eyebrow">{props.eyebrow}</p>
      <h1>{props.title}</h1>
      {props.body ? <p>{props.body}</p> : null}
      <Link className="primary-action" href={props.href}>{props.action}</Link>
    </section>
  );
}

export const PageHeader = PageTitle;
export const PaperCard = GameCard;
export const AdventureReportCard = ClearReportCard;

function HudArrow(props: { arrow: OverlayArrow }) {
  const angle = Math.atan2(props.arrow.toY - props.arrow.fromY, props.arrow.toX - props.arrow.fromX);
  const width = Math.max(78, Math.hypot(props.arrow.toX - props.arrow.fromX, props.arrow.toY - props.arrow.fromY) * 260);
  return (
    <div
      className="hud-arrow"
      style={{
        left: `${props.arrow.fromX * 100}%`,
        top: `${props.arrow.fromY * 100}%`,
        width,
        rotate: `${angle}rad`
      }}
    >
      <img src={citywalkAssets.hud.nextRouteArrow} alt="" />
      <span>{props.arrow.label || "NEXT"}</span>
    </div>
  );
}

export function AchievementBadgeGrid(props: { unlockedCount?: number } = {}) {
  const badges = [
    { src: citywalkAssets.badges.cityRoamer, title: "城市漫游者", rarity: "COMMON" },
    { src: citywalkAssets.badges.coordinateCalibrator, title: "坐标校准", rarity: "COMMON" },
    { src: citywalkAssets.badges.interfaceObserver, title: "界面观察员", rarity: "RARE" },
    { src: citywalkAssets.badges.eggHunter, title: "彩蛋猎人", rarity: "EPIC" },
    { src: citywalkAssets.badges.oldCityRecorder, title: "旧城记录者", rarity: "RARE" },
    { src: citywalkAssets.badges.nightExplorer, title: "夜行探索者", rarity: "RARE" },
    { src: citywalkAssets.badges.hiddenLineUnlocker, title: "隐线解锁者", rarity: "EPIC" },
    { src: citywalkAssets.badges.fiveStopClear, title: "五站通关者", rarity: "LEGEND" },
    { title: "晨间路线", rarity: "LOCKED" },
    { title: "雨天观察", rarity: "LOCKED" },
    { title: "夜色坐标", rarity: "LOCKED" },
    { title: "终章见证", rarity: "LOCKED" }
  ];
  const unlockedCount = props.unlockedCount ?? 4;

  return (
    <div className="badge-grid">
      {badges.map((badge, index) => {
        const locked = index >= unlockedCount;
        return (
        <span
          aria-label={`${badge.title}${locked ? "，未解锁" : "，已解锁"}`}
          className={locked ? "locked" : "unlocked"}
          key={badge.title}
          role="img"
        >
          {badge.src && !locked ? <img src={badge.src} alt="" /> : <b aria-hidden="true">?</b>}
          <strong>{badge.title}</strong>
          <em>{badge.rarity}</em>
        </span>
        );
      })}
    </div>
  );
}

function routeNodeAsset(index: number, total: number, done: boolean, current: boolean) {
  if (current) return citywalkAssets.route.nodeCurrent;
  if (index === 0 && done) return citywalkAssets.route.nodeStart;
  if (done) return citywalkAssets.route.nodeDone;
  if (index === total - 1) return citywalkAssets.route.nodeFinish;
  return citywalkAssets.route.nodeLocked;
}

function DemoStreet() {
  return (
    <div className="demo-street demo-street-asset" aria-hidden="true">
      <img src={citywalkAssets.textures.scanStreetHudDemo} alt="" />
    </div>
  );
}
