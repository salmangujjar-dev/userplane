# Userplane SDK Example

A minimal customer dashboard showing how to integrate Userplane recorder.

## Files

- `index.html` - Main HTML with meta tag and script
- `styles.css` - Dashboard styling
- `script.js` - Your application code

## Setup

The recorder auto-mounts when you add two things to your HTML:

```html
<!-- 1. Your workspace ID -->
<meta name="userplane:workspace" content="ws_1uOpD71P19LJ" />

<!-- 2. Userplane recorder script -->
<script type="module" src="../dist/sdk.js"></script>
```

That's it! No configuration needed.

## Testing

### Build SDK first:

```bash
cd ..
bun run build
```

### Open without recording:

```bash
open index.html
```

Normal dashboard view.

### Open with recording:

```bash
open "index.html?userplane-action=recording&userplane-token=test123"
```

Recorder will auto-mount!

## How It Works

1. User visits URL with recording parameters
2. SDK detects `userplane-action=recording` and `userplane-token`
3. Reads workspace ID from meta tag
4. Automatically mounts fullscreen recorder iframe
5. User records and submits

## File Structure

```
example/
├── index.html       # Main page with meta tag
├── styles.css       # Dashboard styling
├── script.js          # Your application code
└── README.md       # This file
```

## Programmatic Access

Access the recorder in your JavaScript:

```javascript
// Check if recorder is mounted
if (window.Userplane.recorder.isRecorderMounted()) {
  console.log('Recording in progress');
}

// Unmount programmatically
window.Userplane.recorder.unmount();
```

## Production

For production, change the script URL to your CDN:

```html
<script type="module" src="https://cdn.userplane.com/recorder.js"></script>
```

And use your real workspace ID from the dashboard.
