# CityWalk Agent

#2026AIAgent清客松

CityWalk Agent 是一个移动端城市漫游叙事游戏：玩家选择身份、生成路线档案、在城市公共空间拍照收集线索，并通过 AI 导演推动多站点剧情。

## Links

- Code: https://github.com/YOUR_GITHUB_USERNAME/citywalk-agent
- Zeabur: https://YOUR_ZEABUR_DOMAIN

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- DeepSeek for story direction
- DashScope/Qwen for photo and image generation
- AMap / 高德 for location context

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run test
npm run build
```

## Zeabur Deployment

Zeabur reads `zbpack.json` and runs:

```bash
npm run build
npm run start -- -p $PORT
```

Configure these environment variables in Zeabur before deploying:

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
```

After Zeabur assigns a public domain, add that domain to the AMap Web JS key allowlist and redeploy so `NEXT_PUBLIC_` values are baked into the production bundle.

## Story Corpus Policy

Production does not scan the parent directory for local story files. Set `STORY_LIBRARY_ROOT` only when the directory contains self-owned, licensed, public-domain, or otherwise approved material. Leaving it empty uses the built-in seed story modules.
