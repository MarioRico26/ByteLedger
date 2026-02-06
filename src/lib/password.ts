import crypto from "crypto"

const SALT_BYTES = 16
const KEY_BYTES = 64

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(SALT_BYTES)
  const hash = crypto.scryptSync(password, salt, KEY_BYTES)
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`
}

export function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) return false
  const parts = stored.split("$")
  if (parts.length !== 3 || parts[0] !== "scrypt") return false
  const salt = Buffer.from(parts[1], "hex")
  const hash = Buffer.from(parts[2], "hex")
  const test = crypto.scryptSync(password, salt, hash.length)
  return crypto.timingSafeEqual(test, hash)
}

export function isStrongEnough(password: string, minLen = 8) {
  return password.trim().length >= minLen
}
