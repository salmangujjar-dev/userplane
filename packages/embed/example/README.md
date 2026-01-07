# Userplane Embed Example

Simple customer dashboard demonstrating auto-initialization of the Userplane recorder.

## Quick Start

1. Serve the example:

```bash
npx serve .
```

2. Open in browser:

```
http://localhost:3000
```

3. Test with recording parameters:

```
http://localhost:3000?userplane-action=recording&userplane-token=test123
```

## What It Does

When you visit with `userplane-action=recording` and `userplane-token` in the URL:

1. The embed script auto-initializes
2. Detects recording parameters in URL
3. Reads workspace ID from meta tag
4. Automatically mounts the recorder iframe
5. User can record and submit

## Files

- `index.html` - Customer dashboard with workspace meta tag and embed script
- `script.js` - Simple application logic
- `styles.css` - Clean dashboard styling
- `README.md` - This file

## Integration

To integrate into your app:

1. Add workspace meta tag:

```html
<meta name="userplane:workspace" content="ws_YOUR_ID" />
```

2. Add embed script:

```html
<script type="module" src="https://cdn.userplane.com/embed.js"></script>
```

3. Generate recording links server-side with tokens

That's it. The recorder auto-initializes when users visit recording links.

## API Access

The SDK is available at `window.userplane`:

```javascript
// Check if recorder is mounted
window.userplane.isRecorderMounted();

// Manually open/close
window.userplane.open('token');
window.userplane.unmount();

// Get status
window.userplane.getRecordingState();
window.userplane.getSessionId();
```

## Documentation

For full documentation, see [../README.md](../README.md)
