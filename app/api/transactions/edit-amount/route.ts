import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

// PUT - Directly set a new total amount for a person by adjusting their transactions
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { personId, newAmount, type, userId } = body

    if (!personId || newAmount === undefined || !userId) {
      return NextResponse.json({ error: "personId, newAmount, and userId are required" }, { status: 400 })
    }

    const sql = getSql()

    // Get current total for this person
    const currentTransactions = await sql`
      SELECT fm_txn_id as id, fm_txn_amount as amount
      FROM fm_transactions
      WHERE fm_txn_person_id = ${personId}
    `

    const currentTotal = currentTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0)
    
    // Calculate the adjustment needed
    // newAmount is always positive from the UI
    // For "they-owe-me": amounts are positive in DB, so target is +newAmount
    // For "i-owe-them": amounts are negative in DB, so target is -newAmount
    const targetTotal = type === "they-owe-me" ? newAmount : -newAmount
    const adjustment = targetTotal - currentTotal

    if (Math.abs(adjustment) < 0.01) {
      return NextResponse.json({ success: true, message: "No change needed" })
    }

    // Insert an adjustment transaction
    await sql`
      INSERT INTO fm_transactions (
        fm_txn_id,
        fm_txn_user_id,
        fm_txn_person_id,
        fm_txn_description,
        fm_txn_amount,
        fm_txn_original_amount,
        fm_txn_date,
        fm_txn_comment,
        fm_txn_is_settled,
        fm_txn_type,
        fm_txn_is_payment,
        fm_txn_currency,
        fm_txn_created_at,
        fm_txn_updated_at
      ) VALUES (
        gen_random_uuid(),
        ${userId}::uuid,
        ${personId},
        'Adjustment',
        ${adjustment},
        ${Math.abs(adjustment)},
        NOW()::date,
        'Direct amount edit',
        false,
        ${type || 'they-owe-me'},
        false,
        'FCFA',
        NOW(),
        NOW()
      )
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error editing amount:", error)
    return NextResponse.json({ error: "Failed to edit amount" }, { status: 500 })
  }
}
