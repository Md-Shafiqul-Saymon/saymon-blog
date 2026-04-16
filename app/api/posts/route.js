import { NextResponse } from 'next/server'
import { createPost, getAllPosts } from '@/lib/posts'
import { isAdminAuthorizedByCredentials, unauthorizedResponse } from '@/lib/admin-auth'

export async function GET() {
  const posts = await getAllPosts()
  return NextResponse.json(posts)
}

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      title,
      subtitle,
      content,
      color,
      tags,
      format,
      type,
      adminEmail,
      adminPassword,
    } = body

    if (!isAdminAuthorizedByCredentials(adminEmail, adminPassword)) {
      return unauthorizedResponse()
    }

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const tagList = typeof tags === 'string'
      ? tags.split(',').map(t => t.trim()).filter(Boolean)
      : (Array.isArray(tags) ? tags : [])

    const post = await createPost({ title, subtitle, content, color, tags: tagList, format, type })
    return NextResponse.json(post, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
