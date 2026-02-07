---
title: 'Recording Limits & Duration'
excerpt: 'Default recording duration, maximum file sizes, and supported video formats'
order: 7
lastUpdated: 2026-02-07
---

Userplane enforces limits on recording duration and file size to ensure reliable capture and playback.

## Recording duration

The default maximum recording duration is **3 minutes** (180 seconds). When a customer reaches the time limit, the recording stops automatically.

The minimum recording duration is **1 second**. Recordings shorter than this are discarded.

## File size limits

| Resource        | Maximum size |
| --------------- | ------------ |
| Video recording | **500 MB**   |
| Thumbnail       | 10 MB        |
| Console logs    | 50 MB        |
| Company logo    | 4 MB         |

## Supported video codecs

Recordings use the best codec available in the customer's browser. Userplane supports the following codecs in priority order:

| Codec     | Notes                                                         |
| --------- | ------------------------------------------------------------- |
| **AV1**   | Best compression, ~30% smaller than VP9. Used when available. |
| **VP9**   | Excellent compression, widely supported.                      |
| **H.264** | Hardware-accelerated, best Safari support.                    |
| **VP8**   | Good compatibility, used as a fallback.                       |

Recordings are captured in **WebM** or **MP4** containers depending on browser support.

## Supported thumbnail formats

Thumbnails are captured as PNG, JPEG, or WebP images.

## Log file formats

| Log type       | Format                          |
| -------------- | ------------------------------- |
| Console logs   | NDJSON (newline-delimited JSON) |
| Network logs   | JSON                            |
| Client actions | JSON                            |
