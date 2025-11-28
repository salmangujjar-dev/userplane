export interface IntegrationPermission {
  text: string;
}

export interface IntegrationConfig {
  name: string;
  description: string;
  permissions: IntegrationPermission[];
}

export const integrationPermissions: Record<string, IntegrationConfig> = {
  Intercom: {
    name: 'Intercom',
    description: 'Screen recordings for faster ticket resolution',
    permissions: [
      { text: 'Access basic company information and details' },
      { text: 'Access and edit bug reports and create new issues' },
      { text: 'Change issue status and assignees of issues' },
      { text: 'Add or remove users and change user roles' },
    ],
  },
  Zendesk: {
    name: 'Zendesk',
    description: 'Attach recordings to support tickets automatically',
    permissions: [
      { text: 'Access basic company information and details' },
      { text: 'View and create tickets in your Zendesk account' },
      { text: 'Update ticket status and assignments' },
      { text: 'Add comments and attachments to tickets' },
    ],
  },
  Jira: {
    name: 'Jira',
    description: 'Link recordings to issues and bugs',
    permissions: [
      { text: 'Access basic project information and details' },
      { text: 'View, create and edit issues in your projects' },
      { text: 'Update issue status and assignees' },
      { text: 'Add attachments and comments to issues' },
    ],
  },
  Linear: {
    name: 'Linear',
    description: 'Attach recordings to issues for better context',
    permissions: [
      { text: 'Access basic team and project information' },
      { text: 'View and create issues in your workspace' },
      { text: 'Update issue status and assignments' },
      { text: 'Add comments and attachments to issues' },
    ],
  },
  Slack: {
    name: 'Slack',
    description: 'Share recordings directly in Slack channels',
    permissions: [
      { text: 'Access basic workspace information' },
      { text: 'Post messages in channels and direct messages' },
      { text: 'Upload and share files' },
      { text: 'View channel and user information' },
    ],
  },
  Asana: {
    name: 'Asana',
    description: 'Attach recordings to tasks and projects',
    permissions: [
      { text: 'Access basic workspace and project information' },
      { text: 'View and create tasks in your projects' },
      { text: 'Update task status and assignees' },
      { text: 'Add comments and attachments to tasks' },
    ],
  },
  Notion: {
    name: 'Notion',
    description: 'Embed recordings in your Notion pages',
    permissions: [
      { text: 'Access basic workspace information' },
      { text: 'View and create pages in your workspace' },
      { text: 'Update page content and properties' },
      { text: 'Add embeds and attachments to pages' },
    ],
  },
  HubSpot: {
    name: 'HubSpot',
    description: 'Link recordings to contacts and deals',
    permissions: [
      { text: 'Access basic account information' },
      { text: 'View and update contacts and companies' },
      { text: 'Access and update deals and tickets' },
      { text: 'Add notes and attachments' },
    ],
  },
  Salesforce: {
    name: 'Salesforce',
    description: 'Attach recordings to cases and opportunities',
    permissions: [
      { text: 'Access basic organization information' },
      { text: 'View and update cases and opportunities' },
      { text: 'Access contact and account information' },
      { text: 'Add files and notes to records' },
    ],
  },
};

export function getIntegrationConfig(name: string): IntegrationConfig {
  return (
    integrationPermissions[name] || {
      name,
      description: 'Connect your workspace with this integration',
      permissions: [
        { text: 'Access basic information and details' },
        { text: 'Create and update records' },
        { text: 'Add attachments and comments' },
        { text: 'Manage user permissions' },
      ],
    }
  );
}
