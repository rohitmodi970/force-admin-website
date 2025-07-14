// middleware.ts
import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { getToken } from 'next-auth/jwt';

export default withAuth(
  async function middleware(req) {
    console.log("Middleware called for path:", req.nextUrl.pathname);
    
    // Check if token exists and is valid
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    console.log("Token:", token ? "exists" : "missing");
    
    // Redirect authenticated admins from homepage to dashboard
    if (token && req.nextUrl.pathname === '/') {
      console.log("✅ Authenticated admin visiting homepage, redirecting to dashboard");
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    
    // Check for expired or invalid tokens
    if (token && (!token.id || !token.email)) {
      console.log("❌ Invalid token, redirecting to login");
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    
    // Check admin status - only active admins should access protected routes
    if (token && token.status !== 'active' && req.nextUrl.pathname.startsWith('/admin/')) {
      console.log("❌ Admin account not active, redirecting to login");
      const response = NextResponse.redirect(new URL('/admin/login', req.url));
      // Clear the session cookie
      response.cookies.delete('next-auth.session-token');
      response.cookies.delete('__Secure-next-auth.session-token');
      return response;
    }
    
    // Handle admin registration flow
    if (token && req.nextUrl.pathname.startsWith('/admin/register')) {
      console.log("✅ Authenticated admin trying to access register, redirecting to dashboard");
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    
    // Handle admin login page for authenticated users
    if (token && req.nextUrl.pathname.startsWith('/admin/login')) {
      console.log("✅ Authenticated admin trying to access login, redirecting to dashboard");
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    }
    
    // Rate limiting check for login attempts (optional)
    if (req.nextUrl.pathname === '/admin/login' && req.method === 'POST') {
      const clientIP = req.ip || req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
      console.log("Login attempt from IP:", clientIP);
      // You can implement rate limiting logic here
    }
    
    // Log admin activity for audit purposes
    if (token && req.nextUrl.pathname.startsWith('/admin/')) {
      console.log(`Admin activity: ${token.username} (${token.email}) accessed ${req.nextUrl.pathname}`);
    }
    
    return NextResponse.next();
  },
  
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Public paths that don't require authentication
        const publicPaths = [
          '/admin/login',
          '/admin/register',
          '/admin/error',
          '/admin/forgot-password',
          '/admin/reset-password',
          '/api/admin/auth',
          '/api/admin/register',
          '/api/admin/forgot-password',
          '/api/admin/reset-password',
          '/about',
          '/contact',
          '/api/public',
          '/api/auth',
          '/_next',
          '/favicon.ico',
        ];
        
        // Handle root path separately
        const isPublicPath = 
          pathname === '/' || 
          publicPaths.some(path => pathname.startsWith(path));
        
        if (isPublicPath) {
          console.log("✅ Public path allowed:", pathname);
          return true;
        }
        
        // Check if it's an admin route that requires authentication
        const isAdminRoute = pathname.startsWith('/admin');
        const isAuthenticated = !!token;
        
        if (isAdminRoute) {
          console.log(`🔒 Admin route: ${pathname}, Authenticated: ${isAuthenticated}`);
          
          // Additional check for admin status
          if (isAuthenticated && token.status !== 'active') {
            console.log("❌ Admin account not active");
            return false;
          }
          
          return isAuthenticated;
        }
        
        // Allow all other routes
        return true;
      },
    },
    pages: {
      signIn: '/admin/login',
      error: '/admin/error',
    },
  }
);

// Update matcher to include admin routes and exclude API routes
export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!api/|_next/static|_next/image|favicon.ico).*)',
  ],
};