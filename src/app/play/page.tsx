"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { useCitywalkApp } from "../app-client";
import { getIdentityProfile } from "../../lib/identity-profile";
import type { EvidenceCard, ExpandedGameSession, ExpandedStoryNode, PlayerRoleCard } from "../../lib/types";
import { citywalkAssets, GameCard, PageTitle } from "../ui";

type IntelTab = "route" | "clues" | "system";

export default function PlayPage() {
  const app = useCitywalkApp();
  const [answer, setAnswer] = useState("");
  const [intelOpen, setIntelOpen] = useState(false);
  const [intelTab, setIntelTab] = useState<IntelTab>("route");
  const session = app.session;
  const node = session?.currentScene;

  if (!session || !node) {
    return <QuestNotReady href="/" action="生成任务地图" />;
  }

  if (!session.selectedRoleId) {
    return <QuestNotReady href="/dossier" action="去档案页" />;
  }

  const total = session.story.nodes.length;
  const selectedRole = session.story.playerRoles.find((role) => role.id === session.selectedRoleId);
  const identity = getIdentityProfile(selectedRole);
  const scanState = session.completedMainMarkers.includes(node.id) ? "已扫描" : "待扫描";
  const chapterTitle = node.locationTieIn || session.story.title;
  const missionCoverSrc = citywalkAssets.playSunny.heroWukangBookstore;
  const playSunnyVars = {
    "--play-sunny-bg": `url(${citywalkAssets.playSunny.bgCitySunny})`,
    "--play-hero-image": `url(${citywalkAssets.playSunny.heroWukangBookstore})`,
    "--play-leaves-top": `url(${citywalkAssets.playSunny.decoLeavesTop})`,
    "--play-map-pattern": `url(${citywalkAssets.playSunny.decoMapPattern})`,
    "--play-sparkles": `url(${citywalkAssets.playSunny.decoSparkles})`,
    "--play-cloud-swoosh": `url(${citywalkAssets.playSunny.decoCloudSwoosh})`,
    "--play-treasure-icon": `url(${citywalkAssets.playSunny.iconTreasure})`,
    "--play-field-note-icon": `url(${citywalkAssets.playSunny.iconFieldNote})`,
    "--play-compass-gold": `url(${citywalkAssets.playSunny.iconCompassGold})`,
    "--play-polaroid-thumb": `url(${citywalkAssets.playSunny.thumbBookstorePolaroid})`
  } as CSSProperties;
  const nextNode = session.story.nodes[session.currentNodeIndex + 1] ?? null;
  const mainProgress = Math.min(total, Math.max(session.currentNodeIndex + 1, session.completedMainMarkers.length));
  const hiddenCount = session.photoDiscoveries.filter((item) => item.markerType === "hidden").length;
  const clueCount = session.knownEvidenceIds.length + session.photoDiscoveries.length;
  const visibleEvidence = session.story.evidence.filter((item) => node.evidenceIds.includes(item.id));
  const showDebugAnswer = process.env.NODE_ENV !== "production";
  const showTextFallback = app.output?.fallback_available === true;
  const showTextProgression = showTextFallback || showDebugAnswer;

  return (
    <section className="page-stack play-dashboard" style={playSunnyVars}>
      <PlayMissionTopbar onIntelOpen={() => setIntelOpen(true)} />

      <PlayHeroOverview
        chapterTitle={chapterTitle}
        completedMainMarkers={session.completedMainMarkers}
        coverSrc={missionCoverSrc}
        currentNodeIndex={session.currentNodeIndex}
        node={node}
        nodes={session.story.nodes}
        scanState={scanState}
        total={total}
      />

      <CurrentTaskModule node={node} />

      <RouteOverviewModule
        completedMainMarkers={session.completedMainMarkers}
        currentNodeIndex={session.currentNodeIndex}
        nextNode={nextNode}
        nodes={session.story.nodes}
      />

      <PlayIntelGrid
        completedMainMarkers={session.completedMainMarkers}
        node={node}
        total={total}
      />

      <section className="task-hub-actions compact play-quick-actions">
        <Link href="/location"><span>⌖</span><strong>坐标校准</strong><small>轨迹误差校准</small></Link>
        <Link href="/dossier"><span>▣</span><strong>任务档案</strong><small>查看与记录</small></Link>
        <button onClick={() => setIntelOpen(true)} type="button"><span>?</span><strong>提示</strong><small>查看任务情报</small></button>
        <Link href="/me"><span>★</span><strong>成就</strong><small>探索得徽章</small></Link>
      </section>

      <MissionIntelPanel
        activeTab={intelTab}
        answer={answer}
        clueCount={clueCount}
        disabled={app.loading || app.output?.next_action === "show_ending"}
        error={app.error}
        hiddenCount={hiddenCount}
        identity={identity}
        mainProgress={mainProgress}
        nextNode={nextNode}
        node={node}
        npcMessage={app.output?.npc_message ?? node.npcMessage ?? "就在这儿了！认真看看，说不定会有惊喜。"}
        onAnswerChange={setAnswer}
        onClose={() => setIntelOpen(false)}
        onDebugAnswer={() => {
          void app.submitAnswer(node.answerKeywords[0]);
          setAnswer("");
        }}
        onSubmitAnswer={() => {
          void app.submitAnswer(answer);
          setAnswer("");
        }}
        onTabChange={setIntelTab}
        open={intelOpen}
        sceneText={app.output?.scene_text ?? node.sceneText}
        selectedRole={selectedRole}
        session={session}
        showDebugAnswer={showDebugAnswer}
        showTextFallback={showTextFallback}
        showTextProgression={showTextProgression}
        total={total}
        visibleEvidence={visibleEvidence}
      />
    </section>
  );
}

