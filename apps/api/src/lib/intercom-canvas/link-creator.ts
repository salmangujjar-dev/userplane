/**
 * Link Creator Canvas Builder
 * Form canvas for creating a recording link with project/domain selection
 */

import type { Canvas, DropdownOption } from '@/api/types/intercom-canvas';

export interface ProjectOption {
  id: string;
  title: string;
}

export interface DomainOption {
  id: string;
  url: string;
}

/**
 * Generate default message for the recording canvas
 * Includes the requester's name for personalization
 */
export function generateDefaultRecordingMessage(adminName: string): string {
  return `${adminName} has requested a screen recording from you`;
}

/**
 * Fallback message if no admin name is available
 */
export const DEFAULT_RECORDING_MESSAGE =
  'Your support team has requested a screen recording from you';

export interface LinkCreatorCanvasOptions {
  projects: ProjectOption[];
  domains: DomainOption[];
  adminName: string;
  defaultProjectId?: string;
  defaultDomainId?: string;
  defaultMessage?: string;
}

/**
 * Build the link creator canvas with project and domain dropdowns
 */
export function buildLinkCreatorCanvas(options: LinkCreatorCanvasOptions): Canvas {
  const projectOptions: DropdownOption[] = options.projects.map((p) => ({
    type: 'option',
    id: p.id,
    text: p.title,
  }));

  const domainOptions: DropdownOption[] = options.domains.map((d) => ({
    type: 'option',
    id: d.id,
    text: d.url,
  }));

  // Find default values or use first option
  const defaultProjectId = options.defaultProjectId || options.projects[0]?.id;
  const defaultDomainId = options.defaultDomainId || options.domains[0]?.id;

  // Generate default message with admin name
  const defaultMessage =
    options.defaultMessage || generateDefaultRecordingMessage(options.adminName);

  return {
    content: {
      components: [
        {
          type: 'text',
          id: 'header',
          text: 'Create recording link',
          style: 'header',
        },
        {
          type: 'text',
          id: 'description',
          text: 'Select a project and domain for the recording',
          style: 'muted',
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'dropdown',
          id: 'project_id',
          label: 'Project',
          options: projectOptions,
          value: defaultProjectId,
        },
        {
          type: 'spacer',
          size: 's',
        },
        {
          type: 'dropdown',
          id: 'domain_id',
          label: 'Domain',
          options: domainOptions,
          value: defaultDomainId,
        },
        {
          type: 'spacer',
          size: 's',
        },
        {
          type: 'input',
          id: 'custom_message',
          label: 'Message to customer',
          placeholder: 'Enter a message for the customer...',
          value: defaultMessage,
        },
        {
          type: 'spacer',
          size: 'm',
        },
        {
          type: 'button',
          id: 'create_link',
          label: 'Create Link',
          style: 'primary',
          action: { type: 'submit' },
        },
        {
          type: 'spacer',
          size: 's',
        },
        {
          type: 'button',
          id: 'go_back',
          label: 'Go back',
          style: 'secondary',
          action: { type: 'submit' },
        },
      ],
    },
    stored_data: {
      flow: 'link_creator',
    },
  };
}
