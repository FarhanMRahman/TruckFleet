"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Settings, Users, ShieldCheck, ShieldAlert, UserCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type UserRow = {
  id: string
  name: string
  email: string
  role: string | null
  emailVerified: boolean
  createdAt: string
}

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  dispatcher: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  driver: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  dispatcher: "Dispatcher",
  driver: "Driver",
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <ShieldCheck className="h-3.5 w-3.5" />,
  dispatcher: <UserCheck className="h-3.5 w-3.5" />,
  driver: <Users className="h-3.5 w-3.5" />,
}

export default function SettingsPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>({})

  async function fetchUsers() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      setUsers(data)
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  function handleRoleChange(userId: string, role: string) {
    setPendingRoles((prev) => ({ ...prev, [userId]: role }))
  }

  async function saveRole(userId: string) {
    const role = pendingRoles[userId]
    if (!role) return
    setSavingId(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update role")
        return
      }
      toast.success(`${data.name}'s role updated to ${ROLE_LABELS[role]}`)
      setPendingRoles((prev) => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
      fetchUsers()
    } catch {
      toast.error("Failed to update role")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage user accounts and role assignments.
        </p>
      </div>

      {/* User Management */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">User Management</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Assign roles to control what each user can access. New users default to the Driver role.
        </p>

        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Change Role</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No users found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const currentRole = u.role ?? "driver"
                  const pending = pendingRoles[u.id]
                  const isDirty = pending !== undefined && pending !== currentRole

                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.email}</TableCell>
                      <TableCell>
                        {u.emailVerified ? (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[currentRole] ?? ""}`}>
                          {ROLE_ICONS[currentRole]}
                          {ROLE_LABELS[currentRole] ?? currentRole}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={pending ?? currentRole}
                          onValueChange={(val) => handleRoleChange(u.id, val)}
                        >
                          <SelectTrigger className="w-36 h-8 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="dispatcher">Dispatcher</SelectItem>
                            <SelectItem value="driver">Driver</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          disabled={!isDirty || savingId === u.id}
                          onClick={() => saveRole(u.id)}
                        >
                          {savingId === u.id ? "Saving…" : "Save"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground">
          <ShieldAlert className="h-3.5 w-3.5 inline mr-1" />
          You cannot change your own role.
        </p>
      </div>
    </div>
  )
}
