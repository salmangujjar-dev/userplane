'use client';

import { useState, useEffect } from 'react';
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
import { Plus, Trash2, UserPlus, Copy, Check } from 'lucide-react';
import type { PlanId } from '@workspace/pricing';

interface Member {
  email: string;
  name: string;
  role: 'admin' | 'member';
}

interface ProvisionResult {
  workspaceId: string;
  workspaceName: string;
  owner: {
    userId: string;
    email: string;
    name: string;
    isNew: boolean;
  };
  members: Array<{
    userId: string;
    email: string;
    name: string;
    role: 'admin' | 'member';
    isNew: boolean;
  }>;
}

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

interface AdminProvisionSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: ProvisionResult | null;
}

const PLAN_OPTIONS: Array<{ value: PlanId; label: string }> = [
  { value: 'early_bird_monthly', label: 'Early Bird Monthly' },
  { value: 'tiny_bird_monthly', label: 'Tiny Bird Monthly' },
  { value: 'starter_monthly', label: 'Starter Monthly' },
  { value: 'starter_annual', label: 'Starter Annual' },
  { value: 'scale_up_monthly', label: 'Scale Up Monthly' },
  { value: 'scale_up_annual', label: 'Scale Up Annual' },
  { value: 'enterprise_monthly', label: 'Enterprise Monthly' },
  { value: 'enterprise_annual', label: 'Enterprise Annual' },
];

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
  // Owner fields
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');

  // Workspace fields
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceUrl, setWorkspaceUrl] = useState('');
  const [workspacePlan, setWorkspacePlan] = useState<PlanId>('early_bird_monthly');

  // Members
  const [members, setMembers] = useState<Member[]>([]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setOwnerEmail('');
      setOwnerName('');
      setWorkspaceName('');
      setWorkspaceUrl('');
      setWorkspacePlan('early_bird_monthly');
      setMembers([]);
    }
  }, [open]);

  const isValid =
    ownerEmail.trim() !== '' &&
    ownerName.trim() !== '' &&
    workspaceName.trim() !== '' &&
    workspaceUrl.trim() !== '' &&
    // Validate members have email and name filled
    members.every((m) => m.email.trim() !== '' && m.name.trim() !== '');

  const handleSubmit = () => {
    if (!isValid) return;

    onSubmit({
      owner: {
        email: ownerEmail.trim(),
        name: ownerName.trim(),
      },
      workspace: {
        name: workspaceName.trim(),
        url: workspaceUrl.trim(),
        plan: workspacePlan,
      },
      members: members.map((m) => ({
        email: m.email.trim(),
        name: m.name.trim(),
        role: m.role,
      })),
    });
  };

  const addMember = () => {
    setMembers([...members, { email: '', name: '', role: 'member' }]);
  };

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const updateMember = (index: number, field: keyof Member, value: string) => {
    setMembers(members.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
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
                <div className="space-y-2">
                  <Label htmlFor="owner-email" className="text-sm">
                    Owner Email
                  </Label>
                  <Input
                    id="owner-email"
                    type="email"
                    placeholder="owner@example.com"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    disabled={isPending}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner-name" className="text-sm">
                    Owner Name
                  </Label>
                  <Input
                    id="owner-name"
                    type="text"
                    placeholder="John Doe"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    disabled={isPending}
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="workspace-name" className="text-sm">
                    Workspace Name
                  </Label>
                  <Input
                    id="workspace-name"
                    type="text"
                    placeholder="Acme Inc"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    disabled={isPending}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workspace-url" className="text-sm">
                    Domain URL
                  </Label>
                  <Input
                    id="workspace-url"
                    type="url"
                    placeholder="https://example.com"
                    value={workspaceUrl}
                    onChange={(e) => setWorkspaceUrl(e.target.value)}
                    disabled={isPending}
                    className="rounded-lg"
                  />
                </div>
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
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Email</Label>
                        <Input
                          type="email"
                          placeholder="member@example.com"
                          value={member.email}
                          onChange={(e) => updateMember(index, 'email', e.target.value)}
                          disabled={isPending}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input
                          type="text"
                          placeholder="Jane Doe"
                          value={member.name}
                          onChange={(e) => updateMember(index, 'name', e.target.value)}
                          disabled={isPending}
                          className="rounded-lg"
                        />
                      </div>
                      <div className="w-28 space-y-1">
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
                        className="text-muted-foreground hover:text-destructive"
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

/**
 * Success modal shown after workspace is provisioned.
 * Displays workspace details and allows copying workspace ID.
 */
export function AdminProvisionSuccessModal({
  open,
  onOpenChange,
  result,
}: AdminProvisionSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  if (!result) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.workspaceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" showCloseButton={false}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Logo variant="tiled" size="md" showText={false} />
            <div className="flex flex-col space-y-1">
              <DialogTitle className="text-xl font-semibold">Workspace Provisioned</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Successfully created workspace <strong>{result.workspaceName}</strong> for{' '}
                <strong>{result.owner.email}</strong>.
              </DialogDescription>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {/* Workspace ID */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Workspace ID</p>
                <p className="font-mono text-sm">{result.workspaceId}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCopy} className="h-8 w-8">
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>

            {/* Owner Info */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Owner</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">{result.owner.name}</span>
                <span className="text-sm text-muted-foreground">({result.owner.email})</span>
                {result.owner.isNew && (
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded">
                    New
                  </span>
                )}
              </div>
            </div>

            {/* Members */}
            {result.members.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Members ({result.members.length})</p>
                <div className="space-y-1">
                  {result.members.map((member) => (
                    <div key={member.userId} className="flex items-center gap-2 text-sm">
                      <span>{member.name}</span>
                      <span className="text-muted-foreground">({member.email})</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {member.role}
                      </span>
                      {member.isNew && (
                        <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1.5 py-0.5 rounded">
                          New
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-6">
          <Button type="button" className="rounded-full px-6" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
