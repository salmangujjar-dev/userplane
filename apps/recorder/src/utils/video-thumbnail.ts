/**
 * Video Thumbnail Utilities
 * Generate thumbnails from video blobs
 */

import * as Sentry from '@sentry/astro';

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
          // Capture canvas context failure - rare browser issue
          Sentry.captureMessage('Failed to get 2D canvas context for thumbnail', {
            level: 'warning',
            tags: {
              error_type: 'thumbnail_canvas_context_failed',
              error_source: 'video_thumbnail',
            },
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
              // Capture blob creation failure
              Sentry.captureMessage('Failed to create thumbnail blob from canvas', {
                level: 'warning',
                tags: {
                  error_type: 'thumbnail_blob_creation_failed',
                  error_source: 'video_thumbnail',
                },
                contexts: {
                  thumbnail: {
                    video_width: video.videoWidth,
                    video_height: video.videoHeight,
                  },
                },
              });

              cleanup();
              resolve(null);
            }
          },
          'image/webp',
          0.85
        );
      } catch (err) {
        // Capture general thumbnail generation errors
        Sentry.captureException(err, {
          level: 'warning',
          tags: {
            error_type: 'thumbnail_generation_error',
            error_source: 'video_thumbnail',
          },
          contexts: {
            thumbnail: {
              video_duration: video.duration,
              video_width: video.videoWidth,
              video_height: video.videoHeight,
              seek_time: seekTime,
            },
          },
        });

        cleanup();
        resolve(null);
      }
    };

    video.onerror = () => {
      // Capture video load failures for thumbnail
      Sentry.captureMessage('Failed to load video for thumbnail generation', {
        level: 'warning',
        tags: {
          error_type: 'thumbnail_video_load_failed',
          error_source: 'video_thumbnail',
        },
        contexts: {
          video: {
            blob_size: blob.size,
            blob_type: blob.type,
          },
        },
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
