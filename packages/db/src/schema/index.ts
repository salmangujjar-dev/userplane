export * from './account';
export * from './disputes';
export * from './domains';
export * from './entitlements';
export * from './links';
export * from './projects';
export * from './recordings';
export * from './refunds';
export * from './relations';
export * from './session';
export * from './subscriptions';
export * from './user';
export * from './verification';
export * from './webhook-events';
export * from './workspace-members';
export * from './workspaces';

import { account } from './account';
import { domains } from './domains';
import { entitlements } from './entitlements';
import { links } from './links';
import { projects } from './projects';
import { recordings } from './recordings';
import { session } from './session';
import { subscriptions } from './subscriptions';
import { user } from './user';
import { verification } from './verification';
import { workspaceMembers } from './workspace-members';
import { workspaces } from './workspaces';

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

export type Workspace = typeof workspaces.$inferSelect;
export type NewWorkspace = typeof workspaces.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Entitlement = typeof entitlements.$inferSelect;
export type NewEntitlement = typeof entitlements.$inferInsert;

export type WorkspaceMember = typeof workspaceMembers.$inferSelect;
export type NewWorkspaceMember = typeof workspaceMembers.$inferInsert;

export type Domain = typeof domains.$inferSelect;
export type NewDomain = typeof domains.$inferInsert;

export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;

export type Recording = typeof recordings.$inferSelect;
export type NewRecording = typeof recordings.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
