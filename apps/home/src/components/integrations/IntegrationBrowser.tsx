import { cn } from '@userplane/ui/lib/utils';
import { ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface IntegrationEntry {
  slug: string;
  name: string;
  description: string;
  pageHref: string;
  docsHref: string;
  image?: { src: string; alt: string };
  gradientStops?: [string, string, string, string];
  resources: Array<{
    label: string;
    title: string;
    description: string;
    href: string;
  }>;
}

interface IntegrationBrowserProps {
  integrations: IntegrationEntry[];
}

export default function IntegrationBrowser({ integrations }: IntegrationBrowserProps) {
  const [activeSlug, setActiveSlug] = useState(integrations[0]?.slug ?? '');
  const articleRefs = useRef<Record<string, HTMLElement | null>>({});
  const isClickScrolling = useRef(false);

  // Scroll-spy: track which article is in view
  useEffect(() => {
    const els = Object.values(articleRefs.current).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrolling.current) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const slug = entry.target.getAttribute('data-slug');
            if (slug) setActiveSlug(slug);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    for (const el of els) observer.observe(el);
    return () => observer.disconnect();
  }, [integrations]);

  const scrollTo = useCallback((slug: string) => {
    setActiveSlug(slug);
    const el = articleRefs.current[slug];
    if (!el) return;

    isClickScrolling.current = true;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Release scroll-spy lock after animation
    setTimeout(() => {
      isClickScrolling.current = false;
    }, 800);
  }, []);

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl p-4">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          {/* Sticky sidebar */}
          <nav className="shrink-0 lg:sticky lg:top-24 lg:w-56 lg:self-start">
            <ul className="flex flex-row flex-wrap gap-1 lg:flex-col lg:gap-0">
              {integrations.map((item) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => scrollTo(item.slug)}
                    className={cn(
                      'block w-full rounded-md px-3 py-2 text-left text-sm transition-colors',
                      activeSlug === item.slug
                        ? 'bg-muted font-medium text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Articles */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col divide-y divide-border/40">
              {integrations.map((item) => (
                <article
                  key={item.slug}
                  ref={(el) => {
                    articleRefs.current[item.slug] = el;
                  }}
                  data-slug={item.slug}
                  className="scroll-mt-24 py-10 first:pt-0 last:pb-0"
                >
                  {/* Label */}
                  <div className="mb-3 flex items-center gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      Integration
                    </span>
                    <ChevronRight className="size-3 text-muted-foreground" />
                  </div>

                  {/* Title */}
                  <a href={item.pageHref} className="group">
                    <h2 className="mb-2 font-dm-sans text-[clamp(20px,2.5vw,28px)] font-medium leading-tight tracking-[-0.01em] text-foreground group-hover:underline">
                      Userplane for {item.name}
                    </h2>
                  </a>

                  {/* Description */}
                  <p className="max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>

                  {/* Learn more */}
                  <a
                    href={item.pageHref}
                    className="mb-6 mt-2 inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
                  >
                    Learn more <ChevronRight className="size-3.5" />
                  </a>

                  {/* Bleed image with brand gradient on hover */}
                  {item.image && (
                    <div className="group/img relative mb-6">
                      {item.gradientStops && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -inset-10 rounded-[300px] opacity-0 transition-opacity duration-700 ease-out group-hover/img:opacity-40"
                          style={{
                            background: `linear-gradient(90deg, ${item.gradientStops[0]} 0%, ${item.gradientStops[1]} 38%, ${item.gradientStops[2]} 71%, ${item.gradientStops[3]} 100%)`,
                            filter: 'blur(60px)',
                          }}
                        />
                      )}
                      <a href={item.pageHref} className="relative block overflow-hidden rounded-lg">
                        <img
                          src={item.image.src}
                          alt={item.image.alt}
                          width={1440}
                          height={900}
                          loading="lazy"
                          decoding="async"
                          className="w-full object-cover transition-transform duration-300 group-hover/img:scale-[1.02]"
                        />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-background to-transparent" />
                      </a>
                    </div>
                  )}

                  {/* Resource links */}
                  <div className="grid grid-cols-1 gap-5 border-t border-border/20 pt-6 sm:grid-cols-3">
                    {item.resources.map((res) => {
                      const isExternal = res.href.startsWith('http');
                      return (
                        <a
                          key={res.title}
                          href={res.href}
                          {...(isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
                          className="group/res block"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                              {res.label}
                            </span>
                            <ChevronRight className="size-3 text-muted-foreground transition-transform group-hover/res:translate-x-0.5" />
                          </div>
                          <p className="mb-1 text-base font-medium text-foreground">{res.title}</p>
                          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {res.description}
                          </p>
                        </a>
                      );
                    })}
                  </div>

                  {/* Footer links */}
                  <div className="mt-6 flex items-center gap-4">
                    <a
                      href={item.pageHref}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
                    >
                      Learn more <ChevronRight className="size-3.5" />
                    </a>
                    <a
                      href={item.docsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Docs <ChevronRight className="size-3.5" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
