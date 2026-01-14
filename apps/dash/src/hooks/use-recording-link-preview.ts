import { useState } from 'react';

export function useRecordingLinkPreview() {
  const [selectedOption, setSelectedOption] = useState<'screen-voice' | 'screen-only'>(
    'screen-voice'
  );

  return {
    selectedOption,
    setSelectedOption,
  };
}
