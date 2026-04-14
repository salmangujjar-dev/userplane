import { Action, ActionPanel, Form, Icon, useNavigation } from '@raycast/api';

import type { LinkSortField, ListLinksFilters, SortDirection } from './api/types';
import { useDomains } from './hooks/use-domains';
import { useMembers } from './hooks/use-members';
import { useProjects } from './hooks/use-projects';

interface FiltersFormValues {
  creatorIds: string[];
  projectIds: string[];
  domainIds: string[];
  sortBy: LinkSortField;
  sortDirection: SortDirection;
}

interface FiltersFormProps {
  workspaceId: string;
  value: ListLinksFilters;
  currentMemberId?: string;
  onChange: (next: ListLinksFilters) => void;
}

const DEFAULT_FILTERS: ListLinksFilters = {
  projectIds: [],
  domainIds: [],
  creatorIds: [],
  sortBy: 'created_at',
  sortDirection: 'desc',
};

export function FiltersForm({ workspaceId, value, currentMemberId, onChange }: FiltersFormProps) {
  const { pop } = useNavigation();
  const projects = useProjects(workspaceId);
  const domains = useDomains(workspaceId);
  const members = useMembers(workspaceId);

  const isLoading = projects.isLoading || domains.isLoading || members.isLoading;

  function handleSubmit(values: FiltersFormValues) {
    onChange({
      creatorIds: values.creatorIds,
      projectIds: values.projectIds,
      domainIds: values.domainIds,
      sortBy: values.sortBy,
      sortDirection: values.sortDirection,
    });
    pop();
  }

  function handleReset() {
    onChange({ ...DEFAULT_FILTERS });
    pop();
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Apply Filters" icon={Icon.Check} onSubmit={handleSubmit} />
          <Action
            title="Reset to Defaults"
            icon={Icon.ArrowCounterClockwise}
            shortcut={{ modifiers: ['cmd', 'shift'], key: 'f' }}
            onAction={handleReset}
          />
        </ActionPanel>
      }
    >
      <Form.TagPicker id="creatorIds" title="Creators" defaultValue={value.creatorIds}>
        {(members.data?.workspaceMembers ?? []).map((m) => {
          const isSelf = m.workspaceMemberId === currentMemberId;
          return (
            <Form.TagPicker.Item
              key={m.workspaceMemberId}
              value={m.workspaceMemberId}
              title={isSelf ? `${m.memberName} (You)` : m.memberName}
            />
          );
        })}
      </Form.TagPicker>

      <Form.TagPicker id="projectIds" title="Projects" defaultValue={value.projectIds}>
        {(projects.data?.projects ?? []).map((p) => (
          <Form.TagPicker.Item
            key={p.projectId}
            value={p.projectId}
            title={p.projectTitle || 'Untitled project'}
          />
        ))}
      </Form.TagPicker>

      <Form.TagPicker id="domainIds" title="Domains" defaultValue={value.domainIds}>
        {(domains.data?.domains ?? []).map((d) => (
          <Form.TagPicker.Item key={d.domainId} value={d.domainId} title={d.domainUrl} />
        ))}
      </Form.TagPicker>

      <Form.Separator />

      <Form.Dropdown id="sortBy" title="Sort By" defaultValue={value.sortBy}>
        <Form.Dropdown.Item value="created_at" title="Created" />
        <Form.Dropdown.Item value="link_title" title="Title" />
      </Form.Dropdown>
      <Form.Dropdown id="sortDirection" title="Direction" defaultValue={value.sortDirection}>
        <Form.Dropdown.Item value="desc" title="Descending" />
        <Form.Dropdown.Item value="asc" title="Ascending" />
      </Form.Dropdown>
    </Form>
  );
}

export { DEFAULT_FILTERS };
