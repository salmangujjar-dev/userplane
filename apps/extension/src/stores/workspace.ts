import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

interface WorkspaceState {
  workspaceId: string | null;
  setWorkspace: (workspaceId: string) => void;
  clearWorkspace: () => void;
}

const chromeStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    const result = await chrome.storage.local.get(name);
    return (result[name] as string | undefined) ?? null;
  },
  setItem: async (name: string, value: string) => {
    await chrome.storage.local.set({ [name]: value });
  },
  removeItem: async (name: string) => {
    await chrome.storage.local.remove(name);
  },
}));

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
        storage: chromeStorage,
        partialize: (state) => ({
          workspaceId: state.workspaceId,
        }),
      }
    ),
    { name: 'WorkspaceStore' }
  )
);

export const useWorkspaceId = (): string | null => useWorkspaceStore((state) => state.workspaceId);

export function useWorkspaceHydrated(): boolean {
  const [hydrated, setHydrated] = useState(useWorkspaceStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useWorkspaceStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);
  return hydrated;
}
