'use client';

import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select';
import Logo from '@workspace/ui/components/logo';
import { Plus, Trash2, UserPlus } from 'lucide-react';
import type { PlanId } from '@workspace/pricing';
import { useProvisionForm, PLAN_OPTIONS, Member } from './hooks/use-provision-form';
import { AdminProvisionSuccessModal, ProvisionResult } from './admin-provision-success-modal';

interface AdminProvisionWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    owner: { email: string; name: string };
    workspace: { name: string; url: string; plan: PlanId };
    members: Member[];
  }) => void;
  isPending: boolean;
}

export { AdminProvisionSuccessModal, type ProvisionResult };

const FormField = ({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  className,
}: {
  label: string;
  id?: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) => (
  <div className={`space-y-2 ${className}`}>
    <Label htmlFor={id} className="text-sm">
      {label}
    </Label>
    <Input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="rounded-lg"
    />
  </div>
);

/**
 * Modal for provisioning a workspace on behalf of a user.
 * Allows admin to create owner, workspace, and optional members.
 */
export function AdminProvisionWorkspaceModal({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: AdminProvisionWorkspaceModalProps) {
  const {
    ownerEmail,
    setOwnerEmail,
    ownerName,
    setOwnerName,
    workspaceName,
    setWorkspaceName,
    workspaceUrl,
    setWorkspaceUrl,
    workspacePlan,
    setWorkspacePlan,
    members,
    addMember,
    removeMember,
    updateMember,
    isValid,
    resetForm,
    getFormData,
  } = useProvisionForm();

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);

  const handleSubmit = () => {
    if (!isValid) return;
    onSubmit(getFormData());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto scrollbar-none"
        showCloseButton={false}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Provision Workspace</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Create workspace and provision user accounts
              </DialogDescription>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Owner Email"
                  id="owner-email"
                  type="email"
                  placeholder="owner@example.com"
                  value={ownerEmail}
                  onChange={setOwnerEmail}
                  disabled={isPending}
                />
                <FormField
                  label="Owner Name"
                  id="owner-name"
                  placeholder="John Doe"
                  value={ownerName}
                  onChange={setOwnerName}
                  disabled={isPending}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  label="Workspace Name"
                  id="workspace-name"
                  placeholder="Acme Inc"
                  value={workspaceName}
                  onChange={setWorkspaceName}
                  disabled={isPending}
                />
                <FormField
                  label="Domain URL"
                  id="workspace-url"
                  type="url"
                  placeholder="https://example.com"
                  value={workspaceUrl}
                  onChange={setWorkspaceUrl}
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-plan" className="text-sm">
                  Workspace Plan
                </Label>
                <Select
                  value={workspacePlan}
                  onValueChange={(value) => setWorkspacePlan(value as PlanId)}
                  disabled={isPending}
                >
                  <SelectTrigger id="workspace-plan">
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAN_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Members Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Additional Members</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMember}
                  disabled={isPending}
                  className="rounded-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Member
                </Button>
              </div>

              {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 border border-dashed rounded-lg">
                  <UserPlus className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No additional members</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <div
                      key={index}
                      className="flex items-end gap-2 p-3 border rounded-lg bg-muted/30"
                    >
                      <FormField
                        label="Email"
                        type="email"
                        placeholder="member@example.com"
                        value={member.email}
                        onChange={(val) => updateMember(index, 'email', val)}
                        disabled={isPending}
                        className="flex-1"
                      />
                      <FormField
                        label="Name"
                        placeholder="Jane Doe"
                        value={member.name}
                        onChange={(val) => updateMember(index, 'name', val)}
                        disabled={isPending}
                        className="flex-1"
                      />
                      <div className="w-28 space-y-2">
                        <Label className="text-xs">Role</Label>
                        <Select
                          value={member.role}
                          onValueChange={(value) => updateMember(index, 'role', value)}
                          disabled={isPending}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeMember(index)}
                        disabled={isPending}
                        className="text-muted-foreground hover:text-destructive mb-0.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6">
          <div
            className={`flex gap-2 transition-opacity duration-200 ${!isValid ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
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
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? 'Provisioning...' : 'Provision Workspace'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
