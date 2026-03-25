import {
  extractHostname,
  extractUrlFromString,
  getFaviconUrl,
  isValidUrl,
} from '@userplane/contract';

export { extractHostname, extractUrlFromString, getFaviconUrl, isValidUrl };

export function checkIfDefaultFavicon(
  hostname: string,
  requestedSize: number = 64
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = getFaviconUrl(hostname, requestedSize);

    img.onload = function () {
      const naturalWidth = (this as HTMLImageElement).naturalWidth;
      const naturalHeight = (this as HTMLImageElement).naturalHeight;

      if (naturalWidth === 16 && naturalHeight === 16 && requestedSize > 16) {
        resolve(true);
      } else if (naturalWidth <= 1 || naturalHeight <= 1) {
        resolve(true);
      } else {
        resolve(false);
      }
    };

    img.onerror = function () {
      resolve(true);
    };
  });
}

export async function getFaviconForUrl(text: string): Promise<string | null> {
  const extractedUrl = extractUrlFromString(text);
  if (!extractedUrl || !isValidUrl(extractedUrl)) {
    return null;
  }

  const hostname = extractHostname(extractedUrl);
  if (!hostname) {
    return null;
  }

  const isDefault = await checkIfDefaultFavicon(hostname, 64);
  if (isDefault) {
    return null;
  }

  return getFaviconUrl(hostname, 64);
}
