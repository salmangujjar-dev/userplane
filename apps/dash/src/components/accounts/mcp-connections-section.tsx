'use client';

import { MCP_SCOPE_LABELS } from '@userplane/contract';
import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@userplane/ui/components/dropdown-menu';
import { Input } from '@userplane/ui/components/input';
import { Label } from '@userplane/ui/components/label';
import Logo from '@userplane/ui/components/logo';
import { Skeleton } from '@userplane/ui/components/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@userplane/ui/components/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@userplane/ui/components/tooltip';
import { format } from 'date-fns';
import { Cable, Globe, MoreVertical, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { SectionError } from '@/components/shared/section-error';
import { WORKSPACE_AVATAR_SIZES, WorkspaceAvatar } from '@/components/shared/workspace-avatar';
import { SUPPORT_LINKS } from '@/constants';
import { useMcpConnections, useRevokeMcpConnection } from '@/features/mcp-connection';
import type { McpConnectionData } from '@/types';

// =============================================================================
// Main Section
// =============================================================================

const ITEMS_PER_PAGE = 5;

export function McpConnectionsSection() {
  const [currentPage, setCurrentPage] = useState(1);
  const {
    data: result,
    isLoading,
    error,
    refetch,
  } = useMcpConnections({
    page: currentPage,
    perPage: ITEMS_PER_PAGE,
  });
  const [revokeTarget, setRevokeTarget] = useState<{
    clientId: string;
    name: string | null;
  } | null>(null);

  const connections = result?.success ? (result.data?.connections ?? []) : [];
  const pagination = result?.success ? result.data?.pagination : null;
  const totalPages = pagination?.totalPages || 1;

  if (isLoading) {
    return <McpConnectionsSkeleton />;
  }

  if (error || (result && !result.success)) {
    return (
      <div className="max-w-2xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Connected Apps</h2>
          <p className="text-sm text-muted-foreground">
            MCP clients authorized to access your account
          </p>
        </div>
        <SectionError
          title="Failed to load connections"
          description={
            error instanceof Error
              ? error.message
              : result && !result.success
                ? result.error.message
                : 'Something went wrong.'
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Connected Apps</h2>
        <p className="text-sm text-muted-foreground">
          MCP clients authorized to access your account
        </p>
      </div>

      {/* Table or Empty State */}
      {connections.length > 0 || currentPage > 1 ? (
        <>
          <div className="rounded-xl border bg-card">
            <McpConnectionsTable
              connections={connections}
              onRevoke={(clientId, name) => setRevokeTarget({ clientId, name })}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Showing {connections.length} of {pagination?.total ?? 0}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Learn more about{' '}
            <a
              href={SUPPORT_LINKS.mcpGettingStarted}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline hover:no-underline"
            >
              MCP integrations
            </a>
          </p>
        </>
      ) : (
        <McpConnectionsEmptyState />
      )}

      {/* Revoke Modal */}
      <RevokeMcpConnectionModal
        open={!!revokeTarget}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        clientId={revokeTarget?.clientId ?? null}
        clientName={revokeTarget?.name ?? null}
      />
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

function McpConnectionsEmptyState() {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="relative mb-6">
          <McpConnectionsIllustration />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No connected apps</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
          When you authorize an MCP client to access your account, it will appear here
        </p>
        <Button asChild variant="default" size="default" className="gap-2">
          <a href={SUPPORT_LINKS.mcpGettingStarted} target="_blank" rel="noopener noreferrer">
            <Cable className="w-4 h-4" />
            Get Started
          </a>
        </Button>
      </div>
    </div>
  );
}

function McpConnectionsIllustration() {
  return (
    <div className="w-72 h-44 rounded-xl overflow-hidden bg-linear-to-br from-sky-200 via-cyan-200 to-teal-200 p-4">
      <div className="bg-white rounded-lg shadow-sm h-full p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <div className="flex-1 h-2 bg-gray-100 rounded ml-2" />
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-linear-to-br from-sky-100 to-cyan-100 flex items-center justify-center">
              <Cable className="w-4 h-4 text-sky-500" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-gray-200 rounded w-3/4" />
              <div className="h-1.5 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="w-14 h-5 bg-green-50 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-linear-to-br from-cyan-100 to-teal-100 flex items-center justify-center">
              <Globe className="w-4 h-4 text-teal-500" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-gray-200 rounded w-2/3" />
              <div className="h-1.5 bg-gray-100 rounded w-2/5" />
            </div>
            <div className="w-14 h-5 bg-yellow-50 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Connections Table
// =============================================================================

function McpConnectionsTable({
  connections,
  onRevoke,
}: {
  connections: McpConnectionData[];
  onRevoke: (clientId: string, name: string | null) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Application</TableHead>
          <TableHead>Permissions</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Authorized</TableHead>
          <TableHead className="w-[50px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {connections.map((conn) => (
          <TableRow key={conn.clientId}>
            <TableCell>
              <div className="flex items-center gap-2.5">
                <ClientIcon clientId={conn.clientId} name={conn.name} icon={conn.icon} />
                <span className="font-medium text-sm truncate">
                  {conn.name || 'Unknown application'}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <ScopesList scopes={conn.scopes} />
            </TableCell>
            <TableCell>
              <TokenStatusBadge status={conn.tokenStatus} />
            </TableCell>
            <TableCell>
              <span className="text-sm text-muted-foreground">
                {format(new Date(conn.authorizedAt), 'dd MMM yyyy')}
              </span>
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => onRevoke(conn.clientId, conn.name)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Revoke Access
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// =============================================================================
// Table Cell Components
// =============================================================================

function ClientIcon({
  clientId,
  name,
  icon,
}: {
  clientId: string;
  name: string | null;
  icon: string | null;
}) {
  if (icon) {
    return (
      <Image
        src={icon}
        alt={name ?? 'Application'}
        width={32}
        height={32}
        className="w-8 h-8 rounded object-contain bg-muted"
        unoptimized
      />
    );
  }

  return (
    <WorkspaceAvatar
      workspaceId={clientId}
      workspaceName={name}
      size={WORKSPACE_AVATAR_SIZES.USER}
    />
  );
}

function ScopesList({ scopes }: { scopes: string[] }) {
  if (scopes.length === 0) {
    return <span className="text-xs text-muted-foreground">No permissions</span>;
  }

  const first = scopes[0]!;
  const firstLabel = MCP_SCOPE_LABELS[first] ?? first;
  const remaining = scopes.length - 1;
  const allLabels = scopes.map((s) => MCP_SCOPE_LABELS[s] ?? s).join('\n');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-xs text-muted-foreground cursor-default max-w-[140px] block truncate">
            {firstLabel}
            {remaining > 0 && <span className="text-muted-foreground/70"> +{remaining}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent className="whitespace-pre-line">{allLabels}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function TokenStatusBadge({ status }: { status: McpConnectionData['tokenStatus'] }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
      Inactive
    </span>
  );
}

// =============================================================================
// Revoke Modal
// =============================================================================

function RevokeMcpConnectionModal({
  open,
  onOpenChange,
  clientId,
  clientName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string | null;
  clientName: string | null;
}) {
  const [confirmText, setConfirmText] = useState('');
  const revokeMutation = useRevokeMcpConnection();
  const displayName = clientName || 'App';

  useEffect(() => {
    if (!open) {
      setConfirmText('');
    }
  }, [open]);

  const handleRevoke = () => {
    if (!clientId) return;
    revokeMutation.mutate(clientId, {
      onSuccess: (result) => {
        if (result.success) {
          onOpenChange(false);
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Revoke Access</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {clientName || 'This application'} will lose access to your account immediately.
              </DialogDescription>
            </div>
          </div>

          <div>
            <Label htmlFor="revoke-mcp-confirm" className="mb-2 block">
              Type <strong>{displayName}</strong> to confirm
            </Label>
            <Input
              id="revoke-mcp-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={displayName}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button
              type="button"
              variant="secondary"
              className="px-6"
              onClick={() => onOpenChange(false)}
              disabled={revokeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="px-6"
              disabled={confirmText !== displayName || revokeMutation.isPending}
              onClick={handleRevoke}
            >
              {revokeMutation.isPending ? 'Revoking...' : 'Revoke Access'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Skeleton
// =============================================================================

function McpConnectionsSkeleton() {
  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-xl border bg-card">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
