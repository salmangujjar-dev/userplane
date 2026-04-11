/**
 * Inline SVG icon components matching lucide-react icons used in the dashboard.
 * Avoids bundling the full lucide library to keep the single-file HTML small.
 *
 * All icons use the same base props: className, size defaults to 16.
 */

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function icon(d: string, opts?: { fill?: boolean; strokeWidth?: string }) {
  return function Icon(props: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={opts?.fill ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={opts?.strokeWidth ?? '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
        width="16"
        height="16"
        {...props}
      >
        <path d={d} />
      </svg>
    );
  };
}

function multiPathIcon(...paths: Array<{ d: string; fill?: boolean }>) {
  return function Icon(props: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="16"
        height="16"
        {...props}
      >
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill ? 'currentColor' : 'none'} />
        ))}
      </svg>
    );
  };
}

// ---------------------------------------------------------------------------
// Info panel icons
// ---------------------------------------------------------------------------

export const Link2Icon = multiPathIcon(
  { d: 'M9 17H7A5 5 0 0 1 7 7h2' },
  { d: 'M15 7h2a5 5 0 1 1 0 10h-2' },
  { d: 'M8 12h8' }
);

export const FolderOpenIcon = multiPathIcon(
  {
    d: 'M2 19V9a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z',
  },
  { d: 'M2 10l3.22-5.15A2 2 0 0 1 6.91 4H17.1a2 2 0 0 1 1.69.85L22 10' }
);

