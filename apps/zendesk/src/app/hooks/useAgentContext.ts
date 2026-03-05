import { useEffect, useState } from 'react';

import { useClient } from './useClient';

interface AgentContext {
  agentEmail: string | null;
  agentName: string | null;
  isLoading: boolean;
}

export function useAgentContext(): AgentContext {
  const client = useClient();
  const [agentEmail, setAgentEmail] = useState<string | null>(null);
  const [agentName, setAgentName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAgentData() {
      try {
        const data = await client.get('currentUser.email', 'currentUser.name');
        const email = data['currentUser.email'];
        const name = data['currentUser.name'];

        if (typeof email === 'string') {
          setAgentEmail(email);
        }
        if (typeof name === 'string') {
          setAgentName(name);
        }
      } catch {
        // currentUser data should always be available in ZAF
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgentData();
  }, [client]);

  return { agentEmail, agentName, isLoading };
}
