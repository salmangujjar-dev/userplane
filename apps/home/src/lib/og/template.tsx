// Satori JSX template for the Userplane OG card.
//
// Important satori constraints baked in:
// - Every container with >1 child must have display: 'flex'
// - No shorthand font: property — use fontFamily, fontWeight, fontSize individually
// - SVG is embedded inline (not via <img src="data:...">)  for maximum compatibility

import type { OgSource } from './sources';

// ── Colour tokens (match packages/ui/src/styles/globals.css OKLCH tokens) ───
const TEXT = '#0A0A0A'; // --foreground  oklch(0.145 0 0)
const MUTED = '#737373'; // --muted-foreground oklch(0.556 0 0)
const BORDER = '#E5E5E5'; // --border  oklch(0.922 0 0)

// Subtle light wash: white→near-white vertical gradient + soft blue radial
// on the right edge, matching the Mintlify reference.
const BG = [
  'radial-gradient(ellipse 80% 70% at 100% 50%, rgba(59,130,246,0.08) 0%, rgba(255,255,255,0) 60%)',
  'linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%)',
].join(', ');

// Full path from public/brand/logo-dark.svg — keep in sync with that file.
const LOGO_PATH =
  'M70.448 39.656C71.024 40.808 71.76 42.504 72.656 44.744C73.616 46.984 74.576 49.416 75.536 52.04C76.56 54.6 77.488 57.064 78.32 59.432C79.152 61.8 79.792 63.688 80.24 65.096L70.736 68.456C70.352 66.984 69.744 65.096 68.912 62.792C68.08 60.488 67.184 58.056 66.224 55.496C65.328 52.936 64.4 50.536 63.44 48.296C62.544 45.992 61.776 44.168 61.136 42.824L70.448 39.656ZM113.648 46.472C113.264 47.432 112.88 48.52 112.496 49.736C112.112 50.888 111.824 51.912 111.632 52.808C110.672 56.584 109.424 60.616 107.888 64.904C106.416 69.128 104.656 73.32 102.608 77.48C100.56 81.576 98.224 85.384 95.6 88.904C92.272 93.256 88.528 97.224 84.368 100.808C80.272 104.392 75.984 107.56 71.504 110.312C67.024 113 62.48 115.144 57.872 116.744L49.52 108.296C54 106.952 58.512 105.128 63.056 102.824C67.6 100.456 71.952 97.608 76.112 94.28C80.336 90.952 84.048 87.24 87.248 83.144C89.744 79.944 92.016 76.168 94.064 71.816C96.112 67.464 97.84 62.824 99.248 57.896C100.72 52.968 101.776 48.104 102.416 43.304L113.648 46.472ZM43.76 45.512C44.4 46.92 45.232 48.776 46.256 51.08C47.28 53.384 48.304 55.88 49.328 58.568C50.416 61.192 51.44 63.72 52.4 66.152C53.36 68.52 54.128 70.504 54.704 72.104L45.008 75.656C44.624 74.44 44.08 72.904 43.376 71.048C42.736 69.128 41.968 67.112 41.072 65C40.24 62.824 39.376 60.68 38.48 58.568C37.584 56.456 36.752 54.568 35.984 52.904C35.216 51.176 34.608 49.864 34.16 48.968L43.76 45.512Z';

export function OgTemplate(source: OgSource) {
  // Truncate subtitle to ~2 lines worth of text as a JS-level safety net,
  // in addition to the CSS line-clamp.
  const subtitle =
    source.subtitle.length > 140 ? `${source.subtitle.slice(0, 137)}…` : source.subtitle;

  return (
    <div
      style={{
        width: '1200px',
        height: '630px',
        padding: '80px',
        display: 'flex',
        flexDirection: 'column',
        background: BG,
        fontFamily: 'Geist',
        color: TEXT,
        position: 'relative',
      }}
    >
      {/* ── Top-left brand ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Inline SVG avoids data URL compatibility quirks */}
        <svg width={52} height={52} viewBox="0 0 144 144" fill="none">
          <rect width="144" height="144" rx="40" fill="black" />
          <path d={LOGO_PATH} fill="white" />
        </svg>
        <span
          style={{
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: TEXT,
          }}
        >
          Userplane
        </span>
      </div>

      {/* ── Spacer pushes content to the bottom half ── */}
      <div style={{ flex: 1, display: 'flex' }} />

      {/* ── Eyebrow label ── */}
      <div
        style={{
          display: 'flex',
          fontSize: 24,
          fontWeight: 600,
          color: MUTED,
          marginBottom: 16,
          letterSpacing: '-0.01em',
        }}
      >
        {source.eyebrow}
      </div>

      {/* ── Headline ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          fontSize: 68,
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.035em',
          color: TEXT,
          marginBottom: 24,
          maxWidth: 1040,
        }}
      >
        {source.title}
      </div>

      {/* ── Subtitle ── */}
      <div
        style={{
          display: 'flex',
          fontSize: 26,
          fontWeight: 400,
          lineHeight: 1.45,
          color: MUTED,
          maxWidth: 940,
          overflow: 'hidden',
          maxHeight: '80px',
        }}
      >
        {subtitle}
      </div>

      {/* ── Bottom accent line ── */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 4,
          background: BORDER,
        }}
      />
    </div>
  );
}
