import { Link } from '@tanstack/react-router';
import { Button } from '@userplane/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@userplane/ui/components/tooltip';
import { FolderKanban, Link2, Loader2, Plus, RefreshCw, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { FilterDropdown, type FilterOption } from '@/components/filters/filter-dropdown';
import { FilteredEmptyState, RecordingEmptyState } from '@/components/shared/empty-state';
import { RecordingPreviewSkeleton } from '@/components/shared/skeletons';
import { type RecordingsFilters, useInfiniteWorkspaceRecordings } from '@/features/recordings';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { useSearchableLinks } from '@/hooks/use-searchable-links';
import { useSearchableMembers } from '@/hooks/use-searchable-members';
import { useSearchableProjects } from '@/hooks/use-searchable-projects';

import { RecordingPreview } from './recording-preview';

export function RecordingsList() {
  // Filter state
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [selectedLinks, setSelectedLinks] = useState<string[]>([]);

  // Debounced filters
  const [debouncedFilters, setDebouncedFilters] = useState<RecordingsFilters>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevFiltersRef = useRef<string>('');

  useEffect(() => {
    const nextFilters: RecordingsFilters = {
      projectId: selectedProjects.length > 0 ? selectedProjects : undefined,
      createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
      linkId: selectedLinks.length > 0 ? selectedLinks : undefined,
    };
    const nextKey = JSON.stringify(nextFilters);

    if (nextKey === prevFiltersRef.current) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      prevFiltersRef.current = nextKey;
      setDebouncedFilters(nextFilters);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [selectedProjects, selectedCreators, selectedLinks]);

  // Data fetching — infinite scroll
  const {
    data,
    isPending: isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteWorkspaceRecordings({
    filters: debouncedFilters,
  });

  // isRefreshing includes isFetchingNextPage — use a narrower check so the
  // refresh icon doesn't spin during infinite scroll pagination.
  const isRefreshing = isFetching && !isLoading && !isFetchingNextPage;

  const recordings =
    data?.pages.flatMap((page) => (page.success ? page.data.recordings : [])) ?? [];

  // Infinite scroll sentinel
  const sentinelRef = useIntersectionObserver({
    onIntersect: () => fetchNextPage(),
    enabled: hasNextPage && !isFetchingNextPage,
  });

  // Filter search state
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [linkSearchQuery, setLinkSearchQuery] = useState('');

  // Filter options
  const { projects, isLoading: isSearchingProjects } = useSearchableProjects(projectSearchQuery);
  const { members, isLoading: isSearchingMembers } = useSearchableMembers(memberSearchQuery);
  const { links, isLoading: isSearchingLinks } = useSearchableLinks(linkSearchQuery);

  const projectOptions: FilterOption[] =
    projects?.map((p) => ({
      value: p.projectId,
      label: p.projectTitle || 'Untitled Project',
    })) || [];

  const memberOptions: FilterOption[] =
    members?.map((m) => ({
      value: m.workspaceMemberId,
      label: m.memberName,
      avatar: true,
    })) || [];

  const linkOptions: FilterOption[] =
    links?.map((l) => ({
      value: l.linkId,
      label: l.linkTitle || 'Untitled Link',
    })) || [];

  const hasActiveFilters =
    selectedProjects.length > 0 || selectedCreators.length > 0 || selectedLinks.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-lg font-semibold">Recordings</h1>
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-muted-foreground">View received recordings</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => refetch()}
                  disabled={isRefreshing}
                  className="inline-flex items-center"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh recordings</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
        <Link to="/create">
          <Button size="sm" className="gap-2">
            Create Link
            <Plus className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
        <FilterDropdown
          label="Projects"
          icon={FolderKanban}
          options={projectOptions}
          selected={selectedProjects}
          onSelectionChange={setSelectedProjects}
          onSearchChange={setProjectSearchQuery}
          isSearching={isSearchingProjects}
          placeholder="Search projects..."
        />
        <FilterDropdown
          label="Member"
          icon={Users}
          options={memberOptions}
          selected={selectedCreators}
          onSelectionChange={setSelectedCreators}
          onSearchChange={setMemberSearchQuery}
          isSearching={isSearchingMembers}
          placeholder="Search members..."
          showAvatars
        />
        <FilterDropdown
          label="Link"
          icon={Link2}
          options={linkOptions}
          selected={selectedLinks}
          onSelectionChange={setSelectedLinks}
          onSearchChange={setLinkSearchQuery}
          isSearching={isSearchingLinks}
          placeholder="Search links..."
          showTooltip
        />
      </div>

      {/* Recordings list */}
      {isLoading ? (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <RecordingPreviewSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : recordings.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          {hasActiveFilters ? <FilteredEmptyState label="recordings" /> : <RecordingEmptyState />}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {recordings.map((recording) => (
              <RecordingPreview
                key={recording.recordingId}
                recordingId={recording.recordingId}
                createdBy={recording.creator.name}
                createdAt={recording.createdAt}
                expiresAt={recording.expiresAt}
                durationMs={recording.recordingDurationMs}
                thumbnailUrl={recording.recordingThumbnail}
              />
            ))}
            {isFetchingNextPage && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
            <div ref={sentinelRef} className="h-1" />
          </div>
        </div>
      )}
    </div>
  );
}
