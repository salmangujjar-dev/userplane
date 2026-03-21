import { useEffect, useState } from 'react';

import { useZendeskClient } from './use-client';

interface TicketRequester {
  email: string;
  name: string;
}

interface TicketContext {
  requester: TicketRequester | null;
  ticketId: string | null;
  ticketSubject: string | null;
  ticketPriority: string | null;
  ticketType: string | null;
  ticketTags: string[];
  isLoading: boolean;
}

export function useTicketContext(): TicketContext {
  const client = useZendeskClient();
  const [requester, setRequester] = useState<TicketRequester | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketSubject, setTicketSubject] = useState<string | null>(null);
  const [ticketPriority, setTicketPriority] = useState<string | null>(null);
  const [ticketType, setTicketType] = useState<string | null>(null);
  const [ticketTags, setTicketTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTicketData() {
      try {
        const data = await client.get([
          'ticket.requester',
          'ticket.id',
          'ticket.subject',
          'ticket.priority',
          'ticket.type',
          'ticket.tags',
        ]);

        const requesterData = data['ticket.requester'] as
          | { email?: string; name?: string }
          | undefined;
        if (requesterData?.email) {
          setRequester({
            email: requesterData.email,
            name: requesterData.name || '',
          });
        }

        const id = data['ticket.id'];
        if (id) setTicketId(String(id));

        const subject = data['ticket.subject'];
        if (typeof subject === 'string') setTicketSubject(subject);

        const priority = data['ticket.priority'];
        if (typeof priority === 'string') setTicketPriority(priority);

        const type = data['ticket.type'];
        if (typeof type === 'string') setTicketType(type);

        const tags = data['ticket.tags'];
        if (Array.isArray(tags)) setTicketTags(tags as string[]);
      } catch {
        // Ticket data may not be available (e.g., new ticket)
      } finally {
        setIsLoading(false);
      }
    }

    fetchTicketData();
  }, [client]);

  return { requester, ticketId, ticketSubject, ticketPriority, ticketType, ticketTags, isLoading };
}
