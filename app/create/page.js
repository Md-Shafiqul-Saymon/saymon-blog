'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const COLORS = ['green', 'blue', 'amber', 'pink', 'purple', 'cyan']
const COLOR_MAP = {
  green:  { accent: '#00e896', dim: '#00e89620', border: '#00e89630' },
  blue:   { accent: '#4d9fff', dim: '#4d9fff18', border: '#4d9fff28' },
  amber:  { accent: '#ffb340', dim: '#ffb34018', border: '#ffb34028' },
  pink:   { accent: '#ff5fa0', dim: '#ff5fa018', border: '#ff5fa028' },
  purple: { accent: '#b06fff', dim: '#b06fff18', border: '#b06fff28' },
  cyan:   { accent: '#00d4ff', dim: '#00d4ff15', border: '#00d4ff22' },
}

const STARTER = `## Introduction

Write your introduction here. Explain what this post covers and why it matters.

## Main Section

Add your main content. You can use:

- **Bold text** for emphasis
- \`inline code\` for commands or variables
- Code blocks for longer snippets

\`\`\`bash
# Example command
pulumi up --yes
\`\`\`

## Key Concepts

### Concept 1

Explain the first concept here.

### Concept 2

Explain the second concept here.

> **Note**: Use blockquotes to highlight important information.

## Conclusion

Wrap up your post here.
`

const HTML_STARTER = `<h2>Introduction</h2>
<p>Write your introduction here. Explain what this post covers and why it matters.</p>

<h2>Main Section</h2>
<p>Add your main content. You can use semantic HTML tags like <code>h2</code>, <code>p</code>, <code>ul</code>, <code>pre</code>, and <code>blockquote</code>.</p>
`

