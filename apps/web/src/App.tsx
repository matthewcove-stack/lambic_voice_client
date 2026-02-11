import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';
import { ClarificationModal } from './components/ClarificationModal';
import { RecentList } from './components/RecentList';
import { submitToNormaliser } from './lib/api';
import { generatePacketFromText } from './lib/packetGeneration';
import { enqueueSubmission, processQueue, readQueue } from './lib/queue';
import { createRecorder } from './lib/recorder';
import { toResponseViewModel, type ResponseViewModel } from './lib/response';
import { parsePacket, type ClarificationQuestion, type LightIntentPacket } from './lib/schemas';
import { readRecentSubmissions, writeRecentSubmission, type RecentSubmission } from './lib/storage';
import { logTelemetry } from './lib/telemetry';
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
  const [repairJson, setRepairJson] = useState('');
  const [repairRawText, setRepairRawText] = useState('');
  const [repairError, setRepairError] = useState('');
  const [queuedCount, setQueuedCount] = useState<number>(() => readQueue().length);

  const [recorder] = useState(() =>
    createRecorder((blob) => {
      setAudioBlob(blob);
    }),
  );

  const activeInput = useMemo(() => (mode === 'voice' ? transcriptText : textInput), [mode, textInput, transcriptText]);
  const isSubmitDisabled = useMemo(() => loading || activeInput.trim().length === 0, [loading, activeInput]);

  const submitPacket = useCallback(async (packet: LightIntentPacket, rawText: string) => {
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
  }, []);

  async function submitOrQueue(packet: LightIntentPacket, rawText: string) {
    if (!navigator.onLine) {
      const queue = enqueueSubmission(packet, rawText);
      setQueuedCount(queue.length);
      setResponseView({ type: 'accepted', message: 'Offline: packet queued for background retry.' });
      return;
    }

    try {
      await submitPacket(packet, rawText);
    } catch (error) {
      const queue = enqueueSubmission(packet, rawText);
      setQueuedCount(queue.length);
      const message = error instanceof Error ? error.message : 'Submission failed';
      setResponseView({ type: 'error', message: `${message}. Packet queued for retry.` });
    }
  }

  useEffect(() => {
    const retry = async () => {
      if (!navigator.onLine) {
        return;
      }
      const remaining = await processQueue(async (packet, rawText) => {
        await submitPacket(packet, rawText);
      });
      setQueuedCount(remaining.length);
    };

    const onlineHandler = () => {
      void retry();
    };

    const interval = window.setInterval(() => {
      void retry();
    }, 15000);

    window.addEventListener('online', onlineHandler);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('online', onlineHandler);
    };
  }, [submitPacket]);

  async function generateAndSubmit(rawText: string, clarifications?: Record<string, unknown>) {
    setLoading(true);
    setRepairError('');
    try {
      const generated = await generatePacketFromText(rawText, clarifications);
      if (generated.status === 'repair_required') {
        setRepairRawText(rawText);
        setRepairJson(generated.raw_output || '{}');
        setRepairError(generated.error);
        logTelemetry('packet_repair_required', { error: generated.error, raw_output: generated.raw_output });
        return;
      }

      await submitOrQueue(generated.packet, rawText);
      logTelemetry('packet_generated', { packet_id: generated.packet.id });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown submission error';
      setResponseView({ type: 'error', message });
      logTelemetry('packet_generation_error', { message });
    } finally {
      setLoading(false);
    }
  }

  async function submitRepairedPacket() {
    setLoading(true);
    try {
      const packet = parsePacket(JSON.parse(repairJson));
      await submitOrQueue(packet, repairRawText || packet.raw_text);
      setRepairJson('');
      setRepairError('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Repair validation failed';
      setRepairError(message);
      logTelemetry('packet_repair_error', { message, repairJson });
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
        <p>Retry queue: {queuedCount}</p>
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
          <button type="button" onClick={() => generateAndSubmit(textInput)} disabled={isSubmitDisabled}>
            {loading ? 'Submitting...' : 'Generate packet and submit'}
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
          <button type="button" onClick={() => generateAndSubmit(transcriptText)} disabled={isSubmitDisabled}>
            {loading ? 'Submitting...' : 'Generate packet and submit transcript'}
          </button>
        </section>
      )}

      {repairJson ? (
        <section className="response-panel">
          <h2>Repair Packet JSON</h2>
          <p>Generated output failed schema validation. Edit JSON then resubmit.</p>
          {repairError ? <p className="status status-error">{repairError}</p> : null}
          <textarea value={repairJson} onChange={(event) => setRepairJson(event.target.value)} rows={10} />
          <button type="button" onClick={submitRepairedPacket} disabled={loading}>
            Submit repaired packet
          </button>
        </section>
      ) : null}

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
          generateAndSubmit(baseText || activeInput, answers);
        }}
      />
    </main>
  );
}

export default App;
