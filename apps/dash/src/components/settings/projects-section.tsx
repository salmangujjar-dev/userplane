'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/stores/workspace';
import { Button } from '@workspace/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@workspace/ui/components/pagination';
import { Folder, Trash2, MoreVertical, ChevronRight, Pencil } from 'lucide-react';
import { CreateProjectModal } from '@/components/modals/create-project-modal';
import { EditProjectModal } from '@/components/modals/edit-project-modal';
import { DeleteConfirmationModal } from '@/components/modals/delete-confirmation-modal';
import { useWorkspaceProjects } from '@/hooks/use-workspace-projects';
import {
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '@/queries/use-project-mutations';
import { SectionError } from '@/components/shared/section-error';

const ITEMS_PER_PAGE = 5;

export function ProjectsSection() {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<{
    projectId: string;
    projectTitle: string | null;
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingProject, setDeletingProject] = useState<{
    projectId: string;
    projectTitle: string | null;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data: projectsResult,
    isLoading,
    error,
    refetch,
  } = useWorkspaceProjects({
    perPage: ITEMS_PER_PAGE,
  });
  const projects = projectsResult?.success ? projectsResult.data : null;

  const createProjectMutation = useCreateProject(workspaceId);
  const updateProjectMutation = useUpdateProject(workspaceId);
  const deleteProjectMutation = useDeleteProject(workspaceId);

  const handleCreateProject = (newProject: { title: string; isDefault: boolean }) => {
    createProjectMutation.mutate(newProject.title, {
      onSuccess: () => {
        setShowModal(false);
      },
    });
  };

  const handleDeleteProject = (projectId: string, projectTitle: string | null) => {
    setDeletingProject({ projectId, projectTitle });
  };

  const handleConfirmDelete = () => {
    if (deletingProject) {
      deleteProjectMutation.mutate(deletingProject.projectId, {
        onSuccess: () => {
          setDeletingProject(null);
        },
      });
    }
  };

  const handleViewProject = (projectId: string) => {
    if (workspaceId) {
      router.push(`/${workspaceId}/projects/${projectId}`);
    }
  };

  const handleEditProject = (project: { projectId: string; projectTitle: string | null }) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  const handleSaveEdit = (updatedProject: { title: string; isDefault: boolean }) => {
    if (!editingProject) return;
    updateProjectMutation.mutate(
      {
        projectId: editingProject.projectId,
        title: updatedProject.title,
        isDefault: updatedProject.isDefault,
      },
      {
        onSuccess: () => {
          setShowEditModal(false);
          setEditingProject(null);
        },
      }
    );
  };

  // Calculate these before any conditional returns to avoid hook order issues
  const displayedProjects = projects || [];
  const totalPages = 1;

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
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Projects</h2>
        <p className="text-sm text-muted-foreground">Organize recordings by projects</p>
      </div>

      <div className="max-w-2xl space-y-4">
        {displayedProjects.map((project) => (
          <div
            key={project.projectId}
            className="flex items-center justify-between p-4 rounded-xl border bg-card"
          >
            <div className="flex items-center gap-3">
              <Folder className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {project.projectTitle || 'Untitled Project'}
                </span>
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
                onClick={() => handleViewProject(project.projectId)}
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
                  <DropdownMenuItem onClick={() => handleEditProject(project)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit project
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDeleteProject(project.projectId, project.projectTitle)}
                    disabled={deleteProjectMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}

        <Button variant="outline" className="w-full max-w-2xl" onClick={() => setShowModal(true)}>
          Add New Project
        </Button>

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
        open={showModal}
        onOpenChange={setShowModal}
        onCreateProject={handleCreateProject}
        loading={createProjectMutation.isPending}
      />

      {editingProject && (
        <EditProjectModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          project={{
            id: parseInt(editingProject.projectId),
            title: editingProject.projectTitle || '',
            isDefault: false,
          }}
          onSave={(projectId, updatedProject) => handleSaveEdit(updatedProject)}
          loading={updateProjectMutation.isPending}
        />
      )}

      <DeleteConfirmationModal
        open={!!deletingProject}
        onOpenChange={(open) => !open && setDeletingProject(null)}
        itemName={deletingProject?.projectTitle || 'Untitled Project'}
        itemType="project"
        onConfirm={handleConfirmDelete}
        isLoading={deleteProjectMutation.isPending}
      />
    </div>
  );
}
