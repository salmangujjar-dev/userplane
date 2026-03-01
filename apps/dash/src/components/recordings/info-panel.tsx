'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import { JsonViewer } from '@userplane/ui/components/json-viewer';
import Logo from '@userplane/ui/components/logo';
import { format } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
  AppWindow,
  Calendar,
  Clock,
  Code,
  ExternalLink,
  FolderOpen,
  Globe,
  Languages,
  Link2,
  MapPin,
  Monitor,
  Plug,
  SquareArrowOutUpRight,
  StickyNote,
  Tags,
  User,
} from 'lucide-react';
import { useState } from 'react';

import { isValidUrl } from '@/lib/urls';
import type { RecordingDetail, RecordingDetailMeta } from '@/types';

import { AVATAR_SIZES, BoringAvatar } from '../shared/boring-avatar';

// ---------------------------------------------------------------------------
// Shared types -- derived from contract schemas
// ---------------------------------------------------------------------------

type RecordingMeta = RecordingDetailMeta;

interface InfoPanelProps {
  recording: RecordingDetail;
}

// ---------------------------------------------------------------------------
// Primitives -- reusable row and section wrappers
// ---------------------------------------------------------------------------

/** Single label/value row with an optional leading icon. */
function InfoRow({
  icon: Icon,
  label,
  children,
  align = 'center',
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  align?: 'center' | 'start';
}) {
  return (
    <div
      className={`grid grid-cols-[140px_1fr] gap-4 text-sm ${align === 'start' ? 'items-start' : ''}`}
    >
      <span className="text-muted-foreground flex items-center gap-1.5">
        <Icon className="size-3.5" />
        {label}
      </span>
      {children}
    </div>
  );
}

