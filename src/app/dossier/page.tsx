"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { useCitywalkApp } from "../app-client";
import { EmptyState } from "../ui";
import type { PlayerRoleCard } from "../../lib/types";

const taskDossierBase = "/assets/citywalk_task_dossier_assets_final/webp";

const taskDossierAssets = {
  bgSunny: `${taskDossierBase}/bg-dossier-sunny.webp`,
  heroCase: `${taskDossierBase}/hero-case-mermaid-bookstore.webp`,
  topSecretStamp: `${taskDossierBase}/deco-top-secret-stamp.webp`,
  paperTexture: `${taskDossierBase}/deco-paper-texture.webp`,
  mapLines: `${taskDossierBase}/deco-map-lines.webp`,
  goldCorners: `${taskDossierBase}/deco-gold-corners.webp`,
  sparkles: `${taskDossierBase}/deco-sparkles.webp`,
  compassGold: `${taskDossierBase}/icon-compass-gold.webp`,
  locationPin: `${taskDossierBase}/icon-location-pin.webp`,
  flag: `${taskDossierBase}/icon-flag.webp`,
  mainline: `${taskDossierBase}/icon-mainline.webp`,
  hiddenCube: `${taskDossierBase}/icon-hidden-cube.webp`,
  clock: `${taskDossierBase}/icon-clock.webp`,
  objectiveSearch: `${taskDossierBase}/icon-objective-search.webp`,
  objectiveCamera: `${taskDossierBase}/icon-objective-camera.webp`,
  objectiveChat: `${taskDossierBase}/icon-objective-chat.webp`,
  objectiveLock: `${taskDossierBase}/icon-objective-lock.webp`,
  rewardExp: `${taskDossierBase}/reward-exp-star.webp`,
  rewardCoin: `${taskDossierBase}/reward-coin.webp`,
  rewardCrystal: `${taskDossierBase}/reward-crystal.webp`,
  rewardTrophy: `${taskDossierBase}/reward-trophy.webp`,
  avatarCollectorChenyu: `${taskDossierBase}/avatar-collector-chenyu.webp`,
  avatarBaristaLinxiao: `${taskDossierBase}/avatar-barista-linxiao.webp`,
  avatarResidentZhouyuan: `${taskDossierBase}/avatar-resident-zhouyuan.webp`
} as const;

const rolePresentations = [
  {
    roleTitle: "旧书收藏者",
    name: "陈屿",
    avatar: taskDossierAssets.avatarCollectorChenyu,
    description: "擅长观察细节，能记住人的面孔。"
  },
  {
    roleTitle: "咖啡馆店员",
    name: "林晓",
    avatar: taskDossierAssets.avatarBaristaLinxiao,
    description: "擅长整理和社交。"
  },
  {
    roleTitle: "居民调查员",
    name: "周远",
    avatar: taskDossierAssets.avatarResidentZhouyuan,
    description: "擅长技术分析，能快速理解的数据。"
  }
];

