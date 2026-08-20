const GROUP_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444']

const ICONS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v-3"/><path d="M12 15V8"/><path d="M17 15v-5"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  'map-pin': '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
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

; (async () => {
  const params = new URLSearchParams(location.search)
  const eventId = params.get('event')
  const content = document.getElementById('attendanceContent')

  if (!eventId) {
    content.innerHTML = `<div class="card"><div class="empty">
      <span class="empty-icon">${ic('alert')}</span>
      Tidak ada kegiatan yang ditentukan. Gunakan tautan yang valid dari admin.
    </div></div>`
    return
  }

  const navRecap = document.getElementById('navRecap')
  if (navRecap) { navRecap.href = `recap.html?event=${eventId}`; navRecap.hidden = false }

  try {
    const data = await API.getAttendance(eventId)
    renderAttendance(data, eventId)
  } catch (err) {
    content.innerHTML = `<div class="card"><div class="empty">
      <span class="empty-icon">${ic('alert')}</span>
      Galat: ${esc(err.message)}
    </div></div>`
  }
})()

function renderAttendance(data, eventId) {
  const content = document.getElementById('attendanceContent')
  const { event, groups } = data

  const timeStr = event.start_time
    ? `${event.start_time.slice(0, 5)}${event.end_time ? ' - ' + event.end_time.slice(0, 5) : ''}`
    : ''
  const inWindow = isInTimeWindow(event)

  let html = `
    <div class="event-hero">
      <div class="hero-eyebrow">Kehadiran Kegiatan</div>
      <h1>${esc(event.name)}</h1>
      <div class="event-meta">
        <span class="hero-chip">${ic('calendar')} ${event.date}</span>
        ${timeStr ? `<span class="hero-chip">${ic('clock')} ${timeStr}</span>` : ''}
        ${event.location ? `<span class="hero-chip">${ic('map-pin')} ${esc(event.location)}</span>` : ''}
      </div>
      ${(!inWindow && event.start_time) ? `
      <div class="hero-note">${ic('alert')} Di luar jadwal kegiatan. Kehadiran dapat diisi saat kegiatan berlangsung.</div>` : ''}
    </div>
  `

  const memberGroups = groups.filter(g => g.members.length > 0)

  if (memberGroups.length === 0) {
    html += `<div class="card"><div class="empty">
      <span class="empty-icon">${ic('alert')}</span>
      Tidak ada kelompok yang disertakan pada kegiatan ini.
    </div></div>`
    content.innerHTML = html
    return
  }

  const totalMembers = memberGroups.reduce((n, g) => n + g.members.length, 0)

  html += `<form id="attendanceForm">
    ${memberGroups.map(g => {
    const marked = g.members.filter(m => m.status).length
    const pct = Math.round((marked / g.members.length) * 100)
    return `
      <div class="group-section">
        <details class="group-details" ${marked ? 'open' : ''}>
          <summary class="group-summary">
            <span class="chev">${ic('chevron')}</span>
            <span class="avatar xs" style="background:${colorFor(g.id)}">${initials(g.name)}</span>
            <span class="group-title">${esc(g.name)}</span>
            <span class="group-count">${marked}/${g.members.length}</span>
            <span class="group-progress"><span class="group-progress-fill" style="width:${pct}%"></span></span>
          </summary>
          <div class="group-members">
            ${g.members.map(m => `
            <div class="member-row${!m.status ? ' status-none' : ''}">
              <div class="member-ident">
                <span class="avatar xs" style="background:${colorFor(m.group_id || g.id)}">${initials(m.nickname)}</span>
                <span class="member-name">${esc(m.nickname)}</span>
              </div>
              <div class="segmented" role="radiogroup" aria-label="Status ${esc(m.nickname)}">
                ${['hadir', 'sakit', 'izin', 'alpha'].map(s => `
                  <input type="radio" name="status-${m.id}" id="${s}-${m.id}" value="${s}" ${m.status === s ? 'checked' : ''}>
                  <label class="status-pill pill-${s}" for="${s}-${m.id}">${statusLabel(s)}</label>
                `).join('')}
              </div>
              <div class="notes-wrap">
                <input type="text" class="notes-input" placeholder="Catatan" value="${esc(m.notes || '')}" data-member="${m.id}" autocomplete="off">
              </div>
            </div>`).join('')}
          </div>
        </details>
      </div>`
  }).join('')}

    <div class="attendance-actions">
      <div class="actions-info">
        <span class="mark-label">Terisi <b id="markCount">0</b> dari ${totalMembers}</span>
        <div class="mark-track"><div class="mark-fill" id="markFill"></div></div>
      </div>
      ${inWindow ? `<button type="submit" class="btn btn-primary">${ic('check')} Simpan kehadiran</button>` : ''}
    </div>
  </form>`

  content.innerHTML = html

  document.querySelectorAll('.member-row').forEach(row => {
    row.addEventListener('dblclick', () => {
      row.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false)
      row.classList.add('status-none')
    })
    row.querySelectorAll('input[type="radio"]').forEach(r => {
      r.addEventListener('change', () => {
        if (r.checked) row.classList.remove('status-none')
      })
    })
  })

  const markCount = document.getElementById('markCount')
  if (markCount) {
    const radios = content.querySelectorAll('.segmented input[type="radio"]')
    const markFill = document.getElementById('markFill')
    const update = () => {
      const n = content.querySelectorAll('.segmented input[type="radio"]:checked').length
      markCount.textContent = n
      if (markFill) markFill.style.width = totalMembers ? `${Math.round((n / totalMembers) * 100)}%` : '0%'
    }
    radios.forEach(r => r.addEventListener('change', update))
    update()
  }

  const form = document.getElementById('attendanceForm')
  if (form) form.addEventListener('submit', submitAttendance)
}

