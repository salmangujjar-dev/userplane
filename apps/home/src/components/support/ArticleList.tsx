import ArticleCard from './ArticleCard';

interface Article {
  slug: string;
  topic: string;
  title: string;
  excerpt: string;
}

interface ArticleListProps {
  articles: Article[];
}

/**
 * Vertical list of article cards for a given topic.
 */
export default function ArticleList({ articles }: ArticleListProps) {
  if (articles.length === 0) {
    return (
      <div className="w-full max-w-4xl py-12 text-center text-muted-foreground">
        No articles yet. Check back soon.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="grid gap-8">
        {articles.map((article) => (
          <ArticleCard key={article.slug} {...article} />
        ))}
      </div>
    </div>
  );
}