export default function DossierPage() {
  const app = useCitywalkApp();
  const session = app.session;
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [expanded, setExpanded] = useState(false);

  if (!session) {
    return (
      <EmptyState
        action="去生成"
        body="系统会先创建任务档案、探索职业和 5 站任务地图。"
        eyebrow="档案尚未生成"
        href="/"
        title="先生成一份城市冒险档案"
      />
    );
  }

  const dossier = session.story.dossier;
  const activeRoleId = selectedRoleId || session.selectedRoleId || "";
  const activeRole = session.story.playerRoles.find((role) => role.id === activeRoleId);
  const heroNode = session.story.nodes[0];
  const city = session.context.city ?? "上海";
  const total = session.story.nodes.length;
  const completedMain = session.completedMainMarkers.length;
  const hiddenDiscoveries = session.photoDiscoveries.filter((item) => item.markerType === "hidden").length;
  const knownClues = session.knownEvidenceIds.length + session.photoDiscoveries.length;
  const primaryCtaLabel = activeRoleId ? "开始 5 站探索" : "选择探索职业";
  const dossierStyle = {
    "--dossier-bg-image": `url(${taskDossierAssets.bgSunny})`,
    "--dossier-paper-texture": `url(${taskDossierAssets.paperTexture})`,
    "--dossier-map-lines": `url(${taskDossierAssets.mapLines})`,
    "--dossier-gold-corners": `url(${taskDossierAssets.goldCorners})`,
    "--dossier-sparkles": `url(${taskDossierAssets.sparkles})`
  } as CSSProperties;
  const missionCoverSrc = taskDossierAssets.heroCase;

  const handlePrimaryCta = () => {
    if (!activeRoleId) {
      document.querySelector(".dossier-role-section")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    void app.selectRole(activeRoleId);
  };

  return (
    <section className="dossier-page" style={dossierStyle}>
      <header className="dossier-topbar">
        <a className="subpage-back" href="/play">‹ 返回任务</a>
        <h1><span aria-hidden="true" />任务档案<span aria-hidden="true" /></h1>
        <StampBadge />
      </header>

      <section className="dossier-main-card">
        <MissionCover
          locationName={heroNode?.locationName ?? "武康路旧书店门口"}
          src={missionCoverSrc}
        />
        <div className="dossier-main-content">
          <div className="dossier-main-header">
            <span className="case-id">{dossier.caseFileId || "CF-2024-001"}</span>
          </div>
          <h2>{dossier.title}</h2>
          <p className="dossier-location-line">
            <span>当前地点</span>
            <strong>{heroNode?.locationName ?? "武康路旧书店门口"} <img src={taskDossierAssets.locationPin} alt="" aria-hidden="true" /></strong>
          </p>
          <div className="tag-row dossier-tags">
            <span>类型：探索</span>
            <span>区域：{city}</span>
            <span>难度：★★★☆☆</span>
            <span>推荐 Lv.8</span>
          </div>
        </div>
      </section>

      <DossierStatusStrip completedMain={completedMain} hiddenDiscoveries={hiddenDiscoveries} total={total} />

      <section className="dossier-paper-card dossier-story-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">STORY BRIEF</p>
            <h2>案件摘要</h2>
          </div>
          <button className="text-button" onClick={() => setExpanded((value) => !value)} type="button">
            {expanded ? "收起" : "展开"}
          </button>
        </div>
        <p className={expanded ? "" : "line-clamp"}>{session.story.openingPremise || dossier.background}</p>
      </section>

      <section className="dossier-paper-card dossier-objectives-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">OBJECTIVES</p>
            <h2>完成目标</h2>
          </div>
          <span className="objective-progress-badge">进度 {completedMain}/{total} · 约 45 min</span>
        </div>
        <div className="objective-list">
          <ObjectiveItem icon={taskDossierAssets.objectiveSearch} label="探索关键线索" progress={`${Math.min(knownClues, total)}/${total}`} />
          <ObjectiveItem icon={taskDossierAssets.objectiveCamera} label="拍摄指定地点图片" progress={`${completedMain}/${total}`} />
          <ObjectiveItem icon={taskDossierAssets.objectiveChat} label="完成现场 NPC 提示" progress={session.selectedRoleId ? "1/1" : "0/1"} />
          <ObjectiveItem icon={taskDossierAssets.objectiveLock} label="阅读相关隐藏线索" progress={`${hiddenDiscoveries}/3`} />
        </div>
      </section>

      <section className="dossier-paper-card dossier-rewards-card">
        <p className="eyebrow">REWARDS</p>
        <h2>任务奖励</h2>
        <div className="reward-grid">
          <RewardCard icon={taskDossierAssets.rewardExp} label="EXP" value="1200" />
          <RewardCard icon={taskDossierAssets.rewardCoin} label="探索币" value="×150" />
          <RewardCard icon={taskDossierAssets.rewardCrystal} label="神秘碎片" value="×3" />
          <RewardCard icon={taskDossierAssets.rewardTrophy} label="成就点" value="×40" />
        </div>
      </section>

      <section className="dossier-paper-card dossier-role-section">
        <div className="card-heading">
          <div>
            <p className="eyebrow">CLASS SELECT</p>
            <h2>选择探索职业</h2>
          </div>
        </div>
        <div className="role-grid">
          {session.story.playerRoles.map((role, index) => {
            const display = roleDisplayFor(role, index);
            return (
              <button
                className={activeRoleId === role.id ? "role-card selected" : "role-card"}
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                type="button"
              >
                <img src={display.avatar} alt="" aria-hidden="true" />
                <span>{display.roleTitle}</span>
                <strong>{display.name}</strong>
                <small>{display.description}</small>
                <b aria-hidden="true">+</b>
              </button>
            );
          })}
        </div>

        {activeRole ? (
          <article className="role-detail-card">
            <strong>{activeRole.name} · {activeRole.roleTitle}</strong>
            <p>{activeRole.bio}</p>
            <div className="tag-row">
              <span>被动：{activeRole.explorationAbility || "更容易发现街角细节"}</span>
              <span>目标：{activeRole.hiddenObjective || activeRole.privateGoal}</span>
            </div>
          </article>
        ) : null}

        {app.error ? <p className="product-error">{app.error}</p> : null}
      </section>

      <div className="dossier-action-bar" aria-label="任务档案操作">
        <a className="dossier-secondary-cta" href="/play">返回任务</a>
        <button
          className="dossier-primary-cta"
          disabled={app.loading}
          onClick={handlePrimaryCta}
          type="button"
        >
          <img src={taskDossierAssets.compassGold} alt="" aria-hidden="true" />
          <span>
            {app.loading ? "初始化职业..." : primaryCtaLabel}
            <small>{activeRole ? `以「${roleDisplayFor(activeRole, 0).roleTitle}」身份出发` : "先选职业，再进入路线"}</small>
          </span>
        </button>
      </div>
    </section>
  );
}

function StampBadge() {
  return <img className="stamp-badge" src={taskDossierAssets.topSecretStamp} alt="TOP SECRET" />;
}

function MissionCover(props: {
  locationName: string;
  src: string;
}) {
  return (
    <div className="mission-cover">
      <img src={props.src} alt={`${props.locationName}任务封面`} />
      <span className="cover-compass" aria-hidden="true"><img src={taskDossierAssets.compassGold} alt="" /></span>
      <span className="cover-sign" aria-hidden="true">FIELD</span>
      <strong><img src={taskDossierAssets.locationPin} alt="" aria-hidden="true" />{props.locationName}</strong>
    </div>
  );
}

function DossierStatusStrip(props: { completedMain: number; hiddenDiscoveries: number; total: number }) {
  const stats = [
    { icon: taskDossierAssets.flag, value: `${props.total}处据点`, label: "据点" },
    { icon: taskDossierAssets.mainline, value: `主线 ${props.completedMain}/${props.total}`, label: "主线" },
    { icon: taskDossierAssets.hiddenCube, value: `隐藏 ${props.hiddenDiscoveries}/3`, label: "隐藏" },
    { icon: taskDossierAssets.clock, value: "预计 45~60分", label: "预计" }
  ];
  return (
    <section className="dossier-status-strip" aria-label="任务状态">
      {stats.map((item) => (
        <span key={item.label}>
          <img src={item.icon} alt="" aria-hidden="true" />
          <strong>{item.value}</strong>
          <small>{item.label}</small>
        </span>
      ))}
    </section>
  );
}

function ObjectiveItem(props: { icon: string; label: string; progress: string }) {
  return (
    <p className="objective-item">
      <span aria-hidden="true"><img src={props.icon} alt="" /></span>
      <strong>{props.label}</strong>
      <em>{props.progress}</em>
      <i aria-hidden="true">›</i>
    </p>
  );
}

function RewardCard(props: { icon: string; label: string; value: string }) {
  return (
    <article className="reward-item">
      <i aria-hidden="true"><img src={props.icon} alt="" /></i>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </article>
  );
}

function roleDisplayFor(role: PlayerRoleCard, index: number) {
  return rolePresentations[index] ?? {
    roleTitle: role.roleTitle,
    name: role.name,
    avatar: taskDossierAssets.avatarCollectorChenyu,
    description: role.explorationAbility || role.hintStyle || role.relationshipToCase
  };
}
