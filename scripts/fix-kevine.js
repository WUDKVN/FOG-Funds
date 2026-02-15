import { neon } from "@neondatabase/serverless";
import crypto from "crypto";

const sql = neon(process.env.DATABASE_URL);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return salt + ":" + hash;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return testHash === hash;
}

async function main() {
  // Check admin password works
  const users = await sql`SELECT fm_user_name, fm_user_password_hash FROM fm_users`;
  
  for (const u of users) {
    const works = verifyPassword("F0g#Adm!n$2026xQ", u.fm_user_password_hash);
    console.log(u.fm_user_name, "verify with admin pw:", works);
    const works2 = verifyPassword("K3v!nF0g@Usr#97zW", u.fm_user_password_hash);
    console.log(u.fm_user_name, "verify with kevine pw:", works2);
    console.log(u.fm_user_name, "hash format has colon:", u.fm_user_password_hash.includes(":"));
  }

  // Fix kevine's password (correct username)
  const kevineHash = hashPassword("K3v!nF0g@Usr#97zW");
  await sql`UPDATE fm_users SET fm_user_password_hash = ${kevineHash} WHERE fm_user_name = 'kevine'`;
  console.log("kevine password updated");

  // Verify both now work
  const updated = await sql`SELECT fm_user_name, fm_user_password_hash FROM fm_users`;
  for (const u of updated) {
    const pw = u.fm_user_name === "admin" ? "F0g#Adm!n$2026xQ" : "K3v!nF0g@Usr#97zW";
    const works = verifyPassword(pw, u.fm_user_password_hash);
    console.log("FINAL:", u.fm_user_name, "login works:", works);
  }
}

main().catch(console.error);
