import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "kas-rt-session";

// Route yang memerlukan autentikasi
const PROTECTED_PATHS = ["/dashboard", "/warga", "/jimpitan", "/petugas"];

// Route yang tidak boleh diakses saat sudah login
const AUTH_PATHS = ["/login"];

// Route yang selalu bisa diakses (development tools & public)
const PUBLIC_PATHS = ["/seeder", "/laporan-rinci"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(SESSION_COOKIE);
  const isAuthenticated = !!sessionCookie?.value;

  // Public path: selalu boleh diakses (misal: /seeder untuk development)
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublicPath) return NextResponse.next();

  // Cek apakah request menuju route yang dilindungi
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  // Cek apakah request menuju route auth (login)
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

  // Jika belum login dan mengakses route terlindungi → redirect ke /login
  if (isProtectedPath && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Jika sudah login dan mengakses /login → redirect ke /dashboard
  if (isAuthPath && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match semua path kecuali:
     * - _next/static (file statis Next.js)
     * - _next/image (optimasi gambar Next.js)
     * - favicon.ico
     * - file dengan ekstensi (gambar, font, dll)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
