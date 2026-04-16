import { NextResponse } from 'next/server'
import { createType, getAllTypes } from '@/lib/posts'
import { isAdminAuthorizedByCredentials, unauthorizedResponse } from '@/lib/admin-auth'

export async function GET() {
  const types = getAllTypes()
  return NextResponse.json(types)
}

export async function POST(request) {
  try {
    const body = await request.json()
    if (!isAdminAuthorizedByCredentials(body?.adminEmail, body?.adminPassword)) {
      return unauthorizedResponse()
    }
    const created = createType(body?.type)
    return NextResponse.json({ type: created }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
