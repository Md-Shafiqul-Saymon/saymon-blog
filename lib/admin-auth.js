import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: 'Unauthorized. Only admin can perform this action.' },
    { status: 401 }
  )
}

function normalizeEnvValue(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const noQuotes = raw.replace(/^['"]|['"]$/g, '')
  return noQuotes.replace(/\\\$/g, '$')
}

function readLocalEnvValue(key) {
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    if (!fs.existsSync(envPath)) return ''
    const content = fs.readFileSync(envPath, 'utf8')
    const line = content
      .split(/\r?\n/)
      .find((l) => l.trim().startsWith(`${key}=`))
    if (!line) return ''
    return normalizeEnvValue(line.slice(line.indexOf('=') + 1))
  } catch {
    return ''
  }
}

function getAdminCredentials() {
  const adminEmail = readLocalEnvValue('ADMIN_EMAIL') || normalizeEnvValue(process.env.ADMIN_EMAIL)
  const adminPassword = readLocalEnvValue('ADMIN_PASSWORD') || normalizeEnvValue(process.env.ADMIN_PASSWORD)
  return { adminEmail, adminPassword }
}

export function isAdminAuthorizedByCredentials(email, password) {
  const { adminEmail, adminPassword } = getAdminCredentials()
  if (!adminEmail || !adminPassword) return false
  const inputPassword = String(password || '')

  const passwordCandidates = Array.from(new Set([
    adminPassword,
    adminPassword.replace(/\\\$/g, '$'),
    adminPassword.replace(/\\/g, ''),
    adminPassword.replace(/^['"]|['"]$/g, ''),
  ]))

  return String(email || '').trim().toLowerCase() === adminEmail.toLowerCase()
    && passwordCandidates.includes(inputPassword)
}
