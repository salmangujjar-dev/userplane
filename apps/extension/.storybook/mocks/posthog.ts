// Mock for posthog-js in Storybook - provides no-op implementations
export class PostHog {
  init() {}
  identify() {}
  reset() {}
  capture() {}
  captureException() {}
  register() {}
}
export default { PostHog };
