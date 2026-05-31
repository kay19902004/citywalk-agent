"use client";

const assetBase = "/assets/city-adventure-assets/web-ready/city-adventure";

const assets = {
  avatar: `${assetBase}/avatar_boy.webp`,
  bg: `${assetBase}/bg_city_day.webp`,
  book: `${assetBase}/icon_book.png`,
  btnPrimary: `${assetBase}/btn_primary_glow.webp`,
  btnSecondary: `${assetBase}/btn_secondary_frost.webp`,
  bag: `${assetBase}/icon_bag.png`,
  chest: `${assetBase}/icon_chest.png`,
  compass: `${assetBase}/icon_compass.png`,
  footprint: `${assetBase}/icon_footprint.png`,
  gift: `${assetBase}/icon_gift.png`,
  logo: `${assetBase}/logo_city_adventure.webp`,
  mail: `${assetBase}/icon_mail.png`,
  map: `${assetBase}/icon_map.png`,
  pinBlue: `${assetBase}/icon_pin_blue.png`,
  pinGreen: `${assetBase}/icon_pin_green.png`,
  pinOrange: `${assetBase}/icon_pin_orange.png`,
  route: `${assetBase}/route_glow.webp`,
  sign: `${assetBase}/nav_sign.webp`,
  sparkles: `${assetBase}/fx_sparkles.png`,
  star: `${assetBase}/icon_star.png`,
  taskGold: `${assetBase}/panel_task_gold.webp`,
  taskWhite: `${assetBase}/panel_task_white.webp`,
  dailyPanel: `${assetBase}/panel_daily.webp`,
  panelBlue: `${assetBase}/panel_small_blue.webp`,
  panelGreen: `${assetBase}/panel_small_green.webp`,
  weatherSun: `${assetBase}/icon_weather_sun.png`
} as const;

function navigate(path: string) {
  window.location.href = path;
}

