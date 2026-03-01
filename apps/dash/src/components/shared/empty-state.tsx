import { Button } from '@userplane/ui/components/button';
import { Plus } from 'lucide-react';

interface ListViewEmptyStateProps {
  subtitle: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
}

export function ListViewEmptyState({
  subtitle,
  buttonLabel,
  onButtonClick,
}: ListViewEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <p className="text-sm text-muted-foreground mb-2">{subtitle}</p>
      {buttonLabel && onButtonClick && (
        <Button
          onClick={onButtonClick}
          size="default"
          variant="ghost"
          className="border border-input"
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  );
}

function RecordingIllustration() {
  return (
    <div className="w-72 h-44 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-200 via-lime-200 to-yellow-200 p-4">
      <div className="bg-white rounded-lg shadow-sm h-full p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <div className="flex-1 h-2 bg-gray-100 rounded ml-2" />
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-100 to-lime-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-gray-200 rounded w-3/4" />
              <div className="h-1.5 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="w-12 h-6 bg-gray-100 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-lime-100 to-yellow-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-lime-500" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
              </svg>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-gray-200 rounded w-2/3" />
              <div className="h-1.5 bg-gray-100 rounded w-2/5" />
            </div>
            <div className="w-12 h-6 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkIllustration() {
  return (
    <div className="w-72 h-44 rounded-xl overflow-hidden bg-gradient-to-br from-blue-200 via-indigo-200 to-violet-200 p-4">
      <div className="bg-white rounded-lg shadow-sm h-full p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <div className="flex-1 h-2 bg-gray-100 rounded ml-2" />
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-blue-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-gray-200 rounded w-3/4" />
              <div className="h-1.5 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="w-12 h-6 bg-gray-100 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-indigo-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-gray-200 rounded w-2/3" />
              <div className="h-1.5 bg-gray-100 rounded w-2/5" />
            </div>
            <div className="w-12 h-6 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Panel empty state illustrations (compact, for recording detail panels) ---

function ConsoleIllustration() {
  return (
    <div className="w-52 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-orange-200 via-amber-200 to-yellow-200 p-3">
      <div className="bg-white rounded-lg shadow-sm h-full p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <div className="flex-1 h-1.5 bg-gray-100 rounded ml-1.5" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
            <div className="h-1.5 bg-gray-200 rounded w-4/5" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <div className="h-1.5 bg-gray-200 rounded w-3/5" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <div className="h-1.5 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NetworkIllustration() {
  return (
    <div className="w-52 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-cyan-200 via-teal-200 to-emerald-200 p-3">
      <div className="bg-white rounded-lg shadow-sm h-full p-2.5 space-y-2">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <div className="flex-1 h-1.5 bg-gray-100 rounded ml-1.5" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="px-1 py-0.5 rounded bg-emerald-100 text-[6px] font-bold text-emerald-600 leading-none shrink-0">
              GET
            </div>
            <div className="h-1.5 bg-gray-200 rounded flex-1" />
            <div className="px-1 py-0.5 rounded bg-emerald-50 text-[6px] font-medium text-emerald-500 leading-none shrink-0">
              200
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-1 py-0.5 rounded bg-blue-100 text-[6px] font-bold text-blue-600 leading-none shrink-0">
              POST
            </div>
            <div className="h-1.5 bg-gray-200 rounded flex-1" />
            <div className="px-1 py-0.5 rounded bg-emerald-50 text-[6px] font-medium text-emerald-500 leading-none shrink-0">
              201
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-1 py-0.5 rounded bg-emerald-100 text-[6px] font-bold text-emerald-600 leading-none shrink-0">
              GET
            </div>
            <div className="h-1.5 bg-gray-200 rounded flex-1" />
            <div className="px-1 py-0.5 rounded bg-red-50 text-[6px] font-medium text-red-500 leading-none shrink-0">
              404
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionsIllustration() {
  return (
    <div className="w-52 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-rose-200 via-pink-200 to-fuchsia-200 p-3">
      <div className="bg-white rounded-lg shadow-sm h-full p-2.5 space-y-2 relative">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <div className="flex-1 h-1.5 bg-gray-100 rounded ml-1.5" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="flex gap-1.5">
            <div className="h-6 bg-pink-100 rounded flex-1" />
            <div className="h-6 bg-gray-100 rounded flex-1" />
          </div>
          <div className="h-2 bg-gray-100 rounded w-3/4" />
        </div>
        <svg
          className="absolute bottom-3 left-[55%] w-3 h-3 text-pink-500 drop-shadow-sm"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M4 0L4 20L9 15L14 22L17 20L12 13L19 13Z" />
        </svg>
      </div>
    </div>
  );
}

export function ConsolePanelEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="relative mb-4">
        <ConsoleIllustration />
      </div>
      <h4 className="text-sm font-medium text-foreground mb-1">No console logs</h4>
      <p className="text-xs text-muted-foreground text-center max-w-[220px]">
        No console logs were captured during this recording
      </p>
    </div>
  );
}

export function NetworkPanelEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="relative mb-4">
        <NetworkIllustration />
      </div>
      <h4 className="text-sm font-medium text-foreground mb-1">No network activity</h4>
      <p className="text-xs text-muted-foreground text-center max-w-[220px]">
        No network activity was captured during this recording
      </p>
    </div>
  );
}

export function ActionsPanelEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="relative mb-4">
        <ActionsIllustration />
      </div>
      <h4 className="text-sm font-medium text-foreground mb-1">No user actions</h4>
      <p className="text-xs text-muted-foreground text-center max-w-[220px]">
        No user actions were captured during this recording
      </p>
    </div>
  );
}

interface RecordingEmptyStateProps {
  onRequestRecording: () => void;
}

export function RecordingEmptyState({ onRequestRecording }: RecordingEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <RecordingIllustration />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">No recordings yet</h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
        Request a screen recording from your users to start collecting feedback
      </p>

      <Button onClick={onRequestRecording} size="default" className="gap-2">
        <Plus className="w-4 h-4" />
        Request a recording
      </Button>
    </div>
  );
}

interface LinkEmptyStateProps {
  onCreateLink: () => void;
}

export function LinkEmptyState({ onCreateLink }: LinkEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <LinkIllustration />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">No links yet</h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
        Create a shareable link to start collecting screen recordings from your users
      </p>

      <Button onClick={onCreateLink} size="default" className="gap-2">
        <Plus className="w-4 h-4" />
        Create a link
      </Button>
    </div>
  );
}

interface ProjectRecordingEmptyStateProps {
  onRequestRecording: () => void;
}

export function ProjectRecordingEmptyState({
  onRequestRecording,
}: ProjectRecordingEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <RecordingIllustration />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">No recordings in this project</h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
        Create a link for this project and share it to start receiving recordings
      </p>

      <Button onClick={onRequestRecording} size="default" className="gap-2">
        <Plus className="w-4 h-4" />
        Create a link
      </Button>
    </div>
  );
}

interface ProjectLinkEmptyStateProps {
  onCreateLink: () => void;
}

export function ProjectLinkEmptyState({ onCreateLink }: ProjectLinkEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <LinkIllustration />
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">No links in this project</h3>
      <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
        Create a shareable link to start collecting recordings for this project
      </p>

      <Button onClick={onCreateLink} size="default" className="gap-2">
        <Plus className="w-4 h-4" />
        Create a link
      </Button>
    </div>
  );
}
