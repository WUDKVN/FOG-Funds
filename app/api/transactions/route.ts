import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

function getSql() {
  return neon(process.env.DATABASE_URL!)
}

// GET - Fetch all transactions (shared across all users)
export async function GET() {
  try {
    const sql = getSql()

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

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
  }
}

// POST - Create a new transaction
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { personId, description, amount, date, dueDate, comment, settled, signature, type, isPayment, userId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const sql = getSql()

    const result = await sql`
      INSERT INTO fm_transactions (
        fm_txn_id,
        fm_txn_user_id,
        fm_txn_person_id,
        fm_txn_description,
        fm_txn_amount,
        fm_txn_original_amount,
        fm_txn_date,
        fm_txn_due_date,
        fm_txn_comment,
        fm_txn_is_settled,
        fm_txn_signature_data,
        fm_txn_type,
        fm_txn_is_payment,
        fm_txn_currency,
        fm_txn_created_at,
        fm_txn_updated_at
      ) VALUES (
        gen_random_uuid(),
        ${userId}::uuid,
        ${personId},
        ${description},
        ${amount},
        ${Math.abs(amount)},
        ${date},
        ${dueDate || null},
        ${comment || null},
        ${settled || false},
        ${signature || null},
        ${type || 'they-owe-me'},
        ${isPayment || false},
        'FCFA',
        NOW(),
        NOW()
      )
      RETURNING fm_txn_id as id
    `

    return NextResponse.json({ id: result[0].id })
  } catch (error) {
    console.error("Error creating transaction:", error)
    return NextResponse.json({ error: "Failed to create transaction" }, { status: 500 })
  }
}

// PUT - Update a transaction (for payments)
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { transactionId, personId, paymentAmount, description, date, comment, settled, signature, type, isPayment, userId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const sql = getSql()

    if (transactionId) {
      // Update existing transaction (any user can update shared data)
      await sql`
        UPDATE fm_transactions
        SET 
          fm_txn_amount = fm_txn_amount - ${Math.abs(paymentAmount)},
          fm_txn_is_settled = ${settled || false},
          fm_txn_updated_at = NOW()
        WHERE fm_txn_id = ${transactionId}
      `
      return NextResponse.json({ success: true })
    } else {
      // Create a payment transaction
      const result = await sql`
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
          fm_txn_signature_data,
          fm_txn_type,
          fm_txn_is_payment,
          fm_txn_currency,
          fm_txn_created_at,
          fm_txn_updated_at
        ) VALUES (
          gen_random_uuid(),
          ${userId}::uuid,
          ${personId},
          ${description || 'Payment'},
          ${-Math.abs(paymentAmount)},
          ${Math.abs(paymentAmount)},
          ${date},
          ${comment || null},
          ${settled || false},
          ${signature || null},
          ${type || 'they-owe-me'},
          true,
          'FCFA',
          NOW(),
          NOW()
        )
        RETURNING fm_txn_id as id
      `
      return NextResponse.json({ id: result[0].id })
    }
  } catch (error) {
    console.error("Error updating transaction:", error)
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 })
  }
}

// DELETE - Delete a person and their transactions (shared data)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const personId = searchParams.get("personId")

    if (!personId) {
      return NextResponse.json({ error: "Person ID required" }, { status: 400 })
    }

    const sql = getSql()

    // Delete all transactions for this person
    await sql`DELETE FROM fm_transactions WHERE fm_txn_person_id = ${personId}`
    
    // Delete the person
    await sql`DELETE FROM fm_persons WHERE fm_person_id = ${personId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting person:", error)
    return NextResponse.json({ error: "Failed to delete person" }, { status: 500 })
  }
}
