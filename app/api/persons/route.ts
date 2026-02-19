import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"
import { getCached, invalidateCache, CACHE_KEYS } from "@/lib/cache"

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

// GET - Fetch all persons with their transactions (shared across all users)
// Cached for 60 seconds to reduce Neon queries
export async function GET() {
  try {
    const personsWithTransactions = await getCached(CACHE_KEYS.PERSONS, async () => {
      const sql = getSql()

      // Get all persons (shared data - no user filtering)
      const persons = await sql`
        SELECT 
          fm_person_id as id,
          fm_person_name as name,
          fm_person_signature_data as signature,
          fm_person_created_at as "createdAt"
        FROM fm_persons
        ORDER BY fm_person_name ASC
      `

      // Get all transactions (shared data - no user filtering)
      const transactions = await sql`
        SELECT 
          fm_txn_id as id,
          fm_txn_person_id as "personId",
          fm_txn_description as description,
          fm_txn_amount as amount,
          fm_txn_date as date,
          fm_txn_due_date as "dueDate",
          fm_txn_comment as comment,
          fm_txn_is_settled as settled,
          fm_txn_signature_data as signature,
          fm_txn_type as type,
          fm_txn_is_payment as "isPayment",
          fm_txn_created_at as "createdAt"
        FROM fm_transactions
        ORDER BY fm_txn_date DESC
      `

      // Group transactions by person
      return persons.map((person: any) => ({
        ...person,
        transactions: transactions.filter((t: any) => t.personId === person.id),
      }))
    })

    return NextResponse.json(
      { persons: personsWithTransactions },
      {
        headers: {
          "Cache-Control": "private, s-maxage=60, stale-while-revalidate=30",
        },
      }
    )
  } catch (error) {
    console.error("Error fetching persons:", error)
    return NextResponse.json({ error: "Failed to fetch persons" }, { status: 500 })
  }
}

// POST - Create a new person
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, signature, userId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const sql = getSql()

    // Check if person already exists (shared across all users)
    const existing = await sql`
      SELECT fm_person_id FROM fm_persons 
      WHERE LOWER(fm_person_name) = LOWER(${name})
    `

    if (existing.length > 0) {
      return NextResponse.json({ 
        id: existing[0].fm_person_id,
        exists: true 
      })
    }

    // Create new person with user_id to track who created it
    const result = await sql`
      INSERT INTO fm_persons (
        fm_person_id,
        fm_person_user_id,
        fm_person_name,
        fm_person_signature_data,
        fm_person_created_at,
        fm_person_updated_at
      ) VALUES (
        gen_random_uuid(),
        ${userId}::uuid,
        ${name},
        ${signature || null},
        NOW(),
        NOW()
      )
      RETURNING fm_person_id as id
    `

    // Invalidate persons cache after creating a new person
    invalidateCache(CACHE_KEYS.PERSONS)

    return NextResponse.json({ id: result[0].id, exists: false })
  } catch (error) {
    console.error("Error creating person:", error)
    return NextResponse.json({ error: "Failed to create person" }, { status: 500 })
  }
}
