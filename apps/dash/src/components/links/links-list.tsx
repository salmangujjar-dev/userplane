import { LinkPreview } from './link-preview';
import type { Link } from '@/hooks/use-workspace-links';

interface LinksListProps {
  links?: Link[];
  isLoading?: boolean;
}

export function LinksList({ links, isLoading }: LinksListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!links || links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No links found</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a link to start collecting recordings
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {links.map((link) => (
        <LinkPreview
          key={link.linkId}
          linkId={link.linkId}
          title={link.linkTitle}
          createdBy={link.creator.name}
          createdAt={link.createdAt}
          projectName={link.project.title}
          isReusable={link.linkReusable}
          domainUrl={link.domain.url}
        />
      ))}
    </div>
  );
}
