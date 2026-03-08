import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { chemicalLoads } from "@/lib/schema"
import { requireRole } from "@/lib/session"
import { upload } from "@/lib/storage"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"])
    const { id } = await params

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const safeName = `sds-${id}-${Date.now()}.pdf`
    const result = await upload(buffer, safeName, "sds")

    await db
      .update(chemicalLoads)
      .set({ sdsDocumentUrl: result.url })
      .where(eq(chemicalLoads.id, id))

    return NextResponse.json({ url: result.url })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole(["admin"])
    const { id } = await params

    await db
      .update(chemicalLoads)
      .set({ sdsDocumentUrl: null })
      .where(eq(chemicalLoads.id, id))

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
