import { LinksList } from './links-list';

interface LinksTabProps {
  linkIds?: string[];
}

export function LinksTab({ linkIds }: LinksTabProps) {
  return (
    <div className="space-y-8">
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Your links</h2>
          <p className="text-sm text-muted-foreground">Manage your recording links</p>
        </div>
        <LinksList count={5} linkIds={linkIds} />
      </div>
    </div>
  );
}
