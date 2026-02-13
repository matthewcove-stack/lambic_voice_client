import type { IntentPacket } from './schemas';

export type QueuedSubmission = {
  id: string;
  packet: IntentPacket;
  rawText: string;
  attempts: number;
  queuedAt: string;
};

const QUEUE_KEY = 'lambic_submission_queue';

export function readQueue(): QueuedSubmission[] {
  const raw = localStorage.getItem(QUEUE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as QueuedSubmission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedSubmission[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export function enqueueSubmission(packet: IntentPacket, rawText: string): QueuedSubmission[] {
  const current = readQueue();
  const next = [
    ...current,
    {
      id: crypto.randomUUID(),
      packet,
      rawText,
      attempts: 0,
      queuedAt: new Date().toISOString(),
    },
  ];
  writeQueue(next);
  return next;
}

export async function processQueue(
  submit: (packet: IntentPacket, rawText: string) => Promise<void>,
): Promise<QueuedSubmission[]> {
  const queue = readQueue();
  const remaining: QueuedSubmission[] = [];

  for (const item of queue) {
    try {
      await submit(item.packet, item.rawText);
    } catch {
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  writeQueue(remaining);
  return remaining;
}
