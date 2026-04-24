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
    description: 'Request screen recordings from Intercom',
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
  Chrome: {
    name: 'Chrome',
    description: 'Request recordings from any browser workflow',
    permissions: [
      { text: 'Create recording links from Chrome' },
      { text: 'Share requests in any web-based tool' },
      { text: 'Store recordings in your Userplane workspace' },
      { text: 'Review recordings with logs and events' },
    ],
    capabilities: [
      'Create recording links from the Chrome extension',
      'Share requests in browser-based support workflows',
      'Capture recordings with logs and network activity',
      'Review customer context in Userplane',
    ],
  },
  Crisp: {
    name: 'Crisp',
    description: 'Request recordings from Crisp conversations',
    permissions: [
      { text: 'View Crisp conversations and contacts' },
      { text: 'Add replies and private notes' },
      { text: 'Access inboxes and teammates' },
      { text: 'Receive conversation event updates' },
    ],
    capabilities: [
      'Request screen recordings from Crisp conversations',
      'Add recording links to replies and private notes',
      'Keep recordings linked to customer conversations',
      'Share complete repro context with teammates',
    ],
  },
  Freshdesk: {
    name: 'Freshdesk',
    description: 'Request recordings from Freshdesk tickets',
    permissions: [
      { text: 'Read tickets, contacts, and companies' },
      { text: 'Add ticket notes and replies' },
      { text: 'Access agents and groups' },
      { text: 'Receive ticket status updates' },
    ],
    capabilities: [
      'Request screen recordings from Freshdesk tickets',
      'Add recording links to ticket notes and replies',
      'Keep recordings tied to customer tickets',
      'Escalate visual repro context to support teams',
    ],
  },
  Freshchat: {
    name: 'Freshchat',
    description: 'Request recordings from Freshchat chats',
    permissions: [
      { text: 'View Freshchat conversations and contacts' },
      { text: 'Send messages in customer chats' },
      { text: 'Access teammates and groups' },
      { text: 'Receive message event updates' },
    ],
    capabilities: [
      'Request screen recordings from Freshchat chats',
      'Share recording links in active conversations',
      'Keep recordings linked to customer chats',
      'Notify teammates when recordings are ready',
    ],
  },
  Front: {
    name: 'Front',
    description: 'Request recordings from Front inboxes',
    permissions: [
      { text: 'Read Front conversations and contacts' },
      { text: 'Add comments and replies' },
      { text: 'Access inboxes and teammates' },
      { text: 'Receive conversation event updates' },
    ],
    capabilities: [
      'Request screen recordings from Front conversations',
      'Add recording links to comments and replies',
      'Keep recordings linked to shared inbox threads',
      'Share customer context across support teams',
    ],
  },
  HappyFox: {
    name: 'HappyFox',
    description: 'Request recordings from HappyFox tickets',
    permissions: [
      { text: 'View HappyFox tickets and contacts' },
      { text: 'Add ticket replies and private notes' },
      { text: 'Access agents, teams, and categories' },
      { text: 'Receive ticket event updates' },
    ],
    capabilities: [
      'Request screen recordings from HappyFox tickets',
      'Add recording links to replies and private notes',
      'Keep recordings tied to customer tickets',
      'Route richer repro context to teammates',
    ],
  },
  Hiver: {
    name: 'Hiver',
    description: 'Request recordings from Hiver conversations',
    permissions: [
      { text: 'View Hiver conversations and customers' },
      { text: 'Add email replies and internal notes' },
      { text: 'Access shared inboxes and teammates' },
      { text: 'Receive conversation event updates' },
    ],
    capabilities: [
      'Request screen recordings from Hiver conversations',
      'Add recording links to email replies and notes',
      'Keep recordings linked to shared inbox threads',
      'Share customer context with assigned teammates',
    ],
  },
  'Jira Service Desk': {
    name: 'Jira Service Desk',
    description: 'Request recordings from Jira service requests',
    permissions: [
      { text: 'Read service requests and customers' },
      { text: 'Add public replies and internal comments' },
      { text: 'Access queues, agents, and organizations' },
      { text: 'Receive service request event updates' },
    ],
    capabilities: [
      'Request screen recordings from Jira service requests',
      'Add recording links to replies and internal comments',
      'Keep recordings linked to request timelines',
      'Escalate complete context into engineering work',
    ],
  },
  Zoho: {
    name: 'Zoho',
    description: 'Request recordings from Zoho Desk tickets',
    permissions: [
      { text: 'View Zoho Desk tickets and contacts' },
      { text: 'Add ticket replies and private comments' },
      { text: 'Access agents, teams, and departments' },
      { text: 'Receive ticket event updates' },
    ],
    capabilities: [
      'Request screen recordings from Zoho Desk tickets',
      'Add recording links to replies and private comments',
      'Keep recordings tied to customer tickets',
      'Share visual context with support teams',
    ],
  },
  Discord: {
    name: 'Discord',
    description: 'Request screen recordings from Discord conversations',
    permissions: [
      { text: 'Access servers, channels, and threads' },
      { text: 'Send messages in conversations' },
      { text: 'Read basic member and workspace info' },
      { text: 'Receive events for messages and replies' },
    ],
    capabilities: [
      'Request screen recordings from Discord threads and DMs',
      'Share recording links in channels and conversations',
      'Keep recordings linked to the original conversation',
      'Notify teammates when recordings are ready',
    ],
  },
  'Help Scout': {
    name: 'Help Scout',
    description: 'Request screen recordings from Help Scout',
    permissions: [
      { text: 'View mailbox conversations and customers' },
      { text: 'Create replies and internal notes' },
      { text: 'Access mailbox users and teams' },
      { text: 'Receive conversation event notifications' },
    ],
    capabilities: [
      'Request screen recordings from Help Scout conversations',
      'Add recording links to replies and notes',
      'Keep recordings linked to customer threads',
      'Share recording context with teammates',
    ],
  },
  Pylon: {
    name: 'Pylon',
    description: 'Request screen recordings from Pylon',
    permissions: [
      { text: 'View customer conversations and accounts' },
      { text: 'Create replies and internal notes' },
      { text: 'Access teammate and customer details' },
      { text: 'Receive conversation event notifications' },
    ],
    capabilities: [
      'Request screen recordings from Pylon threads',
      'Share recording links in customer conversations',
      'Keep recordings tied to customer accounts',
      'Escalate complete repro context to teammates',
    ],
  },
  Plain: {
    name: 'Plain',
    description: 'Request screen recordings from Plain',
    permissions: [
      { text: 'View customers, threads, and events' },
      { text: 'Create replies and internal notes' },
      { text: 'Access workspace members and teams' },
      { text: 'Receive thread event notifications' },
    ],
    capabilities: [
      'Request screen recordings from Plain support threads',
      'Share recording links in replies and notes',
      'Keep recordings tied to customer timelines',
      'Hand off repro context to teammates',
    ],
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
    capabilities: [
      'Request screen recordings from HubSpot tickets',
      'Link recordings to contacts and companies',
      'Add recording links to ticket notes',
      'Share customer context with support teams',
    ],
  },
  'Salesforce Service Cloud': {
    name: 'Salesforce Service Cloud',
    description: 'Request recordings from Service Cloud cases',
    permissions: [
      { text: 'View and update cases and contacts' },
      { text: 'Add case comments and attachments' },
      { text: 'Access queues, agents, and accounts' },
      { text: 'Receive case status updates' },
    ],
    capabilities: [
      'Request screen recordings from Service Cloud cases',
      'Add recording links to case comments',
      'Keep recordings tied to customer cases',
      'Share visual context with support teams',
    ],
  },
  ClickUp: {
    name: 'ClickUp',
    description: 'Attach screen recordings to ClickUp tasks',
    permissions: [
      { text: 'Read tasks, lists, and spaces' },
      { text: 'Create tasks and add attachments' },
      { text: 'Add comments and update task fields' },
      { text: 'Access workspace members and assignees' },
    ],
    capabilities: [
      'Attach screen recordings to ClickUp tasks',
      'Create tasks with full repro context',
      'Add recording links to task comments',
      'Share customer issues with assigned owners',
    ],
  },
  Sentry: {
    name: 'Sentry',
    description: 'Attach screen recordings to Sentry issues',
    permissions: [
      { text: 'Read projects, issues, and events' },
      { text: 'Add issue comments and attachments' },
      { text: 'Access teams and ownership rules' },
      { text: 'Receive issue status updates' },
    ],
    capabilities: [
      'Attach customer recordings to Sentry issues',
      'Link repro steps to stack traces and events',
      'Add recording context to issue comments',
      'Share visual debugging context with owners',
    ],
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
