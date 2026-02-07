---
title: 'Invite Policies'
excerpt: 'Control how new members join your workspace — private, whitelisted, or protected'
order: 7
lastUpdated: 2026-02-07
---

Your workspace's invite policy determines how new people can discover and join your workspace.

## Policy types

| Policy          | Discoverable | How people join                                                                                                                    |
| --------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Private**     | No           | Only explicit invitations. The workspace does not appear in search or suggestions.                                                 |
| **Whitelisted** | Yes          | People with an email address matching a whitelisted domain can join directly. Others need an explicit invitation.                  |
| **Protected**   | Yes          | People with a matching email domain can **request access**. An owner must approve the request. Others need an explicit invitation. |

## Setting your invite policy

1. Go to [Workspace Settings > General](https://dash.userplane.io/_/settings?tab=workspace).
2. Select the invite policy.
3. If using **Whitelisted** or **Protected**, add the email domains you want to allow (e.g. `example.com`).

## Email domains

You can whitelist up to **5 email domains**. Only people with email addresses matching one of these domains can auto-join (whitelisted) or request access (protected).

For example, if you whitelist `acme.com`, anyone with an `@acme.com` email address can join or request access depending on your policy.

## Rotating the invite token

If you need to invalidate existing invitation links, you can rotate your workspace's invite token from the settings page. This invalidates all pending invitations and generates a new token.

## Related articles

- [Team Management](/help/workspace/team-management) — invite and manage members.
- [Access Management](/help/workspace/access-management) — approve or decline access requests (protected policy).
- [Roles & Permissions](/help/workspace/roles-and-permissions) — what each role can do.
