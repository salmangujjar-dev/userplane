import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAppLogger } from '@workspace/logger';

const logger = createAppLogger('middleware');

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login', '/signup'];
const publicRoutes = ['/'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

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
    logger.info(
      { path, redirectTo: '/dashboard' },
      'Redirecting authenticated user from auth page'
    );
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !hasSession) {
    logger.info(
      { path, redirectTo: '/login' },
      'Redirecting unauthenticated user from protected route'
    );
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect home page based on auth status
  if (isPublicRoute && path === '/') {
    if (hasSession) {
      logger.debug({ redirectTo: '/dashboard' }, 'Redirecting authenticated user to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      logger.debug({ redirectTo: '/login' }, 'Redirecting unauthenticated user to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
