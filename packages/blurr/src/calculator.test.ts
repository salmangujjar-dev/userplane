/**
 * Blur calculator tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateBlurRadius,
  analyzeElement,
  analyzeTextSize,
  analyzeMediaDimensions,
  calculateBlurForContentType,
  isInViewport,
  getElementDimensions,
} from './calculator';
import { DEFAULTS } from './constants';

describe('Calculator', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('calculateBlurRadius', () => {
    it('should return minimum blur for empty element', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      const radius = calculateBlurRadius(div);

      expect(radius).toBe(DEFAULTS.MIN_BLUR_RADIUS);
    });

    it('should calculate blur based on text size', () => {
      const div = document.createElement('div');
      div.style.fontSize = '32px';
      div.textContent = 'Large text';
      document.body.appendChild(div);

      const radius = calculateBlurRadius(div);

      expect(radius).toBeGreaterThan(DEFAULTS.MIN_BLUR_RADIUS);
    });

    it('should respect minBlurRadius option', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      const radius = calculateBlurRadius(div, { minBlurRadius: 10 });

      expect(radius).toBe(10);
    });

    it('should respect maxBlurRadius option', () => {
      const div = document.createElement('div');
      div.style.fontSize = '200px';
      div.textContent = 'Huge text';
      document.body.appendChild(div);

      const radius = calculateBlurRadius(div, { maxBlurRadius: 15 });

      expect(radius).toBeLessThanOrEqual(15);
    });
  });

  describe('analyzeElement', () => {
    it('should return element analysis', () => {
      const div = document.createElement('div');
      div.style.fontSize = '24px';
      div.textContent = 'Content';
      document.body.appendChild(div);

      const analysis = analyzeElement(div);

      expect(analysis).toHaveProperty('blurRadius');
      expect(analysis).toHaveProperty('textBlur');
      expect(analysis).toHaveProperty('mediaBlur');
      expect(analysis.blurRadius).toBeGreaterThanOrEqual(DEFAULTS.MIN_BLUR_RADIUS);
    });
  });

  describe('analyzeTextSize', () => {
    it('should analyze text nodes', () => {
      const div = document.createElement('div');
      div.style.fontSize = '16px';
      div.textContent = 'Sample text';
      document.body.appendChild(div);

      const blur = analyzeTextSize(div);

      expect(blur).toBeGreaterThanOrEqual(DEFAULTS.MIN_BLUR_RADIUS);
    });

    it('should find largest font size in nested elements', () => {
      const parent = document.createElement('div');
      parent.style.fontSize = '12px';

      const child = document.createElement('span');
      child.style.fontSize = '32px';
      child.textContent = 'Large';

      parent.appendChild(child);
      parent.appendChild(document.createTextNode('Small'));
      document.body.appendChild(parent);

      const blur = analyzeTextSize(parent);

      // Should be based on 32px, not 12px
      expect(blur).toBeGreaterThan(DEFAULTS.MIN_BLUR_RADIUS);
    });

    it('should use custom divisor option', () => {
      const div = document.createElement('div');
      div.style.fontSize = '24px';
      div.textContent = 'Text';
      document.body.appendChild(div);

      const defaultBlur = analyzeTextSize(div);
      const customBlur = analyzeTextSize(div, { textBlurDivisor: 2 });

      // Smaller divisor = larger blur
      expect(customBlur).toBeGreaterThan(defaultBlur);
    });
  });

  describe('analyzeMediaDimensions', () => {
    it('should return min blur for element without media', () => {
      const div = document.createElement('div');
      div.textContent = 'No media';
      document.body.appendChild(div);

      const blur = analyzeMediaDimensions(div);

      expect(blur).toBe(DEFAULTS.MIN_BLUR_RADIUS);
    });

    it('should analyze image dimensions', () => {
      const div = document.createElement('div');
      const img = document.createElement('img');
      // Set natural dimensions
      Object.defineProperty(img, 'width', { value: 400 });
      Object.defineProperty(img, 'height', { value: 300 });

      div.appendChild(img);
      document.body.appendChild(div);

      const blur = analyzeMediaDimensions(div);

      expect(blur).toBeGreaterThanOrEqual(DEFAULTS.MIN_BLUR_RADIUS);
    });

    it('should analyze canvas dimensions', () => {
      const div = document.createElement('div');
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 400;

      div.appendChild(canvas);
      document.body.appendChild(div);

      const blur = analyzeMediaDimensions(div);

      expect(blur).toBeGreaterThanOrEqual(DEFAULTS.MIN_BLUR_RADIUS);
    });
  });

  describe('calculateBlurForContentType', () => {
    it('should calculate blur for text content', () => {
      const blur = calculateBlurForContentType('text', 24);

      expect(blur).toBeGreaterThanOrEqual(DEFAULTS.MIN_BLUR_RADIUS);
    });

    it('should calculate blur for image content', () => {
      const blur = calculateBlurForContentType('image', 400);

      expect(blur).toBeGreaterThanOrEqual(DEFAULTS.MIN_BLUR_RADIUS);
    });

    it('should calculate blur for video content', () => {
      const blur = calculateBlurForContentType('video', 1920);

      expect(blur).toBeGreaterThanOrEqual(DEFAULTS.MIN_BLUR_RADIUS);
    });

    it('should calculate blur for mixed content', () => {
      const blur = calculateBlurForContentType('mixed', 200);

      expect(blur).toBeGreaterThanOrEqual(DEFAULTS.MIN_BLUR_RADIUS);
    });

    it('should return min blur for unknown content type', () => {
      const blur = calculateBlurForContentType('unknown' as any, 100);

      expect(blur).toBe(DEFAULTS.MIN_BLUR_RADIUS);
    });
  });

  describe('isInViewport', () => {
    it('should return true for element in viewport', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      // Mock getBoundingClientRect for JSDOM
      div.getBoundingClientRect = () => ({
        top: 100,
        bottom: 200,
        left: 100,
        right: 200,
        width: 100,
        height: 100,
        x: 100,
        y: 100,
        toJSON: () => {},
      });

      expect(isInViewport(div)).toBe(true);
    });

    it('should return false for element outside viewport', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      // Mock getBoundingClientRect for element outside viewport
      div.getBoundingClientRect = () => ({
        top: -1000,
        bottom: -900,
        left: -1000,
        right: -900,
        width: 100,
        height: 100,
        x: -1000,
        y: -1000,
        toJSON: () => {},
      });

      expect(isInViewport(div)).toBe(false);
    });

    it('should return false for element below viewport', () => {
      const div = document.createElement('div');
      document.body.appendChild(div);

      div.getBoundingClientRect = () => ({
        top: 2000,
        bottom: 2100,
        left: 100,
        right: 200,
        width: 100,
        height: 100,
        x: 100,
        y: 2000,
        toJSON: () => {},
      });

      expect(isInViewport(div)).toBe(false);
    });
  });

  describe('getElementDimensions', () => {
    it('should return element dimensions', () => {
      const div = document.createElement('div');
      div.style.width = '200px';
      div.style.height = '100px';
      document.body.appendChild(div);

      const dims = getElementDimensions(div);

      // Note: offsetWidth/Height may be 0 in JSDOM without layout
      expect(dims).toHaveProperty('width');
      expect(dims).toHaveProperty('height');
      expect(dims).toHaveProperty('area');
      expect(dims.area).toBe(dims.width * dims.height);
    });

    it('should return zeros for hidden element', () => {
      const div = document.createElement('div');
      div.style.display = 'none';
      document.body.appendChild(div);

      const dims = getElementDimensions(div);

      expect(dims.width).toBe(0);
      expect(dims.height).toBe(0);
      expect(dims.area).toBe(0);
    });
  });
});
