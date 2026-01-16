import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface WorkspaceState {
  workspaceId: string | null;
  setWorkspace: (workspaceId: string) => void;
  clearWorkspace: () => void;
}

/**
 * Workspace store with persistence and devtools
 * Persists workspace ID across page refreshes
 * Synced with URL params via WorkspaceProvider
 * Workspace details can be fetched from API using the ID
 */
export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    persist(
      (set) => ({
        workspaceId: null,
        setWorkspace: (workspaceId: string) => set({ workspaceId }, false, 'setWorkspace'),
        clearWorkspace: () => set({ workspaceId: null }, false, 'clearWorkspace'),
      }),
      {
        name: 'workspace-storage',
        partialize: (state) => ({
          workspaceId: state.workspaceId,
        }),
      }
    ),
    { name: 'WorkspaceStore' }
  )
);

/**
 * Selector hook for optimized re-renders
 */
export const useWorkspaceId = (): string | null => useWorkspaceStore((state) => state.workspaceId);
