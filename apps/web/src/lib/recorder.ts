export type RecorderController = {
  start: () => Promise<void>;
  stop: () => void;
};

export function createRecorder(onBlob: (blob: Blob) => void): RecorderController {
  let mediaRecorder: MediaRecorder | null = null;
  let stream: MediaStream | null = null;

  return {
    async start() {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        throw new Error('MediaRecorder is not supported in this browser');
      }

      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: BlobPart[] = [];
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        onBlob(new Blob(chunks, { type: 'audio/webm' }));
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      };
      mediaRecorder.start();
    },
    stop() {
      mediaRecorder?.stop();
    },
  };
}
