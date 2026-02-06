import "server-only"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { isStrongEnough, hashPassword } from "@/lib/password"

const SESSION_COOKIE = "bl_session"
const MAGIC_LINK_TTL_MIN = 15
const PASSWORD_RESET_TTL_MIN = 30
const SESSION_TTL_DAYS = 7

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex")
}

export async function createMagicLinkToken(email: string) {
  const token = generateToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MIN * 60 * 1000)

  await prisma.magicLinkToken.create({
    data: { email, tokenHash, expiresAt },
  })

  return { token, expiresAt }
}

export async function consumeMagicLinkToken(token: string) {
  const tokenHash = hashToken(token)
  const record = await prisma.magicLinkToken.findUnique({
    where: { tokenHash },
  })

  if (!record) return null
  if (record.expiresAt < new Date()) {
    await prisma.magicLinkToken.delete({ where: { id: record.id } }).catch(() => {})
    return null
  }

  await prisma.magicLinkToken.delete({ where: { id: record.id } }).catch(() => {})
  return record.email
}

export async function createPasswordResetToken(userId: string) {
  const token = generateToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MIN * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: { userId, tokenHash, expiresAt },
  })

  return { token, expiresAt }
}

export async function consumePasswordResetToken(token: string) {
  const tokenHash = hashToken(token)
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!record) return null
  if (record.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: record.id } }).catch(() => {})
    return null
  }

  await prisma.passwordResetToken.delete({ where: { id: record.id } }).catch(() => {})
  return record.user
}

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
  const session = await prisma.authSession.create({
    data: { userId, expiresAt },
  })
  return session
}

export async function destroySession(sessionId: string) {
  await prisma.authSession.delete({ where: { id: sessionId } }).catch(() => {})
}

export async function setSessionCookie(sessionId: string, expiresAt: Date) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value
  if (!sessionId) return null

  const session = await prisma.authSession.findUnique({
    where: { id: sessionId },
    include: {
      user: { include: { memberships: true } },
    },
  })

  if (!session) return null
  if (session.expiresAt < new Date()) {
    await destroySession(session.id)
    await clearSessionCookie()
    return null
  }

  const membership = session.user.memberships[0] || null

  return {
    session,
    user: session.user,
    orgId: membership?.organizationId ?? null,
    role: membership?.role ?? null,
  }
}

export async function getOrgIdOrNull() {
  const session = await getSession()
  if (session?.user?.mustChangePassword) return null
  return session?.orgId ?? null
}

export async function requireSession() {
  const session = await getSession()
  if (!session) throw new Error("UNAUTHORIZED")
  return session
}

export async function requireOrgId() {
  const session = await requireSession()
  if (session.user?.mustChangePassword) {
    // Avoid throwing from pages; redirect to set-password
    const { redirect } = await import("next/navigation")
    redirect("/set-password")
  }
  if (!session.orgId) throw new Error("NO_ORG")
  return session.orgId
}

export async function requireSuperAdmin() {
  const session = await requireSession()
  if (session.user?.mustChangePassword) throw new Error("PASSWORD_CHANGE_REQUIRED")
  if (!session.user?.isSuperAdmin) throw new Error("FORBIDDEN")
  return session
}

export async function updateUserPassword(userId: string, password: string) {
  if (!isStrongEnough(password, 8)) {
    throw new Error("Password must be at least 8 characters long")
  }
  const passwordHash = hashPassword(password)
  return prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: false },
  })
}
