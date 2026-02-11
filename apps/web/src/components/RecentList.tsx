import type { RecentSubmission } from '../lib/storage';

type RecentListProps = {
  items: RecentSubmission[];
  onReuse: (rawText: string) => void;
};

export function RecentList({ items, onReuse }: RecentListProps) {
  return (
    <section className="recent-panel">
      <h2>Recent Submissions</h2>
      {items.length === 0 ? <p>No submissions yet.</p> : null}
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onReuse(item.rawText)}>
              Reuse
            </button>
            <p>{item.rawText}</p>
            <small>
              {item.status} - {new Date(item.createdAt).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}
