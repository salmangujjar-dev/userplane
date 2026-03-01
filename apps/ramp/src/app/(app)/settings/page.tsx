'use client';

import BoringAvatar from 'boring-avatars';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toastManager } from '@/components/ui/toast';
import { authClient } from '@/lib/auth-client';
import { isFeatureEnabled } from '@/lib/feature-flags';

const AVATAR_COLORS = ['#1F1F1F', '#E4F222', '#737373', '#A3A3A3', '#D4D4D4'];

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  const [name, setName] = useState(session?.user?.name ?? '');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [signOutLoading, setSignOutLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setProfileLoading(true);

    if (!isFeatureEnabled('profileUpdate')) {
      console.error('[Settings] Profile service is temporarily unavailable');
      toastManager.add({
        title: 'Failed to update profile',
        description: 'Profile service is temporarily unavailable. Please try again later.',
        type: 'error',
      });
      setProfileLoading(false);
      return;
    }

    try {
      const { error } = await authClient.updateUser({ name: name.trim() });
      if (error) {
        toastManager.add({
          title: 'Failed to update profile',
          description: error.message ?? 'Something went wrong.',
          type: 'error',
        });
      } else {
        toastManager.add({ title: 'Profile updated', type: 'success' });
      }
    } catch {
      toastManager.add({
        title: 'Failed to update profile',
        description: 'Something went wrong. Please try again.',
        type: 'error',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toastManager.add({
        title: 'Passwords do not match',
        description: 'New password and confirmation must match.',
        type: 'error',
      });
      return;
    }

    if (newPassword.length < 8) {
      toastManager.add({
        title: 'Password too short',
        description: 'Password must be at least 8 characters.',
        type: 'error',
      });
      return;
    }

    if (!isFeatureEnabled('passwordChange')) {
      console.error('[Settings] Password service is temporarily unavailable');
      toastManager.add({
        title: 'Failed to change password',
        description: 'Password service is temporarily unavailable. Please try again later.',
        type: 'error',
      });
      return;
    }

    setPasswordLoading(true);

    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });
      if (error) {
        toastManager.add({
          title: 'Failed to change password',
          description: error.message ?? 'Something went wrong.',
          type: 'error',
        });
      } else {
        toastManager.add({ title: 'Password changed', type: 'success' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      toastManager.add({
        title: 'Failed to change password',
        description: 'Something went wrong. Please try again.',
        type: 'error',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!isFeatureEnabled('signOut')) {
      console.error('[Auth] Session service is temporarily unavailable — sign out failed');
      toastManager.add({
        title: 'Unable to sign out',
        description: 'Session service is temporarily unavailable. Please try again later.',
        type: 'error',
      });
      return;
    }
    setSignOutLoading(true);
    await authClient.signOut();
    router.push('/login');
  };

  const userEmail = session?.user?.email ?? '';
  const userName = session?.user?.name ?? '';

  return (
    <div className="p-4 md:p-6 space-y-0">
      {/* Profile section */}
      <section className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-[220px_1fr] py-6">
        <div>
          <h2 className="text-sm font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground mt-1">Your public account details</p>
        </div>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <BoringAvatar size={48} name={userName} variant="beam" colors={AVATAR_COLORS} />
            <div className="min-w-0">
              <p className="font-medium truncate">{userName}</p>
              <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName((e.target as HTMLInputElement).value)}
                placeholder="Your name"
                required
              />
            </Field>
            <Field>
              <FieldLabel>Email</FieldLabel>
              <Input type="email" value={userEmail} disabled />
            </Field>
            <div>
              <Button
                type="submit"
                size="sm"
                disabled={profileLoading || name.trim() === userName}
                render={<button type="submit" />}
              >
                {profileLoading ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <Separator />

      {/* Password section */}
      <section className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-[220px_1fr] py-6">
        <div>
          <h2 className="text-sm font-semibold">Password</h2>
          <p className="text-sm text-muted-foreground mt-1">Update your password</p>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <Field>
            <FieldLabel>Current password</FieldLabel>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword((e.target as HTMLInputElement).value)}
              placeholder="Enter current password"
              required
              autoComplete="current-password"
            />
          </Field>
          <Field>
            <FieldLabel>New password</FieldLabel>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword((e.target as HTMLInputElement).value)}
              placeholder="Enter new password"
              required
              autoComplete="new-password"
            />
          </Field>
          <Field>
            <FieldLabel>Confirm new password</FieldLabel>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
              placeholder="Confirm new password"
              required
              autoComplete="new-password"
            />
          </Field>
          <div>
            <Button
              type="submit"
              size="sm"
              disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
              render={<button type="submit" />}
            >
              {passwordLoading ? 'Changing...' : 'Change password'}
            </Button>
          </div>
        </form>
      </section>

      <Separator />

      {/* Sign out section */}
      <section className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-[220px_1fr] py-6">
        <div>
          <h2 className="text-sm font-semibold">Sign out</h2>
          <p className="text-sm text-muted-foreground mt-1">End your current session</p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="destructive-outline"
            size="sm"
            onClick={handleSignOut}
            disabled={signOutLoading}
          >
            {signOutLoading ? 'Signing out...' : 'Sign out'}
          </Button>
          <p className="text-sm text-muted-foreground">You will be redirected to the login page.</p>
        </div>
      </section>
    </div>
  );
}
