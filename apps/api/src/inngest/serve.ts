import { serve } from 'inngest/hono';

import { inngest } from './client';
import { allFunctions } from './functions';

export const inngestServeHandler = serve({
  client: inngest,
  functions: allFunctions,
});
