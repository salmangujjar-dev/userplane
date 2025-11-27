import { LinkPreview } from './link-preview';

interface LinksListProps {
  count?: number;
  linkIds?: string[];
}

export function LinksList({ count = 5, linkIds }: LinksListProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {[...Array(count)].map((_, i) => (
        <LinkPreview key={i} linkId={linkIds?.[i] || `link-${i + 1}`} />
      ))}
    </div>
  );
}
