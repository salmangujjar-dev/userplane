import errorSrc from '@/assets/icon-error.svg';
import recordingSrc from '@/assets/icon-recording.svg';
import recordingsListSrc from '@/assets/icon-recordings-list.svg';
import successSrc from '@/assets/icon-success.svg';
import userplaneSrc from '@/assets/icon.svg';

interface IconProps {
  size?: number;
}

export function UserplaneIcon({ size = 24 }: IconProps) {
  return <img src={userplaneSrc} width={size} height={size} alt="" />;
}

export function SuccessIcon({ size = 24 }: IconProps) {
  return <img src={successSrc} width={size} height={size} alt="" />;
}

export function ErrorIcon({ size = 24 }: IconProps) {
  return <img src={errorSrc} width={size} height={size} alt="" />;
}

export function RecordingIcon({ size = 24 }: IconProps) {
  return <img src={recordingSrc} width={size} height={size} alt="" />;
}

export function RecordingsListIcon({ size = 24 }: IconProps) {
  return <img src={recordingsListSrc} width={size} height={size} alt="" />;
}
