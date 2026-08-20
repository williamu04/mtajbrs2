import { getSupabase } from '../../_utils/supabase'

export async function onRequestGet(context) {
  const { env, params } = context
  const supabase = getSupabase(env)

  try {
    const events = await supabase.select('events', {
      select: '*',
      filters: { id: params.event },
      limit: 1,
    })
    if (events.length === 0) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }
    const event = events[0]

    const groupLinks = await supabase.select('group_event', {
      select: 'group_id',
      filters: { event_id: params.event },
    })

    if (groupLinks.length === 0) {
      return new Response(JSON.stringify({ event, groups: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const groupIds = groupLinks.map(g => g.group_id)

    const groups = await supabase.select('groups', {
      select: 'id, name',
      filters: { id: groupIds },
      order: 'name.asc',
    })

    const members = await supabase.select('members', {
      select: 'id, nickname, group_id',
      filters: { group_id: groupIds },
      order: 'nickname.asc',
    })

    const existingAttendance = await supabase.select('member_event', {
      select: 'member_id, status, notes',
      filters: { event_id: params.event },
    })

    const attendanceMap = {}
    for (const a of existingAttendance) {
      attendanceMap[a.member_id] = { status: a.status, notes: a.notes }
    }

    const groupedMembers = groups.map(group => ({
      ...group,
      members: members
        .filter(m => m.group_id === group.id)
        .map(m => ({
          id: m.id,
          nickname: m.nickname,
          ...(attendanceMap[m.id] || { status: null, notes: '' }),
        })),
    }))

    return new Response(JSON.stringify({ event, groups: groupedMembers }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export async function onRequestPost(context) {
  const { request, env, params } = context
  const supabase = getSupabase(env)

  try {
    const events = await supabase.select('events', {
      select: '*',
      filters: { id: params.event },
      limit: 1,
    })
    if (events.length === 0) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }
    const event = events[0]

    if (event.start_time) {
      const now = new Date()
      const [y, m, d] = event.date.split('-').map(Number)
      const [sh, sm] = event.start_time.split(':').map(Number)
      const start = new Date(Date.UTC(y, m - 1, d, sh, sm)) - 25200000
      const end = event.end_time
        ? (() => { const [eh, em] = event.end_time.split(':'); return new Date(Date.UTC(y, m - 1, d, +eh, +em)) - 25200000 })()
        : new Date(Date.UTC(y, m - 1, d, 23, 59) - 25200000)
      if (now < start || now > end) {
        return new Response(JSON.stringify({ error: 'Di luar waktu pengisian kehadiran' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
      }
    }

    const body = await request.json()
    const records = body.attendance

    if (!Array.isArray(records)) {
      return new Response(JSON.stringify({ error: 'attendance must be an array' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const prepared = records.map(r => ({
      member_id: r.member_id,
      event_id: params.event,
      status: r.status,
      notes: r.notes || '',
      updated_at: new Date().toISOString(),
    }))

    const results = await supabase.upsert('member_event', prepared, 'member_id,event_id')
    return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
