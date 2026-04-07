import { cn } from '@userplane/ui/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface TeamDropdownEntry {
  slug: string;
  name: string;
  description: string;
  pageHref: string;
  docsHref: string;
  image?: { src: string; alt: string };
  gradientStops?: [string, string, string, string];
}

interface TeamsDropdownProps {
  entries: TeamDropdownEntry[];
  teamsHref: string;
}

export default function TeamsDropdown({ entries, teamsHref }: TeamsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState(entries[0]?.slug ?? '');
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const active = entries.find((e) => e.slug === activeSlug) ?? entries[0];

  const open = useCallback(() => {
    clearTimeout(closeTimeout.current);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    closeTimeout.current = setTimeout(() => setIsOpen(false), 150);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <div
      className="relative inline-block min-h-[48px] py-3 text-sm"
      onMouseEnter={open}
      onMouseLeave={close}
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        onFocus={open}
        className="opacity-70 transition-opacity hover:opacity-100"
      >
        Teams{' '}
        <ChevronDown
          className={cn(
            'ml-0.5 inline size-3 align-[-.1em] transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <div
        className={cn(
          'absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 transition-all duration-200',
          isOpen
            ? 'visible translate-y-0 opacity-100'
            : 'invisible -translate-y-1 opacity-0 pointer-events-none'
        )}
      >
        <div className="w-[640px] rounded-lg border border-border/40 bg-background shadow-lg">
          <div className="grid grid-cols-[200px_1fr]">
            {/* Left sidebar */}
            <div className="border-r border-border/20 p-4">
              <span className="mb-3 block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Teams
              </span>

              <ul className="flex flex-col gap-0.5">
                {entries.map((item) => (
                  <li key={item.slug}>
                    <a
                      href={item.pageHref}
                      onMouseEnter={() => setActiveSlug(item.slug)}
                      onFocus={() => setActiveSlug(item.slug)}
                      className={cn(
                        'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                        activeSlug === item.slug
                          ? 'bg-muted font-medium text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>

              <a
                href={teamsHref}
                className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-foreground hover:underline"
              >
                View all <ChevronRight className="size-3.5" />
              </a>
            </div>

            {/* Right content */}
            <div className="p-4">
              {active?.image && (
                <div className="group/img relative mb-4">
                  {active.gradientStops && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-6 rounded-[200px] opacity-0 transition-opacity duration-700 ease-out group-hover/img:opacity-40"
                      style={{
                        background: `linear-gradient(90deg, ${active.gradientStops[0]} 0%, ${active.gradientStops[1]} 38%, ${active.gradientStops[2]} 71%, ${active.gradientStops[3]} 100%)`,
                        filter: 'blur(40px)',
                      }}
                    />
                  )}
                  <a href={active.pageHref} className="relative block overflow-hidden rounded-md">
                    <img
                      src={active.image.src}
                      alt={active.image.alt}
                      className="w-full object-cover transition-transform duration-300 group-hover/img:scale-[1.02]"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-linear-to-t from-background to-transparent" />
                  </a>
                </div>
              )}

              <div className="mb-2 flex items-center gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  Team
                </span>
                <ChevronRight className="size-3 text-muted-foreground" />
              </div>

              <a href={active.pageHref} className="group">
                <h3 className="mb-1 font-dm-sans text-lg font-medium leading-tight tracking-[-0.01em] text-foreground group-hover:underline">
                  Userplane for {active.name}
                </h3>
              </a>

              <p className="mb-3 line-clamp-2 text-[14px] leading-relaxed text-muted-foreground">
                {active.description}
              </p>

              <div className="flex items-center gap-4 pt-2">
                <a
                  href={active.pageHref}
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-foreground hover:underline"
                >
                  Learn more <ChevronRight className="size-3.5" />
                </a>
                <a
                  href={active.docsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground hover:underline"
                >
                  Docs <ChevronRight className="size-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
