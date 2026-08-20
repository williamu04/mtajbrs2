import { requireAuth } from '../../../_utils/auth'
import { getSupabase } from '../../../_utils/supabase'

export async function onRequestPost(context) {
  const { request, env, params } = context
  if (!await requireAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const supabase = getSupabase(env)
    const body = await request.json()
    const groupIds = body.group_ids

    if (!Array.isArray(groupIds) || groupIds.length === 0) {
      return new Response(JSON.stringify({ error: 'group_ids must be a non-empty array' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const records = groupIds.map(group_id => ({ group_id, event_id: params.id }))
    const data = await supabase.insert('group_event', records, { select: '*' })
    return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export async function onRequestGet(context) {
  const { request, env, params } = context
  if (!await requireAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const supabase = getSupabase(env)
    const data = await supabase.select('group_event', {
      select: '*,groups(name)',
      filters: { event_id: params.id },
    })
    return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
