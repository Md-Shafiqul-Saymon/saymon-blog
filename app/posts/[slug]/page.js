import { getPostBySlug, getAllPosts } from '@/lib/posts'
import { notFound } from 'next/navigation'
import AdminDeletePost from '@/components/AdminDeletePost'

// Simple markdown-to-HTML parser (no external deps)
function parseMarkdown(md) {
  let html = md
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Code blocks (must be before inline code)
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code.trimEnd()}</code></pre>`
  )

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')

  // Blockquotes
  html = html.replace(/^&gt; \*\*(.+?)\*\*: (.+)$/gm, '<blockquote><strong>$1</strong>: $2</blockquote>')
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')

  // Bold + Italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Tables
  html = html.replace(/((?:\|.+\|\n)+)/g, (table) => {
    const rows = table.trim().split('\n')
    let out = '<table>'
    rows.forEach((row, i) => {
      if (row.match(/^\|[-| ]+\|$/)) return // separator row
      const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
      const tag = i === 0 ? 'th' : 'td'
      out += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>'
    })
    out += '</table>'
    return out
  })

  // Unordered lists
  html = html.replace(/((?:^- .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('')
    return `<ul>${items}</ul>`
  })

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('')
    return `<ol>${items}</ol>`
  })

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr />')

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

  // Paragraphs — wrap lines that aren't already wrapped
  html = html.replace(/(^(?!<[houpt\d]|```).+$)/gm, (line) => {
    if (!line.trim()) return line
    return `<p>${line}</p>`
  })

  // Clean up empty paragraphs and double-wrapping
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p>(<(?:h[1-6]|ul|ol|pre|table|blockquote|hr)[^>]*>)/g, '$1')
  html = html.replace(/(<\/(?:h[1-6]|ul|ol|pre|table|blockquote|hr)>)<\/p>/g, '$1')

  return html
}

const COLOR_MAP = {
  green:  { accent: 'var(--green)',  dim: 'var(--green-dim)',  border: '#00e89630' },
  blue:   { accent: 'var(--blue)',   dim: 'var(--blue-dim)',   border: '#4d9fff28' },
  amber:  { accent: 'var(--amber)',  dim: 'var(--amber-dim)',  border: '#ffb34028' },
  pink:   { accent: 'var(--pink)',   dim: 'var(--pink-dim)',   border: '#ff5fa028' },
  purple: { accent: 'var(--purple)', dim: 'var(--purple-dim)', border: '#b06fff28' },
  cyan:   { accent: 'var(--cyan)',   dim: 'var(--cyan-dim)',   border: '#00d4ff22' },
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }) {
  const post = getPostBySlug(params.slug)
  if (!post) return { title: 'Not Found' }
  return {
    title: `${post.title} — dev.log`,
    description: post.subtitle,
  }
}

export default function PostPage({ params }) {
  const post = getPostBySlug(params.slug)
  if (!post) notFound()

  const c = COLOR_MAP[post.color] || COLOR_MAP.green
  const html = post.format === 'html' ? post.content : parseMarkdown(post.content)

  return (
    <div style={{ width: '88%', maxWidth: 1700, margin: '0 auto', padding: '0 24px 80px' }}>

      {/* Back link */}
      <div style={{ paddingTop: 48, marginBottom: 48 }}>
        <a
          href="/"
          style={{
            fontSize: 11,
            color: 'var(--text-dimmer)',
            letterSpacing: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'color .15s',
          }}
          className="back-link"
        >
          ← All Posts
        </a>
      </div>

      {/* Article header */}
      <article style={{ maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ marginBottom: 48 }}>
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
              {post.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 10,
                  padding: '3px 10px',
                  borderRadius: 3,
                  border: `1px solid ${c.border}`,
                  background: c.dim,
                  color: c.accent,
                  letterSpacing: 1,
                  fontFamily: 'var(--mono)',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 style={{
            fontFamily: 'var(--sans)',
            fontSize: 'clamp(28px, 4.5vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -1,
            color: '#fff',
            marginBottom: 16,
          }}>
            {post.title}
          </h1>

          {/* Subtitle */}
          {post.subtitle && (
            <p style={{
              color: 'var(--text-dim)',
              fontSize: 15,
              lineHeight: 1.75,
              marginBottom: 28,
              maxWidth: 620,
            }}>
              {post.subtitle}
            </p>
          )}

          {/* Meta row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            paddingBottom: 32,
            borderBottom: `1px solid ${c.border}`,
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-dimmer)' }}>
              {formatDate(post.createdAt)}
            </span>
            <span style={{ fontSize: 11, color: c.accent }}>
              {post.readTime}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-dimmer)' }}>
              type: {post.type || 'General'}
            </span>
          </div>
        </header>

        {/* Content */}
        <div
          className="prose"
          dangerouslySetInnerHTML={{ __html: html }}
          style={{ fontSize: 14, maxWidth: 980 }}
        />
        <AdminDeletePost slug={post.slug} />
      </article>

      {/* Footer nav */}
      <div style={{
        marginTop: 64,
        paddingTop: 32,
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <a
          href="/"
          style={{
            fontSize: 12,
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          ← Back to all posts
        </a>
        <a
          href="/create"
          style={{
            fontSize: 12,
            color: c.accent,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          + Write a new post
        </a>
      </div>
    </div>
  )
}
