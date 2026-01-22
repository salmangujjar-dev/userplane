'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  AccountNameSchema,
  FormEmailSchema,
  FormURLSchema,
  WorkspaceNameSchema,
} from '@workspace/contract';
import type { UserSelectablePlanId } from '@workspace/pricing';
import { Button } from '@workspace/ui/components/button';
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
import { Plus, Trash2, UserPlus } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { URLInput } from '@/components/url-input';
import { USER_SELECTABLE_PLAN_OPTIONS } from '@/hooks/use-provision-form';

import { AdminProvisionSuccessModal, ProvisionResult } from './admin-provision-success-modal';

const provisionMemberSchema = z.object({
  email: FormEmailSchema,
  name: AccountNameSchema,
  role: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'Please select a valid role' }),
  }),
});

const provisionWorkspaceSchema = z.object({
  owner: z.object({
    email: FormEmailSchema,
    name: AccountNameSchema,
  }),
  workspace: z.object({
    name: WorkspaceNameSchema,
    url: FormURLSchema,
    plan: z.string().min(1, 'Please select a plan') as z.ZodType<UserSelectablePlanId>,
  }),
  members: z.array(provisionMemberSchema),
});

type ProvisionWorkspaceFormData = z.infer<typeof provisionWorkspaceSchema>;

interface AdminProvisionWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProvisionWorkspaceFormData) => void;
  isPending: boolean;
}

export { AdminProvisionSuccessModal, type ProvisionResult };

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
  const form = useForm<ProvisionWorkspaceFormData>({
    resolver: zodResolver(provisionWorkspaceSchema),
    mode: 'onTouched',
    defaultValues: {
      owner: {
        email: '',
        name: '',
      },
      workspace: {
        name: '',
        url: '',
        plan: 'starter_annual',
      },
      members: [],
    },
  });

  const { control, handleSubmit, reset, register, formState } = form;
  const { errors, isValid } = formState;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members',
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const addMember = () => {
    append({ email: '', name: '', role: 'member' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto scrollbar-none"
        showCloseButton={false}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
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
                  <div className="space-y-1.5">
                    <Label htmlFor="owner-email" className="text-sm">
                      Owner Email
                    </Label>
                    <Input
                      id="owner-email"
                      type="email"
                      placeholder="owner@example.com"
                      {...register('owner.email')}
                      disabled={isPending}
                      className={errors.owner?.email ? 'border-destructive' : ''}
                    />
                    <div className="h-4">
                      {errors.owner?.email && (
                        <p className="text-xs text-destructive">{errors.owner.email.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="owner-name" className="text-sm">
                      Owner Name
                    </Label>
                    <Input
                      id="owner-name"
                      placeholder="John Doe"
                      {...register('owner.name')}
                      disabled={isPending}
                      className={errors.owner?.name ? 'border-destructive' : ''}
                    />
                    <div className="h-4">
                      {errors.owner?.name && (
                        <p className="text-xs text-destructive">{errors.owner.name.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="workspace-name" className="text-sm">
                      Workspace Name
                    </Label>
                    <Input
                      id="workspace-name"
                      placeholder="Acme Inc"
                      {...register('workspace.name')}
                      disabled={isPending}
                      className={errors.workspace?.name ? 'border-destructive' : ''}
                    />
                    <div className="h-4">
                      {errors.workspace?.name && (
                        <p className="text-xs text-destructive">{errors.workspace.name.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="workspace-plan" className="text-sm">
                      Workspace Plan
                    </Label>
                    <Controller
                      name="workspace.plan"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isPending}
                        >
                          <SelectTrigger id="workspace-plan">
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {USER_SELECTABLE_PLAN_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <div className="h-4">
                      {errors.workspace?.plan && (
                        <p className="text-xs text-destructive">{errors.workspace.plan.message}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="workspace-url" className="text-sm">
                    Domain URL
                  </Label>
                  <Controller
                    name="workspace.url"
                    control={control}
                    render={({ field }) => (
                      <URLInput
                        id="workspace-url"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        placeholder="example.com"
                        error={!!errors.workspace?.url}
                        disabled={isPending}
                      />
                    )}
                  />
                  <div className="h-4">
                    {errors.workspace?.url && (
                      <p className="text-xs text-destructive">{errors.workspace.url.message}</p>
                    )}
                  </div>
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

                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 border border-dashed rounded-lg">
                    <UserPlus className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No additional members</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-xs">Email</Label>
                          <Input
                            type="email"
                            placeholder="member@example.com"
                            {...register(`members.${index}.email`)}
                            disabled={isPending}
                            className={errors.members?.[index]?.email ? 'border-destructive' : ''}
                          />
                          <div className="h-4">
                            {errors.members?.[index]?.email && (
                              <p className="text-xs text-destructive">
                                {errors.members[index]?.email?.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-xs">Name</Label>
                          <Input
                            placeholder="Jane Doe"
                            {...register(`members.${index}.name`)}
                            disabled={isPending}
                            className={errors.members?.[index]?.name ? 'border-destructive' : ''}
                          />
                          <div className="h-4">
                            {errors.members?.[index]?.name && (
                              <p className="text-xs text-destructive">
                                {errors.members[index]?.name?.message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="w-28 space-y-1.5">
                          <Label className="text-xs">Role</Label>
                          <Controller
                            name={`members.${index}.role`}
                            control={control}
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
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
                            )}
                          />
                          <div className="h-4" />
                        </div>
                        <div className="space-y-1.5">
                          <div className="h-4" />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={isPending}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="h-4" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="rounded-full px-6"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-full px-6" disabled={!isValid || isPending}>
                {isPending ? 'Provisioning...' : 'Provision Workspace'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
