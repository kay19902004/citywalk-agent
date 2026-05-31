from __future__ import annotations

import base64
import html
from pathlib import Path


ROOT = Path("/Users/a/Desktop/作品/citywalk-agent")
SCREENSHOT_DIR = ROOT / "docs" / "project-screenshots"
OUT = ROOT / "docs" / "CityWalk_现实城市冒险Agent_飞书复制版.html"


SCREENSHOTS = [
    (
        "首页",
        "作为项目主入口，展示城市冒险氛围、附近探索点、任务入口和“开始冒险”按钮，帮助用户快速进入现实城市任务。",
        "01-home.png",
    ),
    (
        "坐标校准页",
        "支持用户手动填写出发地点、街区类型和现场观察，也可使用 GPS 辅助定位，保证任务能围绕真实地点生成。",
        "05-location.png",
    ),
    (
        "任务档案页",
        "展示故事背景、任务目标、奖励机制和探索职业选择，把 AI 生成的城市剧情包装成可理解、可行动的任务档案。",
        "03-dossier.png",
    ),
    (
        "任务地图页",
        "呈现 5 站任务路线、当前关卡状态和扫描入口，是用户进行城市探索时的主操作中心。",
        "02-play.png",
    ),
    (
        "拍照扫描页",
        "通过 HUD 形式把现场公共可见元素转化为 MAIN QUEST 和 HIDDEN EGG 标记，使真实街景成为可点击的游戏界面。",
        "07-photo.png",
    ),
    (
        "线索图鉴页",
        "汇总主线线索、隐藏彩蛋和图鉴收集进度，增强用户完成任务后的成就感和持续探索动力。",
        "06-clues.png",
    ),
]


def image_data_url(path: Path) -> str:
    data = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/png;base64,{data}"


def paragraph(text: str) -> str:
    return f"<p>{html.escape(text)}</p>"


