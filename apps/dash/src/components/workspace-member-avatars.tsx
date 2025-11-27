import Avatar from 'boring-avatars';

interface WorkspaceMember {
  id: string;
  name: string;
}

interface WorkspaceMemberAvatarsProps {
  members?: WorkspaceMember[];
}

const DEFAULT_MEMBERS: WorkspaceMember[] = [
  { id: '1', name: 'Alice Johnson' },
  { id: '2', name: 'Bob Smith' },
  { id: '3', name: 'Carol Williams' },
];

export function WorkspaceMemberAvatars({ members = DEFAULT_MEMBERS }: WorkspaceMemberAvatarsProps) {
  return (
    <div className="flex items-center -space-x-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="h-9 w-9 rounded-full border-2 border-background overflow-hidden"
          title={member.name}
        >
          <Avatar
            size={36}
            name={member.name}
            variant="beam"
            colors={['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51']}
          />
        </div>
      ))}
    </div>
  );
}
