export function TranscriptPanel(props: {
  transcript: string;
  setTranscript: (v: string) => void;
  busy?: boolean;
}) {
  const { transcript, setTranscript, busy } = props;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label>
        Transcript (editable)
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={6}
          placeholder={busy ? "Transcribing..." : "Transcript will appear here"}
          disabled={busy}
          style={{ width: "100%" }}
        />
      </label>
    </div>
  );
}
