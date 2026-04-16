import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const POSTS_FILE = path.join(DATA_DIR, 'posts.json')
const TYPES_FILE = path.join(DATA_DIR, 'types.json')
const POSTS_DIR = path.join(process.cwd(), 'posts')
const DEFAULT_TYPE = 'General'

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(POSTS_FILE)) {
    // Seed with the AWS infrastructure post from the existing HTML
    const seed = [
      {
        id: 'aws-infrastructure-deep-dive',
        slug: 'aws-infrastructure-deep-dive',
        title: 'AWS Infrastructure Deep Dive',
        subtitle: 'How the VPC, subnets, EC2 instances, NAT gateway, SSH tunnels, bash scripts, and automated health checks are all wired together using Pulumi IaC.',
        tags: ['AWS', 'Pulumi', 'Infrastructure', 'DevOps'],
        color: 'green',
        content: `# AWS Infrastructure Deep Dive

A detailed walkthrough of how the VPC, subnets, EC2 instances, NAT gateway, SSH tunnels, bash scripts, and automated health checks are all wired together using Pulumi IaC.

## Phase 01 — VPC & Network Infrastructure

Pulumi provisions the entire network layer before any server is created. Everything lives inside a logically isolated VPC with two subnets — one public (internet-facing) and one private (DB-only).

### Create the VPC — 10.0.0.0/16

A VPC is a private, isolated network inside AWS. The CIDR block \`10.0.0.0/16\` gives 65,536 IP addresses to work with.

\`\`\`python
vpc = aws.ec2.Vpc(
    'nodejs-db-vpc',
    cidr_block='10.0.0.0/16',
    enable_dns_support=True,
    enable_dns_hostnames=True,
    tags={'Name': 'nodejs-db-vpc'}
)
\`\`\`

### Carve Two Subnets

Subnets divide the VPC address space into smaller segments. The public subnet allows instances to get public IPs. The private subnet never assigns public IPs.

| Attribute | Public Subnet | Private Subnet |
|-----------|--------------|----------------|
| CIDR | 10.0.1.0/24 | 10.0.2.0/24 |
| Public IP | Yes (auto) | No |
| Internet route | → Internet Gateway | → NAT Gateway |
| Who lives here | Node.js EC2 | DB EC2 |

## Phase 02 — Security Groups

Security groups are stateful firewalls attached to EC2 instances. Inbound rules control who can connect; outbound rules control where the instance can reach.

## Phase 03 — EC2 Instances & SSH Configuration Injection

After Pulumi resolves their IPs, it automatically writes an \`~/.ssh/config\` file on your local machine — enabling one-command SSH access to both servers, including the private DB server via ProxyJump.

\`\`\`bash
# From your laptop — one command, two hops transparently
ssh db-server
\`\`\`

> **Key insight**: The private key never leaves your machine. ProxyJump does not copy your private key to the nodejs server — the crypto handshake comes back to you.
`,
        createdAt: new Date('2025-01-10').toISOString(),
        readTime: '18 min read',
      }
    ]
    fs.writeFileSync(POSTS_FILE, JSON.stringify(seed, null, 2))
  }
  if (!fs.existsSync(TYPES_FILE)) {
    fs.writeFileSync(TYPES_FILE, JSON.stringify([DEFAULT_TYPE, 'DevOps', 'AI'], null, 2))
  }
}

function ensurePostsDir() {
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true })
  }
}

export function getAllPosts() {
  ensureDataDir()
  const raw = fs.readFileSync(POSTS_FILE, 'utf8')
  const posts = JSON.parse(raw)
  return posts
    .map((post) => ({ ...post, type: post.type || DEFAULT_TYPE }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getPostBySlug(slug) {
  const posts = getAllPosts()
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

export function getAllTypes() {
  ensureDataDir()
  const raw = fs.readFileSync(TYPES_FILE, 'utf8')
  const types = JSON.parse(raw)
  const normalized = types
    .map(sanitizeTypeName)
    .filter(Boolean)
  if (!normalized.includes(DEFAULT_TYPE)) normalized.unshift(DEFAULT_TYPE)
  return Array.from(new Set(normalized))
}

export function createType(type) {
  const name = sanitizeTypeName(type)
  const types = getAllTypes()
  if (types.some((t) => t.toLowerCase() === name.toLowerCase())) {
    return types.find((t) => t.toLowerCase() === name.toLowerCase())
  }
  types.push(name)
  fs.writeFileSync(TYPES_FILE, JSON.stringify(types, null, 2))
  return name
}

export function createPost(data) {
  ensureDataDir()
  ensurePostsDir()
  const posts = getAllPosts()
  const types = getAllTypes()

  // Generate slug from title
  const slug = slugify(data.title)

  // Ensure unique slug
  let finalSlug = slug
  let counter = 1
  while (posts.find(p => p.slug === finalSlug)) {
    finalSlug = `${slug}-${counter}`
    counter++
  }

  // Estimate read time from visible text
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
  const targetDir = path.join(POSTS_DIR, typeFolder)
  fs.mkdirSync(targetDir, { recursive: true })
  const filePath = path.join(targetDir, `${finalSlug}.${fileExt}`)
  fs.writeFileSync(filePath, newPost.content, 'utf8')
  newPost.sourceFile = `posts/${typeFolder}/${finalSlug}.${fileExt}`

  posts.unshift(newPost)
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2))
  return newPost
}

export function deletePostBySlug(slug) {
  ensureDataDir()
  const posts = getAllPosts()
  const idx = posts.findIndex((p) => p.slug === slug)
  if (idx < 0) return null

  const [removed] = posts.splice(idx, 1)
  if (removed?.sourceFile) {
    const filePath = path.join(process.cwd(), removed.sourceFile)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  }
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2))
  return removed
}
