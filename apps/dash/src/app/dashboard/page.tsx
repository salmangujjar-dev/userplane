'use client';

import { useAuth } from '@/hooks';
import { Button } from '@workspace/ui/components/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@workspace/ui/components/tabs';
import Logo from '@workspace/ui/components/logo';
import { LogOut, Settings, User, BarChart3 } from 'lucide-react';
import { toast } from '@workspace/ui/components/sonner';
import Link from 'next/link';

export default function DashboardPage() {
  const { signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    toast.success('Signed out successfully');
  };

  return (
    <div className="min-h-svh bg-background">
      <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-8 p-4 px-6 md:px-12 mt-8">
        <div className="flex flex-1 shrink-0 items-center justify-start gap-2">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <Button
          onClick={handleSignOut}
          variant="secondary"
          size="lg"
          className="rounded-full px-7 py-6 gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-16">
        <div className="mb-12">
          <h1 className="font-dm-sans text-4xl font-medium tracking-tight md:text-5xl">
            Dashboard
          </h1>
          <p className="text-base text-muted-foreground mt-3">
            Manage your account and view your analytics
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-card rounded-full p-1.5">
            <TabsTrigger value="overview" className="gap-2 rounded-full">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2 rounded-full">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 rounded-full">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl bg-card p-8 border">
                <h3 className="font-medium text-sm text-muted-foreground">Total Users</h3>
                <p className="text-4xl font-dm-sans font-medium mt-4">0</p>
                <p className="text-sm text-muted-foreground mt-2">No users yet</p>
              </div>
              <div className="rounded-2xl bg-card p-8 border">
                <h3 className="font-medium text-sm text-muted-foreground">Active Sessions</h3>
                <p className="text-4xl font-dm-sans font-medium mt-4">0</p>
                <p className="text-sm text-muted-foreground mt-2">No active sessions</p>
              </div>
              <div className="rounded-2xl bg-card p-8 border">
                <h3 className="font-medium text-sm text-muted-foreground">API Calls</h3>
                <p className="text-4xl font-dm-sans font-medium mt-4">0</p>
                <p className="text-sm text-muted-foreground mt-2">This month</p>
              </div>
            </div>
            <div className="rounded-2xl bg-card p-12 text-center border">
              <p className="text-muted-foreground">
                Your analytics will appear here once you start collecting data
              </p>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="rounded-2xl bg-card p-8 border">
              <h3 className="text-lg font-medium mb-6">Profile Information</h3>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground mt-2">Your email will appear here</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground mt-2">Your name will appear here</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="rounded-2xl bg-card p-8 border">
              <h3 className="text-lg font-medium mb-6">Account Settings</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notifications</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage your notification preferences
                    </p>
                  </div>
                  <Button variant="secondary" size="lg" className="rounded-full px-6">
                    Configure
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
