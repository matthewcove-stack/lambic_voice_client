import { describe, it, expect } from "vitest";
import { loadEnv } from "../env.js";

describe("env", () => {
  it("fails fast on missing OPENAI_API_KEY", () => {
    const prev = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    expect(() => loadEnv()).toThrow();
    if (prev) process.env.OPENAI_API_KEY = prev;
  });
});
