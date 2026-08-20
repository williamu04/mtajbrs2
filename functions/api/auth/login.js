import { signToken } from '../../_utils/auth'

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const { username, password } = await request.json()

    if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const token = await signToken(env.JWT_SECRET)

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
