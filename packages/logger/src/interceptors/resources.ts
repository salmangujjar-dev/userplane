import { LOGGER_NAME } from '../constants';
import { dispatch } from '../dispatcher';
import type { ResourceErrorLogEvent, ResourceLogEvent } from '../types';
import { inferContentType } from '../utils/content-type';
import { extractPerformanceData } from '../utils/performance';

function now(serverDeltaMs: number): number {
  return Date.now() + serverDeltaMs;
}

/**
 * Sets up a PerformanceObserver to track resource loading (CSS, images, fonts, etc.).
 * Skips fetch and XHR entries (those are handled by their own interceptors).
 * Returns the observer for later disconnection.
 */
export function observeResources(serverDeltaMs: number): PerformanceObserver {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      const resEntry = entry as PerformanceResourceTiming;
      // Skip fetch/XHR - those have dedicated interceptors
      if (
        resEntry.initiatorType === 'fetch' ||
        resEntry.initiatorType === 'xmlhttprequest' ||
        entry.entryType !== 'resource'
      ) {
        return;
      }

      try {
        dispatch({
          source: LOGGER_NAME,
          has_focus: __userplane_has_focus,
          type: 'resource',
          url: entry.name,
          initiatorType: resEntry.initiatorType,
          duration: resEntry.duration,
          transferSize: resEntry.transferSize,
          nextHopProtocol: resEntry.nextHopProtocol,
          encodedBodySize: resEntry.encodedBodySize,
          decodedBodySize: resEntry.decodedBodySize,
          domainLookupStart: resEntry.domainLookupStart,
          domainLookupEnd: resEntry.domainLookupEnd,
          connectStart: resEntry.connectStart,
          connectEnd: resEntry.connectEnd,
          secureConnectionStart: resEntry.secureConnectionStart,
          requestStart: resEntry.requestStart,
          responseStart: resEntry.responseStart,
          responseEnd: resEntry.responseEnd,
          timestamp: now(serverDeltaMs),
          headers: {
            contentType: inferContentType(entry.name, resEntry.initiatorType),
          },
        } as ResourceLogEvent);
        // eslint-disable-next-line no-empty -- intentional: resource dispatch is best-effort
      } catch {}
    });
  });

  observer.observe({ entryTypes: ['resource'] });
  try {
    observer.observe({ type: 'resource', buffered: true });
    // eslint-disable-next-line no-empty -- intentional: buffered observer setup is optional
  } catch {}

  return observer;
}

/**
 * Creates and registers a handler for resource load errors
 * (script, img, link, iframe, video, audio, source elements).
 * Returns the handler for later removal.
 */
export function patchResourceErrors(serverDeltaMs: number): (e: Event) => void {
  const handler = (event: Event): void => {
    const target = event.target as Element;

    if (
      !(target instanceof HTMLScriptElement) &&
      !(target instanceof HTMLImageElement) &&
      !(target instanceof HTMLLinkElement) &&
      !(target instanceof HTMLIFrameElement) &&
      !(target instanceof HTMLVideoElement) &&
      !(target instanceof HTMLAudioElement) &&
      !(target instanceof HTMLSourceElement)
    ) {
      return;
    }

    let url = '';
    let tag = target.tagName.toLowerCase();

    if (target instanceof HTMLLinkElement) {
      url = target.href || '';
    } else if (
      target instanceof HTMLImageElement ||
      target instanceof HTMLScriptElement ||
      target instanceof HTMLIFrameElement
    ) {
      url = target.src || '';
    } else if (target instanceof HTMLVideoElement || target instanceof HTMLAudioElement) {
      url = target.currentSrc || target.src || '';
    } else if (target instanceof HTMLSourceElement) {
      url = target.src || (target.parentNode as HTMLMediaElement)?.currentSrc || '';
      tag = (target.parentNode as Element)?.tagName?.toLowerCase() || tag;
    }

    if (!url) return;

    // Try to find matching performance entry
    let perfEntry = (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).find(
      (e) => e.name === url && e.initiatorType === tag
    );
    if (!perfEntry) {
      perfEntry = (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).find(
        (e) => e.name === url
      );
    }

    const logEvent: ResourceErrorLogEvent = {
      source: LOGGER_NAME,
      has_focus: __userplane_has_focus,
      type: 'resource-error',
      tag: tag.toUpperCase(),
      url,
      timestamp: now(serverDeltaMs),
      headers: {
        contentType: inferContentType(url, ''),
      },
    };

    if (perfEntry) {
      logEvent.performance = extractPerformanceData(perfEntry);
    }

    try {
      dispatch(logEvent);
      // eslint-disable-next-line no-empty -- intentional: resource error dispatch is best-effort
    } catch {}
  };

  window.addEventListener('error', handler, true);
  return handler;
}
