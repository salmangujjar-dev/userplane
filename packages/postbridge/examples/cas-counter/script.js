// Import from the built library
import { bridge } from '../../dist/index.js';

// DOM elements
const counterEl = document.getElementById('counter');
const versionEl = document.getElementById('version');
const statusEl = document.getElementById('status');
const tabIdEl = document.getElementById('tabId');
const incrementBtn = document.getElementById('incrementBtn');
const resetBtn = document.getElementById('resetBtn');
const logEl = document.getElementById('log');
const clearLogBtn = document.getElementById('clearLogBtn');

// Short tab ID for display
let shortTabId = '...';

// Log helper
function log(message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const time = new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
  entry.innerHTML = `<span class="time">${time}</span><span class="tab">${shortTabId}</span>${message}`;
  logEl.insertBefore(entry, logEl.firstChild);
}

// Update display
function updateDisplay(value, version) {
  counterEl.textContent = value;
  versionEl.textContent = version;
}

// Schema - using CAS for atomic updates
const schema = {
  // Shared state
  counter: 0,

  // Broadcast function to sync UI across tabs
  syncCounter: (value, remote) => {
    remote.counter = value;
    // UI update happens via state sync, but we can also update here
    return value;
  },
};

// Initialize
async function init() {
  try {
    statusEl.textContent = '[CONNECTING] Initializing...';

    // Connect with CAS timeout option
    const connection = await bridge.connect(schema, {
      workerURL: '/packages/postbridge/dist/bridge-worker.js',
      casTimeout: 5000, // 5 second default timeout for CAS operations
    });

    // Connected!
    statusEl.textContent = '[CONNECTED] CAS-protected counter ready';
    statusEl.className = 'status connected';
    shortTabId = connection.id.substring(0, 4);
    tabIdEl.textContent = connection.id.substring(0, 8);

    // Initialize display
    const { value, version } = connection.getVersionedState('counter');
    updateDisplay(value, version);
    log(`Connected. Counter: ${value}, Version: ${version}`);

    /**
     * Safe increment using CAS with retry loop.
     * This guarantees no lost updates even with concurrent modifications.
     */
    async function safeIncrement() {
      const maxRetries = 10;
      let retries = 0;

      while (retries < maxRetries) {
        // Read current value with version
        const { value, version } = connection.getVersionedState('counter');
        const newValue = value + 1;

        log(`Attempting: ${value} -> ${newValue} (v${version})`, 'retry');

        // Atomic compare-and-swap
        const result = await connection.compareAndSwap('counter', version, newValue);

        if (result.success) {
          // Success! Broadcast to update UI in all tabs
          await connection.remote.syncCounter(result.value);
          updateDisplay(result.value, result.version);
          log(`Success: ${value} -> ${result.value} (v${result.version})`, 'success');
          return result.value;
        }

        // Conflict - another tab updated first
        retries++;
        log(`Conflict! Expected v${version}, got v${result.version}. Retrying...`, 'conflict');

        // Update display with current state
        updateDisplay(result.value, result.version);
      }

      log(`Failed after ${maxRetries} retries`, 'conflict');
      throw new Error('Max retries exceeded');
    }

    /**
     * Safe reset using CAS
     */
    async function safeReset() {
      const maxRetries = 5;
      let retries = 0;

      while (retries < maxRetries) {
        const { version } = connection.getVersionedState('counter');
        const result = await connection.compareAndSwap('counter', version, 0);

        if (result.success) {
          await connection.remote.syncCounter(0);
          updateDisplay(0, result.version);
          log(`Reset to 0 (v${result.version})`, 'success');
          return;
        }

        retries++;
        log(`Reset conflict, retrying...`, 'conflict');
      }
    }

    // Wire up buttons
    incrementBtn.onclick = async () => {
      incrementBtn.disabled = true;
      try {
        await safeIncrement();
      } catch (e) {
        log(`Error: ${e.message}`, 'conflict');
      }
      incrementBtn.disabled = false;
    };

    resetBtn.onclick = async () => {
      resetBtn.disabled = true;
      await safeReset();
      resetBtn.disabled = false;
    };

    clearLogBtn.onclick = () => {
      logEl.innerHTML = '';
      log('Log cleared');
    };

    // Enable buttons
    incrementBtn.disabled = false;
    resetBtn.disabled = false;

    // Cleanup on unload
    window.addEventListener('beforeunload', () => connection.close());
  } catch (error) {
    statusEl.textContent = '[ERROR] ' + error.message;
    statusEl.className = 'status error';
    console.error('Connection failed:', error);
  }
}

// Start
init();
