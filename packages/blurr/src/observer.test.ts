/**
 * Observer tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createBatchedObserver,
  createIntersectionObserver,
  debounce,
  disconnect,
  observe,
  processMutationBatch,
  throttle,
} from './observer';

describe('Observer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('createBatchedObserver', () => {
    it('should create a MutationObserver', () => {
      const callback = vi.fn();
      const observer = createBatchedObserver(callback);

      expect(observer).toBeInstanceOf(MutationObserver);
    });

    it('should batch mutations and call callback', async () => {
      const callback = vi.fn();
      const observer = createBatchedObserver(callback, false); // Disable RAF for test

      observe(observer, document.body);

      const div = document.createElement('div');
      document.body.appendChild(div);

      // Allow mutation to be processed
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(callback).toHaveBeenCalled();

      disconnect(observer);
    });

    it('should include added elements in batch', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let receivedBatch: any = null;
      const callback = vi.fn((batch) => {
        receivedBatch = batch;
      });

      const observer = createBatchedObserver(callback, false);
      observe(observer, document.body);

      const div = document.createElement('div');
      div.className = 'test-element';
      document.body.appendChild(div);

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(receivedBatch).not.toBeNull();
      expect(receivedBatch.elementsToBlur.size).toBeGreaterThan(0);

      disconnect(observer);
    });
  });

  describe('processMutationBatch', () => {
    it('should process childList mutations', () => {
      const addedNode = document.createElement('div');

      const mutation: Partial<MutationRecord> = {
        type: 'childList',
        addedNodes: [addedNode] as unknown as NodeList,
        removedNodes: [] as unknown as NodeList,
        target: document.body,
      };

      const batch = processMutationBatch([mutation as MutationRecord]);

      expect(batch.elementsToBlur.has(addedNode)).toBe(true);
    });

    it('should process attribute mutations', () => {
      const target = document.createElement('div');

      const mutation: Partial<MutationRecord> = {
        type: 'attributes',
        target,
        attributeName: 'class',
      };

      const batch = processMutationBatch([mutation as MutationRecord]);

      expect(batch.elementsToReevaluate.has(target)).toBe(true);
    });

    it('should collect descendants of added elements', () => {
      const parent = document.createElement('div');
      const child = document.createElement('span');
      const grandchild = document.createElement('a');

      child.appendChild(grandchild);
      parent.appendChild(child);

      const mutation: Partial<MutationRecord> = {
        type: 'childList',
        addedNodes: [parent] as unknown as NodeList,
        removedNodes: [] as unknown as NodeList,
        target: document.body,
      };

      const batch = processMutationBatch([mutation as MutationRecord]);

      expect(batch.elementsToBlur.has(parent)).toBe(true);
      expect(batch.elementsToBlur.has(child)).toBe(true);
      expect(batch.elementsToBlur.has(grandchild)).toBe(true);
    });

    it('should deduplicate elements', () => {
      const element = document.createElement('div');

      const mutations: Partial<MutationRecord>[] = [
        {
          type: 'attributes',
          target: element,
        },
        {
          type: 'attributes',
          target: element,
        },
      ];

      const batch = processMutationBatch(mutations as MutationRecord[]);

      expect(batch.elementsToReevaluate.size).toBe(1);
    });

    it('should return empty sets for empty mutations', () => {
      const batch = processMutationBatch([]);

      expect(batch.elementsToBlur.size).toBe(0);
      expect(batch.elementsToUnblur.size).toBe(0);
      expect(batch.elementsToReevaluate.size).toBe(0);
    });
  });

  describe('observe / disconnect', () => {
    it('should start and stop observing', () => {
      const callback = vi.fn();
      const observer = createBatchedObserver(callback);

      // Should not throw
      observe(observer, document.body);
      disconnect(observer);
    });
  });

  describe('createIntersectionObserver', () => {
    it('should create an IntersectionObserver', () => {
      const callback = vi.fn();
      const observer = createIntersectionObserver(callback);

      expect(observer).toBeInstanceOf(IntersectionObserver);

      observer.disconnect();
    });

    it('should accept options', () => {
      const callback = vi.fn();
      const observer = createIntersectionObserver(callback, {
        threshold: 0.5,
        rootMargin: '10px',
      });

      expect(observer).toBeInstanceOf(IntersectionObserver);

      observer.disconnect();
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 50);

      debounced();
      debounced();
      debounced();

      expect(fn).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 50);

      debounced('arg1', 'arg2');

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should reset timer on each call', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 50);

      debounced();
      await new Promise((resolve) => setTimeout(resolve, 30));
      debounced();
      await new Promise((resolve) => setTimeout(resolve, 30));
      debounced();

      expect(fn).not.toHaveBeenCalled();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 50);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);

      await new Promise((resolve) => setTimeout(resolve, 100));

      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments to throttled function', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 50);

      throttled('arg1', 'arg2');

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should execute immediately on first call', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });
});
