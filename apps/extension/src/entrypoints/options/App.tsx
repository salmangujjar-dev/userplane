import { AuthGuard } from '@/components/auth/AuthGuard';

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthGuard>
        <div className="max-w-2xl mx-auto p-8">
          <h1 className="text-2xl font-semibold mb-4">Userplane Options</h1>
          <p className="text-muted-foreground">Extension settings will appear here.</p>
        </div>
      </AuthGuard>
    </div>
  );
}
