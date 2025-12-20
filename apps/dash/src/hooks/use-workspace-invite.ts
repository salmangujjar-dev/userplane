import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';

/**
 * Hook to fetch the invite token for the current workspace
 *
 * @example
 * ```tsx
 * function InviteSection() {
 *   const { data: inviteToken, isLoading } = useWorkspaceInvite();
 *
 *   const inviteUrl = inviteToken?.inviteUrl;
 *
 *   return <div>Share: {inviteUrl}</div>;
 * }
 * ```
 */
export function useWorkspaceInvite() {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  return useQuery({
    queryKey: ['invite-token', workspaceId],
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const response = await apiClient.workspace.invite.getUrl({
        params: { workspaceId },
      });
      return response.data;
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
    mutationFn: async (emails: string[]) => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      await apiClient.workspace.invite.send({
        params: { workspaceId },
        body: { emails },
      });
    },
    onSuccess: (_, emails) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success(`Invites sent to ${emails.length} email${emails.length > 1 ? 's' : ''}`);
    },
    onError: (error) => {
      console.error('Failed to send invites:', error);
      toast.error('Failed to send invites. Please try again.');
    },
  });
}

/**
 * Hook to validate an invite token
 * This is a public endpoint and does not require authentication
 *
 * @param token - The invite token from the URL
 * @param enabled - Whether to run the query (default: true when token exists)
 *
 * @example
 * ```tsx
 * function InviteAcceptPage() {
 *   const searchParams = useSearchParams();
 *   const token = searchParams.get('token');
 *   const { data: inviteInfo, isLoading, error } = useValidateInvite(token);
 *
 *   if (error) return <div>Invalid invite</div>;
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return <div>Join {inviteInfo?.workspaceName}</div>;
 * }
 * ```
 */
export function useValidateInvite(token: string | null, enabled = true) {
  return useQuery({
    queryKey: ['validate-invite', token],
    queryFn: async () => {
      if (!token) {
        throw new Error('No invite token provided');
      }
      const response = await apiClient.invite.validate({
        body: { token },
      });
      return response.data;
    },
    enabled: !!token && enabled,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to accept a workspace invitation
 * This requires authentication
 *
 * @example
 * ```tsx
 * function InviteAcceptPage() {
 *   const router = useRouter();
 *   const { mutate: acceptInvite, isPending } = useAcceptInvite();
 *
 *   const handleAccept = () => {
 *     acceptInvite(
 *       { workspaceId: 'workspace-123', token: 'invite-token' },
 *       {
 *         onSuccess: (result) => {
 *           router.push(`/${result.workspaceId}`);
 *         }
 *       }
 *     );
 *   };
 * }
 * ```
 */
export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, token }: { workspaceId: string; token: string }) => {
      const response = await apiClient.workspace.invite.accept({
        params: { workspaceId },
        body: { token },
      });
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', result.workspaceId] });
      toast.success(`Successfully joined ${result.workspaceName}`);
    },
    onError: (error) => {
      console.error('Failed to accept invite:', error);
      toast.error('Failed to join workspace. Please try again.');
    },
  });
}
