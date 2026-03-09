---
title: 'Recording Playback'
excerpt: 'Watch recordings and inspect technical details in the detail view'
order: 7
lastUpdated: 2026-02-22
---

The recording detail view is where you watch a customer's screen recording and review the technical data captured alongside it.

## Layout

The detail view has a **resizable two-panel layout**:

- **Left panel** — the video player. Play, pause, scrub, and resize as needed.
- **Right panel** — tabbed panels for inspecting recording data.

Drag the divider between panels to adjust the split.

## Video player

The video player supports standard playback controls. Recordings are captured using the best codec available in the customer's browser (AV1, VP9, H.264, or VP8). When voice and device audio was captured, audio plays back in sync with the video.

## Right-panel tabs

The right panel contains several tabs, each showing a different type of data:

| Tab         | What it shows                                                                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Info**    | Link details, project, domain, who requested it, customer notes, system metadata, and custom metadata. See [Info Panel](/help/recording/info-panel). |
| **Console** | Browser console logs — errors, warnings, and messages. See [Console & Network Panels](/help/recording/console-and-network-panels).                   |
| **Network** | HTTP requests with timing, status codes, and payloads. See [Console & Network Panels](/help/recording/console-and-network-panels).                   |
| **Actions** | Client-side interactions — clicks, inputs, and page navigations. See [Actions & Backend Panels](/help/recording/actions-and-backend-panels).         |
| **Backend** | Server-side logs, if configured. See [Actions & Backend Panels](/help/recording/actions-and-backend-panels).                                         |

Not all panels appear for every recording. The available panels depend on which data types were captured, which is determined by your [domain recording preferences](/help/recording-links/domain-recording-preferences).

## Navigation bar actions

The top navigation bar provides quick actions for working with the recording:

- **Copy link** — copies a direct link to the recording.
- **Share** — opens the share modal to generate a shareable link.
- **⋮ (more options)** — additional actions including **Issue Analyzer**, **Edit Recording**, and **Delete Recording**.

Use **Issue Analyzer** to generate a structured prompt from the recording's session data — console logs, network requests, user actions, and metadata — ready to paste into any AI assistant to explain or debug the issue. See [Issue Analyzer](/help/recording/issue-analyzer) for details.
