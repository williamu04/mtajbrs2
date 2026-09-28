// In-memory mock store for local development or when Supabase is not configured
const mockDb = {
  batches: [
    { id: 'b1111111-1111-1111-1111-111111111111', name: 'Gelombang 1', description: 'Angkatan Pertama', created_at: new Date().toISOString() },
    { id: 'b2222222-2222-2222-2222-222222222222', name: 'Gelombang 2', description: 'Angkatan Kedua', created_at: new Date().toISOString() }
  ],
  groups: [
    { id: 'g1111111-1111-1111-1111-111111111111', name: 'Kelompok PA 1', description: 'Pemuda Ahad Kelompok 1', batch_id: 'b1111111-1111-1111-1111-111111111111', created_at: new Date().toISOString() },
    { id: 'g2222222-2222-2222-2222-222222222222', name: 'Kelompok PA 2', description: 'Pemuda Ahad Kelompok 2', batch_id: 'b1111111-1111-1111-1111-111111111111', created_at: new Date().toISOString() },
    { id: 'g3333333-3333-3333-3333-333333333333', name: 'Kelompok Pemudi', description: 'Pemudi MTA Jebres 2', batch_id: 'b2222222-2222-2222-2222-222222222222', created_at: new Date().toISOString() }
  ],
  members: [
    { id: 'm1011111-1111-1111-1111-111111111111', nickname: 'Ahmad Fauzi', group_id: 'g1111111-1111-1111-1111-111111111111', created_at: new Date().toISOString() },
    { id: 'm1022222-2222-2222-2222-222222222222', nickname: 'Budi Santoso', group_id: 'g1111111-1111-1111-1111-111111111111', created_at: new Date().toISOString() },
    { id: 'm1033333-3333-3333-3333-333333333333', nickname: 'Chandra Wijaya', group_id: 'g1111111-1111-1111-1111-111111111111', created_at: new Date().toISOString() },
    { id: 'm2011111-1111-1111-1111-111111111111', nickname: 'Danang Prasetyo', group_id: 'g2222222-2222-2222-2222-222222222222', created_at: new Date().toISOString() },
    { id: 'm2022222-2222-2222-2222-222222222222', nickname: 'Eko Wahyudi', group_id: 'g2222222-2222-2222-2222-222222222222', created_at: new Date().toISOString() },
    { id: 'm2033333-3333-3333-3333-333333333333', nickname: 'Fajar Nugroho', group_id: 'g2222222-2222-2222-2222-222222222222', created_at: new Date().toISOString() },
    { id: 'm3011111-1111-1111-1111-111111111111', nickname: 'Gita Rahmawati', group_id: 'g3333333-3333-3333-3333-333333333333', created_at: new Date().toISOString() },
    { id: 'm3022222-2222-2222-2222-222222222222', nickname: 'Hana Safitri', group_id: 'g3333333-3333-3333-3333-333333333333', created_at: new Date().toISOString() },
    { id: 'm3033333-3333-3333-3333-333333333333', nickname: 'Indah Lestari', group_id: 'g3333333-3333-3333-3333-333333333333', created_at: new Date().toISOString() }
  ],
  events: [
    {
      id: 'e1111111-1111-1111-1111-111111111111',
      name: 'Pengajian Rutin Pemuda',
      date: '2026-09-01',
      start_time: '00:00',
      end_time: '23:59',
      location: 'Gedung MTA Jebres 2',
      description: 'Pengajian rutin setiap pekan',
      repeat_type: 'weekly',
      repeat_days: '0,1,2,3,4,5,6',
      created_at: new Date().toISOString()
    },
    {
      id: 'e2222222-2222-2222-2222-222222222222',
      name: 'Kajian Khusus Tematik',
      date: '2026-09-28',
      start_time: null,
      end_time: null,
      location: 'Ruang Utama MTA Jebres 2',
      description: 'Kajian tematik bulanan',
      repeat_type: 'none',
      repeat_days: '',
      created_at: new Date().toISOString()
    }
  ],
  group_event: [
    { id: 'ge1', group_id: 'g1111111-1111-1111-1111-111111111111', event_id: 'e1111111-1111-1111-1111-111111111111' },
    { id: 'ge2', group_id: 'g2222222-2222-2222-2222-222222222222', event_id: 'e1111111-1111-1111-1111-111111111111' },
    { id: 'ge3', group_id: 'g3333333-3333-3333-3333-333333333333', event_id: 'e1111111-1111-1111-1111-111111111111' },
    { id: 'ge4', group_id: 'g1111111-1111-1111-1111-111111111111', event_id: 'e2222222-2222-2222-2222-222222222222' }
  ],
  member_event: []
}

