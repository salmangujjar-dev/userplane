import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import React from 'react';

import { LoginPrompt } from './LoginPrompt';

// AuthGuard depends on useExtensionAuth (context-based) which requires
// ExtensionAuthProvider. We render its visual sub-states directly to
// demonstrate the three possible states without heavy mocking.

const meta = {
  title: 'Auth/AuthGuard',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;

export const Loading: StoryObj = {
  name: 'Loading State',
  render: () => (
    <div className="flex items-center justify-center p-8 h-[400px]">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  ),
};

export const Unauthenticated: StoryObj = {
  name: 'Unauthenticated (Login Prompt)',
  render: () => <LoginPrompt onRefresh={fn()} onSignIn={fn()} />,
};

export const Authenticated: StoryObj = {
  name: 'Authenticated (Children)',
  render: () => (
    <div className="p-8 bg-background h-[400px] flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="mx-auto h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="text-sm font-medium">Authenticated</p>
        <p className="text-xs text-muted-foreground">
          Children are rendered when user is authenticated
        </p>
      </div>
    </div>
  ),
};
