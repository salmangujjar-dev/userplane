export * from './user';
export * from './session';
export * from './account';
export * from './verification';
export * from './relations';
export * from './workspaces';
export * from './projects';
export * from './entitlements';
export * from './workspace-members';
export * from './domains';
export * from './recording-links';
export * from './recordings';

import { user } from './user';
import { session } from './session';
import { account } from './account';
import { verification } from './verification';
import { workspaces } from './workspaces';
import { projects } from './projects';
import { entitlements } from './entitlements';
import { workspaceMembers } from './workspace-members';
import { domains } from './domains';
import { recordingLinks } from './recording-links';
import { recordings } from './recordings';

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

export type RecordingLink = typeof recordingLinks.$inferSelect;
export type NewRecordingLink = typeof recordingLinks.$inferInsert;

export type Recording = typeof recordings.$inferSelect;
export type NewRecording = typeof recordings.$inferInsert;