function PlayMissionTopbar(props: { onIntelOpen: () => void }) {
  return (
    <header className="play-mission-topbar">
      <div className="play-brand-mark">
        <span aria-hidden="true"><img src={citywalkAssets.playSunny.iconCompassBlue} alt="" /></span>
        <strong>CityWalk</strong>
        <em>现实城市冒险</em>
      </div>
      <div className="play-topbar-actions" aria-label="任务页快捷操作">
        <Link href="/clues" aria-label="打开图鉴"><img src={citywalkAssets.playSunny.iconStamp} alt="" /></Link>
        <button aria-label="更多任务信息" onClick={props.onIntelOpen} type="button">•••</button>
      </div>
    </header>
  );
}

function PlayHeroOverview(props: {
  chapterTitle: string;
  completedMainMarkers: string[];
  coverSrc: string;
  currentNodeIndex: number;
  node: ExpandedStoryNode;
  nodes: ExpandedStoryNode[];
  scanState: string;
  total: number;
}) {
  const style = {
    "--play-cover-image": `url(${props.coverSrc})`
  } as CSSProperties;

  return (
    <section className="play-hero-overview" style={style}>
      <div className="play-hero-copy">
        <div className="play-hero-badges">
          <span>进行中</span>
          <span>主线任务</span>
          <span>隐藏彩蛋</span>
        </div>
        <p className="play-hero-status">现在：第 {props.node.order} / {props.total} 站 · {props.scanState}</p>
        <h1>{props.node.locationName}</h1>
        <p className="play-hero-chapter">{props.chapterTitle}</p>
      </div>
      <Link className="play-hero-dossier" href="/dossier"><span>▤</span>查看档案</Link>
      <Link className="play-hero-photo-pin" href="/photo" aria-label="开始扫描本站">▶</Link>
      <div className="play-hero-cover" aria-hidden="true">
        <img src={props.coverSrc} alt="" />
      </div>
      <FiveStopProgress
        completedMainMarkers={props.completedMainMarkers}
        currentNodeIndex={props.currentNodeIndex}
        nodes={props.nodes}
      />
    </section>
  );
}

