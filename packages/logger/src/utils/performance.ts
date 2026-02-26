import type { NetworkResponseInfo, PerformanceData } from '../types';

/**
 * Looks up the PerformanceResourceTiming entry for a given URL
 * and enriches the response object with performance data.
 */
export function enrichWithPerformance(
  url: string,
  initiatorType: string,
  response: NetworkResponseInfo
): void {
  let absoluteUrl: string;
  try {
    absoluteUrl = new URL(url, window.location.href).href;
  } catch {
    absoluteUrl = url;
  }

  const entries = performance.getEntriesByName(
    absoluteUrl,
    'resource'
  ) as PerformanceResourceTiming[];
  const entry = entries.length
    ? entries.find((e) => e.initiatorType === initiatorType) || entries[entries.length - 1]
    : null;

  if (entry) {
    response.performance = extractPerformanceData(entry);
  }
}

/**
 * Extracts performance data from a PerformanceResourceTiming entry.
 */
export function extractPerformanceData(entry: PerformanceResourceTiming): PerformanceData {
  return {
    nextHopProtocol: entry.nextHopProtocol,
    encodedBodySize: entry.encodedBodySize,
    decodedBodySize: entry.decodedBodySize,
    transferSize: entry.transferSize,
    domainLookupStart: entry.domainLookupStart,
    domainLookupEnd: entry.domainLookupEnd,
    connectStart: entry.connectStart,
    connectEnd: entry.connectEnd,
    secureConnectionStart: entry.secureConnectionStart,
    requestStart: entry.requestStart,
    responseStart: entry.responseStart,
    responseEnd: entry.responseEnd,
    startTime: entry.startTime,
    duration: entry.duration,
  };
}
