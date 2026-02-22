---
title: 'Recording Data Reference'
excerpt: 'Technical reference for all data captured in a recording — video, logs, actions, and metadata'
order: 4
lastUpdated: 2026-02-22
---

This reference documents all data types that can be captured during a Userplane recording and their formats.

## Video

The screen recording video is the primary data type.

**Supported codecs (priority order):**

| Codec | Container | Notes                                                              |
| ----- | --------- | ------------------------------------------------------------------ |
| AV1   | WebM, MP4 | Best compression (~30% better than VP9). Preferred when available. |
| VP9   | WebM      | Excellent compression, widely supported in modern browsers.        |
| H.264 | WebM, MP4 | Hardware-accelerated encoding, best Safari compatibility.          |
| VP8   | WebM      | Good compatibility, used as a fallback.                            |

**Limits:**

- Maximum file size: **500 MB**
- Default maximum duration: **3 minutes** (180 seconds)
- Minimum duration: **1 second**

## Thumbnails

A thumbnail image is captured for each recording and displayed in the grid view.

- **Formats:** PNG, JPEG, WebP
- **Maximum size:** 10 MB

## Audio

When voice and device audio capture is enabled in [domain recording preferences](/help/recording-links/domain-recording-preferences), the user's microphone input and system audio are recorded alongside the video.

- **Format:** WebM (Opus codec)
- **Maximum size:** 50 MB
- **Controlled by:** `recordingCaptureAudio` domain preference

## Console logs

Browser console output captured during the recording.

- **Format:** NDJSON (newline-delimited JSON)
- **Maximum size:** 50 MB
- **Includes:** Errors, warnings, log messages, and other console output
- **Controlled by:** `recordingCaptureClientLog` domain preference

## Network logs

HTTP request and response data captured during the recording.

- **Format:** JSON
- **Includes:** Request URL, method, status code, timing, headers
- **Controlled by:** `recordingCaptureNetworkLog` domain preference

## Client actions

User interactions captured during the recording.

- **Format:** JSON
- **Includes:** Clicks (element, coordinates), inputs (field identifiers), page navigations (URL changes)
- **Controlled by:** `recordingCaptureClientAction` domain preference

## Backend logs

Server-side logs forwarded during the recording session.

- **Format:** JSON
- **Controlled by:** `recordingCaptureServerLog` domain preference

## System metadata

Automatically collected from the customer's browser:

| Field            | Description                                        |
| ---------------- | -------------------------------------------------- |
| Browser          | Browser name and version                           |
| Operating system | OS name and version                                |
| Page URL         | The URL the customer was on when recording started |

## Custom metadata

Key-value pairs attached to a recording via the [Metadata SDK](/help/developer-docs/metadata-sdk) or the `userplane-meta` URL parameter:

- Set dynamically with `metadata(callback)` (SDK)
- Set statically with `set(key, value)` (SDK)
- Passed via URL with `?userplane-meta=key1%3Dval1,key2%3Dval2`
- Cleared with `clearMetadata()` (SDK only)

When both methods are used, values are merged. SDK values take priority for the same key.

Custom metadata appears in the [Info Panel](/help/recording/info-panel) alongside system metadata.

## Customer notes

Free-text notes submitted by the recording customer. Customers can optionally add a note when they finish recording to describe what they were doing or what they expected to happen. Notes appear in the Info Panel between link info and system metadata.

## Data capture controls

What data is captured depends on your [domain recording preferences](/help/recording-links/domain-recording-preferences):

| Preference                     | Controls                        |
| ------------------------------ | ------------------------------- |
| `recordingHideSensitive`       | Auto-blur sensitive form fields |
| `recordingCaptureClientLog`    | Console log capture             |
| `recordingCaptureClientAction` | Client action capture           |
| `recordingCaptureNetworkLog`   | Network log capture             |
| `recordingCaptureServerLog`    | Backend log capture             |
| `recordingCaptureAudio`        | Voice and device audio capture  |

These preferences are configured per verified domain in Workspace Settings.
