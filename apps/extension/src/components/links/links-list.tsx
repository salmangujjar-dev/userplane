import { Link } from '@tanstack/react-router';
import { Button } from '@userplane/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@userplane/ui/components/tooltip';
import { FolderKanban, Globe, Loader2, Plus, RefreshCw, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { FilterDropdown, type FilterOption } from '@/components/filters/filter-dropdown';
import { FilteredEmptyState, LinkEmptyState } from '@/components/shared/empty-state';
import { LinkPreviewSkeleton } from '@/components/shared/skeletons';
import { useWorkspaceDomains } from '@/features/domains';
import { type LinksFilters, useDeleteLink, useInfiniteWorkspaceLinks } from '@/features/links';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';
import { useSearchableMembers } from '@/hooks/use-searchable-members';
import { useSearchableProjects } from '@/hooks/use-searchable-projects';
import { useWorkspaceId } from '@/stores/workspace';

import { LinkPreview } from './link-preview';

export function LinksList() {
  const workspaceId = useWorkspaceId();

  // Filter state
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);

  // Debounced filters
  const [debouncedFilters, setDebouncedFilters] = useState<LinksFilters>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevFiltersRef = useRef<string>('');

  useEffect(() => {
    const nextFilters: LinksFilters = {
      projectId: selectedProjects.length > 0 ? selectedProjects : undefined,
      createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
      domainId: selectedDomains.length > 0 ? selectedDomains : undefined,
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
  }, [selectedProjects, selectedCreators, selectedDomains]);

  // Data fetching — infinite scroll
  const {
    data,
    isPending: isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteWorkspaceLinks({
    filters: debouncedFilters,
  });

  // isRefreshing includes isFetchingNextPage — use a narrower check so the
  // refresh icon doesn't spin during infinite scroll pagination.
  const isRefreshing = isFetching && !isLoading && !isFetchingNextPage;
  const deleteLink = useDeleteLink(workspaceId);

  const links = data?.pages.flatMap((page) => (page.success ? page.data.links : [])) ?? [];

  // "Via the UI" optimistic delete — hide the link being deleted while mutation is in flight
  const visibleLinks = links.filter(
    (link) => !(deleteLink.isPending && deleteLink.variables === link.linkId)
  );

  // Infinite scroll sentinel
  const sentinelRef = useIntersectionObserver({
    onIntersect: () => fetchNextPage(),
    enabled: hasNextPage && !isFetchingNextPage,
  });

  // Filter search state
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Filter options
  const { projects, isLoading: isSearchingProjects } = useSearchableProjects(projectSearchQuery);
  const { members, isLoading: isSearchingMembers } = useSearchableMembers(memberSearchQuery);
  const { data: domainsResult } = useWorkspaceDomains();
  const domains = domainsResult?.success ? domainsResult.data.domains : null;

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

  const domainOptions: FilterOption[] =
    domains?.map((d) => ({
      value: d.domainId,
      label: d.domainUrl,
    })) || [];

  const hasActiveFilters =
    selectedProjects.length > 0 || selectedCreators.length > 0 || selectedDomains.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-lg font-semibold">Links</h1>
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-muted-foreground">Manage recording links</p>
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
                <p>Refresh links</p>
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
          label="Domain"
          icon={Globe}
          options={domainOptions}
          selected={selectedDomains}
          onSelectionChange={setSelectedDomains}
          placeholder="Search domains..."
          showTooltip
        />
      </div>

      {/* Links list */}
      {isLoading ? (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <LinkPreviewSkeleton key={i} />
            ))}
          </div>
        </div>
      ) : visibleLinks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          {hasActiveFilters ? <FilteredEmptyState label="links" /> : <LinkEmptyState />}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {visibleLinks.map((link) => (
              <LinkPreview
                key={link.linkId}
                linkId={link.linkId}
                linkURL={link.linkURL}
                title={link.linkTitle}
                reference={link.linkProviderReference}
                linkProvider={link.linkProviderType}
                linkProviderId={link.linkProviderId}
                createdBy={link.creator.name}
                createdAt={link.createdAt}
                projectName={link.project.title}
                isReusable={link.linkReusable}
                domainUrl={link.domain.url}
                onDelete={() => deleteLink.mutate(link.linkId)}
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
