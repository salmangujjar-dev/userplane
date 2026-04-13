import type { App } from '@modelcontextprotocol/ext-apps';
import type { MouseEvent } from 'react';

import { ExternalLinkIcon, PlayIcon } from '../components/shared/icons';
import { formatDuration } from '../utils';

interface VideoPlayerProps {
  app: App;
  thumbnailDataUri: string | null;
  dashboardUrl: string;
  durationMs: number;
}

/**
 * Recording thumbnail poster with host-mediated navigation to the dashboard player.
 *
 * Inline video playback is blocked by Claude.ai's CSP (no connect-src/media-src
 * entries for external origins, ignoring the connectDomains/resourceDomains we
 * declare in _meta.ui.csp — anthropics/claude-ai-mcp#40, no fix timeline).
 *
 * To open the dashboard player we send a `ui/open-link` JSON-RPC request via
 * `app.openLink`. That's a host-mediated open (claude.ai opens the URL in the
 * user's default browser), so the iframe sandbox's missing `allow-popups` does
 * not apply. When the host doesn't advertise the `openLinks` capability we fall
 * back to the bare anchor so right-click → Open in new tab still works.
 *
 * Thumbnails are small (~50-100KB) and inlined as base64 data URIs in the tool
 * result so they render instantly without network requests. img-src allows data: URIs.
 */
export function VideoPlayer({ app, thumbnailDataUri, dashboardUrl, durationMs }: VideoPlayerProps) {
  const supportsOpenLink = app.getHostCapabilities()?.openLinks != null;

  const handleOpen = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!supportsOpenLink) return;
    e.preventDefault();
    void app.openLink({ url: dashboardUrl });
  };

  return (
    <div className="relative aspect-video bg-muted overflow-hidden">
      {/* Thumbnail */}
      {thumbnailDataUri && (
        <img
          src={thumbnailDataUri}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Center play button — only when host can open links for us */}
      {supportsOpenLink && (
        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleOpen}
          aria-label="Open recording in dashboard"
          className="absolute inset-0 flex items-center justify-center"
        >
          <span className="size-14 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors">
            <PlayIcon className="size-6 ml-0.5" />
          </span>
        </a>
      )}

      {/* Duration badge — bottom left */}
      <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
        {formatDuration(durationMs)}
      </span>

      {/* Open-in-dashboard pill — top right */}
      <a
        href={dashboardUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleOpen}
        className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-black/60 hover:bg-black/80 px-2.5 py-1.5 text-xs font-medium text-white transition-colors"
      >
        {supportsOpenLink ? 'Open in dashboard' : 'Right-click to open'}
        <ExternalLinkIcon className="size-3" />
      </a>
    </div>
  );
}
