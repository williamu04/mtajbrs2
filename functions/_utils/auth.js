const enc = new TextEncoder()

function base64url(str) {
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return atob(str)
}

export async function signToken(secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = { sub: 'admin', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 }

  const headerB64 = base64url(JSON.stringify(header))
  const payloadB64 = base64url(JSON.stringify(payload))

  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  )

  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${headerB64}.${payloadB64}`))
  const sigB64 = base64url(String.fromCharCode(...new Uint8Array(sig)))

  return `${headerB64}.${payloadB64}.${sigB64}`
}

export async function verifyToken(token, secret) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false, ['verify']
    )

    const sigStr = base64urlDecode(parts[2])
    const sigBytes = Uint8Array.from(sigStr, c => c.charCodeAt(0))

    const valid = await crypto.subtle.verify(
      'HMAC', key,
      sigBytes,
      enc.encode(`${parts[0]}.${parts[1]}`)
    )

    if (!valid) return null

    const payload = JSON.parse(base64urlDecode(parts[1]))
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null

    return payload
  } catch {
    return null
  }
}

export async function requireAuth(request, env) {
  const auth = request.headers.get('Authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return await verifyToken(auth.slice(7), env.JWT_SECRET)
}
