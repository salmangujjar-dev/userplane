import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface WorkspaceState {
  workspaceId: string | null;
  workspaceName: string | null;
  setWorkspace: (workspaceId: string, workspaceName?: string) => void;
  clearWorkspace: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    (set) => ({
      workspaceId: null,
      workspaceName: null,
      setWorkspace: (workspaceId: string, workspaceName?: string) =>
        set({ workspaceId, workspaceName: workspaceName || null }, false, 'setWorkspace'),
      clearWorkspace: () =>
        set({ workspaceId: null, workspaceName: null }, false, 'clearWorkspace'),
    }),
    { name: 'WorkspaceStore' }
  )
);
