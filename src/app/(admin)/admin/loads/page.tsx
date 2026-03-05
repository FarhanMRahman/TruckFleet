"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, FlaskConical, ShieldAlert } from "lucide-react"
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
import { ChemicalLoadModal } from "@/components/admin/chemical-load-modal"
import type { ChemicalLoad } from "@/lib/schema"

export default function ChemicalLoadsPage() {
  const [loads, setLoads] = useState<ChemicalLoad[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ChemicalLoad | null>(null)
  const [deleting, setDeleting] = useState<ChemicalLoad | null>(null)

  async function fetchLoads() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/chemical-loads")
      const data = await res.json()
      setLoads(data)
    } catch {
      toast.error("Failed to load chemical loads")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLoads() }, [])

  function openAdd() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(load: ChemicalLoad) {
    setEditing(load)
    setModalOpen(true)
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      const res = await fetch(`/api/admin/chemical-loads/${deleting.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      toast.success(`"${deleting.name}" deleted`)
      setDeleting(null)
      fetchLoads()
    } catch {
      toast.error("Failed to delete chemical load")
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6" />
            Chemical Load Library
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Define chemical types, hazard classes, and required certifications for dispatch.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Load
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chemical Name</TableHead>
              <TableHead>Hazard Class</TableHead>
              <TableHead>UN Number</TableHead>
              <TableHead>Required Vehicle</TableHead>
              <TableHead>Required Certifications</TableHead>
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
            ) : loads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No chemical loads defined yet.</p>
                  <p className="text-xs mt-1">Add your first load to get started.</p>
                </TableCell>
              </TableRow>
            ) : (
              loads.map((load) => (
                <TableRow key={load.id}>
                  <TableCell className="font-medium">{load.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      {load.hazardClass}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {load.unNumber ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{load.requiredVehicleType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {load.requiredCertifications.length === 0 ? (
                        <span className="text-muted-foreground text-sm">None</span>
                      ) : (
                        load.requiredCertifications.map((cert) => (
                          <Badge key={cert} variant="outline" className="text-xs">
                            {cert}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEdit(load)}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleting(load)}
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
      <ChemicalLoadModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editing={editing}
        onSuccess={() => {
          setModalOpen(false)
          fetchLoads()
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chemical load?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>&quot;{deleting?.name}&quot;</strong> will be permanently deleted.
              Any trips referencing this load will lose the association.
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
