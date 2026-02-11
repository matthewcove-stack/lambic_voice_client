export type RecentSubmission = {
  id: string;
  rawText: string;
  status: string;
  createdAt: string;
};

const STORAGE_KEY = 'lambic_recent_submissions';
const MAX_ITEMS = 10;

export function readRecentSubmissions(): RecentSubmission[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as RecentSubmission[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function writeRecentSubmission(item: RecentSubmission): RecentSubmission[] {
  const current = readRecentSubmissions();
  const next = [item, ...current].slice(0, MAX_ITEMS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
