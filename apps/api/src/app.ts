import cors from 'cors';
import express, { type Request, type Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { generatePacket } from './lib/packetGenerator.js';
import { transcribeAudio } from './lib/transcriber.js';

const upload = multer({ storage: multer.memoryStorage() });
const generatePacketRequestSchema = z.object({
  raw_text: z.string().min(1),
  clarifications: z.record(z.string(), z.unknown()).optional(),
  prompt: z.string().optional(),
  source: z
    .object({
      device: z.string().optional(),
      platform: z.string().optional(),
      appVersion: z.string().optional(),
    })
    .optional(),
});

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.post('/v1/transcribe', upload.single('audio'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Missing audio file in "audio" form field' });
        return;
      }

      const transcript = await transcribeAudio({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        filename: req.file.originalname || 'recording.webm',
      });

      res.json({ transcript });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown transcription error',
      });
    }
  });

  app.post('/v1/generate-packet', async (req: Request, res: Response) => {
    try {
      const input = generatePacketRequestSchema.parse(req.body);
      const result = await generatePacket({
        rawText: input.raw_text,
        clarifications: input.clarifications,
        promptText: input.prompt,
        source: input.source,
      });
      res.json(result);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Invalid request',
      });
    }
  });

  return app;
}
