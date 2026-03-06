---
title: 'Sharing Recordings'
excerpt: 'Generate a temporary public link to share a recording with anyone, no login required'
order: 9
lastUpdated: 2026-03-07
---

Once a recording lands in your workspace, you can share it with anyone — including people who don't have a Userplane account. Sharing generates a **public share link** that lets the recipient view the full recording, including the video and all captured technical data, directly in their browser.

Use public sharing when you need to loop in a developer, product manager, or stakeholder who isn't on your Userplane workspace — giving them enough context to understand an issue without adding them to your team. It's well-suited for trusted collaborators: contractors, agency partners, or external engineers you work with regularly but haven't brought into the workspace yet.

Public share links are intentionally short-lived. If you find yourself regenerating links for the same person repeatedly, that's a good signal to [invite them to your workspace](/help/workspace/team-management) instead. Workspace members get direct, long-lived access to recordings without the overhead of expiring links.

## Sharing modes

Userplane supports two ways to share a recording:

| Mode                         | Who can view                                 | Requires a Userplane account |
| ---------------------------- | -------------------------------------------- | ---------------------------- |
| **Share with teammates**     | Anyone with a link who is a workspace member | Yes                          |
| **Share with collaborators** | Anyone with the link                         | No                           |

Use **Share with teammates** when you're referencing a recording within your team. Use **Share with collaborators** to generate a temporary public link for external recipients.

## Generating a public share link

1. Open the recording you want to share from the [Recordings](https://dash.userplane.io/_/recordings) page.
2. Click the **Share** button in the recording detail view.
3. In the sharing modal, select **Share with collaborators**.
4. Choose an expiry duration. The link expires automatically after the selected time. The default is **1 day**.
5. Click **Share** to generate the link.
6. Copy the link and send it to your recipient.

The link is ready to use immediately. Recipients can open it in any browser — no account or login required.

## Expiry options

When generating a public share link, you choose how long it stays active:

| Duration | Seconds   |
| -------- | --------- |
| 1 hour   | 3,600     |
| 6 hours  | 21,600    |
| 12 hours | 43,200    |
| 1 day    | 86,400    |
| 3 days   | 259,200   |
| 7 days   | 604,800   |
| 14 days  | 1,209,600 |

The maximum duration is **14 days**. Once the link expires, it stops working immediately. There is no way to extend or reactivate an expired share link — you will need to generate a new one.

Choose a shorter duration for sensitive recordings or when you need access revoked quickly. Use a longer duration when the recipient may need more time to review or when the recording is being referenced in an external document.

## What recipients see

The shared recording view is a full-featured, read-only playback page. Recipients can:

- Watch the video recording with standard playback controls.
- Inspect the **Console**, **Network**, and **Actions** panels alongside the video — the same data your team sees in the internal recording detail view.
- Re-share the link using the **Share** button in the top navigation, which shows the current link URL and its expiry date.

Recipients cannot edit, delete, or manage the recording in any way. The page includes a **Join** button for anyone who wants to sign up for Userplane.

> **Note:** Which panels are available depends on what data was captured during the recording, which is determined by your [domain recording preferences](/help/recording-links/domain-recording-preferences). A recipient will only see Console logs, Network activity, or Actions if those were enabled for the recording's domain.

## Sharing by email

On plans that support outbound email, you can send the share link directly to one or more email addresses from within the sharing modal. Enter each address and click **Send**. Recipients receive an email with the link and can open it without a Userplane account.

Email sharing is subject to a maximum recipient limit per send. You can always copy the link and send it manually if you need to reach more people.

## What happens when a link expires

When a public share link expires:

- The link stops working immediately.
- Anyone who opens it sees an "Recording link expired" message.
- The underlying recording is not affected — it remains in your workspace and is fully accessible to your team.

To share the recording again after a link has expired, open the recording and generate a new share link.

## Related articles

- [Recording Playback](/help/recording/recording-playback) — the full recording detail view and what each panel shows.
- [Recording Expiry](/help/recording/recording-expiry) — control how long a recording itself remains accessible, separate from share link expiry.
- [Domain Recording Preferences](/help/recording-links/domain-recording-preferences) — configure which data types are captured per domain.
- [Reviewing Recordings](/help/recording/reviewing-recordings) — browse and filter recordings in your workspace.
- [Team Management](/help/workspace/team-management) — invite collaborators to your workspace for long-lived access.
