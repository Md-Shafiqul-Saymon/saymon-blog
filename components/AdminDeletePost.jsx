'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminDeletePost({ slug }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    if (!email.trim() || !password) {
      setError('Admin email and password are required.')
      return
    }
    if (!window.confirm('Delete this post permanently?')) return

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: 'DELETE',
        headers: {
          'x-admin-email': email.trim(),
          'x-admin-password': password,
        },
      })
      if (!res.ok) {
        let msg = 'Failed to delete post'
        try {
          const data = await res.json()
          if (data?.error) msg = data.error
        } catch {}
        throw new Error(msg)
      }
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ marginTop: 28, padding: 16, border: '1px solid #E24B4a40', borderRadius: 8, background: '#E24B4a10', maxWidth: 420 }}>
      <div style={{ fontSize: 11, color: '#F09595', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--mono)' }}>
        Admin Danger Zone
      </div>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Admin email"
        style={{ width: '100%', marginBottom: 8, background: '#080a0d', border: '1px solid #E24B4a40', borderRadius: 5, padding: '8px 12px', color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: 12, outline: 'none' }}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Admin password"
        style={{ width: '100%', marginBottom: 10, background: '#080a0d', border: '1px solid #E24B4a40', borderRadius: 5, padding: '8px 12px', color: 'var(--text-dim)', fontFamily: 'var(--mono)', fontSize: 12, outline: 'none' }}
      />
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        style={{ width: '100%', padding: '10px 14px', borderRadius: 6, border: '1px solid #E24B4a60', background: loading ? '#2b1a1a' : '#E24B4a22', color: '#F09595', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}
      >
        {loading ? 'Deleting...' : 'Delete Post'}
      </button>
      {error && <div style={{ marginTop: 8, color: '#F09595', fontSize: 11 }}>{error}</div>}
    </div>
  )
}
