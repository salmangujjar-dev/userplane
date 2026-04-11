import { createContext, type ReactNode, useContext, useState } from 'react';

import { cn } from '../../utils';

// ---------------------------------------------------------------------------
// Tabs — simple state-driven tabs with underline indicator
// ---------------------------------------------------------------------------

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>');
  return ctx;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: ReactNode;
}) {
  const [internal, setInternal] = useState(defaultValue ?? '');
  const activeTab = value ?? internal;
  const setActiveTab = (tab: string) => {
    if (value === undefined) setInternal(tab);
    onValueChange?.(tab);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex items-center justify-center gap-6 border-b px-6 pt-3', className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={cn(
        'relative rounded-none border-0 bg-transparent px-0 pb-3 text-sm font-medium shadow-none transition-colors cursor-pointer',
        'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent after:transition-colors',
        isActive
          ? 'text-foreground after:bg-foreground'
          : 'text-muted-foreground hover:text-foreground/80',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const { activeTab } = useTabs();
  if (activeTab !== value) return null;

  return <div className={cn('mt-0', className)}>{children}</div>;
}
