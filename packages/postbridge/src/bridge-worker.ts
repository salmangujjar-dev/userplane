/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * BRIDGE SHAREDWORKER - DUMB RELAY
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * This SharedWorker acts as a message relay for cross-tab broadcasting.
 * It contains ZERO business logic - it only routes messages between tabs.
 *
 * WHY A DUMB RELAY?
 * ────────────────
 * - Business logic stays in tabs (easier debugging, hot-reload friendly)
 * - Worker doesn't need schema updates (generic and reusable)
 * - Reduces serialization overhead (no function transfer needed)
 * - Simplifies architecture (worker is just a router)
 *
 * HOW IT WORKS:
 * ────────────
 * 1. Tabs connect via SharedWorker and get unique tabIDs
 * 2. Each tab registers which methods it supports
 * 3. When a tab broadcasts a method call:
 *    - Worker receives BRIDGE_BROADCAST message
 *    - Worker relays as BRIDGE_RELAY to ALL other tabs (excludes sender)
 * 4. Receiving tabs execute the method locally and fire listeners
 *
 * MESSAGE FLOW:
 * ────────────
 * Tab A: remote.increment(5)
 *   ↓ BRIDGE_BROADCAST { methodName: "increment", args: [5], senderTabID: "A" }
 * Worker: Relay to all tabs except A
 *   ↓ BRIDGE_RELAY to Tab B
 *   ↓ BRIDGE_RELAY to Tab C
 *   ↓ BRIDGE_RELAY to Tab D
 * Tabs B,C,D: Execute increment(5), fire listeners
 *
 * STATE MANAGEMENT:
 * ────────────────
 * Worker maintains a map of connected tabs:
 * {
 *   "tabID1": { port: MessagePort, methods: ["increment", "decrement"] },
 *   "tabID2": { port: MessagePort, methods: ["increment", "decrement"] }
 * }
 *
 * This allows:
 * - Broadcasting to all tabs except sender
 * - Cleanup when tabs disconnect
 * - (Future) Method filtering based on available methods
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
  bridgeActions,
  BridgeBroadcastPayload,
  BridgeCASResponsePayload,
  BridgeCASStatePayload,
  BridgeDirectMessagePayload,
  BridgeDisconnectPayload,
  BridgeGetTabsPayload,
  BridgeHandshakeAckPayload,
  BridgeHandshakeErrorPayload,
  BridgeHandshakePayload,
  BridgeRelayPayload,
  BridgeTabsResponsePayload,
} from './types';

/**
 * Heartbeat Configuration
 * ──────────────────────
 * Configuration for detecting and cleaning up dead connections.
 */
const HEARTBEAT_INTERVAL_MS = 500; // Ping all tabs every 500ms
const HEARTBEAT_TIMEOUT_MS = 500; // Tab must respond within 500ms

/**
 * Tab Connection Info
 * ──────────────────
 * Stores information about a connected tab.
 */
interface TabConnection {
  /** MessagePort for communicating with this tab */
  port: MessagePort;
  /** Array of method names this tab supports */
  methods: string[];
  /** Channel this tab is connected to */
  channel: string;
  /** Timestamp of last pong received (for heartbeat) */
  lastPong: number;
}

/**
 * Versioned Value
 * ──────────────
 * State value with version number for CAS operations.
 */
interface VersionedValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  version: number;
}

/**
 * Channel State
 * ─────────────
 * Isolated state space for a channel.
 * Each channel maintains its own tabs and versioned state.
 */
interface ChannelState {
  /** Tabs connected to this channel */
  tabs: Map<string, TabConnection>;
  /** Versioned shared state for this channel (key -> { value, version }) */
  sharedState: Record<string, VersionedValue>;
}

/**
 * Channels Registry
 * ────────────────
 * Maps channel name → ChannelState for isolated state spaces.
 *
 * Why channels?
 * - Allows multiple independent Bridge connections
 * - Each channel has isolated state (no mixing)
 * - Broadcasts only reach tabs on the same channel
 * - Default channel: "default" for backward compatibility
 */
const channels: Map<string, ChannelState> = new Map();

/**
 * Heartbeat: Ping all tabs and remove dead ones
 * ─────────────────────────────────────────────
 * Sends PING to all connected tabs and checks for tabs that haven't
 * responded with PONG within the timeout period.
 */
