import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: "Nom d'utilisateur et mot de passe requis" },
        { status: 400 }
      )
    }

    const sql = neon(process.env.DATABASE_URL!)

    // Query user from database
    const users = await sql`
      SELECT fm_user_id, fm_user_name, fm_user_role, fm_user_password_hash 
      FROM fm_users 
      WHERE fm_user_name = ${username} AND fm_user_is_active = true
    `

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Nom d'utilisateur ou mot de passe incorrect" },
        { status: 401 }
      )
    }

    const user = users[0]

    // Simple password check (in production, use bcrypt)
    if (user.fm_user_password_hash !== password) {
      return NextResponse.json(
        { error: "Nom d'utilisateur ou mot de passe incorrect" },
        { status: 401 }
      )
    }

    // Update last login
    await sql`
      UPDATE fm_users 
      SET fm_user_last_login_at = CURRENT_TIMESTAMP 
      WHERE fm_user_id = ${user.fm_user_id}
    `

    // Log the login
    await sql`
      INSERT INTO fm_login_logs (fm_login_user_id, fm_login_user_name, fm_login_user_email, fm_login_action)
      VALUES (${user.fm_user_id}, ${user.fm_user_name}, ${user.fm_user_name}, 'login')
    `

    return NextResponse.json({
      success: true,
      user: {
        id: user.fm_user_id,
        name: user.fm_user_name,
        role: user.fm_user_role,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Erreur de connexion. Veuillez réessayer." },
      { status: 500 }
    )
  }
}
