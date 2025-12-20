import { BoringAvatar } from '@/components/shared/boring-avatar';
import { Plus } from 'lucide-react';

interface WorkspaceMember {
  workspaceMemberId: string;
  memberName: string;
  memberEmail: string;
}

interface WorkspaceMemberAvatarsProps {
  members?: WorkspaceMember[];
  onInviteClick?: () => void;
}

export function WorkspaceMemberAvatars({
  members = [],
  onInviteClick,
}: WorkspaceMemberAvatarsProps) {
  const displayMembers = members.slice(0, 5);
  const remainingCount = Math.max(0, members.length - 5);

  return (
    <div className="flex items-center -space-x-2">
      {displayMembers.map((member) => (
        <button
          key={member.workspaceMemberId}
          className="h-9 w-9 rounded-full border-2 border-background overflow-hidden hover:scale-110 transition-transform cursor-pointer"
          title={`${member.memberName} (${member.memberEmail})`}
          onClick={onInviteClick}
        >
          <BoringAvatar size={36} name={member.memberName} />
        </button>
      ))}
      {remainingCount > 0 && (
        <button
          className="h-9 w-9 rounded-full border-2 border-background bg-muted hover:scale-110 transition-transform cursor-pointer flex items-center justify-center"
          title={`${remainingCount} more member${remainingCount > 1 ? 's' : ''}`}
          onClick={onInviteClick}
        >
          <span className="text-xs font-medium text-muted-foreground">+{remainingCount}</span>
        </button>
      )}
      <button
        onClick={onInviteClick}
        className="h-9 w-9 rounded-full border-2 border-dashed border-border bg-background hover:bg-accent transition-colors flex items-center justify-center cursor-pointer"
        title="Invite team member"
      >
        <Plus className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
