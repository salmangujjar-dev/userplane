import { createBrowserAppLogger } from '@workspace/logger/browser';

export const createSdkLogger = (module: string) => createBrowserAppLogger(`Userplane:${module}`);
