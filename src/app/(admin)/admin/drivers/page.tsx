"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DriverModal } from "@/components/admin/driver-modal"

type DriverRow = {
  id: string
  userId: string
  licenseNumber: string
  certifications: string[]
  status: string
  userName: string | null
  userEmail: string | null
}

const STATUS_STYLES: Record<string, string> = {
  available: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  on_shift: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  driving: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivering: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  off_duty: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  on_shift: "On Shift",
  driving: "Driving",
  delivering: "Delivering",
  off_duty: "Off Duty",
}

const CERT_LABELS: Record<string, string> = {
  hazmat: "HazMat",
  tanker: "Tanker",
  twic: "TWIC",
  acid: "Acid",
  compressed_gas: "Comp. Gas",
  explosives_precursor: "Explosives",
}

export default function DriversPage() {
  const [driverList, setDriverList] = useState<DriverRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DriverRow | null>(null)
  const [deleting, setDeleting] = useState<DriverRow | null>(null)

  async function fetchDrivers() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/drivers")
      const data = await res.json()
      setDriverList(data)
    } catch {
      toast.error("Failed to load drivers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDrivers() }, [])

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(driver: DriverRow) {
    setEditing(driver)
    setModalOpen(true)
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      const res = await fetch(`/api/admin/drivers/${deleting.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success(`Driver profile for "${deleting.userName}" deleted`)
      setDeleting(null)
      fetchDrivers()
    } catch {
      toast.error("Failed to delete driver profile")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Drivers
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage driver profiles — licenses, certifications, and availability.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>License Number</TableHead>
              <TableHead>Certifications</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : driverList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No driver profiles yet.</p>
                  <p className="text-xs mt-1">Add your first driver to get started.</p>
                </TableCell>
              </TableRow>
            ) : (
              driverList.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.userName ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{driver.userEmail ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{driver.licenseNumber}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {driver.certifications.length === 0 ? (
                        <span className="text-muted-foreground text-sm">None</span>
                      ) : (
                        driver.certifications.map((cert) => (
                          <Badge key={cert} variant="outline" className="text-xs">
                            {CERT_LABELS[cert] ?? cert}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[driver.status] ?? ""}`}>
                      {STATUS_LABELS[driver.status] ?? driver.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(driver)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleting(driver)}
                        title="Delete"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Modal */}
      <DriverModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        onSuccess={() => {
          setModalOpen(false)
          fetchDrivers()
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete driver profile?</AlertDialogTitle>
            <AlertDialogDescription>
              The driver profile for <strong>&quot;{deleting?.userName}&quot;</strong> will be permanently deleted.
              The user account will remain, but they will lose their driver profile and certification records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
