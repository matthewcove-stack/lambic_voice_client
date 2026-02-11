import { useMemo, useState } from 'react';
import './App.css';
import { ClarificationModal } from './components/ClarificationModal';
import { RecentList } from './components/RecentList';
import { submitToNormaliser } from './lib/api';
import { buildPacket } from './lib/packet';
import { toResponseViewModel, type ResponseViewModel } from './lib/response';
import { type ClarificationQuestion } from './lib/schemas';
import { readRecentSubmissions, writeRecentSubmission, type RecentSubmission } from './lib/storage';

function App() {
  const [textInput, setTextInput] = useState('');
  const [recentItems, setRecentItems] = useState<RecentSubmission[]>(() => readRecentSubmissions());
  const [responseView, setResponseView] = useState<ResponseViewModel | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [baseText, setBaseText] = useState('');

  const isSubmitDisabled = useMemo(() => loading || textInput.trim().length === 0, [loading, textInput]);

  async function submitPacket(rawText: string, clarifications?: Record<string, unknown>) {
    setLoading(true);
    try {
      const packet = buildPacket(rawText, clarifications);
      const response = await submitToNormaliser(packet);
      const view = toResponseViewModel(response);
      setResponseView(view);

      const newRecent = writeRecentSubmission({
        id: packet.id,
        rawText,
        status: response.status,
        createdAt: packet.created_at,
      });
      setRecentItems(newRecent);

      if (view.type === 'needs_clarification') {
        setClarificationQuestions(view.questions);
        setBaseText(rawText);
      } else {
        setClarificationQuestions([]);
      }
    } catch (error) {
      setResponseView({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown submission error',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <header>
        <h1>Lambic Voice Intake (Phase 1)</h1>
        <p>Text intake and intent normaliser loop.</p>
      </header>

      <section className="intake-panel">
        <label htmlFor="text-input">Input text</label>
        <textarea
          id="text-input"
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
          placeholder="Paste or type a task, e.g. Add milk to my shopping list"
          rows={6}
        />
        <button type="button" onClick={() => submitPacket(textInput)} disabled={isSubmitDisabled}>
          {loading ? 'Submitting...' : 'Submit to normaliser'}
        </button>
      </section>

      <section className="response-panel">
        <h2>Response</h2>
        {!responseView ? <p>No response yet.</p> : null}
        {responseView ? (
          <>
            <p className={`status status-${responseView.type}`}>{responseView.type}</p>
            <p>{responseView.message}</p>
          </>
        ) : null}
      </section>

      <RecentList
        items={recentItems}
        onReuse={(rawText) => {
          setTextInput(rawText);
        }}
      />

      <ClarificationModal
        open={clarificationQuestions.length > 0}
        questions={clarificationQuestions}
        onCancel={() => setClarificationQuestions([])}
        onSubmit={(answers) => {
          setClarificationQuestions([]);
          submitPacket(baseText || textInput, answers);
        }}
      />
    </main>
  );
}

export default App;
