"use client";

import { useState } from "react";
import { useCitywalkApp } from "../app-client";
import { getIdentityProfile } from "../../lib/identity-profile";
import Link from "next/link";
import { collectionAssets } from "../../lib/collection-assets";
import { ClearReportCard, CollectionGrid, GameCard } from "../ui";

export default function CluesPage() {
  const app = useCitywalkApp();
  const session = app.session;
  const [lockedTip, setLockedTip] = useState("");

  if (!session) {
    return (
      <section className="page-stack collection-page">
        <CollectionPageTitle />
        <CollectionGuideCard
          body="先创建任务档案并选择探索职业，之后扫描站点才能解锁图鉴。"
          href="/"
          action="生成任务地图"
        />
        {lockedTip ? <LockedClueTip text={lockedTip} /> : null}
        <CollectionGrid items={lockedPlaceholders()} onLockedClick={(item) => setLockedTip(`${item.type} 还未解锁。先生成任务地图，再前往当前站点扫描收集。`)} />
      </section>
    );
  }

  const unlocked = new Set(session.knownEvidenceIds);
  const selectedRole = session.story.playerRoles.find((role) => role.id === session.selectedRoleId);
  const identity = getIdentityProfile(selectedRole);
  const total = session.story.nodes.length;
  const completed = Math.min(total, Math.max(session.currentNodeIndex, session.completedMainMarkers.length));
  const hidden = session.photoDiscoveries.filter((item) => item.markerType === "hidden").length;
  const isComplete = completed >= total;
  const mainClues = session.completedMainMarkers.length;
  const unlockedCount = collectionItemsCount(session);
  const targetCollectionCount = Math.max(8, session.story.evidence.length + 3);
  const collectionPct = Math.min(100, Math.round((unlockedCount / targetCollectionCount) * 100));

  const collectionItems: Array<{ id: string; title: string; type: string; content?: string; locked?: boolean; rare?: boolean }> = [
    ...session.story.evidence.map((item) => ({
      id: item.id,
      title: item.title,
      type: item.kind,
      content: unlocked.has(item.id) ? item.content : undefined,
      locked: !unlocked.has(item.id)
    })),
    ...session.photoDiscoveries.map((item) => ({
      id: `${item.nodeId}-${item.markerId}`,
      title: item.markerType === "main" ? "主线照片线索" : "隐藏彩蛋",
      type: item.markerType === "main" ? "主线线索" : "隐藏彩蛋",
      content: item.clueText,
      rare: item.markerType === "hidden"
    })),
    ...Array.from({ length: Math.max(0, 6 - session.story.evidence.length) }, (_, index) => ({
      id: `locked-${index}`,
      title: "???",
      type: "神秘线索",
      locked: true
    }))
  ];
  const featuredItems = collectionItems.slice(0, 6);

  return (
    <section className="page-stack collection-page">
      <CollectionPageTitle />

      <GameCard className="collection-dashboard" variant="collection">
        <div className="collection-dashboard-head">
          <div>
            <p className="eyebrow">COLLECTION PROGRESS</p>
            <h2>城市线索库</h2>
            <p>已解锁的线索会在这里变成可阅读藏品，未发现项目会保持锁定。</p>
          </div>
          <strong className="collection-progress-badge">
            <img className="collection-progress-ring" src={collectionAssets.progress.badgeRing} alt="" aria-hidden="true" />
            <span>{collectionPct}%</span>
            <img className="collection-progress-ribbon" src={collectionAssets.progress.ribbon} alt="" aria-hidden="true" />
            <em>探索进度</em>
          </strong>
        </div>
        <div className="collection-progress-track"><i style={{ width: `${collectionPct}%` }} /></div>
        <section className="collection-stat-grid">
          <CollectionStatChip icon={collectionAssets.progress.iconMainClue} label="主线线索" tone="blue" value={`${mainClues}/${total}`} />
          <CollectionStatChip icon={collectionAssets.progress.iconHiddenEgg} label="隐藏彩蛋" tone="gold" value={`${hidden}/3`} />
          <CollectionStatChip icon={collectionAssets.progress.iconArchiveBook} label="图鉴收集" tone="green" value={unlockedCount} />
        </section>
      </GameCard>

      {collectionItems.filter((item) => !item.locked).length === 0 ? (
        <CollectionGuideCard
          body="前往扫描页，点击照片里的 MAIN QUEST 或 HIDDEN EGG 解锁图鉴。"
          href="/photo"
          action="去扫描"
        />
      ) : null}

      {isComplete ? (
        <ClearReportCard
          city={session.context.city ?? "上海"}
          completed={completed}
          ending={session.story.truthSummary}
          hidden={hidden}
          main={mainClues}
          roleTitle={selectedRole?.roleTitle ?? identity.title}
          timeOfDay={session.context.timeOfDay}
          title={session.story.title}
          total={total}
          weather={session.context.weather}
        />
      ) : null}

      {selectedRole ? (
        <GameCard className="collection-role-card" variant="profile">
          <img className="collection-owner-watermark" src={collectionAssets.owner.stampWatermark} alt="" aria-hidden="true" />
          <img className="collection-owner-photos" src={collectionAssets.owner.photoStack} alt="" aria-hidden="true" />
          <div className="collection-role-badge" aria-hidden="true">
            <img src={collectionAssets.owner.idBadge} alt="" aria-hidden="true" />
            <span>ID</span>
          </div>
          <div>
            <p className="eyebrow">ARCHIVE OWNER</p>
            <h2>{selectedRole.name} / {selectedRole.roleTitle}</h2>
            <p>{selectedRole.bio}</p>
          </div>
        </GameCard>
      ) : null}

      <GameCard className="collection-tabs" variant="collection">
        <button aria-label={`全部线索，${collectionItems.length} 个`} className="active" type="button"><CollectionFilterIcon name="all" /><span>全部</span><b>{collectionItems.length}</b></button>
        <button aria-label={`主线线索，${mainClues} 个`} type="button"><CollectionFilterIcon name="main" /><span>主线</span><b>{mainClues}</b></button>
        <button aria-label={`支线线索，${session.story.evidence.length} 个`} type="button"><CollectionFilterIcon name="branch" /><span>支线</span><b>{session.story.evidence.length}</b></button>
        <button aria-label={`隐藏彩蛋，${hidden} 个`} type="button"><CollectionFilterIcon name="hidden" /><span>隐藏</span><b>{hidden}</b></button>
        <button aria-label="神秘线索，未知数量" type="button"><CollectionFilterIcon name="mystery" /><span>神秘</span><b>?</b></button>
      </GameCard>

      {lockedTip ? <LockedClueTip text={lockedTip} /> : null}
      <CollectionGrid items={featuredItems} onLockedClick={(item) => setLockedTip(`${item.type} 仍处于锁定状态。继续扫描当前站点，寻找对应的 MAIN QUEST 或 HIDDEN EGG。`)} />

      {isComplete ? (
        <button className="primary-action large" type="button">查看收集成果</button>
      ) : (
        <Link className="primary-action large" href="/play">
          继续探索
          <small>返回任务地图扫描下一处线索</small>
        </Link>
      )}

      <details className="secondary-drawer">
        <summary>查看冒险时间线</summary>
        <GameCard className="timeline-card">
          <p className="eyebrow">TIMELINE</p>
          <h2>冒险时间线</h2>
          <div className="mini-route">
            {session.story.timeline.map((item, index) => (
              <article key={item}>
                <i>{index + 1}</i>
                <div>
                  <strong>{item}</strong>
                  <p>{index < completed ? "已记录" : "等待解锁"}</p>
                </div>
              </article>
            ))}
          </div>
        </GameCard>
      </details>
    </section>
  );
}

