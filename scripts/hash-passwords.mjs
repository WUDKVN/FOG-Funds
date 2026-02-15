import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL);

async function hashPasswords() {
  // Get all users with plain-text passwords
  const users = await sql`SELECT fm_user_id, fm_user_name, fm_user_password_hash FROM fm_users`;

  for (const user of users) {
    // Skip if already hashed (bcrypt hashes start with $2a$ or $2b$)
    if (user.fm_user_password_hash.startsWith("$2a$") || user.fm_user_password_hash.startsWith("$2b$")) {
      console.log(`User ${user.fm_user_name} already has a hashed password, skipping.`);
      continue;
    }

    // Hash the plain-text password
    const hashedPassword = await bcrypt.hash(user.fm_user_password_hash, 12);

    // Update the database with the hashed password
    await sql`UPDATE fm_users SET fm_user_password_hash = ${hashedPassword} WHERE fm_user_id = ${user.fm_user_id}`;

    console.log(`Hashed password for user: ${user.fm_user_name}`);
  }

  console.log("All passwords have been hashed.");
}

hashPasswords().catch(console.error);
