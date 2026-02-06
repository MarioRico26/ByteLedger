import { NextResponse } from "next/server"
import { consumePasswordResetToken } from "@/lib/auth"
import { updateUserPassword } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const token = String(body.token || "").trim()
    const password = String(body.password || "")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }
    if (!password || password.trim().length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const user = await consumePasswordResetToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }

    await updateUserPassword(user.id, password)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: error?.message || "Failed to reset password" }, { status: 500 })
  }
}
