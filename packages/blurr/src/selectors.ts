/**
 * Selector lists for blur and unmask operations
 * Includes support for 40+ third-party tools
 */

import type { SelectorSource } from './types';

/**
 * Selectors that should NEVER be blurred
 * These explicitly opt-out of blurring
 */
export const UNMASK_SELECTORS: SelectorSource[] = [
  // ═══════════════════════════════════════════════════
  // USERPLANE NATIVE
  // ═══════════════════════════════════════════════════
  {
    type: 'unmask',
    selector: '[data-userplane-blur="false"]',
    provider: 'Userplane',
    description: 'Userplane native unmask',
  },
  {
    type: 'unmask',
    selector: '[data-userplane-blur="0"]',
    provider: 'Userplane',
    description: 'Userplane native unmask (numeric)',
  },
  {
    type: 'unmask',
    selector: '[data-userplane-blur="no"]',
    provider: 'Userplane',
    description: 'Userplane native unmask (text)',
  },

  // ═══════════════════════════════════════════════════
  // JAM COMPATIBILITY
  // ═══════════════════════════════════════════════════
  {
    type: 'unmask',
    selector: '[data-jam-blur="false"]',
    provider: 'Jam',
    description: 'Jam compatibility unmask',
  },
  {
    type: 'unmask',
    selector: '[data-jam-blur="0"]',
    provider: 'Jam',
    description: 'Jam compatibility unmask (numeric)',
  },
  {
    type: 'unmask',
    selector: '[data-jam-blur="no"]',
    provider: 'Jam',
    description: 'Jam compatibility unmask (text)',
  },

  // ═══════════════════════════════════════════════════
  // FULLSTORY
  // ═══════════════════════════════════════════════════
  {
    type: 'unmask',
    selector: '.fs-unmask',
    provider: 'FullStory',
    description: 'FullStory unmask class',
  },

  // ═══════════════════════════════════════════════════
  // MICROSOFT CLARITY
  // ═══════════════════════════════════════════════════
  {
    type: 'unmask',
    selector: '[data-clarity-unmask]',
    provider: 'Microsoft Clarity',
    description: 'Clarity unmask attribute',
  },

  // ═══════════════════════════════════════════════════
  // CONTENTSQUARE
  // ═══════════════════════════════════════════════════
  {
    type: 'unmask',
    selector: '[data-cs-capture]',
    provider: 'ContentSquare',
    description: 'ContentSquare capture attribute',
  },

  // ═══════════════════════════════════════════════════
  // AMPLITUDE
  // ═══════════════════════════════════════════════════
  {
    type: 'unmask',
    selector: '[data-amp-unmask]',
    provider: 'Amplitude',
    description: 'Amplitude unmask attribute',
  },
];

/**
 * Selectors that SHOULD be blurred
 * Includes all major analytics and session replay tools
 */
