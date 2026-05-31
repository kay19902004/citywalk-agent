# CityWalk Agent

#2026AIAgent清客松

CityWalk Agent 是一个面向移动端的现实城市冒险 Agent。它把用户所在的真实街区变成一场轻推理 CityWalk 游戏：AI 根据城市、位置、天气、时间和用户偏好生成任务案卷，玩家选择探索身份，到现实地点拍照扫描线索，推进剧情并收集隐藏彩蛋。

项目重点不是生成一篇静态攻略，而是让 AI 持续参与“规划路线、编排剧情、理解现场照片、推进任务反馈”的完整体验，让城市空间真正成为可交互的游戏场景。

## 审核信息

- 项目标签：`#2026AIAgent清客松`
- 代码仓库：<https://github.com/kay19902004/citywalk-agent>
- 在线体验：`https://YOUR_ZEABUR_DOMAIN`
- 部署平台：Zeabur
- 当前状态：代码已准备好通过 Zeabur 从 GitHub 仓库部署

> Zeabur 部署完成后，请把上面的在线体验地址替换成真实域名。

## 项目亮点

- AI 动态导演：DeepSeek 根据用户偏好、城市上下文和剧情素材生成 5 站式城市冒险。
- 真实地点参与剧情：高德地图补充城市、地标、POI、地点类型等信息，让任务围绕用户当前位置展开。
- 照片变成交互线索：Qwen-VL 分析用户拍摄的公共可见元素，把路牌、店招、橱窗、导视牌等转换成游戏 HUD 标记。
- 主线与隐藏收集：玩家点击主线标记推进剧情，也可以发现隐藏任务、证物和彩蛋。
- 安全兜底：避免引导用户进入私人区域、打扰路人、拍摄陌生人，距离过远或环境不适合时提供替代推进方式。
- 生产合规：线上默认不扫描本地上层作品集文本，只使用内置 seed；外部素材必须通过 `STORY_LIBRARY_ROOT` 显式开启。

## 目标用户与场景

CityWalk Agent 面向喜欢 CityWalk、轻推理、城市打卡、沉浸式互动体验的年轻用户，也适用于文旅街区、商业综合体、校园园区、城市活动和品牌快闪等场景。

它解决的核心问题是：传统 CityWalk 路线固定、内容同质化、现实地点与故事割裂，用户完成后缺少持续探索和分享动力。本项目把路线拆解为任务、角色、证物、隐藏彩蛋和图鉴收集，让“走一条路线”升级为“玩一场现实冒险”。

## 核心体验流程

1. 用户进入首页，选择城市探索偏好。
2. 系统读取时间、天气、定位或手动地点信息。
3. AI 生成任务档案、角色身份、证据链、路线站点和剧情目标。
4. 用户选择探索身份，进入当前任务站点。
5. 用户在现实公共空间拍照或上传现场照片。
6. Qwen-VL 分析照片，生成主线和隐藏 HUD 标记。
7. 用户点击标记收集线索，推进下一站剧情。
8. 完成路线后生成结局报告，并沉淀到图鉴/档案体验中。

## AI Agent 能力设计

### 剧情导演 Agent

DeepSeek 负责把用户上下文转化为可玩的城市冒险结构，包括：

- 任务案卷标题与背景
- 玩家可选身份
- NPC 证词与矛盾点
- 证物、线索和隐藏任务
- 5 个城市站点
- 每一站的主线任务、拍照提示和安全兜底
- 多结局方向

系统会对模型输出做结构化校验和质量检查，避免出现站点重复、线索断裂、过早揭露真相、任务不可执行等问题。

### 地理上下文 Agent

高德地图能力用于补充现实环境信息：

- GPS 坐标
- 城市与行政区
- 逆地理编码地址
- 周边 POI
- 地点类型
- 可用于任务描述的附近细节

定位不可用时，用户可以手动填写城市和出发地点，保证体验可以继续。

### 照片理解 Agent

Qwen-VL 负责把用户上传的现实照片转换为游戏交互层：

- 识别公共可见元素
- 生成主线标记
- 生成隐藏彩蛋标记
- 给出相对坐标
- 输出可点击的 HUD 文案

照片任务只允许围绕公共可观察元素展开，不要求拍摄陌生人、进入私人区域或接触他人物品。