function collectionItemsCount(session: NonNullable<ReturnType<typeof useCitywalkApp>["session"]>) {
  return session.knownEvidenceIds.length + session.photoDiscoveries.length;
}

function CollectionPageTitle() {
  return (
    <GameCard className="collection-page-title" variant="collection">
      <img className="collection-title-frame" src={collectionAssets.hero.cardFrame} alt="" aria-hidden="true" />
      <img className="collection-title-route" src={collectionAssets.hero.mapRoute} alt="" aria-hidden="true" />
      <img className="collection-title-stamp" src={collectionAssets.hero.cityStamp} alt="" aria-hidden="true" />
      <img className="collection-title-compass" src={collectionAssets.hero.compassLarge} alt="" aria-hidden="true" />
      <span className="collection-title-icon" aria-hidden="true">
        <img src={collectionAssets.hero.collectionTileIcon} alt="" aria-hidden="true" />
      </span>
      <div className="collection-title-copy">
        <p className="eyebrow">COLLECTION</p>
        <h1>线索图鉴</h1>
        <p>生成任务地图后，扫描当前站点即可收集 MAIN QUEST 和 HIDDEN EGG。</p>
      </div>
    </GameCard>
  );
}

function CollectionStatChip(props: { icon: string; label: string; tone: "blue" | "gold" | "green"; value: number | string }) {
  return (
    <article className={`collection-stat-chip ${props.tone}`}>
      <img className="collection-stat-chip-icon" src={props.icon} alt="" aria-hidden="true" />
      <strong>{props.value}</strong>
      <span>{props.label}</span>
    </article>
  );
}

