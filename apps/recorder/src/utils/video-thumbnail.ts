/**
 * Video Thumbnail Utilities
 * Generate thumbnails from video blobs
 */

/**
 * Generate a thumbnail from a video blob
 */
export async function generateVideoThumbnail(blob: Blob, seekTime?: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    console.log('[VideoThumbnail] Generating thumbnail from blob');

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      console.log('[VideoThumbnail] Video metadata loaded');
      console.log('[VideoThumbnail] Video duration:', video.duration, 'seconds');
      console.log('[VideoThumbnail] Video dimensions:', video.videoWidth, 'x', video.videoHeight);

      const targetSeekTime = seekTime ?? Math.min(1, video.duration * 0.1);
      console.log('[VideoThumbnail] Seeking to:', targetSeekTime, 'seconds');
      video.currentTime = targetSeekTime;
    };

    video.onseeked = () => {
      console.log('[VideoThumbnail] Video seek completed');

      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error('[VideoThumbnail] Failed to get canvas context');
          cleanup();
          resolve(null);
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('[VideoThumbnail] Thumbnail generated, size:', blob.size, 'bytes');
              cleanup();
              resolve(blob);
            } else {
              console.error('[VideoThumbnail] Failed to create blob');
              cleanup();
              resolve(null);
            }
          },
          'image/jpeg',
          0.8
        );
      } catch (err) {
        console.error('[VideoThumbnail] Error generating thumbnail:', err);
        cleanup();
        resolve(null);
      }
    };

    video.onerror = (e) => {
      console.error('[VideoThumbnail] Failed to load video:', e);
      cleanup();
      resolve(null);
    };

    const objectUrl = URL.createObjectURL(blob);
    console.log('[VideoThumbnail] Created object URL for video');
    video.src = objectUrl;

    function cleanup() {
      URL.revokeObjectURL(video.src);
      console.log('[VideoThumbnail] Cleaned up object URL');
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
