import { RESOURCE_TYPE_VALUES } from '@workspace/pricing';
import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { workspaces } from './workspaces';

export const resourceTypeEnum = pgEnum('resource_type', RESOURCE_TYPE_VALUES);

export const entitlements = pgTable(
  'entitlements',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Workspace relationship
    workspaceId: text('workspace_id').notNull(),

    // Resource configuration
    resourceType: resourceTypeEnum('resource_type').notNull(),

    // Plan-specific limits
    // quotedLimit: Advertised limit (what customers see in UI)
    // actualLimit: Absolute maximum - requests blocked beyond this
    quotedLimit: integer('quoted_limit').notNull().default(0),
    actualLimit: integer('actual_limit').notNull(),

    // Resource tracking (use atomic increment for consumption)
    resourceConsumed: integer('resource_consumed').notNull().default(0),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Billing cadence: 'monthly' | 'annual' | null (null = free plan)
    billingCadence: text('billing_cadence'),

    // Soft delete
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    uniqueIndex('entitlements_workspace_resource_idx').on(table.workspaceId, table.resourceType),
  ]
);

export const entitlementsRelations = relations(entitlements, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [entitlements.workspaceId],
    references: [workspaces.workspaceId],
  }),
}));