function runHeartbeat() {
  const now = Date.now();

  for (const [channelName, channel] of channels.entries()) {
    const deadTabs: string[] = [];

    for (const [tabID, connection] of channel.tabs.entries()) {
      // Check if tab has timed out (no pong received in time)
      if (now - connection.lastPong > HEARTBEAT_INTERVAL_MS + HEARTBEAT_TIMEOUT_MS) {
        console.log(
          `[Bridge Worker] Tab ${tabID} on "${channelName}" timed out (no pong), removing`
        );
        deadTabs.push(tabID);
        continue;
      }

      // Send ping to tab
      try {
        connection.port.postMessage({ action: bridgeActions.BRIDGE_PING, timestamp: now });
      } catch {
        // Port is dead (tab closed/crashed)
        console.log(`[Bridge Worker] Tab ${tabID} on "${channelName}" has dead port, removing`);
        deadTabs.push(tabID);
      }
    }

    // Remove dead tabs
    for (const tabID of deadTabs) {
      channel.tabs.delete(tabID);
      console.log(`[Bridge Worker] Removed dead tab ${tabID} from channel "${channelName}"`);
    }

    // Cleanup empty channels
    if (channel.tabs.size === 0) {
      channels.delete(channelName);
      console.log(`[Bridge Worker] Channel "${channelName}" cleaned up (no live tabs)`);
    }
  }
}

// Start heartbeat interval
setInterval(runHeartbeat, HEARTBEAT_INTERVAL_MS);

/**
 * Get or Create Channel
 * ────────────────────
 * Returns the ChannelState for a given channel name.
 * Creates it if it doesn't exist.
 */
function getOrCreateChannel(channelName: string): ChannelState {
  if (!channels.has(channelName)) {
    channels.set(channelName, {
      tabs: new Map(),
      sharedState: {},
    });
    console.log(`[Bridge Worker] Created channel: ${channelName}`);
  }
  return channels.get(channelName)!;
}

/**
 * SharedWorker Connection Handler
 * ───────────────────────────────
 * Called when a new tab connects to the SharedWorker.
 * Sets up message handling for this tab's port.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(self as any).onconnect = (event: MessageEvent) => {
  const port = event.ports[0];

  // Message handler for this port
  port.onmessage = (event: MessageEvent) => {
    const data = event.data;

    // Handle different message types
    switch (data.action) {
      case bridgeActions.BRIDGE_HANDSHAKE:
        handleHandshake(port, data as BridgeHandshakePayload);
        break;

      case bridgeActions.BRIDGE_BROADCAST:
        handleBroadcast(data as BridgeBroadcastPayload);
        break;

      case bridgeActions.BRIDGE_DISCONNECT:
        handleDisconnect(data as BridgeDisconnectPayload);
        break;

      case bridgeActions.BRIDGE_GET_STATE: {
        // Return current shared state for a specific channel (unwrap versioned values)
        const getStateData = data as { channel: string };
        const getStateChannel = getOrCreateChannel(getStateData.channel || 'default');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unwrappedState: Record<string, any> = {};
        for (const [key, versionedValue] of Object.entries(getStateChannel.sharedState)) {
          unwrappedState[key] = versionedValue.value;
        }
        port.postMessage({
          action: bridgeActions.BRIDGE_STATE_RESPONSE,
          state: unwrappedState,
        });
        break;
      }

      case bridgeActions.BRIDGE_SET_STATE: {
        // Update shared state (last-write-wins) and broadcast to all tabs
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const setStateData = data as { key: string; value: any; channel: string };
        const setStateChannel = getOrCreateChannel(setStateData.channel || 'default');

        // Get or create versioned value
        const existingVersioned = setStateChannel.sharedState[setStateData.key];
        const newVersion = existingVersioned ? existingVersioned.version + 1 : 1;

        setStateChannel.sharedState[setStateData.key] = {
          value: setStateData.value,
          version: newVersion,
        };

        // Broadcast state change to all tabs on this channel (with version)
        const setStateDeadTabs: string[] = [];
        for (const [tabID, connection] of setStateChannel.tabs.entries()) {
          try {
            connection.port.postMessage({
              action: bridgeActions.BRIDGE_STATE_UPDATE,
              key: setStateData.key,
              value: setStateData.value,
              version: newVersion,
            });
          } catch {
            console.log(`[Bridge Worker] Tab ${tabID} has dead port during state broadcast`);
            setStateDeadTabs.push(tabID);
          }
        }
        // Clean up dead tabs
        for (const tabID of setStateDeadTabs) {
          setStateChannel.tabs.delete(tabID);
        }
        break;
      }

      case bridgeActions.BRIDGE_CAS_STATE:
        // Atomic compare-and-swap: only update if version matches
        handleCASState(port, data as BridgeCASStatePayload);
        break;

      case bridgeActions.BRIDGE_GET_TABS:
        // Return list of connected tab IDs for a channel
        handleGetTabs(port, data as BridgeGetTabsPayload);
        break;

      case bridgeActions.BRIDGE_DIRECT_MESSAGE:
        // Relay message to specific tab only
        handleDirectMessage(data as BridgeDirectMessagePayload);
        break;

      default:
        // Handle PONG for heartbeat (action is string, not enum)
        if (data.action === bridgeActions.BRIDGE_PONG) {
          handlePong(data as { action: string; tabID: string; channel: string });
        }
        // Unknown action - ignore
        break;
    }
  };

  // Start the port
  port.start();
};

/**
 * Handle Handshake
 * ───────────────
 * Registers a new tab connection to a specific channel.
 *
 * Flow:
 * 1. Tab sends BRIDGE_HANDSHAKE with tabID, methodNames, channel, and initial state
 * 2. Worker gets or creates the channel
 * 3. Worker stores tab connection in channel's tab registry
 * 4. Worker initializes channel's shared state (if first tab on this channel)
 * 5. Worker sends BRIDGE_HANDSHAKE_ACK with current shared state for this channel
 *
 * @param port The MessagePort for this tab
 * @param payload The handshake payload
 */