## 页面与功能模块

- `/`：入口页，直接进入移动端游戏首页。
- `/home`：城市冒险首页，选择偏好并生成任务。
- `/location`：定位与手动地点设置。
- `/dossier`：任务案卷、角色、证物和剧情背景。
- `/play`：当前任务、路线进度、线索面板和站点详情。
- `/photo`：照片扫描、HUD 标记、主线推进和隐藏收集。
- `/clues`：线索/图鉴收集页。
- `/me`：个人档案、任务记录和成就展示。

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Node.js `>=20.9.0`
- DeepSeek API
- DashScope / Qwen-VL / Qwen Image
- AMap / 高德地图
- Zeabur deployment

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run test
npm run audit:assets
```

- `dev`：启动 Next.js 开发服务。
- `build`：生成生产构建。
- `start`：启动生产服务。
- `test`：运行 Node.js test runner 测试套件。
- `audit:assets`：检查资源引用情况。

## Environment Variables

复制 `.env.example` 为 `.env.local`，本地开发时填入需要的 Key。

```bash
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-v4-flash
DEEPSEEK_TRANSPORT=sdk
DEEPSEEK_MAX_TOKENS=8000

DASHSCOPE_API_KEY=
QWEN_VL_MODEL=qwen-vl-plus-latest
QWEN_VL_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_IMAGE_MODEL=qwen-image-plus
QWEN_IMAGE_BASE_URL=https://dashscope.aliyuncs.com/api/v1
QWEN_IMAGE_SIZE=1664*928
QWEN_IMAGE_MAX_POLLS=8
QWEN_IMAGE_POLL_INTERVAL_MS=5000

NEXT_PUBLIC_AMAP_JS_KEY=
NEXT_PUBLIC_AMAP_SECURITY_CODE=
AMAP_WEB_SERVICE_KEY=

STORY_LIBRARY_ROOT=
```

说明：

- `DEEPSEEK_API_KEY`：服务端剧情生成使用。
- `DASHSCOPE_API_KEY`：服务端照片理解和任务封面生成使用。
- `NEXT_PUBLIC_AMAP_JS_KEY`：前端地图 JS Key，会进入浏览器包，必须绑定线上域名。
- `NEXT_PUBLIC_AMAP_SECURITY_CODE`：高德 Web 端安全配置。
- `AMAP_WEB_SERVICE_KEY`：服务端调用逆地理编码和周边 POI，不要暴露到前端。
- `STORY_LIBRARY_ROOT`：可选素材目录。生产环境默认留空，除非素材为自有、授权、公版或明确可部署内容。

## Zeabur Deployment

项目已包含 `zbpack.json`：

```json
{
  "build_command": "npm run build",
  "start_command": "npm run start -- -p $PORT"
}
```

Zeabur 部署步骤：

1. 在 Zeabur 新建 Project。
2. 选择 GitHub source code。
3. 导入仓库 `kay19902004/citywalk-agent`。
4. 确认服务根目录为仓库根目录。
5. 在 Zeabur 环境变量中配置 `.env.example` 里的生产变量。
6. 部署成功后，复制 Zeabur 分配的域名。
7. 到高德控制台把该域名加入 Web JS Key 白名单。
8. 回到 Zeabur 重新部署一次，使 `NEXT_PUBLIC_` 变量在 build 阶段正确注入。

## Verification

本地已验证通过的命令：

```bash
npm run test
npm run build
```

当前测试覆盖包括：

- 剧情生成与质量门
- 任务推进与角色选择
- 照片 HUD 标记规范化
- 高德定位上下文
- 任务档案、路线、图鉴、个人页布局
- 生产环境素材扫描 opt-in 行为

## Story Corpus Policy

为了避免版权风险，生产环境默认不会扫描项目上层目录中的本地故事文本。线上不携带未授权作品集文本，只使用代码内置 seed 模块。

如果未来需要增强故事素材，请使用以下任一来源：

- 自己原创的文本
- 已获得明确授权的文本
- 公版或开源许可允许使用的文本
- 不可还原原文的结构化摘要素材

确认素材合规后，再通过 `STORY_LIBRARY_ROOT` 指向部署内的素材目录。



