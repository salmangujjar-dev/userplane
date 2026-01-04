export interface UserToAction {
  id: string;
  name: string;
  email: string;
}

export interface WorkspaceToDeactivate {
  workspaceId: string;
  workspaceName: string;
}

export interface WorkspaceToResetToken {
  workspaceId: string;
  workspaceName: string;
}

export interface WorkspaceDetail {
  workspaceId: string;
  workspaceName: string;
  workspacePlanName: string | null;
  isDeleted: boolean;
  projectCount: number;
  domainCount: number;
  linkCount: number;
  recordingCount: number;
}

export interface WorkspaceMember {
  userId: string;
  userName: string;
  userEmail: string;
  workspaceRole: string;
}
