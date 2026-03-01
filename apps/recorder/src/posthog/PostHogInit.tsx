'use client';

import { useEffect } from 'react';

import { initPostHog } from './client';

export function PostHogInit() {
  useEffect(() => {
    initPostHog();
  }, []);

  return null;
}
