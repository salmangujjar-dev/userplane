/**
 * SDK-internal logger. Simple console wrapper with a module prefix.
 * The SDK is a publishable package and cannot depend on internal workspace packages.
 */
function createPrefixedLogger(prefix: string) {
  return {
    debug: (...args: unknown[]) => console.debug(`[${prefix}]`, ...args),
    info: (...args: unknown[]) => console.info(`[${prefix}]`, ...args),
    warn: (...args: unknown[]) => console.warn(`[${prefix}]`, ...args),
    error: (...args: unknown[]) => console.error(`[${prefix}]`, ...args),
  };
}

export const createSdkLogger = (module: string) => createPrefixedLogger(`Userplane:${module}`);
