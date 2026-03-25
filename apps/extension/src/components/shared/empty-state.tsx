import { Link } from '@tanstack/react-router';
import { Button } from '@userplane/ui/components/button';
import { ExternalLink, Plus } from 'lucide-react';

const DASH_URL = import.meta.env.WXT_DASH_URL || 'https://dash-dev.userplane.io';

function RecordingIllustration() {
  return (
    <div className="w-56 h-36 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-200 via-lime-200 to-yellow-200 p-3">
      <div className="bg-white rounded-lg shadow-sm h-full p-2.5 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <div className="flex-1 h-1.5 bg-gray-100 rounded ml-1.5" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-emerald-100 to-lime-100 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 bg-gray-200 rounded w-3/4" />
              <div className="h-1 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="w-10 h-5 bg-gray-100 rounded shrink-0" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-lime-100 to-yellow-100 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-lime-500" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" />
              </svg>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 bg-gray-200 rounded w-2/3" />
              <div className="h-1 bg-gray-100 rounded w-2/5" />
            </div>
            <div className="w-10 h-5 bg-gray-100 rounded shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LinkIllustration() {
  return (
    <div className="w-56 h-36 rounded-xl overflow-hidden bg-gradient-to-br from-blue-200 via-indigo-200 to-violet-200 p-3">
      <div className="bg-white rounded-lg shadow-sm h-full p-2.5 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <div className="flex-1 h-1.5 bg-gray-100 rounded ml-1.5" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0">
              <svg
                className="w-3.5 h-3.5 text-blue-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 bg-gray-200 rounded w-3/4" />
              <div className="h-1 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="w-10 h-5 bg-gray-100 rounded shrink-0" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shrink-0">
              <svg
                className="w-3.5 h-3.5 text-indigo-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 bg-gray-200 rounded w-2/3" />
              <div className="h-1 bg-gray-100 rounded w-2/5" />
            </div>
            <div className="w-10 h-5 bg-gray-100 rounded shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LinkEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4">
      <div className="mb-5">
        <LinkIllustration />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">No links yet</h3>
      <p className="text-sm text-muted-foreground max-w-[220px] mb-5">
        Create a shareable link to start collecting screen recordings
      </p>
      <Link to="/create">
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Create a link
        </Button>
      </Link>
    </div>
  );
}

export function RecordingEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4">
      <div className="mb-5">
        <RecordingIllustration />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">No recordings yet</h3>
      <p className="text-sm text-muted-foreground max-w-[220px] mb-5">
        Create a link and share it to start receiving screen recordings
      </p>
      <Link to="/create">
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Create a link
        </Button>
      </Link>
    </div>
  );
}

function SearchIllustration() {
  return (
    <div className="w-56 h-36 rounded-xl overflow-hidden bg-gradient-to-br from-amber-200 via-orange-200 to-rose-200 p-3">
      <div className="bg-white rounded-lg shadow-sm h-full p-2.5 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <div className="flex-1 h-1.5 bg-gray-100 rounded ml-1.5" />
        </div>
        <div className="flex items-center gap-2 px-1.5 py-1.5 rounded-md bg-gray-50 border border-gray-100">
          <svg
            className="w-3.5 h-3.5 text-gray-400 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <div className="h-1.5 bg-gray-200 rounded w-2/3" />
        </div>
        <div className="space-y-2 pt-0.5">
          <div className="flex items-center gap-2.5 opacity-40">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-amber-100 to-orange-100 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 bg-gray-200 rounded w-3/4" />
              <div className="h-1 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-2.5 opacity-20">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-orange-100 to-rose-100 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 bg-gray-200 rounded w-2/3" />
              <div className="h-1 bg-gray-100 rounded w-2/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkspaceIllustration() {
  return (
    <div className="w-56 h-36 rounded-xl overflow-hidden bg-gradient-to-br from-purple-200 via-violet-200 to-fuchsia-200 p-3">
      <div className="bg-white rounded-lg shadow-sm h-full p-2.5 space-y-2.5">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <div className="flex-1 h-1.5 bg-gray-100 rounded ml-1.5" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-100 to-violet-100 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-purple-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 bg-gray-200 rounded w-3/4" />
              <div className="h-1 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-violet-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 bg-gray-200 rounded w-2/3" />
              <div className="h-1 bg-gray-100 rounded w-2/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NoWorkspaceState() {
  const handleCreateWorkspace = () => {
    chrome.tabs.create({ url: `${DASH_URL}/workspace/create` });
  };

  return (
    <div className="flex flex-col items-center justify-center text-center px-4">
      <div className="mb-5">
        <WorkspaceIllustration />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">No workspace yet</h3>
      <p className="text-sm text-muted-foreground max-w-[220px] mb-5">
        Create a workspace to start using Userplane
      </p>
      <Button size="sm" className="gap-2" onClick={handleCreateWorkspace}>
        <ExternalLink className="w-4 h-4" />
        Create workspace
      </Button>
    </div>
  );
}

export function FilteredEmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-4">
      <div className="mb-5">
        <SearchIllustration />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">No {label} found</h3>
      <p className="text-sm text-muted-foreground max-w-[220px]">
        Try adjusting your filters to find what you&apos;re looking for
      </p>
    </div>
  );
}
