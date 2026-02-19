import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"
import { getCached, invalidateCache, CACHE_KEYS } from "@/lib/cache"

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

// GET - Fetch all settled records
// Cached for 60 seconds to reduce Neon queries
export async function GET() {
  try {
    const records = await getCached(CACHE_KEYS.SETTLED_RECORDS, async () => {
      const sql = getSql()

      return await sql`
        SELECT 
          fm_settled_id as id,
          fm_settled_person_name as "personName",
          fm_settled_person_id as "personId",
          fm_settled_total_amount as "totalAmount",
          fm_settled_currency as currency,
          fm_settled_type as type,
          fm_settled_by_user_id as "settledByUserId",
          fm_settled_by_user_name as "settledByUserName",
          fm_settled_transactions as transactions,
          fm_settled_at as "settledAt",
          fm_settled_notes as notes
        FROM fm_settled_records
        ORDER BY fm_settled_at DESC
      `
    })

    return NextResponse.json(
      { records },
      {
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=30",
        },
      }
    )
  } catch (error) {
    console.error("Error fetching settled records:", error)
    return NextResponse.json({ error: "Failed to fetch settled records" }, { status: 500 })
  }
}

// POST - Create a settled record (archive before deleting)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { personName, personId, totalAmount, currency, type, userId, userName, transactions, notes } = body

    const sql = getSql()

    const result = await sql`
      INSERT INTO fm_settled_records (
        fm_settled_person_name,
        fm_settled_person_id,
        fm_settled_total_amount,
        fm_settled_currency,
        fm_settled_type,
        fm_settled_by_user_id,
        fm_settled_by_user_name,
        fm_settled_transactions,
        fm_settled_notes
      ) VALUES (
        ${personName},
        ${personId},
        ${totalAmount},
        ${currency || 'FCFA'},
        ${type},
        ${userId ? `${userId}` : null},
        ${userName || null},
        ${JSON.stringify(transactions || [])}::jsonb,
        ${notes || null}
      )
      RETURNING fm_settled_id as id
    `

    // Invalidate settled records cache after creating a new record
    invalidateCache(CACHE_KEYS.SETTLED_RECORDS)

    return NextResponse.json({ id: result[0].id })
  } catch (error) {
    console.error("Error creating settled record:", error)
    return NextResponse.json({ error: "Failed to create settled record" }, { status: 500 })
  }
}
