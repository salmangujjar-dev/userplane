import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace';
import {
  generateWorkspaceInviteToken,
  sendWorkspaceInvites,
  type InviteToken,
} from '@/lib/workspace-api';
import { toast } from '@workspace/ui/components/sonner';

/**
 * Hook to fetch the invite token for the current workspace
 *
 * @example
 * ```tsx
 * function InviteSection() {
 *   const { data: inviteToken, isLoading } = useWorkspaceInvite();
 *
 *   const inviteUrl = `${window.location.origin}/workspace/invite/accept?token=${inviteToken?.token}`;
 *
 *   return <div>Share: {inviteUrl}</div>;
 * }
 * ```
 */
export function useWorkspaceInvite() {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  return useQuery<InviteToken>({
    queryKey: ['invite-token', workspaceId],
    queryFn: () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      return generateWorkspaceInviteToken(workspaceId);
    },
    enabled: !!workspaceId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to send email invitations to the current workspace
 *
 * @example
 * ```tsx
 * function InviteForm() {
 *   const [emails, setEmails] = useState<string[]>([]);
 *   const { mutate: sendInvites, isPending } = useSendWorkspaceInvites();
 *
 *   const handleSubmit = () => {
 *     sendInvites(emails, {
 *       onSuccess: () => {
 *         toast.success('Invites sent!');
 *         setEmails([]);
 *       }
 *     });
 *   };
 * }
 * ```
 */
export function useSendWorkspaceInvites() {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emails: string[]) => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      return sendWorkspaceInvites(workspaceId, emails);
    },
    onSuccess: (_, emails) => {
      // Invalidate any queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success(`Invites sent to ${emails.length} email${emails.length > 1 ? 's' : ''}`);
    },
    onError: (error) => {
      console.error('Failed to send invites:', error);
      toast.error('Failed to send invites. Please try again.');
    },
  });
}
