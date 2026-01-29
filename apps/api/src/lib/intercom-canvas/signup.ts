/**
 * Sign Up Canvas Builder
 * Shown when the Intercom admin doesn't have a Userplane account
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { intercomCanvasUrls } from './urls';

export interface SignUpCanvasOptions {
  adminEmail?: string;
}

/**
 * Build the sign up canvas
 * Shown when admin doesn't have a Userplane account
 */
export function buildSignUpCanvas(options: SignUpCanvasOptions): Canvas {
  const components: Canvas['content']['components'] = [
    {
      type: 'text',
      id: 'header',
      text: 'Welcome to Userplane',
      style: 'header',
    },
    {
      type: 'text',
      id: 'description',
      text: 'Create an account to start requesting screen recordings from your customers.',
      style: 'paragraph',
    },
    {
      type: 'spacer',
      size: 'm',
    },
  ];

  if (options.adminEmail) {
    components.push({
      type: 'text',
      id: 'email_info',
      text: `Sign up with: ${options.adminEmail}`,
      style: 'muted',
    });
    components.push({
      type: 'spacer',
      size: 's',
    });
  }

  components.push({
    type: 'button',
    id: 'signup',
    label: 'Sign up for Userplane',
    style: 'primary',
    action: {
      type: 'url',
      url: intercomCanvasUrls.signUpURL(),
    },
  });

  return {
    content: {
      components,
    },
    stored_data: {
      flow: 'signup',
    },
  };
}
