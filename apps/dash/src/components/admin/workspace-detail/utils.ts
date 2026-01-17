/**
 * Utility functions and constants for admin workspace detail views
 */

import { ADMIN_WORKSPACE_MEMBERS_PAGINATION } from '@workspace/contract';

/**
 * Members per page for pagination
 */
export const MEMBERS_PER_PAGE = ADMIN_WORKSPACE_MEMBERS_PAGINATION.DEFAULT_PER_PAGE;

/**
 * Pie chart colors for data visualization
 */
export const PIE_COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#6366f1', // indigo-500
  '#f97316', // orange-500
  '#06b6d4', // cyan-500
];

/**
 * Chart configuration for recharts
 */
export const chartConfig: Record<string, { label: string; color: string }> = {
  recordingCount: {
    label: 'Recordings',
    color: '#3b82f6',
  },
  totalDuration: {
    label: 'Duration',
    color: '#8b5cf6',
  },
  durationMinutes: {
    label: 'Duration (minutes)',
    color: '#8b5cf6',
  },
};

/**
 * Format week label from ISO date string
 * Example: "2024-01-15" -> "Jan 15"
 */
export function formatWeekLabel(weekString: string): string {
  const date = new Date(weekString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