function getMockSupabase() {
  return {
    async select(table, opts = {}) {
      const records = mockDb[table] || []
      let filtered = records.filter(item => {
        if (!opts.filters) return true
        return Object.entries(opts.filters).every(([k, v]) => {
          if (Array.isArray(v)) {
            return v.includes(item[k])
          }
          return item[k] === v
        })
      })

      // Handle joins
      let result = filtered.map(item => {
        const copy = { ...item }
        if (table === 'groups' && opts.select?.includes('batches(name)')) {
          const batch = mockDb.batches.find(b => b.id === copy.batch_id)
          copy.batches = batch ? { name: batch.name } : null
        }
        if (table === 'members' && opts.select?.includes('groups(name)')) {
          const group = mockDb.groups.find(g => g.id === copy.group_id)
          copy.groups = group ? { name: group.name } : null
        }
        if (table === 'group_event' && opts.select?.includes('groups(name)')) {
          const group = mockDb.groups.find(g => g.id === copy.group_id)
          copy.groups = group ? { name: group.name } : null
        }
        return copy
      })

      // Handle sorting
      if (opts.order) {
        const [col, dir] = opts.order.split('.')
        result.sort((a, b) => {
          const valA = a[col] ?? ''
          const valB = b[col] ?? ''
          if (typeof valA === 'string' && typeof valB === 'string') {
            return dir === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB)
          }
          return dir === 'desc' ? (valB > valA ? 1 : -1) : (valA > valB ? 1 : -1)
        })
      }

      if (opts.limit) {
        result = result.slice(0, opts.limit)
      }

      return JSON.parse(JSON.stringify(result))
    },

    async insert(table, records, opts = {}) {
      if (!mockDb[table]) mockDb[table] = []
      const list = Array.isArray(records) ? records : [records]
      const inserted = []

      for (const item of list) {
        const row = {
          id: item.id || crypto.randomUUID(),
          ...item,
          created_at: item.created_at || new Date().toISOString(),
        }
        mockDb[table].push(row)
        inserted.push(row)
      }

      const out = JSON.parse(JSON.stringify(inserted))
      return opts.single ? out[0] : out
    },

    async update(table, id, data, opts = {}) {
      if (!mockDb[table]) mockDb[table] = []
      const idx = mockDb[table].findIndex(item => item.id === id)
      if (idx >= 0) {
        mockDb[table][idx] = { ...mockDb[table][idx], ...data }
        const out = JSON.parse(JSON.stringify(mockDb[table][idx]))
        return opts.single ? out : [out]
      }
      return opts.single ? null : []
    },

    async updateBy(table, filters, data) {
      if (!mockDb[table]) mockDb[table] = []
      const updated = []
      for (let i = 0; i < mockDb[table].length; i++) {
        const matches = Object.entries(filters).every(([k, v]) => mockDb[table][i][k] === v)
        if (matches) {
          mockDb[table][i] = { ...mockDb[table][i], ...data }
          updated.push(mockDb[table][i])
        }
      }
      return JSON.parse(JSON.stringify(updated))
    },

    async delete(table, id) {
      if (!mockDb[table]) return
      // Cascades
      if (table === 'batches') {
        mockDb.groups.forEach(g => { if (g.batch_id === id) g.batch_id = null })
      } else if (table === 'groups') {
        const memberIds = mockDb.members.filter(m => m.group_id === id).map(m => m.id)
        mockDb.member_event = mockDb.member_event.filter(me => !memberIds.includes(me.member_id))
        mockDb.members = mockDb.members.filter(m => m.group_id !== id)
        mockDb.group_event = mockDb.group_event.filter(ge => ge.group_id !== id)
      } else if (table === 'members') {
        mockDb.member_event = mockDb.member_event.filter(me => me.member_id !== id)
      } else if (table === 'events') {
        mockDb.group_event = mockDb.group_event.filter(ge => ge.event_id !== id)
        mockDb.member_event = mockDb.member_event.filter(me => me.event_id !== id)
      }

      mockDb[table] = mockDb[table].filter(item => item.id !== id)
    },

    async upsert(table, records, conflict) {
      if (!mockDb[table]) mockDb[table] = []
      const list = Array.isArray(records) ? records : [records]
      const conflictKeys = (conflict || 'id').split(',').map(s => s.trim())
      const results = []

      for (const item of list) {
        const idx = mockDb[table].findIndex(row => conflictKeys.every(k => row[k] === item[k]))
        if (idx >= 0) {
          mockDb[table][idx] = { ...mockDb[table][idx], ...item }
          results.push(mockDb[table][idx])
        } else {
          const row = {
            id: item.id || crypto.randomUUID(),
            ...item,
            created_at: item.created_at || new Date().toISOString(),
          }
          mockDb[table].push(row)
          results.push(row)
        }
      }

      return JSON.parse(JSON.stringify(results))
    }
  }
}

