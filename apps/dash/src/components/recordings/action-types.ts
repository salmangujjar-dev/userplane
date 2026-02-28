import type { RecordingActionLog, UserActionData, UserActionType } from '@workspace/contract';

export type { RecordingActionLog, UserActionData, UserActionType } from '@workspace/contract';

export function formatActionTarget(data: UserActionData): string {
  if (!data.info) return '';
  const tag = data.info.tagName.toLowerCase();
  const id = data.info.id ? ` id="${data.info.id}"` : '';
  const cls = data.info.classList.length > 0 ? ` class="${data.info.classList.join(' ')}"` : '';
  return `<${tag}${id}${cls}>`;
}

export function formatActionLabel(action: UserActionType): string {
  switch (action) {
    case 'click':
      return 'Clicked';
    case 'spa_route':
      return 'SPA Navigation';
    case 'navigate':
      return 'Navigated';
    case 'tab_activated':
      return 'Tab Activated';
    case 'tab_deactivated':
      return 'Tab Deactivated';
    case 'tab_switch':
      return 'Tab Switch';
    case 'init_page':
      return 'Page Init';
    case 'page_unload':
      return 'Page Unload';
    case 'recorder-pause':
      return 'Recorder Paused';
    case 'recorder-resume':
      return 'Recorder Resumed';
    default:
      return action;
  }
}

export function createMockActionLog(
  id: string,
  timestamp: number,
  data: UserActionData
): RecordingActionLog {
  return {
    id,
    log_type: 'action',
    type: 'action',
    timestamp,
    data,
  };
}
