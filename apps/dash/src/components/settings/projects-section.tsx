'use client';

import type { RetentionDays } from '@userplane/contract';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@userplane/ui/components/select';
import {
  ArrowUpDown,
  ChevronRight,
  Folder,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CreateProjectModal } from '@/components/modals/create-project-modal';
import { DeleteConfirmationModal } from '@/components/modals/delete-confirmation-modal';
import { EditProjectModal } from '@/components/modals/edit-project-modal';
import { SectionError } from '@/components/shared/section-error';
import { PROJECT_PAGINATION } from '@/constants';
import {
  type ProjectSortField,
  useCreateProject,
  useDeleteProject,
  useUpdateProject,
  useWorkspaceProjects,
} from '@/features/projects';
import { useWorkspaceRole } from '@/features/workspace';
import { useWorkspaceStore } from '@/stores/workspace';
import type { SortDirection } from '@/types';

const ITEMS_PER_PAGE = PROJECT_PAGINATION.DEFAULT_PER_PAGE;

type SortOption = 'recent' | 'oldest' | 'az' | 'za';

const SORT_OPTIONS: Record<SortOption, { sortBy: ProjectSortField; sortDirection: SortDirection }> =
  {
    recent: { sortBy: 'created_at', sortDirection: 'desc' },
    oldest: { sortBy: 'created_at', sortDirection: 'asc' },
    az: { sortBy: 'project_title', sortDirection: 'asc' },
    za: { sortBy: 'project_title', sortDirection: 'desc' },
  };

interface ProjectsSectionHeaderProps {
  sortOption: SortOption;
  onSortChange: (value: SortOption) => void;
}

