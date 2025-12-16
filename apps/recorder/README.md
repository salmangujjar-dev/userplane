# Recorder App

A screen recording application built with Astro and React that integrates with the userplane session API.

## Features

- Screen recording with optional voice capture
- Live preview during recording
- Video thumbnail generation
- Progress tracking during upload
- Workspace branding support
- Recording duration and size constraints
- Automatic session management

## Development

```bash
# Install dependencies (from root)
bun install

# Start development server
cd apps/recorder
bun run dev
```

The recorder will be available at `http://localhost:4322`

## Usage

The recorder expects a `token` query parameter in the URL:

```
http://localhost:4322/?token=YOUR_LINK_TOKEN
```

## Environment Variables

Create a `.env` file in the recorder directory:

```env
PUBLIC_API_URL=http://localhost:3000
```

## Architecture

### Services

- `media-capture.ts` - Handles screen/audio capture using MediaRecorder API
- `recording-session.ts` - Manages session initialization and file uploads using the userplane API

### Utilities

- `video-thumbnail.ts` - Generates thumbnails from video blobs

### Components

- `RecordingApp.tsx` - Main orchestrator component
- `PreRecordingScreen.tsx` - Setup screen for selecting recording mode
- `RecordingInProgressScreen.tsx` - Live preview during recording
- `PostRecordingReviewScreen.tsx` - Review recording before upload
- `PostRecordingUploadScreen.tsx` - Upload progress display
- `PostRecordingAckScreen.tsx` - Success confirmation

### Hooks

- `useRecordingFlow.ts` - State machine for the entire recording flow

## API Integration

The recorder integrates with the userplane session API:

1. `GET /api/v1/session?token=LINK_TOKEN` - Initialize session
2. `POST /api/v1/session` - Initialize upload with presigned URLs
3. Upload files directly to S3 using presigned URLs
4. `PATCH /api/v1/session` - Complete upload

## Browser Support

Requires browsers that support:

- `MediaRecorder` API
- `getDisplayMedia` API
- Modern JavaScript (ES2020+)

Tested on:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14.5+
