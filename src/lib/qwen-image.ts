type MissionCoverInput = {
  missionTitle: string;
  city: string;
  landmarkName: string;
  mode: string;
  environmentBuff: string;
};

type DashScopeTaskResponse = {
  output?: {
    task_id?: string;
    task_status?: string;
    results?: Array<{ url?: string }>;
    choices?: Array<{
      message?: {
        content?: Array<{ image?: string; url?: string; type?: string }>;
      };
    }>;
  };
};

const defaultBaseUrl = "https://dashscope.aliyuncs.com/api/v1";

export async function generateMissionCover(input: MissionCoverInput): Promise<string | null> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;

  try {
    const baseUrl = process.env.QWEN_IMAGE_BASE_URL ?? defaultBaseUrl;
    const model = process.env.QWEN_IMAGE_MODEL ?? "qwen-image-plus";
    const submitResponse = await fetch(`${baseUrl}/services/aigc/text2image/image-synthesis`, {
      method: "POST",
      headers: [
        ["X-DashScope-Async", "enable"],
        ["Authorization", `Bearer ${apiKey}`],
        ["Content-Type", "application/json"]
      ],
      body: JSON.stringify({
        model,
        input: {
          prompt: buildMissionCoverPrompt(input),
          negative_prompt: buildMissionCoverNegativePrompt()
        },
        parameters: {
          negative_prompt: buildMissionCoverNegativePrompt(),
          size: process.env.QWEN_IMAGE_SIZE ?? "1664*928",
          n: 1,
          prompt_extend: true,
          watermark: false
        }
      })
    });
    if (!submitResponse.ok) return null;

    const submitPayload = await submitResponse.json() as DashScopeTaskResponse;
    const taskId = submitPayload.output?.task_id;
    if (!taskId) return extractImageUrl(submitPayload);

    const maxPolls = Number(process.env.QWEN_IMAGE_MAX_POLLS ?? 8);
    const pollInterval = Number(process.env.QWEN_IMAGE_POLL_INTERVAL_MS ?? 5000);
    for (let index = 0; index < maxPolls; index += 1) {
      if (pollInterval > 0) await sleep(pollInterval);
      const pollResponse = await fetch(`${baseUrl}/tasks/${taskId}`, {
        headers: [["Authorization", `Bearer ${apiKey}`]]
      });
      if (!pollResponse.ok) return null;
      const pollPayload = await pollResponse.json() as DashScopeTaskResponse;
      const status = pollPayload.output?.task_status;
      if (status === "FAILED" || status === "CANCELED" || status === "UNKNOWN") return null;
      const imageUrl = extractImageUrl(pollPayload);
      if (status === "SUCCEEDED" && imageUrl) return imageUrl;
    }
  } catch {
    return null;
  }

  return null;
}

export function buildMissionCoverPrompt(input: MissionCoverInput): string {
  return [
    "mobile urban adventure game mission dossier cover image",
    `Mission mood: ${input.missionTitle}`,
    `City: ${input.city}`,
    `Landmark or starting place: ${input.landmarkName}`,
    `Adventure mode: ${input.mode}`,
    `Environment: ${input.environmentBuff}`,
    "Modern city exploration, light vintage archive mood, high-quality mobile game UI atmosphere.",
    "Cinematic street landmark, warm paper dossier feeling, refined collectible mission card art.",
    "No readable signage, no embedded UI, no text."
  ].join(". ");
}

function buildMissionCoverNegativePrompt(): string {
  return [
    "no text",
    "no Chinese characters",
    "no watermark",
    "no logo",
    "no close-up portrait",
    "no phone UI",
    "no cyberpunk",
    "no pure sci-fi HUD",
    "no cartoon",
    "no cheap flat illustration"
  ].join(", ");
}

function extractImageUrl(payload: DashScopeTaskResponse): string | null {
  const resultUrl = payload.output?.results?.find((item) => item.url)?.url;
  if (resultUrl) return resultUrl;
  for (const choice of payload.output?.choices ?? []) {
    for (const item of choice.message?.content ?? []) {
      if (item.image) return item.image;
      if (item.url) return item.url;
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
