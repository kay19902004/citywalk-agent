"use client";

import Link from "next/link";
import { useCitywalkApp } from "../app-client";

export default function LocationPage() {
  const app = useCitywalkApp();
  const hasGps = typeof app.geo.accuracy === "number";

  return (
    <section className="location-modal-page" aria-labelledby="location-title">
      <section className="location-modal-card" role="dialog" aria-labelledby="location-title">
        <header className="location-modal-header">
          <p className="eyebrow">START POINT</p>
          <h1 id="location-title">选择出发地点</h1>
          <p>手动填写最稳。GPS 只作为辅助，不会替你决定地点名称。</p>
        </header>

        <div className="location-gps-strip">
          <div>
            <span>{hasGps ? "GPS 已辅助" : "可选辅助"}</span>
            <strong>{hasGps ? `精度约 ${Math.round(app.geo.accuracy ?? 0)}m` : "不授权也能继续"}</strong>
          </div>
          <button className="secondary-action small" disabled={app.loading} onClick={app.requestGps} type="button">
            {app.loading ? "定位中..." : "GPS 辅助"}
          </button>
        </div>

        <div className="location-modal-form">
          <label className="location-compact-field">
            <span>城市</span>
            <input
              value={app.city}
              onChange={(event) => app.setCity(event.target.value)}
              placeholder="例如：上海 / 杭州 / 北京"
            />
          </label>

          <label className="location-compact-field">
            <span>当前地点</span>
            <input
              value={app.geo.landmarkName ?? ""}
              onChange={(event) => app.setGeo({ landmarkName: event.target.value })}
              placeholder="例如：小南门地铁站 3 号口"
            />
          </label>

          <label className="location-compact-field">
            <span>街区类型</span>
            <input
              value={app.geo.placeType ?? ""}
              onChange={(event) => app.setGeo({ placeType: event.target.value })}
              placeholder="老街 / 咖啡馆 / 公园 / 商场"
            />
          </label>

          <label className="location-compact-field">
            <span>现场观察</span>
            <textarea
              value={app.geo.nearbyDetails ?? ""}
              onChange={(event) => app.setGeo({ nearbyDetails: event.target.value })}
              placeholder="旁边有旧路牌、便利店、梧桐树"
            />
          </label>
        </div>

        <footer className="location-modal-actions">
          <Link className="primary-action" href="/play">保存并返回任务</Link>
          <Link className="secondary-action" href="/">回到首页</Link>
        </footer>
      </section>
    </section>
  );
}
