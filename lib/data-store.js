import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const POSTS_FILE = path.join(DATA_DIR, 'posts.json')
const TYPES_FILE = path.join(DATA_DIR, 'types.json')
const POSTS_DIR = path.join(process.cwd(), 'posts')

const KV_POSTS_KEY = 'devlog:posts:v1'
const KV_TYPES_KEY = 'devlog:types:v1'

/** Same seed as legacy `ensureDataDir` — used when no committed `data/posts.json` exists */
export const SEED_POSTS = [
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
  },
]

export const SEED_TYPES = ['General', 'DevOps', 'AI']

/** Upstash REST (Vercel Redis from Marketplace often still exposes these, or legacy KV) */
export function isUpstashRestRedis() {
  return !!(
    (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    || (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  )
}

/**
 * Vercel “Redis” quickstart uses node-redis + REDIS_URL (redis://…).
 * Custom Storage prefix in the dashboard may expose STORAGE_URL instead.
 */
export function isNodeRedisUrl() {
  return !!(getNodeRedisConnectionUrl())
}

function getNodeRedisConnectionUrl() {
  return (
    process.env.REDIS_URL
    || process.env.STORAGE_URL
    || ''
  ).trim()
}

export function isRemoteRedis() {
  return isUpstashRestRedis() || isNodeRedisUrl()
}

async function getUpstashClient() {
  const { Redis } = await import('@upstash/redis')
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return Redis.fromEnv()
  }
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  }
  return null
}

/** Reuse TCP client across warm serverless invocations */
async function getNodeRedisClient() {
  const url = getNodeRedisConnectionUrl()
  if (!url) return null

  const g = globalThis
  const key = '__devlogRedisClient'
  const connKey = '__devlogRedisUrl'

  if (g[key] && g[connKey] === url && g[key].isOpen) {
    return g[key]
  }

  if (g[key] && g[connKey] !== url) {
    try {
      await g[key].quit()
    } catch {
      /* ignore */
    }
    g[key] = undefined
  }

  const { createClient } = await import('redis')
  const client = createClient({ url })
  client.on('error', () => {})
  await client.connect()
  g[key] = client
  g[connKey] = url
  return client
}

function parseJsonArray(value) {
  if (value == null) return null
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

async function remoteGetJsonArray(key) {
  if (isUpstashRestRedis()) {
    const redis = await getUpstashClient()
    let data = await redis.get(key)
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch {
        data = null
      }
    }
    return parseJsonArray(data)
  }

  const client = await getNodeRedisClient()
  if (!client) return null
  const raw = await client.get(key)
  return parseJsonArray(raw)
}

async function remoteSetJson(key, value) {
  if (isUpstashRestRedis()) {
    const redis = await getUpstashClient()
    await redis.set(key, value)
    return
  }
  const client = await getNodeRedisClient()
  if (!client) throw new Error('Redis client not available')
  await client.set(key, JSON.stringify(value))
}

function ensureDataDirFs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(SEED_POSTS, null, 2))
  }
  if (!fs.existsSync(TYPES_FILE)) {
    fs.writeFileSync(TYPES_FILE, JSON.stringify(SEED_TYPES, null, 2))
  }
}

function readBundledPostsFromRepo() {
  try {
    const p = path.join(process.cwd(), 'data', 'posts.json')
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'))
    }
  } catch {
    /* ignore */
  }
  return null
}

export async function loadPosts() {
  if (isRemoteRedis()) {
    let posts = await remoteGetJsonArray(KV_POSTS_KEY)
    if (posts == null) {
      posts = readBundledPostsFromRepo() || SEED_POSTS
      await remoteSetJson(KV_POSTS_KEY, posts)
    }
    return posts
  }

  if (process.env.VERCEL) {
    const bundled = readBundledPostsFromRepo()
    if (bundled) return bundled
    return SEED_POSTS
  }

  ensureDataDirFs()
  const raw = fs.readFileSync(POSTS_FILE, 'utf8')
  return JSON.parse(raw)
}

export async function savePosts(posts) {
  if (isRemoteRedis()) {
    await remoteSetJson(KV_POSTS_KEY, posts)
    return
  }

  if (process.env.VERCEL) {
    throw new Error(
      'Publishing on Vercel needs Redis. Link Vercel Storage → Redis to this project so REDIS_URL is set (or use Upstash REST: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN), then redeploy.'
    )
  }

  ensureDataDirFs()
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2))
}

export async function loadTypes() {
  if (isRemoteRedis()) {
    let types = await remoteGetJsonArray(KV_TYPES_KEY)
    if (types == null) {
      types = [...SEED_TYPES]
      await remoteSetJson(KV_TYPES_KEY, types)
    }
    return types
  }

  if (process.env.VERCEL) {
    return [...SEED_TYPES]
  }

  ensureDataDirFs()
  return JSON.parse(fs.readFileSync(TYPES_FILE, 'utf8'))
}

export async function saveTypes(types) {
  if (isRemoteRedis()) {
    await remoteSetJson(KV_TYPES_KEY, types)
    return
  }

  if (process.env.VERCEL) {
    throw new Error(
      'Saving types on Vercel requires Redis (REDIS_URL or Upstash REST env vars).'
    )
  }

  ensureDataDirFs()
  fs.writeFileSync(TYPES_FILE, JSON.stringify(types, null, 2))
}

/** Writes under ./posts only on local disk (not on Vercel). */
export function writePostSourceFile(typeFolder, finalSlug, fileExt, content) {
  const virtualPath = `posts/${typeFolder}/${finalSlug}.${fileExt}`
  if (process.env.VERCEL) {
    return virtualPath
  }
  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true })
  }
  const targetDir = path.join(POSTS_DIR, typeFolder)
  fs.mkdirSync(targetDir, { recursive: true })
  const filePath = path.join(targetDir, `${finalSlug}.${fileExt}`)
  fs.writeFileSync(filePath, content, 'utf8')
  return virtualPath
}

export function deletePostSourceFile(sourceFile) {
  if (process.env.VERCEL || !sourceFile) return
  const filePath = path.join(process.cwd(), sourceFile)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}
