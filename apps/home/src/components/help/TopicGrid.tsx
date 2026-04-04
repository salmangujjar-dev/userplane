import type { HelpTopic } from '@/types/help';

import TopicCard from './TopicCard';

interface TopicGridProps {
  topics: HelpTopic[];
}

/**
 * Responsive grid of topic cards for the help index page.
 */
export default function TopicGrid({ topics }: TopicGridProps) {
  if (topics.length === 0) {
    return <div className="w-full max-w-5xl py-12" />;
  }

  return (
    <div className="w-full max-w-5xl">
      <div
        className="grid gap-6"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))' }}
      >
        {topics.map((topic) => (
          <TopicCard key={topic.href} topic={topic} />
        ))}
      </div>
    </div>
  );
}
