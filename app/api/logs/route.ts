import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"
import { getCached, invalidateCache, CACHE_KEYS } from "@/lib/cache"

// GET - Fetch login logs (cached for 60 seconds)
export async function GET() {
  try {
    const logs = await getCached(CACHE_KEYS.LOGIN_LOGS, async () => {
      const sql = neon(process.env.DATABASE_URL!)

      // Get login logs from the last 2 weeks
      return await sql`
        SELECT 
          fm_log_id as id,
          fm_log_user_id as "userId",
          fm_log_user_name as "userName",
          fm_log_user_email as "userEmail",
          fm_log_action as action,
          fm_log_ip_address as "ipAddress",
          fm_log_device_info as "deviceInfo",
          fm_log_browser_info as "browserInfo",
          fm_log_location as location,
          fm_log_created_at as "createdAt"
        FROM fm_login_logs
        WHERE fm_log_created_at >= CURRENT_TIMESTAMP - INTERVAL '14 days'
        ORDER BY fm_log_created_at DESC
      `
    })

    return NextResponse.json(
      { logs },
      {
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=30",
        },
      }
    )
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, userName, userEmail, action } = await request.json()

    if (!userId || !userName || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)

    await sql`
      INSERT INTO fm_login_logs (fm_log_user_id, fm_log_user_name, fm_log_user_email, fm_log_action)
      VALUES (${userId}, ${userName}, ${userEmail || userName}, ${action})
    `

    // Invalidate login logs cache
    invalidateCache(CACHE_KEYS.LOGIN_LOGS)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creating log:", error)
    return NextResponse.json({ error: "Failed to create log" }, { status: 500 })
  }
}
