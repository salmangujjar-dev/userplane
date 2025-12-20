import { LinksList } from './links-list';
import type { Link } from '@/hooks/use-workspace-links';

interface LinksTabProps {
  links?: Link[];
  isLoading?: boolean;
}

export function LinksTab({ links, isLoading }: LinksTabProps) {
  return (
    <div className="space-y-8">
      <LinksList links={links} isLoading={isLoading} />
    </div>
  );
}
