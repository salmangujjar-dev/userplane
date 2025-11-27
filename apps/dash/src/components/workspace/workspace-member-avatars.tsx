import Avatar from 'boring-avatars';
import { Plus } from 'lucide-react';

interface WorkspaceMember {
  id: string;
  name: string;
}

interface WorkspaceMemberAvatarsProps {
  members?: WorkspaceMember[];
  onInviteClick?: () => void;
}

const DEFAULT_MEMBERS: WorkspaceMember[] = [
  { id: '1', name: 'Alice Johnson' },
  { id: '2', name: 'Bob Smith' },
  { id: '3', name: 'Carol Williams' },
];

export function WorkspaceMemberAvatars({
  members = DEFAULT_MEMBERS,
  onInviteClick,
}: WorkspaceMemberAvatarsProps) {
  return (
    <div className="flex items-center -space-x-2">
      {members.map((member) => (
        <button
          key={member.id}
          className="h-9 w-9 rounded-full border-2 border-background overflow-hidden hover:scale-110 transition-transform cursor-pointer"
          title={member.name}
          onClick={onInviteClick}
        >
          <Avatar
            size={36}
            name={member.name}
            variant="beam"
            colors={['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']}
          />
        </button>
      ))}
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
