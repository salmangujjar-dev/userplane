export const UPLOAD_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'available', label: 'Available' },
  { value: 'expired', label: 'Expired' },
  { value: 'purged', label: 'Purged' },
];

export const STREAMING_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'available', label: 'Available' },
  { value: 'failed', label: 'Failed' },
  { value: 'expired', label: 'Expired' },
  { value: 'purged', label: 'Purged' },
];

export const DELETED_STATUS_OPTIONS = [
  { value: 'all', label: 'All Recordings' },
  { value: 'active', label: 'Active Only' },
  { value: 'deleted', label: 'Deleted Only' },
];

export const WEEKS_TO_SHOW_OPTIONS = [
  { value: '12', label: '12 Weeks' },
  { value: '24', label: '24 Weeks' },
  { value: '36', label: '36 Weeks' },
  { value: '48', label: '48 Weeks' },
];

export const PIE_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const MEMBERS_PER_PAGE = 5;

export const chartConfig = {
  recordingCount: {
    label: 'Recording Count',
    color: 'hsl(var(--chart-1))',
  },
  durationMinutes: {
    label: 'Duration (minutes)',
    color: 'hsl(var(--chart-2))',
  },
} as const;

export function formatWeekLabel(week: string): string {
  const date = new Date(week);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