function CurrentTaskModule(props: { node: ExpandedStoryNode }) {
  const mainTask = compactTaskText(props.node.photoPrompt || props.node.mainTask);
  const hiddenTask = compactHiddenText(props.node.hiddenTask);
  const targetNumber = extractTargetNumber(`${props.node.photoPrompt} ${props.node.mainTask} ${props.node.locationName}`);

  return (
    <section className="play-current-task">
      <div className="play-section-title">
        <span>⌖</span>
        <h2>当前任务</h2>
      </div>
      <article className="play-main-objective">
        <span className="play-objective-icon asset-icon"><img src={citywalkAssets.playSunny.mainQuestIcon} alt="" /></span>
        <div>
          <div className="play-objective-label">
            <strong>主线目标</strong>
            {targetNumber ? <em>目标编号：{targetNumber}</em> : null}
          </div>
          <p>{mainTask}</p>
        </div>
        <span className="play-evidence-note" aria-hidden="true"><img src={citywalkAssets.playSunny.iconFieldNote} alt="" /><em>FIELD NOTE</em></span>
      </article>
      <article className="play-hidden-objective">
        <span className="play-objective-icon asset-icon"><img src={citywalkAssets.playSunny.hiddenEggIcon} alt="" /></span>
        <div>
          <strong>隐藏彩蛋</strong>
          <p>{hiddenTask}</p>
        </div>
        <span className="play-extra-stamp" aria-hidden="true">EXTRA<br />CLUE</span>
      </article>
      <Link className="primary-action scan-quest-action" href="/photo">
        <span className="scan-action-icon" aria-hidden="true"><img src={citywalkAssets.playSunny.scanReticle} alt="" /></span>
        <span className="scan-action-copy">
          开始扫描本站
          <small>拍照识别主线与隐藏彩蛋</small>
        </span>
        <span className="scan-action-arrow" aria-hidden="true">›</span>
      </Link>
    </section>
  );
}

function RouteOverviewModule(props: {
  completedMainMarkers: string[];
  currentNodeIndex: number;
  nextNode: ExpandedStoryNode | null;
  nodes: ExpandedStoryNode[];
}) {
  const currentNode = props.nodes[props.currentNodeIndex] ?? props.nodes[0];
  const nextLabel = props.nextNode
    ? `下一站：${props.nextNode.locationName} · 步行约 420m · 约 6 分钟`
    : "终点站：完成本站扫描后查看线索图鉴";

  return (
    <section className="play-route-map">
      <div className="play-section-title">
        <span>⌁</span>
        <h2>今日任务路线</h2>
      </div>
      <div className="play-map-canvas" aria-label="今日任务路线概览">
        <div className="play-map-path" aria-hidden="true" />
        {props.nodes.map((node, index) => {
          const done = props.completedMainMarkers.includes(node.id) || index < props.currentNodeIndex;
          const current = node.id === currentNode.id;
          const next = index === props.currentNodeIndex + 1;
          const finish = index === props.nodes.length - 1;
          const state = current ? "current" : done ? "done" : next ? "next" : "pending";
          return (
            <article className={`play-map-node ${state}${finish ? " finish" : ""}`} key={node.id}>
              <b>{node.order}</b>
              <strong>{shortLocationName(node.locationName)}</strong>
            </article>
          );
        })}
        <span className="play-map-compass" aria-hidden="true"><img src={citywalkAssets.playSunny.iconCompassGold} alt="" /></span>
        <span className="play-map-treasure" aria-hidden="true"><img src={citywalkAssets.playSunny.iconTreasure} alt="" /></span>
      </div>
      <div className="play-route-metrics">
        <span><b>步行约</b>2.4 km</span>
        <span><b>预计</b>35 分钟</span>
      </div>
      <div className="play-next-stop">
        <strong>下一站提示</strong>
        <p>{nextLabel}</p>
      </div>
    </section>
  );
}

