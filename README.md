# dev.log — Personal Engineering Blog

A minimal, dark-theme blog built with **Next.js 14** (App Router) where you write posts in Markdown and they appear on the homepage instantly.

## Stack

- **Next.js 14** — App Router, Server Components, Server Actions
- **No database** — posts are stored as JSON in `data/posts.json`
- **Markdown** — built-in parser, no external dependencies
- **Zero UI libraries** — pure CSS with inline styles

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Then open **http://localhost:3000**

## Project Structure

```
app/
  page.js              ← Homepage — lists all posts
  layout.js            ← Root layout with nav
  globals.css          ← Global CSS variables & styles
  create/
    page.js            ← New post editor (Markdown + live preview)
  posts/
    [slug]/
      page.js          ← Individual post page
  api/
    posts/
      route.js         ← REST API: GET all posts, POST new post
lib/
  posts.js             ← File-based post storage (reads/writes data/posts.json)
  actions.js           ← Server actions
data/
  posts.json           ← Auto-created on first run, seeded with example post
```

## Creating a Post

1. Click **+ New Post** in the nav
2. Fill in the title, subtitle, and content (Markdown)
3. Choose an accent color and add tags
4. Click **Publish Post** — you're redirected to the new post immediately
5. The post appears on the homepage

## Markdown Support

| Syntax | Output |
|--------|--------|
| `# Heading` | h1–h4 headings |
| `**bold**` | Bold text |
| `*italic*` | Italic text |
| `` `code` `` | Inline code |
| ` ```block``` ` | Code block |
| `> quote` | Blockquote |
| `- item` | Unordered list |
| `1. item` | Ordered list |
| `[text](url)` | Link |
| `\| table \|` | Table |
| `---` | Horizontal rule |

## Customization

- **Colors**: Edit CSS variables in `app/globals.css`
- **Accent colors**: The 6 choices (green, blue, amber, pink, purple, cyan) are defined in `COLOR_MAP` in `app/page.js` and `app/create/page.js`
- **Seeded post**: Edit the seed data in `lib/posts.js` to change the example post
- **Fonts**: JetBrains Mono + Syne — change the Google Fonts import in `app/layout.js`

## Production Build

```bash
npm run build
npm start
```

> **Note**: `data/posts.json` is created at runtime. Make sure it persists between deployments (don't clear it on deploy). For production, consider swapping `lib/posts.js` for a real database like SQLite (better-sqlite3) or Postgres (via Prisma).
