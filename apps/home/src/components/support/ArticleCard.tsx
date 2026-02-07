import { getSupportArticleUrl } from '@/constants/navigation';

interface ArticleCardProps {
  slug: string;
  topic: string;
  title: string;
  excerpt: string;
}

/**
 * Individual article card shown on topic pages.
 * Links through to the full markdown article.
 */
export default function ArticleCard({ slug, topic, title, excerpt }: ArticleCardProps) {
  const url = getSupportArticleUrl(topic, slug);

  return (
    <article className="text-left border-b border-border/30 pb-6 last:border-b-0">
      <div className="flex flex-col gap-3">
        <h2 className="font-dm-sans font-semibold text-xl md:text-2xl leading-tight hover:text-primary transition-colors">
          <a href={url}>{title}</a>
        </h2>
        <p className="text-muted-foreground leading-relaxed md:text-lg">{excerpt}</p>
        <a
          href={url}
          className="text-sm font-medium text-primary hover:underline inline-flex w-fit"
        >
          Read article →
        </a>
      </div>
    </article>
  );
}
