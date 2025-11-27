import { LinksList } from './links-list';

interface LinksTabProps {
  linkIds?: string[];
}

export function LinksTab({ linkIds }: LinksTabProps) {
  return (
    <div className="space-y-8">
      <LinksList count={5} linkIds={linkIds} />
    </div>
  );
}
