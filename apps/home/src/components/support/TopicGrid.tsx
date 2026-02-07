import type { SupportTopic } from '@/constants/support';

import TopicCard from './TopicCard';

interface TopicWithCount {
  topic: SupportTopic;
  articleCount: number;
}

interface TopicGridProps {
  topics: TopicWithCount[];
}

/**
 * Responsive grid of topic cards for the support index page.
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
        {topics.map((t) => (
          <TopicCard key={t.topic.slug} topic={t.topic} articleCount={t.articleCount} />
        ))}
      </div>
    </div>
  );
}
