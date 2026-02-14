/**
 * Video Thumbnail Utilities
 * Generate thumbnails from video blobs
 */

import { posthog } from '@/posthog/client';

/**
 * Generate a thumbnail from a video blob
 */
export async function generateVideoThumbnail(blob: Blob, seekTime?: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      const targetSeekTime = seekTime ?? Math.min(1, video.duration * 0.1);
      video.currentTime = targetSeekTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          posthog.capture('thumbnail_generation_failed', {
            reason: 'canvas_context_unavailable',
          });

          cleanup();
          resolve(null);
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              cleanup();
              resolve(blob);
            } else {
              posthog.capture('thumbnail_generation_failed', {
                reason: 'blob_creation_failed',
                video_width: video.videoWidth,
                video_height: video.videoHeight,
              });

              cleanup();
              resolve(null);
            }
          },
          'image/webp',
          0.85
        );
      } catch (err) {
        posthog.captureException(err, {
          error_type: 'thumbnail_generation_error',
          error_source: 'video_thumbnail',
          video_duration: video.duration,
          video_width: video.videoWidth,
          video_height: video.videoHeight,
          seek_time: seekTime,
        });

        cleanup();
        resolve(null);
      }
    };

    video.onerror = () => {
      posthog.capture('thumbnail_generation_failed', {
        reason: 'video_load_failed',
        blob_size: blob.size,
        blob_type: blob.type,
      });

      cleanup();
      resolve(null);
    };

    const objectUrl = URL.createObjectURL(blob);
    video.src = objectUrl;

    function cleanup() {
      URL.revokeObjectURL(video.src);
    }
  });
}

/**
 * Convert blob to data URL for preview
 */
export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
