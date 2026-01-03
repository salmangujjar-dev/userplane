import { z } from 'zod';

/**
 * Token and JWT payload schemas
 * Shared between API (encoding) and recorder/clients (decoding)
 */

/**
 * Session preferences from link and workspace settings
 * Short keys used to minimize JWT token length
 */
export const SessionPreferencesSchema = z.object({
  rcl: z.boolean(), // recording_customize_link
  rhs: z.boolean(), // recording_hide_sensitive
  rccl: z.boolean(), // recording_capture_client_log
  rcca: z.boolean(), // recording_capture_client_action
  rcsl: z.boolean(), // recording_capture_server_log
  rcnl: z.boolean(), // recording_capture_network_log
  rcn: z.string().nullable(), // recording_company_name
  rclp: z.string().nullable(), // recording_company_logo_path
  rh: z.string().nullable(), // recording_header
  rf: z.string().nullable(), // recording_footnote
  rpc: z.string().nullable(), // recording_primary_color
  rmd: z.number().nullable(), // recording_max_duration_ms
  rrb: z.string(), // recording_requested_by (creator name)
});

/**
 * Session token payload for recording sessions
 * Short keys used to minimize JWT token length
 */
export const SessionTokenPayloadSchema = z.object({
  iss: z.string(), // Issuer
  lid: z.string(), // Link ID
  lt: z.string(), // Link Type
  wid: z.string(), // Workspace ID
  sid: z.string(), // Session ID
  prefs: SessionPreferencesSchema, // Session preferences
  iat: z.number(), // Issued at
  exp: z.number(), // Expiry
});

/**
 * Upload token payload for file uploads
 * Short keys used to minimize JWT token length
 */
export const UploadTokenPayloadSchema = z.object({
  iss: z.string(), // Issuer
  rid: z.string(), // Recording ID
  lid: z.string(), // Link ID
  lt: z.literal('recording'), // Link Type
  iat: z.number(), // Issued at
  exp: z.number(), // Expiry
});

/**
 * Invite token payload for workspace invitations
 * Short keys used to minimize JWT token length
 */
export const InviteTokenPayloadSchema = z.object({
  iss: z.string(), // Issuer (JWT standard) - always 'userplane'
  wi: z.string(), // workspaceId
  wn: z.string(), // workspaceName
  wt: z.string(), // workspaceInviteToken (UUID from database)
  in: z.string(), // inviterName
  ie: z.string(), // inviterEmail
});

/**
 * Domain verification token payload
 * Used by recorder script to verify domain ownership
 */
export const DomainVerificationTokenPayloadSchema = z.object({
  iss: z.string(), // Issuer
  workspaceId: z.string(),
  domainId: z.string(),
  url: z.string(),
  iat: z.number(), // Issued at
  exp: z.number(), // Expiry
});

/**
 * TypeScript types for JWT payloads
 */
export type SessionPreferences = z.infer<typeof SessionPreferencesSchema>;
export type SessionTokenPayload = z.infer<typeof SessionTokenPayloadSchema>;
export type UploadTokenPayload = z.infer<typeof UploadTokenPayloadSchema>;
export type InviteTokenPayload = z.infer<typeof InviteTokenPayloadSchema>;
export type DomainVerificationTokenPayload = z.infer<typeof DomainVerificationTokenPayloadSchema>;

/**
 * Presigned URL info for file uploads
 */
export const PresignedUrlInfoSchema = z.object({
  type: z.enum(['video', 'thumbnail', 'console_log', 'network_log', 'action']),
  url: z.string(),
  expiresIn: z.number().int().positive(),
});