export const MASK_SELECTORS: SelectorSource[] = [
  // ═══════════════════════════════════════════════════
  // USERPLANE NATIVE
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-userplane-blur]',
    provider: 'Userplane',
    description: 'Userplane native mask',
  },
  {
    type: 'mask',
    selector: '[data-userplane-blur="true"]',
    provider: 'Userplane',
    description: 'Userplane native mask (explicit true)',
  },
  {
    type: 'mask',
    selector: '[data-userplane-blur="1"]',
    provider: 'Userplane',
    description: 'Userplane native mask (numeric)',
  },
  {
    type: 'mask',
    selector: '[data-userplane-blur="yes"]',
    provider: 'Userplane',
    description: 'Userplane native mask (text)',
  },
  {
    type: 'mask',
    selector: '.userplane-mask',
    provider: 'Userplane',
    description: 'Userplane native mask class',
  },

  // ═══════════════════════════════════════════════════
  // FULLSTORY
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '.fs-exclude',
    provider: 'FullStory',
    description: 'FullStory exclude class',
  },
  {
    type: 'mask',
    selector: '.fs-block',
    provider: 'FullStory',
    description: 'FullStory block class',
  },
  {
    type: 'mask',
    selector: '.fs-mask',
    provider: 'FullStory',
    description: 'FullStory mask class',
  },
  {
    type: 'mask',
    selector: '.fs-hide',
    provider: 'FullStory',
    description: 'FullStory hide class',
  },

  // ═══════════════════════════════════════════════════
  // HOTJAR
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-hj-suppress]',
    provider: 'Hotjar',
    description: 'Hotjar suppress attribute',
  },
  {
    type: 'mask',
    selector: '[data-hj-masked]',
    provider: 'Hotjar',
    description: 'Hotjar masked attribute',
  },
  {
    type: 'mask',
    selector: '.hj-suppress',
    provider: 'Hotjar',
    description: 'Hotjar suppress class',
  },

  // ═══════════════════════════════════════════════════
  // GENERIC PRIVACY
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-private]',
    provider: 'Generic',
    description: 'Generic private attribute',
  },
  {
    type: 'mask',
    selector: '[data-private="true"]',
    provider: 'Generic',
    description: 'Generic private attribute (explicit)',
  },
  {
    type: 'mask',
    selector: '.private',
    provider: 'Generic',
    description: 'Generic private class',
  },
  {
    type: 'mask',
    selector: '[data-sensitive]',
    provider: 'Generic',
    description: 'Generic sensitive attribute',
  },
  {
    type: 'mask',
    selector: '.sensitive',
    provider: 'Generic',
    description: 'Generic sensitive class',
  },

  // ═══════════════════════════════════════════════════
  // MICROSOFT CLARITY
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-clarity-mask]',
    provider: 'Microsoft Clarity',
    description: 'Clarity mask attribute',
  },
  {
    type: 'mask',
    selector: '.clarity-mask',
    provider: 'Microsoft Clarity',
    description: 'Clarity mask class',
  },

  // ═══════════════════════════════════════════════════
  // SENTRY
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '.sentry-block',
    provider: 'Sentry',
    description: 'Sentry block class',
  },
  {
    type: 'mask',
    selector: '[data-sentry-mask]',
    provider: 'Sentry',
    description: 'Sentry mask attribute',
  },
  {
    type: 'mask',
    selector: '[data-sentry-block]',
    provider: 'Sentry',
    description: 'Sentry block attribute',
  },

  // ═══════════════════════════════════════════════════
  // OPENREPLAY
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-openreplay-obscured]',
    provider: 'OpenReplay',
    description: 'OpenReplay obscured attribute',
  },
  {
    type: 'mask',
    selector: '[data-openreplay-block]',
    provider: 'OpenReplay',
    description: 'OpenReplay block attribute',
  },
  {
    type: 'mask',
    selector: '.openreplay-block',
    provider: 'OpenReplay',
    description: 'OpenReplay block class',
  },

  // ═══════════════════════════════════════════════════
  // HEAP
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-heap-redact-text]',
    provider: 'Heap',
    description: 'Heap redact text attribute',
  },
  {
    type: 'mask',
    selector: '[data-heap-redact-attributes]',
    provider: 'Heap',
    description: 'Heap redact attributes',
  },
  {
    type: 'mask',
    selector: '[data-heap-ignore]',
    provider: 'Heap',
    description: 'Heap ignore attribute',
  },
  {
    type: 'mask',
    selector: '.heap-ignore',
    provider: 'Heap',
    description: 'Heap ignore class',
  },

  // ═══════════════════════════════════════════════════
  // AMPLITUDE
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-amp-mask]',
    provider: 'Amplitude',
    description: 'Amplitude mask attribute',
  },
  {
    type: 'mask',
    selector: '.amp-mask',
    provider: 'Amplitude',
    description: 'Amplitude mask class',
  },

  // ═══════════════════════════════════════════════════
  // RRWEB (SESSION REPLAY)
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '.rr-block',
    provider: 'rrweb',
    description: 'rrweb block class',
  },
  {
    type: 'mask',
    selector: '.rr-mask',
    provider: 'rrweb',
    description: 'rrweb mask class',
  },
  {
    type: 'mask',
    selector: '.rr-ignore',
    provider: 'rrweb',
    description: 'rrweb ignore class',
  },
  {
    type: 'mask',
    selector: '[data-rr-mask]',
    provider: 'rrweb',
    description: 'rrweb mask attribute',
  },

  // ═══════════════════════════════════════════════════
  // LOGROCKET
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-logrocket-hidden]',
    provider: 'LogRocket',
    description: 'LogRocket hidden attribute',
  },
  {
    type: 'mask',
    selector: '.lr-hide',
    provider: 'LogRocket',
    description: 'LogRocket hide class',
  },
  {
    type: 'mask',
    selector: '.lr-block',
    provider: 'LogRocket',
    description: 'LogRocket block class',
  },

  // ═══════════════════════════════════════════════════
  // SMARTLOOK
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-recording-disable]',
    provider: 'Smartlook',
    description: 'Smartlook recording disable',
  },
  {
    type: 'mask',
    selector: '[data-recording-ignore]',
    provider: 'Smartlook',
    description: 'Smartlook recording ignore',
  },

  // ═══════════════════════════════════════════════════
  // MOUSEFLOW
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-mouseflow-mask]',
    provider: 'Mouseflow',
    description: 'Mouseflow mask attribute',
  },
  {
    type: 'mask',
    selector: '.mouseflow-mask',
    provider: 'Mouseflow',
    description: 'Mouseflow mask class',
  },

  // ═══════════════════════════════════════════════════
  // INSPECTLET
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-inspectlet-sensitive]',
    provider: 'Inspectlet',
    description: 'Inspectlet sensitive attribute',
  },
  {
    type: 'mask',
    selector: '.__ipt_sensitive__',
    provider: 'Inspectlet',
    description: 'Inspectlet sensitive class',
  },

  // ═══════════════════════════════════════════════════
  // LUCKY ORANGE
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-lo-mask]',
    provider: 'Lucky Orange',
    description: 'Lucky Orange mask attribute',
  },
  {
    type: 'mask',
    selector: '.lo-mask',
    provider: 'Lucky Orange',
    description: 'Lucky Orange mask class',
  },

  // ═══════════════════════════════════════════════════
  // CONTENTSQUARE
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-cs-mask]',
    provider: 'ContentSquare',
    description: 'ContentSquare mask attribute',
  },

  // ═══════════════════════════════════════════════════
  // QUANTUM METRIC
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-qm-mask]',
    provider: 'Quantum Metric',
    description: 'Quantum Metric mask attribute',
  },

  // ═══════════════════════════════════════════════════
  // GLASSBOX
  // ═══════════════════════════════════════════════════
  {
    type: 'mask',
    selector: '[data-glassbox-mask]',
    provider: 'Glassbox',
    description: 'Glassbox mask attribute',
  },
];

