import type { BlurManager } from '../src';

// Shared tracker for active BlurManager instances across all story files.
// Ensures previous managers are stopped when Storybook re-renders or switches stories.
let activeManagers: BlurManager[] = [];

export function trackManager(manager: BlurManager): BlurManager {
  activeManagers.forEach((m) => m.stop());
  activeManagers = [manager];
  return manager;
}

export function trackManagers(managers: BlurManager[]): void {
  activeManagers.forEach((m) => m.stop());
  activeManagers = managers;
}
