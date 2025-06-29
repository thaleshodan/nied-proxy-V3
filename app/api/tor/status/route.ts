import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Simple cache to avoid too frequent status checks
let statusCache: any = null
let lastStatusCheck = 0
const CACHE_DURATION = 2000 // 2 seconds

export async function GET(request: NextRequest) {
  try {
    // Check if request is from localhost
    const hostname = request.headers.get("host")
    if (!hostname?.includes("localhost") && !hostname?.includes("127.0.0.1")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const now = Date.now()

    // Return cached status if recent
    if (statusCache && now - lastStatusCheck < CACHE_DURATION) {
      return NextResponse.json(statusCache)
    }

    const { stdout, stderr } = await execAsync("python3 scripts/tor_manager.py status", {
      timeout: 10000, // 10 seconds timeout
    })

    if (stderr && !stderr.includes("Warning")) {
      console.error("Tor status error:", stderr)
      const errorResult = {
        success: false,
        error: stderr,
        is_running: false,
      }
      return NextResponse.json(errorResult, { status: 500 })
    }

    let result
    try {
      result = JSON.parse(stdout.trim())

      // Update cache
      statusCache = result
      lastStatusCheck = now
    } catch (parseError) {
      console.error("Failed to parse Tor status:", stdout)
      const errorResult = {
        success: false,
        error: "Invalid response from Tor service",
        is_running: false,
      }
      return NextResponse.json(errorResult, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error getting Tor status:", error)

    const errorResult = {
      success: false,
      error: "Failed to get Tor status",
      is_running: false,
    }

    if (error.code === "TIMEOUT") {
      errorResult.error = "Tor status check timed out"
      return NextResponse.json(errorResult, { status: 408 })
    }

    return NextResponse.json(errorResult, { status: 500 })
  }
}