/** Bordered section with a heading. The first section omits the top border. */
function InfoSection({
  title,
  bordered = true,
  children,
}: {
  title: string;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={bordered ? 'border-t pt-6' : undefined}>
      <h3 className="text-sm font-semibold mb-4">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

/** Clickable JSON row that opens a modal with the full expanded JSON viewer. */
function JsonDataRow({
  icon,
  label,
  title,
  subtitle,
  data,
}: {
  icon: LucideIcon;
  label: string;
  title: string;
  subtitle: string;
  data: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const count = Object.keys(data).length;

  return (
    <>
      <InfoRow icon={icon} label={label}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-primary hover:underline text-left"
        >
          <SquareArrowOutUpRight className="size-3.5" />
          <span>
            {count} {count === 1 ? 'key' : 'keys'}
          </span>
        </button>
      </InfoRow>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col" showCloseButton={false}>
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {subtitle}
              </DialogDescription>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <JsonViewer data={data} rootName="" defaultExpanded={true} className="text-xs" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Section components
// ---------------------------------------------------------------------------

function AboutSection({ meta }: { meta: RecordingMeta }) {
  return (
    <InfoSection title="About" bordered={false}>
      <InfoRow icon={Link2} label="Link Title">
        <span className="font-medium">{meta.link.title || 'Untitled'}</span>
      </InfoRow>

      {meta.project.title && (
        <InfoRow icon={FolderOpen} label="Project">
          <span className="font-medium">{meta.project.title}</span>
        </InfoRow>
      )}

      <InfoRow icon={Globe} label="Domain">
        <span className="font-medium truncate">{meta.domain.url}</span>
      </InfoRow>

      <InfoRow icon={User} label="Requested By">
        <div className="flex items-center gap-2">
          <BoringAvatar size={AVATAR_SIZES.INLINE} name={meta.creator.name} />
          <span className="font-medium">{meta.creator.name}</span>
        </div>
      </InfoRow>

      <InfoRow icon={Calendar} label="Requested At">
        <span className="font-medium">{format(meta.createdAt, 'MMM dd, yyyy HH:mm:ss')}</span>
      </InfoRow>

      <InfoRow icon={Clock} label="Expires At">
        <span className="font-medium">
          {meta.expiresAt ? format(meta.expiresAt, 'MMM dd, yyyy HH:mm:ss') : 'No expiration'}
        </span>
      </InfoRow>
    </InfoSection>
  );
}

function NotesSection({ notes }: { notes: string }) {
  return (
    <InfoSection title="Notes">
      <InfoRow icon={StickyNote} label="Customer Note">
        <p className="text-sm font-medium whitespace-pre-wrap">{notes}</p>
      </InfoRow>
    </InfoSection>
  );
}

function IntegrationSection({ link }: { link: RecordingMeta['link'] }) {
  if (!link.providerType) return null;

  // Merge providerId into providerData for the Data JSON viewer
  const data: Record<string, unknown> = {
    ...(link.providerId ? { providerId: link.providerId } : {}),
    ...(link.providerData ?? {}),
  };
  const hasData = Object.keys(data).length > 0;

  return (
    <InfoSection title="Integration">
      <InfoRow icon={Plug} label="Name">
        <span className="font-medium capitalize">{link.providerType}</span>
      </InfoRow>

      {link.providerRef && (
        <InfoRow icon={ExternalLink} label="Reference">
          {isValidUrl(link.providerRef) ? (
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

      {hasData && (
        <JsonDataRow
          icon={Code}
          label="Data"
          title="Integration Data"
          subtitle="Provider identifiers and metadata from the integration"
          data={data}
        />
      )}
    </InfoSection>
  );
}

/** Extract known keys from the raw record into typed strings. */
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
        <InfoRow icon={Monitor} label="OS">
          <span className="font-medium">
            {sys.os}
            {sys.osVersion ? ` ${sys.osVersion}` : ''}
          </span>
        </InfoRow>
      )}

      {sys.browser && (
        <InfoRow icon={Globe} label="Browser">
          <span className="font-medium">
            {sys.browser}
            {sys.browserVersion ? ` ${sys.browserVersion}` : ''}
          </span>
        </InfoRow>
      )}

      {(sys.date || sys.time) && (
        <InfoRow icon={Calendar} label="Captured At">
          <span className="font-medium">{[sys.date, sys.time].filter(Boolean).join(' ')}</span>
        </InfoRow>
      )}

      {sys.timezone && (
        <InfoRow icon={MapPin} label="Timezone">
          <span className="font-medium">{sys.timezone}</span>
        </InfoRow>
      )}

      {sys.language && (
        <InfoRow icon={Languages} label="Language">
          <span className="font-medium">{sys.language}</span>
        </InfoRow>
      )}

      {sys.screenSize && (
        <InfoRow icon={Monitor} label="Screen Size">
          <span className="font-medium">{sys.screenSize}</span>
        </InfoRow>
      )}

      {sys.windowSize && (
        <InfoRow icon={AppWindow} label="Window Size">
          <span className="font-medium">{sys.windowSize}</span>
        </InfoRow>
      )}

      <JsonDataRow
        icon={Code}
        label="System Data"
        title="System Data"
        subtitle="Raw system metadata captured during the recording session"
        data={systemMeta}
      />
    </InfoSection>
  );
}

function CustomMetadataSection({ customMeta }: { customMeta: Record<string, unknown> }) {
  return (
    <InfoSection title="Custom Metadata">
      <JsonDataRow
        icon={Tags}
        label="Data"
        title="Custom Metadata"
        subtitle="Custom key-value pairs attached to this recording"
        data={customMeta}
      />
    </InfoSection>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function InfoPanel({ recording }: InfoPanelProps) {
  const { meta } = recording;
  const systemMeta = meta.systemMeta;
  const hasSystemMeta = systemMeta && Object.keys(systemMeta).length > 0;
  const hasCustomMeta = meta.customMeta && Object.keys(meta.customMeta).length > 0;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <AboutSection meta={meta} />
      {meta.notes && <NotesSection notes={meta.notes} />}
      <IntegrationSection link={meta.link} />
      {hasSystemMeta && <SystemSection systemMeta={systemMeta} />}
      {hasCustomMeta && <CustomMetadataSection customMeta={meta.customMeta!} />}
    </div>
  );
}
