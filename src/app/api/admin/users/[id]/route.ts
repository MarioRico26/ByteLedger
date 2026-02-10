import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSuperAdmin } from "@/lib/auth"

type Ctx = { params: { id: string } | Promise<{ id: string }> }

function parseDateInput(v: unknown) {
  const s = String(v ?? "").trim()
  if (!s) return null
  const d = new Date(`${s}T00:00:00`)
  if (Number.isNaN(d.valueOf())) return null
  return d
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const session = await requireSuperAdmin()
    const params = await ctx.params
    const userId = String(params?.id || "").trim()
    if (!userId) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))
    const isEnabled =
      typeof body.isEnabled === "boolean" ? body.isEnabled : undefined
    const accessStartsAt =
      body.accessStartsAt !== undefined ? parseDateInput(body.accessStartsAt) : undefined
    const accessEndsAt =
      body.accessEndsAt !== undefined ? parseDateInput(body.accessEndsAt) : undefined

    if (isEnabled === undefined && accessStartsAt === undefined && accessEndsAt === undefined) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { memberships: { include: { organization: true } } },
    })
    if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 })

    if (session.user.id === userId && isEnabled === false) {
      return NextResponse.json(
        { error: "You cannot disable your own superadmin account" },
        { status: 400 }
      )
    }

    const nextStart = accessStartsAt !== undefined ? accessStartsAt : existing.accessStartsAt
    const nextEnd = accessEndsAt !== undefined ? accessEndsAt : existing.accessEndsAt
    if (nextStart && nextEnd && nextEnd < nextStart) {
      return NextResponse.json(
        { error: "Access end date must be after start date" },
        { status: 400 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(isEnabled !== undefined ? { isEnabled } : {}),
        ...(accessStartsAt !== undefined ? { accessStartsAt } : {}),
        ...(accessEndsAt !== undefined ? { accessEndsAt } : {}),
      },
      include: { memberships: { include: { organization: true } } },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    if (
      error?.message === "UNAUTHORIZED" ||
      error?.message === "FORBIDDEN" ||
      error?.message === "PASSWORD_CHANGE_REQUIRED"
    ) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
    console.error("Admin user update error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
