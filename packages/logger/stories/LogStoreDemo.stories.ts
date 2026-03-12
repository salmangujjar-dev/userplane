import type { Meta, StoryObj } from '@storybook/html-vite';

import { LogStore } from '../src';
import type { LogStoreType } from '../src';

import { escapeHtml, formatTime } from './story-cleanup';

const btnBase =
  'padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-family: system-ui, sans-serif; transition: opacity 0.15s;';

const SESSION_ID = 'storybook-demo';
const TAB_ID = 'tab-1';

const meta: Meta = {
  title: 'Demos/LogStore',
  parameters: {
    docs: {
      description: {
        component:
          'LogStore provides IndexedDB-backed persistence with three object stores — network, console, and action — organized per session and tab.',
      },
    },
  },
};

export default meta;

export const LiveDemo: StoryObj = {
  name: 'IndexedDB Storage',
  render: () => {
    const container = document.createElement('div');
    container.innerHTML = `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 860px;">
        <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 600;">LogStore — IndexedDB Storage</h2>
        <p style="color: #666; margin: 0 0 20px 0; font-size: 14px;">
          LogStore persists log entries in IndexedDB with three stores: <code>network</code>,
          <code>console</code>, and <code>action</code>. Each database is scoped per session + tab.
        </p>

        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
          <button id="btn-add-network" style="${btnBase} border: 1px solid #86efac; background: #f0fdf4; color: #166534;">
            Store Network Entry
          </button>
          <button id="btn-add-console" style="${btnBase} border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8;">
            Store Console Entry
          </button>
          <button id="btn-add-action" style="${btnBase} border: 1px solid #c4b5fd; background: #f5f3ff; color: #5b21b6;">
            Store Action Entry
          </button>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
          <button id="btn-read" style="${btnBase} border: 1px solid #e5e7eb; background: white; color: #374151;">
            Read All
          </button>
          <button id="btn-clear" style="${btnBase} border: 1px solid #e5e7eb; background: white; color: #374151;">
            Clear Stores
          </button>
          <button id="btn-delete" style="${btnBase} border: 1px solid #fca5a5; background: #fef2f2; color: #991b1b;">
            Delete Database
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px;">
          <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #166534;" id="count-network">0</div>
            <div style="font-size: 12px; color: #666;">network</div>
          </div>
          <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #1d4ed8;" id="count-console">0</div>
            <div style="font-size: 12px; color: #666;">console</div>
          </div>
          <div style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #5b21b6;" id="count-action">0</div>
            <div style="font-size: 12px; color: #666;">action</div>
          </div>
        </div>

        <div style="font-size: 11px; color: #888; margin-bottom: 8px;">
          Database: <code>userplane_logs_${SESSION_ID}_${TAB_ID}</code>
        </div>

        <div id="event-log" style="background: #1e1e2e; border-radius: 8px; padding: 16px; min-height: 200px; max-height: 350px; overflow-y: auto; font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace; font-size: 12px; line-height: 1.5;">
          <div style="color: #6c7086;">Store entries and read them back…</div>
        </div>
      </div>
    `;

    const eventLog = container.querySelector('#event-log') as HTMLElement;
    const counts = {
      network: container.querySelector('#count-network') as HTMLElement,
      console: container.querySelector('#count-console') as HTMLElement,
      action: container.querySelector('#count-action') as HTMLElement,
    };

    let store: LogStore | null = null;
    let seq = 0;

    const TYPE_COLORS: Record<string, string> = {
      network: '#89dceb',
      console: '#89b4fa',
      action: '#cba6f7',
    };

    const log = (msg: string, color = '#cdd6f4') => {
      const line = document.createElement('div');
      line.style.cssText = `padding: 4px 0; color: ${color};`;
      line.innerHTML = `<span style="color: #585b70;">${formatTime()}</span> ${escapeHtml(msg)}`;
      eventLog.appendChild(line);
      eventLog.scrollTop = eventLog.scrollHeight;
    };

    const ensureStore = async (): Promise<LogStore> => {
      if (!store) {
        store = new LogStore(SESSION_ID, TAB_ID);
        await store.open();
        log('Database opened', '#a6e3a1');
      }
      return store;
    };

    const updateCounts = async () => {
      const s = await ensureStore();
      const all = await s.getAllLogs();
      counts.network.textContent = String(all.network.length);
      counts.console.textContent = String(all.console.length);
      counts.action.textContent = String(all.action.length);
    };

    const addEntry = async (type: LogStoreType, entry: any) => {
      const s = await ensureStore();
      await s.append(type, entry);
      log(`Stored ${type} entry: ${JSON.stringify(entry).substring(0, 100)}`, TYPE_COLORS[type]);
      await updateCounts();
    };

    container.querySelector('#btn-add-network')!.addEventListener('click', () => {
      seq++;
      addEntry('network', {
        url: `/api/users/${seq}`,
        method: 'GET',
        status: 200,
        statusText: 'OK',
        duration: Math.floor(Math.random() * 300) + 20,
        timestamp: Date.now(),
      });
    });

    container.querySelector('#btn-add-console')!.addEventListener('click', () => {
      seq++;
      addEntry('console', {
        level: ['log', 'warn', 'error', 'info'][seq % 4],
        args: [`Message #${seq}`, { detail: 'sample data' }],
        timestamp: Date.now(),
      });
    });

    container.querySelector('#btn-add-action')!.addEventListener('click', () => {
      seq++;
      addEntry('action', {
        action: 'click',
        element: { tagName: 'BUTTON', id: `btn-${seq}` },
        x: Math.floor(Math.random() * 800),
        y: Math.floor(Math.random() * 600),
        timestamp: Date.now(),
      });
    });

    container.querySelector('#btn-read')!.addEventListener('click', async () => {
      const s = await ensureStore();
      const all = await s.getAllLogs();
      eventLog.innerHTML = '';
      log(
        `Read all: ${all.network.length} network, ${all.console.length} console, ${all.action.length} action`,
        '#a6e3a1'
      );

      const allEntries = [
        ...all.network.map((e: any) => ({ ...e, _type: 'network' })),
        ...all.console.map((e: any) => ({ ...e, _type: 'console' })),
        ...all.action.map((e: any) => ({ ...e, _type: 'action' })),
      ].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

      for (const entry of allEntries) {
        const type = entry._type;
        const color = TYPE_COLORS[type] || '#cdd6f4';
        const preview = JSON.stringify(entry, null, 2).substring(0, 150);
        log(`[${type}] ${preview}`, color);
      }
    });

    container.querySelector('#btn-clear')!.addEventListener('click', async () => {
      const s = await ensureStore();
      await s.clear();
      log('All stores cleared', '#f9e2af');
      await updateCounts();
    });

    container.querySelector('#btn-delete')!.addEventListener('click', async () => {
      if (store) {
        await store.deleteDatabase();
        store = null;
        log('Database deleted', '#f38ba8');
        counts.network.textContent = '0';
        counts.console.textContent = '0';
        counts.action.textContent = '0';
      } else {
        log('No database to delete', '#585b70');
      }
    });

    // Initialize counts
    ensureStore().then(() => updateCounts());

    return container;
  },
};
