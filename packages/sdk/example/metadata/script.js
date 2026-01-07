/**
 * Custom Metadata Demo
 *
 * Demonstrates how to attach custom metadata to Userplane recordings.
 * The metadata is fetched when a recording is submitted and included
 * in the recording data.
 */

// Simulated application state
const appState = {
  user: {
    id: 'user_123',
    email: 'jane@acme.com',
    name: 'Jane Developer',
    role: 'admin',
  },
  app: {
    version: '2.4.1',
    environment: 'staging',
  },
  session: {
    id: generateSessionId(),
    startedAt: new Date().toISOString(),
  },
  featureFlags: ['dark_mode', 'beta_features'],
};

/**
 * Generate a random session ID
 */
function generateSessionId() {
  return 'ses_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Get the current metadata object
 * This is what will be attached to recordings
 */
function getCurrentMetadata() {
  return {
    user: {
      id: appState.user.id,
      email: appState.user.email,
      role: appState.user.role,
    },
    app: {
      version: appState.app.version,
      environment: appState.app.environment,
    },
    session: {
      id: appState.session.id,
      startedAt: appState.session.startedAt,
      duration: Date.now() - new Date(appState.session.startedAt).getTime(),
    },
    featureFlags: appState.featureFlags,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Update the metadata preview in the UI
 */
function updateMetadataPreview() {
  const preview = document.getElementById('metadata-preview');
  if (preview) {
    preview.textContent = JSON.stringify(getCurrentMetadata(), null, 2);
  }

  // Update session ID display
  const sessionIdEl = document.getElementById('session-id');
  if (sessionIdEl) {
    sessionIdEl.textContent = appState.session.id;
  }

  // Update feature flags display
  const flagsEl = document.getElementById('feature-flags');
  if (flagsEl) {
    flagsEl.textContent = appState.featureFlags.join(', ') || 'none';
  }
}

/**
 * Register the metadata callback with Userplane
 */
let metadataRetryCount = 0;
const MAX_METADATA_RETRIES = 50; // 5 seconds max

function registerMetadata() {
  // Check for window.Userplane instance with metadata method
  if (typeof window.Userplane !== 'undefined' && typeof window.Userplane.metadata === 'function') {
    window.Userplane.metadata(() => {
      console.log('[MetadataDemo] Metadata requested by recorder');
      return getCurrentMetadata();
    });
    console.log('[MetadataDemo] Metadata callback registered with Userplane');
    return;
  }

  // Retry with limit
  metadataRetryCount++;
  if (metadataRetryCount < MAX_METADATA_RETRIES) {
    setTimeout(registerMetadata, 100);
  } else {
    console.warn('[MetadataDemo] Userplane SDK not available after max retries');
  }
}

/**
 * Initialize the demo
 */
function init() {
  console.log('[MetadataDemo] Initializing...');

  // Update UI with initial state
  updateMetadataPreview();

  // Register metadata callback
  registerMetadata();

  // Set up button handlers
  const updateSessionBtn = document.getElementById('update-session');
  if (updateSessionBtn) {
    updateSessionBtn.addEventListener('click', () => {
      appState.session.id = generateSessionId();
      appState.session.startedAt = new Date().toISOString();
      updateMetadataPreview();
      console.log('[MetadataDemo] Session updated:', appState.session.id);
    });
  }

  const toggleFeatureBtn = document.getElementById('toggle-feature');
  if (toggleFeatureBtn) {
    toggleFeatureBtn.addEventListener('click', () => {
      const newFeatureFlag = 'experimental_ui';
      const index = appState.featureFlags.indexOf(newFeatureFlag);

      if (index === -1) {
        appState.featureFlags.push(newFeatureFlag);
        console.log('[MetadataDemo] Feature flag added:', newFeatureFlag);
      } else {
        appState.featureFlags.splice(index, 1);
        console.log('[MetadataDemo] Feature flag removed:', newFeatureFlag);
      }

      updateMetadataPreview();
    });
  }

  console.log('[MetadataDemo] Demo initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
