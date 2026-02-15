import { pbkdf2Sync, randomBytes } from "crypto";
import { neon } from "@neondatabase/serverless";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  
  const adminPass = "F0g#Adm!n$2026xQ";
  const kevinePass = "K3v!nF0g@Usr#97zW";
  
  const adminHash = hashPassword(adminPass);
  const kevineHash = hashPassword(kevinePass);
  
  console.log("Admin hash format check:", adminHash.includes(":") ? "CORRECT salt:hash" : "WRONG");
  console.log("Admin hash length:", adminHash.length);
  
  // Update admin
  await sql`UPDATE fm_users SET fm_user_password_hash = ${adminHash} WHERE fm_user_name = 'admin'`;
  console.log("Updated admin password");
  
  // Update userkevine
  await sql`UPDATE fm_users SET fm_user_password_hash = ${kevineHash} WHERE fm_user_name = 'userkevine'`;
  console.log("Updated userkevine password");
  
  // Verify
  const users = await sql`SELECT fm_user_name, LEFT(fm_user_password_hash, 40) as hash_start FROM fm_users`;
  console.log("Verification:", JSON.stringify(users));
}

main().catch(e => console.error("ERROR:", e));