export default function CityAdventureHome() {
  return (
    <section className="city-adventure-home" aria-label="城市冒险手游首页">
      <img className="ca-bg" src={assets.bg} alt="" aria-hidden="true" />
      <div className="ca-sky-glow" aria-hidden="true" />
      <img className="ca-sparkles ca-sparkles-a" src={assets.sparkles} alt="" aria-hidden="true" />
      <img className="ca-sparkles ca-sparkles-b" src={assets.sparkles} alt="" aria-hidden="true" />

      <div className="ca-top-actions" aria-label="顶部快捷入口">
        <button className="ca-top-action" aria-label="活动" onClick={() => navigate("/clues")} type="button">
          <span className="ca-action-icon">
            <img src={assets.gift} alt="" aria-hidden="true" />
          </span>
          <b>活动</b>
        </button>
        <button className="ca-top-action" aria-label="背包" onClick={() => navigate("/dossier")} type="button">
          <span className="ca-action-icon">
            <img src={assets.bag} alt="" aria-hidden="true" />
          </span>
          <b>背包</b>
        </button>
        <button className="ca-top-action" aria-label="邮件" onClick={() => navigate("/me")} type="button">
          <span className="ca-action-icon">
            <img src={assets.mail} alt="" aria-hidden="true" />
            <i aria-hidden="true" />
          </span>
          <b>邮件</b>
        </button>
      </div>

      <header className="ca-title-block">
        <p>CITY ADVENTURE</p>
        <h1>
          <img src={assets.logo} alt="城市冒险" />
          <span>城市冒险</span>
        </h1>
        <h2>附近的真实地点，正在等待变成剧情。</h2>
      </header>

      <aside className="ca-left-stack" aria-label="今日状态">
        <button className="ca-side-card ca-daily-card" onClick={() => navigate("/location")} type="button">
          <img className="ca-card-art" src={assets.dailyPanel} alt="" aria-hidden="true" />
          <img className="ca-card-icon" src={assets.pinBlue} alt="" aria-hidden="true" />
          <span>今日探索</span>
          <strong>3/5</strong>
          <em><i /></em>
        </button>
        <button className="ca-side-card ca-chest-card" onClick={() => navigate("/clues")} type="button">
          <img className="ca-card-icon" src={assets.chest} alt="" aria-hidden="true" />
          <span>探索宝箱</span>
          <strong>可领取</strong>
        </button>
        <button className="ca-side-card ca-weather-card" onClick={() => navigate("/location")} type="button">
          <img className="ca-card-icon" src={assets.weatherSun} alt="" aria-hidden="true" />
          <span>晴天</span>
          <strong>26°C</strong>
          <small>10:30 AM</small>
        </button>
      </aside>

      <img className="ca-route" src={assets.route} alt="" aria-hidden="true" />
      <img className="ca-sign" src={assets.sign} alt="" aria-hidden="true" />
      <span className="ca-route-dot ca-route-start" aria-hidden="true" />
      <span className="ca-route-dot ca-route-mid" aria-hidden="true" />
      <span className="ca-route-dot ca-route-end" aria-hidden="true" />

      <button className="ca-place-card ca-landmark-card" onClick={() => navigate("/location")} type="button">
        <img className="ca-panel-bg" src={assets.panelBlue} alt="" aria-hidden="true" />
        <span>城市地标</span>
        <strong>中央广场</strong>
        <small>80m</small>
      </button>

      <button className="ca-place-card ca-explore-card" onClick={() => navigate("/play")} type="button">
        <img className="ca-panel-bg" src={assets.panelGreen} alt="" aria-hidden="true" />
        <span>探索点</span>
        <strong>街角咖啡店</strong>
        <small>45m</small>
      </button>

      <aside className="ca-right-tasks" aria-label="任务卡片">
        <button className="ca-task-card ca-mystery-card" onClick={() => navigate("/clues")} type="button">
          <img className="ca-task-bg" src={assets.taskGold} alt="" aria-hidden="true" />
          <img className="ca-task-icon" src={assets.star} alt="" aria-hidden="true" />
          <span>神秘任务</span>
          <strong>图书馆的秘密</strong>
          <small>120m</small>
          <b>New!</b>
          <img className="ca-mini-chest" src={assets.chest} alt="" aria-hidden="true" />
        </button>
        <button className="ca-task-card ca-story-card" onClick={() => navigate("/play")} type="button">
          <img className="ca-task-bg" src={assets.taskWhite} alt="" aria-hidden="true" />
          <img className="ca-task-icon" src={assets.book} alt="" aria-hidden="true" />
          <span>剧情任务</span>
          <strong>失落的日记</strong>
          <small>200m</small>
          <img className="ca-avatar" src={assets.avatar} alt="" aria-hidden="true" />
        </button>
      </aside>

      <nav className="ca-quick-actions" aria-label="右下角快捷入口">
        <button aria-label="城市地图" className="ca-quick-action" onClick={() => navigate("/location")} type="button">
          <span>
            <img src={assets.map} alt="" aria-hidden="true" />
          </span>
          <b>城市地图</b>
        </button>
        <button aria-label="附近探索" className="ca-quick-action" onClick={() => navigate("/play")} type="button">
          <span>
            <img src={assets.compass} alt="" aria-hidden="true" />
          </span>
          <b>附近探索</b>
        </button>
        <button aria-label="足迹" className="ca-quick-action" onClick={() => navigate("/me")} type="button">
          <span>
            <img src={assets.footprint} alt="" aria-hidden="true" />
            <i aria-hidden="true" />
          </span>
          <b>足迹</b>
        </button>
      </nav>

      <div className="ca-bottom-panel" aria-label="登录入口">
        <button
          aria-label="开始冒险"
          className="ca-start-button"
          onClick={() => {
            console.log("start adventure");
            navigate("/home");
          }}
          type="button"
        >
          <img src={assets.btnPrimary} alt="" aria-hidden="true" />
          <span>开始冒险</span>
        </button>
        <button
          aria-label="游客体验"
          className="ca-guest-button"
          onClick={() => {
            console.log("guest mode");
            navigate("/home");
          }}
          type="button"
        >
          <img src={assets.btnSecondary} alt="" aria-hidden="true" />
          <span>游客体验</span>
        </button>
        <p>登录后保存角色、路线和探索记录</p>
      </div>
    </section>
  );
}
