type TelemetryEvent = {
  timestamp: string;
  event: string;
  details: Record<string, unknown>;
};

const TELEMETRY_KEY = 'lambic_telemetry';
const SECRET_PATTERNS = [/sk-[a-z0-9]+/gi, /gho_[a-z0-9_]+/gi, /api[_-]?key/gi];

export function redactSecrets(value: string): string {
  let redacted = value;
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, '[REDACTED]');
  }
  return redacted;
}

export function logTelemetry(event: string, details: Record<string, unknown>) {
  const payload = JSON.stringify(details, (_key, value) => {
    if (typeof value === 'string') {
      return redactSecrets(value);
    }
    return value;
  });

  const entry: TelemetryEvent = {
    timestamp: new Date().toISOString(),
    event,
    details: JSON.parse(payload),
  };

  const existingRaw = localStorage.getItem(TELEMETRY_KEY);
  const existing = existingRaw ? (JSON.parse(existingRaw) as TelemetryEvent[]) : [];
  const next = [entry, ...existing].slice(0, 50);
  localStorage.setItem(TELEMETRY_KEY, JSON.stringify(next));
}

export function readTelemetry(): TelemetryEvent[] {
  const raw = localStorage.getItem(TELEMETRY_KEY);
  if (!raw) {
    return [];
  }
  return JSON.parse(raw) as TelemetryEvent[];
}
