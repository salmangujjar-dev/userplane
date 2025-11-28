import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createBrowserLogger } from '@workspace/logger/browser';

const logger = createBrowserLogger('middleware');

const authRoutes = ['/auth', '/'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));
  const isProtectedRoute = !isAuthRoute;

  const sessionCookie = request.cookies.get('better-auth.session_token');
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

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && hasSession) {
    logger.info({ path, redirectTo: '/' }, 'Redirecting authenticated user from auth page');
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !hasSession) {
    logger.info(
      { path, redirectTo: '/auth' },
      'Redirecting unauthenticated user from protected route'
    );
    return NextResponse.redirect(new URL('/auth', request.url));
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
