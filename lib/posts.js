import {
  loadPosts,
  savePosts,
  loadTypes,
  saveTypes,
  writePostSourceFile,
  deletePostSourceFile,
} from '@/lib/data-store'

const DEFAULT_TYPE = 'General'

export async function getAllPosts() {
  const posts = await loadPosts()
  return posts
    .map((post) => ({ ...post, type: post.type || DEFAULT_TYPE }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getPostBySlug(slug) {
  const posts = await getAllPosts()
  return posts.find(p => p.slug === slug) || null
}

function sanitizeTypeName(type) {
  const clean = String(type || '')
    .trim()
    .replace(/\s+/g, ' ')
  return clean || DEFAULT_TYPE
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function getTypeSlug(type) {
  const slug = slugify(type)
  return slug || 'general'
}

export async function getAllTypes() {
  const types = await loadTypes()
  const normalized = types
    .map(sanitizeTypeName)
    .filter(Boolean)
  if (!normalized.includes(DEFAULT_TYPE)) normalized.unshift(DEFAULT_TYPE)
  return Array.from(new Set(normalized))
}

export async function createType(type) {
  const name = sanitizeTypeName(type)
  const types = await getAllTypes()
  if (types.some((t) => t.toLowerCase() === name.toLowerCase())) {
    return types.find((t) => t.toLowerCase() === name.toLowerCase())
  }
  types.push(name)
  await saveTypes(types)
  return name
}

export async function createPost(data) {
  const posts = await getAllPosts()
  const types = await getAllTypes()

  const slug = slugify(data.title)

  let finalSlug = slug
  let counter = 1
  while (posts.find(p => p.slug === finalSlug)) {
    finalSlug = `${slug}-${counter}`
    counter++
  }

  const contentForCount = (data.format === 'html'
    ? data.content.replace(/<[^>]+>/g, ' ')
    : data.content)
  const wordCount = contentForCount.split(/\s+/).filter(Boolean).length
  const readTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`

  const newPost = {
    id: finalSlug,
    slug: finalSlug,
    title: data.title,
    subtitle: data.subtitle || '',
    tags: data.tags || [],
    color: data.color || 'green',
    type: types.includes(sanitizeTypeName(data.type)) ? sanitizeTypeName(data.type) : DEFAULT_TYPE,
    content: data.content,
    format: data.format === 'html' ? 'html' : 'markdown',
    createdAt: new Date().toISOString(),
    readTime,
  }

  const fileExt = newPost.format === 'html' ? 'html' : 'md'
  const typeFolder = getTypeSlug(newPost.type)
  newPost.sourceFile = writePostSourceFile(typeFolder, finalSlug, fileExt, newPost.content)

  posts.unshift(newPost)
  await savePosts(posts)
  return newPost
}

export async function deletePostBySlug(slug) {
  const posts = await loadPosts()
  const idx = posts.findIndex((p) => p.slug === slug)
  if (idx < 0) return null

  const [removed] = posts.splice(idx, 1)
  deletePostSourceFile(removed?.sourceFile)
  await savePosts(posts)
  return removed
}
