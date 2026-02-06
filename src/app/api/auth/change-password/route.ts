import { NextResponse } from "next/server"
import { getSession, updateUserPassword } from "@/lib/auth"
import { verifyPassword } from "@/lib/password"

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const password = String(body.password || "")
    const currentPassword = String(body.currentPassword || "")

    if (!password || password.trim().length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    if (!session.user.mustChangePassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 })
      }
      const ok = verifyPassword(currentPassword, session.user.passwordHash)
      if (!ok) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }
    }

    await updateUserPassword(session.user.id, password)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: error?.message || "Failed to change password" }, { status: 500 })
  }
}
