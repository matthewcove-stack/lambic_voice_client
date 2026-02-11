import { describe, expect, it } from 'vitest';
import { createRecorder } from './recorder';

describe('createRecorder', () => {
  it('throws when MediaRecorder is unsupported', async () => {
    Object.defineProperty(window, 'MediaRecorder', { value: undefined, configurable: true });

    const recorder = createRecorder(() => {});

    await expect(recorder.start()).rejects.toThrow('MediaRecorder is not supported');
  });
});
