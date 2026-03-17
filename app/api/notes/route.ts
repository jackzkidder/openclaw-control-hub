import { NextRequest, NextResponse } from 'next/server'
import { getNotes, createNote, deleteNote } from '@/lib/db/queries/notes'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get('entityType')
  const entityId = searchParams.get('entityId')
  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entityType and entityId required' }, { status: 400 })
  }
  try {
    const notes = await getNotes(entityType, entityId)
    return NextResponse.json(notes)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { entityType, entityId, content } = await req.json()
    if (!entityType || !entityId || !content?.trim()) {
      return NextResponse.json({ error: 'entityType, entityId, and content required' }, { status: 400 })
    }
    const note = await createNote(entityType, entityId, content.trim())
    return NextResponse.json(note, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    const ok = await deleteNote(id)
    return NextResponse.json({ ok })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
