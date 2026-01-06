/**
 * URL parsing utilities for recording app
 */

import { URL_PARAMS, type UrlParams } from '@/constants/url';

/**
 * Read URL parameters during initial render (SSR-safe)
 * Extracts userplane-specific query parameters from the URL
 */
export function getUrlParams(): UrlParams {
  if (typeof window === 'undefined') {
    return { token: '', action: '', workspace: '' };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    token: params.get(URL_PARAMS.TOKEN) || '',
    action: params.get(URL_PARAMS.ACTION) || '',
    workspace: params.get(URL_PARAMS.WORKSPACE) || '',
  };
}

/**
 * Parse comma-separated workspace IDs from URL parameter
 * Handles trimming whitespace and filtering empty values
 *
 * @param workspaceParam - Comma-separated workspace IDs (e.g., "ws_123,ws_456")
 * @returns Array of workspace IDs
 */
export function parseWorkspaceIds(workspaceParam: string): string[] {
  if (!workspaceParam) {
    return [];
  }
  return workspaceParam
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
}
