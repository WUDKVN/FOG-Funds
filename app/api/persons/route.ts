import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

// GET - Fetch all persons with their transactions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const sql = getSql()

    // Set RLS context for this user
    await sql`SELECT set_config('app.current_user_id', ${userId}, false)`

    // Get all persons for this user
    const persons = await sql`
      SELECT 
        fm_person_id as id,
        fm_person_name as name,
        fm_person_signature_data as signature,
        fm_person_created_at as "createdAt"
      FROM fm_persons
      WHERE fm_person_user_id = ${userId}::uuid
      ORDER BY fm_person_name ASC
    `

    // Get all transactions for this user
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
      WHERE fm_txn_user_id = ${userId}::uuid
      ORDER BY fm_txn_date DESC
    `

    // Group transactions by person
    const personsWithTransactions = persons.map((person: any) => ({
      ...person,
      transactions: transactions.filter((t: any) => t.personId === person.id),
    }))

    return NextResponse.json({ persons: personsWithTransactions })
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

    // Set RLS context for this user
    await sql`SELECT set_config('app.current_user_id', ${userId}, false)`

    // Check if person already exists for this user
    const existing = await sql`
      SELECT fm_person_id FROM fm_persons 
      WHERE LOWER(fm_person_name) = LOWER(${name})
      AND fm_person_user_id = ${userId}::uuid
    `

    if (existing.length > 0) {
      return NextResponse.json({ 
        id: existing[0].fm_person_id,
        exists: true 
      })
    }

    // Create new person with user_id
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

    return NextResponse.json({ id: result[0].id, exists: false })
  } catch (error) {
    console.error("Error creating person:", error)
    return NextResponse.json({ error: "Failed to create person" }, { status: 500 })
  }
}
