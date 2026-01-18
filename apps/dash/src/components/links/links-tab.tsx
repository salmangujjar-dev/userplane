import type { Link } from '@/hooks/use-workspace-links';

import { LinksList } from './links-list';

interface LinksTabProps {
  links?: Link[];
  isLoading?: boolean;
  onRequestRecording?: () => void;
}

export function LinksTab({ links, isLoading, onRequestRecording }: LinksTabProps) {
  return (
    <div className="space-y-8">
      <LinksList links={links} isLoading={isLoading} onRequestRecording={onRequestRecording} />
    </div>
  );
}
