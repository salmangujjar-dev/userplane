'use client';

import { Button } from '@userplane/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@userplane/ui/components/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@userplane/ui/components/pagination';
import { SearchInput } from '@userplane/ui/components/search-input';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Clock,
  Filter,
  Folder,
  MoreVertical,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { AdminDeactivateProjectModal } from '@/components/modals/admin-deactivate-project-modal';
import { AdminRestoreProjectModal } from '@/components/modals/admin-restore-project-modal';
import { SectionError } from '@/components/shared/section-error';
import {
  ADMIN_FILTER_STATUS_OPTIONS,
  ADMIN_PROJECT_SORT_OPTIONS,
  ADMIN_WORKSPACE_PROJECTS_PAGINATION,
  SORT_DIRECTION_OPTIONS,
} from '@/constants/admin';
import {
  useAdminDeactivateProject,
  useAdminRestoreProject,
  useAdminSearchWorkspaceProjects,
} from '@/features/admin';
import type { AdminNotifyDuration } from '@/types';

const ITEMS_PER_PAGE = ADMIN_WORKSPACE_PROJECTS_PAGINATION.DEFAULT_PER_PAGE;

interface ProjectsTabProps {
  workspaceId: string;
}

interface ProjectsTabHeaderProps {
  total: number;
  inputFilters: {
    search: string;
    selectedStatus: string[];
    selectedSortBy: string[];
    selectedSortDirection: string[];
  };
  onFiltersChange: (update: Partial<ProjectsTabHeaderProps['inputFilters']>) => void;
  getSortDirectionIcon: () => typeof ArrowUpDown;
}

function ProjectsTabHeader({
  total,
  inputFilters,
  onFiltersChange,
  getSortDirectionIcon,
}: ProjectsTabHeaderProps) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold">Projects</h2>
      <p className="text-sm text-muted-foreground mt-1">
        View all projects in this workspace ({total} total)
      </p>
      <div className="flex items-center gap-2 mt-3">
        <SearchInput
          placeholder="Search by name or ID..."
          value={inputFilters.search}
          onChange={(e) => onFiltersChange({ search: e.target.value })}
          className="w-80"
        />
        <div className="flex items-center gap-2 ml-2">
          <FilterDropdown
            label="Status"
            options={ADMIN_FILTER_STATUS_OPTIONS}
            selected={inputFilters.selectedStatus}
            onSelectionChange={(v) => onFiltersChange({ selectedStatus: v })}
            placeholder="Filter status..."
            icon={Filter}
            singleSelect
          />
          <FilterDropdown
            label="Sort by"
            options={ADMIN_PROJECT_SORT_OPTIONS}
            selected={inputFilters.selectedSortBy}
            onSelectionChange={(v) => onFiltersChange({ selectedSortBy: v })}
            placeholder="Sort by..."
            icon={Clock}
            singleSelect
          />
          <FilterDropdown
            label="Order"
            options={SORT_DIRECTION_OPTIONS}
            selected={inputFilters.selectedSortDirection}
            onSelectionChange={(v) => onFiltersChange({ selectedSortDirection: v })}
            placeholder="Sort order..."
            icon={getSortDirectionIcon()}
            singleSelect
          />
        </div>
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: {
    projectId: string;
    projectTitle: string;
    isDefault: boolean;
    isDeleted: boolean;
    recordingCount: number;
    createdAt: Date;
    deletedAt: Date | null;
  };
  onDeactivate: (projectId: string, projectTitle: string) => void;
  onRestore: (projectId: string, projectTitle: string) => void;
  isDeactivating: boolean;
  isRestoring: boolean;
}

