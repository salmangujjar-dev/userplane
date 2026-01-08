/**
 * Type definitions for Astro client directives
 * Extends the JSX namespace to recognize Astro-specific hydration directives
 */

declare namespace astroHTML.JSX {
  interface IntrinsicAttributes {
    'client:load'?: boolean;
    'client:idle'?: boolean;
    'client:media'?: string;
    'client:visible'?: boolean | { rootMargin?: string };
    'client:only'?: boolean | string;
  }
}
