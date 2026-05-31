import OpenAI from "openai";
import { normalizePhotoOverlay } from "./photo-overlay";
import type { ExpandedGameSession, PhotoOverlay } from "./types";

type AnalyzePhotoInput = {
  session: ExpandedGameSession;
  nodeId: string;
  imageBase64: string;
};

export async function analyzePhotoForOverlay(input: AnalyzePhotoInput): Promise<PhotoOverlay> {
  const node = input.session.story.nodes.find((item) => item.id === input.nodeId) ?? input.session.currentScene;
  const fallback = {
    nodeId: node.id,
    fallbackMainTask: node.mainTask,
    fallbackHiddenTask: node.hiddenTask
  };

  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return normalizePhotoOverlay(mockOverlay(node.id, node.mainTask, node.hiddenTask), fallback);
  }

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: process.env.QWEN_VL_BASE_URL ?? "https://dashscope.aliyuncs.com/compatible-mode/v1",
      maxRetries: 0,
      timeout: 45000
    });

    const response = await client.chat.completions.create({
      model: process.env.QWEN_VL_MODEL ?? "qwen-vl-plus-latest",
      messages: [
        {
          role: "system",
          content: "你是城市冒险照片分析器。只输出合法JSON，不要Markdown。所有任务只能基于公共可观察元素，不要要求进入私人区域、打扰路人、拍摄陌生人或接触他人物品。"
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                `当前站点=${node.locationName}`,
                `章节目标=${node.mainTask}`,
                `隐藏任务=${node.hiddenTask}`,
                `拍照提示=${node.photoPrompt}`,
                "请识别照片中的公共锚点，例如路牌、店招、门口、橱窗、墙面、长椅、地铁口、导视牌。",
                "任务呈现要像现实游戏HUD：主线标记清楚、隐藏标记有探索欲，但不要编造照片里看不见的具体文字。",
                "返回JSON字段：nodeId,imageSummary,mainTask,hiddenTask,markers,arrows。",
                "markers为数组，每个含id,type(main或hidden),label,x,y,clueText,actionLabel；x,y必须是0到1之间的相对坐标。至少1个main，最多3个hidden。",
                "arrows为数组，每个含fromX,fromY,toX,toY,label；坐标必须是0到1。"
              ].join("\n")
            },
            {
              type: "image_url",
              image_url: {
                url: input.imageBase64.startsWith("data:")
                  ? input.imageBase64
                  : `data:image/jpeg;base64,${input.imageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.25,
      max_tokens: 1200
    } as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);

    const raw = response.choices[0]?.message?.content ?? "{}";
    return normalizePhotoOverlay(JSON.parse(extractJson(raw)), fallback);
  } catch {
    return normalizePhotoOverlay(mockOverlay(node.id, node.mainTask, node.hiddenTask), fallback);
  }
}

function mockOverlay(nodeId: string, mainTask: string, hiddenTask: string): unknown {
  return {
    nodeId,
    imageSummary: "现场信号有点弱，先为你生成一版临时线索。你仍然可以点击主线或隐藏标记继续冒险。",
    mainTask,
    hiddenTask,
    markers: [
      {
        id: "main-1",
        type: "main",
        label: "主线任务",
        x: 0.52,
        y: 0.42,
        clueText: mainTask,
        actionLabel: "完成主线"
      },
      {
        id: "hidden-1",
        type: "hidden",
        label: "隐藏任务",
        x: 0.78,
        y: 0.3,
        clueText: hiddenTask,
        actionLabel: "查看隐藏"
      }
    ],
    arrows: [{ fromX: 0.5, fromY: 0.82, toX: 0.52, toY: 0.42, label: "沿箭头观察主线标记" }]
  };
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Qwen-VL did not return JSON");
  return match[0];
}
