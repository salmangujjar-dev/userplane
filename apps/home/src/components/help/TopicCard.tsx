import { ChevronRight } from 'lucide-react';

import type { HelpTopic } from '@/constants/help';

interface TopicCardProps {
  topic: HelpTopic;
}

/**
 * Card linking to a help topic.
 * Shows title and subtitle with a chevron indicator.
 */
export default function TopicCard({ topic }: TopicCardProps) {
  return (
    <a
      href={topic.href}
      className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 text-left transition-all hover:border-zinc-300 hover:shadow-sm"
    >
      <h2 className="font-dm-sans font-semibold text-xl md:text-2xl text-zinc-900 group-hover:text-primary transition-colors">
        {topic.title}
      </h2>
      <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{topic.subtitle}</p>
      <div className="mt-auto flex items-center justify-end pt-2">
        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </a>
  );
}
