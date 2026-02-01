'use client';

import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import Logo from '@workspace/ui/components/logo';
import { Skeleton } from '@workspace/ui/components/skeleton';
import { toast } from '@workspace/ui/components/sonner';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { AuthIcons } from '@/components/auth/auth-icons';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { PaginationControls } from '@/components/shared/pagination-controls';
import { useIntercomAdmins } from '@/features/integrations';
import { useSendWorkspaceInvites } from '@/features/workspace';
import { showErrorToast } from '@/lib/errors';

const ITEMS_PER_PAGE = 5;

function LoadingState() {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">Invite your teammates</h1>
            <p className="text-sm text-muted-foreground text-center">
              Select team members from Intercom to invite to your workspace
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>

          <div className="border rounded-lg divide-y">
            {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-14 w-full rounded-full" />
          <div className="flex justify-center">
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">All teammates invited</h1>
            <p className="text-sm text-muted-foreground text-center">
              All your Intercom team members are already part of this workspace.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => router.push(`/${workspaceId}/settings`)}
            size="lg"
            className="w-full rounded-full px-7 py-6"
          >
            Go to Settings
          </Button>
        </div>
      </div>
    </div>
  );
}

function ErrorState({
  workspaceId,
  message,
  onRetry,
}: {
  workspaceId: string;
  message: string;
  onRetry: () => void;
}) {
  const router = useRouter();

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">Failed to load teammates</h1>
            <p className="text-sm text-muted-foreground text-center">{message}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Button onClick={onRetry} size="lg" className="w-full rounded-full px-7 py-6">
            Try Again
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => router.push(`/${workspaceId}/settings`)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Admin {
  id: string;
  email: string;
  name: string | null;
}

const AUTO_SELECT_LIMIT = 5;

function AdminSelectionState({ workspaceId, admins }: { workspaceId: string; admins: Admin[] }) {
  const router = useRouter();
  // Auto-select up to 5 admins on initial render
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(() => {
    const initialSelection = admins.slice(0, AUTO_SELECT_LIMIT).map((a) => a.email);
    return new Set(initialSelection);
  });
  const [currentPage, setCurrentPage] = useState(1);
  const sendInvites = useSendWorkspaceInvites();

  const totalPages = Math.ceil(admins.length / ITEMS_PER_PAGE);
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return admins.slice(start, start + ITEMS_PER_PAGE);
  }, [admins, currentPage]);

  const allSelected = admins.length > 0 && selectedEmails.size === admins.length;

  const handleToggleAdmin = (email: string) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(admins.map((a) => a.email)));
    }
  };

  const handleSendInvites = async () => {
    const emails = Array.from(selectedEmails);
    if (emails.length === 0) return;

    sendInvites.mutate(emails, {
      onSuccess: (result) => {
        if (!result.success) {
          showErrorToast(result.error);
          return;
        }
        toast.success(`Invites sent to ${emails.length} teammate${emails.length > 1 ? 's' : ''}`);
        router.push(`/${workspaceId}/settings`);
      },
    });
  };

  const handleSkip = () => {
    router.push(`/${workspaceId}/settings`);
  };

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center px-6 py-12 bg-background overflow-hidden">
      <AuthIcons />

      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
            <div className="flex items-center justify-center w-14 h-14 rounded-xl border bg-background shadow-sm">
              <Image
                src="/integrations/intercom.webp"
                alt="Intercom"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-xl font-medium text-foreground">Invite your teammates</h1>
            <p className="text-sm text-muted-foreground text-center">
              Select team members from Intercom to invite to your workspace
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {allSelected ? 'Deselect all' : 'Select all'}
            </button>
            <span className="text-sm text-muted-foreground">
              {selectedEmails.size} of {admins.length} selected
            </span>
          </div>

          <div className="border rounded-lg divide-y">
            {paginatedAdmins.map((admin) => (
              <label
                key={admin.id}
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <Checkbox
                  checked={selectedEmails.has(admin.email)}
                  onCheckedChange={() => handleToggleAdmin(admin.email)}
                />
                <BoringAvatar name={admin.email} size={32} />
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{admin.name || 'Unknown'}</span>
                  <span className="text-xs text-muted-foreground truncate">{admin.email}</span>
                </div>
              </label>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleSendInvites}
            size="lg"
            className="w-full rounded-full px-7 py-6"
            disabled={selectedEmails.size === 0 || sendInvites.isPending}
          >
            {sendInvites.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending invites...
              </>
            ) : (
              `Send Invite${selectedEmails.size !== 1 ? 's' : ''}`
            )}
          </Button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              disabled={sendInvites.isPending}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Filter out Intercom internal emails (e.g., support accounts)
function filterIntercomInternalEmails(admins: Admin[]): Admin[] {
  return admins.filter((admin) => !admin.email.endsWith('@intercom.io'));
}

export default function IntercomInvitePage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const { data, isLoading, error, refetch } = useIntercomAdmins(true);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !data?.success) {
    return (
      <ErrorState
        workspaceId={workspaceId}
        message={data?.success === false ? data.error.message : 'Failed to load teammates'}
        onRetry={() => refetch()}
      />
    );
  }

  // Filter out @intercom.io emails (internal Intercom accounts)
  const filteredAdmins = filterIntercomInternalEmails(data.data.admins);

  if (filteredAdmins.length === 0) {
    return <EmptyState workspaceId={workspaceId} />;
  }

  return <AdminSelectionState workspaceId={workspaceId} admins={filteredAdmins} />;
}
