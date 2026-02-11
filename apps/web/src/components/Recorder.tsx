import { useMemo, useRef, useState } from "react";

type Props = {
  onRecorded: (blob: Blob) => void;
};

export function Recorder({ onRecorded }: Props) {
  const [supported] = useState(() => "MediaRecorder" in window);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const mimeType = useMemo(() => {
    const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
    return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
  }, []);

  async function start() {
    setError(null);
    if (!supported) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        onRecorded(blob);
      };

      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not start recording");
    }
  }

  function stop() {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.stop();
    setRecording(false);
  }

  if (!supported) return <div>Recording not supported in this browser.</div>;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {!recording ? <button onClick={start}>Record</button> : <button onClick={stop}>Stop</button>}
      {error ? <span style={{ color: "crimson" }}>{error}</span> : null}
    </div>
  );
}
