import { ExternalLinkIcon } from '../shared/icons';
import { formatDuration } from '../shared/utils';

interface VideoPlayerProps {
  thumbnailDataUri: string | null;
  dashboardUrl: string;
  durationMs: number;
}

/**
 * Recording thumbnail poster with a right-click link to the dashboard player.
 *
 * Video is NOT played inline because Claude.ai's CSP blocks all external origins
 * in connect-src, img-src, and media-src — ignoring the connectDomains/resourceDomains
 * we declare in _meta.ui.csp (anthropics/claude-ai-mcp#40, no fix timeline).
 * The sandbox also blocks popups (allow-popups not set) so window.open() and
 * app.openLink() don't work either. The user must right-click → Open in new tab.
 *
 * Thumbnails are small (~50-100KB) and inlined as base64 data URIs in the tool result
 * so they render instantly without network requests. img-src allows data: URIs.
 */
export function VideoPlayer({ thumbnailDataUri, dashboardUrl, durationMs }: VideoPlayerProps) {
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

      {/* Duration badge — bottom left */}
      <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
        {formatDuration(durationMs)}
      </span>

      {/* Right-click to open — top right */}
      <a
        href={dashboardUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.preventDefault()}
        className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-black/60 hover:bg-black/80 px-2.5 py-1.5 text-xs font-medium text-white transition-colors"
      >
        Right-click to open
        <ExternalLinkIcon className="size-3" />
      </a>
    </div>
  );
}
