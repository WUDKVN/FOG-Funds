import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

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

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.fm_user_password_hash)
    if (!isValidPassword) {
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
      INSERT INTO fm_login_logs (fm_log_user_id, fm_log_user_name, fm_log_user_email, fm_log_action)
      VALUES (${user.fm_user_id}, ${user.fm_user_name}, ${user.fm_user_name}, 'login')
    `

    // Create session data (no sensitive info)
    const sessionData = JSON.stringify({
      id: user.fm_user_id,
      name: user.fm_user_name,
      role: user.fm_user_role,
    })

    // Set HTTP-only cookie (not accessible via JavaScript / DevTools)
    const cookieStore = await cookies()
    cookieStore.set("session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

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