export default function CreatePage() {
  const router = useRouter()
  const formRef = useRef(null)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [types, setTypes] = useState(['General'])
  const [type, setType] = useState('General')
  const [newType, setNewType] = useState('')
  const [title, setTitle]       = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [content, setContent]   = useState(STARTER)
  const [format, setFormat]     = useState('markdown')
  const [tags, setTags]         = useState('')
  const [color, setColor]       = useState('green')
  const [tab, setTab]           = useState('write') // 'write' | 'preview'
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const textareaRef = useRef(null)

  const c = COLOR_MAP[color]

  function buildHtmlPreviewDoc(rawHtml) {
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body {
        margin: 0;
        padding: 24px;
        background: #111318;
        color: #e8eaf0;
        font-family: 'JetBrains Mono', monospace;
        font-size: 13px;
        line-height: 1.8;
      }
      * { box-sizing: border-box; max-width: 100%; }
      img, video, iframe, svg, table, pre { max-width: 100%; }
      a { color: #4d9fff; }
    </style>
  </head>
  <body>${rawHtml}</body>
</html>`
  }

  useEffect(() => {
    fetch('/api/types')
      .then((r) => r.json())
      .then((list) => {
        if (Array.isArray(list) && list.length) {
          setTypes(list)
          setType((current) => (list.includes(current) ? current : list[0]))
        }
      })
      .catch(() => {})
  }, [])

  // Insert markdown shortcut
  function insertMarkdown(before, after = '') {
    if (format === 'html') return
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end   = ta.selectionEnd
    const selected = content.slice(start, end)
    const newContent =
      content.slice(0, start) +
      before + (selected || 'text') + after +
      content.slice(end)
    setContent(newContent)
    setTimeout(() => {
      ta.focus()
      const newPos = start + before.length + (selected || 'text').length + after.length
      ta.setSelectionRange(newPos, newPos)
    }, 0)
  }

  // Simple markdown preview renderer
  function renderPreview(md) {
    let html = md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    html = html.replace(/```[\w]*\n([\s\S]*?)```/g, (_, code) =>
      `<pre><code>${code.trimEnd()}</code></pre>`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
    html = html.replace(/^&gt; \*\*(.+?)\*\*: (.+)$/gm, '<blockquote><strong>$1</strong>: $2</blockquote>')
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>')
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    html = html.replace(/((?:^- .+\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('')
      return `<ul>${items}</ul>`
    })
    html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
      const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('')
      return `<ol>${items}</ol>`
    })
    html = html.replace(/^---$/gm, '<hr />')
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    html = html.replace(/(^(?!<[houpt\d]|```).+$)/gm, (line) => {
      if (!line.trim()) return line
      return `<p>${line}</p>`
    })
    return html
  }

  function handleFormatChange(nextFormat) {
    if (nextFormat === format) return
    setFormat(nextFormat)

    const trimmed = content.trim()
    if (!trimmed || trimmed === STARTER.trim() || trimmed === HTML_STARTER.trim()) {
      setContent(nextFormat === 'html' ? HTML_STARTER : STARTER)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!adminEmail.trim() || !adminPassword) {
      setError('Admin email and password are required to publish.')
      return
    }
    if (!title.trim()) { setError('Title is required'); return }
    if (!content.trim()) { setError('Content is required'); return }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          content,
          color,
          tags,
          format,
          type,
          adminEmail: adminEmail.trim(),
          adminPassword,
        }),
      })
      if (!res.ok) {
        let msg = 'Failed to create post'
        try {
          const data = await res.json()
          if (data?.error) msg = data.error
        } catch {}
        throw new Error(msg)
      }
      const post = await res.json()
      const targetPath = `/posts/${post.slug}`
      router.push(targetPath)
      router.refresh()
      // Dev-mode fallback: force navigation if client routing stalls.
      setTimeout(() => {
        if (window.location.pathname === '/create') {
          window.location.assign(targetPath)
        }
      }, 350)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateType() {
    if (!adminEmail.trim() || !adminPassword) {
      setError('Admin email and password are required to create type.')
      return
    }
    if (!newType.trim()) {
      setError('Type name is required.')
      return
    }
    setError('')
    try {
      const res = await fetch('/api/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newType,
          adminEmail: adminEmail.trim(),
          adminPassword,
        }),
      })
      if (!res.ok) {
        let msg = 'Failed to create type'
        try {
          const data = await res.json()
          if (data?.error) msg = data.error
        } catch {}
        throw new Error(msg)
      }
      const data = await res.json()
      const created = data?.type
      if (created) {
        setTypes((prev) => (prev.includes(created) ? prev : [...prev, created]))
        setType(created)
        setNewType('')
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length
  const readTime = Math.max(1, Math.ceil(wordCount / 200))

  return (
    <div style={{ width: '88%', maxWidth: 1700, margin: '0 auto', padding: '0 24px 80px' }}>

      {/* Header */}
      <div style={{
        padding: '60px 0 40px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 40,
      }}>
        <div style={{
          fontSize: 11,
          color: c.accent,
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 16,
          fontFamily: 'var(--mono)',
        }}>
          // New Post
        </div>
        <h1 style={{
          fontFamily: 'var(--sans)',
          fontSize: 36,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: -1,
        }}>
          Write a Post
        </h1>
        <p style={{ color: 'var(--text-dim)', marginTop: 10, fontSize: 13 }}>
          Markdown and HTML are supported. The post will appear on the homepage immediately.
        </p>
        <p style={{ color: 'var(--amber)', marginTop: 8, fontSize: 12 }}>
          Admin credentials are required to publish.
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 320px)', gap: 32, alignItems: 'start' }}>

          {/* Left — main editor */}
          <div style={{ minWidth: 0 }}>
            {/* Title input */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--text-dimmer)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--mono)' }}>
                Title *
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="AWS Infrastructure Deep Dive"
                required
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: `1px solid ${title ? c.border : 'var(--border)'}`,
                  borderRadius: 6,
                  padding: '12px 16px',
                  color: '#fff',
                  fontFamily: 'var(--sans)',
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  outline: 'none',
                  transition: 'border-color .15s',
                }}
              />
            </div>

            {/* Subtitle */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--text-dimmer)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--mono)' }}>
                Subtitle / Description
              </label>
              <input
                value={subtitle}
                onChange={e => setSubtitle(e.target.value)}
                placeholder="A brief summary of what this post covers..."
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '10px 16px',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--text-dimmer)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'var(--mono)' }}>
                Folder / Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '10px 12px',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Editor area */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              overflow: 'hidden',
              minWidth: 0,
            }}>
              {/* Toolbar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                padding: '8px 16px',
                borderBottom: '1px solid var(--border)',
                background: 'var(--surface2)',
                flexWrap: 'wrap',
              }}>
                {/* Tab switcher */}
                <div style={{ display: 'flex', gap: 0, marginRight: 20 }}>
                  {['write', 'preview'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      style={{
                        padding: '5px 14px',
                        fontSize: 11,
                        fontFamily: 'var(--mono)',
                        background: tab === t ? c.dim : 'none',
                        border: `1px solid ${tab === t ? c.border : 'var(--border)'}`,
                        borderRadius: t === 'write' ? '4px 0 0 4px' : '0 4px 4px 0',
                        color: tab === t ? c.accent : 'var(--text-dimmer)',
                        cursor: 'pointer',
                        transition: 'all .15s',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 0, marginRight: 20 }}>
                  {[
                    { id: 'markdown', label: 'Markdown' },
                    { id: 'html', label: 'HTML' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleFormatChange(opt.id)}
                      style={{
                        padding: '5px 12px',
                        fontSize: 10,
                        fontFamily: 'var(--mono)',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        background: format === opt.id ? c.dim : 'none',
                        border: `1px solid ${format === opt.id ? c.border : 'var(--border)'}`,
                        borderRadius: opt.id === 'markdown' ? '4px 0 0 4px' : '0 4px 4px 0',
                        color: format === opt.id ? c.accent : 'var(--text-dimmer)',
                        cursor: 'pointer',
                        transition: 'all .15s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Format buttons */}
                {tab === 'write' && format === 'markdown' && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[
                      { label: 'B', title: 'Bold', before: '**', after: '**' },
                      { label: 'I', title: 'Italic', before: '*', after: '*' },
                      { label: '`', title: 'Inline code', before: '`', after: '`' },
                      { label: 'H2', title: 'Heading 2', before: '\n## ', after: '' },
                      { label: 'H3', title: 'Heading 3', before: '\n### ', after: '' },
                      { label: '```', title: 'Code block', before: '\n```bash\n', after: '\n```' },
                      { label: '> ', title: 'Blockquote', before: '\n> ', after: '' },
                      { label: '- ', title: 'List item', before: '\n- ', after: '' },
                    ].map(btn => (
                      <button
                        key={btn.label}
                        type="button"
                        title={btn.title}
                        onClick={() => insertMarkdown(btn.before, btn.after)}
                        style={{
                          padding: '3px 8px',
                          fontSize: 11,
                          fontFamily: 'var(--mono)',
                          fontWeight: btn.label === 'B' ? 700 : 400,
                          fontStyle: btn.label === 'I' ? 'italic' : 'normal',
                          background: 'none',
                          border: '1px solid var(--border)',
                          borderRadius: 3,
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          transition: 'all .15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = c.accent; e.currentTarget.style.color = c.accent; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Word count */}
                <div style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-dimmer)', fontFamily: 'var(--mono)' }}>
                  {wordCount} words · ~{readTime} min read
                </div>
              </div>

              {/* Editor / Preview */}
              {tab === 'write' ? (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={format === 'html' ? 'Start writing in HTML...' : 'Start writing in Markdown...'}
                  style={{
                    width: '100%',
                    minHeight: 520,
                    background: 'transparent',
                    border: 'none',
                    padding: '20px',
                    color: 'var(--text-dim)',
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    lineHeight: 1.8,
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              ) : (
                format === 'html' ? (
                  <iframe
                    title="HTML preview"
                    sandbox=""
                    srcDoc={buildHtmlPreviewDoc(content)}
                    style={{
                      width: '100%',
                      minHeight: 520,
                      border: 'none',
                      background: 'transparent',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    className="prose"
                    dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
                    style={{
                      padding: '24px',
                      minHeight: 520,
                      fontSize: 13,
                      overflowX: 'auto',
                      overflowWrap: 'anywhere',
                    }}
                  />
                )
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 80 }}>

            {/* Accent color */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 20,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-dimmer)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, fontFamily: 'var(--mono)' }}>
                Admin Login
              </div>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--text-dimmer)', marginBottom: 6, fontFamily: 'var(--mono)' }}>
                Email
              </label>
              <input
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                placeholder="admin@email.com"
                autoComplete="username"
                style={{
                  width: '100%',
                  background: '#080a0d',
                  border: '1px solid var(--border)',
                  borderRadius: 5,
                  padding: '8px 12px',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  outline: 'none',
                  marginBottom: 10,
                }}
              />
              <label style={{ display: 'block', fontSize: 10, color: 'var(--text-dimmer)', marginBottom: 6, fontFamily: 'var(--mono)' }}>
                Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  background: '#080a0d',
                  border: '1px solid var(--border)',
                  borderRadius: 5,
                  padding: '8px 12px',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 20,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-dimmer)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, fontFamily: 'var(--mono)' }}>
                Create Folder / Type (Admin)
              </div>
              <input
                value={newType}
                onChange={e => setNewType(e.target.value)}
                placeholder="DevOps, AI, Backend..."
                style={{
                  width: '100%',
                  background: '#080a0d',
                  border: '1px solid var(--border)',
                  borderRadius: 5,
                  padding: '8px 12px',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  outline: 'none',
                  marginBottom: 10,
                }}
              />
              <button
                type="button"
                onClick={handleCreateType}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'var(--surface2)',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                + Create Type
              </button>
            </div>

            {/* Accent color */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 20,
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-dimmer)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14, fontFamily: 'var(--mono)' }}>
                Accent Color
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(col => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setColor(col)}
                    title={col}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: COLOR_MAP[col].dim,
                      border: `2px solid ${color === col ? COLOR_MAP[col].accent : COLOR_MAP[col].border}`,
                      cursor: 'pointer',
                      transition: 'all .15s',
                      position: 'relative',
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 8,
                      color: COLOR_MAP[col].accent,
                      fontFamily: 'var(--mono)',
                      fontWeight: 700,
                    }}>
                      {color === col ? '✓' : ''}
                    </span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: c.accent, fontFamily: 'var(--mono)' }}>
                {color}
              </div>
            </div>

            {/* Tags */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 20,
            }}>
              <label style={{ display: 'block', fontSize: 10, color: 'var(--text-dimmer)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--mono)' }}>
                Tags
              </label>
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="AWS, Pulumi, DevOps"
                style={{
                  width: '100%',
                  background: '#080a0d',
                  border: '1px solid var(--border)',
                  borderRadius: 5,
                  padding: '8px 12px',
                  color: 'var(--text-dim)',
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              <div style={{ marginTop: 8, fontSize: 10, color: 'var(--text-dimmer)', fontFamily: 'var(--mono)' }}>
                Comma-separated
              </div>
              {/* Tag preview */}
              {tags && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                  {tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                    <span key={tag} style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 3,
                      border: `1px solid ${c.border}`,
                      background: c.dim,
                      color: c.accent,
                      fontFamily: 'var(--mono)',
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Content cheatsheet */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 20,
              fontSize: 11,
              fontFamily: 'var(--mono)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--text-dimmer)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                {format === 'html' ? 'HTML Guide' : 'Markdown Guide'}
              </div>
              {(format === 'html'
                ? [
                  ['<h1>Title</h1>', 'heading'],
                  ['<h2>Section</h2>', 'subheading'],
                  ['<p>Text</p>', 'paragraph'],
                  ['<strong>bold</strong>', 'bold'],
                  ['<em>italic</em>', 'italic'],
                  ['<code>npm run</code>', 'inline code'],
                  ['<pre><code>...</code></pre>', 'code block'],
                  ['<blockquote>Note</blockquote>', 'quote'],
                  ['<ul><li>item</li></ul>', 'list'],
                  ['<a href="...">link</a>', 'link'],
                ]
                : [
                  ['# Heading 1', 'h1'],
                  ['## Heading 2', 'h2'],
                  ['**bold**', 'bold'],
                  ['*italic*', 'italic'],
                  ['`code`', 'inline code'],
                  ['```\\nblock\\n```', 'code block'],
                  ['> quote', 'blockquote'],
                  ['- item', 'list'],
                  ['[text](url)', 'link'],
                  ['---', 'divider'],
                ]).map(([syntax, label]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                  <code style={{ color: c.accent, fontSize: 10 }}>{syntax}</code>
                  <span style={{ color: 'var(--text-dimmer)', fontSize: 10 }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px',
                background: '#E24B4a10',
                border: '1px solid #E24B4a40',
                borderRadius: 6,
                color: '#F09595',
                fontSize: 12,
                fontFamily: 'var(--mono)',
              }}>
                ⚠ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="button"
              onClick={() => formRef.current?.requestSubmit()}
              disabled={loading || !title.trim() || !content.trim() || !adminEmail.trim() || !adminPassword}
              style={{
                padding: '14px 24px',
                background: loading ? 'var(--surface2)' : c.dim,
                border: `1px solid ${loading ? 'var(--border)' : c.border}`,
                borderRadius: 6,
                color: loading ? 'var(--text-dimmer)' : c.accent,
                fontFamily: 'var(--mono)',
                fontSize: 13,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all .15s',
                letterSpacing: 1,
              }}
            >
              {loading ? '// Publishing...' : '// Publish Post →'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
