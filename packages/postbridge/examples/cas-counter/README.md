# CAS Counter Example

Demonstrates atomic Compare-and-Swap (CAS) operations for race-free updates across browser tabs.

## What This Shows

- **Atomic increments**: No lost updates even with concurrent modifications
- **Conflict detection**: CAS fails if another tab updated first
- **Retry loops**: Automatic retry on conflict with fresh data
- **Version tracking**: Each state value has a monotonic version number

## The Problem CAS Solves

Without CAS, concurrent increments can lose updates:

```
Tab A reads counter = 5
Tab B reads counter = 5
Tab A writes counter = 6
Tab B writes counter = 6  <-- Lost Tab A's update!
```

With CAS:

```
Tab A reads counter = 5, version = 10
Tab B reads counter = 5, version = 10
Tab A CAS(expected=10, new=6) -> SUCCESS, version = 11
Tab B CAS(expected=10, new=6) -> FAIL (version is now 11)
Tab B retries: reads counter = 6, version = 11
Tab B CAS(expected=11, new=7) -> SUCCESS, version = 12
```

## How to Run

1. Build the library:

   ```bash
   cd packages/postbridge
   bun run build
   ```

2. Serve from project root:

   ```bash
   npx serve .
   ```

3. Open multiple tabs to:

   ```
   http://localhost:3000/packages/postbridge/examples/cas-counter/
   ```

4. Click "Increment" rapidly in different tabs and watch the log!

## Key Code

```javascript
// Safe increment with CAS retry loop
async function safeIncrement() {
  while (retries < maxRetries) {
    // Read current value WITH version
    const { value, version } = connection.getVersionedState('counter');

    // Atomic update - only succeeds if version matches
    const result = await connection.compareAndSwap('counter', version, value + 1);

    if (result.success) {
      return result.value;
    }

    // Conflict - retry with fresh data
    retries++;
  }
}
```

## API Used

- `connection.getVersionedState(key)` - Returns `{ value, version }`
- `connection.compareAndSwap(key, expectedVersion, newValue)` - Returns `{ success, value, version }`

## See Also

- [Bridge Guide](../../stories/Guides/Bridge.mdx)
- [Shared State Patterns](../../stories/Guides/SharedStatePatterns.mdx)
- [Understanding Shared State](../../stories/Guides/UnderstandingSharedState.mdx)
