import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import type { Env } from "./env.js";
import { loadEnv } from "./env.js";
import { transcribeAudio } from "./openai_transcribe.js";

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function createApp(inputEnv?: Env) {
  const env = inputEnv ?? loadEnv();

  const app = Fastify({
    logger: true,
    bodyLimit: MAX_UPLOAD_BYTES,
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
    if (!req.isMultipart()) {
      return reply.code(400).send({ error: "Missing file field 'audio'" });
    }

    const file = await req.file({ limits: { fileSize: MAX_UPLOAD_BYTES } });
    if (!file) {
      return reply.code(400).send({ error: "Missing file field 'audio'" });
    }

    if (file.fieldname !== "audio") {
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
      return reply.send(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transcription failed";
      return reply.code(500).send({ error: message });
    }
  });

  return app;
}
