import { Link } from '@tanstack/react-router';
import { cn } from '@userplane/ui/lib/utils';
import { Link2, Plus, Settings, Video } from 'lucide-react';

const navItems = [
  { to: '/' as const, label: 'Links', icon: Link2 },
  { to: '/recordings' as const, label: 'Recordings', icon: Video },
  { to: '/create' as const, label: 'Create', icon: Plus },
  { to: '/settings' as const, label: 'Settings', icon: Settings },
];

export function SidePanelNav() {
  return (
    <nav className="border-t bg-background">
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="flex flex-col items-center gap-1 py-3 px-4 text-muted-foreground transition-colors hover:text-foreground"
            activeProps={{ className: 'text-foreground' }}
            activeOptions={{ exact: item.to === '/' }}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5', isActive && 'text-primary')} />
                <span className={cn('text-[10px] font-medium', isActive && 'text-primary')}>
                  {item.label}
                </span>
              </>
            )}
          </Link>
        ))}
      </div>
    </nav>
  );
}
