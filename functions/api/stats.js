import { requireAuth } from '../_utils/auth'
import { getSupabase } from '../_utils/supabase'

export async function onRequestGet(context) {
  const { request, env } = context
  if (!await requireAuth(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const supabase = getSupabase(env)
    const [events, groupEvents, members, attendance] = await Promise.all([
      supabase.select('events', { order: 'date.desc' }),
      supabase.select('group_event'),
      supabase.select('members', { select: 'id, nickname, group_id' }),
      supabase.select('member_event', { select: 'member_id, event_id, status' }),
    ])

    // Build group → members lookup
    const membersByGroup = {}
    for (const m of members) {
      if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = []
      membersByGroup[m.group_id].push(m.id)
    }

    // Build event → group_ids lookup
    const eventGroupIds = {}
    for (const ge of groupEvents) {
      if (!eventGroupIds[ge.event_id]) eventGroupIds[ge.event_id] = []
      eventGroupIds[ge.event_id].push(ge.group_id)
    }

    // Compute event->total_members map
    const eventTotalMembers = {}
    for (const e of events) {
      const gids = eventGroupIds[e.id] || []
      let total = 0
      for (const gid of gids) {
        total += (membersByGroup[gid] || []).length
      }
      eventTotalMembers[e.id] = total
    }

    // Count attendance per event
    const eventStatusCounts = {}
    for (const a of attendance) {
      if (!eventStatusCounts[a.event_id]) eventStatusCounts[a.event_id] = { hadir: 0, sakit: 0, izin: 0, alpha: 0 }
      eventStatusCounts[a.event_id][a.status]++
    }

    const perEvent = events.map(e => {
      const counts = eventStatusCounts[e.id] || { hadir: 0, sakit: 0, izin: 0, alpha: 0 }
      const total = eventTotalMembers[e.id] || 0
      return {
        id: e.id,
        name: e.name,
        date: e.date,
        total_members: total,
        hadir: counts.hadir,
        sakit: counts.sakit,
        izin: counts.izin,
        alpha: counts.alpha,
        hadir_rate: total > 0 ? Math.round((counts.hadir / total) * 100) : 0,
      }
    })

    // Count events per member (via their group)
    const memberEventCount = {}
    for (const m of members) {
      let count = 0
      for (const [eventId, gids] of Object.entries(eventGroupIds)) {
        if (gids.includes(m.group_id)) count++
      }
      memberEventCount[m.id] = count
    }

    // Count attendance per member
    const memberStatusCounts = {}
    for (const a of attendance) {
      if (!memberStatusCounts[a.member_id]) memberStatusCounts[a.member_id] = { hadir: 0, sakit: 0, izin: 0, alpha: 0 }
      memberStatusCounts[a.member_id][a.status]++
    }

    // Build group name lookup
    const groups = await supabase.select('groups', { select: 'id, name' })
    const groupNames = {}
    for (const g of groups) groupNames[g.id] = g.name

    const perMember = members.map(m => {
      const counts = memberStatusCounts[m.id] || { hadir: 0, sakit: 0, izin: 0, alpha: 0 }
      const total = memberEventCount[m.id] || 0
      return {
        id: m.id,
        nickname: m.nickname,
        group: groupNames[m.group_id] || '',
        total_events: total,
        hadir: counts.hadir,
        sakit: counts.sakit,
        izin: counts.izin,
        alpha: counts.alpha,
        hadir_rate: total > 0 ? Math.round((counts.hadir / total) * 100) : 0,
      }
    })

    return new Response(JSON.stringify({ events: perEvent, members: perMember }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