function handleHandshake(port: MessagePort, payload: BridgeHandshakePayload) {
  const { tabID, methodNames, channel: channelName = 'default' } = payload;

  // Get or create channel
  const channel = getOrCreateChannel(channelName);

  // Check for duplicate tabID
  if (channel.tabs.has(tabID)) {
    const existingConnection = channel.tabs.get(tabID)!;

    console.warn(
      `[Bridge Worker] Duplicate tabID "${tabID}" on channel "${channelName}". Disconnecting old connection.`
    );

    // Disconnect old connection
    try {
      existingConnection.port.postMessage({
        action: bridgeActions.BRIDGE_HANDSHAKE_ERROR,
        error:
          'This tab ID is already in use by another connection. The old connection has been closed.',
        code: 'DUPLICATE_TAB_ID',
        tabID,
        channel: channelName,
      } as BridgeHandshakeErrorPayload);
      existingConnection.port.close();
    } catch (error) {
      console.error(`[Bridge Worker] Failed to close old connection:`, error);
    }

    // Remove old connection
    channel.tabs.delete(tabID);
  }

  // Register tab connection in this channel
  channel.tabs.set(tabID, {
    port,
    methods: methodNames,
    channel: channelName,
    lastPong: Date.now(), // Initialize with current time
  });

  // Initialize versioned shared state from first tab's schema (if this is the first tab on this channel)
  if (channel.tabs.size === 1 && payload.schema) {
    for (const [key, value] of Object.entries(payload.schema)) {
      if (typeof value !== 'function') {
        channel.sharedState[key] = { value, version: 1 };
      }
    }
  }

  // Unwrap versioned state for handshake response (include versions for client tracking)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unwrappedState: Record<string, any> = {};
  const stateVersions: Record<string, number> = {};
  for (const [key, versionedValue] of Object.entries(channel.sharedState)) {
    unwrappedState[key] = versionedValue.value;
    stateVersions[key] = versionedValue.version;
  }

  // Send acknowledgment with current shared state for this channel
  const ackPayload: BridgeHandshakeAckPayload & { stateVersions?: Record<string, number> } = {
    action: bridgeActions.BRIDGE_HANDSHAKE_ACK,
    tabID,
    channel: channelName,
    sharedState: unwrappedState,
    stateVersions, // Include versions for CAS support
  };
  port.postMessage(ackPayload);

  console.log(
    `[Bridge Worker] Tab ${tabID} connected to channel "${channelName}" with methods:`,
    methodNames
  );
}

/**
 * Handle Broadcast
 * ───────────────
 * Relays a broadcast from one tab to all other tabs ON THE SAME CHANNEL.
 *
 * Flow:
 * 1. Tab A sends BRIDGE_BROADCAST with channel, methodName and args
 * 2. Worker relays as BRIDGE_RELAY to all tabs on same channel EXCEPT Tab A
 * 3. Each receiving tab executes the method locally
 *
 * CHANNEL ISOLATION:
 * Broadcasts only reach tabs on the same channel.
 * Tabs on different channels never receive each other's broadcasts.
 *
 * NO ECHO:
 * The sender is explicitly excluded from receiving the relay.
 * This prevents infinite loops and duplicate execution.
 *
 * @param payload The broadcast payload
 */
