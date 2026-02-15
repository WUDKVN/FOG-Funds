import { neon } from "@neondatabase/serverless";
import { randomBytes, pbkdf2Sync } from "crypto";

const sql = neon(process.env.DATABASE_URL);

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

async function rehashPasswords() {
  // The actual plain-text password for both users
  const plainPassword = "Silifa@2002";

  const users = await sql`SELECT fm_user_id, fm_user_name FROM fm_users`;

  for (const user of users) {
    const hashedPassword = hashPassword(plainPassword);
    await sql`UPDATE fm_users SET fm_user_password_hash = ${hashedPassword} WHERE fm_user_id = ${user.fm_user_id}`;
    console.log(`Re-hashed password for user: ${user.fm_user_name}`);
  }

  console.log("All passwords have been re-hashed with PBKDF2.");
}

rehashPasswords().catch(console.error);
