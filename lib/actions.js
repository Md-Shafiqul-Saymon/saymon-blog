'use server'

import { createPost } from '@/lib/posts'
import { redirect } from 'next/navigation'

export async function createPostAction(formData) {
  const title = formData.get('title')
  const subtitle = formData.get('subtitle')
  const content = formData.get('content')
  const color = formData.get('color')
  const tagsRaw = formData.get('tags')
  const tags = tagsRaw
    ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    : []

  if (!title || !content) {
    throw new Error('Title and content are required')
  }

  const post = createPost({ title, subtitle, content, color, tags })
  redirect(`/posts/${post.slug}`)
}