function handleBroadcast(payload: BridgeBroadcastPayload) {
  const {
    senderTabID,
    channel: channelName = 'default',
    methodName,
    args,
    result,
    error,
  } = payload;

  // Get the channel (should exist since sender is on it)
  const channel = channels.get(channelName);
  if (!channel) {
    console.error(`[Bridge Worker] Broadcast on non-existent channel: ${channelName}`);
    return;
  }

  // Build relay payload
  const relayPayload: BridgeRelayPayload = {
    action: bridgeActions.BRIDGE_RELAY,
    senderTabID,
    methodName,
    args,
    senderResult: result,
    senderError: error,
  };

  // Broadcast to all tabs on this channel except sender
  let relayCount = 0;
  const deadTabs: string[] = [];

  for (const [tabID, connection] of channel.tabs.entries()) {
    // Skip sender (no echo)
    if (tabID === senderTabID) continue;

    // (Future optimization) Skip tabs that don't have this method
    // if (!connection.methods.includes(methodName)) continue;

    try {
      connection.port.postMessage(relayPayload);
      relayCount++;
    } catch {
      // Port is dead - mark for removal
      console.log(
        `[Bridge Worker] Tab ${tabID} has dead port during broadcast, marking for removal`
      );
      deadTabs.push(tabID);
    }
  }

  // Clean up dead tabs immediately
  for (const tabID of deadTabs) {
    channel.tabs.delete(tabID);
    console.log(`[Bridge Worker] Removed dead tab ${tabID} from channel "${channelName}"`);
  }

  console.log(
    `[Bridge Worker] Relayed ${methodName} from ${senderTabID} to ${relayCount} tabs on channel "${channelName}"`
  );
}

/**
 * Handle Disconnect
 * ────────────────
 * Removes a tab from its channel's tab registry.
 *
 * Flow:
 * 1. Tab sends BRIDGE_DISCONNECT when closing connection
 * 2. Worker removes tab from its channel
 * 3. If channel becomes empty, it's cleaned up
 * 4. Future broadcasts won't be sent to this tab
 *
 * @param payload The disconnect payload
 */
/**
 * Handle Get Tabs
 * ───────────────
 * Returns list of all connected tab IDs on a channel.
 *
 * @param port The MessagePort of the requesting tab
 * @param payload The get tabs payload
 */
function handleGetTabs(port: MessagePort, payload: BridgeGetTabsPayload) {
  const { channel: channelName = 'default', requestingTabID } = payload;

  const channel = channels.get(channelName);
  const tabIDs = channel ? Array.from(channel.tabs.keys()) : [];

  const responsePayload: BridgeTabsResponsePayload = {
    action: bridgeActions.BRIDGE_TABS_RESPONSE,
    tabIDs,
    channel: channelName,
  };

  port.postMessage(responsePayload);

  console.log(
    `[Bridge Worker] Tab ${requestingTabID} requested tabs on channel "${channelName}": [${tabIDs.join(', ')}]`
  );
}

/**
 * Handle Direct Message
 * ────────────────────
 * Relays a message from one tab to a specific target tab only.
 *
 * @param payload The direct message payload
 */
function handleDirectMessage(payload: BridgeDirectMessagePayload) {
  const {
    senderTabID,
    targetTabID,
    channel: channelName = 'default',
    methodName,
    args,
    result,
    error,
  } = payload;

  const channel = channels.get(channelName);
  if (!channel) {
    console.warn(`[Bridge Worker] Channel "${channelName}" not found for direct message`);
    return;
  }

  const targetConnection = channel.tabs.get(targetTabID);
  if (!targetConnection) {
    console.warn(
      `[Bridge Worker] Target tab ${targetTabID} not found on channel "${channelName}" for direct message from ${senderTabID}`
    );
    return;
  }

  // Relay message to target tab
  const relayPayload: BridgeRelayPayload = {
    action: bridgeActions.BRIDGE_RELAY,
    senderTabID,
    methodName,
    args,
    senderResult: result,
    senderError: error,
  };

  try {
    targetConnection.port.postMessage(relayPayload);
    console.log(
      `[Bridge Worker] Relayed direct message "${methodName}" from ${senderTabID} to ${targetTabID} on channel "${channelName}"`
    );
  } catch (err) {
    console.error(`[Bridge Worker] Failed to send direct message to ${targetTabID}:`, err);
  }
}

