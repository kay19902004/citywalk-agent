"use client";

import { type CSSProperties, useState } from "react";
import { useCitywalkApp } from "../app-client";
import { ChoiceGrid, citywalkAssets } from "../ui";

const modes = ["侦查", "寻宝", "奇遇", "夜行", "摄影"];
const weatherBuffs = [
  { label: "晴朗", detail: "视野 +10%" },
  { label: "小雨", detail: "反射线索 +1" },
  { label: "夜晚", detail: "灯光线索 +1" },
  { label: "安全区", detail: "步行友好" }
];
const timeBuffs = [
  { label: "上午", detail: "人流较少" },
  { label: "下午", detail: "街景清晰" },
  { label: "傍晚", detail: "招牌点亮" },
  { label: "夜晚", detail: "灯光线索" }
];

const missionChips = [
  { label: "预计 20 分钟", icon: citywalkAssets.home.chipClock },
  { label: "约 1.2 km", icon: citywalkAssets.home.chipRoute },
  { label: "稀有路线", icon: citywalkAssets.home.chipRare }
];
const rewards = [
  { label: "EXP", value: "+120", icon: citywalkAssets.home.rewardExp },
  { label: "印章", value: "+1", icon: citywalkAssets.home.rewardStamp },
  { label: "宝箱", value: "+1", icon: citywalkAssets.home.rewardChest }
];
const quickActions = [
  { href: "/play", title: "地图线索", desc: "发现隐藏地点", icon: citywalkAssets.home.quickMapClue },
  { href: "/play", title: "附近任务", desc: "开启新挑战", icon: citywalkAssets.home.quickNearbyTask },
  { href: "/clues", title: "成就图鉴", desc: "记录探索成就", icon: citywalkAssets.home.quickAchievement },
  { href: "/play", title: "路线收藏", desc: "保存心仪路线", icon: citywalkAssets.home.quickRouteSave }
];
const homeGenerationSteps = [
  "读取城市信息",
  "生成任务路线",
  "匹配拍摄点",
  "写入任务档案",
  "完成安全检查"
];

