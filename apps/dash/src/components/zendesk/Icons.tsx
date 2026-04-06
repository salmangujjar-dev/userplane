/* eslint-disable @next/next/no-img-element */

interface IconProps {
  size?: number;
}

export function UserplaneIcon({ size = 24 }: IconProps) {
  return <img src="/brand/userplane-icon.webp" width={size} height={size} alt="" />;
}

export function SuccessIcon({ size = 24 }: IconProps) {
  return <img src="/zendesk/icon-success.svg" width={size} height={size} alt="" />;
}

export function ErrorIcon({ size = 24 }: IconProps) {
  return <img src="/zendesk/icon-error.svg" width={size} height={size} alt="" />;
}

export function RecordingIcon({ size = 24 }: IconProps) {
  return <img src="/zendesk/icon-recording.svg" width={size} height={size} alt="" />;
}

export function RecordingsListIcon({ size = 24 }: IconProps) {
  return <img src="/zendesk/icon-recordings-list.svg" width={size} height={size} alt="" />;
}

export function LockIcon({ size = 24 }: IconProps) {
  return <img src="/zendesk/icon-lock.svg" width={size} height={size} alt="" />;
}

export function UpgradeIcon({ size = 24 }: IconProps) {
  return <img src="/zendesk/icon-upgrade.svg" width={size} height={size} alt="" />;
}
