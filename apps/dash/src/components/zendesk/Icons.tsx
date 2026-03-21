/* eslint-disable @next/next/no-img-element */
import { mediaClient } from '@/lib/media';

interface IconProps {
  size?: number;
}

export function UserplaneIcon({ size = 24 }: IconProps) {
  return (
    <img
      src={mediaClient.getBrandMediaUrl('brand/userplane-icon.webp')}
      width={size}
      height={size}
      alt=""
    />
  );
}

export function SuccessIcon({ size = 24 }: IconProps) {
  return (
    <img
      src={mediaClient.getZendeskMediaUrl('zendesk/icon-success.svg')}
      width={size}
      height={size}
      alt=""
    />
  );
}

export function ErrorIcon({ size = 24 }: IconProps) {
  return (
    <img
      src={mediaClient.getZendeskMediaUrl('zendesk/icon-error.svg')}
      width={size}
      height={size}
      alt=""
    />
  );
}

export function RecordingIcon({ size = 24 }: IconProps) {
  return (
    <img
      src={mediaClient.getZendeskMediaUrl('zendesk/icon-recording.svg')}
      width={size}
      height={size}
      alt=""
    />
  );
}

export function RecordingsListIcon({ size = 24 }: IconProps) {
  return (
    <img
      src={mediaClient.getZendeskMediaUrl('zendesk/icon-recordings-list.svg')}
      width={size}
      height={size}
      alt=""
    />
  );
}
