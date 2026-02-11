import { useMemo, useState } from 'react';
import './App.css';
import { ClarificationModal } from './components/ClarificationModal';
import { RecentList } from './components/RecentList';
import { submitToNormaliser } from './lib/api';
import { buildPacket } from './lib/packet';
import { createRecorder } from './lib/recorder';
import { toResponseViewModel, type ResponseViewModel } from './lib/response';
import type { ClarificationQuestion } from './lib/schemas';
import { readRecentSubmissions, writeRecentSubmission, type RecentSubmission } from './lib/storage';
import { transcribeBlob } from './lib/transcribe';

function App() {
  const [textInput, setTextInput] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recentItems, setRecentItems] = useState<RecentSubmission[]>(() => readRecentSubmissions());
  const [responseView, setResponseView] = useState<ResponseViewModel | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [baseText, setBaseText] = useState('');
  const [mode, setMode] = useState<'text' | 'voice'>('text');

  const [recorder] = useState(() =>
    createRecorder((blob) => {
      setAudioBlob(blob);
    }),
  );

  const activeInput = useMemo(() => {
    if (mode === 'voice') {
      return transcriptText;
    }
    return textInput;
  }, [mode, textInput, transcriptText]);

  const isSubmitDisabled = useMemo(() => loading || activeInput.trim().length === 0, [loading, activeInput]);

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

  async function startRecording() {
    try {
      await recorder.start();
      setIsRecording(true);
      setResponseView(null);
    } catch (error) {
      setResponseView({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unable to start recording',
      });
    }
  }

  function stopRecording() {
    recorder.stop();
    setIsRecording(false);
  }

  async function runTranscription() {
    if (!audioBlob) {
      setResponseView({ type: 'error', message: 'Record audio first.' });
      return;
    }

    setIsTranscribing(true);
    try {
      const transcript = await transcribeBlob(audioBlob);
      setTranscriptText(transcript);
    } catch (error) {
      setResponseView({
        type: 'error',
        message: error instanceof Error ? error.message : 'Transcription failed',
      });
    } finally {
      setIsTranscribing(false);
    }
  }

  return (
    <main className="app-shell">
      <header>
        <h1>Lambic Voice Intake</h1>
        <p>Text and voice intake to intent normaliser.</p>
      </header>

      <section className="mode-toggle">
        <button type="button" onClick={() => setMode('text')} className={mode === 'text' ? 'active' : ''}>
          Text mode
        </button>
        <button type="button" onClick={() => setMode('voice')} className={mode === 'voice' ? 'active' : ''}>
          Voice mode
        </button>
      </section>

      {mode === 'text' ? (
        <section className="intake-panel">
          <label htmlFor="text-input">Input text</label>
          <textarea
            id="text-input"
            value={textInput}
            onChange={(event) => setTextInput(event.target.value)}
            placeholder="Paste or type a task"
            rows={6}
          />
          <button type="button" onClick={() => submitPacket(textInput)} disabled={isSubmitDisabled}>
            {loading ? 'Submitting...' : 'Submit to normaliser'}
          </button>
        </section>
      ) : (
        <section className="intake-panel">
          <h2>Record and transcribe</h2>
          <div className="recording-controls">
            <button type="button" onClick={startRecording} disabled={isRecording}>
              Start recording
            </button>
            <button type="button" onClick={stopRecording} disabled={!isRecording}>
              Stop recording
            </button>
            <button type="button" onClick={runTranscription} disabled={!audioBlob || isTranscribing}>
              {isTranscribing ? 'Transcribing...' : 'Transcribe'}
            </button>
          </div>
          <label htmlFor="transcript">Transcript (editable before submit)</label>
          <textarea
            id="transcript"
            value={transcriptText}
            onChange={(event) => setTranscriptText(event.target.value)}
            placeholder="Transcript appears here"
            rows={6}
          />
          <button type="button" onClick={() => submitPacket(transcriptText)} disabled={isSubmitDisabled}>
            {loading ? 'Submitting...' : 'Submit transcript'}
          </button>
        </section>
      )}

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
          setMode('text');
          setTextInput(rawText);
        }}
      />

      <ClarificationModal
        open={clarificationQuestions.length > 0}
        questions={clarificationQuestions}
        onCancel={() => setClarificationQuestions([])}
        onSubmit={(answers) => {
          setClarificationQuestions([]);
          submitPacket(baseText || activeInput, answers);
        }}
      />
    </main>
  );
}

export default App;
