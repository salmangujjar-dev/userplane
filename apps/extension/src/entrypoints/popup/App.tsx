import { AuthGuard } from '@/components/auth/AuthGuard';

export default function App() {
  return (
    <div className="w-[360px] min-h-[400px] bg-background text-foreground">
      <AuthGuard>
        <div className="flex flex-col items-center justify-center p-6 gap-4">
          <h1 className="text-lg font-semibold">Userplane</h1>
          <p className="text-sm text-muted-foreground">You are signed in.</p>
        </div>
      </AuthGuard>
    </div>
  );
}