function isInTimeWindow(event) {
  if (!event.start_time) return true
  const now = new Date()
  const [y, m, d] = event.date.split('-').map(Number)
  const [sh, sm] = event.start_time.split(':').map(Number)
  const start = new Date(y, m - 1, d, sh, sm)
  const end = event.end_time
    ? (() => { const [eh, em] = event.end_time.split(':'); return new Date(y, m - 1, d, +eh, +em) })()
    : new Date(y, m - 1, d, 23, 59)
  return now >= start && now <= end
}

async function submitAttendance(e) {
  e.preventDefault()
  const params = new URLSearchParams(location.search)
  const eventId = params.get('event')

  const form = document.getElementById('attendanceForm')
  const radios = form.querySelectorAll('input[type="radio"]:checked')
  const notesInputs = form.querySelectorAll('.notes-input')

  const memberStatus = {}
  radios.forEach(r => {
    const memberId = r.name.replace('status-', '')
    memberStatus[memberId] = r.value
  })

  const notesMap = {}
  notesInputs.forEach(n => {
    const memberId = n.dataset.member
    notesMap[memberId] = n.value
  })

  const attendance = Object.keys(memberStatus).map(memberId => ({
    member_id: memberId,
    status: memberStatus[memberId],
    notes: notesMap[memberId] || '',
  }))

  if (attendance.length === 0) {
    toast('Mohon tandai setidaknya satu anggota.', 'error')
    return
  }

  const submitBtn = form.querySelector('button[type="submit"]')
  const original = submitBtn ? submitBtn.innerHTML : ''
  if (submitBtn) { submitBtn.classList.add('is-loading'); submitBtn.disabled = true }

  try {
    await API.submitAttendance(eventId, attendance)
    toast('Kehadiran disimpan!')
  } catch (err) {
    toast('Galat: ' + err.message, 'error')
  }

  if (submitBtn) { submitBtn.classList.remove('is-loading'); submitBtn.disabled = false; submitBtn.innerHTML = original }
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

function toast(msg, type = 'success') {
  const path = type === 'success' ? ICONS.check : ICONS.x
  const el = document.createElement('div')
  el.className = `toast ${type}`
  el.setAttribute('role', 'status')
  el.innerHTML = `
    <span class="toast-icon"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg></span>
    <span>${esc(msg)}</span>`
  document.body.appendChild(el)
  el.addEventListener('click', () => el.remove())
  setTimeout(() => el.remove(), 2600)
}
