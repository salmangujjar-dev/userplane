/**
 * Manual Control Example Script
 * Demonstrates programmatic control of the Userplane recorder SDK
 */

import UserplaneRecorder from '../../dist/sdk.js';

// Initialize with manual control (prevent auto-opening)
// Capture the instance returned by initialize()
const Userplane = UserplaneRecorder.initialize({ openImmediately: false });

const statusDiv = document.getElementById('status');

/**
 * Update the status display
 * @param {string} message - Status message to display
 * @param {'info' | 'success' | 'error'} type - Status type for styling
 */
function updateStatus(message, type = 'info') {
  statusDiv.className = `status ${type}`;
  statusDiv.textContent = message;
  console.log(`[Example] ${message}`);
}

/**
 * Open recorder using token from URL
 */
function openFromUrl() {
  try {
    const success = Userplane.open();
    if (success) {
      updateStatus('Recorder opened successfully using URL token', 'success');
    } else {
      updateStatus('Failed to open recorder. Check console for details.', 'error');
    }
  } catch (error) {
    updateStatus(`Error: ${error.message}`, 'error');
  }
}

/**
 * Open recorder with custom token from user input
 */
function openWithCustomToken() {
  const customToken = prompt('Enter recording token:', 'custom_test_token_456');
  if (customToken) {
    try {
      const success = Userplane.open(customToken);
      if (success) {
        updateStatus(`Recorder opened with custom token: ${customToken}`, 'success');
      } else {
        updateStatus('Failed to open recorder. Check console for details.', 'error');
      }
    } catch (error) {
      updateStatus(`Error: ${error.message}`, 'error');
    }
  }
}

/**
 * Close the recorder
 */
function closeRecorder() {
  try {
    Userplane.unmount();
    updateStatus('Recorder closed', 'success');
  } catch (error) {
    updateStatus(`Error: ${error.message}`, 'error');
  }
}

/**
 * Check if recorder is currently mounted
 */
function checkStatus() {
  const isMounted = Userplane.isRecorderMounted();
  updateStatus(
    isMounted ? 'Recorder is currently OPEN' : 'Recorder is currently CLOSED',
    isMounted ? 'success' : 'info'
  );
}

/**
 * Check SDK initialization status
 */
function checkInitialization() {
  const isInit = Userplane.getInitializationStatus();
  updateStatus(
    isInit ? 'SDK is INITIALIZED' : 'SDK is NOT INITIALIZED',
    isInit ? 'success' : 'error'
  );
}

// Event listeners
document.getElementById('open-url').addEventListener('click', openFromUrl);
document.getElementById('open-custom').addEventListener('click', openWithCustomToken);
document.getElementById('close').addEventListener('click', closeRecorder);
document.getElementById('check-status').addEventListener('click', checkStatus);
document.getElementById('check-init').addEventListener('click', checkInitialization);

// Expose to window for console access
window.Userplane = Userplane;

// Initial status
updateStatus('SDK initialized with openImmediately: false', 'info');