export default function CityWalkHome() {
  const app = useCitywalkApp();
  const [locationMode, setLocationMode] = useState<"gps" | "manual">("gps");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const placeName = app.geo.landmarkName ?? "小南门";
  const locationLabel = `${app.city} · ${placeName}`;
  const currentExp = 2360;
  const nextLevelExp = 4600;
  const expPercent = Math.round((currentExp / nextLevelExp) * 100);

  return (
    <section className="home-launch-screen">
      <header className="home-hero-title">
        <img aria-hidden="true" className="home-hero-bg" src={citywalkAssets.home.heroCitywalkBg} alt="" />
        <img aria-hidden="true" className="home-hero-skyline" src={citywalkAssets.home.heroSkylineOverlay} alt="" />
        <img aria-hidden="true" className="home-hero-route" src={citywalkAssets.home.heroRouteOverlay} alt="" />
        <img aria-hidden="true" className="home-hero-book-pin" src={citywalkAssets.home.heroBookPinGlow} alt="" />
        <img aria-hidden="true" className="home-hero-script" src={citywalkAssets.home.heroScriptCitywalk} alt="" />
        <img aria-hidden="true" className="home-hero-particles" src={citywalkAssets.home.softParticleOverlay} alt="" />

        <div className="home-title-block">
          <span><i aria-hidden="true" />STREET QUEST</span>
          <h1>CITYWALK</h1>
          <p>漫步城迹 · 今日探索</p>
        </div>

        <div className="home-hero-actions">
          <button className="home-top-action" aria-label="定位与指南针" onClick={app.requestGps} type="button">
            <span><img src={citywalkAssets.home.topCompass} alt="" /><small>指南针</small></span>
          </button>
          <details
            className="home-settings-menu"
            open={advancedOpen}
            onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
          >
            <summary aria-label="打开首页设置">
              <span><img src={citywalkAssets.home.topSetting} alt="" /><small>设置</small></span>
            </summary>
            <div className="home-settings-panel">
              <div className="location-picker">
                <div className="location-tabs" role="tablist" aria-label="地点选择方式">
                  <button className={locationMode === "gps" ? "active" : ""} onClick={() => setLocationMode("gps")} type="button">GPS 定位</button>
                  <button className={locationMode === "manual" ? "active" : ""} onClick={() => setLocationMode("manual")} type="button">手动地点</button>
                </div>
                {locationMode === "gps" ? (
                  <div className="location-mode-panel">
                    <div>
                      <span>当前定位</span>
                      <strong>{app.geo.accuracy ? `${app.city} · ${placeName}` : "等待定位或使用默认地点"}</strong>
                      <p>{app.geo.accuracy ? `精度约 ${Math.round(app.geo.accuracy)}m` : locationLabel}</p>
                    </div>
                    <button className="secondary-action small" disabled={app.loading} onClick={app.requestGps} type="button">
                      {app.geo.accuracy ? "重新定位" : "定位出发"}
                    </button>
                  </div>
                ) : (
                  <div className="location-mode-panel manual">
                    <label>
                      <span>城市</span>
                      <input value={app.city} onChange={(event) => app.setCity(event.target.value)} placeholder="上海" />
                    </label>
                    <label>
                      <span>出发地点</span>
                      <input
                        value={app.geo.landmarkName ?? ""}
                        onChange={(event) => app.setGeo({ landmarkName: event.target.value })}
                        placeholder="街道 / 商圈 / 书店 / 公园 / 地标"
                      />
                    </label>
                  </div>
                )}
              </div>
              <ChoiceGrid label="冒险模式" options={modes} value={app.preference} onChange={app.setPreference} />
              <ChoiceGrid label="环境 Buff" options={weatherBuffs} value={app.weather} onChange={app.setWeather} />
              <ChoiceGrid label="出发时间" options={timeBuffs} value={app.timeOfDay} onChange={app.setTimeOfDay} />
            </div>
          </details>
        </div>
      </header>

      <section className="home-launch-panel" aria-label="CityWalk 首页启动面板">
        <section className="home-mission-card">
          <img className="home-mission-stamp" src={citywalkAssets.home.stampShanghaiCitywalk} alt="" aria-hidden="true" />
          <div className="home-mission-tags">
            <span className="primary"><i className="home-tag-icon star" />今日推荐</span>
            <span className="success"><i className="home-tag-icon steps" />探索中</span>
          </div>
          <div className="home-mission-head">
            <p>今日探索</p>
            <h2>上海 · 武康路旧书店门口</h2>
            <small>书香与梧桐交织的街角，藏着老上海的时光印记。</small>
            <a href="/location"><i aria-hidden="true" />换地点</a>
          </div>

          <p className="home-mission-desc">
            <span>书香与梧桐交织的街角，藏着老上海的时光印记。</span>
            <span>在旧书店的门口，开启一段城市漫游之旅吧！</span>
          </p>
          <div className="home-mission-chips">
            {missionChips.map((chip) => (
              <span key={chip.label}>
                <img src={chip.icon} alt="" />
                {chip.label}
              </span>
            ))}
          </div>
          <div className="home-reward-strip">
            {rewards.map((reward) => (
              <span key={reward.label}>
                <img src={reward.icon} alt="" />
                <b>{reward.label}</b>
                <strong>{reward.value}</strong>
              </span>
            ))}
          </div>

          <button className="home-launch-action" disabled={app.loading} onClick={app.startStory} type="button">
            <span className="home-cta-decor home-cta-left">
              <img className="home-cta-map" src={citywalkAssets.home.ctaShoeMapLeft} alt="" />
            </span>
            <span className="home-cta-decor home-cta-right">
              <img className="home-cta-arrow" src={citywalkAssets.home.ctaCompassTicketRight} alt="" />
            </span>
            <img className="home-cta-spark spark-left" src={citywalkAssets.home.sparkYellowAccent} alt="" />
            <img className="home-cta-spark spark-right" src={citywalkAssets.home.sparkYellowAccent} alt="" />
            <span className="home-launch-copy">
              <strong>{app.loading ? "生成中..." : "开始今日探索"}</strong>
              <small>生成你的城市任务地图 &gt;&gt;</small>
            </span>
          </button>
        </section>

        <section className="home-player-progress-card">
          <img className="home-player-medal" src={citywalkAssets.home.playerMedalLv12} alt="" />
          <div className="home-player-copy">
            <div>
              <strong>LV.12 探索者</strong>
              <span>城市漫游家</span>
            </div>
            <small>还差 2240 EXP 升级</small>
            <em className="home-exp-track"><i style={{ width: `${expPercent}%` }} /></em>
          </div>
          <div className="home-player-side">
            <span>EXP {currentExp}/{nextLevelExp}</span>
            <button type="button">
              <img src={citywalkAssets.home.upgradeGift} alt="" />
              升级奖励
            </button>
          </div>
        </section>

        <section className="home-quick-section">
          <div className="home-section-title">
            <span>快捷行动</span>
            <small>继续你的城市冒险 ›</small>
          </div>
          <div className="home-quick-grid">
            {quickActions.map((item) => (
              <a href={item.href} key={item.title}>
                <img src={item.icon} alt="" />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.desc}</small>
                </span>
                <i aria-hidden="true" />
                <img className="home-card-wave" src={citywalkAssets.home.cardWaveLines} alt="" />
              </a>
            ))}
          </div>
        </section>

        {app.error ? (
          <section className="home-empty-clue-card" role="status">
            <div>
              <h2>线索还没串起来</h2>
              <p>当前街区信息不足，可以重新生成任务，或换个附近地点试试。</p>
              <div className="home-empty-actions">
                <button disabled={app.loading} onClick={app.startStory} type="button">重新生成</button>
                <a href="/location">换个地点</a>
              </div>
            </div>
          </section>
        ) : null}
      </section>

      {app.loading ? <HomeGenerationModal activeStage={app.generationStage} /> : null}
    </section>
  );
}