function PlayIntelGrid(props: {
  completedMainMarkers: string[];
  node: ExpandedStoryNode;
  total: number;
}) {
  return (
    <section className="play-intel-grid" aria-label="任务进度与线索记录">
      <article className="play-intel-card progress">
        <div>
          <span>⚑</span>
          <strong>任务进度</strong>
        </div>
        <div className="play-mini-progress">
          {Array.from({ length: props.total }).map((_, index) => (
            <i
              className={index === props.node.order - 1 ? "current" : index < props.completedMainMarkers.length ? "done" : ""}
              key={index}
            >
              {index + 1}
            </i>
          ))}
        </div>
        <p>已完成 {props.completedMainMarkers.length} / {props.total} 站</p>
      </article>
      <article className="play-intel-card note">
        <div>
          <span>▤</span>
          <strong>线索记录</strong>
        </div>
        <p>留意招牌、门边风铃与树下光影。</p>
        <small>记录时间：10:28</small>
        <img className="play-polaroid-thumb" src={citywalkAssets.playSunny.thumbBookstorePolaroid} alt="" />
      </article>
    </section>
  );
}

function MissionIntelPanel(props: {
  activeTab: IntelTab;
  answer: string;
  clueCount: number;
  disabled: boolean;
  error: string | null;
  hiddenCount: number;
  identity: ReturnType<typeof getIdentityProfile>;
  mainProgress: number;
  nextNode: ExpandedStoryNode | null;
  node: ExpandedStoryNode;
  npcMessage: string;
  onAnswerChange: (value: string) => void;
  onClose: () => void;
  onDebugAnswer: () => void;
  onSubmitAnswer: () => void;
  onTabChange: (tab: IntelTab) => void;
  open: boolean;
  sceneText: string;
  selectedRole?: PlayerRoleCard;
  session: ExpandedGameSession;
  showDebugAnswer: boolean;
  showTextFallback: boolean;
  showTextProgression: boolean;
  total: number;
  visibleEvidence: EvidenceCard[];
}) {
  if (!props.open) return null;

  const showDebugAnswer = props.showDebugAnswer;
  const showTextFallback = props.showTextFallback;
  const showTextProgression = props.showTextProgression;
  const tabs: Array<{ id: IntelTab; label: string }> = [
    { id: "route", label: "路线" },
    { id: "clues", label: "线索" },
    { id: "system", label: "系统" }
  ];
  const nextLabel = props.nextNode ? `${props.nextNode.locationName} · 步行约 420m` : "完成本站后进入结局回收";
  const currentArea = `${props.session.context.city ?? "上海"} · ${props.node.locationName}`;
  const totalClues = Math.max(11, props.session.story.evidence.length + props.total);

  return (
    <>
      <button className="mission-intel-backdrop" aria-label="关闭任务情报" onClick={props.onClose} type="button" />
      <aside className="mission-intel-panel" role="dialog" aria-modal="true" aria-label="任务情报面板">
        <header className="mission-intel-header">
          <div>
            <p className="eyebrow">MISSION INTEL</p>
            <h2>任务情报</h2>
            <span>{currentArea}</span>
          </div>
          <button aria-label="关闭任务情报" onClick={props.onClose} type="button">×</button>
        </header>

        <section className="mission-intel-agent">
          <i aria-hidden="true">i</i>
          <div>
            <strong>{props.selectedRole ? `${props.selectedRole.name} / ${props.selectedRole.roleTitle}` : "现场探索员"}</strong>
            <p>{props.identity.bonus}</p>
          </div>
        </section>

        <nav className="mission-intel-tabs" aria-label="任务情报分类">
          {tabs.map((tab) => (
            <button
              aria-pressed={props.activeTab === tab.id}
              className={props.activeTab === tab.id ? "active" : ""}
              key={tab.id}
              onClick={() => props.onTabChange(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mission-intel-scroll">
          {props.activeTab === "route" ? (
            <section className="mission-intel-pane" aria-label="路线情报">
              <div className="mission-intel-metrics">
                <ProgressMeter label="主线进度" value={props.mainProgress} total={props.total} />
                <ProgressMeter label="隐藏彩蛋" value={props.hiddenCount} total={3} tone="orange" />
                <ProgressMeter label="完成线索" value={props.clueCount} total={totalClues} tone="blue" />
              </div>
              <div className="mission-intel-route-steps" aria-label="5 站路线进度">
                {props.session.story.nodes.map((node, index) => {
                  const done = props.session.completedMainMarkers.includes(node.id) || index < props.session.currentNodeIndex;
                  const current = node.id === props.node.id;
                  return (
                    <article className={current ? "current" : done ? "done" : "locked"} key={node.id}>
                      <b>{done ? "✓" : node.order}</b>
                      <div>
                        <strong>{node.locationName}</strong>
                        <span>{current ? "当前站" : done ? "已完成" : "待解锁"}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
              <article className="mission-intel-next">
                <strong>下一步</strong>
                <p>{nextLabel}</p>
              </article>
            </section>
          ) : null}

          {props.activeTab === "clues" ? (
            <section className="mission-intel-pane" aria-label="线索情报">
              <article className="mission-intel-npc">
                <span aria-hidden="true">周</span>
                <div>
                  <strong>老周</strong>
                  <p>{props.npcMessage}</p>
                </div>
              </article>
              <article className="mission-intel-note">
                <p className="eyebrow">MISSION NOTE</p>
                <p>{props.sceneText}</p>
              </article>
              <div className="mission-intel-task-list">
                <span><b>主线目标</b>{props.node.photoPrompt || props.node.mainTask}</span>
                <span><b>隐藏目标</b>{props.node.hiddenTask}</span>
                <span><b>职业提示</b>{props.identity.hint}</span>
              </div>
              {props.visibleEvidence.length > 0 ? (
                <section className="mission-intel-evidence" aria-label="当前线索">
                  {props.visibleEvidence.map((item) => (
                    <article key={item.id}>
                      <span>{item.kind}</span>
                      <strong>{item.title}</strong>
                      <p>{item.content}</p>
                    </article>
                  ))}
                </section>
              ) : (
                <article className="mission-intel-empty">
                  <strong>暂无本站线索</strong>
                  <p>完成扫描后，图鉴会记录新的证据和隐藏发现。</p>
                </article>
              )}
            </section>
          ) : null}

          {props.activeTab === "system" ? (
            <section className="mission-intel-pane" aria-label="系统情报">
              <article className="mission-intel-safety">
                <strong>安全边界</strong>
                <p>只拍摄公共可见区域：门牌、路牌、橱窗、街景。不要拍摄陌生人、车牌和公共禁区，不拦人久问，不钻小巷久留。</p>
              </article>
              {showTextProgression ? (
                <section className="mission-intel-fallback legacy-answer">
                  <div className="answer-card-heading">
                    <strong>{showTextFallback ? "安全兜底" : "开发工具"}</strong>
                  </div>
                  <label>
                    <span>{showTextFallback ? "安全替代推理" : "开发调试推理"}</span>
                    <textarea value={props.answer} onChange={(event) => props.onAnswerChange(event.target.value)} placeholder={`关键词：${props.node.answerKeywords.join(" / ")}`} />
                  </label>
                  <div className="button-row">
                    {showTextFallback ? (
                      <button className="secondary-action" disabled={props.disabled} onClick={props.onSubmitAnswer} type="button">
                        提交推理
                      </button>
                    ) : null}
                    {showDebugAnswer ? (
                      <button className="secondary-action" disabled={props.disabled} onClick={props.onDebugAnswer} type="button">
                        调试答案
                      </button>
                    ) : null}
                  </div>
                  {props.error ? <p className="product-error">{props.error}</p> : null}
                </section>
              ) : (
                <article className="mission-intel-empty">
                  <strong>照片优先</strong>
                  <p>当前环境安全，继续使用扫描页完成主线与隐藏彩蛋。</p>
                </article>
              )}
            </section>
          ) : null}
        </div>
      </aside>
    </>
  );
}

function FiveStopProgress(props: {
  completedMainMarkers: string[];
  currentNodeIndex: number;
  nodes: ExpandedStoryNode[];
}) {
  return (
    <div className="play-hero-route" aria-label="5 站路线进度">
      {props.nodes.map((node, index) => {
        const done = props.completedMainMarkers.includes(node.id) || index < props.currentNodeIndex;
        const current = index === props.currentNodeIndex;
        const finish = index === props.nodes.length - 1;
        return (
          <span className={current ? "current" : done ? "done" : finish ? "finish" : "pending"} key={node.id}>
            <b>{node.order}</b>
            <small>{current ? "当前站" : finish ? "终点" : done ? "已完成" : "待完成"}</small>
          </span>
        );
      })}
    </div>
  );
}

function QuestNotReady(props: { href: string; action: string }) {
  return (
    <section className="page-stack">
      <PageTitle
        eyebrow="QUEST MAP"
        icon="◇"
        title="任务地图未激活"
        subtitle={<p>先阅读任务档案并选择探索职业，Agent 会为你解锁 5 站任务地图。</p>}
      />
      <section className="quest-empty-card">
        <div className="route-illustration" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <h2>解锁城市任务路线</h2>
        <p>完成下面 4 步后，任务页会显示当前关卡、探索进度、5 站路线地图和扫描入口。</p>
        <div className="quest-steps">
          <span><b>1</b>阅读任务档案</span>
          <span><b>2</b>选择探索职业</span>
          <span><b>3</b>解锁 5 站路线</span>
          <span><b>4</b>前往扫描页</span>
        </div>
        <Link className="primary-action large" href={props.href}>
          {props.action}
          <small>开启任务地图</small>
        </Link>
        <div className="task-hub-actions compact">
          <Link href="/location"><span>⌖</span><strong>坐标校准</strong></Link>
          <Link href="/dossier"><span>▤</span><strong>任务档案</strong></Link>
        </div>
      </section>
    </section>
  );
}

function ProgressLine(props: { label: string; value: number; total: number; tone?: "blue" | "orange" }) {
  const pct = Math.min(100, Math.round((props.value / props.total) * 100));
  return (
    <GameCard className={`progress-card ${props.tone ?? "teal"}`}>
      <div>
        <span>{props.label}</span>
        <strong>{props.value}/{props.total}</strong>
      </div>
      <div className="progress-track"><i style={{ width: `${pct}%` }} /></div>
    </GameCard>
  );
}

function ProgressMeter(props: { label: string; value: number; total: number; tone?: "blue" | "orange" }) {
  const pct = Math.min(100, Math.round((props.value / props.total) * 100));
  return (
    <article className={`progress-meter ${props.tone ?? "teal"}`}>
      <div>
        <strong>{props.label}</strong>
        <span>{props.value}/{props.total}</span>
      </div>
      <i><b style={{ width: `${pct}%` }} /></i>
    </article>
  );
}

function compactTaskText(value: string) {
  const text = value
    .replace(/^请你?/, "")
    .replace(/。.*$/, "")
    .replace(/，.*$/, "")
    .trim();
  return text.length > 32 ? `${text.slice(0, 31)}...` : text;
}

function compactHiddenText(value: string) {
  const text = value.replace(/。.*$/, "").trim();
  return text.length > 34 ? `${text.slice(0, 33)}...` : text;
}

function extractTargetNumber(value: string) {
  return value.match(/\d+\s*号/)?.[0].replace(/\s+/g, "") ?? "";
}

function shortLocationName(value: string) {
  return value
    .replace(/门口|附近|街角/g, "")
    .slice(0, 7);
}
