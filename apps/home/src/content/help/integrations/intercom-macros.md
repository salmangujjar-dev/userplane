---
title: 'Intercom Macros'
excerpt: 'Use reusable recording links in Intercom macros for quick one-click insertion'
order: 3
lastUpdated: 2026-02-22
---

Intercom macros let agents insert pre-written responses into conversations with a single click. By adding a [reusable recording link](/help/recording-links/reusable-recording-links) to a macro, agents can quickly request screen recordings without creating a new link each time.

## Setting up a macro with a recording link

1. In Userplane, create a **reusable recording link**. Choose the appropriate project and domain.
2. Copy the recording link URL.
3. In Intercom, create a new macro or edit an existing one.
4. Add a message that includes the recording link URL. For example:

   > Hi! To help us troubleshoot this issue, could you record a quick screen capture? Just click this link and follow the instructions: [recording link URL]

5. Save the macro.

## Using the macro

When an agent needs a screen recording from a customer:

1. Open the conversation in Intercom.
2. Insert the macro from the macro menu.
3. Send the message.

Since the link is reusable, every customer who clicks it creates a separate recording. All recordings are tied to the same link and can be viewed from the **Links** page in Userplane.

## Tips

- Create separate macros for different projects or issue types, each with its own reusable link.
- Include a brief explanation in the macro text so the customer knows what to expect.
- Use a branded recording link (with a verified domain) for a more professional experience.

## Attaching metadata via URL parameters

You can append the `userplane-meta` query parameter to a recording link in your macro to automatically attach metadata to every recording created from that macro. This is useful for tagging recordings with the macro name, issue type, or support tier.

For example:

```
https://record.userplane.io/r/abc123?userplane-meta=source%3Dintercom,macro%3Dbug-report
```

This attaches `source: intercom` and `macro: bug-report` to each recording. See [Metadata SDK](/help/developer-docs/metadata-sdk) for the full URL parameter format.

## Related articles

- [Reusable Recording Links](/help/recording-links/reusable-recording-links) — how reusable links work.
- [Using Userplane in Intercom](/help/integrations/intercom-inbox-app) — the inbox sidebar app.
