/**
 * BlurManager tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BlurManager } from './BlurManager';
import { hasBlurState } from './state';

describe('BlurManager', () => {
  let blurManager: BlurManager;

  beforeEach(() => {
    // Clear document
    document.body.innerHTML = '';

    // Create new instance
    blurManager = new BlurManager([]);
  });

  afterEach(() => {
    if (blurManager && blurManager.isStarted) {
      blurManager.stop();
    }
  });

  describe('Constructor', () => {
    it('should create instance with default options', () => {
      expect(blurManager).toBeInstanceOf(BlurManager);
      expect(blurManager.isStarted).toBe(false);
      expect(blurManager.didBlurElements).toBe(false);
    });

    it('should accept custom selectors', () => {
      const manager = new BlurManager(['.custom-sensitive', '#user-email']);
      expect(manager.customSelectors).toContain('.custom-sensitive');
      expect(manager.customSelectors).toContain('#user-email');
    });

    it('should merge options with defaults', () => {
      const manager = new BlurManager([], {
        minBlurRadius: 10,
        maxBlurRadius: 50,
      });

      expect(manager).toBeInstanceOf(BlurManager);
    });
  });

  describe('start() and stop()', () => {
    it('should start blurring', () => {
      blurManager.start();
      expect(blurManager.isStarted).toBe(true);
    });

    it('should not start twice', () => {
      vi.spyOn(console, 'warn');

      blurManager.start();
      blurManager.start(); // Second call

      expect(blurManager.isStarted).toBe(true);
    });

    it('should stop blurring', () => {
      blurManager.start();
      blurManager.stop();
      expect(blurManager.isStarted).toBe(false);
    });

    it('should emit start and stop events', () => {
      const startSpy = vi.fn();
      const stopSpy = vi.fn();

      blurManager.on('start', startSpy);
      blurManager.on('stop', stopSpy);

      blurManager.start();
      expect(startSpy).toHaveBeenCalledTimes(1);

      blurManager.stop();
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Blur application', () => {
    it('should blur elements with data-userplane-blur attribute', () => {
      // Setup
      const div = document.createElement('div');
      div.setAttribute('data-userplane-blur', 'true');
      div.textContent = 'Secret';
      document.body.appendChild(div);

      // Execute
      blurManager.start();

      // Verify
      expect(div.style.filter).toContain('blur(');
      expect(hasBlurState(div)).toBe(true);
      expect(blurManager.didBlurElements).toBe(true);
    });

    it('should blur elements with .userplane-mask class', () => {
      const div = document.createElement('div');
      div.className = 'userplane-mask';
      div.textContent = 'Secret';
      document.body.appendChild(div);

      blurManager.start();

      expect(div.style.filter).toContain('blur(');
      expect(hasBlurState(div)).toBe(true);
    });

    it('should blur FullStory elements', () => {
      const div = document.createElement('div');
      div.className = 'fs-mask';
      div.textContent = 'Secret';
      document.body.appendChild(div);

      blurManager.start();

      expect(div.style.filter).toContain('blur(');
    });

    it('should blur Hotjar elements', () => {
      const input = document.createElement('input');
      input.setAttribute('data-hj-suppress', '');
      input.value = 'secret';
      document.body.appendChild(input);

      blurManager.start();

      expect(input.style.filter).toContain('blur(');
    });

    it('should blur custom selectors', () => {
      const manager = new BlurManager(['.custom-sensitive']);

      const div = document.createElement('div');
      div.className = 'custom-sensitive';
      div.textContent = 'Secret';
      document.body.appendChild(div);

      manager.start();

      expect(div.style.filter).toContain('blur(');

      manager.stop();
    });
  });

  describe('Unmask', () => {
    it('should not blur elements with data-userplane-blur="false"', () => {
      const div = document.createElement('div');
      div.setAttribute('data-userplane-blur', 'false');
      div.textContent = 'Public';
      document.body.appendChild(div);

      blurManager.start();

      expect(div.style.filter).toBe('');
      expect(blurManager.didBlurElements).toBe(false);
    });

    it('should not blur unmask selectors', () => {
      const div = document.createElement('div');
      div.className = 'fs-unmask';
      div.textContent = 'Public';
      document.body.appendChild(div);

      blurManager.start();

      expect(div.style.filter).toBe('');
    });
  });

  describe('Filter preservation', () => {
    it('should preserve existing CSS filters', () => {
      const div = document.createElement('div');
      div.style.filter = 'grayscale(100%)';
      div.className = 'userplane-mask';
      div.textContent = 'Secret';
      document.body.appendChild(div);

      blurManager.start();

      expect(div.style.filter).toContain('grayscale(100%)');
      expect(div.style.filter).toContain('blur(');
    });

    it('should restore original filter on stop', () => {
      const div = document.createElement('div');
      div.style.filter = 'brightness(1.2)';
      div.className = 'userplane-mask';
      document.body.appendChild(div);

      blurManager.start();
      const blurredFilter = div.style.filter;
      blurManager.stop();

      expect(blurredFilter).toContain('blur(');
      expect(div.style.filter).toBe('brightness(1.2)');
      expect(hasBlurState(div)).toBe(false);
    });
  });

  describe('Dynamic content', () => {
    it('should blur dynamically added elements', async () => {
      blurManager.start();

      // Add element after start
      await new Promise((resolve) => setTimeout(resolve, 50));

      const div = document.createElement('div');
      div.className = 'userplane-mask';
      div.textContent = 'Dynamic secret';
      document.body.appendChild(div);

      // Wait for MutationObserver
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(div.style.filter).toContain('blur(');
    });
  });

  describe('Adaptive blur radius', () => {
    it('should calculate different blur for different font sizes', () => {
      const small = document.createElement('small');
      small.style.fontSize = '12px';
      small.className = 'userplane-mask';
      small.textContent = 'Small';
      document.body.appendChild(small);

      const large = document.createElement('h1');
      large.style.fontSize = '48px';
      large.className = 'userplane-mask';
      large.textContent = 'Large';
      document.body.appendChild(large);

      blurManager.start();

      const smallBlur = parseInt(small.style.filter.match(/blur\((\d+)px\)/)?.[1] || '0');
      const largeBlur = parseInt(large.style.filter.match(/blur\((\d+)px\)/)?.[1] || '0');

      expect(largeBlur).toBeGreaterThan(smallBlur);
    });
  });

  describe('Manual blur/unblur', () => {
    it('should manually blur an element', () => {
      const div = document.createElement('div');
      div.textContent = 'Content';
      document.body.appendChild(div);

      blurManager.start();
      const result = blurManager.blurElement(div);

      expect(result).toBe(true);
      expect(div.style.filter).toContain('blur(');
    });

    it('should manually unblur an element', () => {
      const div = document.createElement('div');
      div.className = 'userplane-mask';
      document.body.appendChild(div);

      blurManager.start();
      expect(hasBlurState(div)).toBe(true);

      const result = blurManager.unblurElement(div);
      expect(result).toBe(true);
      expect(hasBlurState(div)).toBe(false);
    });
  });

  describe('Custom selectors management', () => {
    it('should add custom selectors dynamically', () => {
      const div = document.createElement('div');
      div.className = 'dynamic-sensitive';
      document.body.appendChild(div);

      blurManager.start();
      expect(hasBlurState(div)).toBe(false);

      blurManager.addCustomSelectors(['.dynamic-sensitive']);
      expect(hasBlurState(div)).toBe(true);
    });

    it('should remove custom selectors', () => {
      const manager = new BlurManager(['.custom']);
      expect(manager.customSelectors).toContain('.custom');

      manager.removeCustomSelectors(['.custom']);
      expect(manager.customSelectors).not.toContain('.custom');
    });
  });

  describe('Performance metrics', () => {
    it('should track performance metrics', () => {
      const div = document.createElement('div');
      div.className = 'userplane-mask';
      document.body.appendChild(div);

      blurManager.start();

      const metrics = blurManager.performanceMetrics;

      expect(metrics.startTime).toBeGreaterThan(0);
      expect(metrics.elementsBlurred).toBe(1);
      expect(metrics.blurCalculations).toBe(1);
    });
  });

  describe('Event system', () => {
    it('should emit blur event', () => {
      const spy = vi.fn();
      blurManager.on('blur', spy);

      const div = document.createElement('div');
      div.className = 'userplane-mask';
      document.body.appendChild(div);

      blurManager.start();

      expect(spy).toHaveBeenCalled();
    });

    it('should remove event listeners', () => {
      const spy = vi.fn();
      blurManager.on('blur', spy);
      blurManager.off('blur', spy);

      const div = document.createElement('div');
      div.className = 'userplane-mask';
      document.body.appendChild(div);

      blurManager.start();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('Static methods', () => {
    it('should create from meta tags', () => {
      // Add meta tags
      const meta1 = document.createElement('meta');
      meta1.name = 'userplane:blur';
      meta1.content = '.from-meta';
      document.head.appendChild(meta1);

      const manager = BlurManager.fromMetaTags();
      expect(manager.customSelectors).toContain('.from-meta');

      document.head.removeChild(meta1);
    });

    it('should check browser support', () => {
      const support = BlurManager.checkSupport();
      expect(support.supported).toBe(true);
      expect(support.missing).toEqual([]);
    });
  });

  describe('clearData()', () => {
    it('should clear metrics', () => {
      const div = document.createElement('div');
      div.className = 'userplane-mask';
      document.body.appendChild(div);

      blurManager.start();
      expect(blurManager.didBlurElements).toBe(true);

      blurManager.clearData();
      expect(blurManager.didBlurElements).toBe(false);

      const metrics = blurManager.performanceMetrics;
      expect(metrics.elementsBlurred).toBe(0);
    });
  });
});
