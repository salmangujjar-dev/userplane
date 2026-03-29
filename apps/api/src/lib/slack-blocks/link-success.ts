/**
 * Link Success Modal
 * Shown after a recording link has been created successfully.
 */

/**
 * Build the success modal view after link creation.
 * Shows a confirmation message with project and domain context.
 */
export function buildLinkSuccessView(params: { projectName?: string; domainName?: string }) {
  const contextParts = [params.projectName, params.domainName].filter(Boolean);

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
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Your recording link has been created and shared in the conversation.',
        },
      },
      ...(contextParts.length > 0
        ? [
            {
              type: 'context' as const,
              elements: [
                {
                  type: 'plain_text' as const,
                  text: contextParts.join(' \u00b7 '),
                },
              ],
            },
          ]
        : []),
    ],
  };
}
