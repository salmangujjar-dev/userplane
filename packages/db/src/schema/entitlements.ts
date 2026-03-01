import {
  BILLING_CADENCES,
  type BillingCadence,
  RESOURCE_TYPE_VALUES,
  type ResourceType,
} from '@userplane/pricing';
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { workspaces } from './workspaces';

export const entitlements = pgTable(
  'entitlements',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Workspace relationship
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'restrict' }),

    // Resource configuration
    resourceType: text('resource_type').$type<ResourceType>().notNull(),

    // Plan-specific limits
    // quotedLimit: Advertised limit (what customers see in UI)
    // actualLimit: Absolute maximum - requests blocked beyond this
    quotedLimit: integer('quoted_limit').notNull().default(0),
    actualLimit: integer('actual_limit').notNull(),

    // Resource tracking (use atomic increment for consumption)
    resourceConsumed: integer('resource_consumed').notNull().default(0),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Billing cadence: 'monthly' | 'annual' | null (null = free plan)
    billingCadence: text('billing_cadence').$type<BillingCadence>(),

    // Soft delete
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('entitlements_workspace_resource_idx').on(table.workspaceId, table.resourceType),
    check(
      'entitlements_resource_type_check',
      sql`${table.resourceType} IN (${sql.raw(RESOURCE_TYPE_VALUES.map((v) => `'${v}'`).join(', '))})`
    ),
    check(
      'entitlements_billing_cadence_check',
      sql`${table.billingCadence} IS NULL OR ${table.billingCadence} IN (${sql.raw(BILLING_CADENCES.map((v) => `'${v}'`).join(', '))})`
    ),
  ]
);

export const entitlementsRelations = relations(entitlements, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [entitlements.workspaceId],
    references: [workspaces.workspaceId],
  }),
}));
