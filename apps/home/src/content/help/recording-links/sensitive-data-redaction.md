---
title: 'Sensitive Data Redaction'
excerpt: 'Protect customer privacy by blurring sensitive content in recordings'
order: 6
lastUpdated: 2026-02-07
---

When you collect screen recordings from customers, those recordings might capture sensitive information — passwords, credit card numbers, personal details, or internal data your customers wouldn't want shared. Userplane's blur feature ensures this kind of content is automatically obscured so your team only sees what they need to troubleshoot the issue.

## How blurring works

Sensitive content is blurred directly in the recording. The element is still visible in the video, but its contents are obscured so text and images can't be read. The blur is adaptive — it adjusts its intensity based on the size of the content, so small text and large images are both properly obscured.

Blurring happens at capture time, which means sensitive data is never recorded in a readable state.

## Automatic blurring

Userplane automatically recognizes and blurs common sensitive elements without any extra setup. When the **Hide sensitive fields** preference is enabled for a domain, elements like password fields and credit card inputs are blurred by default.

If you're already using another session replay or analytics tool — like FullStory, Hotjar, Sentry, LogRocket, or Clarity — Userplane recognizes the privacy attributes you've already added for those tools. This means elements you've already marked as sensitive in your existing setup are automatically blurred in Userplane recordings too, with no additional work.

## Marking elements for blur

Your development team can mark specific elements to be blurred in recordings. There are a few ways to do this:

### Data attribute

Add `data-userplane-blur` to any HTML element to blur it and its children in recordings.

```html
<div data-userplane-blur>
  <p>This content will be blurred in the recording.</p>
</div>
```

### CSS class

Add the `userplane-mask` class to any element you want blurred.

```html
<div class="userplane-mask">
  <p>This content will also be blurred.</p>
</div>
```

### Meta tags

For broader control, your development team can define blur targets using meta tags in the page's `<head>`. This is useful when you want to blur entire sections without modifying individual elements.

```html
<meta name="userplane:blur" content=".customer-details, .billing-info" />
```

Any element matching those CSS selectors will be blurred during recording.

## Excluding elements from blur

If an element is being blurred but shouldn't be, it can be explicitly excluded:

```html
<div data-userplane-blur="false">
  <p>This content will not be blurred, even if a parent is marked for blur.</p>
</div>
```

## Third-party tool compatibility

If you're already using privacy attributes from other tools, Userplane respects them automatically. Supported tools include FullStory, Hotjar, Sentry, OpenReplay, Heap, Amplitude, LogRocket, Microsoft Clarity, ContentSquare, Smartlook, Mouseflow, Inspectlet, Lucky Orange, and others.

For example, if your page already uses `data-hj-suppress` for Hotjar or `.sentry-block` for Sentry, those elements will be blurred in Userplane recordings automatically.

## Enabling automatic redaction

Automatic blur is controlled per domain. Go to **Workspace Settings > Domains**, select a verified domain, and enable the **Hide sensitive fields** preference. See [Domain Recording Preferences](/help/recording-links/domain-recording-preferences) for details.

## Related articles

- [Domain Recording Preferences](/help/recording-links/domain-recording-preferences) — enable or disable automatic redaction per domain.
- [Sensitive Data Redaction — Developer Guide](/help/developer-docs/sensitive-data-redaction) — detailed integration guide for developers implementing blur.
- [Web SDK](/help/developer-docs/web-sdk) — SDK integration and setup.
