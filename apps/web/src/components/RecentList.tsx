import { useMemo, useState } from 'react';
import type { RecentSubmission } from '../lib/storage';

type RecentListProps = {
  items: RecentSubmission[];
  onReuse: (rawText: string) => void;
};

export function RecentList({ items, onReuse }: RecentListProps) {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const queryMatch = item.rawText.toLowerCase().includes(query.toLowerCase());
      const statusMatch = statusFilter === 'all' || item.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [items, query, statusFilter]);

  return (
    <section className="recent-panel">
      <h2>Recent Submissions</h2>
      <div className="recent-filters">
        <input
          placeholder="Filter by text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="all">All statuses</option>
          <option value="accepted">Accepted</option>
          <option value="needs_clarification">Needs clarification</option>
          <option value="rejected">Rejected</option>
          <option value="error">Error</option>
        </select>
      </div>
      {filtered.length === 0 ? <p>No submissions found.</p> : null}
      <ul>
        {filtered.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onReuse(item.rawText)}>
              Reuse
            </button>
            <p>{item.rawText}</p>
            <small>
              <span className={`status status-${item.status}`}>{item.status}</span> -{' '}
              {new Date(item.createdAt).toLocaleString()}
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}
