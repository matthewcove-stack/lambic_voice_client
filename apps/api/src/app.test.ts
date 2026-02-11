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

describe('generate packet endpoint', () => {
  it('returns a packet for valid input', async () => {
    const app = createApp();

    const response = await request(app).post('/v1/generate-packet').send({ raw_text: 'add milk' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.packet.raw_text).toBe('add milk');
  });
});
