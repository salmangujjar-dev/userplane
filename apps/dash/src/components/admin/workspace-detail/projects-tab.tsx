'use client';

import { useState, useEffect } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@workspace/ui/components/pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Folder,
  MoreVertical,
  Trash2,
  RotateCcw,
  Search,
  Clock,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import {
  useAdminSearchWorkspaceProjects,
  useAdminDeactivateProject,
  useAdminRestoreProject,
} from '@/hooks/use-admin-workspace-api';
import { SectionError } from '@/components/shared/section-error';
import { ADMIN_WORKSPACE_PROJECTS_PAGINATION } from '@workspace/contract';
import { AdminDeactivateProjectModal } from '@/components/modals/admin-deactivate-project-modal';
import { AdminRestoreProjectModal } from '@/components/modals/admin-restore-project-modal';

const ITEMS_PER_PAGE = ADMIN_WORKSPACE_PROJECTS_PAGINATION.DEFAULT_PER_PAGE;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'all', label: 'All' },
];

const SORT_BY_OPTIONS = [
  { value: 'created_at', label: 'Created At' },
  { value: 'updated_at', label: 'Updated At' },
  { value: 'project_title', label: 'Name' },
];

const SORT_DIRECTION_OPTIONS = [
  { value: 'desc', label: 'Newest First' },
  { value: 'asc', label: 'Oldest First' },
];

interface ProjectsTabProps {
  workspaceId: string;
}

export function ProjectsTab({ workspaceId }: ProjectsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['active']);
  const [selectedSortBy, setSelectedSortBy] = useState<string[]>(['created_at']);
  const [selectedSortDirection, setSelectedSortDirection] = useState<string[]>(['desc']);

  // Debounced filter states for API calls
  const [debouncedFilters, setDebouncedFilters] = useState({
    search: '',
    filterStatus: 'active' as 'all' | 'active' | 'deleted',
    sortBy: 'created_at' as 'created_at' | 'project_title' | 'updated_at',
    sortDirection: 'desc' as 'asc' | 'desc',
  });

  // Debounce all filter changes together
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters = {
        search,
        filterStatus: (selectedStatus[0] as 'all' | 'active' | 'deleted') || 'active',
        sortBy:
          (selectedSortBy[0] as 'created_at' | 'project_title' | 'updated_at') || 'created_at',
        sortDirection: (selectedSortDirection[0] as 'asc' | 'desc') || 'desc',
      };

      // Check if filters actually changed to avoid unnecessary page resets
      const filtersChanged =
        newFilters.search !== debouncedFilters.search ||
        newFilters.filterStatus !== debouncedFilters.filterStatus ||
        newFilters.sortBy !== debouncedFilters.sortBy ||
        newFilters.sortDirection !== debouncedFilters.sortDirection;

      if (filtersChanged) {
        setDebouncedFilters(newFilters);
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedStatus, selectedSortBy, selectedSortDirection, debouncedFilters]);

  const {
    data: projectsResult,
    isLoading,
    error,
    refetch,
  } = useAdminSearchWorkspaceProjects({
    workspaceId,
    search: debouncedFilters.search,
    limit: ITEMS_PER_PAGE,
    offset: (currentPage - 1) * ITEMS_PER_PAGE,
    sortBy: debouncedFilters.sortBy,
    sortDirection: debouncedFilters.sortDirection,
    filterStatus: debouncedFilters.filterStatus,
  });

  const deactivateProjectMutation = useAdminDeactivateProject(workspaceId);
  const restoreProjectMutation = useAdminRestoreProject(workspaceId);

  const [projectToDeactivate, setProjectToDeactivate] = useState<{
    projectId: string;
    projectTitle: string | null;
  } | null>(null);
  const [projectToRestore, setProjectToRestore] = useState<{
    projectId: string;
    projectTitle: string | null;
  } | null>(null);

  const projectsData = projectsResult?.success ? projectsResult.data : null;
  const projects = projectsData?.projects ?? [];
  const total = projectsData?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const handleDeactivateProject = (projectId: string, projectTitle: string | null) => {
    setProjectToDeactivate({ projectId, projectTitle });
  };

  const handleRestoreProject = (projectId: string, projectTitle: string | null) => {
    setProjectToRestore({ projectId, projectTitle });
  };

  const confirmDeactivateProject = () => {
    if (projectToDeactivate) {
      deactivateProjectMutation.mutate({ projectId: projectToDeactivate.projectId });
      setProjectToDeactivate(null);
    }
  };

  const confirmRestoreProject = () => {
    if (projectToRestore) {
      restoreProjectMutation.mutate({ projectId: projectToRestore.projectId });
      setProjectToRestore(null);
    }
  };

  const getSortDirectionIcon = () => {
    if (selectedSortDirection[0] === 'asc') return ArrowUp;
    if (selectedSortDirection[0] === 'desc') return ArrowDown;
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
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
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
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Projects</h2>
        <p className="text-sm text-muted-foreground mt-1">
          View all projects in this workspace ({total} total)
        </p>
        <div className="flex items-center gap-2 mt-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2 ml-2">
            <FilterDropdown
              label="Status"
              options={STATUS_OPTIONS}
              selected={selectedStatus}
              onSelectionChange={setSelectedStatus}
              placeholder="Filter status..."
              icon={Filter}
              singleSelect
            />
            <FilterDropdown
              label="Sort by"
              options={SORT_BY_OPTIONS}
              selected={selectedSortBy}
              onSelectionChange={setSelectedSortBy}
              placeholder="Sort by..."
              icon={Clock}
              singleSelect
            />
            <FilterDropdown
              label="Order"
              options={SORT_DIRECTION_OPTIONS}
              selected={selectedSortDirection}
              onSelectionChange={setSelectedSortDirection}
              placeholder="Sort order..."
              icon={getSortDirectionIcon()}
              singleSelect
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-card">
            <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium text-foreground mb-1">No projects found</h3>
            <p className="text-sm text-muted-foreground">
              {debouncedFilters.filterStatus === 'deleted'
                ? 'No deleted projects in this workspace'
                : 'This workspace has no projects'}
            </p>
          </div>
        ) : (
          <>
            {projects.map((project) => (
              <div
                key={project.projectId}
                className="flex items-center justify-between p-6 rounded-xl border bg-card"
              >
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
                        {project.recordingCount}{' '}
                        {project.recordingCount === 1 ? 'recording' : 'recordings'}
                      </span>
                      <span>•</span>
                      <span>Created {new Date(project.createdAt).toLocaleDateString()}</span>
                      {project.deletedAt && (
                        <>
                          <span>•</span>
                          <span>Deleted {new Date(project.deletedAt).toLocaleDateString()}</span>
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
                        onClick={() =>
                          handleRestoreProject(project.projectId, project.projectTitle)
                        }
                        disabled={restoreProjectMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore project
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() =>
                          handleDeactivateProject(project.projectId, project.projectTitle)
                        }
                        disabled={deactivateProjectMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deactivate project
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </>
        )}

        {totalPages > 1 && (
          <Pagination className="mt-6">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
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
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>

      <AdminDeactivateProjectModal
        open={!!projectToDeactivate}
        onOpenChange={(open) => !open && setProjectToDeactivate(null)}
        project={projectToDeactivate}
        onConfirm={confirmDeactivateProject}
        isPending={deactivateProjectMutation.isPending}
      />

      <AdminRestoreProjectModal
        open={!!projectToRestore}
        onOpenChange={(open) => !open && setProjectToRestore(null)}
        project={projectToRestore}
        onConfirm={confirmRestoreProject}
        isPending={restoreProjectMutation.isPending}
      />
    </div>
  );
}