function ProjectCard({
  project,
  onDeactivate,
  onRestore,
  isDeactivating,
  isRestoring,
}: ProjectCardProps) {
  return (
    <div className="flex items-center justify-between p-6 rounded-xl border bg-card">
      <div className="flex items-center gap-3 flex-1">
        <Folder className="h-5 w-5 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {project.projectTitle || 'Untitled Project'}
            </span>
            <div className="flex items-center gap-1">
              {project.isDefault && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  Default
                </span>
              )}
              {project.isDeleted && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Deleted
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              {project.recordingCount} {project.recordingCount === 1 ? 'recording' : 'recordings'}
            </span>
            <span>•</span>
            <span>Created {project.createdAt.toLocaleDateString()}</span>
            {project.deletedAt && (
              <>
                <span>•</span>
                <span>Deleted {project.deletedAt.toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {project.isDeleted ? (
            <DropdownMenuItem
              onClick={() => onRestore(project.projectId, project.projectTitle)}
              disabled={isRestoring}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore project
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => onDeactivate(project.projectId, project.projectTitle)}
              disabled={isDeactivating}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deactivate project
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface ProjectsEmptyStateProps {
  filterStatus: string;
}

function ProjectsEmptyState({ filterStatus }: ProjectsEmptyStateProps) {
  return (
    <div className="text-center py-12 border rounded-xl bg-card">
      <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
      <h3 className="text-sm font-medium text-foreground mb-1">No projects found</h3>
      <p className="text-sm text-muted-foreground">
        {filterStatus === 'deleted'
          ? 'No deleted projects in this workspace'
          : 'This workspace has no projects'}
      </p>
    </div>
  );
}

export function ProjectsTab({ workspaceId }: ProjectsTabProps) {
  const [inputFilters, setInputFilters] = useState({
    search: '',
    selectedStatus: ['active'] as string[],
    selectedSortBy: ['created_at'] as string[],
    selectedSortDirection: ['desc'] as string[],
  });

  // Combined debounced filters + pagination state to avoid cascading setState
  const [filterState, setFilterState] = useState({
    currentPage: 1,
    search: '',
    filterStatus: 'active' as 'all' | 'active' | 'deleted',
    sortBy: 'created_at' as 'created_at' | 'project_title' | 'updated_at',
    sortDirection: 'desc' as 'asc' | 'desc',
  });

  // Ref to track previous filter values for comparison without adding state to deps
  const prevFiltersRef = useRef({
    search: filterState.search,
    filterStatus: filterState.filterStatus,
    sortBy: filterState.sortBy,
    sortDirection: filterState.sortDirection,
  });

  // Debounce all filter changes together — single setState call
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters = {
        search: inputFilters.search,
        filterStatus: (inputFilters.selectedStatus[0] as 'all' | 'active' | 'deleted') || 'active',
        sortBy:
          (inputFilters.selectedSortBy[0] as 'created_at' | 'project_title' | 'updated_at') ||
          'created_at',
        sortDirection: (inputFilters.selectedSortDirection[0] as 'asc' | 'desc') || 'desc',
      };

      const prev = prevFiltersRef.current;
      // Check if filters actually changed to avoid unnecessary page resets
      const filtersChanged =
        newFilters.search !== prev.search ||
        newFilters.filterStatus !== prev.filterStatus ||
        newFilters.sortBy !== prev.sortBy ||
        newFilters.sortDirection !== prev.sortDirection;

      if (filtersChanged) {
        prevFiltersRef.current = newFilters;
        setFilterState({
          currentPage: 1,
          ...newFilters,
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [inputFilters]);

  const {
    data: projectsResult,
    isLoading,
    error,
    refetch,
  } = useAdminSearchWorkspaceProjects({
    workspaceId,
    search: filterState.search,
    limit: ITEMS_PER_PAGE,
    offset: (filterState.currentPage - 1) * ITEMS_PER_PAGE,
    sortBy: filterState.sortBy,
    sortDirection: filterState.sortDirection,
    filterStatus: filterState.filterStatus,
  });

  const deactivateProjectMutation = useAdminDeactivateProject(workspaceId);
  const restoreProjectMutation = useAdminRestoreProject(workspaceId);

  const [projectAction, setProjectAction] = useState<{
    toDeactivate: { projectId: string; projectTitle: string } | null;
    toRestore: { projectId: string; projectTitle: string } | null;
  }>({ toDeactivate: null, toRestore: null });

  const projectsData = projectsResult?.success ? projectsResult.data : null;
  const projects = projectsData?.projects ?? [];
  const total = projectsData?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handleDeactivateProject = (projectId: string, projectTitle: string) => {
    setProjectAction((prev) => ({ ...prev, toDeactivate: { projectId, projectTitle } }));
  };

  const handleRestoreProject = (projectId: string, projectTitle: string) => {
    setProjectAction((prev) => ({ ...prev, toRestore: { projectId, projectTitle } }));
  };

  const confirmDeactivateProject = (notify?: AdminNotifyDuration) => {
    if (projectAction.toDeactivate) {
      deactivateProjectMutation.mutate({ projectId: projectAction.toDeactivate.projectId, notify });
      setProjectAction((prev) => ({ ...prev, toDeactivate: null }));
    }
  };

  const confirmRestoreProject = (notify?: AdminNotifyDuration) => {
    if (projectAction.toRestore) {
      restoreProjectMutation.mutate({ projectId: projectAction.toRestore.projectId, notify });
      setProjectAction((prev) => ({ ...prev, toRestore: null }));
    }
  };

  const getSortDirectionIcon = () => {
    if (inputFilters.selectedSortDirection[0] === 'asc') return ArrowUp;
    if (inputFilters.selectedSortDirection[0] === 'desc') return ArrowDown;
    return ArrowUpDown;
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">View all projects in this workspace</p>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }, (_, i) => `project-skeleton-${i}`).map((id) => (
            <div key={id} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || (projectsResult && !projectsResult.success)) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">View all projects in this workspace</p>
        </div>
        <SectionError
          title="Failed to load projects"
          description={
            error instanceof Error
              ? error.message
              : projectsResult && !projectsResult.success
                ? projectsResult.error.message
                : 'Something went wrong while loading projects.'
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div>
      <ProjectsTabHeader
        total={total}
        inputFilters={inputFilters}
        onFiltersChange={(update) => setInputFilters((prev) => ({ ...prev, ...update }))}
        getSortDirectionIcon={getSortDirectionIcon}
      />

      <div className="space-y-4">
        {projects.length === 0 ? (
          <ProjectsEmptyState filterStatus={filterState.filterStatus} />
        ) : (
          <>
            {projects.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                onDeactivate={handleDeactivateProject}
                onRestore={handleRestoreProject}
                isDeactivating={deactivateProjectMutation.isPending}
                isRestoring={restoreProjectMutation.isPending}
              />
            ))}
          </>
        )}

        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setFilterState((prev) => ({
                      ...prev,
                      currentPage: Math.max(1, prev.currentPage - 1),
                    }))
                  }
                  disabled={filterState.currentPage === 1}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= filterState.currentPage - 1 && page <= filterState.currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setFilterState((prev) => ({ ...prev, currentPage: page }))}
                        isActive={filterState.currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (
                  page === filterState.currentPage - 2 ||
                  page === filterState.currentPage + 2
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                return null;
              })}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setFilterState((prev) => ({
                      ...prev,
                      currentPage: Math.min(totalPages, prev.currentPage + 1),
                    }))
                  }
                  disabled={filterState.currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <AdminDeactivateProjectModal
        open={!!projectAction.toDeactivate}
        onOpenChange={(open) =>
          !open && setProjectAction((prev) => ({ ...prev, toDeactivate: null }))
        }
        project={projectAction.toDeactivate}
        onConfirm={confirmDeactivateProject}
        isPending={deactivateProjectMutation.isPending}
      />

      <AdminRestoreProjectModal
        open={!!projectAction.toRestore}
        onOpenChange={(open) => !open && setProjectAction((prev) => ({ ...prev, toRestore: null }))}
        project={projectAction.toRestore}
        onConfirm={confirmRestoreProject}
        isPending={restoreProjectMutation.isPending}
      />
    </div>
  );
}
