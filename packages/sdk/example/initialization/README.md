# Manual Control Example

This example demonstrates programmatic control of the Userplane recorder SDK, allowing you to control exactly when the recorder appears.

## Features

- Manual initialization with `openImmediately: false`
- Programmatic control via JavaScript API
- Interactive UI with status feedback
- Multiple ways to open the recorder
- Real-time status checking

## Files

- `index.html` - HTML structure with controls and demo table
- `script.js` - JavaScript logic for recorder control
- `styles.css` - Styles for control panel and UI components
- `README.md` - This file

## How It Works

### 1. Initialization

The SDK is initialized with `openImmediately: false` to prevent auto-opening:

```javascript
import UserplaneRecorder from '../../dist/sdk.js';

// initialize() returns an instance - capture it!
const Userplane = UserplaneRecorder.initialize({ openImmediately: false });
```

**Important:** `initialize()` is a static method that returns an instance. Make sure to capture the returned instance.

### 2. Manual Control

Use the JavaScript API to control the recorder:

```javascript
// Open with token from URL
Userplane.open();

// Open with custom token
Userplane.open('custom_token_123');

// Close the recorder
Userplane.unmount();

// Check status
Userplane.isRecorderMounted();
Userplane.getInitializationStatus();
```

### 3. Interactive UI

The example provides buttons to:

- Open recorder with URL token
- Open recorder with custom token
- Close the recorder
- Check mount status
- Check initialization status

## Usage

### Local Testing

1. Build the SDK:

```bash
cd packages/sdk
bun run build
```

2. Start the recorder app:

```bash
cd ../../apps/recorder
bun run dev
```

3. Open the example in your browser:

```bash
# With recording token in URL
open example/manual-control/index.html?userplane-action=recording&userplane-token=test123

# Without token (for testing manual token input)
open example/manual-control/index.html
```

### Try These URLs

**With token (can open automatically or manually):**

```
index.html?userplane-action=recording&userplane-token=test_token_123
```

**Without token (requires custom token input):**

```
index.html
```

## Key Concepts

### openImmediately: false

When set to `false`, the recorder will NOT automatically open even if URL parameters are present. This gives you full control over when the recorder appears.

### Deferred Opening

The SDK stores the URL parameters internally, so calling `Userplane.open()` without arguments will use the token from the URL:

```javascript
// URL: ?userplane-action=recording&userplane-token=abc123
Userplane.initialize({ openImmediately: false });

// Later, when ready...
Userplane.open(); // Uses 'abc123' from URL
```

### Custom Token

You can also provide a custom token programmatically:

```javascript
Userplane.open('custom_token_from_api');
```

## Use Cases

### 1. User Confirmation

Ask users before starting a recording:

```javascript
document.getElementById('start-btn').addEventListener('click', () => {
  if (confirm('Start recording session?')) {
    Userplane.open();
  }
});
```

### 2. Analytics Integration

Track when recordings are started:

```javascript
function startRecording() {
  analytics.track('Recording Started');
  Userplane.open();
}
```

### 3. Conditional Loading

Only load recorder under certain conditions:

```javascript
if (user.role === 'customer' && supportCase.priority === 'high') {
  Userplane.open();
}
```

### 4. Dynamic Token Fetching

Fetch tokens from your API:

```javascript
async function startRecordingSession() {
  const response = await fetch('/api/create-recording-session');
  const { token } = await response.json();
  Userplane.open(token);
}
```

## Comparison with Auto-open

| Feature        | Auto-open (Default) | Manual Control         |
| -------------- | ------------------- | ---------------------- |
| URL detection  | Automatic           | Automatic              |
| Opens recorder | Immediately         | When you call `open()` |
| User control   | No                  | Yes                    |
| Use case       | Simple integration  | Advanced control       |

## API Reference

See the main [README.md](../../README.md) for full API documentation.

## Browser Console

The `Userplane` instance is exposed on `window` for debugging:

```javascript
// Check status in console
window.Userplane.isRecorderMounted();

// Open manually from console
window.Userplane.open('test_token');

// Close from console
window.Userplane.unmount();
```

## Notes

- The workspace ID must be present in the meta tag
- The recorder validates the workspace ID against the token
- Multiple workspace IDs are supported
- The SDK is a singleton (only one instance allowed)