function ProjectsSectionHeader({ sortOption, onSortChange }: ProjectsSectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Projects</h2>
        <p className="text-sm text-muted-foreground">Organize recordings by projects</p>
      </div>
      <Select value={sortOption} onValueChange={(value) => onSortChange(value as SortOption)}>
        <SelectTrigger className="w-[160px] h-9">
          <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="recent">Recently Added</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
          <SelectItem value="az">A to Z</SelectItem>
          <SelectItem value="za">Z to A</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

interface ProjectItemCardProps {
  project: {
    projectId: string;
    projectTitle: string;
    isDefault: boolean;
    recordingRetentionDays: RetentionDays;
  };
  canDelete: boolean;
  isDeleting: boolean;
  onView: (projectId: string) => void;
  onEdit: (project: {
    projectId: string;
    projectTitle: string;
    isDefault: boolean;
    recordingRetentionDays: RetentionDays;
  }) => void;
  onDelete: (projectId: string, projectTitle: string) => void;
}

function ProjectItemCard({
  project,
  canDelete,
  isDeleting,
  onView,
  onEdit,
  onDelete,
}: ProjectItemCardProps) {
  return (
    <div className="flex items-center justify-between p-6 rounded-xl border bg-card">
      <div className="flex items-center gap-3">
        <Folder className="h-5 w-5 text-muted-foreground" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{project.projectTitle || 'Untitled Project'}</span>
          {project.isDefault && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Default
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full min-w-[120px] focus-visible:ring-0 focus-visible:ring-offset-0 border-0"
          onClick={() => onView(project.projectId)}
        >
          View
          <ChevronRight className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(project)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit project
            </DropdownMenuItem>
            {canDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(project.projectId, project.projectTitle)}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete project
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

interface AddProjectButtonProps {
  onClick: () => void;
}

function AddProjectButton({ onClick }: AddProjectButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full max-w-2xl flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed bg-background hover:bg-muted/50 transition-colors cursor-pointer hover:border-primary/50"
    >
      <Plus className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Add New Project</span>
    </button>
  );
}

export function ProjectsSection() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const [modalState, setModalState] = useState<{
    showCreate: boolean;
    showEdit: boolean;
    editingProject: {
      projectId: string;
      projectTitle: string;
      isDefault: boolean;
      recordingRetentionDays: RetentionDays;
    } | null;
    deletingProject: { projectId: string; projectTitle: string } | null;
  }>({
    showCreate: false,
    showEdit: false,
    editingProject: null,
    deletingProject: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const { sortBy, sortDirection } = SORT_OPTIONS[sortOption];

  const {
    data: projectsResult,
    isLoading,
    error,
    refetch,
  } = useWorkspaceProjects({
    perPage: ITEMS_PER_PAGE,
    page: currentPage,
    sortBy,
    sortDirection,
  });
  const projectsData = projectsResult?.success ? projectsResult.data : null;
  const projects = projectsData?.projects ?? null;
  const paginationMeta = projectsData?.pagination;

  const createProjectMutation = useCreateProject(workspaceId);
  const updateProjectMutation = useUpdateProject(workspaceId);
  const deleteProjectMutation = useDeleteProject(workspaceId);

  // Get current user's workspace role
  const { data: roleResult } = useWorkspaceRole();
  const canDelete =
    roleResult?.success &&
    (roleResult.data.workspaceRole === 'admin' || roleResult.data.workspaceRole === 'owner');

  const handleCreateProject = (newProject: {
    title: string;
    isDefault: boolean;
    recordingRetentionDays: RetentionDays;
  }) => {
    createProjectMutation.mutate(
      { title: newProject.title, recordingRetentionDays: newProject.recordingRetentionDays },
      {
        onSuccess: () => {
          setModalState((prev) => ({ ...prev, showCreate: false }));
        },
      }
    );
  };

  const handleDeleteProject = (projectId: string, projectTitle: string) => {
    setModalState((prev) => ({ ...prev, deletingProject: { projectId, projectTitle } }));
  };

  const handleConfirmDelete = () => {
    if (modalState.deletingProject) {
      deleteProjectMutation.mutate(modalState.deletingProject.projectId, {
        onSuccess: () => {
          setModalState((prev) => ({ ...prev, deletingProject: null }));
        },
      });
    }
  };

  const handleViewProject = (projectId: string) => {
    if (workspaceId) {
      router.push(`/workspace/${workspaceId}/projects/${projectId}`);
    }
  };

  const handleEditProject = (project: {
    projectId: string;
    projectTitle: string;
    isDefault: boolean;
    recordingRetentionDays: RetentionDays;
  }) => {
    setModalState((prev) => ({ ...prev, editingProject: project, showEdit: true }));
  };

  const handleSaveEdit = (updatedProject: {
    title: string;
    isDefault: boolean;
    recordingRetentionDays: RetentionDays;
  }) => {
    if (!modalState.editingProject) return;
    updateProjectMutation.mutate(
      {
        projectId: modalState.editingProject.projectId,
        title: updatedProject.title,
        isDefault: updatedProject.isDefault,
        recordingRetentionDays: updatedProject.recordingRetentionDays,
      },
      {
        onSuccess: () => {
          setModalState((prev) => ({ ...prev, showEdit: false, editingProject: null }));
        },
      }
    );
  };

  // Calculate these before any conditional returns to avoid hook order issues
  const displayedProjects = projects || [];
  const totalPages = paginationMeta?.totalPages ?? 1;

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">Organize recordings by projects</p>
        </div>
        <div className="max-w-2xl rounded-lg bg-card p-6 space-y-4">
          <div className="h-16 w-full bg-muted animate-pulse rounded" />
          <div className="h-16 w-full bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (error || (projectsResult && !projectsResult.success)) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">Organize recordings by projects</p>
        </div>
        <div className="max-w-2xl">
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
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="text-sm text-muted-foreground">Organize recordings by projects</p>
        </div>
        <div className="max-w-2xl space-y-4">
          {Array.from({ length: 5 }, (_, i) => `project-skeleton-${i}`).map((id) => (
            <div key={id} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <ProjectsSectionHeader sortOption={sortOption} onSortChange={setSortOption} />

      <div className="max-w-2xl space-y-4">
        {displayedProjects.map((project) => (
          <ProjectItemCard
            key={project.projectId}
            project={project}
            canDelete={!!canDelete}
            isDeleting={deleteProjectMutation.isPending}
            onView={handleViewProject}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
          />
        ))}

        <AddProjectButton
          onClick={() => setModalState((prev) => ({ ...prev, showCreate: true }))}
        />

        {totalPages > 1 && (
          <Pagination className="mt-4">
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

      <CreateProjectModal
        open={modalState.showCreate}
        onOpenChange={(open) => setModalState((prev) => ({ ...prev, showCreate: open }))}
        onCreateProject={handleCreateProject}
        loading={createProjectMutation.isPending}
      />

      {modalState.editingProject && (
        <EditProjectModal
          open={modalState.showEdit}
          onOpenChange={(open) => setModalState((prev) => ({ ...prev, showEdit: open }))}
          project={{
            id: parseInt(modalState.editingProject.projectId),
            title: modalState.editingProject.projectTitle || '',
            isDefault: modalState.editingProject.isDefault,
            recordingRetentionDays: modalState.editingProject.recordingRetentionDays,
          }}
          onSave={(projectId, updatedProject) => handleSaveEdit(updatedProject)}
          loading={updateProjectMutation.isPending}
        />
      )}

      <DeleteConfirmationModal
        open={!!modalState.deletingProject}
        onOpenChange={(open) =>
          !open && setModalState((prev) => ({ ...prev, deletingProject: null }))
        }
        itemName={modalState.deletingProject?.projectTitle || 'Untitled Project'}
        itemType="project"
        onConfirm={handleConfirmDelete}
        isLoading={deleteProjectMutation.isPending}
      />
    </div>
  );
}