export function getSupabase(env = {}) {
  // If Supabase credentials are missing or placeholder, use in-memory store
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return getMockSupabase()
  }

  const url = env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1'
  const headers = {
    'apikey': env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
  }

  function qs(params) {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) p.set(k, v)
    }
    return p.toString()
  }

  return {
    async select(table, opts = {}) {
      try {
        const params = { select: opts.select || '*' }
        if (opts.order) params.order = opts.order
        if (opts.limit) params.limit = opts.limit
        if (opts.filters) {
          for (const [k, v] of Object.entries(opts.filters)) {
            if (Array.isArray(v)) {
              params[k] = `in.(${v.join(',')})`
            } else {
              params[k] = `eq.${v}`
            }
          }
        }
        const res = await fetch(`${url}/${table}?${qs(params)}`, { headers })
        if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`)
        return await res.json()
      } catch (err) {
        console.warn(`[Supabase fallback] select ${table} failed, using in-memory store:`, err.message)
        return getMockSupabase().select(table, opts)
      }
    },

    async insert(table, records, opts = {}) {
      try {
        const params = {}
        if (opts.select) params.select = opts.select
        const res = await fetch(`${url}/${table}${qs(params) ? '?' + qs(params) : ''}`, {
          method: 'POST',
          headers: { ...headers, Prefer: opts.returnType || 'return=representation' },
          body: JSON.stringify(Array.isArray(records) ? records : [records]),
        })
        if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`)
        const data = await res.json()
        return opts.single ? data[0] : data
      } catch (err) {
        console.warn(`[Supabase fallback] insert ${table} failed, using in-memory store:`, err.message)
        return getMockSupabase().insert(table, records, opts)
      }
    },

    async update(table, id, data, opts = {}) {
      try {
        const params = { select: opts.select || '*' }
        const res = await fetch(`${url}/${table}?id=eq.${id}&${qs(params)}`, {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=representation' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`)
        const result = await res.json()
        return opts.single ? result[0] : result
      } catch (err) {
        console.warn(`[Supabase fallback] update ${table} failed, using in-memory store:`, err.message)
        return getMockSupabase().update(table, id, data, opts)
      }
    },

    async updateBy(table, filters, data) {
      try {
        let filterStr = Object.entries(filters).map(([k, v]) => `${k}=eq.${v}`).join('&')
        const res = await fetch(`${url}/${table}?${filterStr}`, {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=representation' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`)
        return await res.json()
      } catch (err) {
        console.warn(`[Supabase fallback] updateBy ${table} failed, using in-memory store:`, err.message)
        return getMockSupabase().updateBy(table, filters, data)
      }
    },

    async delete(table, id) {
      try {
        const res = await fetch(`${url}/${table}?id=eq.${id}`, {
          method: 'DELETE',
          headers,
        })
        if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`)
      } catch (err) {
        console.warn(`[Supabase fallback] delete ${table} failed, using in-memory store:`, err.message)
        return getMockSupabase().delete(table, id)
      }
    },

    async upsert(table, records, conflict) {
      try {
        const params = { select: '*' }
        if (conflict) params.on_conflict = conflict
        const res = await fetch(`${url}/${table}?${qs(params)}`, {
          method: 'POST',
          headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify(Array.isArray(records) ? records : [records]),
        })
        if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`)
        return await res.json()
      } catch (err) {
        console.warn(`[Supabase fallback] upsert ${table} failed, using in-memory store:`, err.message)
        return getMockSupabase().upsert(table, records, conflict)
      }
    },
  }
}
