import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect authenticated users away from login/register to their dashboard
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_initialized, role')
      .eq('id', user.id)
      .single()

    const isInitialized = profile?.is_initialized === true
    if (!isInitialized) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    const role = profile?.role || user.user_metadata?.role || 'student'
    return NextResponse.redirect(
      new URL(role === 'admin' ? '/admin' : '/dashboard', request.url)
    )
  }

  const isProtectedPath = 
    request.nextUrl.pathname.startsWith('/dashboard') || 
    request.nextUrl.pathname.startsWith('/admin') ||
    request.nextUrl.pathname.startsWith('/onboarding')

  // 1. If not logged in, redirect from protected routes to login
  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 2. If logged in, fetch their profile to enforce onboarding and role routing
  if (user) {
    // Check the profiles table as requested
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_initialized, role')
      .eq('id', user.id)
      .single()

    const isInitialized = profile?.is_initialized === true
    const role = profile?.role || user.user_metadata?.role

    // Mandatory Profile Initialization (Onboarding Guard)
    if (!isInitialized && request.nextUrl.pathname !== '/onboarding' && request.nextUrl.pathname !== '/reset-password') {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // If they are initialized, prevent access to onboarding
    if (isInitialized && request.nextUrl.pathname === '/onboarding') {
      return NextResponse.redirect(
        new URL(role === 'admin' ? '/admin' : '/dashboard', request.url)
      )
    }

    // Role-Protected Dashboards
    if (isInitialized) {
      if (role === 'admin' && request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      if (role === 'student' && request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
