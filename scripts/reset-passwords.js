import { neon } from "@neondatabase/serverless";
import { pbkdf2Sync, randomBytes } from "crypto";

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex");
  return `${salt}:${hash}`;
}

const sql = neon(process.env.DATABASE_URL);

// Strong passwords for each user
const passwords = {
  admin: "F0g#Adm!n$2026xQ",
  userkevine: "K3v!nF0g@Usr#97zW",
};

async function main() {
  for (const [username, plainPassword] of Object.entries(passwords)) {
    const hashed = hashPassword(plainPassword);
    await sql`UPDATE fm_users SET fm_user_password_hash = ${hashed} WHERE fm_user_name = ${username}`;
    console.log(`Updated ${username} -> password: ${plainPassword} -> hash starts with: ${hashed.substring(0, 20)}...`);
  }
  console.log("Done! Both passwords reset successfully.");
}

main().catch(console.error);
