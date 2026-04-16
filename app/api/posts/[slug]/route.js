import { NextResponse } from 'next/server'
import { deletePostBySlug } from '@/lib/posts'
import { isAdminAuthorizedByCredentials, unauthorizedResponse } from '@/lib/admin-auth'

export async function DELETE(request, { params }) {
  try {
    const adminEmail = request.headers.get('x-admin-email') || ''
    const adminPassword = request.headers.get('x-admin-password') || ''
    if (!isAdminAuthorizedByCredentials(adminEmail, adminPassword)) {
      return unauthorizedResponse()
    }
    const removed = deletePostBySlug(params.slug)
    if (!removed) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, deleted: removed.slug })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