function handleDisconnect(payload: BridgeDisconnectPayload) {
  const { tabID, channel: channelName = 'default' } = payload;

  const channel = channels.get(channelName);
  if (channel && channel.tabs.has(tabID)) {
    channel.tabs.delete(tabID);
    console.log(`[Bridge Worker] Tab ${tabID} disconnected from channel "${channelName}"`);

    // Cleanup empty channels (optional optimization)
    if (channel.tabs.size === 0) {
      channels.delete(channelName);
      console.log(`[Bridge Worker] Channel "${channelName}" cleaned up (no tabs remaining)`);
    }
  }
}

/**
 * Handle Pong (Heartbeat Response)
 * ───────────────────────────────
 * Updates the lastPong timestamp for a tab, indicating it's still alive.
 *
 * @param payload The pong payload with tabID and channel
 */
function handlePong(payload: { action: string; tabID: string; channel: string }) {
  const { tabID, channel: channelName = 'default' } = payload;

  const channel = channels.get(channelName);
  if (channel && channel.tabs.has(tabID)) {
    const connection = channel.tabs.get(tabID)!;
    connection.lastPong = Date.now();
  }
}

/**
 * Handle CAS (Compare-And-Swap) State
 * ───────────────────────────────────
 * Atomically updates state only if the expected version matches.
 * This enables optimistic concurrency control across tabs.
 *
 * Flow:
 * 1. Tab sends CAS request with { key, expectedVersion, newValue }
 * 2. Worker checks if current version === expectedVersion
 * 3a. If match: Update value, increment version, broadcast to all tabs, respond success
 * 3b. If mismatch: Respond failure with current value/version (no update, no broadcast)
 *
 * @param port The MessagePort of the requesting tab
 * @param payload The CAS request payload
 */
function handleCASState(port: MessagePort, payload: BridgeCASStatePayload) {
  const {
    channel: channelName = 'default',
    key,
    expectedVersion,
    newValue,
    requestID,
    tabID,
  } = payload;

  const channel = channels.get(channelName);
  if (!channel) {
    // Channel doesn't exist - fail CAS
    const response: BridgeCASResponsePayload = {
      action: bridgeActions.BRIDGE_CAS_RESPONSE,
      success: false,
      requestID,
      currentVersion: 0,
      currentValue: undefined,
    };
    port.postMessage(response);
    return;
  }

  const existingVersioned = channel.sharedState[key];
  const currentVersion = existingVersioned?.version ?? 0;
  const currentValue = existingVersioned?.value;

  // Compare version
  if (currentVersion !== expectedVersion) {
    // Version mismatch - CAS failed
    const response: BridgeCASResponsePayload = {
      action: bridgeActions.BRIDGE_CAS_RESPONSE,
      success: false,
      requestID,
      currentVersion,
      currentValue,
    };
    port.postMessage(response);
    console.log(
      `[Bridge Worker] CAS failed for "${key}": expected v${expectedVersion}, current v${currentVersion}`
    );
    return;
  }

  // Version matches - perform atomic swap
  const newVersion = currentVersion + 1;
  channel.sharedState[key] = {
    value: newValue,
    version: newVersion,
  };

  // Send success response to requesting tab
  const response: BridgeCASResponsePayload = {
    action: bridgeActions.BRIDGE_CAS_RESPONSE,
    success: true,
    requestID,
    currentVersion: newVersion,
    currentValue: newValue,
  };
  port.postMessage(response);

  // Broadcast state update to ALL tabs on this channel (including the requester)
  // All tabs need to know about the new value/version for their local caches
  const casDeadTabs: string[] = [];
  for (const [connTabID, connection] of channel.tabs.entries()) {
    try {
      connection.port.postMessage({
        action: bridgeActions.BRIDGE_STATE_UPDATE,
        key,
        value: newValue,
        version: newVersion,
      });
    } catch {
      console.log(`[Bridge Worker] Tab ${connTabID} has dead port during CAS broadcast`);
      casDeadTabs.push(connTabID);
    }
  }
  // Clean up dead tabs
  for (const deadTabID of casDeadTabs) {
    channel.tabs.delete(deadTabID);
  }

  console.log(
    `[Bridge Worker] CAS success for "${key}" by tab ${tabID}: v${expectedVersion} -> v${newVersion}`
  );
}

/**
 * EMBEDDING INSTRUCTIONS:
 * ──────────────────────
 * To embed this worker as a Blob URL, the Bridge client will:
 * 1. Convert this file to a string
 * 2. Create a Blob: new Blob([workerCode], { type: 'application/javascript' })
 * 3. Create URL: URL.createObjectURL(blob)
 * 4. Create SharedWorker: new SharedWorker(url)
 *
 * This enables zero-configuration deployment - no separate worker file needed!
 */
