'use client';

import { Button } from '@userplane/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@userplane/ui/components/dialog';
import Logo from '@userplane/ui/components/logo';
import { useEffect, useState } from 'react';

import { WORKSPACE_ROLE_OPTIONS } from '@/constants';

type ActionType = 'remove' | 'changeRole';
type Role = 'owner' | 'admin' | 'member';

interface TeamMemberActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: ActionType | null;
  memberName: string;
  memberEmail: string;
  currentRole?: Role;
  onConfirm: (newRole?: Role) => void;
  isPending?: boolean;
  canMakeOwner?: boolean;
}

const ROLE_OPTIONS = WORKSPACE_ROLE_OPTIONS;

/**
 * Modal to confirm team member role changes and removal.
 * Uses consistent styling with create/edit modals in the app.
 */
export function TeamMemberActionModal({
  open,
  onOpenChange,
  actionType,
  memberName,
  memberEmail,
  currentRole,
  onConfirm,
  isPending = false,
  canMakeOwner = false,
}: TeamMemberActionModalProps) {
  const [selectedRole, setSelectedRole] = useState<Role | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setSelectedRole(undefined);
    }
  }, [open]);

  if (!actionType) return null;

  const isRemoveAction = actionType === 'remove';
  const isChangeRole = actionType === 'changeRole';

  const handleConfirm = () => {
    if (isChangeRole && selectedRole) {
      onConfirm(selectedRole);
    } else {
      onConfirm();
    }
  };

  const availableRoles = canMakeOwner
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((role) => role.value !== 'owner');

  if (isRemoveAction) {
    const consequences = [
      {
        title: 'Workspace Access',
        description: 'Will lose access to all workspace',
      },
      {
        title: 'Projects Access',
        description: 'Will no longer be able to view or create projects',
      },
      {
        title: 'Recordings Access',
        description: 'Will no longer be able to view or request recordings',
      },
      {
        title: 'Links Access',
        description: 'Will no longer be able to create or accept recordings on links',
      },
      {
        title: 'Team Access',
        description: 'Will need to be re-invited to rejoin the workspace',
      },
    ];

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
          <div className="space-y-6 py-4">
            <div className="flex items-start gap-4">
              <Logo variant="tiled" size="md" showText={false} />
              <div className="flex flex-col space-y-1">
                <DialogTitle className="text-xl font-semibold">Remove Member</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Remove access for <strong>{memberName}</strong> (<strong>{memberEmail}</strong>)
                </DialogDescription>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <div className="space-y-2.5">
                {consequences.map((consequence) => (
                  <div key={consequence.title} className="flex gap-2">
                    <span className="text-muted-foreground mt-0.5">•</span>
                    <div className="space-y-0.5">
                      <p className="font-medium text-sm">{consequence.title}</p>
                      <p className="text-xs text-muted-foreground">{consequence.description}</p>
                    </div>
                  </div>
                ))}
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
                disabled={isPending}
              >
                {isPending ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" showCloseButton={false}>
        <div className="space-y-6 py-4">
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Change Role</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Update role for <strong>{memberName}</strong> (<strong>{memberEmail}</strong>)
              </DialogDescription>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <div className="space-y-3">
              {availableRoles.map((role) => {
                const isSelected = selectedRole === role.value;
                const isCurrent = currentRole === role.value;

                return (
                  <div
                    key={role.value}
                    className={`flex items-start gap-3 p-4 rounded-xl border bg-card transition-all min-h-[88px] ${
                      isCurrent
                        ? 'opacity-50 cursor-not-allowed'
                        : isSelected
                          ? 'border-foreground border-dashed cursor-pointer'
                          : 'hover:border-muted-foreground cursor-pointer'
                    }`}
                    {...(!isCurrent
                      ? {
                          role: 'button' as const,
                          tabIndex: 0,
                          onClick: () => setSelectedRole(role.value),
                          onKeyDown: (e: React.KeyboardEvent) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedRole(role.value);
                            }
                          },
                        }
                      : {})}
                  >
                    <div
                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'border-foreground' : 'border-muted-foreground'
                      }`}
                    >
                      {isSelected && <div className="h-2 w-2 rounded-full bg-foreground" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{role.label}</p>
                        {isCurrent && (
                          <span className="text-xs text-muted-foreground">(Current)</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                );
              })}
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
              disabled={isPending || !selectedRole || selectedRole === currentRole}
            >
              {isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
