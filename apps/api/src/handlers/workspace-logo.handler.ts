/**
 * Workspace Logo Upload Handler
 * Handles multipart form data uploads for workspace logos
 */

import { createAppLogger } from '@workspace/logger';
import { ASSETS_ALLOWED_CONTENT_TYPES, type AssetsContentType } from '@workspace/storage';
import type { Context } from 'hono';

import { auth } from '@/api/clients/auth';
import { getAssetsStorage } from '@/api/clients/storage';
import { workspaceMemberService } from '@/api/services';

const logger = createAppLogger('workspace-logo-handler');

/**
 * Maximum logo file size: 2MB
 */
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * Allowed content types for logo uploads
 */
const ALLOWED_CONTENT_TYPES = new Set(ASSETS_ALLOWED_CONTENT_TYPES);

/**
 * Handle workspace logo upload
 * POST /api/v1/workspace/:workspaceId/logo
 *
 * Accepts multipart/form-data with a 'logo' file field
 * Uploads to R2 and stores the full CDN URL in the database
 */
export async function handleWorkspaceLogoUpload(c: Context) {
  const workspaceId = c.req.param('workspaceId');

  if (!workspaceId) {
    return c.json({ error: 'Workspace ID is required' }, 400);
  }

  // Authenticate user
  const sessionData = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!sessionData?.session || !sessionData?.user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const userId = sessionData.user.id;

  // Verify workspace membership (admin or owner required for logo upload)
  try {
    const member = await workspaceMemberService.getMembershipForAuth(userId, workspaceId);

    if (!member) {
      return c.json({ error: 'Forbidden: Not a workspace member' }, 403);
    }

    if (member.workspaceRole !== 'admin' && member.workspaceRole !== 'owner') {
      return c.json({ error: 'Forbidden: Admin or owner role required' }, 403);
    }
  } catch (error) {
    logger.error({ error, workspaceId, userId }, 'Error checking workspace membership');
    return c.json({ error: 'Workspace not found' }, 404);
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch (error) {
    logger.error({ error, workspaceId }, 'Failed to parse form data');
    return c.json({ error: 'Invalid form data' }, 400);
  }

  const file = formData.get('logo');

  if (!file || !(file instanceof File)) {
    return c.json({ error: 'No logo file provided' }, 400);
  }

  // Validate content type
  const contentType = file.type as AssetsContentType;
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return c.json(
      {
        error: `Invalid file type: ${file.type}. Allowed types: ${Array.from(ALLOWED_CONTENT_TYPES).join(', ')}`,
      },
      400
    );
  }

  // Validate file size
  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return c.json(
      {
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 2MB`,
      },
      400
    );
  }

  // Upload to R2
  let logoUrl: string;
  try {
    const buffer = await file.arrayBuffer();
    const assetsStorage = getAssetsStorage();

    const result = await assetsStorage.putWorkspaceLogo(
      workspaceId,
      new Uint8Array(buffer),
      contentType
    );
    logoUrl = assetsStorage.getWorkspaceLogoUrl(result.path);

    logger.info({ workspaceId, path: result.path, logoUrl }, 'Logo uploaded to R2');
  } catch (error) {
    logger.error({ error, workspaceId }, 'Failed to upload logo to R2');
    return c.json({ error: 'Failed to upload logo' }, 500);
  }

  // Return the CDN URL - the dashboard will save it via preferences update
  // This allows users to cancel and revert to the previous logo
  return c.json({
    message: 'Logo uploaded successfully',
    data: {
      url: logoUrl,
    },
  });
}
