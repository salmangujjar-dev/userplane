import { RouterProvider } from '@tanstack/react-router';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { Providers } from '@/components/shared/providers';
import { WorkspaceGuard } from '@/components/shared/workspace-guard';

import { router } from './routes';

export default function App() {
  return (
    <Providers>
      <AuthGuard>
        <WorkspaceGuard>
          <RouterProvider router={router} />
        </WorkspaceGuard>
      </AuthGuard>
    </Providers>
  );
}
