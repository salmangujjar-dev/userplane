/**
 * Minimal layout for OAuth popup pages.
 * No sidebar or navigation — just the page content.
 * Auth context and providers are inherited from the root layout.
 */
export default function OAuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
