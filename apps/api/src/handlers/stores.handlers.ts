/**
 * Store handlers - HTTP request handlers for store operations
 * Handles store listing, creation, retrieval, and title updates
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { StoreService } from '@/api/services/store.service';
import type { CreateManagedWorkspaceStoreParams } from '@/api/services/store.service';
import { z } from 'zod';
import { nonEmptyString } from '@/api/lib/validation';

const createStoreSchema = z.object({
  storeTitle: nonEmptyString,
  provider: z.enum(['r2', 's3']),
  providerUrl: nonEmptyString,
  providerRegion: nonEmptyString,
  providerBucket: nonEmptyString,
  providerAccessId: nonEmptyString,
  providerAccessKey: nonEmptyString,
});

const updateStoreTitleSchema = z.object({
  storeTitle: nonEmptyString,
});

export function getStoresHandler(storeService: StoreService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to view stores',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to view stores',
          },
          403
        );
      }

      const stores = await storeService.getByWorkspace(workspaceId);

      return c.json({ stores }, 200);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

export function getStoreHandler(storeService: StoreService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const storeId = c.req.param('storeId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to view store',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to view store',
          },
          403
        );
      }

      if (!storeId) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Store ID is required',
          },
          400
        );
      }

      const store = await storeService.getByIdWithoutCredentials(storeId);

      return c.json({ store }, 200);
    } catch (error) {
      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

export function createStoreHandler(storeService: StoreService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const workspaceSlug = c.req.param('workspaceSlug');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to create a store',
          },
          401
        );
      }

      if (!workspaceId || !workspaceSlug) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to create a store',
          },
          403
        );
      }

      const body = await c.req.json();
      const validated = createStoreSchema.parse(body);

      const params: CreateManagedWorkspaceStoreParams = {
        workspaceId,
        workspaceSlug,
        storeTitle: validated.storeTitle,
        provider: validated.provider,
        providerUrl: validated.providerUrl,
        providerRegion: validated.providerRegion,
        providerBucket: validated.providerBucket,
        providerAccessId: validated.providerAccessId,
        providerAccessKey: validated.providerAccessKey,
      };

      const createdStore = await storeService.createManagedWorkspaceStore(params);

      if (!createdStore) {
        return c.json(
          {
            error: 'Internal Server Error',
            message: 'Failed to create store',
          },
          500
        );
      }

      // Return safe store without credentials
      const safeStore = {
        id: createdStore.id,
        workspaceId: createdStore.workspaceId,
        storeTitle: createdStore.storeTitle,
        provider: createdStore.provider,
        providerRegion: createdStore.providerRegion,
        storeIsManaged: createdStore.storeIsManaged,
        createdAt: createdStore.createdAt,
        updatedAt: createdStore.updatedAt,
      };

      return c.json(
        {
          message: 'Store created successfully',
          store: safeStore,
        },
        201
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid request body',
            details: error.errors,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}

export function updateStoreTitleHandler(storeService: StoreService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const storeId = c.req.param('storeId');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to update store',
          },
          401
        );
      }

      if (!workspaceId) {
        return c.json(
          {
            error: 'Forbidden',
            message: 'You must be a workspace member to update store',
          },
          403
        );
      }

      if (!storeId) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Store ID is required',
          },
          400
        );
      }

      const body = await c.req.json();
      const { storeTitle } = updateStoreTitleSchema.parse(body);

      const updatedStore = await storeService.updateStoreTitle(storeId, storeTitle);

      return c.json(
        {
          message: 'Store title updated successfully',
          store: updatedStore,
        },
        200
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid request body',
            details: error.errors,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}
