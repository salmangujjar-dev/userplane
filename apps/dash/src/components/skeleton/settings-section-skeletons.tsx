import { Skeleton } from '@workspace/ui/components/skeleton';

export function WorkspaceSectionSkeleton() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Workspace</h2>
        <p className="text-sm text-muted-foreground">Manage your workspace settings</p>
      </div>
      <div className="max-w-2xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2 items-start mt-2">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        <div className="flex items-center justify-between py-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-10 w-20 ml-4" />
        </div>
      </div>
    </div>
  );
}

export function TeamSectionSkeleton() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Team</h2>
        <p className="text-sm text-muted-foreground">Manage team members and permissions</p>
      </div>
      <div className="max-w-2xl">
        <div className="rounded-xl border bg-card p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={`member-${i}`} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectsSectionSkeleton() {
  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Projects</h2>
            <p className="text-sm text-muted-foreground">Manage projects in your workspace</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="max-w-2xl">
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={`project-${i}`}
              className="flex items-center justify-between p-4 rounded-xl border bg-card"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DomainsSectionSkeleton() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Domains</h2>
        <p className="text-sm text-muted-foreground">Configure domain and recording settings</p>
      </div>
      <div className="max-w-2xl space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={`domain-${i}`} className="h-16 rounded-xl" />
        ))}
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  );
}

export function NotificationsSectionSkeleton() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Notification</h2>
        <p className="text-sm text-muted-foreground">Configure your workspace notifications</p>
      </div>
      <div className="max-w-2xl space-y-6">
        {[...Array(5)].map((_, i) => (
          <div key={`notification-${i}`} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function IntegrationsSectionSkeleton() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect third-party services to your workspace
        </p>
      </div>
      <div className="max-w-2xl">
        <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function WorkspacePlanSectionSkeleton() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Workspace Plan</h2>
        <p className="text-sm text-muted-foreground">View your plan details and usage</p>
      </div>
      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={`plan-detail-${i}`} className="flex items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function RecordingLinkSectionSkeleton() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Recording Link</h2>
        <p className="text-sm text-muted-foreground">Customize your recording link appearance</p>
      </div>
      <div className="w-full max-w-2xl space-y-4">
        <Skeleton className="h-[500px] w-full rounded-lg" />
        <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <div className="p-4 rounded-xl border bg-card space-y-4">
          <div className="flex gap-6">
            <Skeleton className="h-24 w-24 rounded-lg" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-24 rounded-md" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20 rounded-md" />
          <Skeleton className="h-10 w-20 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function AccountSettingsSectionSkeleton() {
  return (
    <div className="w-full max-w-2xl">
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2 items-start mt-2">
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
      </div>
    </div>
  );
}

export function WorkspaceMembershipSkeleton() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Workspaces</h2>
        <p className="text-sm text-muted-foreground">Manage workspace membership</p>
      </div>
      <div className="max-w-2xl">
        <div className="rounded-xl border bg-card p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={`workspace-${i}`} className="flex items-center gap-3">
                <div className="flex items-center -space-x-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                </div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
