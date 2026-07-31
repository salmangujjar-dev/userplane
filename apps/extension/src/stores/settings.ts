import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

interface SettingsState {
  autoPopulateUrl: boolean;
  setAutoPopulateUrl: (value: boolean) => void;
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

export const useSettingsStore = create<SettingsState>()(
  devtools(
    persist(
      (set) => ({
        autoPopulateUrl: true,
        setAutoPopulateUrl: (value: boolean) =>
          set({ autoPopulateUrl: value }, false, 'setAutoPopulateUrl'),
      }),
      {
        name: 'settings-storage',
        storage: chromeStorage,
        partialize: (state) => ({
          autoPopulateUrl: state.autoPopulateUrl,
        }),
      }
    ),
    { name: 'SettingsStore' }
  )
);

export const useAutoPopulateUrl = (): boolean => useSettingsStore((state) => state.autoPopulateUrl);

export function useSettingsHydrated(): boolean {
  const [hydrated, setHydrated] = useState(useSettingsStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useSettingsStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);
  return hydrated;
}
