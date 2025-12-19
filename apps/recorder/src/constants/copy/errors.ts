/**
 * Error messages for recording application
 * Centralized copy for all error states
 */

/**
 * HTTP Status Code Error Titles
 */
export const STATUS_ERROR_TITLES = {
  0: 'Having trouble reaching you',
  400: "Something's not right",
  401: "That link isn't valid",
  403: "That link isn't valid",
  404: "Hmm, that link doesn't exist",
  409: "This link's already been used",
  410: 'Looks like this link expired',
  429: "Whoa, that's a lot of requests",
  500: 'Something went wrong on our end',
  default: 'Oops, something went wrong',
} as const;

/**
 * Browser Error Messages
 */
export const BROWSER_ERROR_MESSAGES = {
  permission: {
    title: 'Allow screen recording',
    message: 'You need to share your screen to start recording',
  },
  notSupported: {
    title: "Your browser isn't supported",
    message: 'Try Chrome, Edge, or Firefox',
  },
  recordingStopped: {
    title: 'Recording stopped',
    message: 'Ready to give it another shot?',
  },
  unknown: {
    title: 'Oops, something went wrong',
    message: "Let's try that again",
  },
} as const;

/**
 * Action Button Text
 */
export const ERROR_ACTION_TEXT = {
  tryAgain: 'Try again',
  startOver: 'Start over',
  retryNow: 'Retry now',
} as const;

/**
 * General error screen copy (404 pages, etc)
 */
export const NOT_FOUND_COPY = {
  title: '404',
  heading: 'Page not found',
  subtitle: "The page you're looking for doesn't exist or may have been moved.",
} as const;
