import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { randomUUID } from "node:crypto";
import type { Env } from "./env.js";
import { loadEnv } from "./env.js";
import { transcribeAudio } from "./openai_transcribe.js";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60_000;

export function createApp(inputEnv?: Env) {
  const env = inputEnv ?? loadEnv();
  const requestBuckets = new Map<string, { count: number; windowStart: number }>();

  const app = Fastify({
    logger: true,
    bodyLimit: MAX_UPLOAD_BYTES,
  });

  app.addHook("onRequest", async (req, reply) => {
    const correlationId = String(req.headers["x-correlation-id"] ?? randomUUID());
    (req as { correlationId?: string }).correlationId = correlationId;
    reply.header("x-correlation-id", correlationId);

    const now = Date.now();
    const key = `${req.ip}:${req.routeOptions.url ?? req.url}`;
    const current = requestBuckets.get(key);
    if (!current || now - current.windowStart >= RATE_LIMIT_WINDOW_MS) {
      requestBuckets.set(key, { count: 1, windowStart: now });
      return;
    }

    if (current.count >= env.RATE_LIMIT_RPM) {
      req.log.warn(
        { correlation_id: correlationId, ip: req.ip, path: req.url },
        "rate_limit_exceeded",
      );
      await reply.code(429).send({ error: "Rate limit exceeded" });
      return reply;
    }

    current.count += 1;
    requestBuckets.set(key, current);
  });

  app.addHook("onResponse", async (req, reply) => {
    req.log.info(
      {
        correlation_id: (req as { correlationId?: string }).correlationId ?? "unknown",
        method: req.method,
        path: req.url,
        status_code: reply.statusCode,
      },
      "request_complete",
    );
  });

  void app.register(multipart, {
    limits: { fileSize: MAX_UPLOAD_BYTES },
  });

  void app.register(cors, {
    origin: env.CORS_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  });

  app.get("/healthz", async () => ({ ok: true }));

  app.post("/v1/transcribe", async (req, reply) => {
    const correlationId = (req as { correlationId?: string }).correlationId ?? "unknown";
    if (!req.isMultipart()) {
      req.log.warn({ correlation_id: correlationId }, "missing_audio_field");
      return reply.code(400).send({ error: "Missing file field 'audio'" });
    }

    const file = await req.file({ limits: { fileSize: MAX_UPLOAD_BYTES } });
    if (!file) {
      req.log.warn({ correlation_id: correlationId }, "missing_audio_file");
      return reply.code(400).send({ error: "Missing file field 'audio'" });
    }

    if (file.fieldname !== "audio") {
      req.log.warn({ correlation_id: correlationId, field: file.fieldname }, "unexpected_form_field");
      return reply.code(400).send({ error: "Expected field name 'audio'" });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of file.file) {
      chunks.push(chunk as Buffer);
    }

    try {
      const result = await transcribeAudio({
        env,
        filename: file.filename ?? "audio.webm",
        mimeType: file.mimetype ?? "audio/webm",
        buffer: Buffer.concat(chunks),
      });
      req.log.info({ correlation_id: correlationId }, "transcription_success");
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transcription failed";
      req.log.error({ correlation_id: correlationId, error: message }, "transcription_failed");
      return reply.code(500).send({ error: message });
    }
  });

  return app;
}
