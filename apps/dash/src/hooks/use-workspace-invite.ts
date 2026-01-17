import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceStore } from '@/stores/workspace';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import { handleSafeResult, showErrorToast, type SafeResult } from '@/lib/errors';

/**
 * Hook to fetch the invite token for the current workspace
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 *
 * @example
 * ```tsx
 * function InviteSection() {
 *   const { data, isLoading } = useWorkspaceInvite();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (data && !data.success) {
 *     return <ErrorState error={data.error} />;
 *   }
 *
 *   const inviteUrl = data.data.inviteUrl;
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
      const [error, response] = await apiClient.workspace.invite.getUrl({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
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
interface SendInvitesData {
  sentCount: number;
}

export function useSendWorkspaceInvites() {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const queryClient = useQueryClient();

  return useMutation<SafeResult<SendInvitesData>, Error, string[]>({
    mutationFn: async (emails: string[]) => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.invite.send({
        params: { workspaceId },
        body: { emails },
      });
      return handleSafeResult(error, response?.data ? { sentCount: emails.length } : null);
    },
    onSuccess: (result, emails) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-resource-counts', workspaceId] });
      toast.success(`Invites sent to ${emails.length} email${emails.length > 1 ? 's' : ''}`);
    },
    onError: (error: unknown) => {
      // Only unknown errors reach here
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}

/**
 * Hook to validate an invite token
 * This is a public endpoint and does not require authentication
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 *
 * @param token - The invite token from the URL
 * @param enabled - Whether to run the query (default: true when token exists)
 *
 * @example
 * ```tsx
 * function InviteAcceptPage() {
 *   const searchParams = useSearchParams();
 *   const token = searchParams.get('token');
 *   const { data, isLoading } = useValidateInvite(token);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (data && !data.success) {
 *     return <div>Invalid invite: {data.error.message}</div>;
 *   }
 *
 *   return <div>Join {data.data.workspaceName}</div>;
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
      const [error, response] = await apiClient.invite.validate({
        body: { token },
      });
      return handleSafeResult(error, response?.data ?? null);
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
 *           if (result.success) {
 *             router.push(`/${result.data.workspaceId}`);
 *           }
 *         }
 *       }
 *     );
 *   };
 * }
 * ```
 */
type AcceptInviteData =
  | {
      alreadyMember: false;
      workspaceId: string;
      workspaceName: string;
    }
  | {
      alreadyMember: true;
      workspaceId: string;
      workspaceName: string;
    };

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<AcceptInviteData>, Error, { workspaceId: string; token: string }>({
    mutationFn: async ({ workspaceId, token }) => {
      const [error, response] = await apiClient.workspace.invite.accept({
        params: { workspaceId },
        body: { token },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showErrorToast(result.error);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', result.data.workspaceId] });

      if (result.data.alreadyMember) {
        // Don't show message for already member case
        return;
      }

      toast.success(`Successfully joined ${result.data.workspaceName}`);
    },
    onError: (error: unknown) => {
      // Only unknown errors reach here
      toast.error('An unexpected error occurred', {
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    },
  });
}
