# Playground - Userplane React Demo

A complete React application demonstrating Userplane SDK integration with custom metadata.

This app is part of the Userplane monorepo and references the SDK package directly.

## Features

- Customer dashboard with data table
- Stats overview cards
- Custom metadata registration via React hook
- Live metadata preview panel
- Interactive row selection that updates metadata context

## Quick Start

From the monorepo root:

```bash
# Install dependencies
bun install

# Start dev server
cd apps/playground
bun run dev
```

Or from this directory:

```bash
bun run dev
```

Then open http://localhost:5173 with recording parameters:

```
http://localhost:5173?userplane-action=recording&userplane-token=YOUR_TOKEN
```

## Project Structure

```
playground/
├── src/
│   ├── main.jsx          # Entry point (imports SDK)
│   ├── App.jsx           # Main app component
│   ├── index.css         # Styles
│   └── hooks/
│       └── useUserplaneMetadata.js  # Custom hook for metadata
├── index.html            # HTML entry
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies (includes @workspace/sdk)
```

## How Metadata Works

### 1. Import and Initialize the SDK

The SDK is imported in `main.jsx` and auto-initializes:

```jsx
import Userplane from '@workspace/sdk';

// SDK auto-initializes on import
// Workspace IDs are read from meta tags in index.html
```

### 2. Use the Hook

The `useUserplaneMetadata` hook handles registration:

```jsx
import { useUserplaneMetadata } from './hooks/useUserplaneMetadata';

function App() {
  const metadata = useMemo(
    () => ({
      user: { id: user.id, email: user.email },
      context: { page: 'dashboard' },
    }),
    [user]
  );

  useUserplaneMetadata(metadata);

  return <YourApp />;
}
```

### 3. Metadata Updates Automatically

The hook uses a ref to always return the latest metadata when called:

- Metadata object can change on every render
- The callback is registered once
- It always returns current values when recording is submitted

### 4. What Gets Captured

When a user submits a recording, the metadata callback is invoked and returns:

```json
{
  "user": {
    "id": "user_8kL3mN9pQ2",
    "email": "sarah.chen@acme.com",
    "role": "admin",
    "plan": "enterprise"
  },
  "app": {
    "version": "2.4.1",
    "environment": "staging",
    "framework": "react"
  },
  "session": {
    "id": "ses_abc123xyz",
    "startedAt": "2024-01-15T10:30:00.000Z"
  },
  "context": {
    "page": "customers",
    "selectedCustomerId": "cust_003"
  },
  "featureFlags": ["dark_mode", "beta_dashboard", "ai_insights"],
  "capturedAt": "2024-01-15T10:35:42.123Z"
}
```

## Best Practices

1. **Use `useMemo`** for metadata object to prevent unnecessary re-renders
2. **Keep it lightweight** - avoid large objects or frequent updates
3. **Include context** - capture current page, selected items, relevant state
4. **Add timestamps** - helps correlate recordings with logs
5. **Don't include sensitive data** - avoid passwords, tokens, PII
