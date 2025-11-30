export interface ClickEvent {
  id: string;
  timestamp: number;
  target: {
    selector: string;
    tagName: string;
    className?: string;
    id?: string;
    textContent?: string;
  };
  position: {
    x: number;
    y: number;
  };
}

export function formatClickTarget(target: ClickEvent['target']): string {
  let result = `<${target.tagName.toLowerCase()}`;

  if (target.id) {
    result += ` id="${target.id}"`;
  }

  if (target.className) {
    result += ` class="${target.className}"`;
  }

  result += '>';

  return result;
}

export function createMockClickEvent(
  id: string,
  timestamp: number,
  selector: string,
  tagName: string,
  position: { x: number; y: number },
  options?: {
    className?: string;
    id?: string;
    textContent?: string;
  }
): ClickEvent {
  return {
    id,
    timestamp,
    target: {
      selector,
      tagName,
      className: options?.className,
      id: options?.id,
      textContent: options?.textContent,
    },
    position,
  };
}
