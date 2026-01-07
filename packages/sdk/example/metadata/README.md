# Custom Metadata Demo

This example demonstrates how to attach custom metadata to Userplane recordings.

## What is Custom Metadata?

Custom metadata allows you to attach application-specific context to recordings. When a user submits a recording, your registered metadata function is called, and the returned data is included with the recording.

Common use cases:

- User identification (ID, email, role)
- Application state (version, environment, feature flags)
- Session information (session ID, duration)
- Business context (account type, subscription tier)

## How to Use

### 1. Register a Metadata Callback

```javascript
Userplane.metadata(() => ({
  user: {
    id: getCurrentUser().id,
    email: getCurrentUser().email,
    role: getCurrentUser().role,
  },
  app: {
    version: APP_VERSION,
    environment: process.env.NODE_ENV,
  },
  session: {
    id: getSessionId(),
    startedAt: sessionStartTime,
  },
  featureFlags: getActiveFeatureFlags(),
}));
```

### 2. Keep It Updated

The callback is called when a recording is submitted, so it always returns current state:

```javascript
// React example
function App() {
  const user = useUser();
  const flags = useFeatureFlags();

  useEffect(() => {
    Userplane.metadata(() => ({
      userId: user?.id,
      featureFlags: flags,
    }));
  }, [user, flags]);

  return <YourApp />;
}
```

### 3. Handle Errors Gracefully

```javascript
Userplane.metadata(() => {
  try {
    return {
      user: getCurrentUser(),
      // ... other data
    };
  } catch (error) {
    // Return fallback data if something fails
    return {
      error: 'Failed to collect metadata',
      timestamp: new Date().toISOString(),
    };
  }
});
```

## Running the Demo

1. Build the SDK:

   ```bash
   bun run build --filter=@workspace/sdk
   ```

2. Serve this directory:

   ```bash
   npx serve .
   # or
   python -m http.server 5500
   ```

3. Open in browser with recording params:

   ```
   http://localhost:5500/index.html?userplane-action=recording&userplane-token=YOUR_TOKEN
   ```

4. Interact with the buttons to see how metadata updates

5. Submit a recording - the custom metadata will be included

## Data Requirements

- Return value must be a plain object (not array, not null)
- All values must be JSON-serializable (no functions, no circular references)
- Keep the callback fast (< 100ms recommended)
- Don't include sensitive data (passwords, tokens, PII you don't want stored)
