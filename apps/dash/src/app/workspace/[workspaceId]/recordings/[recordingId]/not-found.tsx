import { NotFoundPage } from '@/components/shared/not-found-page';

export default function RecordingNotFound() {
  return (
    <NotFoundPage
      heading="Recording not found"
      subtitle="This recording may have been deleted or you may not have access."
    />
  );
}
