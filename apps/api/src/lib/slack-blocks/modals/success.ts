/**
 * Link Success Modal
 * Shown after a recording link has been created successfully.
 */

interface SuccessModalParams {
  linkUrl: string;
  /** Slack permalink to the posted message (if available) */
  messagePermalink?: string;
}

/**
 * Build the success modal view after link creation.
 * Shows a confirmation with the recording link, optional message permalink, and context footer.
 */
export function buildSuccessModalView(params: SuccessModalParams) {
  const blocks: Record<string, unknown>[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Your recording link is live*',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Your <${params.linkUrl}|recording link> has been created and shared in the conversation.`,
      },
    },
  ];

  if (params.messagePermalink) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'View message',
          },
          url: params.messagePermalink,
          action_id: 'view_message',
        },
      ],
    });
  }

  blocks.push(
    {
      type: 'divider',
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: "We'll notify you when a recording is submitted",
        },
      ],
    }
  );

  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'Link created',
    },
    close: {
      type: 'plain_text',
      text: 'Done',
    },
    blocks,
  };
}
