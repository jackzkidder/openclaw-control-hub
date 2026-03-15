import { NextRequest, NextResponse } from 'next/server'
import { getAllDocuments, createDocument } from '@/lib/db/queries/documents'

export async function GET() {
  try {
    const docs = await getAllDocuments()
    return NextResponse.json(docs)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const doc = await createDocument({
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    })
    return NextResponse.json(doc, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
