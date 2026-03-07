"use client"

import { useRef, useState, useEffect } from "react"
import { toast } from "sonner"
import { PenLine, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

type Props = {
  open: boolean
  onClose: () => void
  tripId: string
  onComplete: () => void
}

export function SignatureModal({ open, onClose, tripId, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasStrokes, setHasStrokes] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function isDarkMode() {
    return document.documentElement.classList.contains("dark")
  }

  function initCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = isDarkMode() ? "#1c1c1e" : "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  // Init canvas when modal opens — double-rAF + setTimeout for iOS Safari reliability
  useEffect(() => {
    if (open) {
      setHasStrokes(false)
      requestAnimationFrame(() => requestAnimationFrame(initCanvas))
      setTimeout(initCanvas, 80)
    }
  }, [open])

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ("touches" in e) {
      const touch = e.touches[0]
      if (!touch) return null
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const pos = getPos(e, canvas)
    if (!pos) return
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setDrawing(true)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const pos = getPos(e, canvas)
    if (!pos) return
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.strokeStyle = isDarkMode() ? "#ffffff" : "#000000"
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasStrokes(true)
  }

  function endDraw() {
    setDrawing(false)
  }

  function clearCanvas() {
    initCanvas()
    setHasStrokes(false)
  }

  async function handleSubmit() {
    const canvas = canvasRef.current
    if (!canvas || !hasStrokes) return
    setSubmitting(true)
    try {
      // Normalize to white background + dark strokes regardless of theme
      let signatureDataUrl: string
      if (isDarkMode()) {
        const norm = document.createElement("canvas")
        norm.width = canvas.width
        norm.height = canvas.height
        const nctx = norm.getContext("2d")!
        nctx.fillStyle = "#ffffff"
        nctx.fillRect(0, 0, norm.width, norm.height)
        // Invert the dark canvas: draw it inverted via filter
        nctx.filter = "invert(1)"
        nctx.drawImage(canvas, 0, 0)
        signatureDataUrl = norm.toDataURL("image/png")
      } else {
        signatureDataUrl = canvas.toDataURL("image/png")
      }
      const res = await fetch(`/api/driver/trips/${tripId}/pod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl }),
      })
      if (!res.ok) throw new Error()
      toast.success("Proof of delivery signed!")
      onComplete()
      onClose()
    } catch {
      toast.error("Failed to save signature")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-primary" />
            <DialogTitle>Proof of Delivery</DialogTitle>
          </div>
          <DialogDescription>
            Sign below to confirm delivery. Draw your signature in the box.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative border-2 border-dashed rounded-lg overflow-hidden">
            <canvas
              ref={canvasRef}
              width={400}
              height={180}
              className="w-full touch-none cursor-crosshair"
              style={{ display: "block" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={(e) => { e.preventDefault(); startDraw(e) }}
              onTouchMove={(e) => { e.preventDefault(); draw(e) }}
              onTouchEnd={endDraw}
            />
            {!hasStrokes && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-400 pointer-events-none select-none">
                Sign here
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearCanvas} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={!hasStrokes || submitting}
            >
              {submitting ? "Saving..." : "Submit Signature"}
            </Button>
          </div>

          <Button variant="ghost" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
