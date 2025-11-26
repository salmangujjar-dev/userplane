/**
 * Email rendering utilities
 * Convert React components to HTML strings
 */

import { render } from '@react-email/components';
import type { ReactElement } from 'react';

/**
 * Render a React email component to HTML string
 * Uses @react-email/components render function
 */
export async function renderEmail(component: ReactElement): Promise<string> {
  return await render(component, {
    pretty: false,
  });
}

/**
 * Render a React email component to plain text
 * Uses @react-email/components render function
 */
export async function renderEmailText(component: ReactElement): Promise<string> {
  return await render(component, {
    plainText: true,
  });
}
