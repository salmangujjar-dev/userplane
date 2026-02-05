/**
 * Sign Up Canvas Builder
 * Shown when the Intercom admin doesn't have a Userplane account
 */

import type { Canvas } from '@/api/types/intercom-canvas';

import { getCanvasImages, intercomCanvasUrls } from './urls';

export interface SignUpCanvasOptions {
  adminEmail?: string;
}

/**
 * Build the sign up canvas
 * Shown when admin doesn't have a Userplane account
 * Features centered logo and welcoming message
 */
export function buildSignUpCanvas(options: SignUpCanvasOptions): Canvas {
  const emailText = options.adminEmail
    ? `Sign up with *${options.adminEmail}* to get started`
    : 'Create an account to start requesting screen recordings';

  return {
    content: {
      components: [
        {
          type: 'image',
          id: 'logo',
          url: getCanvasImages().logo,
          align: 'center',
          width: 50,
          height: 50,
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'text',
          id: 'header',
          text: '*Welcome to Userplane*',
          align: 'center',
        },
        {
          type: 'spacer',
          size: 's',
        },
        {
          type: 'text',
          id: 'description',
          text: emailText,
          style: 'muted',
          align: 'center',
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'button',
          id: 'signup',
          label: 'Sign up for Userplane',
          style: 'primary',
          action: {
            type: 'url',
            url: intercomCanvasUrls.signUpURL(),
          },
        },
        {
          type: 'button',
          id: 'contact_support',
          label: 'Contact Support',
          style: 'secondary',
          action: {
            type: 'url',
            url: intercomCanvasUrls.supportEmailURL(),
          },
        },
      ],
    },
    stored_data: {
      flow: 'signup',
    },
  };
}
