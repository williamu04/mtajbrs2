const GROUP_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444']

const ICONS = {
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'user-check': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="m17 11 2 2 4-4"/>',
  thermometer: '<path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0Z"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  'user-x': '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="m18 8 5 5"/><path d="m23 8-5 5"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
}

function ic(name, size) {
  size = size || 15
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`
}

function colorFor(id) {
  let h = 0
  for (const ch of String(id || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return GROUP_COLORS[h % GROUP_COLORS.length]
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0][0].toUpperCase()
}

let _recapMembers = []
let _recapSort = { field: 'group', dir: 1 }

;(async () => {
  const params = new URLSearchParams(location.search)
  const eventId = params.get('event')
  const content = document.getElementById('recapContent')

  if (!eventId) {
    content.innerHTML = `<div class="card"><div class="empty">
      <span class="empty-icon">${ic('alert')}</span>
      Tidak ada kegiatan yang ditentukan.
    </div></div>`
    return
  }

  const navAttendance = document.getElementById('navAttendance')
  if (navAttendance) { navAttendance.href = `attendance.html?event=${eventId}`; navAttendance.hidden = false }

  try {
    const data = await API.getAttendance(eventId)
    renderRecap(data)
  } catch (err) {
    content.innerHTML = `<div class="card"><div class="empty">
      <span class="empty-icon">${ic('alert')}</span>
      Galat: ${esc(err.message)}
    </div></div>`
  }
})()

function renderRecap(data) {
  const content = document.getElementById('recapContent')
  const { event, groups } = data

  const timeStr = event.start_time
    ? `${event.start_time.slice(0, 5)}${event.end_time ? ' - ' + event.end_time.slice(0, 5) : ''}`
    : ''

  _recapMembers = []
  for (const g of groups) {
    for (const m of g.members) {
      _recapMembers.push({ ...m, groupName: g.name, group_id: m.group_id || g.id })
    }
  }

  const total = _recapMembers.length
  const counts = { hadir: 0, sakit: 0, izin: 0, alpha: 0 }
  let unmarked = 0
  for (const m of _recapMembers) {
    if (m.status) counts[m.status]++
    else unmarked++
  }

  let html = `
    <div class="event-hero">
      <div class="hero-eyebrow">Rekapitulasi Kehadiran</div>
      <h1>${esc(event.name)}</h1>
      <div class="event-meta">
        <span class="hero-chip">${ic('calendar')} ${event.date}</span>
        ${timeStr ? `<span class="hero-chip">${ic('clock')} ${timeStr}</span>` : ''}
        ${event.location ? `<span class="hero-chip">${ic('map-pin')} ${esc(event.location)}</span>` : ''}
      </div>
    </div>

    <div class="recap-toolbar">
      <p>Rekap kehadiran menyeluruh untuk kegiatan ini.</p>
      <button type="button" class="btn btn-sm btn-outline" onclick="window.print()">${ic('printer')} Cetak</button>
    </div>

    <div class="recap-stats">
      <div class="stat-card stat-total"><span class="stat-icon">${ic('users')}</span><span class="stat-num">${total}</span><span class="stat-label">Total</span></div>
      <div class="stat-card stat-hadir"><span class="stat-icon">${ic('user-check')}</span><span class="stat-num">${counts.hadir}</span><span class="stat-label">Hadir</span></div>
      <div class="stat-card stat-sakit"><span class="stat-icon">${ic('thermometer')}</span><span class="stat-num">${counts.sakit}</span><span class="stat-label">Sakit</span></div>
      <div class="stat-card stat-izin"><span class="stat-icon">${ic('file-text')}</span><span class="stat-num">${counts.izin}</span><span class="stat-label">Izin</span></div>
      <div class="stat-card stat-alpha"><span class="stat-icon">${ic('user-x')}</span><span class="stat-num">${counts.alpha}</span><span class="stat-label">Alpha</span></div>
      ${unmarked ? `<div class="stat-card stat-unmarked"><span class="stat-icon">${ic('clock')}</span><span class="stat-num">${unmarked}</span><span class="stat-label">Belum</span></div>` : ''}
    </div>
  `

  if (total === 0) {
    html += `<div class="card"><div class="empty">
      <span class="empty-icon">${ic('users')}</span>
      Belum ada anggota pada kegiatan ini.
    </div></div>`
    content.innerHTML = html
    return
  }

  html += renderRecapTable()
  content.innerHTML = html
}

function renderRecapTable() {
  const sorted = [..._recapMembers].sort((a, b) => {
    let va = a[_recapSort.field], vb = b[_recapSort.field]
    if (_recapSort.field === 'group') { va = a.groupName; vb = b.groupName }
    if (_recapSort.field === 'status') { va = a.status || ''; vb = b.status || '' }
    if (typeof va === 'string') va = va.toLowerCase()
    if (typeof vb === 'string') vb = vb.toLowerCase()
    if (va < vb) return -1 * _recapSort.dir
    if (va > vb) return 1 * _recapSort.dir
    return 0
  })

  return `
    <div class="card" id="recapTableCard">
      <div class="table-scroll">
        <table class="table recap-table">
          <thead>
            <tr>
              <th>No</th>
              <th class="sortable" onclick="sortRecap('group')">Kelompok ${sortRecapIcon('group')}</th>
              <th class="sortable" onclick="sortRecap('nickname')">Anggota ${sortRecapIcon('nickname')}</th>
              <th class="sortable" onclick="sortRecap('status')">Status ${sortRecapIcon('status')}</th>
              <th>Catatan</th>
            </tr>
          </thead>
          <tbody>
            ${sorted.map((m, i) => {
    const s = m.status || ''
    return `
              <tr>
                <td class="num">${i + 1}</td>
                <td class="muted">${esc(m.groupName)}</td>
                <td>
                  <div class="cell-main">
                    <span class="avatar xs" style="background:${colorFor(m.group_id)}">${initials(m.nickname)}</span>
                    <span class="cell-title">${esc(m.nickname)}</span>
                  </div>
                </td>
                <td><span class="badge ${s ? 'badge-' + s : 'badge-none'}">${s ? statusLabel(s) : 'Belum'}</span></td>
                <td class="muted">${esc(m.notes || '')}</td>
              </tr>`
  }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `
}

function sortRecap(field) {
  if (_recapSort.field === field) _recapSort.dir *= -1
  else { _recapSort.field = field; _recapSort.dir = 1 }
  const tableHtml = renderRecapTable()
  const container = document.getElementById('recapTableCard')
  if (container) container.outerHTML = tableHtml
}

function sortRecapIcon(field) {
  if (_recapSort.field !== field) return '↕'
  return _recapSort.dir === 1 ? '↑' : '↓'
}

function statusLabel(s) {
  const labels = { hadir: 'Hadir', sakit: 'Sakit', izin: 'Izin', alpha: 'Alpha' }
  return labels[s] || s
}

function esc(s) {
  if (s == null) return ''
  const div = document.createElement('div')
  div.textContent = String(s)
  return div.innerHTML
}