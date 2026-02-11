import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('transcribe endpoint', () => {
  it('returns 400 when audio is missing', async () => {
    const app = createApp();

    const response = await request(app).post('/v1/transcribe');

    expect(response.status).toBe(400);
  });

  it('returns transcript for uploaded file', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/v1/transcribe')
      .attach('audio', Buffer.from('hello'), {
        filename: 'sample.webm',
        contentType: 'audio/webm',
      });

    expect(response.status).toBe(200);
    expect(response.body.transcript).toContain('audio/webm');
  });
});
