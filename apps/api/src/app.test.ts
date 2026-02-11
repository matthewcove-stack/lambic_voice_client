import { afterEach, describe, expect, it, vi } from "vitest";
import { createApp } from "./app.js";
import type { Env } from "./env.js";

vi.mock("./openai_transcribe.js", () => ({
  transcribeAudio: vi.fn(async () => ({ text: "mock transcript" })),
}));

const testEnv: Env = {
  OPENAI_API_KEY: "test",
  TRANSCRIBE_MODEL: "gpt-4o-mini-transcribe",
  OPENAI_BASE_URL: "https://api.openai.com/v1",
  PORT: 8787,
  CORS_ORIGINS: "http://localhost:5173",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("transcribe endpoint", () => {
  it("returns 400 when audio is missing", async () => {
    const app = createApp(testEnv);
    const response = await app.inject({
      method: "POST",
      url: "/v1/transcribe",
    });
    expect(response.statusCode).toBe(400);
    await app.close();
  });

  it("returns { text } for uploaded audio", async () => {
    const boundary = "----testboundary";
    const payload = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="audio"; filename="sample.webm"',
      "Content-Type: audio/webm",
      "",
      "audio-bytes",
      `--${boundary}--`,
      "",
    ].join("\r\n");

    const app = createApp(testEnv);
    const response = await app.inject({
      method: "POST",
      url: "/v1/transcribe",
      payload,
      headers: {
        "content-type": `multipart/form-data; boundary=${boundary}`,
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ text: "mock transcript" });
    await app.close();
  });
});
