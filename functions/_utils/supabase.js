export function getSupabase(env) {
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
      return res.json()
    },

    async insert(table, records, opts = {}) {
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
    },

    async update(table, id, data, opts = {}) {
      const params = { select: opts.select || '*' }
      const res = await fetch(`${url}/${table}?id=eq.${id}&${qs(params)}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`)
      const result = await res.json()
      return opts.single ? result[0] : result
    },

    async updateBy(table, filters, data) {
      let filterStr = Object.entries(filters).map(([k, v]) => `${k}=eq.${v}`).join('&')
      const res = await fetch(`${url}/${table}?${filterStr}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=representation' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`)
      return res.json()
    },

    async delete(table, id) {
      const res = await fetch(`${url}/${table}?id=eq.${id}`, {
        method: 'DELETE',
        headers,
      })
      if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`)
    },

    async upsert(table, records, conflict) {
      const params = { select: '*' }
      if (conflict) params.on_conflict = conflict
      const res = await fetch(`${url}/${table}?${qs(params)}`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(Array.isArray(records) ? records : [records]),
      })
      if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`)
      return res.json()
    },
  }
}
