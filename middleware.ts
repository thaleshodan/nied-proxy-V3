import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the hostname from the request
  const hostname = request.headers.get("host")
  const forwardedFor = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")

  // Allow localhost and 127.0.0.1
  const allowedHosts = ["localhost:5050", "127.0.0.1:5050", "localhost", "127.0.0.1"]

  // Check if the request is from localhost
  const isLocalhost = allowedHosts.some((host) => hostname?.includes(host))
  const isLocalIP = !forwardedFor && !realIp

  if (!isLocalhost && !isLocalIP) {
    // Return 403 Forbidden for non-localhost requests
    return new NextResponse(
      JSON.stringify({
        error: "Access Denied",
        message: "NiedProxy dashboard is only accessible from localhost",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
