/**
 * LogStore
 * IndexedDB wrapper for persisting processed log entries.
 * One database per session-tab pair with three fixed object stores:
 * 'network', 'console', and 'activity'.
 */

import type { ProcessedLogEntry } from './types';

export type LogStoreType = 'network' | 'console' | 'activity';

const STORE_NAMES: LogStoreType[] = ['network', 'console', 'activity'];
const DB_VERSION = 1;

export class LogStore {
  private db: IDBDatabase | null = null;
  private dbName: string;

  constructor(sessionId: string, tabId: string) {
    this.dbName = `userplane_logs_${sessionId}_${tabId}`;
  }

  async open(): Promise<void> {
    if (this.db) return;

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        for (const storeName of STORE_NAMES) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { autoIncrement: true });
          }
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async append(type: LogStoreType, entry: ProcessedLogEntry): Promise<void> {
    if (!this.db) throw new Error('LogStore not open');

    return new Promise<void>((resolve, reject) => {
      const tx = this.db!.transaction(type, 'readwrite');
      const store = tx.objectStore(type);
      const request = store.add(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(type: LogStoreType): Promise<ProcessedLogEntry[]> {
    if (!this.db) throw new Error('LogStore not open');

    return new Promise<ProcessedLogEntry[]>((resolve, reject) => {
      const tx = this.db!.transaction(type, 'readonly');
      const store = tx.objectStore(type);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as ProcessedLogEntry[]);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllLogs(): Promise<{
    network: ProcessedLogEntry[];
    console: ProcessedLogEntry[];
    activity: ProcessedLogEntry[];
  }> {
    const [network, console, activity] = await Promise.all([
      this.getAll('network'),
      this.getAll('console'),
      this.getAll('activity'),
    ]);
    return { network, console, activity };
  }

  async clear(): Promise<void> {
    if (!this.db) return;

    const promises = STORE_NAMES.map(
      (storeName) =>
        new Promise<void>((resolve, reject) => {
          const tx = this.db!.transaction(storeName, 'readwrite');
          const store = tx.objectStore(storeName);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
    );

    await Promise.all(promises);
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
