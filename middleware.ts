import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const auth = req.cookies.get('jarvis_auth')?.value;
  const { pathname } = req.nextUrl;

  // Already authenticated → skip login page
  if (pathname === '/login') {
    if (auth === '1') {
      return NextResponse.redirect(new URL('/tracker', req.url));
    }
    return NextResponse.next();
  }

  // Not authenticated → send to login
  if (auth !== '1') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
