import './globals.css'

export const metadata = {
  title: 'dev.log — Infrastructure & Engineering',
  description: 'A technical deep-dive blog on AWS, Pulumi, and backend systems.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Syne:wght@400;600;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(10,12,16,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)',
          padding: 0,
        }}>
          <div style={{ width: '100%', maxWidth: 1700, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 0 }}>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '16px 0',
                fontFamily: 'var(--sans)',
                fontWeight: 800,
                fontSize: 18,
                color: '#fff',
                letterSpacing: '-0.5px',
              }}
            >
              <span style={{ color: 'var(--green)' }}>//</span> dev.log
            </a>

            <div style={{ display: 'flex', gap: 0 }}>
              {[
                { href: '/', label: 'Posts' },
                { href: '/create', label: '+ New Post' },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '16px 20px',
                    fontSize: 11,
                    color: link.label.startsWith('+') ? 'var(--green)' : 'var(--text-dim)',
                    letterSpacing: '1px',
                    borderBottom: '2px solid transparent',
                    transition: 'color .2s',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        <main>{children}</main>

        <footer style={{
          width: '88%',
          maxWidth: 1700,
          margin: '80px auto 0',
          padding: '32px 0',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--text-dimmer)',
          fontFamily: 'var(--mono)',
        }}>
          <span>// dev.log — engineering notes</span>
          <span>Built with Next.js</span>
        </footer>
      </body>
    </html>
  )
}
