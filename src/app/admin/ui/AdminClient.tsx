"use client"

import { useMemo, useState } from "react"

type Org = {
  id: string
  name: string
  businessName?: string | null
  email?: string | null
  phone?: string | null
  website?: string | null
}

type User = {
  id: string
  email: string
  name?: string | null
  isSuperAdmin?: boolean
  isEnabled?: boolean
  accessStartsAt?: string | null
  accessEndsAt?: string | null
  memberships?: { organization?: Org | null; role?: string }[]
}

export default function AdminClient({ orgs, users }: { orgs: Org[]; users: User[] }) {
  const [orgList, setOrgList] = useState<Org[]>(orgs)
  const [userList, setUserList] = useState<User[]>(users)
  const [orgSearch, setOrgSearch] = useState("")
  const [userSearch, setUserSearch] = useState("")
  const [orgForm, setOrgForm] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    website: "",
  })
  const [userForm, setUserForm] = useState({
    email: "",
    name: "",
    organizationId: orgs[0]?.id ?? "",
    role: "STAFF",
    isEnabled: true,
    accessStartsAt: "",
    accessEndsAt: "",
  })
  const [msg, setMsg] = useState<string | null>(null)
  const [loadingOrg, setLoadingOrg] = useState(false)
  const [loadingUser, setLoadingUser] = useState(false)
  const [accessBusyId, setAccessBusyId] = useState<string | null>(null)
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null)
  const [resendBusyId, setResendBusyId] = useState<string | null>(null)
  const [emailStatusByUserId, setEmailStatusByUserId] = useState<Record<string, "sent" | "failed">>({})

  const toDateInput = (value?: string | Date | null) => {
    if (!value) return ""
    const d = new Date(value)
    if (Number.isNaN(d.valueOf())) return ""
    const y = d.getFullYear()
    const m = `${d.getMonth() + 1}`.padStart(2, "0")
    const day = `${d.getDate()}`.padStart(2, "0")
    return `${y}-${m}-${day}`
  }

  const orgOptions = useMemo(() => orgList || [], [orgList])
  const metrics = useMemo(() => {
    const totalOrgs = orgList.length
    const totalUsers = userList.length
    const superAdmins = userList.filter((u: any) => u.isSuperAdmin).length
    const orgsWithEmail = orgList.filter((o: any) => o.email).length
    return { totalOrgs, totalUsers, superAdmins, orgsWithEmail }
  }, [orgList, userList])

  const filteredOrgs = useMemo(() => {
    const q = orgSearch.trim().toLowerCase()
    if (!q) return orgList
    return orgList.filter((o: any) =>
      `${o.name} ${o.businessName ?? ""} ${o.email ?? ""}`.toLowerCase().includes(q)
    )
  }, [orgList, orgSearch])

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase()
    if (!q) return userList
    return userList.filter((u: any) =>
      `${u.email} ${u.name ?? ""}`.toLowerCase().includes(q)
    )
  }, [userList, userSearch])

  async function createOrg(e: React.FormEvent) {
    e.preventDefault()
    setLoadingOrg(true)
    setMsg(null)
    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgForm),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to create organization")
      setMsg("Organization created.")
      setOrgList((prev) => [data, ...prev])
      if (!userForm.organizationId) {
        setUserForm((p) => ({ ...p, organizationId: data.id }))
      }
      setOrgForm({ name: "", businessName: "", email: "", phone: "", website: "" })
    } catch (e: any) {
      setMsg(e?.message || "Failed to create organization")
    } finally {
      setLoadingOrg(false)
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setLoadingUser(true)
    setMsg(null)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userForm),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to create user")
      const statusMsg = data?.emailSent ? "Email sent." : "Email failed to send."
      setMsg(`User created. ${statusMsg}`)
      if (data?.user?.id) {
        setUserList((prev) => [data.user, ...prev])
        setEmailStatusByUserId((prev) => ({
          ...prev,
          [data.user.id]: data?.emailSent ? "sent" : "failed",
        }))
      }
      setUserForm({
        email: "",
        name: "",
        organizationId: orgOptions[0]?.id ?? "",
        role: "STAFF",
        isEnabled: true,
        accessStartsAt: "",
        accessEndsAt: "",
      })
    } catch (e: any) {
      setMsg(e?.message || "Failed to create user")
    } finally {
      setLoadingUser(false)
    }
  }

  async function updateUserAccess(
    userId: string,
    payload: {
      isEnabled?: boolean
      accessStartsAt?: string
      accessEndsAt?: string
    }
  ) {
    setAccessBusyId(userId)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to update user access")
      setUserList((prev) => prev.map((u) => (u.id === userId ? data : u)))
      setMsg("User access updated.")
    } catch (e: any) {
      setMsg(e?.message || "Failed to update user access")
    } finally {
      setAccessBusyId(null)
    }
  }

  async function resendCredentials(userId: string) {
    if (!userId) return
    setResendBusyId(userId)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}/resend`, { method: "POST" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to resend credentials")
      const statusMsg = data?.emailSent ? "Email sent." : "Email failed to send."
      setMsg(`Credentials resent. ${statusMsg}`)
      setEmailStatusByUserId((prev) => ({
        ...prev,
        [userId]: data?.emailSent ? "sent" : "failed",
      }))
    } catch (e: any) {
      setMsg(e?.message || "Failed to resend credentials")
    } finally {
      setResendBusyId(null)
    }
  }

  async function deleteUser(userId: string, email: string) {
    const ok = confirm(`Delete user ${email}? This action is permanent.`)
    if (!ok) return

    setDeleteBusyId(userId)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || "Failed to delete user")
      setUserList((prev) => prev.filter((u) => u.id !== userId))
      setMsg("User deleted.")
    } catch (e: any) {
      setMsg(e?.message || "Failed to delete user")
    } finally {
      setDeleteBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      {msg ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          {msg}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Organizations</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {metrics.totalOrgs.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Users</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {metrics.totalUsers.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Superadmins</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {metrics.superAdmins.toLocaleString()}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Orgs w/ email</div>
          <div className="mt-2 text-xl font-semibold text-slate-900">
            {metrics.orgsWithEmail.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={createOrg} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Create Organization</div>
          <div className="mt-1 text-xs text-slate-500">
            Add a new organization profile for a new customer account.
          </div>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Name *</span>
              <input
                value={orgForm.name}
                onChange={(e) => setOrgForm((p) => ({ ...p, name: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Business Name</span>
              <input
                value={orgForm.businessName}
                onChange={(e) => setOrgForm((p) => ({ ...p, businessName: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Email</span>
              <input
                value={orgForm.email}
                onChange={(e) => setOrgForm((p) => ({ ...p, email: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Phone</span>
              <input
                value={orgForm.phone}
                onChange={(e) => setOrgForm((p) => ({ ...p, phone: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Website</span>
              <input
                value={orgForm.website}
                onChange={(e) => setOrgForm((p) => ({ ...p, website: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              disabled={loadingOrg || !orgForm.name.trim()}
              className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-teal-200 hover:bg-teal-400 disabled:opacity-60"
            >
              {loadingOrg ? "Creating..." : "Create org"}
            </button>
          </div>
        </form>

        <form onSubmit={createUser} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Create User</div>
          <div className="mt-1 text-xs text-slate-500">
            Creates a user and sends temporary credentials.
          </div>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Email *</span>
              <input
                value={userForm.email}
                onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Name</span>
              <input
                value={userForm.name}
                onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Organization *</span>
              <select
                value={userForm.organizationId}
                onChange={(e) => setUserForm((p) => ({ ...p, organizationId: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              >
                {orgOptions.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    {o.businessName || o.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Role</span>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              >
                <option value="OWNER">OWNER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="STAFF">STAFF</option>
              </select>
            </label>
            <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs text-slate-500">Enabled</span>
              <input
                type="checkbox"
                checked={userForm.isEnabled}
                onChange={(e) => setUserForm((p) => ({ ...p, isEnabled: e.target.checked }))}
                className="h-4 w-4"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Access start (optional)</span>
              <input
                type="date"
                value={userForm.accessStartsAt}
                onChange={(e) => setUserForm((p) => ({ ...p, accessStartsAt: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs text-slate-500">Access end (optional)</span>
              <input
                type="date"
                value={userForm.accessEndsAt}
                onChange={(e) => setUserForm((p) => ({ ...p, accessEndsAt: e.target.value }))}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-400"
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              disabled={loadingUser || !userForm.email.trim() || !userForm.organizationId}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loadingUser ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">Organizations</div>
          <input
            value={orgSearch}
            onChange={(e) => setOrgSearch(e.target.value)}
            placeholder="Search organizations..."
            className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-400"
          />
        </div>
        <div className="mt-3 grid gap-2 text-sm">
          {filteredOrgs.length === 0 ? (
            <div className="text-slate-500">No organizations yet.</div>
          ) : (
            filteredOrgs.map((o: any) => (
              <div
                key={o.id}
                className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {o.businessName || o.name}
                  </div>
                  <div className="text-xs text-slate-500">{o.id}</div>
                </div>
                <div className="text-xs text-slate-500">{o.email || "—"}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900">Users</div>
          <input
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full max-w-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 focus:border-teal-400"
          />
        </div>
        <div className="mt-3 grid gap-2 text-sm">
          {filteredUsers.length === 0 ? (
            <div className="text-slate-500">No users yet.</div>
          ) : (
            filteredUsers.map((u: any) => {
              const membership = u.memberships?.[0]
              const emailStatus = emailStatusByUserId[u.id]
              const enabled = u.isEnabled !== false
              const start = toDateInput(u.accessStartsAt)
              const end = toDateInput(u.accessEndsAt)
              return (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {u.email} {u.isSuperAdmin ? "(superadmin)" : ""}
                    </div>
                    <div className="text-xs text-slate-500">
                      {membership?.organization?.businessName || membership?.organization?.name || "No org"} • {membership?.role || "—"}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] ${
                          enabled
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}
                      >
                        {enabled ? "ENABLED" : "DISABLED"}
                      </span>
                      {start ? (
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600">
                          Start: {start}
                        </span>
                      ) : null}
                      {end ? (
                        <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600">
                          End: {end}
                        </span>
                      ) : null}
                    </div>
                    <div
                      className={`mt-1 text-xs ${
                        emailStatus === "sent"
                          ? "text-emerald-600"
                          : emailStatus === "failed"
                            ? "text-rose-600"
                            : "text-slate-500"
                      }`}
                    >
                      Email status: {emailStatus === "sent" ? "sent" : emailStatus === "failed" ? "failed" : "—"}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <div>{u.name || ""}</div>
                    <button
                      onClick={() => updateUserAccess(u.id, { isEnabled: !enabled })}
                      disabled={accessBusyId === u.id}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
                    >
                      {accessBusyId === u.id ? "Updating..." : enabled ? "Disable" : "Enable"}
                    </button>
                    <input
                      type="date"
                      value={start}
                      disabled={accessBusyId === u.id}
                      onChange={(e) =>
                        updateUserAccess(u.id, { accessStartsAt: e.target.value || "" })
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-teal-400 disabled:opacity-60"
                    />
                    <input
                      type="date"
                      value={end}
                      disabled={accessBusyId === u.id}
                      onChange={(e) =>
                        updateUserAccess(u.id, { accessEndsAt: e.target.value || "" })
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-teal-400 disabled:opacity-60"
                    />
                    <button
                      onClick={() => resendCredentials(u.id)}
                      disabled={resendBusyId === u.id}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:text-slate-900 disabled:opacity-60"
                    >
                      {resendBusyId === u.id ? "Sending..." : "Resend credentials"}
                    </button>
                    <button
                      onClick={() => deleteUser(u.id, u.email)}
                      disabled={deleteBusyId === u.id}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 hover:border-rose-300 hover:text-rose-700 disabled:opacity-60"
                    >
                      {deleteBusyId === u.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
