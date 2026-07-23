import { api } from './api';

const SAMPLE_INTERVAL_MS = 15_000;
const MAX_WIDTH = 320;

// Periodically captures a downscaled JPEG of the local video element and sends
// it to the moderation endpoint. Returns a stop function. Failures are
// swallowed so moderation sampling never disrupts an active call.
export function startFrameSampling(video: HTMLVideoElement, sessionId: string): () => void {
  const canvas = document.createElement('canvas');

  const timer = window.setInterval(() => {
    if (video.readyState < 2 || video.videoWidth === 0) return;
    const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
    if (!frame) return;
    api('/moderation/frames', {
      method: 'POST',
      body: JSON.stringify({ sessionId, frame }),
    }).catch(() => undefined);
  }, SAMPLE_INTERVAL_MS);

  return () => window.clearInterval(timer);
}
