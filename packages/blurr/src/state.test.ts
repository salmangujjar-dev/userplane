/**
 * State management tests
 */

import { beforeEach, describe, expect, it } from 'vitest';

import {
  applyBlurFilter,
  clearBlurState,
  extractBlurRadius,
  findAllBlurredElements,
  getBlurStats,
  getCurrentFilter,
  hasBlurState,
  isElementBlurred,
  loadBlurState,
  removeBlurFilter,
  restoreOriginalFilter,
  saveBlurState,
} from './state';

describe('State Management', () => {
  let element: HTMLDivElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  describe('saveBlurState / loadBlurState', () => {
    it('should save and load blur state', () => {
      const state = {
        originalFilter: 'grayscale(100%)',
        blurRadius: 10,
        timestamp: Date.now(),
      };

      saveBlurState(element, state);
      const loaded = loadBlurState(element);

      expect(loaded).not.toBeNull();
      expect(loaded?.originalFilter).toBe(state.originalFilter);
      expect(loaded?.blurRadius).toBe(state.blurRadius);
      expect(loaded?.timestamp).toBe(state.timestamp);
    });

    it('should return null for element without state', () => {
      const loaded = loadBlurState(element);
      expect(loaded).toBeNull();
    });

    it('should handle empty original filter', () => {
      const state = {
        originalFilter: '',
        blurRadius: 5,
        timestamp: Date.now(),
      };

      saveBlurState(element, state);
      const loaded = loadBlurState(element);

      expect(loaded?.originalFilter).toBe('');
    });
  });

  describe('hasBlurState', () => {
    it('should return false for element without state', () => {
      expect(hasBlurState(element)).toBe(false);
    });

    it('should return true for element with state', () => {
      saveBlurState(element, {
        originalFilter: '',
        blurRadius: 5,
        timestamp: Date.now(),
      });

      expect(hasBlurState(element)).toBe(true);
    });
  });

  describe('clearBlurState', () => {
    it('should clear blur state from element', () => {
      saveBlurState(element, {
        originalFilter: '',
        blurRadius: 5,
        timestamp: Date.now(),
      });

      expect(hasBlurState(element)).toBe(true);

      clearBlurState(element);

      expect(hasBlurState(element)).toBe(false);
      expect(loadBlurState(element)).toBeNull();
    });
  });

  describe('applyBlurFilter', () => {
    it('should apply blur filter to element', () => {
      applyBlurFilter(element, 10);
      expect(element.style.filter).toBe('blur(10px)');
    });

    it('should append blur to existing filter', () => {
      element.style.filter = 'grayscale(100%)';
      applyBlurFilter(element, 5);
      expect(element.style.filter).toBe('grayscale(100%) blur(5px)');
    });

    it('should replace existing blur filter', () => {
      element.style.filter = 'blur(3px)';
      applyBlurFilter(element, 10);
      expect(element.style.filter).toBe('blur(10px)');
    });

    it('should replace blur in combined filter', () => {
      element.style.filter = 'grayscale(50%) blur(3px) brightness(1.2)';
      applyBlurFilter(element, 8);
      expect(element.style.filter).toBe('grayscale(50%) blur(8px) brightness(1.2)');
    });
  });

  describe('removeBlurFilter', () => {
    it('should remove blur filter from element', () => {
      element.style.filter = 'blur(10px)';
      removeBlurFilter(element);
      expect(element.style.filter).toBe('');
    });

    it('should preserve other filters when removing blur', () => {
      element.style.filter = 'grayscale(100%) blur(5px) brightness(1.2)';
      removeBlurFilter(element);
      expect(element.style.filter).toBe('grayscale(100%) brightness(1.2)');
    });

    it('should do nothing if no blur filter', () => {
      element.style.filter = 'grayscale(100%)';
      removeBlurFilter(element);
      expect(element.style.filter).toBe('grayscale(100%)');
    });
  });

  describe('restoreOriginalFilter', () => {
    it('should restore original filter and clear state', () => {
      element.style.filter = 'brightness(1.5)';

      saveBlurState(element, {
        originalFilter: 'brightness(1.5)',
        blurRadius: 10,
        timestamp: Date.now(),
      });

      element.style.filter = 'brightness(1.5) blur(10px)';

      restoreOriginalFilter(element);

      expect(element.style.filter).toBe('brightness(1.5)');
      expect(hasBlurState(element)).toBe(false);
    });

    it('should do nothing if no state', () => {
      element.style.filter = 'blur(10px)';
      restoreOriginalFilter(element);
      expect(element.style.filter).toBe('blur(10px)');
    });
  });

  describe('getCurrentFilter', () => {
    it('should return current filter value', () => {
      element.style.filter = 'blur(5px)';
      expect(getCurrentFilter(element)).toBe('blur(5px)');
    });

    it('should return empty string if no filter', () => {
      expect(getCurrentFilter(element)).toBe('');
    });
  });

  describe('isElementBlurred', () => {
    it('should return true if element has blur filter', () => {
      element.style.filter = 'blur(5px)';
      expect(isElementBlurred(element)).toBe(true);
    });

    it('should return true if blur is part of combined filter', () => {
      element.style.filter = 'grayscale(100%) blur(5px)';
      expect(isElementBlurred(element)).toBe(true);
    });

    it('should return false if no blur filter', () => {
      element.style.filter = 'grayscale(100%)';
      expect(isElementBlurred(element)).toBe(false);
    });

    it('should return false if no filter', () => {
      expect(isElementBlurred(element)).toBe(false);
    });
  });

  describe('extractBlurRadius', () => {
    it('should extract blur radius from filter string', () => {
      expect(extractBlurRadius('blur(10px)')).toBe(10);
      expect(extractBlurRadius('blur(5.5px)')).toBe(5.5);
    });

    it('should extract blur from combined filter', () => {
      expect(extractBlurRadius('grayscale(100%) blur(8px) brightness(1.2)')).toBe(8);
    });

    it('should return null if no blur', () => {
      expect(extractBlurRadius('grayscale(100%)')).toBeNull();
      expect(extractBlurRadius('')).toBeNull();
    });
  });

  describe('findAllBlurredElements', () => {
    it('should find all elements with blur state', () => {
      const div1 = document.createElement('div');
      const div2 = document.createElement('div');
      const div3 = document.createElement('div');

      document.body.appendChild(div1);
      document.body.appendChild(div2);
      document.body.appendChild(div3);

      saveBlurState(div1, { originalFilter: '', blurRadius: 5, timestamp: Date.now() });
      saveBlurState(div2, { originalFilter: '', blurRadius: 10, timestamp: Date.now() });

      const blurred = findAllBlurredElements();

      expect(blurred.length).toBe(2);
      expect(blurred).toContain(div1);
      expect(blurred).toContain(div2);
      expect(blurred).not.toContain(div3);
    });

    it('should return empty array if no blurred elements', () => {
      expect(findAllBlurredElements()).toEqual([]);
    });
  });

  describe('getBlurStats', () => {
    it('should return stats for blurred elements', () => {
      const div1 = document.createElement('div');
      const div2 = document.createElement('div');

      document.body.appendChild(div1);
      document.body.appendChild(div2);

      saveBlurState(div1, { originalFilter: '', blurRadius: 5, timestamp: Date.now() });
      saveBlurState(div2, { originalFilter: '', blurRadius: 15, timestamp: Date.now() });

      const stats = getBlurStats();

      expect(stats.totalBlurred).toBe(2);
      expect(stats.avgBlurRadius).toBe(10);
      expect(stats.minBlurRadius).toBe(5);
      expect(stats.maxBlurRadius).toBe(15);
    });

    it('should return zeros if no blurred elements', () => {
      const stats = getBlurStats();

      expect(stats.totalBlurred).toBe(0);
      expect(stats.avgBlurRadius).toBe(0);
      expect(stats.minBlurRadius).toBe(0);
      expect(stats.maxBlurRadius).toBe(0);
    });
  });
});
