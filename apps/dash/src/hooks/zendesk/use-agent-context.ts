import { useEffect, useState } from 'react';

import { useZendeskClient } from './use-client';

interface AgentContext {
  agentEmail: string | null;
  agentName: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useAgentContext(): AgentContext {
  const client = useZendeskClient();
  const [agentEmail, setAgentEmail] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAgentData() {
      try {
        const data = await client.get(['currentUser.email', 'currentUser.name']);
        const email = data['currentUser.email'];
        const name = data['currentUser.name'];

        if (typeof email === 'string' && email) {
          setAgentEmail(email);
        } else {
          setError('Could not resolve your email. Please reload the app.');
        }
        if (typeof name === 'string') {
          setAgentName(name);
        }
      } catch {
        setError('Failed to load agent info from Zendesk.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgentData();
  }, [client]);

  return { agentEmail, agentName, isLoading, error };
}
