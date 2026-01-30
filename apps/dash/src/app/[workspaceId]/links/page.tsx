'use client';

import { FolderKanban, Globe, Users } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useEffect, useState } from 'react';

import { FilterDropdown } from '@/components/filters/filter-dropdown';
import { LinksTab } from '@/components/links/links-tab';
import { CreateLinkModal } from '@/components/modals/create-link-modal';
import { InviteModal } from '@/components/modals/invite-modal';
import { Sidebar } from '@/components/navigation/sidebar';
import { TopActions } from '@/components/navigation/top-actions';
import { DinoError } from '@/components/shared/dino-error';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { useWorkspaceDomains } from '@/features/domains';
import { useWorkspaceLinks } from '@/features/links';
import { usePagination } from '@/hooks/use-pagination';
import { useSearchableMembers } from '@/hooks/use-searchable-members';
import { useSearchableProjects } from '@/hooks/use-searchable-projects';
import { stringArrayParser } from '@/lib/parsers';

export default function LinksPage() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [createLinkModalOpen, setCreateLinkModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = usePagination();
  const linksPerPage = 10;

  // Filter states (URL-synced)
  const [selectedProjects, setSelectedProjects] = useQueryState('projects', stringArrayParser);
  const [selectedCreators, setSelectedCreators] = useQueryState('creators', stringArrayParser);
  const [selectedDomains, setSelectedDomains] = useQueryState('domains', stringArrayParser);

  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Debounced filter states for API calls
  const [debouncedFilters, setDebouncedFilters] = useState<{
    projectId?: string[];
    createdBy?: string[];
    domainId?: string[];
  }>({
    projectId: selectedProjects.length > 0 ? selectedProjects : undefined,
    createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
    domainId: selectedDomains.length > 0 ? selectedDomains : undefined,
  });

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters = {
        projectId: selectedProjects.length > 0 ? selectedProjects : undefined,
        createdBy: selectedCreators.length > 0 ? selectedCreators : undefined,
        domainId: selectedDomains.length > 0 ? selectedDomains : undefined,
      };

      // Check if filters actually changed to avoid unnecessary page resets
      const filtersChanged =
        JSON.stringify(newFilters.projectId) !== JSON.stringify(debouncedFilters.projectId) ||
        JSON.stringify(newFilters.createdBy) !== JSON.stringify(debouncedFilters.createdBy) ||
        JSON.stringify(newFilters.domainId) !== JSON.stringify(debouncedFilters.domainId);

      if (filtersChanged) {
        setDebouncedFilters(newFilters);
        void setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedProjects, selectedCreators, selectedDomains, debouncedFilters, setCurrentPage]);

  const {
    data: linksResult,
    isLoading: isLoadingLinks,
    error: linksError,
    refetch: refetchLinks,
  } = useWorkspaceLinks({
    page: currentPage,
    perPage: linksPerPage,
    filters: debouncedFilters,
  });

  const linksData = linksResult?.success ? linksResult.data : null;

  const { projects, isLoading: isSearchingProjects } = useSearchableProjects(projectSearchQuery, {
    perPage: 5,
  });
  const { members, isLoading: isSearchingMembers } = useSearchableMembers(memberSearchQuery, {
    perPage: 5,
  });
  const { data: domainsResult } = useWorkspaceDomains({ perPage: 5 });
  const domains = domainsResult?.success ? domainsResult.data.domains : null;

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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopActions
          onInviteClick={() => setInviteModalOpen(true)}
          onCreateLinkClick={() => setCreateLinkModalOpen(true)}
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
            {linksError || (linksResult && !linksResult.success) ? (
              <div className="flex items-center justify-center py-12">
                <DinoError
                  title="Failed to load links"
                  description={
                    linksError instanceof Error
                      ? linksError.message
                      : linksResult && !linksResult.success
                        ? linksResult.error.message
                        : 'Something went wrong while loading links.'
                  }
                  onRetry={() => refetchLinks()}
                  showGoBack={false}
                />
              </div>
            ) : (
              <>
                <LinksTab
                  links={linksData?.links}
                  isLoading={isLoadingLinks}
                  onRequestRecording={() => setCreateLinkModalOpen(true)}
                />
                {!isLoadingLinks && linksData && linksData.links.length > 0 && (
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <InviteModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} />

      <CreateLinkModal
        open={createLinkModalOpen}
        onOpenChange={setCreateLinkModalOpen}
        hideButton
      />
    </div>
  );
}
