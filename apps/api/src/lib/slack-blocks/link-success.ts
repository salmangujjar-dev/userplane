/**
 * Link Success Modal
 * Shown after a recording link has been created successfully.
 */

/**
 * Build the success modal view after link creation.
 * Displays the link URL and a creation timestamp.
 */
export function buildLinkSuccessView(params: { linkUrl: string; projectName?: string }) {
  const ts = Math.floor(Date.now() / 1000);
  const iso = new Date().toISOString();

  const contextElements: Array<{ type: string; text: string }> = [
    {
      type: 'mrkdwn',
      text: `Created at <!date^${ts}^{date_short_pretty} at {time}|${iso}>`,
    },
  ];

  if (params.projectName) {
    contextElements.push({
      type: 'mrkdwn',
      text: `Project: ${params.projectName}`,
    });
  }

  return {
    type: 'modal' as const,
    title: {
      type: 'plain_text',
      text: 'Link Created',
    },
    close: {
      type: 'plain_text',
      text: 'Close',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:white_check_mark: *Recording link created*\n\nYour link is live and ready to share:\n<${params.linkUrl}|${params.linkUrl}>`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: contextElements,
      },
    ],
  };
}
