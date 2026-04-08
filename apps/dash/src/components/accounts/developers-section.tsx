'use client';

import { API_KEY_EXPIRATION_OPTIONS } from '@userplane/contract';
import { API_KEY_LIMITS } from '@userplane/contract';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@userplane/ui/components/select';
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
import { Code, Copy, HelpCircle, Key, MoreVertical, Plus, RotateCw, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { SectionError } from '@/components/shared/section-error';
import { SUPPORT_LINKS } from '@/constants';
import { useApiKeys, useCreateApiKey, useRevokeApiKey, useRotateApiKey } from '@/features/api-key';
import { showCopiedToClipboardToast } from '@/lib/toasts';
import type { ApiKeyData } from '@/types';

// =============================================================================
// Main Section
// =============================================================================

export function DevelopersSection() {
  const { data: result, isLoading, error, refetch } = useApiKeys();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [revokeKeyId, setRevokeKeyId] = useState<string | null>(null);
  const [rotateKey, setRotateKey] = useState<{ keyId: string; name?: string } | null>(null);

  const keys: ApiKeyData[] = result?.success ? (result.data ?? []) : [];
  const canCreateMore = keys.length < API_KEY_LIMITS.MAX_KEYS_PER_USER;

  if (isLoading) {
    return <DevelopersSkeleton />;
  }

  if (error || (result && !result.success)) {
    return (
      <div className="max-w-2xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Manage API keys to access Userplane programmatically
          </p>
        </div>
        <SectionError
          title="Failed to load API keys"
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
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">API Keys</h2>
          <p className="text-sm text-muted-foreground">
            Manage API keys to access Userplane programmatically
          </p>
        </div>
        {canCreateMore && keys.length > 0 && (
          <Button onClick={() => setShowCreateModal(true)} size="sm" className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Create API Key
          </Button>
        )}
      </div>

      {/* Table + docs link, or Empty State */}
      {keys.length > 0 ? (
        <>
          <ApiKeyTable
            keys={keys}
            onRotate={(keyId, name) => setRotateKey({ keyId, name })}
            onRevoke={(keyId) => setRevokeKeyId(keyId)}
          />
          <p className="mt-3 text-sm text-muted-foreground">
            You can find our{' '}
            <a
              href={SUPPORT_LINKS.apiKeys}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline hover:no-underline"
            >
              API Documentation here
            </a>
          </p>
        </>
      ) : (
        <ApiKeyEmptyState onCreate={() => setShowCreateModal(true)} />
      )}

      {/* Modals */}
      <CreateApiKeyModal open={showCreateModal} onOpenChange={setShowCreateModal} />
      <RevokeApiKeyModal
        open={!!revokeKeyId}
        onOpenChange={(open) => {
          if (!open) setRevokeKeyId(null);
        }}
        keyId={revokeKeyId}
      />
      <RotateApiKeyModal
        open={!!rotateKey}
        onOpenChange={(open) => {
          if (!open) setRotateKey(null);
        }}
        keyId={rotateKey?.keyId ?? null}
        currentKeyName={rotateKey?.name}
      />
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

function ApiKeyEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="relative mb-6">
          <ApiKeyIllustration />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No API keys yet</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
          Create an API key to start accessing Userplane programmatically
        </p>
        <Button onClick={onCreate} size="default" className="gap-2">
          <Plus className="w-4 h-4" />
          Create API Key
        </Button>
      </div>
    </div>
  );
}

function ApiKeyIllustration() {
  return (
    <div className="w-72 h-44 rounded-xl overflow-hidden bg-gradient-to-br from-violet-200 via-purple-200 to-indigo-200 p-4">
      <div className="bg-white rounded-lg shadow-sm h-full p-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <div className="flex-1 h-2 bg-gray-100 rounded ml-2" />
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
              <Key className="w-4 h-4 text-violet-500" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-gray-200 rounded w-3/4" />
              <div className="h-1.5 bg-gray-100 rounded w-1/2" />
            </div>
            <div className="w-12 h-6 bg-gray-100 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
              <Code className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-2 bg-gray-200 rounded w-2/3" />
              <div className="h-1.5 bg-gray-100 rounded w-2/5" />
            </div>
            <div className="w-12 h-6 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// API Key Table
// =============================================================================

function ApiKeyTable({
  keys,
  onRotate,
  onRevoke,
}: {
  keys: ApiKeyData[];
  onRotate: (keyId: string, name?: string) => void;
  onRevoke: (keyId: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {keys.map((keyData) => (
            <TableRow key={keyData.keyId}>
              <TableCell>
                <span className="font-medium text-sm">{keyData.name || 'Userplane'}</span>
              </TableCell>
              <TableCell>
                <code className="text-sm font-mono text-muted-foreground">{keyData.maskedKey}</code>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {keyData.expiresAt ? format(new Date(keyData.expiresAt), 'dd MMM yyyy') : 'Never'}
                </span>
              </TableCell>
              <TableCell>
                {keyData.enabled ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    Disabled
                  </span>
                )}
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
                      onClick={() => onRotate(keyData.keyId, keyData.name ?? undefined)}
                    >
                      <RotateCw className="h-4 w-4 mr-2" />
                      Rotate Key
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onRevoke(keyData.keyId)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Revoke Key
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// =============================================================================
// Created Key View (shared by Create & Rotate modals)
// =============================================================================

function ApiKeyCreatedView({
  open,
  onOpenChange,
  title,
  description,
  keyName,
  apiKey,
  expiresAt,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  keyName: string | undefined;
  apiKey: string;
  expiresAt: string | null;
}) {
  const handleCopyKey = async () => {
    await navigator.clipboard.writeText(apiKey);
    showCopiedToClipboardToast('API key');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {description}
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4">
            {keyName && (
              <div className="space-y-1">
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-xs text-muted-foreground">The label for this key</p>
                <p className="text-sm">{keyName}</p>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-sm font-medium">API Key</Label>
              <p className="text-xs text-muted-foreground">
                Use this key to authenticate your API requests
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                  {apiKey}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopyKey} className="shrink-0">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium">Expires</Label>
              <p className="text-xs text-muted-foreground">
                The key will stop working after this date
              </p>
              <p className="text-sm">
                {expiresAt ? format(new Date(expiresAt), 'dd MMM yyyy') : 'Never'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button type="button" className="px-6" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Create API Key Modal
// =============================================================================

function CreateApiKeyModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState('');
  const [expiresIn, setExpiresIn] = useState('0');
  const [createdResult, setCreatedResult] = useState<{
    key: string;
    expiresAt: string | null;
  } | null>(null);
  const createMutation = useCreateApiKey();

  useEffect(() => {
    if (!open) {
      setName('');
      setExpiresIn('0');
      setCreatedResult(null);
    }
  }, [open]);

  const handleCreate = () => {
    const expiresInValue = parseInt(expiresIn, 10);
    createMutation.mutate(
      {
        name: name.trim() || undefined,
        expiresIn: expiresInValue > 0 ? expiresInValue : undefined,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            setCreatedResult({ key: result.data.key, expiresAt: result.data.expiresAt });
          }
        },
      }
    );
  };

  if (createdResult) {
    return (
      <ApiKeyCreatedView
        open={open}
        onOpenChange={onOpenChange}
        title="API Key Created"
        description="Copy your key now — you won't be able to see it again"
        keyName={name.trim() || undefined}
        apiKey={createdResult.key}
        expiresAt={createdResult.expiresAt}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Create API Key</DialogTitle>
              <div className="flex items-center gap-2">
                <DialogDescription className="text-sm text-muted-foreground">
                  Generate a new key to access the Userplane API
                </DialogDescription>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={SUPPORT_LINKS.apiKeys}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center"
                      >
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Learn more about API keys</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="space-y-0.5">
                <Label htmlFor="api-key-name" className="text-sm font-medium">
                  Name <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <p className="text-xs text-muted-foreground">A label to identify this key</p>
              </div>
              <Input
                id="api-key-name"
                placeholder="Production API"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                disabled={createMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <div className="space-y-0.5">
                <Label htmlFor="api-key-expires" className="text-sm font-medium">
                  Expiration
                </Label>
                <p className="text-xs text-muted-foreground">
                  The key will be automatically disabled after this period
                </p>
              </div>
              <Select
                value={expiresIn}
                onValueChange={setExpiresIn}
                disabled={createMutation.isPending}
              >
                <SelectTrigger id="api-key-expires">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {API_KEY_EXPIRATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="px-6"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="px-6"
              disabled={createMutation.isPending}
              onClick={handleCreate}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Key'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Revoke Modal
// =============================================================================

function RevokeApiKeyModal({
  open,
  onOpenChange,
  keyId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyId: string | null;
}) {
  const [confirmText, setConfirmText] = useState('');
  const revokeMutation = useRevokeApiKey();

  useEffect(() => {
    if (!open) {
      setConfirmText('');
    }
  }, [open]);

  const handleRevoke = () => {
    if (!keyId) return;
    revokeMutation.mutate(keyId, {
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
              <DialogTitle className="text-xl font-semibold">Revoke API Key</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Any integrations or scripts using this key will stop working immediately. You can
                generate a new key at any time.
              </DialogDescription>
            </div>
          </div>

          <div>
            <Label htmlFor="revoke-confirm" className="mb-2 block">
              Type <strong>REVOKE</strong> to confirm
            </Label>
            <Input
              id="revoke-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="REVOKE"
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
              disabled={confirmText !== 'REVOKE' || revokeMutation.isPending}
              onClick={handleRevoke}
            >
              {revokeMutation.isPending ? 'Revoking...' : 'Revoke Key'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Rotate Modal
// =============================================================================

function RotateApiKeyModal({
  open,
  onOpenChange,
  keyId,
  currentKeyName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyId: string | null;
  currentKeyName?: string;
}) {
  const [name, setName] = useState('');
  const [expiresIn, setExpiresIn] = useState('0');
  const [rotatedResult, setRotatedResult] = useState<{
    key: string;
    expiresAt: string | null;
  } | null>(null);
  const rotateMutation = useRotateApiKey();

  useEffect(() => {
    if (open) {
      setName(currentKeyName || '');
    } else {
      setName('');
      setExpiresIn('0');
      setRotatedResult(null);
    }
  }, [open, currentKeyName]);

  const handleRotate = () => {
    if (!keyId) return;
    const expiresInValue = parseInt(expiresIn, 10);
    rotateMutation.mutate(
      {
        keyId,
        name: name.trim() || undefined,
        expiresIn: expiresInValue > 0 ? expiresInValue : undefined,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            setRotatedResult({ key: result.data.key, expiresAt: result.data.expiresAt });
          }
        },
      }
    );
  };

  if (rotatedResult) {
    return (
      <ApiKeyCreatedView
        open={open}
        onOpenChange={onOpenChange}
        title="API Key Rotated"
        description="Your previous key has been invalidated. Copy your new key now."
        keyName={name.trim() || undefined}
        apiKey={rotatedResult.key}
        expiresAt={rotatedResult.expiresAt}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-8">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Rotate API Key</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Your current key will be invalidated immediately. A new key will be generated.
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="space-y-0.5">
                <Label htmlFor="rotate-name" className="text-sm font-medium">
                  Name <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <p className="text-xs text-muted-foreground">A label to identify this key</p>
              </div>
              <Input
                id="rotate-name"
                placeholder="Production API"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                disabled={rotateMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <div className="space-y-0.5">
                <Label htmlFor="rotate-expires" className="text-sm font-medium">
                  Expiration
                </Label>
                <p className="text-xs text-muted-foreground">
                  The key will be automatically disabled after this period
                </p>
              </div>
              <Select
                value={expiresIn}
                onValueChange={setExpiresIn}
                disabled={rotateMutation.isPending}
              >
                <SelectTrigger id="rotate-expires">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {API_KEY_EXPIRATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-8">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="px-6"
              onClick={() => onOpenChange(false)}
              disabled={rotateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="px-6"
              disabled={rotateMutation.isPending}
              onClick={handleRotate}
            >
              {rotateMutation.isPending ? 'Rotating...' : 'Rotate Key'}
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

function DevelopersSkeleton() {
  return (
    <div className="max-w-2xl">
      <div className="mb-4">
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-xl border bg-card">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
      <Skeleton className="h-4 w-56 mt-3" />
    </div>
  );
}
