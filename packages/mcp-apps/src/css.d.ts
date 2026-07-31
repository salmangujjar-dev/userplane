/**
 * Ambient declarations for stylesheet imports.
 *
 * The app entrypoints import `../ui/styles.css` for its side effect so the
 * bundler emits the stylesheet. TypeScript needs a module declaration to
 * accept a side-effect import of a non-code asset.
 */
declare module '*.css';
