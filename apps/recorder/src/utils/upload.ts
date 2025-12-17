/**
 * Upload Utilities
 * Generic object storage upload functions with progress tracking and retries
 */

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  /** Upload timeout in milliseconds (default: 300000 = 5 minutes) */
  timeout?: number;
  /** Progress callback */
  onProgress?: (progress: UploadProgress) => void;
  /** Number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  retryDelay?: number;
}

export interface UploadResult {
  success: boolean;
  status?: number;
  statusText?: string;
}

/**
 * Upload a file to an object store using a presigned URL
 * Supports progress tracking, timeouts, and automatic retries with exponential backoff
 */
export async function uploadToObjectStore(
  file: File,
  presignedUrl: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    timeout = 300000, // 5 minutes
    onProgress,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await uploadWithProgress(file, presignedUrl, timeout, onProgress);
      return result;
    } catch (error) {
      lastError = error as Error;
      console.warn(`[Upload] Attempt ${attempt}/${maxRetries} failed:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s, etc.
        const delay = Math.pow(2, attempt - 1) * retryDelay;
        console.log(`[Upload] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Upload failed after all retries');
}

/**
 * Internal upload function with XMLHttpRequest for progress tracking
 */
function uploadWithProgress(
  file: File,
  url: string,
  timeout: number,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Timeout handling
    const timeoutId = setTimeout(() => {
      xhr.abort();
      reject(new Error('Upload timed out'));
    }, timeout);

    // Progress tracking
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    });

    xhr.addEventListener('load', () => {
      clearTimeout(timeoutId);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          success: true,
          status: xhr.status,
          statusText: xhr.statusText,
        });
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      clearTimeout(timeoutId);
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Upload aborted'));
    });

    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate total upload progress across multiple files
 */
export function calculateTotalProgress(
  fileProgresses: Map<string, UploadProgress>,
  fileSizes: Map<string, number>
): UploadProgress {
  let totalLoaded = 0;
  let totalSize = 0;

  for (const [fileId, size] of fileSizes) {
    totalSize += size;
    const progress = fileProgresses.get(fileId);
    if (progress) {
      totalLoaded += progress.loaded;
    }
  }

  return {
    loaded: totalLoaded,
    total: totalSize,
    percentage: totalSize > 0 ? Math.round((totalLoaded / totalSize) * 100) : 0,
  };
}
