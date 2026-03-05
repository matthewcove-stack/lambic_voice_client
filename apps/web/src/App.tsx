import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { ClarificationModal } from "./components/ClarificationModal";
import { RecentList } from "./components/RecentList";
import { Recorder } from "./components/Recorder";
import { TranscriptPanel } from "./components/TranscriptPanel";
import { submitClarificationAnswer, submitToNormaliser } from "./lib/api";
import { buildPacket, type Destination } from "./lib/packet";
import { generatePacketFromText } from "./lib/packetGeneration";
import { enqueueSubmission, processQueue, readQueue } from "./lib/queue";
import { toResponseViewModel, type ResponseViewModel } from "./lib/response";
import { parsePacket, type Clarification } from "./lib/schemas";
import { readRecentSubmissions, writeRecentSubmission, type RecentSubmission } from "./lib/storage";
import { transcribeAudio } from "./lib/transcribe";

type AttachmentPayload = {
  filename: string;
  mime: string;
  size: number;
  sha256: string;
  text?: string;
};

function isTextLikeFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (mime.startsWith("text/")) {
    return true;
  }
  const name = file.name.toLowerCase();
  return [".txt", ".md", ".json", ".csv", ".log", ".yml", ".yaml", ".xml"].some((suffix) => name.endsWith(suffix));
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function buildAttachmentPayload(file: File): Promise<AttachmentPayload> {
  const text = isTextLikeFile(file) ? await file.text() : undefined;
  const digestSource = text ?? `${file.name}:${file.type}:${file.size}`;
  const sha256 = await sha256Hex(digestSource);
  return {
    filename: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
    sha256,
    ...(text ? { text } : {}),
  };
}

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
  const [isGeneratingPacket, setIsGeneratingPacket] = useState(false);
  const [generatedPacketDraft, setGeneratedPacketDraft] = useState("");
  const [destination, setDestination] = useState<Destination>("auto");
  const [urlInput, setUrlInput] = useState("");
  const [urlComment, setUrlComment] = useState("");
  const [attachment, setAttachment] = useState<AttachmentPayload | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [responseView, setResponseView] = useState<ResponseViewModel | null>(null);
  const [clarification, setClarification] = useState<Clarification | null>(null);
  const [recentItems, setRecentItems] = useState<RecentSubmission[]>(() => readRecentSubmissions());
  const [queuedCount, setQueuedCount] = useState(() => readQueue().length);

  useEffect(() => {
    async function drainQueue() {
      const remaining = await processQueue(async (packet) => {
        await submitToNormaliser(packet);
      });
      setQueuedCount(remaining.length);
    }

    void drainQueue();

    function handleOnline() {
      void drainQueue();
    }

    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

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
      const extraFields: Record<string, unknown> = {};
      if (urlInput.trim()) {
        extraFields.url = urlInput.trim();
      }
      if (urlComment.trim()) {
        extraFields.url_comment = urlComment.trim();
      }
      if (attachment) {
        extraFields.attachment = attachment;
      }
      const packet = buildPacket(rawText, destination, clarifications, extraFields);
      const response = await submitToNormaliser(packet);
      const view = toResponseViewModel(response);
      setResponseView(view);

      const nextRecent = writeRecentSubmission({
        id: response.receipt_id ?? crypto.randomUUID(),
        rawText,
        status: response.status,
        createdAt: new Date().toISOString(),
      });
      setRecentItems(nextRecent);

      if (view.type === "needs_clarification") {
        setClarification(view.clarification);
      } else {
        setClarification(null);
      }
    } catch (error) {
      if (error instanceof TypeError) {
        // Network failure — queue for retry when connection restores
        const extraFields: Record<string, unknown> = {};
        if (urlInput.trim()) extraFields.url = urlInput.trim();
        if (urlComment.trim()) extraFields.url_comment = urlComment.trim();
        if (attachment) extraFields.attachment = attachment;
        const packet = buildPacket(rawText, destination, clarifications, extraFields);
        enqueueSubmission(packet, rawText);
        setQueuedCount((c) => c + 1);
        setResponseView({ type: "error", message: "Offline — submission queued and will retry automatically." });
      } else {
        setResponseView({
          type: "error",
          message: error instanceof Error ? error.message : "Normaliser submission failed",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePickedFile(file: File) {
    setAttachmentError(null);
    try {
      const nextAttachment = await buildAttachmentPayload(file);
      setAttachment(nextAttachment);
    } catch (error) {
      setAttachment(null);
      setAttachmentError(error instanceof Error ? error.message : "Could not read file");
    }
  }

  async function runAutoStructure(rawText: string) {
    if (!rawText.trim()) {
      setResponseView({ type: "error", message: "Enter text before auto-structuring." });
      return;
    }

    setIsGeneratingPacket(true);
    try {
      const result = await generatePacketFromText(rawText);
      if (result.status === "repair_required") {
        const fallbackPacket = buildPacket(rawText, destination);
        setGeneratedPacketDraft(JSON.stringify(fallbackPacket, null, 2));
        setResponseView({
          type: "error",
          message: `Auto-structure failed: ${result.error}. Loaded fallback draft; review and submit.`,
        });
        return;
      }
      setGeneratedPacketDraft(JSON.stringify(result.packet, null, 2));
    } catch (error) {
      setResponseView({
        type: "error",
        message: error instanceof Error ? error.message : "Auto-structure failed",
      });
    } finally {
      setIsGeneratingPacket(false);
    }
  }

  async function submitGeneratedPacketDraft() {
    if (!generatedPacketDraft.trim()) {
      setResponseView({ type: "error", message: "No generated packet to submit." });
      return;
    }

    setIsSubmitting(true);
    try {
      const parsed = parsePacket(JSON.parse(generatedPacketDraft));
      const response = await submitToNormaliser(parsed);
      const view = toResponseViewModel(response);
      setResponseView(view);
      if (view.type === "needs_clarification") {
        setClarification(view.clarification);
      }
    } catch (error) {
      setResponseView({
        type: "error",
        message: error instanceof Error ? error.message : "Generated packet submission failed",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <header>
        <div className="header-row">
          <h1>Brain OS</h1>
          {queuedCount > 0 && <span className="queue-badge">{queuedCount} queued</span>}
        </div>
        <p>Capture voice, text, URLs, or files — routed to Notion.</p>
      </header>

      <section className="intake-panel">
        <label htmlFor="destination">Destination</label>
        <select
          id="destination"
          value={destination}
          onChange={(event) => setDestination(event.target.value as Destination)}
        >
          <option value="auto">Auto</option>
          <option value="task">Task</option>
          <option value="shopping_list">Shopping List Item</option>
          <option value="note">Note</option>
        </select>

        <label htmlFor="text-input">Typed text (fallback if no transcript)</label>
        <textarea
          id="text-input"
          rows={4}
          value={textInput}
          onChange={(event) => setTextInput(event.target.value)}
          placeholder="Type intent text here"
        />

        <label htmlFor="url-input">URL (optional)</label>
        <input
          id="url-input"
          type="url"
          value={urlInput}
          onChange={(event) => setUrlInput(event.target.value)}
          placeholder="https://example.com/article"
        />

        <label htmlFor="url-comment">URL comment (optional)</label>
        <textarea
          id="url-comment"
          rows={2}
          value={urlComment}
          onChange={(event) => setUrlComment(event.target.value)}
          placeholder="Why this link matters"
        />

        <label htmlFor="attachment-input">File (optional)</label>
        <input
          id="attachment-input"
          type="file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              setAttachment(null);
              return;
            }
            void handlePickedFile(file);
          }}
        />
        <div
          className="drop-zone"
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            const file = event.dataTransfer.files?.[0];
            if (!file) {
              return;
            }
            void handlePickedFile(file);
          }}
        >
          Drop a file here
        </div>
        {attachment ? (
          <p>
            Attached: {attachment.filename} ({attachment.mime}, {Math.round(attachment.size / 1024)} KB)
          </p>
        ) : null}
        {attachmentError ? <p className="status-error">{attachmentError}</p> : null}

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

        <button
          type="button"
          disabled={isGeneratingPacket || submitText.length === 0}
          onClick={() => {
            void runAutoStructure(submitText);
          }}
        >
          {isGeneratingPacket ? "Auto-structuring..." : "Auto-structure"}
        </button>

        <button type="button" disabled={isSubmitting || submitText.length === 0} onClick={() => submitRawText(submitText)}>
          {isSubmitting ? "Submitting..." : "Send to normaliser"}
        </button>

        {generatedPacketDraft ? (
          <>
            <label htmlFor="generated-packet">Generated packet preview (editable)</label>
            <textarea
              id="generated-packet"
              rows={12}
              value={generatedPacketDraft}
              onChange={(event) => setGeneratedPacketDraft(event.target.value)}
            />
            <button type="button" disabled={isSubmitting} onClick={() => void submitGeneratedPacketDraft()}>
              Submit generated packet
            </button>
          </>
        ) : null}
      </section>

      <section className="response-panel">
        <h2>Response</h2>
        {!responseView ? <p>No response yet.</p> : null}
        {responseView ? (
          <>
            <p className={`status status-${responseView.type}`}>{responseView.type}</p>
            <p>{responseView.message}</p>
            {responseView.response ? (
              <div>
                <p>receipt_id: {responseView.response.receipt_id ?? "n/a"}</p>
                <p>trace_id: {responseView.response.trace_id ?? "n/a"}</p>
                <p>idempotency_key: {responseView.response.idempotency_key ?? "n/a"}</p>
                <p>intent_id: {responseView.response.intent_id}</p>
                {responseView.response.status === "executed" ? (
                  <p>notion_task_id: {String(responseView.response.details?.notion_task_id ?? "n/a")}</p>
                ) : null}
              </div>
            ) : null}
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
        open={Boolean(clarification)}
        clarification={clarification}
        onCancel={() => setClarification(null)}
        onSubmit={(answer) => {
          if (!clarification) {
            return;
          }
          setClarification(null);
          setIsSubmitting(true);
          void submitClarificationAnswer(clarification.clarification_id, answer)
            .then((response) => {
              const view = toResponseViewModel(response);
              setResponseView(view);
              if (view.type === "needs_clarification") {
                setClarification(view.clarification);
              }
            })
            .catch((error: unknown) => {
              setResponseView({
                type: "error",
                message: error instanceof Error ? error.message : "Clarification submission failed",
                response: {
                  status: "failed",
                  intent_id: "unknown",
                  correlation_id: "unknown",
                },
              });
            })
            .finally(() => {
              setIsSubmitting(false);
            });
        }}
      />
    </main>
  );
}

export default App;
