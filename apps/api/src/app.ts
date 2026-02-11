import cors from 'cors';
import express, { type Request, type Response } from 'express';
import multer from 'multer';
import { transcribeAudio } from './lib/transcriber.js';

const upload = multer({ storage: multer.memoryStorage() });

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

  return app;
}
