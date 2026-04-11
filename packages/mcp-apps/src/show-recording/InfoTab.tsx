import { useState } from 'react';

import { Avatar, InfoRow, InfoSection, JsonTree } from '../components';
import {
  AppWindowIcon,
  CalendarIcon,
  ClockIcon,
  CodeIcon,
  ExternalLinkIcon,
  FolderOpenIcon,
  GlobeIcon,
  LanguagesIcon,
  Link2Icon,
  MapPinIcon,
  MonitorIcon,
  PlugIcon,
  SquareArrowOutUpRightIcon,
  StickyNoteIcon,
  TagsIcon,
  UserIcon,
} from '../components/icons';
import type { RecordingDetail, RecordingMeta } from '../recording/types';
import { formatDate, isValidUrl } from '../utils';

interface InfoTabProps {
  recording: RecordingDetail;
}

export function InfoTab({ recording }: InfoTabProps) {
  const { meta } = recording;
  const hasSystemMeta = meta.systemMeta && Object.keys(meta.systemMeta).length > 0;
  const hasCustomMeta = meta.customMeta && Object.keys(meta.customMeta).length > 0;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <AboutSection meta={meta} />
      {meta.notes && <NotesSection notes={meta.notes} />}
      <IntegrationSection meta={meta} />
      {hasSystemMeta && <SystemSection systemMeta={meta.systemMeta!} />}
      {hasCustomMeta && <CustomMetadataSection customMeta={meta.customMeta!} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

function AboutSection({ meta }: { meta: RecordingMeta }) {
  return (
    <InfoSection title="About" bordered={false}>
      <InfoRow icon={Link2Icon} label="Link Title">
        <span className="font-medium">{meta.link.title || 'Untitled'}</span>
      </InfoRow>

      {meta.project.title && (
        <InfoRow icon={FolderOpenIcon} label="Project">
          <span className="font-medium">{meta.project.title}</span>
        </InfoRow>
      )}

      <InfoRow icon={GlobeIcon} label="Domain">
        <span className="font-medium truncate">{meta.domain.url}</span>
      </InfoRow>

      <InfoRow icon={UserIcon} label="Requested By">
        <div className="flex items-center gap-2">
          <Avatar size="xs" name={meta.creator.name} />
          <span className="font-medium">{meta.creator.name}</span>
        </div>
      </InfoRow>

      <InfoRow icon={CalendarIcon} label="Requested At">
        <span className="font-medium">{formatDate(meta.createdAt)}</span>
      </InfoRow>

      <InfoRow icon={ClockIcon} label="Expires At">
        <span className="font-medium">
          {meta.expiresAt ? formatDate(meta.expiresAt) : 'No expiration'}
        </span>
      </InfoRow>
    </InfoSection>
  );
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

function NotesSection({ notes }: { notes: string }) {
  return (
    <InfoSection title="Notes">
      <InfoRow icon={StickyNoteIcon} label="Customer Note" align="start">
        <p className="text-sm font-medium whitespace-pre-wrap">{notes}</p>
      </InfoRow>
    </InfoSection>
  );
}

// ---------------------------------------------------------------------------
// Integration
// ---------------------------------------------------------------------------

function IntegrationSection({ meta }: { meta: RecordingMeta }) {
  const { link } = meta;
  if (!link.providerType) return null;

  const data: Record<string, unknown> = {
    ...(link.providerId ? { providerId: link.providerId } : {}),
    ...(link.providerData ?? {}),
  };
  const hasData = Object.keys(data).length > 0;

  return (
    <InfoSection title="Integration">
      <InfoRow icon={PlugIcon} label="Name">
        <span className="font-medium capitalize">{link.providerType}</span>
      </InfoRow>

      {link.providerRef && (
        <InfoRow icon={ExternalLinkIcon} label="Reference">
          {isValidUrl(link.providerRef) || link.providerRef.startsWith('slack://') ? (
            <a
              href={link.providerRef}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline truncate"
            >
              {link.providerRef}
            </a>
          ) : (
            <span className="font-medium truncate">{link.providerRef}</span>
          )}
        </InfoRow>
      )}

      {hasData && <JsonDataRow icon={CodeIcon} label="Data" title="Integration Data" data={data} />}
    </InfoSection>
  );
}

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

function parseSystemMeta(raw: Record<string, unknown>) {
  return {
    os: raw.os ? String(raw.os) : null,
    osVersion: raw.osVersion ? String(raw.osVersion) : null,
    browser: raw.browser ? String(raw.browser) : null,
    browserVersion: raw.browserVersion ? String(raw.browserVersion) : null,
    date: raw.date ? String(raw.date) : null,
    time: raw.time ? String(raw.time) : null,
    timezone: raw.timezone ? String(raw.timezone) : null,
    language: raw.language ? String(raw.language) : null,
    screenSize: raw.screenSize ? String(raw.screenSize) : null,
    windowSize: raw.windowSize ? String(raw.windowSize) : null,
  };
}

function SystemSection({ systemMeta }: { systemMeta: Record<string, unknown> }) {
  const sys = parseSystemMeta(systemMeta);

  return (
    <InfoSection title="System">
      {sys.os && (
        <InfoRow icon={MonitorIcon} label="OS">
          <span className="font-medium">
            {sys.os}
            {sys.osVersion ? ` ${sys.osVersion}` : ''}
          </span>
        </InfoRow>
      )}

      {sys.browser && (
        <InfoRow icon={GlobeIcon} label="Browser">
          <span className="font-medium">
            {sys.browser}
            {sys.browserVersion ? ` ${sys.browserVersion}` : ''}
          </span>
        </InfoRow>
      )}

      {(sys.date || sys.time) && (
        <InfoRow icon={CalendarIcon} label="Captured At">
          <span className="font-medium">{[sys.date, sys.time].filter(Boolean).join(' ')}</span>
        </InfoRow>
      )}

      {sys.timezone && (
        <InfoRow icon={MapPinIcon} label="Timezone">
          <span className="font-medium">{sys.timezone}</span>
        </InfoRow>
      )}

      {sys.language && (
        <InfoRow icon={LanguagesIcon} label="Language">
          <span className="font-medium">{sys.language}</span>
        </InfoRow>
      )}

      {sys.screenSize && (
        <InfoRow icon={MonitorIcon} label="Screen Size">
          <span className="font-medium">{sys.screenSize}</span>
        </InfoRow>
      )}

      {sys.windowSize && (
        <InfoRow icon={AppWindowIcon} label="Window Size">
          <span className="font-medium">{sys.windowSize}</span>
        </InfoRow>
      )}

      <JsonDataRow icon={CodeIcon} label="System Data" title="System Data" data={systemMeta} />
    </InfoSection>
  );
}

// ---------------------------------------------------------------------------
// Custom Metadata
// ---------------------------------------------------------------------------

function CustomMetadataSection({ customMeta }: { customMeta: Record<string, unknown> }) {
  return (
    <InfoSection title="Custom Metadata">
      <JsonDataRow icon={TagsIcon} label="Data" title="Custom Metadata" data={customMeta} />
    </InfoSection>
  );
}

// ---------------------------------------------------------------------------
// Expandable JSON row (replaces dash's modal-based JsonViewer)
// ---------------------------------------------------------------------------

function JsonDataRow({
  icon,
  label,
  title,
  data,
}: {
  icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactNode;
  label: string;
  title: string;
  data: Record<string, unknown>;
}) {
  const [expanded, setExpanded] = useState(false);
  const count = Object.keys(data).length;

  return (
    <div>
      <InfoRow icon={icon} label={label}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-primary hover:underline text-left cursor-pointer"
        >
          <SquareArrowOutUpRightIcon className="size-3.5" />
          <span>
            {count} {count === 1 ? 'key' : 'keys'}
          </span>
        </button>
      </InfoRow>
      {expanded && (
        <div className="mt-2 ml-[156px] rounded-lg border bg-muted/30 p-3 max-h-60 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground mb-2">{title}</p>
          <JsonTree data={data} defaultExpanded />
        </div>
      )}
    </div>
  );
}
