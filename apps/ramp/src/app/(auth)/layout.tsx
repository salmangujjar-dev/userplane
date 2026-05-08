import { DemoBanner } from '@/components/layout/DemoBanner';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-sidebar">
      <DemoBanner />
      <div className="flex flex-1 items-center justify-center p-4">{children}</div>
    </div>
  );
}
