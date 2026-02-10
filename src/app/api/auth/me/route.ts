import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ user: null })
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      isSuperAdmin: Boolean(session.user.isSuperAdmin),
      isEnabled: Boolean(session.user.isEnabled),
      accessStartsAt: session.user.accessStartsAt ?? null,
      accessEndsAt: session.user.accessEndsAt ?? null,
      mustChangePassword: Boolean(session.user.mustChangePassword),
    },
  })
}
