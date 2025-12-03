'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useWorkspaceStore } from '@/stores/workspace';
import { BoringAvatar } from '@/components/shared/boring-avatar';
import { Play } from 'lucide-react';
import { useState } from 'react';

interface RecordingPreviewProps {
  recordingId?: string;
  onClick?: () => void;
  createdBy?: string;
  createdAt?: Date;
  duration?: string;
}

const SAMPLE_CREATORS = [
  'Alice Johnson',
  'Carol Williams',
  'David Brown',
  'Emma Davis',
  'Lary Bird',
  'Frank Miller',
];

const SAMPLE_DURATIONS = ['3:12', '5:47', '2:34', '8:15', '1:23', '4:56'];

export function RecordingPreview({
  recordingId,
  onClick,
  createdBy,
  createdAt,
  duration,
}: RecordingPreviewProps) {
  const router = useRouter();
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);
  const [isHovered, setIsHovered] = useState(false);

  const getRecordingIndex = (id: string) => {
    const match = id?.match(/\d+$/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const recordingIndex = recordingId ? getRecordingIndex(recordingId) : 0;
  const displayCreator =
    createdBy || SAMPLE_CREATORS[recordingIndex % SAMPLE_CREATORS.length] || 'Unknown Creator';
  const displayDate = createdAt || new Date(Date.now() - recordingIndex * 86400000 * 2);
  const displayDuration =
    duration || SAMPLE_DURATIONS[recordingIndex % SAMPLE_DURATIONS.length] || '0:00';

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    }
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (recordingId && workspaceId) {
      router.push(`/${workspaceId}/recordings/${recordingId}`);
    }
  };

  const staticImageUrl =
    'https://jam.dev/cdn-cgi/image/width=480,quality=100,dpr=2/https://cdn-jam-screenshots.jam.dev/bba0f128dfa4507c1e4549c3b11f090e/screenshot/f310785e-327e-40c8-8728-59521d9b8176.png';
  const animatedGifUrl =
    'https://customer-9o3ovno0sscvd4n0.cloudflarestream.com/d9ec8ed1f01cfaa79099e83808db6540/thumbnails/thumbnail.gif?width=480&duration=4s';

  return (
    <div className="flex flex-col gap-3">
      <div
        className="aspect-video rounded-xl bg-muted cursor-pointer hover:opacity-90 transition-opacity overflow-hidden relative group"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image
          src={isHovered ? animatedGifUrl : staticImageUrl}
          alt="Recording preview"
          className="w-full h-full object-cover"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          unoptimized
        />
        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1">
          <Play className="h-3 w-3 text-white fill-white" />
          <span className="text-white text-sm font-medium">{displayDuration}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <BoringAvatar name={displayCreator} size={24} />
          <span className="text-sm font-medium truncate">{displayCreator}</span>
        </div>
        <span className="text-sm text-muted-foreground flex-shrink-0">
          {formatDate(displayDate)}
        </span>
      </div>
    </div>
  );
}
