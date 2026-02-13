import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

// GET - Fetch activity logs from database
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const sql = getSql()

    if (userId) {
      await sql`SELECT set_config('app.current_user_id', ${userId}, false)`
    }

    const logs = await sql`
      SELECT 
        fm_activity_id as id,
        fm_activity_user_id as "userId",
        fm_activity_user_name as "userName",
        fm_activity_action as action,
        fm_activity_category as category,
        fm_activity_description as description,
        fm_activity_person_id as "personId",
        fm_activity_person_name as "personName",
        fm_activity_txn_id as "transactionId",
        fm_activity_amount as amount,
        fm_activity_currency as currency,
        fm_activity_created_at as timestamp
      FROM fm_activity_logs
      ORDER BY fm_activity_created_at DESC
      LIMIT 100
    `

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("Error fetching activity logs:", error)
    return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
  }
}

// POST - Save a new activity log
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, userName, action, category, description, personId, personName, transactionId, amount, currency } = body

    const sql = getSql()

    if (userId) {
      await sql`SELECT set_config('app.current_user_id', ${userId}, false)`
    }

    await sql`
      INSERT INTO fm_activity_logs (
        fm_activity_user_id,
        fm_activity_user_name,
        fm_activity_action,
        fm_activity_category,
        fm_activity_description,
        fm_activity_person_id,
        fm_activity_person_name,
        fm_activity_txn_id,
        fm_activity_amount,
        fm_activity_currency
      ) VALUES (
        ${userId},
        ${userName},
        ${action},
        ${category},
        ${description},
        ${personId || null},
        ${personName || null},
        ${transactionId || null},
        ${amount || null},
        ${currency || 'FCFA'}
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving activity log:", error)
    return NextResponse.json({ error: "Failed to save activity log" }, { status: 500 })
  }
}
