import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workspaces } from './workspaces';
import { RESOURCE_TYPE_VALUES } from '../constants';

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
    resourceCap: integer('resource_cap').notNull(),

    // Resource tracking (use atomic increment for consumption)
    resourceCredited: integer('resource_credited').notNull().default(0),
    resourceConsumed: integer('resource_consumed').notNull().default(0),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

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
    references: [workspaces.id],
  }),
}));
