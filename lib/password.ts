import { randomBytes, pbkdf2Sync } from "crypto"

const ITERATIONS = 100000
const KEY_LENGTH = 64
const DIGEST = "sha512"

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  // Support both new PBKDF2 format (salt:hash) and legacy bcrypt ($2b$...)
  if (storedHash.startsWith("$2")) {
    // Legacy bcrypt - can't verify without bcryptjs, fall back to direct compare
    // This should not happen after migration
    return false
  }

  const [salt, hash] = storedHash.split(":")
  if (!salt || !hash) return false

  const verifyHash = pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, DIGEST).toString("hex")
  return hash === verifyHash
}
