'use client';

import { Button } from '@workspace/ui/components/button';
import { Checkbox } from '@workspace/ui/components/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import Logo from '@workspace/ui/components/logo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import { useRef, useState } from 'react';

import type { WorkspaceRole } from '@/types';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AdminBanUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onConfirm: (options: {
    reason: string;
    expiresInSeconds?: number;
    deleteWorkspacesForRoles?: WorkspaceRole[];
  }) => void;
  isPending: boolean;
}

const BAN_DURATION_OPTIONS = [
  { label: 'Permanent', value: 'permanent' },
  { label: '1 hour', value: String(60 * 60) },
  { label: '24 hours', value: String(24 * 60 * 60) },
  { label: '7 days', value: String(7 * 24 * 60 * 60) },
  { label: '30 days', value: String(30 * 24 * 60 * 60) },
  { label: 'Custom', value: 'custom' },
];

export function AdminBanUserModal({
  open,
  onOpenChange,
  user,
  onConfirm,
  isPending,
}: AdminBanUserModalProps) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('permanent');
  const [customDays, setCustomDays] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deleteWorkspacesForRoles, setDeleteWorkspacesForRoles] = useState<WorkspaceRole[]>([
    'owner',
  ]);

  // Reset form when modal closes (adjust state during render)
  const prevOpenRef = useRef(open);
  if (!open && prevOpenRef.current) {
    setReason('');
    setDuration('permanent');
    setCustomDays('');
    setConfirmEmail('');
    setDeleteWorkspacesForRoles(['owner']);
  }
  prevOpenRef.current = open;

  const handleRoleToggle = (role: WorkspaceRole) => {
    setDeleteWorkspacesForRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleConfirm = () => {
    if (!reason.trim() || confirmEmail !== user?.email) return;

    let expiresInSeconds: number | undefined;

    if (duration === 'custom' && customDays) {
      expiresInSeconds = parseInt(customDays, 10) * 24 * 60 * 60;
    } else if (duration !== 'permanent') {
      expiresInSeconds = parseInt(duration, 10);
    }

    onConfirm({
      reason: reason.trim(),
      expiresInSeconds,
      deleteWorkspacesForRoles,
    });
  };

  if (!user) return null;

  const isConfirmDisabled = !reason.trim() || confirmEmail !== user.email || isPending;
  const displayName = user.name || 'this user';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Ban User</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Ban <strong>{displayName}</strong> (<strong>{user.email}</strong>) from signing in
                and revoke all their active sessions
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reason" className="mb-2 block">
                Ban Reason <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="reason"
                placeholder="Enter reason for banning this user..."
                value={reason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReason(e.target.value)}
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <Label htmlFor="duration" className="mb-2 block">
                Ban Duration
              </Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {BAN_DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {duration === 'custom' && (
              <div>
                <Label htmlFor="customDays" className="mb-2 block">
                  Custom Duration (days)
                </Label>
                <Input
                  id="customDays"
                  type="number"
                  min="1"
                  placeholder="Enter number of days"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label className="mb-2 block">Delete Workspaces Where User Is:</Label>
              <div className="space-y-2 rounded-md border border-input bg-background p-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delete-owner"
                    checked={deleteWorkspacesForRoles.includes('owner')}
                    onCheckedChange={() => handleRoleToggle('owner')}
                    disabled={isPending}
                  />
                  <label
                    htmlFor="delete-owner"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Owner
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delete-admin"
                    checked={deleteWorkspacesForRoles.includes('admin')}
                    onCheckedChange={() => handleRoleToggle('admin')}
                    disabled={isPending}
                  />
                  <label
                    htmlFor="delete-admin"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Admin
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="delete-member"
                    checked={deleteWorkspacesForRoles.includes('member')}
                    onCheckedChange={() => handleRoleToggle('member')}
                    disabled={isPending}
                  />
                  <label
                    htmlFor="delete-member"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Member
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {deleteWorkspacesForRoles.length === 0
                    ? 'No workspaces will be deleted'
                    : `Workspaces where user has ${deleteWorkspacesForRoles.join(', ')} role will be deleted`}
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="confirm-email" className="mb-2 block">
                Type <strong>{user.email}</strong> to confirm
              </Label>
              <Input
                id="confirm-email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                placeholder={user.email}
                disabled={isPending}
                autoComplete="off"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex gap-2 w-full justify-end">
            <Button
              type="button"
              variant="secondary"
              className="rounded-full px-6"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-full px-6"
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
            >
              {isPending ? 'Banning...' : 'Ban User'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
