import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Check if request is from localhost
    const hostname = request.headers.get("host")
    if (!hostname?.includes("localhost") && !hostname?.includes("127.0.0.1")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    console.log("Starting Tor...")

    // Add timeout to prevent hanging
    const { stdout, stderr } = await execAsync("python3 scripts/tor_manager.py start", {
      timeout: 30000, // 30 seconds timeout
    })

    if (stderr && !stderr.includes("Warning")) {
      console.error("Tor start error:", stderr)
      return NextResponse.json(
        {
          success: false,
          error: stderr,
        },
        { status: 500 },
      )
    }

    let result
    try {
      result = JSON.parse(stdout.trim())
    } catch (parseError) {
      console.error("Failed to parse Tor response:", stdout)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid response from Tor service",
        },
        { status: 500 },
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error starting Tor:", error)

    // Handle timeout specifically
    if (error.code === "TIMEOUT") {
      return NextResponse.json(
        {
          success: false,
          error: "Tor startup timed out. Please try again.",
        },
        { status: 408 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to start Tor service",
      },
      { status: 500 },
    )
  }
}