function HomeGenerationModal(props: { activeStage: string }) {
  const matchedIndex = homeGenerationSteps.findIndex((step) => props.activeStage.includes(step.slice(0, 4)));
  const normalizedIndex = Math.max(0, matchedIndex);
  const progress = Math.round(((normalizedIndex + 1) / homeGenerationSteps.length) * 100);

  return (
    <section className="home-generation-modal" role="status" aria-live="polite" aria-label="正在生成任务地图">
      <div className="home-generation-dialog" style={{ "--generation-progress": `${progress}%` } as CSSProperties}>
        <div className="home-generation-orbit">
          <span className="home-generation-grid-fade" aria-hidden="true" />
          <span className="home-generation-scan" aria-hidden="true" />
          <span className="orbit-core" aria-hidden="true">
            <HomeGenerationIcon name="core" />
          </span>
          <span className="orbit-trace trace-a" aria-hidden="true" />
          <span className="orbit-trace trace-b" aria-hidden="true" />
          <span className="orbit-trace trace-c" aria-hidden="true" />
          <span className={`home-generation-node node-a ${normalizedIndex <= 1 ? "active" : ""}`} aria-label="任务档案图形">
            <HomeGenerationIcon name="archive" />
          </span>
          <span className={`home-generation-node node-b ${normalizedIndex === 1 || normalizedIndex === 2 ? "active" : ""}`} aria-label="任务路线图形">
            <HomeGenerationIcon name="route" />
          </span>
          <span className={`home-generation-node node-c ${normalizedIndex >= 2 ? "active" : ""}`} aria-label="城市线索图形">
            <HomeGenerationIcon name="clue" />
          </span>
        </div>
        <div className="home-generation-copy">
          <p className="eyebrow">LOADING MAP</p>
          <h2>正在生成任务地图</h2>
          <p className="home-generation-stage">{props.activeStage || "正在读取城市信息"}</p>
          <p>正在串联街区线索、任务档案与安全步行路径。</p>
        </div>
        <div className="home-generation-steps" aria-label="任务地图生成步骤">
          {homeGenerationSteps.map((step, index) => (
            <span className={index < normalizedIndex ? "done" : index === normalizedIndex ? "active" : ""} key={step}>
              <i>{index < normalizedIndex ? "✓" : index + 1}</i>
              {step}
            </span>
          ))}
        </div>
        <div className="home-generation-progress"><i /></div>
      </div>
    </section>
  );
}

function HomeGenerationIcon(props: { name: "archive" | "route" | "clue" | "core" }) {
  return (
    <svg className={`home-generation-glyph ${props.name}`} viewBox="0 0 48 48" role="img" aria-hidden="true">
      {props.name === "archive" ? (
        <>
          <path d="M10 13.5h11l3 4h14v17H10z" />
          <path d="M14 23h20M14 28h16" />
        </>
      ) : null}
      {props.name === "route" ? (
        <>
          <path d="M12 33c7-14 18 7 24-10" />
          <circle cx="12" cy="33" r="4" />
          <circle cx="24" cy="24" r="4" />
          <circle cx="36" cy="23" r="4" />
        </>
      ) : null}
      {props.name === "clue" ? (
        <>
          <circle cx="21" cy="21" r="9" />
          <path d="m28 28 8 8M16 18h10M16 23h7" />
        </>
      ) : null}
      {props.name === "core" ? (
        <>
          <circle cx="24" cy="24" r="10" />
          <path d="M24 8v7M24 33v7M8 24h7M33 24h7" />
          <circle cx="24" cy="24" r="3" />
        </>
      ) : null}
    </svg>
  );
}
