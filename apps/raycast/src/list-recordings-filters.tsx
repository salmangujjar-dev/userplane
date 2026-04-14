import { Action, ActionPanel, Form, Icon, useNavigation } from '@raycast/api';

import type { ListRecordingsFilters, RecordingSortField, SortDirection } from './api/types';
import { useLinks } from './hooks/use-links';
import { useMembers } from './hooks/use-members';
import { useProjects } from './hooks/use-projects';

interface FiltersFormValues {
  creatorIds: string[];
  projectIds: string[];
  linkIds: string[];
  sortBy: RecordingSortField;
  sortDirection: SortDirection;
}

interface FiltersFormProps {
  workspaceId: string;
  value: ListRecordingsFilters;
  currentMemberId?: string;
  onChange: (next: ListRecordingsFilters) => void;
}

const DEFAULT_FILTERS: ListRecordingsFilters = {
  projectIds: [],
  linkIds: [],
  creatorIds: [],
  sortBy: 'created_at',
  sortDirection: 'desc',
};

export function FiltersForm({ workspaceId, value, currentMemberId, onChange }: FiltersFormProps) {
  const { pop } = useNavigation();
  const projects = useProjects(workspaceId);
  const links = useLinks(workspaceId);
  const members = useMembers(workspaceId);

  const isLoading = projects.isLoading || links.isLoading || members.isLoading;

  function handleSubmit(values: FiltersFormValues) {
    onChange({
      creatorIds: values.creatorIds,
      projectIds: values.projectIds,
      linkIds: values.linkIds,
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

      <Form.TagPicker id="linkIds" title="Links" defaultValue={value.linkIds}>
        {links.data.map((l) => (
          <Form.TagPicker.Item
            key={l.linkId}
            value={l.linkId}
            title={l.linkTitle || l.domain.url}
          />
        ))}
      </Form.TagPicker>

      <Form.Separator />

      <Form.Dropdown id="sortBy" title="Sort By" defaultValue={value.sortBy}>
        <Form.Dropdown.Item value="created_at" title="Created" />
        <Form.Dropdown.Item value="recording_duration" title="Duration" />
      </Form.Dropdown>
      <Form.Dropdown id="sortDirection" title="Direction" defaultValue={value.sortDirection}>
        <Form.Dropdown.Item value="desc" title="Descending" />
        <Form.Dropdown.Item value="asc" title="Ascending" />
      </Form.Dropdown>
    </Form>
  );
}

export { DEFAULT_FILTERS };
