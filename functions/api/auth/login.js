import { signToken } from '../../_utils/auth.js'

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { username, password } = await request.json()

    const adminUser = env.ADMIN_USERNAME || 'admin'
    const adminPass = env.ADMIN_PASSWORD || 'secret'
    const jwtSecret = env.JWT_SECRET || 'dev-secret-mta-jebres-2'

    if (username !== adminUser || password !== adminPass) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const token = await signToken(jwtSecret)

    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
