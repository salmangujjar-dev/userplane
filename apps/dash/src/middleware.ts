import { createClientLogger } from '@userplane/common-logger/browser';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { env } from '@/env';

const logger = createClientLogger('middleware', { level: 'debug' });

const authRoutes = ['/auth'];
const publicRoutes = [
  '/accounts/delete/confirm',
  '/setup',
  '/share',
  '/zendesk/iframe',
  '/extension/auth',
];

/**
 * Get session cookie name based on environment
 * When useSecureCookies is enabled (preview/staging/production), cookies are prefixed with __Secure-
 */
function getSessionCookieName(): string {
  const baseName = `${env.auth.cookiePrefix}.session_token`;
  return env.useSecureCookies ? `__Secure-${baseName}` : baseName;
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));
  const isProtectedRoute = !isAuthRoute && !isPublicRoute;

  const sessionCookieName = getSessionCookieName();
  const sessionCookie = request.cookies.get(sessionCookieName);
  const hasSession = !!sessionCookie;

  logger.debug(
    {
      path,
      hasSession,
      isProtectedRoute,
      isAuthRoute,
      userAgent: request.headers.get('user-agent'),
    },
    'Middleware processing request'
  );

  // Redirect authenticated users away from auth pages.
  // When session_expired is set, the API returned 401 for a stale session cookie.
  // Let the user through to /auth so they can re-authenticate instead of
  // bouncing them back to a page that will 401 again (infinite loop).
  if (isAuthRoute && hasSession) {
    const sessionExpired = request.nextUrl.searchParams.get('session_expired');
    if (sessionExpired) {
      logger.info({ path }, 'Allowing access to auth page for expired session');
      return NextResponse.next();
    }

    const redirectTo = request.nextUrl.searchParams.get('redirect_to');
    const destination = redirectTo || '/';
    logger.info({ path, redirectTo: destination }, 'Redirecting authenticated user from auth page');
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !hasSession) {
    const redirectUrl = new URL('/auth', request.url);
    const originalPath = request.nextUrl.pathname + request.nextUrl.search;
    redirectUrl.searchParams.set('redirect_to', originalPath);

    logger.info(
      { path, redirectTo: redirectUrl.toString(), originalPath },
      'Redirecting unauthenticated user from protected route'
    );
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (icons, images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    '/',
  ],
};
