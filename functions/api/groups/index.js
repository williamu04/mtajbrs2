import { requireAuth } from '../../_utils/auth'
import { getSupabase } from '../../_utils/supabase'

export async function onRequestGet(context) {
  const { request, env } = context
  if (!await requireAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const supabase = getSupabase(env)
    const data = await supabase.select('groups', { order: 'name.asc' })
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export async function onRequestPost(context) {
  const { request, env } = context
  if (!await requireAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const supabase = getSupabase(env)
    const body = await request.json()
    const data = await supabase.insert('groups', { name: body.name, description: body.description || '' }, { select: '*', single: true })
    return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
