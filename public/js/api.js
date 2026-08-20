const API = {
  async request(method, path, body) {
    const token = localStorage.getItem('token')
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }
    if (token) opts.headers['Authorization'] = `Bearer ${token}`
    if (body !== undefined) opts.body = JSON.stringify(body)

    const res = await fetch(path, opts)
    if (res.status === 401) {
      localStorage.removeItem('token')
      if (!window.location.pathname.includes('login.html')) {
        window.location.href = 'login.html'
      }
      throw new Error('Unauthorized')
    }
    if (res.status === 204) return null
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    if (isJson) {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      return data
    }
    const text = await res.text()
    throw new Error(text || `Request failed (${res.status})`)
  },

  // Auth
  login(username, password) {
    return this.request('POST', '/api/auth/login', { username, password })
  },
  verify() {
    return this.request('GET', '/api/auth/verify')
  },

  // Groups
  getGroups() { return this.request('GET', '/api/groups') },
  createGroup(name, description) { return this.request('POST', '/api/groups', { name, description }) },
  updateGroup(id, name, description) { return this.request('PUT', `/api/groups/${id}`, { name, description }) },
  deleteGroup(id) { return this.request('DELETE', `/api/groups/${id}`) },

  // Members
  getMembers(groupId) {
    const qs = groupId ? `?group_id=${groupId}` : ''
    return this.request('GET', `/api/members${qs}`)
  },
  createMember(nickname, groupId) { return this.request('POST', '/api/members', { nickname, group_id: groupId }) },
  updateMember(id, nickname, groupId) { return this.request('PUT', `/api/members/${id}`, { nickname, group_id: groupId }) },
  deleteMember(id) { return this.request('DELETE', `/api/members/${id}`) },

  // Events
  getEvents() { return this.request('GET', '/api/events') },
  createEvent(name, date, startTime, endTime, location, description) {
    return this.request('POST', '/api/events', { name, date, start_time: startTime, end_time: endTime, location, description })
  },
  updateEvent(id, name, date, startTime, endTime, location, description) {
    return this.request('PUT', `/api/events/${id}`, { name, date, start_time: startTime, end_time: endTime, location, description })
  },
  deleteEvent(id) { return this.request('DELETE', `/api/events/${id}`) },

  // Event groups
  getEventGroups(eventId) { return this.request('GET', `/api/events/${eventId}/groups`) },
  setEventGroups(eventId, groupIds) { return this.request('POST', `/api/events/${eventId}/groups`, { group_ids: groupIds }) },

  // Stats
  getStats() { return this.request('GET', '/api/stats') },

  // Attendance (public)
  async getAttendance(eventId) {
    return fetch(`/api/attendance/${eventId}`).then(async r => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Gagal memuat data')
      return data
    })
  },

  async submitAttendance(eventId, attendance) {
    return fetch(`/api/attendance/${eventId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendance }),
    }).then(async r => {
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Gagal menyimpan kehadiran')
      return data
    })
  },
}
