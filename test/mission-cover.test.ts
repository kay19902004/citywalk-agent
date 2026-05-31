import { strict as assert } from "node:assert";
import test from "node:test";
import { generateMissionCover } from "../src/lib/qwen-image";

test("mission cover generation returns null when dashscope key is absent", async () => {
  const originalKey = process.env.DASHSCOPE_API_KEY;
  delete process.env.DASHSCOPE_API_KEY;
  try {
    const url = await generateMissionCover({
      missionTitle: "梧桐树下的旧照片",
      city: "上海",
      landmarkName: "武康路旧书店",
      mode: "奇遇",
      environmentBuff: "小雨 下午"
    });

    assert.equal(url, null);
  } finally {
    if (originalKey) process.env.DASHSCOPE_API_KEY = originalKey;
  }
});

test("mission cover generation submits a qwen image task and reads the generated image url", async () => {
  const originalKey = process.env.DASHSCOPE_API_KEY;
  const originalFetch = globalThis.fetch;
  const originalPoll = process.env.QWEN_IMAGE_POLL_INTERVAL_MS;
  const calls: Array<{ url: string; init?: RequestInit }> = [];

  process.env.DASHSCOPE_API_KEY = "test-key";
  process.env.QWEN_IMAGE_POLL_INTERVAL_MS = "0";
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    if (String(url).includes("/tasks/task-1")) {
      return Response.json({
        output: {
          task_status: "SUCCEEDED",
          choices: [
            {
              message: {
                content: [
                  { type: "image", image: "https://example.com/mission-cover.png" }
                ]
              }
            }
          ]
        }
      });
    }
    return Response.json({
      output: {
        task_id: "task-1",
        task_status: "PENDING"
      }
    });
  }) as typeof fetch;

  try {
    const url = await generateMissionCover({
      missionTitle: "梧桐树下的旧照片",
      city: "上海",
      landmarkName: "武康路旧书店",
      mode: "奇遇",
      environmentBuff: "小雨 下午"
    });

    assert.equal(url, "https://example.com/mission-cover.png");
    assert.equal(calls.length, 2);
    assert.match(calls[0].url, /\/services\/aigc\/text2image\/image-synthesis$/);
    assert.match(String(calls[0].init?.headers), /X-DashScope-Async/);
    const body = JSON.parse(String(calls[0].init?.body));
    assert.equal(body.model, "qwen-image-plus");
    assert.equal(body.parameters.size, "1664*928");
    assert.equal(body.parameters.n, 1);
    assert.equal(body.parameters.watermark, false);
    assert.match(body.input.prompt, /mobile urban adventure game mission dossier cover image/);
    assert.match(body.input.prompt, /Shanghai|上海/);
    assert.match(body.input.negative_prompt, /no text/i);
    assert.match(body.input.negative_prompt, /no Chinese characters/i);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey) process.env.DASHSCOPE_API_KEY = originalKey;
    else delete process.env.DASHSCOPE_API_KEY;
    if (originalPoll) process.env.QWEN_IMAGE_POLL_INTERVAL_MS = originalPoll;
    else delete process.env.QWEN_IMAGE_POLL_INTERVAL_MS;
  }
});