def main() -> None:
    missing = [filename for _, _, filename in SCREENSHOTS if not (SCREENSHOT_DIR / filename).exists()]
    if missing:
        raise FileNotFoundError(f"Missing screenshots: {', '.join(missing)}")

    screenshot_blocks = []
    for index, (title, caption, filename) in enumerate(SCREENSHOTS, start=1):
        src = image_data_url(SCREENSHOT_DIR / filename)
        screenshot_blocks.append(
            f"""
            <figure class="screenshot">
              <img src="{src}" alt="图{index}：{html.escape(title)}截图" />
              <figcaption>图{index}：{html.escape(title)} - {html.escape(caption)}</figcaption>
            </figure>
            """
        )

    body = f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>CityWalk 现实城市冒险 Agent 飞书复制版</title>
  <style>
    :root {{
      color: #10233f;
      background: #f4f8fc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", Arial, sans-serif;
      line-height: 1.72;
    }}
    body {{
      margin: 0;
      padding: 32px 18px 48px;
    }}
    main {{
      max-width: 920px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #dbe7f3;
      border-radius: 18px;
      padding: 42px 48px;
      box-shadow: 0 18px 48px rgba(44, 85, 128, 0.12);
    }}
    h1 {{
      margin: 0 0 14px;
      color: #0b2a4d;
      font-size: 30px;
      line-height: 1.25;
      letter-spacing: 0;
    }}
    h2 {{
      margin: 32px 0 12px;
      color: #156cc4;
      font-size: 21px;
      line-height: 1.35;
      border-left: 5px solid #1d8be8;
      padding-left: 12px;
      letter-spacing: 0;
    }}
    p {{
      margin: 0 0 12px;
      font-size: 15.5px;
    }}
    .lead {{
      margin: 18px 0 22px;
      padding: 16px 18px;
      border-radius: 12px;
      background: #eef7ff;
      border: 1px solid #cfe7ff;
      color: #24435f;
    }}
    .flow {{
      display: grid;
      grid-template-columns: repeat(5, minmax(110px, 1fr));
      gap: 10px;
      margin: 18px 0 18px;
    }}
    .flow span {{
      min-height: 54px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      border-radius: 12px;
      background: linear-gradient(180deg, #f2fbff, #e9f5ff);
      border: 1px solid #cbe4fb;
      color: #123b63;
      font-weight: 700;
      font-size: 13px;
      padding: 8px;
    }}
    .flow-text {{
      margin-top: 10px;
      padding: 12px 14px;
      border-radius: 10px;
      background: #f7fafc;
      border: 1px dashed #bad2e7;
      color: #36536d;
      font-size: 14px;
    }}
    .screenshot-grid {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 22px;
      margin-top: 16px;
    }}
    figure.screenshot {{
      margin: 0;
      padding: 16px 14px 14px;
      border-radius: 16px;
      background: #f7fbff;
      border: 1px solid #dbe9f7;
      break-inside: avoid;
    }}
    figure.screenshot img {{
      display: block;
      width: 100%;
      max-width: 260px;
      margin: 0 auto 12px;
      border-radius: 14px;
      box-shadow: 0 10px 28px rgba(18, 49, 81, 0.16);
    }}
    figcaption {{
      color: #33536f;
      font-size: 13.5px;
      line-height: 1.55;
      text-align: left;
    }}
    .copy-note {{
      margin-top: 28px;
      padding: 14px 16px;
      background: #fff8e8;
      border: 1px solid #f3d99c;
      border-radius: 12px;
      color: #74531c;
      font-size: 14px;
    }}
    @media print {{
      body {{ background: #fff; padding: 0; }}
      main {{ box-shadow: none; border: 0; border-radius: 0; }}
      .screenshot-grid {{ grid-template-columns: repeat(2, minmax(0, 1fr)); }}
    }}
  </style>
</head>
<body>
<main>
  <h1>CityWalk 现实城市冒险 Agent 项目说明</h1>
  <div class="lead">本版本已整合目标人群、项目痛点、用户价值、实现方案、体验流程图、程序页面截图和核心创新点。打开本文件后全选复制，即可粘贴到飞书文档中继续编辑。</div>

  <h2>一、目标人群、痛点与用户价值</h2>
  {paragraph("CityWalk 现实城市冒险 Agent 面向喜欢 CityWalk、轻推理、城市打卡、沉浸式互动体验的年轻用户，也适用于文旅景区、商业街区、校园园区等需要低成本互动导览和内容运营的场景。")}
  {paragraph("当前传统 CityWalk 体验普遍存在三个问题：一是路线和内容同质化，用户往往只能按照固定攻略完成打卡，缺少新鲜感；二是现实地点与叙事内容割裂，城市空间只是背景，难以真正成为故事的一部分；三是用户完成动力不足，路线结束后缺少持续探索、收集和复访机制。")}
  {paragraph("本项目将真实城市地点转化为可游玩的现实冒险，把用户的当前位置、天气、时间、兴趣偏好和现场照片纳入剧情生成过程。用户不再只是被动浏览路线，而是以探索者身份进入一场由 AI 动态编排的 5 站任务：查看任务档案、选择探索身份、前往真实地点、拍照扫描线索、解锁主线任务和隐藏彩蛋，并在图鉴中沉淀自己的探索成果。")}
  {paragraph("对个人用户而言，项目提供了更有参与感、游戏感和记忆点的 CityWalk 体验；对文旅、商业街区和校园场景而言，项目可以用较低内容制作成本生成多条可复用、可更新的互动路线，提升空间停留时间、用户参与度和传播分享价值。")}

  <h2>二、实现方案</h2>
  {paragraph("项目采用“真实城市地点 + AI 动态剧情 + 拍照识别 + 线索收集”的整体方案，将用户所在街区转化为一场单人现实城市冒险。")}
  {paragraph("在内容生成层，系统会扫描本地故事素材库，提取剧情母题、场景标签、角色原型、冲突关系、线索接口和结局要素，形成可组合的结构化剧情模块。随后由 DeepSeek 作为剧情导演，根据用户偏好、城市、天气、时间和定位上下文生成任务案卷、角色身份、证物、时间线和 5 个站点任务。")}
  {paragraph("在现实环境层，系统接入高德地图能力，通过 GPS 和逆地理编码补充城市、地标、周边 POI 与地点类型信息，使任务能够围绕用户真实所处的街区展开。用户也可以手动输入城市和出发地点，保证在定位不可用时仍能生成路线。")}
  {paragraph("在交互体验层，用户进入任务档案后选择探索职业，并在任务页查看当前站点、路线进度、主线目标和隐藏任务。到达现场后，用户上传或拍摄公共可见元素，系统通过 Qwen-VL 分析照片，将路牌、店招、橱窗、墙面、导视牌等现实锚点转化为可点击的游戏 HUD 标记。点击主线标记可推进剧情，点击隐藏标记可收集额外彩蛋。")}
  {paragraph("在安全与质量控制层，系统设置了安全兜底和剧情质量门。安全机制会避免引导用户进入私人区域、打扰路人、拍摄陌生人或在恶劣天气、深夜、距离过远等情况下继续前往不适合的地点；剧情质量门会检查站点重复、线索薄弱、矛盾不清、过早泄露真相、拍照任务缺少公共锚点等问题，并在必要时触发局部重写，保证生成内容既可玩又可执行。")}

  <h2>三、用户体验流程图</h2>
  <div class="flow">
    <span>进入首页</span>
    <span>选择地点 / 模式</span>
    <span>生成任务地图</span>
    <span>查看任务档案</span>
    <span>选择探索职业</span>
    <span>前往真实站点</span>
    <span>拍照扫描</span>
    <span>解锁线索 / 彩蛋</span>
    <span>图鉴沉淀</span>
    <span>通关报告</span>
  </div>
  <div class="flow-text">进入首页 -> 选择地点 / 冒险模式 / 环境 Buff -> 生成任务地图 -> 查看任务档案 -> 选择探索职业 -> 前往真实城市站点 -> 拍照扫描公共可见元素 -> 解锁主线线索 / 隐藏彩蛋 -> 线索图鉴沉淀探索成果 -> 完成路线并生成通关报告</div>

  <h2>四、程序页面截图</h2>
  <div class="screenshot-grid">
    {"".join(screenshot_blocks)}
  </div>

  <h2>五、核心创新点</h2>
  {paragraph("第一，项目把静态 CityWalk 升级为可生成、可交互、可收集的现实游戏。传统 CityWalk 主要依赖固定路线和文字介绍，而本项目将路线拆解为任务站点、角色身份、证据线索、隐藏彩蛋和图鉴收集，让城市漫步从“看路线”变成“玩任务”。")}
  {paragraph("第二，项目实现了 AI 剧情与真实环境的动态耦合。系统不是预设一条固定故事线，而是根据用户所在位置、周边环境、天气、时间和偏好实时生成任务，使同一座城市、同一片街区在不同用户和不同时间下都能产生不同的冒险体验。")}
  {paragraph("第三，项目将照片识别引入现实探索玩法。用户拍摄现场公共可见元素后，Qwen-VL 会把照片中的现实锚点转化为主线线索和隐藏任务标记，使真实街景直接参与游戏交互，增强“城市就是游戏场景”的沉浸感。")}
  {paragraph("第四，项目把内容生成与安全、质量约束结合在同一链路中。系统在生成后进行结构校验、剧情质量评估和安全规则过滤，减少路线重复、任务不可执行、线索不清晰或引导风险行为的问题，使 AI 生成内容更适合落地到真实城市空间。")}
  {paragraph("第五，项目具备较强的场景扩展价值。通过更换素材库、地点类型和任务风格，同一套框架可以扩展到文旅导览、商业街区活动、校园迎新、城市文化传播、品牌快闪任务等场景，为线下空间提供可持续更新的互动内容基础设施。")}

  <div class="copy-note">复制方式：用浏览器打开这个 HTML 文件，按 Cmd+A / Ctrl+A 全选，再复制粘贴到飞书文档。若飞书没有自动带入图片，可以把每张图从“程序页面截图”部分单独复制，或使用同目录下 project-screenshots 文件夹中的原图上传。</div>
</main>
</body>
</html>
"""

    OUT.write_text(body, encoding="utf-8")
    print(OUT)


if __name__ == "__main__":
    main()