/**
 * Get all mask selectors as a comma-separated string
 */
export function getMaskSelectorsString(customSelectors: string[] = []): string {
  const allSelectors = [...MASK_SELECTORS.map((s) => s.selector), ...customSelectors];

  // Remove duplicates
  const uniqueSelectors = Array.from(new Set(allSelectors));

  return uniqueSelectors.join(', ');
}

/**
 * Get all unmask selectors as a comma-separated string
 */
export function getUnmaskSelectorsString(): string {
  return UNMASK_SELECTORS.map((s) => s.selector).join(', ');
}

/**
 * Read custom selectors from meta tags
 */
export function readCustomSelectorsFromMeta(metaName = 'userplane:blur'): string[] {
  const metaTags = document.querySelectorAll(`meta[name="${metaName}"]`);

  return Array.from(metaTags)
    .map((tag) => tag.getAttribute('content'))
    .filter((content): content is string => !!content && content.trim() !== '');
}

/**
 * Get selector statistics
 */
export function getSelectorStats() {
  const maskProviders = new Set(MASK_SELECTORS.map((s) => s.provider).filter(Boolean));
  const unmaskProviders = new Set(UNMASK_SELECTORS.map((s) => s.provider).filter(Boolean));

  return {
    totalMaskSelectors: MASK_SELECTORS.length,
    totalUnmaskSelectors: UNMASK_SELECTORS.length,
    totalProviders: new Set([...maskProviders, ...unmaskProviders]).size,
    maskProviders: Array.from(maskProviders).sort(),
    unmaskProviders: Array.from(unmaskProviders).sort(),
  };
}
