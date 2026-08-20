import { requireAuth } from '../../_utils/auth'
import { getSupabase } from '../../_utils/supabase'

export async function onRequestPut(context) {
  const { request, env, params } = context
  if (!await requireAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const supabase = getSupabase(env)
    const body = await request.json()
    const data = await supabase.update('events', params.id, {
      name: body.name,
      date: body.date,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      location: body.location,
      description: body.description,
    }, { select: '*', single: true })
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context
  if (!await requireAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const supabase = getSupabase(env)
    await supabase.delete('events', params.id)
    return new Response(null, { status: 204 })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
