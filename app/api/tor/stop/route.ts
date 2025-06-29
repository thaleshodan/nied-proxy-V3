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

    console.log("Stopping Tor...")

    const { stdout, stderr } = await execAsync("python3 scripts/tor_manager.py stop")

    if (stderr) {
      console.error("Tor stop error:", stderr)
      return NextResponse.json(
        {
          success: false,
          error: stderr,
        },
        { status: 500 },
      )
    }

    const result = JSON.parse(stdout.trim())

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error stopping Tor:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to stop Tor service",
      },
      { status: 500 },
    )
  }
}
