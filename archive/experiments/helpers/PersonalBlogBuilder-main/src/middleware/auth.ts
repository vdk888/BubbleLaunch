// Simple authentication middleware for the chat interface
import type { APIContext } from 'astro';

// Environment variable for the admin password
const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD || 'changeme';

// Check if the user is authenticated
export function isAuthenticated(request: Request): boolean {
  const url = new URL(request.url);
  const authCookie = getCookie(request.headers.get('cookie'), 'auth_token');
  
  // Check if the auth cookie matches the expected value
  return authCookie === ADMIN_PASSWORD;
}

// Helper to get a specific cookie value
function getCookie(cookieString: string | null, name: string): string | null {
  if (!cookieString) return null;
  
  const cookies = cookieString.split(';');
  for (const cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
}

// Middleware to protect routes
export async function authMiddleware({ request, redirect }: APIContext) {
  // Skip auth check for the login page and blog pages
  const url = new URL(request.url);
  if (url.pathname === '/login' || url.pathname.startsWith('/blog') || url.pathname.includes('/api/')) {
    return;
  }
  
  // Check if authenticated
  if (!isAuthenticated(request)) {
    return redirect('/login');
  }
}
