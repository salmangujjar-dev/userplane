import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users away from protected routes
  if (isProtectedRoute && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect home page based on auth status
  if (isPublicRoute && path === '/') {
    if (hasSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
