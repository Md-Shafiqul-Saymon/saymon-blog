import { getAllPosts } from '@/lib/posts'

export const dynamic = 'force-dynamic'

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
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default async function HomePage() {
  const posts = await getAllPosts()

  return (
    <div style={{ width: '88%', maxWidth: 1700, margin: '0 auto', padding: '0 24px 60px' }}>

      {/* Hero */}
      <div style={{
        position: 'relative',
        padding: '80px 0 60px',
        borderBottom: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        <div style={{
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--green)',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          // Engineering Notes · Infrastructure & Systems
        </div>
        <h1 style={{
          fontFamily: 'var(--sans)',
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: -1,
          color: '#fff',
          maxWidth: 600,
        }}>
          Deep Dives.<br />
          <span style={{ color: 'var(--green)' }}>No Fluff.</span>
        </h1>
        <p style={{
          marginTop: 20,
          color: 'var(--text-dim)',
          fontSize: 13,
          maxWidth: 500,
          lineHeight: 1.8,
        }}>
          Technical walkthroughs on AWS, Pulumi, Node.js, and backend infrastructure.
          Every post is a genuine deep-dive — code, diagrams, and packet flows included.
        </p>
        <div style={{ display: 'flex', gap: 16, marginTop: 32, flexWrap: 'wrap' }}>
          <div style={{
            padding: '6px 14px',
            border: '1px solid var(--border2)',
            borderRadius: 4,
            fontSize: 11,
            color: 'var(--text-dim)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} published
          </div>
          <a
            href="/create"
            style={{
              padding: '6px 14px',
              border: '1px solid var(--green)',
              borderRadius: 4,
              fontSize: 11,
              color: 'var(--green)',
              background: 'var(--green-dim)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all .15s',
            }}
          >
            + Write New Post
          </a>
        </div>
      </div>

      {/* Post Grid */}
      {posts.length === 0 ? (
        <div style={{
          marginTop: 80,
          textAlign: 'center',
          color: 'var(--text-dimmer)',
          fontFamily: 'var(--mono)',
        }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📭</div>
          <div>No posts yet. <a href="/create" style={{ color: 'var(--green)' }}>Write the first one →</a></div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 20,
          marginTop: 48,
        }}>
          {posts.map((post, i) => {
            const c = COLOR_MAP[post.color] || COLOR_MAP.green
            return (
              <a
                key={post.id}
                href={`/posts/${post.slug}`}
                className="post-card"
                style={{
                  display: 'block',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  animation: `fadeInUp 0.4s ease both`,
                  animationDelay: `${i * 0.06}s`,
                  '--card-accent': c.accent,
                }}
              >
                {/* Color bar */}
                <div style={{
                  height: 3,
                  background: c.accent,
                  opacity: 0.7,
                }} />

                <div style={{ padding: '24px 24px 20px' }}>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 3,
                      border: '1px solid var(--border2)',
                      color: 'var(--text-dimmer)',
                      letterSpacing: 1,
                      fontFamily: 'var(--mono)',
                    }}>
                      {(post.type || 'General').toUpperCase()}
                    </span>
                  </div>
                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                      {post.tags.slice(0, 3).map(tag => (
                        <span key={tag} style={{
                          fontSize: 10,
                          padding: '2px 8px',
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
                  <h2 style={{
                    fontFamily: 'var(--sans)',
                    fontSize: 18,
                    fontWeight: 800,
                    color: '#fff',
                    lineHeight: 1.2,
                    letterSpacing: -0.3,
                    marginBottom: 10,
                  }}>
                    {post.title}
                  </h2>

                  {/* Subtitle */}
                  {post.subtitle && (
                    <p style={{
                      color: 'var(--text-dim)',
                      fontSize: 12,
                      lineHeight: 1.7,
                      marginBottom: 20,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {post.subtitle}
                    </p>
                  )}

                  {/* Meta */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border)',
                    paddingTop: 14,
                  }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dimmer)' }}>
                      {formatDate(post.createdAt)}
                    </span>
                    <span style={{ fontSize: 10, color: c.accent }}>
                      {post.readTime} →
                    </span>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