function CollectionFilterIcon(props: { name: "all" | "main" | "branch" | "hidden" | "mystery" }) {
  const icons = {
    all: collectionAssets.filters.all,
    main: collectionAssets.filters.main,
    branch: collectionAssets.filters.branch,
    hidden: collectionAssets.filters.hidden,
    mystery: collectionAssets.filters.mystery
  } as const;

  return <img className={`collection-filter-icon ${props.name}`} src={icons[props.name]} alt="" aria-hidden="true" />;
}

function CollectionGuideCard(props: { action: string; body: string; href: string }) {
  return (
    <GameCard className="collection-guide-card" variant="collection">
      <span className="collection-guide-scene" aria-hidden="true" />
      <span className="collection-guide-route" aria-hidden="true" />
      <span className="collection-guide-sparkle sparkle-a" aria-hidden="true" />
      <span className="collection-guide-sparkle sparkle-b" aria-hidden="true" />
      <span className="collection-guide-icon" aria-hidden="true">
        <img src={collectionAssets.hero.collectionTileIcon} alt="" aria-hidden="true" />
      </span>
      <div className="collection-guide-copy">
        <p className="eyebrow">EMPTY COLLECTION</p>
        <h2>还没有收集线索</h2>
        <p>{props.body}</p>
      </div>
      <Link className="collection-guide-action primary-action" href={props.href}>
        <span className="collection-guide-action-badge" aria-hidden="true">
          <img src={collectionAssets.hero.compassLarge} alt="" aria-hidden="true" />
        </span>
        <span>{props.action}</span>
        <i aria-hidden="true">›</i>
      </Link>
    </GameCard>
  );
}

function LockedClueTip(props: { text: string }) {
  return (
    <GameCard className="locked-clue-tip" variant="collection">
      <p className="eyebrow">LOCKED HINT</p>
      <p>{props.text}</p>
    </GameCard>
  );
}

function lockedPlaceholders() {
  return [
    { id: "locked-main", title: "???", type: "主线线索", locked: true },
    { id: "locked-hidden", title: "???", type: "隐藏彩蛋", locked: true },
    { id: "locked-mystery", title: "???", type: "神秘线索", locked: true },
    { id: "locked-person", title: "???", type: "人物线索", locked: true }
  ];
}
