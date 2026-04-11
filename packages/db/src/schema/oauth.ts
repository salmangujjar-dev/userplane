/**
 * OAuth 2.1 Provider schema
 *
 * Tables required by the @better-auth/oauth-provider and jwt plugins.
 * Supports Dynamic Client Registration, consent management,
 * opaque token storage for the MCP authorization flow, and JWKS key management.
 *
 * Array fields (scopes, redirectUris, etc.) use `jsonb` columns so Drizzle
 * auto-parses them. This works around a Better Auth Drizzle adapter bug where
 * `supportsArrays: true` (PG) skips JSON parsing for `text` columns.
 * See: https://github.com/better-auth/better-auth/issues/6779
 */

import { boolean, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { session } from './session';
import { user } from './user';

// =============================================================================
// JWKS (JSON Web Key Set — required by jwt plugin for token signing)
// =============================================================================

export const jwks = pgTable('jwks', {
  id: text('id').primaryKey(),
  publicKey: text('public_key').notNull(),
  privateKey: text('private_key').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

// =============================================================================
// OAuth Client (Dynamic Client Registration — RFC 7591)
// =============================================================================

export const oauthClient = pgTable(
  'oauth_client',
  {
    id: text('id').primaryKey(),

    // OAuth 2.1 client identifiers
    clientId: text('client_id').notNull().unique(),
    clientSecret: text('client_secret'),

    // Client metadata (RFC 7591 §2)
    name: text('name'),
    uri: text('uri'),
    icon: text('icon'),
    contacts: jsonb('contacts').$type<string[]>(), // string[]
    tos: text('tos'),
    policy: text('policy'),
    softwareId: text('software_id'),
    softwareVersion: text('software_version'),
    softwareStatement: text('software_statement'),

    // Redirect configuration
    redirectUris: jsonb('redirect_uris').$type<string[]>().notNull(), // string[]
    postLogoutRedirectUris: jsonb('post_logout_redirect_uris').$type<string[]>(), // string[]

    // Client type and capabilities
    type: text('type'), // "web" | "native" | "user-agent-based"
    public: boolean('public'),
    disabled: boolean('disabled').default(false),
    skipConsent: boolean('skip_consent'),
    enableEndSession: boolean('enable_end_session'),
    subjectType: text('subject_type'), // "pairwise" | "public"
    requirePKCE: boolean('require_pkce'),

    // OAuth configuration
    scopes: jsonb('scopes').$type<string[]>(), // string[]
    grantTypes: jsonb('grant_types').$type<string[]>(), // string[]
    responseTypes: jsonb('response_types').$type<string[]>(), // string[]
    tokenEndpointAuthMethod: text('token_endpoint_auth_method'),

    // Ownership
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    referenceId: text('reference_id'),

    // Additional data
    metadata: jsonb('metadata').$type<Record<string, unknown>>(), // object

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('oauth_client_userId_idx').on(table.userId)]
);

// =============================================================================
// OAuth Access Token (opaque tokens for introspection)
// =============================================================================

export const oauthAccessToken = pgTable(
  'oauth_access_token',
  {
    id: text('id').primaryKey(),

    // Token value (hashed)
    token: text('token').notNull().unique(),

    // Relationships
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    sessionId: text('session_id').references(() => session.id, { onDelete: 'set null' }),
    refreshId: text('refresh_id').references(() => oauthRefreshToken.id, { onDelete: 'set null' }),
    referenceId: text('reference_id'),

    // Authorization
    scopes: jsonb('scopes').$type<string[]>().notNull(), // string[]

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('oauth_access_token_clientId_idx').on(table.clientId),
    index('oauth_access_token_userId_idx').on(table.userId),
  ]
);

// =============================================================================
// OAuth Refresh Token (offline_access grant)
// =============================================================================

export const oauthRefreshToken = pgTable(
  'oauth_refresh_token',
  {
    id: text('id').primaryKey(),

    // Token value (hashed) — unique for findOne() lookups during token exchange
    token: text('token').notNull().unique(),

    // Relationships
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    sessionId: text('session_id').references(() => session.id, { onDelete: 'set null' }),
    referenceId: text('reference_id'),

    // Authorization
    scopes: jsonb('scopes').$type<string[]>().notNull(), // string[]

    // Lifecycle
    revoked: timestamp('revoked', { withTimezone: true }),
    authTime: timestamp('auth_time', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('oauth_refresh_token_clientId_idx').on(table.clientId),
    index('oauth_refresh_token_userId_idx').on(table.userId),
  ]
);

// =============================================================================
// OAuth Consent (user-granted scopes per client)
// =============================================================================

export const oauthConsent = pgTable(
  'oauth_consent',
  {
    id: text('id').primaryKey(),

    // Relationships
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClient.clientId, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    referenceId: text('reference_id'),

    // Authorized scopes
    scopes: jsonb('scopes').$type<string[]>().notNull(), // string[]

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index('oauth_consent_clientId_idx').on(table.clientId),
    index('oauth_consent_userId_idx').on(table.userId),
  ]
);
