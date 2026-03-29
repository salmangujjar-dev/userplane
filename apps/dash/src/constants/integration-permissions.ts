export interface IntegrationPermission {
  text: string;
}

export interface IntegrationConfig {
  name: string;
  description: string;
  permissions: IntegrationPermission[];
  /** What the user can do after connecting — shown in the post-connect modal */
  capabilities: string[];
}

export const integrationPermissions: Record<string, IntegrationConfig> = {
  Intercom: {
    name: 'Intercom',
    description: 'Request screen recordings directly from Intercom conversations',
    permissions: [
      { text: 'Access basic company information and details' },
      { text: 'View and update Inbox conversations' },
      { text: 'View team and teammates' },
      { text: 'Access and receive data in Intercom apps' },
    ],
    capabilities: [
      'Request screen recordings directly from Intercom conversations',
      'Create recording links and view recordings from the inbox sidebar',
      'Use Cmd+K shortcut to create links without leaving the conversation',
      'Insert reusable recording links into Intercom macros',
      'Recordings are automatically linked to conversations for easy access',
    ],
  },
  Zendesk: {
    name: 'Zendesk',
    description: 'Request screen recordings from within support tickets',
    permissions: [
      { text: 'Read and update support tickets' },
      { text: 'Access end-user and organization profiles' },
      { text: 'Add comments and attachments to tickets' },
      { text: 'Receive webhook notifications for ticket events' },
    ],
    capabilities: [
      'Request screen recordings directly from Zendesk tickets',
      'Create recording links from the ticket sidebar or top bar',
      'Recording links are automatically posted as internal notes',
      'View recordings linked to tickets for quick context',
      'Works across ticket sidebar and top bar locations',
    ],
  },
  Jira: {
    name: 'Jira',
    description: 'Attach screen recordings to issues and bugs',
    permissions: [
      { text: 'Browse projects and view issues' },
      { text: 'Create issues and add attachments' },
      { text: 'Edit and transition issue status' },
      { text: 'Access project members and roles' },
    ],
    capabilities: [],
  },
  Linear: {
    name: 'Linear',
    description: 'Link screen recordings to issues for visual context',
    permissions: [
      { text: 'Read issues, projects, and teams' },
      { text: 'Create and update issues' },
      { text: 'Add attachments and comments to issues' },
      { text: 'Access team members and labels' },
    ],
    capabilities: [],
  },
  Slack: {
    name: 'Slack',
    description: 'Create and share screen recordings directly from Slack',
    permissions: [
      { text: 'Add slash commands to your workspace' },
      { text: 'Send messages to channels and conversations' },
      { text: 'Access workspace user and channel info' },
      { text: 'Receive events for messages and reactions' },
    ],
    capabilities: [
      'Create recording links with the /userplane slash command',
      'Share recordings directly in any Slack channel',
      'Receive notifications when recordings are ready',
      'View and manage recordings from the App Home tab',
      'Invite Slack workspace members to collaborate',
    ],
  },
  Asana: {
    name: 'Asana',
    description: 'Attach screen recordings to tasks and projects',
    permissions: [
      { text: 'Access tasks and projects in your workspace' },
      { text: 'Create tasks and add attachments' },
      { text: 'Update task status and assignees' },
      { text: 'Add comments and followers to tasks' },
    ],
    capabilities: [],
  },
  Notion: {
    name: 'Notion',
    description: 'Embed screen recordings in your Notion pages',
    permissions: [
      { text: 'Read and update pages in your workspace' },
      { text: 'Insert content blocks and embeds' },
      { text: 'Access databases and their entries' },
      { text: 'Search across your workspace' },
    ],
    capabilities: [],
  },
  HubSpot: {
    name: 'HubSpot',
    description: 'Link screen recordings to contacts and tickets',
    permissions: [
      { text: 'View and update contact and company records' },
      { text: 'Access and manage support tickets' },
      { text: 'Add notes, attachments, and activities' },
      { text: 'Read deal and pipeline information' },
    ],
    capabilities: [],
  },
  Salesforce: {
    name: 'Salesforce',
    description: 'Attach screen recordings to cases and opportunities',
    permissions: [
      { text: 'View and update case and opportunity records' },
      { text: 'Access contact and account information' },
      { text: 'Attach files and notes to records' },
      { text: 'Create and read activity history' },
    ],
    capabilities: [],
  },
};

export function getIntegrationConfig(name: string): IntegrationConfig {
  return (
    integrationPermissions[name] || {
      name,
      description: 'Connect your workspace with this integration',
      permissions: [
        { text: 'Access basic account information' },
        { text: 'Create and update records' },
        { text: 'Add attachments and comments' },
        { text: 'Receive event notifications' },
      ],
      capabilities: [],
    }
  );
}
