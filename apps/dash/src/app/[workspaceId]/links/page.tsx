'use client';

import { useState } from 'react';
import { useQueryState } from 'nuqs';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { ShareLinkModal } from '@/components/modals/share-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopActions } from '@/components/navigation/top-actions';
import { LinksTab } from '@/components/links/links-tab';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { usePagination } from '@/hooks/use-pagination';
import { useWorkspaceLinks } from '@/hooks/use-workspace-links';
import { useSearchableProjects } from '@/hooks/use-searchable-projects';
import { useSearchableMembers } from '@/hooks/use-searchable-members';
import { useWorkspaceDomains } from '@/hooks/use-workspace-domains';
import { FolderKanban, Globe, Users } from 'lucide-react';
import { stringArrayParser } from '@/lib/parsers';
import { DinoError } from '@/components/shared/dino-error';

export default function LinksPage() {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = usePagination();
  const linksPerPage = 10;
  const [selectedProjects, setSelectedProjects] = useQueryState('projects', stringArrayParser);
  const [selectedCreators, setSelectedCreators] = useQueryState('creators', stringArrayParser);
  const [selectedDomains, setSelectedDomains] = useQueryState('domains', stringArrayParser);

  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  const {
    data: linksData,
    isLoading: isLoadingLinks,
    error: linksError,
    refetch: refetchLinks,
  } = useWorkspaceLinks({
    page: currentPage,
    perPage: linksPerPage,
    filters: {
      projectId: selectedProjects.length > 0 ? selectedProjects : undefined,
      createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
      domainId: selectedDomains.length > 0 ? selectedDomains : undefined,
    },
  });

  const { projects, isLoading: isSearchingProjects } = useSearchableProjects(projectSearchQuery, {
    perPage: 5,
  });
  const { members, isLoading: isSearchingMembers } = useSearchableMembers(memberSearchQuery, {
    perPage: 5,
  });
  const { data: domains } = useWorkspaceDomains({ perPage: 5 });

  const projectOptions =
    projects?.map((project) => ({
      value: project.projectId,
      label: project.projectTitle || 'Untitled Project',
    })) || [];

  const memberOptions =
    members?.map((member) => ({
      value: member.workspaceMemberId,
      label: member.memberName,
      avatar: true,
    })) || [];

  const domainOptions =
    domains?.map((domain) => ({
      value: domain.domainId,
      label: domain.domainUrl,
    })) || [];

  const totalPages = linksData?.pagination.totalPages || 1;

  const handleLinkCreated = (link: string) => {
    setShareLink(link);
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopActions
          onInviteClick={() => setInviteModalOpen(true)}
          createLinkButton={<CreateLinkModal onLinkCreated={handleLinkCreated} />}
        />

        <main className="flex-1 overflow-y-auto px-6 pb-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">Links</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage your recording links</p>
            <div className="flex items-center gap-2 -ml-2.5 mt-3">
              <FilterDropdown
                label="Projects"
                options={projectOptions}
                selected={selectedProjects}
                onSelectionChange={setSelectedProjects}
                onSearchChange={setProjectSearchQuery}
                isSearching={isSearchingProjects}
                placeholder="Search projects..."
                icon={FolderKanban}
              />
              <FilterDropdown
                label="Member"
                options={memberOptions}
                selected={selectedCreators}
                onSelectionChange={setSelectedCreators}
                onSearchChange={setMemberSearchQuery}
                isSearching={isSearchingMembers}
                placeholder="Search members..."
                icon={Users}
                showAvatars
              />
              <FilterDropdown
                label="Domain"
                options={domainOptions}
                selected={selectedDomains}
                onSelectionChange={setSelectedDomains}
                placeholder="Search domains..."
                icon={Globe}
              />
            </div>
          </div>

          <div className="space-y-6">
            {linksError ? (
              <div className="flex items-center justify-center py-12">
                <DinoError
                  title="Failed to load links"
                  description={
                    linksError instanceof Error
                      ? linksError.message
                      : 'Something went wrong while loading links.'
                  }
                  onRetry={() => refetchLinks()}
                  showGoBack={false}
                />
              </div>
            ) : (
              <>
                <LinksTab links={linksData?.links} isLoading={isLoadingLinks} />
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </div>
        </main>
      </div>

      <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />

      <ShareLinkModal
        link={shareLink || ''}
        open={!!shareLink}
        onClose={() => setShareLink(null)}
      />
    </div>
  );
}
