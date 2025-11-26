'use client';

import { useAuth } from '@/hooks';
import { Button } from '@workspace/ui/components/button';

export default function DashboardPage() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome to your dashboard</p>
          </div>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Your dashboard is ready for new features.
          </p>
        </div>
      </div>
    </div>
  );
}
