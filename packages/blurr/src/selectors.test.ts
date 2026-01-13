/**
 * Selectors tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MASK_SELECTORS,
  UNMASK_SELECTORS,
  getMaskSelectorsString,
  getUnmaskSelectorsString,
  readCustomSelectorsFromMeta,
  getSelectorStats,
} from './selectors';

describe('Selectors', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  describe('MASK_SELECTORS', () => {
    it('should be an array of selector objects', () => {
      expect(Array.isArray(MASK_SELECTORS)).toBe(true);
      expect(MASK_SELECTORS.length).toBeGreaterThan(0);
    });

    it('should have required properties on each selector', () => {
      MASK_SELECTORS.forEach((selector) => {
        expect(selector).toHaveProperty('type', 'mask');
        expect(selector).toHaveProperty('selector');
        expect(selector).toHaveProperty('provider');
        expect(selector).toHaveProperty('description');
        expect(typeof selector.selector).toBe('string');
      });
    });

    it('should include Blurr native selectors', () => {
      const blurrSelectors = MASK_SELECTORS.filter((s) => s.provider === 'Userplane');
      expect(blurrSelectors.length).toBeGreaterThan(0);

      const selectorStrings = blurrSelectors.map((s) => s.selector);
      expect(selectorStrings).toContain('[data-userplane-blur]');
      expect(selectorStrings).toContain('.userplane-mask');
    });

    it('should include FullStory selectors', () => {
      const fsSelectors = MASK_SELECTORS.filter((s) => s.provider === 'FullStory');
      expect(fsSelectors.length).toBeGreaterThan(0);

      const selectorStrings = fsSelectors.map((s) => s.selector);
      expect(selectorStrings).toContain('.fs-mask');
      expect(selectorStrings).toContain('.fs-exclude');
    });

    it('should include Hotjar selectors', () => {
      const hjSelectors = MASK_SELECTORS.filter((s) => s.provider === 'Hotjar');
      expect(hjSelectors.length).toBeGreaterThan(0);

      const selectorStrings = hjSelectors.map((s) => s.selector);
      expect(selectorStrings).toContain('[data-hj-suppress]');
    });

    it('should include rrweb selectors', () => {
      const rrwebSelectors = MASK_SELECTORS.filter((s) => s.provider === 'rrweb');
      expect(rrwebSelectors.length).toBeGreaterThan(0);

      const selectorStrings = rrwebSelectors.map((s) => s.selector);
      expect(selectorStrings).toContain('.rr-mask');
      expect(selectorStrings).toContain('.rr-block');
    });

    it('should include Sentry selectors', () => {
      const sentrySelectors = MASK_SELECTORS.filter((s) => s.provider === 'Sentry');
      expect(sentrySelectors.length).toBeGreaterThan(0);

      const selectorStrings = sentrySelectors.map((s) => s.selector);
      expect(selectorStrings).toContain('.sentry-block');
      expect(selectorStrings).toContain('[data-sentry-mask]');
    });

    it('should have valid CSS selectors', () => {
      MASK_SELECTORS.forEach((selector) => {
        // Should not throw when used with querySelector
        expect(() => {
          document.querySelector(selector.selector);
        }).not.toThrow();
      });
    });
  });

  describe('UNMASK_SELECTORS', () => {
    it('should be an array of selector objects', () => {
      expect(Array.isArray(UNMASK_SELECTORS)).toBe(true);
      expect(UNMASK_SELECTORS.length).toBeGreaterThan(0);
    });

    it('should have type unmask on all selectors', () => {
      UNMASK_SELECTORS.forEach((selector) => {
        expect(selector.type).toBe('unmask');
      });
    });

    it('should include Blurr unmask selectors', () => {
      const blurrUnmask = UNMASK_SELECTORS.filter((s) => s.provider === 'Userplane');
      expect(blurrUnmask.length).toBeGreaterThan(0);

      const selectorStrings = blurrUnmask.map((s) => s.selector);
      expect(selectorStrings).toContain('[data-userplane-blur="false"]');
    });

    it('should include FullStory unmask selector', () => {
      const fsUnmask = UNMASK_SELECTORS.filter((s) => s.provider === 'FullStory');

      const selectorStrings = fsUnmask.map((s) => s.selector);
      expect(selectorStrings).toContain('.fs-unmask');
    });

    it('should have valid CSS selectors', () => {
      UNMASK_SELECTORS.forEach((selector) => {
        expect(() => {
          document.querySelector(selector.selector);
        }).not.toThrow();
      });
    });
  });

  describe('getMaskSelectorsString', () => {
    it('should return comma-separated selector string', () => {
      const result = getMaskSelectorsString();

      expect(typeof result).toBe('string');
      expect(result).toContain('[data-userplane-blur]');
      expect(result).toContain('.fs-mask');
      expect(result).toContain(',');
    });

    it('should include custom selectors', () => {
      const result = getMaskSelectorsString(['.my-custom', '#sensitive-data']);

      expect(result).toContain('.my-custom');
      expect(result).toContain('#sensitive-data');
    });

    it('should deduplicate selectors', () => {
      const result = getMaskSelectorsString(['.fs-mask', '.fs-mask']);

      // Count occurrences of .fs-mask
      const matches = result.match(/\.fs-mask/g) || [];
      expect(matches.length).toBe(1);
    });

    it('should work with empty custom selectors', () => {
      const result = getMaskSelectorsString([]);

      expect(result).toContain('[data-userplane-blur]');
    });
  });

  describe('getUnmaskSelectorsString', () => {
    it('should return comma-separated selector string', () => {
      const result = getUnmaskSelectorsString();

      expect(typeof result).toBe('string');
      expect(result).toContain('[data-userplane-blur="false"]');
      expect(result).toContain('.fs-unmask');
    });
  });

  describe('readCustomSelectorsFromMeta', () => {
    it('should read selectors from meta tags', () => {
      const meta1 = document.createElement('meta');
      meta1.name = 'userplane:blur';
      meta1.content = '.custom-class';
      document.head.appendChild(meta1);

      const meta2 = document.createElement('meta');
      meta2.name = 'userplane:blur';
      meta2.content = '#custom-id';
      document.head.appendChild(meta2);

      const selectors = readCustomSelectorsFromMeta();

      expect(selectors).toContain('.custom-class');
      expect(selectors).toContain('#custom-id');
    });

    it('should return empty array if no meta tags', () => {
      const selectors = readCustomSelectorsFromMeta();

      expect(selectors).toEqual([]);
    });

    it('should filter empty content', () => {
      const meta1 = document.createElement('meta');
      meta1.name = 'userplane:blur';
      meta1.content = '';
      document.head.appendChild(meta1);

      const meta2 = document.createElement('meta');
      meta2.name = 'userplane:blur';
      meta2.content = '   ';
      document.head.appendChild(meta2);

      const meta3 = document.createElement('meta');
      meta3.name = 'userplane:blur';
      meta3.content = '.valid-selector';
      document.head.appendChild(meta3);

      const selectors = readCustomSelectorsFromMeta();

      expect(selectors).toEqual(['.valid-selector']);
    });

    it('should use custom meta name', () => {
      const meta = document.createElement('meta');
      meta.name = 'custom:privacy';
      meta.content = '.secret-data';
      document.head.appendChild(meta);

      const selectors = readCustomSelectorsFromMeta('custom:privacy');

      expect(selectors).toContain('.secret-data');
    });
  });

  describe('getSelectorStats', () => {
    it('should return selector statistics', () => {
      const stats = getSelectorStats();

      expect(stats).toHaveProperty('totalMaskSelectors');
      expect(stats).toHaveProperty('totalUnmaskSelectors');
      expect(stats).toHaveProperty('totalProviders');
      expect(stats).toHaveProperty('maskProviders');
      expect(stats).toHaveProperty('unmaskProviders');
    });

    it('should have correct counts', () => {
      const stats = getSelectorStats();

      expect(stats.totalMaskSelectors).toBe(MASK_SELECTORS.length);
      expect(stats.totalUnmaskSelectors).toBe(UNMASK_SELECTORS.length);
    });

    it('should list providers', () => {
      const stats = getSelectorStats();

      expect(stats.maskProviders).toContain('Userplane');
      expect(stats.maskProviders).toContain('FullStory');
      expect(stats.maskProviders).toContain('Hotjar');
      expect(stats.totalProviders).toBeGreaterThan(10);
    });

    it('should return sorted provider lists', () => {
      const stats = getSelectorStats();

      const sortedMask = [...stats.maskProviders].sort();
      const sortedUnmask = [...stats.unmaskProviders].sort();

      expect(stats.maskProviders).toEqual(sortedMask);
      expect(stats.unmaskProviders).toEqual(sortedUnmask);
    });
  });

  describe('Selector matching', () => {
    it('should match elements with data-userplane-blur', () => {
      const div = document.createElement('div');
      div.setAttribute('data-userplane-blur', 'true');
      document.body.appendChild(div);

      const selector = getMaskSelectorsString();
      const matched = document.querySelector(selector);

      expect(matched).toBe(div);
    });

    it('should match elements with provider classes', () => {
      const fsDiv = document.createElement('div');
      fsDiv.className = 'fs-mask';
      document.body.appendChild(fsDiv);

      const rrDiv = document.createElement('div');
      rrDiv.className = 'rr-block';
      document.body.appendChild(rrDiv);

      const selector = getMaskSelectorsString();
      const matched = document.querySelectorAll(selector);

      expect(matched.length).toBe(2);
    });

    it('should not match unmask selectors in mask query', () => {
      const div = document.createElement('div');
      div.className = 'fs-unmask';
      document.body.appendChild(div);

      const maskSelector = getMaskSelectorsString();
      const matched = document.querySelector(maskSelector);

      expect(matched).toBeNull();
    });
  });
});
