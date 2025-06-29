import { type NextRequest, NextResponse } from "next/server"
import { exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    // Check if request is from localhost
    const hostname = request.headers.get("host")
    if (!hostname?.includes("localhost") && !hostname?.includes("127.0.0.1")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { stdout, stderr } = await execAsync("python3 scripts/health_check.py --json", {
      timeout: 30000, // 30 seconds timeout
    })

    if (stderr) {
      console.error("Health check error:", stderr)
    }

    let result
    try {
      result = JSON.parse(stdout.trim())
    } catch (parseError) {
      console.error("Failed to parse health check response:", stdout)
      return NextResponse.json(
        {
          overall_health: "unhealthy",
          error: "Invalid health check response",
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      )
    }

    // Set appropriate HTTP status based on health
    let status = 200
    if (result.overall_health === "degraded") {
      status = 206 // Partial Content
    } else if (result.overall_health === "unhealthy") {
      status = 503 // Service Unavailable
    }

    return NextResponse.json(result, { status })
  } catch (error) {
    console.error("Error running health check:", error)

    const errorResult = {
      overall_health: "unhealthy",
      error: "Failed to run health check",
      timestamp: new Date().toISOString(),
    }

    if (error.code === "TIMEOUT") {
      errorResult.error = "Health check timed out"
      return NextResponse.json(errorResult, { status: 408 })
    }

    return NextResponse.json(errorResult, { status: 500 })
  }
}
