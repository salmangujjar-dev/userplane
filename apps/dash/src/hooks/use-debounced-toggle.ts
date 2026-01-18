import { useCallback, useEffect, useRef, useState } from 'react';

export function useDebouncedToggle(
  initialValue: boolean,
  onUpdate: (value: boolean) => void,
  delay = 500
) {
  const [value, setValue] = useState(initialValue);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const toggle = useCallback(
    (enabled: boolean) => {
      // Immediate optimistic update
      setValue(enabled);

      // Clear existing debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce the API call
      debounceRef.current = setTimeout(() => {
        onUpdate(enabled);
        debounceRef.current = null;
      }, delay);
    },
    [onUpdate, delay]
  );

  return { value, toggle, setValue };
}
