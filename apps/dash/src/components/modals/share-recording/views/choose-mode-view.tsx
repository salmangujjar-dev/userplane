import { ExternalLink, Users } from 'lucide-react';

type SelectedMode = 'internal' | 'external';

interface ChooseModeViewProps {
  selectedMode: SelectedMode;
  onSelectMode: (mode: SelectedMode) => void;
}

export function ChooseModeView({ selectedMode, onSelectMode }: ChooseModeViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Internal sharing card */}
      <button
        type="button"
        onClick={() => onSelectMode('internal')}
        className={`rounded-xl overflow-hidden border-2 transition-all text-left ${
          selectedMode === 'internal'
            ? 'border-primary'
            : 'border-transparent hover:border-primary/30'
        }`}
      >
        <div className="h-32 bg-linear-to-br from-emerald-200 via-lime-200 to-yellow-200 p-3">
          <div className="bg-white rounded-lg shadow-sm h-full p-2.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded ml-1.5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-200 flex items-center justify-center">
                  <Users className="w-2.5 h-2.5 text-emerald-600" />
                </div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-lime-200 flex items-center justify-center">
                  <Users className="w-2.5 h-2.5 text-lime-600" />
                </div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded w-3/4" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-200 flex items-center justify-center">
                  <Users className="w-2.5 h-2.5 text-yellow-600" />
                </div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-3">
          <p className="font-medium text-sm">Share with teammates</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Recipients need a Userplane account
          </p>
        </div>
      </button>

      {/* External sharing card */}
      <button
        type="button"
        onClick={() => onSelectMode('external')}
        className={`rounded-xl overflow-hidden border-2 transition-all text-left ${
          selectedMode === 'external'
            ? 'border-primary'
            : 'border-transparent hover:border-primary/30'
        }`}
      >
        <div className="h-32 bg-linear-to-br from-blue-200 via-indigo-200 to-violet-200 p-3">
          <div className="bg-white rounded-lg shadow-sm h-full p-2.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded ml-1.5" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-200 flex items-center justify-center">
                  <ExternalLink className="w-2.5 h-2.5 text-blue-600" />
                </div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-indigo-200 flex items-center justify-center">
                  <ExternalLink className="w-2.5 h-2.5 text-indigo-600" />
                </div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded w-3/4" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-violet-200 flex items-center justify-center">
                  <ExternalLink className="w-2.5 h-2.5 text-violet-600" />
                </div>
                <div className="flex-1 h-1.5 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-3">
          <p className="font-medium text-sm">Share with collaborators</p>
          <p className="text-xs text-muted-foreground mt-0.5">Generate a temporary public link</p>
        </div>
      </button>
    </div>
  );
}