export const GlobeIcon = multiPathIcon(
  { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { d: 'M2 12h20' },
  {
    d: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  }
);

export const UserIcon = multiPathIcon(
  { d: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2' },
  { d: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' }
);

export const CalendarIcon = multiPathIcon(
  { d: 'M8 2v4' },
  { d: 'M16 2v4' },
  { d: 'M3 10h18' },
  { d: 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' }
);

export const ClockIcon = multiPathIcon(
  { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { d: 'M12 6v6l4 2' }
);

export const StickyNoteIcon = multiPathIcon(
  { d: 'M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8z' },
  { d: 'M15 3v4a2 2 0 0 0 2 2h4' }
);

export const PlugIcon = multiPathIcon(
  { d: 'M12 22v-5' },
  { d: 'M9 8V2' },
  { d: 'M15 8V2' },
  { d: 'M18 8v5a6 6 0 0 1-12 0V8z' }
);

export const ExternalLinkIcon = multiPathIcon(
  { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' },
  { d: 'M15 3h6v6' },
  { d: 'M10 14L21 3' }
);

export const CodeIcon = multiPathIcon({ d: 'M16 18l6-6-6-6' }, { d: 'M8 6l-6 6 6 6' });

export const MonitorIcon = multiPathIcon(
  { d: 'M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z' },
  { d: 'M8 21h8' },
  { d: 'M12 17v4' }
);

export const LanguagesIcon = multiPathIcon(
  { d: 'M5 8l6 6' },
  { d: 'M4 14l6-6 2-3' },
  { d: 'M2 5h12' },
  { d: 'M7 2h1' },
  { d: 'M22 22l-5-10-5 10' },
  { d: 'M14 18h6' }
);

export const AppWindowIcon = multiPathIcon(
  { d: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
  { d: 'M2 9h20' }
);

export const TagsIcon = multiPathIcon(
  { d: 'M9 5H2v7l6.29 6.29c.94.94 2.48.94 3.42 0l3.58-3.58c.94-.94.94-2.48 0-3.42L9 5Z' },
  { d: 'M6 9.01V9' },
  { d: 'M15 5s2-2 4 0 4 4 0 4' }
);

export const MapPinIcon = multiPathIcon(
  { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z' },
  { d: 'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' }
);

export const SquareArrowOutUpRightIcon = multiPathIcon(
  { d: 'M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6' },
  { d: 'M21 3l-9 9' },
  { d: 'M15 3h6v6' }
);

// ---------------------------------------------------------------------------
// Console panel icons
// ---------------------------------------------------------------------------

export const AlertCircleIcon = multiPathIcon(
  { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { d: 'M12 8v4' },
  { d: 'M12 16h.01' }
);

export const AlertTriangleIcon = multiPathIcon(
  { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
  { d: 'M12 9v4' },
  { d: 'M12 17h.01' }
);

export const InfoIcon = multiPathIcon(
  { d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z' },
  { d: 'M12 16v-4' },
  { d: 'M12 8h.01' }
);

export const MessageSquareIcon = multiPathIcon({
  d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
});

export const BugIcon = multiPathIcon(
  { d: 'M8 2l1.88 1.88' },
  { d: 'M14.12 3.88L16 2' },
  { d: 'M9 7.13v-1a3.003 3.003 0 1 1 6 0v1' },
  { d: 'M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6z' },
  { d: 'M12 20v-9' },
  { d: 'M6.53 9C4.6 8.8 3 7.1 3 5' },
  { d: 'M6 13H2' },
  { d: 'M3 21c0-2.1 1.7-3.9 3.8-4' },
  { d: 'M20.97 5c0 2.1-1.6 3.8-3.5 4' },
  { d: 'M22 13h-4' },
  { d: 'M17.2 17c2.1.1 3.8 1.9 3.8 4' }
);

export const ChevronDownIcon = icon('M6 9l6 6 6-6');

export const ChevronRightIcon = icon('M9 18l6-6-6-6');

// ---------------------------------------------------------------------------
// Network panel icons
// ---------------------------------------------------------------------------

export const CableIcon = multiPathIcon(
  { d: 'M17 21v-2a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1' },
  { d: 'M13 21H7a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1z' },
  { d: 'M12 15V5' },
  { d: 'M18 15V5' },
  { d: 'M9 5a3 3 0 0 1 6 0' },
  { d: 'M15 5a3 3 0 0 1 6 0' }
);

export const FileCodeIcon = multiPathIcon(
  { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' },
  { d: 'M14 2v6h6' },
  { d: 'M10 13l-2 2 2 2' },
  { d: 'M14 17l2-2-2-2' }
);

export const FileTextIcon = multiPathIcon(
  { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' },
  { d: 'M14 2v6h6' },
  { d: 'M16 13H8' },
  { d: 'M16 17H8' },
  { d: 'M10 9H8' }
);

export const FileVideoIcon = multiPathIcon(
  { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' },
  { d: 'M14 2v6h6' },
  { d: 'M10 11l5 3-5 3v-6z' }
);

export const FileTypeIcon = multiPathIcon(
  { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' },
  { d: 'M14 2v6h6' },
  { d: 'M9 13v-1h6v1' },
  { d: 'M12 12v6' },
  { d: 'M11 18h2' }
);

export const FileJsonIcon = multiPathIcon(
  { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' },
  { d: 'M14 2v6h6' },
  { d: 'M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1' },
  { d: 'M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1' }
);

export const FileIcon = multiPathIcon(
  { d: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' },
  { d: 'M14 2v6h6' }
);

export const FilterIcon = multiPathIcon({ d: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z' });

// ---------------------------------------------------------------------------
// Actions panel icons
// ---------------------------------------------------------------------------

export const MousePointer2Icon = icon('M4 4l7.07 17 2.51-7.39L21 11.07z', { fill: false });

export const ArrowRightIcon = multiPathIcon({ d: 'M5 12h14' }, { d: 'M12 5l7 7-7 7' });

export const EyeIcon = multiPathIcon(
  { d: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' },
  { d: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z' }
);

export const EyeOffIcon = multiPathIcon(
  {
    d: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24',
  },
  { d: 'M1 1l22 22' }
);

export const LogInIcon = multiPathIcon(
  { d: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4' },
  { d: 'M10 17l5-5-5-5' },
  { d: 'M15 12H3' }
);

export const LogOutIcon = multiPathIcon(
  { d: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' },
  { d: 'M16 17l5-5-5-5' },
  { d: 'M21 12H9' }
);

export const PlayIcon = icon('M5 3l14 9-14 9V3z', { fill: true });

export const PauseIcon = multiPathIcon({ d: 'M6 4h4v16H6z' }, { d: 'M14 4h4v16h-4z' });

export const RefreshCwIcon = multiPathIcon(
  { d: 'M21 2v6h-6' },
  { d: 'M3 12a9 9 0 0 1 15-6.7L21 8' },
  { d: 'M3 22v-6h6' },
  { d: 'M21 12a9 9 0 0 1-15 6.7L3 16' }
);

// ---------------------------------------------------------------------------
// General icons
// ---------------------------------------------------------------------------

export const VideoIcon = multiPathIcon({
  d: 'M2 4h16a2 2 0 0 1 2 2v1l2-1v10l-2-1v1a2 2 0 0 1-2 2H2V4z',
});

export const SearchIcon = multiPathIcon(
  { d: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z' },
  { d: 'M21 21l-4.35-4.35' }
);
