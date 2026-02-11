import { useMemo, useState } from "react";
import "./App.css";
import { ClarificationModal } from "./components/ClarificationModal";
import { RecentList } from "./components/RecentList";
import { Recorder } from "./components/Recorder";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { submitToNormaliser } from "./lib/api";
import { buildPacket } from "./lib/packet";
import { toResponseViewModel, type ResponseViewModel } from "./lib/response";
import type { ClarificationQuestion } from "./lib/schemas";
import { readRecentSubmissions, writeRecentSubmission, type RecentSubmission } from "./lib/storage";
import { transcribeAudio } from "./lib/transcribe";

function App() {
  const transcribeBaseUrl = useMemo(
    () => import.meta.env.VITE_TRANSCRIBE_BASE_URL as string | undefined,
    [],
  );

  const [textInput, setTextInput] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responseView, setResponseView] = useState<ResponseViewModel | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [baseText, setBaseText] = useState("");
  const [recentItems, setRecentItems] = useState<RecentSubmission[]>(() => readRecentSubmissions());

  const submitText = useMemo(() => transcript.trim() || textInput.trim(), [textInput, transcript]);

  async function runTranscription() {
    if (!audioBlob || !transcribeBaseUrl) {
      return;
    }
    setIsTranscribing(true);
    setResponseView(null);
    try {
      const result = await transcribeAudio({ baseUrl: transcribeBaseUrl, blob: audioBlob });
      setTranscript(result.text);
    } catch (error) {
      setResponseView({
        type: "error",
        message: error instanceof Error ? error.message : "Transcription failed",
      });
    } finally {
      setIsTranscribing(false);
    }
  }

  async function submitRawText(rawText: string, clarifications?: Record<string, unknown>) {
    if (!rawText.trim()) {
      setResponseView({ type: "error", message: "Enter text or transcribe audio before submitting." });
      return;
    }

    setIsSubmitting(true);
    try {
      const packet = buildPacket(rawText, clarifications);
      const response = await submitToNormaliser(packet);
      const view = toResponseViewModel(response);
      setResponseView(view);

      const nextRecent = writeRecentSubmission({
        id: packet.id,
        rawText,
        status: response.status,
        createdAt: packet.created_at,
      });
      setRecentItems(nextRecent);

      if (view.type === "needs_clarification") {
        setClarificationQuestions(view.questions);
        setBaseText(rawText);
      } else {
        setClarificationQuestions([]);
      }
    } catch (error) {
      setResponseView({
        type: "error",
        message: error instanceof Error ? error.message : "Normaliser submission failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <header>
        <h1>Lambic Voice Intake (Phase 2)</h1>
        <p>Record audio, transcribe, edit transcript, then send to normaliser.</p>
      </header>

      <section className="intake-panel">
        <label htmlFor="text-input">Typed text (fallback if no transcript)</label>
        <textarea
          id="text-input"
          rows={4}
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
          placeholder="Type intent text here"
        />

        <Recorder
          onRecorded={(blob) => {
            setAudioBlob(blob);
            setTranscript("");
          }}
        />

        <div className="recording-controls">
          <button type="button" disabled={!audioBlob || !transcribeBaseUrl || isTranscribing} onClick={runTranscription}>
            {isTranscribing ? "Transcribing..." : "Transcribe audio"}
          </button>
          {audioBlob ? <span>Audio captured ({Math.round(audioBlob.size / 1024)} KB)</span> : <span>No audio recorded</span>}
        </div>

        <TranscriptPanel transcript={transcript} setTranscript={setTranscript} busy={isTranscribing} />

        <button type="button" disabled={isSubmitting || submitText.length === 0} onClick={() => submitRawText(submitText)}>
          {isSubmitting ? "Submitting..." : "Send to normaliser"}
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
          void submitRawText(baseText || submitText, answers);
        }}
      />
    </main>
  );
}

export default App;
