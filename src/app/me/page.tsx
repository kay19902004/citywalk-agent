"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useCitywalkApp } from "../app-client";
import { citywalkerProfileAssets } from "../profile-assets";
import { GameCard } from "../ui";

const level = 12;
const nextLevel = level + 1;
const currentExp = 2800;
const nextLevelExp = 4460;
const expProgress = Math.round((currentExp / nextLevelExp) * 100);
const expRemaining = nextLevelExp - currentExp;
const unlockedBadgeCount = 4;

const badgeLabels = [
  "路线启程",
  "隐藏故事",
  "本地风味",
  "历史线索",
  "晨光漫游",
  "夜行漫步",
  "桥畔穿行",
  "博物发现",
  "弄堂探索",
  "照片坐标",
  "地图专家",
  "终章冒险家"
] as const;

const badgeRarities = [
  "COMMON",
  "COMMON",
  "COMMON",
  "RARE",
  "RARE",
  "RARE",
  "RARE",
  "EPIC",
  "EPIC",
  "EPIC",
  "LEGEND",
  "LEGEND"
] as const;

export default function MePage() {
  const app = useCitywalkApp();
  const completed = app.session
    ? Math.min(app.session.story.nodes.length, Math.max(app.session.currentNodeIndex, app.session.completedMainMarkers.length))
    : 0;
  const total = app.session?.story.nodes.length ?? 5;
  const hidden = app.session?.photoDiscoveries.filter((item) => item.markerType === "hidden").length ?? 0;
  const collected = (app.session?.knownEvidenceIds.length ?? 0) + (app.session?.photoDiscoveries.length ?? 0);
  const activeMissionTitle = app.session?.story.dossier.title ?? app.geo.landmarkName ?? "尚未生成任务";
  const activeMissionStatus = app.session ? "ACTIVE" : "READY";
  const activeMissionSummary = app.session
    ? `完成 ${completed}/${total} · 收集 ${collected} 条线索`
    : "生成任务地图后开始记录";
  const stats = [
    { label: "完成站点", value: completed, tone: "cyan", iconSrc: citywalkerProfileAssets.stats.completedSpot },
    { label: "隐藏彩蛋", value: hidden, tone: "mint", iconSrc: citywalkerProfileAssets.stats.hiddenEgg },
    { label: "历史冒险", value: "3", tone: "blue", iconSrc: citywalkerProfileAssets.stats.historyAdventure },
    { label: "探索评级", value: "A", tone: "gold", iconSrc: citywalkerProfileAssets.stats.explorationRating }
  ] as const;

  return (
    <section className="page-stack profile-page" aria-labelledby="profile-title">
      <header className="profile-intro">
        <p className="eyebrow">ADVENTURER ID</p>
        <h1 id="profile-title">探索者证件</h1>
        <p>城市探索记录、等级进度与成就徽章都在这里。</p>
      </header>

      <section
        className="profile-hero-card"
        aria-label="城市探索者执照"
        style={{ "--profile-license-bg": `url(${citywalkerProfileAssets.backgrounds.licenseCard})` } as CSSProperties}
      >
        <img
          alt=""
          aria-hidden="true"
          className="license-watermark"
          src={citywalkerProfileAssets.decorations.shanghaiSkyline}
        />
        <img alt="" aria-hidden="true" className="license-seal" src={citywalkerProfileAssets.decorations.citySeal} />
        <div className="profile-avatar" aria-hidden="true">C</div>
        <div className="profile-main-info">
          <span className="license-kicker">ADVENTURER LICENSE</span>
          <h2>城市探索者</h2>
          <p>Adventurer License · 上海 · Status Active</p>
          <div className="license-level-row">
            <strong>Lv.{level}</strong>
            <span>to Lv.{nextLevel}</span>
          </div>
          <div className="exp-track" aria-label={`Lv.${level} 到 Lv.${nextLevel} 进度 ${expProgress}%`}>
            <span style={{ width: `${expProgress}%` }} />
          </div>
          <div className="license-meta">
            <em>EXP {currentExp} / {nextLevelExp}</em>
            <em>距离 Lv.{nextLevel} 还差 {expRemaining} EXP</em>
          </div>
        </div>
        <strong className="profile-rank">Lv.{level}</strong>
        <Link className="license-id-action" href="/dossier" aria-label="查看当前任务档案和探索者执照详情">
          ID
        </Link>
      </section>

      <section className="adventurer-stats">
        {stats.map((stat) => (
          <article className={`adventurer-stat-card tone-${stat.tone}`} key={stat.label}>
            <img alt="" aria-hidden="true" className="adventurer-stat-icon" src={stat.iconSrc} />
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <GameCard className="achievement-card" variant="profile">
        <div className="card-heading">
          <div>
            <p className="eyebrow">BADGE COLLECTION</p>
            <h2>成就徽章 / Badge Collection</h2>
          </div>
          <span className="badge-count">{unlockedBadgeCount}/{citywalkerProfileAssets.badges.length}</span>
        </div>
        <ProfileBadgeGrid unlockedCount={unlockedBadgeCount} />
      </GameCard>

      <GameCard className="mission-log-card" variant="profile">
        <p className="eyebrow">MISSION LOG</p>
        <h2>历史任务记录</h2>
        <div className="history-list">
          <article>
            <span>{activeMissionStatus}</span>
            <i aria-hidden="true">01</i>
            <strong>{activeMissionTitle}</strong>
            <p>{activeMissionSummary}</p>
          </article>
          <article>
            <span>CLEAR</span>
            <i aria-hidden="true">02</i>
            <strong>小南门街区巡游</strong>
            <p>完成 5/5 · A 级探索者</p>
          </article>
        </div>
      </GameCard>

      <GameCard className="settings-card">
        <p className="eyebrow">SETTINGS</p>
        <Link href="/location">现实坐标设置</Link>
        <Link href="/dossier">查看当前任务档案</Link>
      </GameCard>
    </section>
  );
}

function ProfileBadgeGrid(props: { unlockedCount: number }) {
  if (props.unlockedCount <= 0) {
    return (
      <div className="badge-empty-state">
        <img src={citywalkerProfileAssets.emptyBadges} alt="暂无已解锁徽章" />
        <strong>暂无徽章</strong>
        <p>完成第一段城市探索后会点亮这里。</p>
      </div>
    );
  }

  return (
    <div className="badge-grid" aria-label="徽章收藏">
      {citywalkerProfileAssets.badges.map((src, index) => {
        const locked = index >= props.unlockedCount;
        const title = badgeLabels[index] ?? `探索徽章 ${index + 1}`;
        return (
          <span
            aria-label={`${title}${locked ? "，未解锁" : "，已解锁"}`}
            className={locked ? "locked" : "unlocked"}
            key={src}
            role="img"
          >
            <img
              alt={locked ? "未解锁徽章" : `${title}徽章`}
              src={locked ? citywalkerProfileAssets.lockedBadge : src}
            />
            <strong>{title}</strong>
            <em>{locked ? "LOCKED" : badgeRarities[index]}</em>
          </span>
        );
      })}
    </div>
  );
}
