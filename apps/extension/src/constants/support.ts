import { DOCS_URL } from '@userplane/contract';

const docsUrl = (path: string) => `${DOCS_URL}${path}`;

export const SUPPORT_LINKS = {
  helpCenter: DOCS_URL,
  recordingLinks: docsUrl('/recording-links/managing'),
  sharingLinks: docsUrl('/recording/requesting'),
  linkCreationErrors: docsUrl('/recording-links/limits'),
} as const;
