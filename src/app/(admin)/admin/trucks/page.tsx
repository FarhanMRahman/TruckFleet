"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Truck } from "lucide-react"
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
import { TruckModal } from "@/components/admin/truck-modal"
import type { Truck as TruckType } from "@/lib/schema"

const STATUS_STYLES: Record<string, string> = {
  available: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  on_trip: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
}

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  on_trip: "On Trip",
  maintenance: "Maintenance",
  inactive: "Inactive",
}

const TYPE_LABELS: Record<string, string> = {
  tanker: "Tanker",
  hazmat: "HazMat Truck",
  flatbed: "Flatbed",
  refrigerated: "Refrigerated",
}

export default function TrucksPage() {
  const [truckList, setTruckList] = useState<TruckType[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TruckType | null>(null)
  const [deleting, setDeleting] = useState<TruckType | null>(null)

  async function fetchTrucks() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/trucks")
      const data = await res.json()
      setTruckList(data)
    } catch {
      toast.error("Failed to load trucks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTrucks() }, [])

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(truck: TruckType) {
    setEditing(truck)
    setModalOpen(true)
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      const res = await fetch(`/api/admin/trucks/${deleting.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success(`"${deleting.name}" deleted`)
      setDeleting(null)
      fetchTrucks()
    } catch {
      toast.error("Failed to delete truck")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Trucks
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your fleet vehicles — types, plates, and availability status.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Truck
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>License Plate</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : truckList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <Truck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No trucks in the fleet yet.</p>
                  <p className="text-xs mt-1">Add your first truck to get started.</p>
                </TableCell>
              </TableRow>
            ) : (
              truckList.map((truck) => (
                <TableRow key={truck.id}>
                  <TableCell className="font-medium">{truck.name}</TableCell>
                  <TableCell className="font-mono text-sm">{truck.plate}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {TYPE_LABELS[truck.type] ?? truck.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[truck.status] ?? ""}`}>
                      {STATUS_LABELS[truck.status] ?? truck.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(truck)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleting(truck)}
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
      <TruckModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        onSuccess={() => {
          setModalOpen(false)
          fetchTrucks()
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete truck?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&quot;{deleting?.name}&quot;</strong> ({deleting?.plate}) will be permanently deleted.
              Any trips referencing this truck will lose the association.
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
