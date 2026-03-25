import {
  createHashHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router';
import { z } from 'zod';

import { CreateLinkView } from '@/components/create-link/create-link-view';
import { EditLinkView } from '@/components/edit-link/edit-link-view';
import { SidePanelLayout } from '@/components/layout/side-panel-layout';
import { LinksList } from '@/components/links/links-list';
import { RecordingsList } from '@/components/recordings/recordings-list';
import { SettingsView } from '@/components/settings/settings-view';
import { ShareLinkView } from '@/components/share-link/share-link-view';

const rootRoute = createRootRoute({
  component: SidePanelLayout,
});

const linksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LinksList,
});

const createLinkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/create',
  component: CreateLinkView,
});

const editLinkSearchSchema = z.object({
  linkId: z.string(),
  title: z.string(),
  reference: z.string().optional().default(''),
  isReusable: z.boolean(),
  linkProvider: z.string().optional(),
  linkProviderId: z.string().optional(),
});

const editLinkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/edit',
  validateSearch: editLinkSearchSchema,
  component: function EditLinkRoute() {
    const search = editLinkRoute.useSearch();
    return (
      <EditLinkView
        linkId={search.linkId}
        title={search.title}
        reference={search.reference}
        isReusable={search.isReusable}
        linkProvider={search.linkProvider}
        linkProviderId={search.linkProviderId}
      />
    );
  },
});

const shareLinkSearchSchema = z.object({
  linkUrl: z.string(),
});

const shareLinkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/share',
  validateSearch: shareLinkSearchSchema,
  component: function ShareLinkRoute() {
    const search = shareLinkRoute.useSearch();
    return <ShareLinkView linkUrl={search.linkUrl} />;
  },
});

const recordingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/recordings',
  component: RecordingsList,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsView,
});

const routeTree = rootRoute.addChildren([
  linksRoute,
  recordingsRoute,
  createLinkRoute,
  editLinkRoute,
  shareLinkRoute,
  settingsRoute,
]);

const hashHistory = createHashHistory();

export const router = createRouter({ routeTree, history: hashHistory });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
