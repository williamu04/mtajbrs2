const GROUP_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#ef4444']

const ICONS = {
  edit: '<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15v-3"/><path d="M12 15V8"/><path d="M17 15v-5"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
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

function eventStatus(dateStr) {
  const today = new Date().toISOString().slice(0, 10)
  if (dateStr === today) return { label: 'Hari ini', cls: 'badge-today' }
  if (dateStr > today) return { label: 'Akan datang', cls: 'badge-future' }
  return { label: 'Selesai', cls: 'badge-done' }
}

// ── Tab switching ──
document.querySelectorAll('[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none')
    btn.classList.add('active')
    const tab = document.getElementById('tab-' + btn.dataset.tab)
    tab.style.display = 'block'
    if (btn.dataset.tab === 'stats') renderStats()
  })
})

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token')
  window.location.href = 'login.html'
})

  // Verify token on load
  ; (async () => {
    try {
      await API.verify()
    } catch {
      window.location.href = 'login.html'
      return
    }
    renderGroups()
    renderMembers()
    renderEvents()
    renderStats()
  })()

// ── Groups ──
async function renderGroups() {
  const el = document.getElementById('tab-groups')
  const groups = await API.getGroups()
  el.innerHTML = `
    <div class="page-head">
      <div>
        <div class="head-actions">
        <h1>${groups.length} Kelompok</h1>
      </div>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Tambah kelompok</div>
      <div class="card-desc">Kelompok baru akan tampil di daftar di bawah.</div>
      <div class="form-grid" style="margin-top:12px">
        <div class="field">
          <label for="groupNameInput">Nama kelompok</label>
          <input type="text" id="groupNameInput" placeholder="cth. Kel1" autocomplete="off">
        </div>
        <div class="field">
          <label for="groupDescInput">Deskripsi (opsional)</label>
          <input type="text" id="groupDescInput" placeholder="cth. Kelompok 1 Putra" autocomplete="off">
        </div>
        <button class="btn btn-primary" onclick="createGroup()">${ic('plus')} Tambah</button>
      </div>
      <div class="panel-divider"></div>
      ${groups.length ? `
      <div class="card-head">
        <div class="card-title">Daftar kelompok</div>
        <span class="badge badge-count">${groups.length}</span>
      </div>
      <div class="table-scroll">
        <table class="table">
          <thead><tr><th>Nama</th><th>Deskripsi</th><th class="right">Aksi</th></tr></thead>
          <tbody>
            ${groups.map(g => `
              <tr>
                <td>
                  <div class="cell-main">
                    <span class="avatar" style="background:${colorFor(g.id)}">${initials(g.name)}</span>
                    <span class="cell-title" id="gname-${g.id}">${esc(g.name)}</span>
                  </div>
                </td>
                <td class="muted"><span id="gdesc-${g.id}">${esc(g.description || '')}</span></td>
                <td class="td-actions">
                  <div class="inline-edit">
                    <button class="btn btn-sm btn-ghost" onclick="editGroup('${g.id}')">${ic('edit')} Ubah</button>
                    <button class="btn btn-sm btn-ghost-danger" onclick="deleteGroup('${g.id}')">${ic('trash')} Hapus</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>` : `<div class="empty">
        <span class="empty-icon">${ic('users')}</span>
        Belum ada kelompok. <span class="muted">Buat kelompok pertama di atas.</span>
      </div>`}
    </div>
  `
}

async function createGroup() {
  const name = document.getElementById('groupNameInput').value.trim()
  const desc = document.getElementById('groupDescInput').value.trim()
  if (!name) { toast('Nama kelompok wajib diisi.', 'error'); return }
  await API.createGroup(name, desc)
  document.getElementById('groupNameInput').value = ''
  document.getElementById('groupDescInput').value = ''
  toast('Kelompok berhasil ditambahkan.')
  renderGroups()
  renderMembers()
  renderEvents()
}

async function editGroup(id) {
  const nameSpan = document.getElementById(`gname-${id}`)
  const descSpan = document.getElementById(`gdesc-${id}`)
  const row = nameSpan.closest('tr')
  const currentName = nameSpan.textContent
  const currentDesc = descSpan.textContent

  nameSpan.outerHTML = `<input type="text" id="edit-gname-${id}" value="${esc(currentName)}" style="width:170px">`
  descSpan.outerHTML = `<input type="text" id="edit-gdesc-${id}" value="${esc(currentDesc)}" style="width:210px">`

  const btn = row.querySelector('.inline-edit')
  btn.innerHTML = `
    <button class="btn btn-sm btn-primary" onclick="saveGroup('${id}')">${ic('check')} Simpan</button>
    <button class="btn btn-sm btn-ghost" onclick="renderGroups()">${ic('x')} Batal</button>
  `
}

async function saveGroup(id) {
  const name = document.getElementById(`edit-gname-${id}`).value.trim()
  const desc = document.getElementById(`edit-gdesc-${id}`).value.trim()
  if (!name) return
  await API.updateGroup(id, name, desc)
  toast('Perubahan kelompok disimpan.')
  renderGroups()
}

async function deleteGroup(id) {
  const name = document.getElementById(`gname-${id}`)?.textContent || ''
  const ok = await confirmDialog({
    title: 'Hapus kelompok?',
    message: `Kelompok "${name}" beserta seluruh anggotanya dan riwayat kehadirannya akan dihapus permanen.`,
    confirmText: 'Hapus',
  })
  if (!ok) return
  await API.deleteGroup(id)
  toast('Kelompok dihapus.')
  renderGroups()
  renderMembers()
  renderEvents()
}

// ── Members ──
async function renderMembers() {
  const el = document.getElementById('tab-members')
  const [groups, members] = await Promise.all([API.getGroups(), API.getMembers()])
  window._groups = groups

  el.innerHTML = `
    <div class="page-head">
      <div class="head-actions">
        <h1>${members.length} Anggota</h1>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Tambah anggota</div>
      <div class="card-desc">Anggota langsung masuk ke kelompok yang dipilih.</div>
      <div class="form-grid" style="margin-top:12px">
        <div class="field">
          <label for="memberNameInput">Nama anggota</label>
          <input type="text" id="memberNameInput" placeholder="cth. Abid Solehudin" autocomplete="off">
        </div>
        <div class="field">
          <label for="memberGroupInput">Kelompok</label>
          <select id="memberGroupInput">
            <option value="">Pilih kelompok...</option>
            ${groups.map(g => `<option value="${g.id}">${esc(g.name)}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-primary" onclick="createMember()">${ic('plus')} Tambah</button>
      </div>
      <div class="panel-divider"></div>
      <div class="card-head">
        <div class="card-title">Daftar anggota per kelompok</div>
        <div class="search-box">
          ${ic('search')}
          <input type="text" id="memberSearchInput" placeholder="Cari anggota..." oninput="filterMembers()" autocomplete="off">
        </div>
      </div>
      <div id="memberGroupsContainer">
        ${groups.map(g => {
    const gMembers = members.filter(m => m.group_id === g.id)
    return `
          <details class="group-details">
            <summary class="group-summary">
              <span class="chev">${ic('chevron')}</span>
              <span class="avatar xs" style="background:${colorFor(g.id)}">${initials(g.name)}</span>
              <span class="group-title">${esc(g.name)}</span>
              <span class="group-count">${gMembers.length}</span>
            </summary>
            ${gMembers.length ? `
            <div class="table-scroll">
              <table class="table">
                <thead><tr><th>Anggota</th><th class="right">Aksi</th></tr></thead>
                <tbody id="mgroup-${g.id}">
                  ${gMembers.map(m => `
                  <tr class="member-row-stub" data-name="${m.nickname.toLowerCase()}">
                    <td>
                      <div class="cell-main">
                        <span class="avatar xs" style="background:${colorFor(m.group_id)}">${initials(m.nickname)}</span>
                        <span class="cell-title" id="mname-${m.id}" data-group-id="${m.group_id}">${esc(m.nickname)}</span>
                      </div>
                    </td>
                    <td class="td-actions">
                      <div class="inline-edit">
                        <button class="btn btn-sm btn-ghost" onclick="editMember('${m.id}')">${ic('edit')} Ubah</button>
                        <button class="btn btn-sm btn-ghost-danger" onclick="deleteMember('${m.id}')">${ic('trash')} Hapus</button>
                      </div>
                    </td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>` : `
            <div class="empty" style="padding:12px">
              <span class="empty-icon" style="width:36px;height:36px">${ic('users')}</span>
              Belum ada anggota di kelompok ini.
            </div>`}
          </details>
        `
  }).join('')}
      </div>
    </div>
  `
}

function filterMembers() {
  const q = document.getElementById('memberSearchInput').value.toLowerCase().trim()
  document.querySelectorAll('.member-row-stub').forEach(row => {
    row.style.display = (!q || row.dataset.name.includes(q)) ? '' : 'none'
  })
  document.querySelectorAll('#memberGroupsContainer details').forEach(details => {
    if (!q) { details.removeAttribute('open'); return }
    const rows = details.querySelectorAll('.member-row-stub')
    let visible = rows.length === 0
    rows.forEach(row => { if (row.style.display !== 'none') visible = true })
    if (visible) details.setAttribute('open', '')
    else details.removeAttribute('open')
  })
}

async function createMember() {
  const nickname = document.getElementById('memberNameInput').value.trim()
  const groupId = document.getElementById('memberGroupInput').value
  if (!nickname) { toast('Nama anggota wajib diisi.', 'error'); return }
  if (!groupId) { toast('Pilih kelompok terlebih dahulu.', 'error'); return }
  await API.createMember(nickname, groupId)
  document.getElementById('memberNameInput').value = ''
  document.getElementById('memberGroupInput').value = ''
  toast('Anggota berhasil ditambahkan.')
  renderMembers()
}

async function editMember(id) {
  const nameSpan = document.getElementById(`mname-${id}`)
  const row = nameSpan.closest('tr')
  const currentName = nameSpan.textContent
  const currentGroup = nameSpan.dataset.groupId
  nameSpan.outerHTML = `
    <input type="text" id="edit-mname-${id}" value="${esc(currentName)}" style="width:150px">
    <select id="edit-mgroup-${id}" style="width:auto;margin-left:8px">
      ${window._groups ? window._groups.map(g => `
        <option value="${g.id}" ${g.id === currentGroup ? 'selected' : ''}>${esc(g.name)}</option>
      `).join('') : ''}
    </select>
  `

  const btn = row.querySelector('.inline-edit')
  btn.innerHTML = `
    <button class="btn btn-sm btn-primary" onclick="saveMember('${id}')">${ic('check')} Simpan</button>
    <button class="btn btn-sm btn-ghost" onclick="renderMembers()">${ic('x')} Batal</button>
  `
}

async function saveMember(id) {
  const nickname = document.getElementById(`edit-mname-${id}`).value.trim()
  const groupId = document.getElementById(`edit-mgroup-${id}`)?.value
  if (!nickname) return
  await API.updateMember(id, nickname, groupId || null)
  toast('Perubahan anggota disimpan.')
  renderMembers()
}

async function deleteMember(id) {
  const name = document.getElementById(`mname-${id}`)?.textContent || ''
  const ok = await confirmDialog({
    title: 'Hapus anggota?',
    message: `Anggota "${name}" beserta riwayat kehadirannya akan dihapus permanen.`,
    confirmText: 'Hapus',
  })
  if (!ok) return
  await API.deleteMember(id)
  toast('Anggota dihapus.')
  renderMembers()
}

// ── Events ──
async function renderEvents() {
  const el = document.getElementById('tab-events')
  const [events, groups] = await Promise.all([API.getEvents(), API.getGroups()])

  const today = new Date().toISOString().slice(0, 10)

  el.innerHTML = `
    <div class="page-head">
      <div class="head-actions">
        <h1>${events.length} Kegiatan</h1>
      </div>
    </div>

    <div class="card">
      <div class="card-title">Buat kegiatan baru</div>
      <div class="card-desc">Pilih kelompok yang diundang untuk mengisi kehadiran.</div>
      <div class="form-grid" style="margin-top:14px">
        <div class="field">
          <label for="eventNameInput">Nama kegiatan</label>
          <input type="text" id="eventNameInput" placeholder="cth. Kajian Rutin Gelombang Remaja" autocomplete="off">
        </div>
        <div class="field">
          <label for="eventDateInput">Tanggal</label>
          <input type="date" id="eventDateInput" value="${today}">
        </div>
      </div>
      <div class="form-grid" style="margin-top:4px">
        <div class="field">
          <label for="eventStartInput">Jam mulai</label>
          <input type="time" id="eventStartInput">
        </div>
        <div class="field">
          <label for="eventEndInput">Jam selesai</label>
          <input type="time" id="eventEndInput">
        </div>
        <div class="field">
          <label for="eventLocInput">Lokasi (opsional)</label>
          <input type="text" id="eventLocInput" placeholder="cth. Cabang Karangpandan 1" autocomplete="off">
        </div>
      </div>
      <div class="field" style="margin-top:4px">
        <label for="eventDescInput">Deskripsi (opsional)</label>
        <input type="text" id="eventDescInput" placeholder="Rangkuman materi, pembicara, dll." autocomplete="off">
      </div>
      <div class="field" style="margin-top:14px">
        <label>Sertakan kelompok</label>
        <div class="pill-group" id="eventGroupCheckboxes">
          ${groups.map(g => `
            <input type="checkbox" class="pill-input" id="gc-${g.id}" value="${g.id}">
            <label class="pill-check" for="gc-${g.id}"><span>${esc(g.name)}</span></label>
          `).join('')}
          ${groups.length ? '' : '<span class="muted text-sm">Belum ada kelompok.</span>'}
        </div>
      </div>
      <button class="btn btn-primary" onclick="addEvent()" style="margin-top:16px">${ic('plus')} Buat Kegiatan</button>
    </div>
    <div class="panel-divider"></div>
    <div class="card-head">
      <div class="card-title">Daftar kegiatan</div>
      <span class="badge badge-count">${events.length}</span>
    </div>
    ${events.length ? `<div id="eventList">
      ${events.map(e => {
    const st = eventStatus(e.date)
    const timeStr = e.start_time
      ? `${e.start_time.slice(0, 5)}${e.end_time ? ' - ' + e.end_time.slice(0, 5) : ''}`
      : ''
    return `
      <div class="event-row">
        <div class="event-row-head">
          <div class="cell-main" style="flex-wrap:wrap">
            <span class="avatar avatar-evt">${ic('calendar', 17)}</span>
            <div>
              <div class="event-title" id="ename-${e.id}">${esc(e.name)}</div>
              <span class="badge ${st.cls}">${st.label}</span>
            </div>
          </div>
          <div class="inline-edit">
            <button class="btn btn-sm btn-ghost" onclick="editEvent('${e.id}')">${ic('edit')} Ubah</button>
            <button class="btn btn-sm btn-ghost-danger" onclick="deleteEvent('${e.id}')">${ic('trash')} Hapus</button>
          </div>
        </div>
        <div class="event-row-meta">
          <span class="meta-chip">${ic('calendar')} <span class="val" id="edate-${e.id}">${e.date}</span></span>
          <span class="meta-chip">${ic('clock')} <span class="val" id="etime-${e.id}">${timeStr}</span></span>
          <span class="meta-chip">${ic('map-pin')} <span class="val" id="eloc-${e.id}">${esc(e.location || '')}</span></span>
        </div>
        <div class="event-row-links">
          <button class="btn btn-sm btn-ghost" onclick="copyLink('${e.id}')">${ic('link')} Salin tautan kehadiran</button>
          <a class="btn btn-sm btn-outline" href="recap.html?event=${e.id}" target="_blank" rel="noopener">${ic('chart')} Lihat rekap</a>
        </div>
      </div>`
  }).join('')}
    </div>` : `<div class="empty">
      <span class="empty-icon">${ic('calendar')}</span>
      Belum ada kegiatan. <span class="muted">Buat kegiatan pertama di atas.</span>
    </div>`}
  `
}

async function addEvent() {
  const name = document.getElementById('eventNameInput').value.trim()
  const date = document.getElementById('eventDateInput').value
  const startTime = document.getElementById('eventStartInput').value || null
  const endTime = document.getElementById('eventEndInput').value || null
  const location = document.getElementById('eventLocInput').value.trim()
  const description = document.getElementById('eventDescInput').value.trim()
  if (!name) { toast('Nama kegiatan wajib diisi.', 'error'); return }
  if (!date) { toast('Tanggal kegiatan wajib diisi.', 'error'); return }

  const checkedBoxes = document.querySelectorAll('#eventGroupCheckboxes input[type="checkbox"]:checked')
  const groupIds = Array.from(checkedBoxes).map(cb => cb.value)

  const event = await API.createEvent(name, date, startTime, endTime, location, description)
  if (groupIds.length > 0) {
    await API.setEventGroups(event.id, groupIds)
  }

  document.getElementById('eventNameInput').value = ''
  document.getElementById('eventStartInput').value = ''
  document.getElementById('eventEndInput').value = ''
  document.getElementById('eventLocInput').value = ''
  document.getElementById('eventDescInput').value = ''
  checkedBoxes.forEach(cb => cb.checked = false)
  toast('Kegiatan berhasil dibuat.')
  renderEvents()
}

async function editEvent(id) {
  const card = document.getElementById(`ename-${id}`).closest('.event-row')
  const nameEl = document.getElementById(`ename-${id}`)
  const dateEl = document.getElementById(`edate-${id}`)
  const timeEl = document.getElementById(`etime-${id}`)
  const locEl = document.getElementById(`eloc-${id}`)

  const timeText = timeEl.textContent
  const [startStr, endStr] = timeText.includes(' - ') ? timeText.split(' - ') : [timeText, '']

  nameEl.outerHTML = `
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <input type="text" id="edit-ename-${id}" value="${esc(nameEl.textContent)}" style="width:170px">
      <label class="sr-only" for="edit-edate-${id}">Tanggal</label>
      <input type="date" id="edit-edate-${id}" value="${dateEl.textContent}" style="width:170px">
    </div>`
  locEl.outerHTML = `<input type="text" id="edit-eloc-${id}" value="${esc(locEl.textContent)}" placeholder="Lokasi" style="width:160px">`
  timeEl.outerHTML = `
    <input type="time" id="edit-estart-${id}" value="${startStr}" aria-label="Jam mulai" style="width:120px">
    <input type="time" id="edit-eend-${id}" value="${endStr}" aria-label="Jam selesai" style="width:120px">
  `

  const btn = card.querySelector('.inline-edit')
  btn.innerHTML = `
    <button class="btn btn-sm btn-primary" onclick="saveEvent('${id}')">${ic('check')} Simpan</button>
    <button class="btn btn-sm btn-ghost" onclick="renderEvents()">${ic('x')} Batal</button>
  `
}

async function saveEvent(id) {
  const name = document.getElementById(`edit-ename-${id}`).value.trim()
  const date = document.getElementById(`edit-edate-${id}`).value
  const startTime = document.getElementById(`edit-estart-${id}`)?.value || null
  const endTime = document.getElementById(`edit-eend-${id}`)?.value || null
  const location = document.getElementById(`edit-eloc-${id}`).value.trim()
  if (!name || !date) return
  await API.updateEvent(id, name, date, startTime, endTime, location, '')
  toast('Perubahan kegiatan disimpan.')
  renderEvents()
}

async function deleteEvent(id) {
  const name = document.getElementById(`ename-${id}`)?.textContent || ''
  const ok = await confirmDialog({
    title: 'Hapus kegiatan?',
    message: `Kegiatan "${name}" beserta seluruh data kehadirannya akan dihapus permanen.`,
    confirmText: 'Hapus',
  })
  if (!ok) return
  await API.deleteEvent(id)
  toast('Kegiatan dihapus.')
  renderEvents()
}

function copyLink(eventId) {
  const url = `${location.origin}/attendance.html?event=${eventId}`
  navigator.clipboard.writeText(url).then(() => {
    toast('Tautan kehadiran disalin!')
  }).catch(() => {
    prompt('Salin tautan ini:', url)
  })
}

let _statsData = null
let _statsSort = { field: 'nickname', dir: 1 }
let _statsGroupFilter = ''

// ── Statistics ──
async function renderStats() {
  const el = document.getElementById('tab-stats')
  try {
    if (!_statsData) _statsData = await API.getStats()
    const data = _statsData
    let html = ''

    html += `<div class="page-head">
      <div>
        <h1>Statistik Kehadiran</h1>
      </div>
    </div>`

    html += `<div class="card"><div class="card-head"><div class="card-title">Kehadiran per kegiatan</div></div>`
    if (data.events.length === 0) {
      html += '<div class="empty"><span class="empty-icon">' + ic('chart') + '</span>Belum ada kegiatan.</div>'
    } else {
      html += `<div class="table-scroll"><table class="table stats-table">
        <thead><tr><th>Kegiatan</th><th>Tanggal</th><th>Total</th><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Alpha</th><th>Frekuensi</th></tr></thead>
        <tbody>
          ${data.events.map(e => `
            <tr>
              <td class="cell-title">${esc(e.name)}</td>
              <td class="num">${e.date}</td>
              <td class="num">${e.total_members}</td>
              <td class="num" style="color:var(--hadir-strong);font-weight:700">${e.hadir}</td>
              <td class="num" style="color:var(--sakit-strong);font-weight:700">${e.sakit}</td>
              <td class="num" style="color:var(--izin-strong);font-weight:700">${e.izin}</td>
              <td class="num" style="color:var(--alpha-strong);font-weight:700">${e.alpha}</td>
              <td>
                <div class="rate-bar-wrap">
                  <div class="rate-track"><div class="rate-bar" style="width:${e.hadir_rate}%"></div></div>
                  <span>${e.hadir_rate}%</span>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table></div>`
    }
    html += `</div>`

    // Build unique group list for filter
    const groupSet = [...new Set(data.members.map(m => m.group))]
    groupSet.sort()

    // Apply filter and sort
    let filtered = data.members.filter(m => !_statsGroupFilter || m.group === _statsGroupFilter)
    filtered.sort((a, b) => {
      let va = a[_statsSort.field], vb = b[_statsSort.field]
      if (typeof va === 'string') va = va.toLowerCase()
      if (typeof vb === 'string') vb = vb.toLowerCase()
      if (va < vb) return -1 * _statsSort.dir
      if (va > vb) return 1 * _statsSort.dir
      return 0
    })

    html += `<div class="card"><div class="card-head"><div class="card-title">Kehadiran per anggota</div></div>`
    html += `
      <div class="stats-controls">
        <select id="statsGroupFilter" onchange="setStatsGroupFilter(this.value)" aria-label="Filter kelompok">
          <option value="">Semua kelompok</option>
          ${groupSet.map(g => `<option value="${esc(g)}"${_statsGroupFilter === g ? ' selected' : ''}>${esc(g)}</option>`).join('')}
        </select>
        <button class="btn btn-sm btn-outline" onclick="refreshStats()">${ic('refresh')} Segarkan</button>
      </div>
    `
    if (filtered.length === 0) {
      html += '<div class="empty"><span class="empty-icon">' + ic('users') + '</span>Belum ada anggota.</div>'
    } else {
      html += `<div class="table-scroll"><table class="table stats-table">
        <thead><tr>
          <th class="sortable" onclick="sortStats('nickname')">Nama ${sortIcon('nickname')}</th>
          <th class="sortable" onclick="sortStats('group')">Kelompok ${sortIcon('group')}</th>
          <th class="sortable" onclick="sortStats('total_events')">Kegiatan ${sortIcon('total_events')}</th>
          <th class="sortable" onclick="sortStats('hadir')">Hadir ${sortIcon('hadir')}</th>
          <th class="sortable" onclick="sortStats('sakit')">Sakit ${sortIcon('sakit')}</th>
          <th class="sortable" onclick="sortStats('izin')">Izin ${sortIcon('izin')}</th>
          <th class="sortable" onclick="sortStats('alpha')">Alpha ${sortIcon('alpha')}</th>
          <th class="sortable" onclick="sortStats('hadir_rate')">Frekuensi ${sortIcon('hadir_rate')}</th>
        </tr></thead>
        <tbody>
          ${filtered.map(m => `
            <tr>
              <td>${esc(m.nickname)}</td>
              <td class="muted">${esc(m.group)}</td>
              <td class="num">${m.total_events}</td>
              <td class="num" style="color:var(--hadir-strong);font-weight:700">${m.hadir}</td>
              <td class="num" style="color:var(--sakit-strong);font-weight:700">${m.sakit}</td>
              <td class="num" style="color:var(--izin-strong);font-weight:700">${m.izin}</td>
              <td class="num" style="color:var(--alpha-strong);font-weight:700">${m.alpha}</td>
              <td>
                <div class="rate-bar-wrap">
                  <div class="rate-track"><div class="rate-bar" style="width:${m.hadir_rate}%"></div></div>
                  <span>${m.hadir_rate}%</span>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table></div>`
    }
    html += `</div>`

    el.innerHTML = html
  } catch (err) {
    el.innerHTML = `<div class="card"><p class="empty">Galat memuat statistik: ${esc(err.message)}</p></div>`
  }
}

function sortStats(field) {
  if (_statsSort.field === field) _statsSort.dir *= -1
  else { _statsSort.field = field; _statsSort.dir = 1 }
  _statsData = null
  renderStats()
}

function setStatsGroupFilter(val) {
  _statsGroupFilter = val
  _statsData = null
  renderStats()
}

function refreshStats() {
  _statsData = null
  _statsGroupFilter = ''
  renderStats()
}

function sortIcon(field) {
  if (_statsSort.field !== field) return '↕'
  return _statsSort.dir === 1 ? '↑' : '↓'
}

// ── Confirm modal ──
function confirmDialog({ title = 'Konfirmasi', message = '', confirmText = 'Hapus', cancelText = 'Batal' } = {}) {
  return new Promise(resolve => {
    const overlay = document.createElement('div')
    overlay.className = 'modal-overlay'
    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby="modal-desc">
        <div class="modal-head">
          <span class="modal-icon">${ic('trash')}</span>
          <div>
            <h3 id="modal-title">${esc(title)}</h3>
            <p id="modal-desc">${esc(message)}</p>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline" data-cancel>${esc(cancelText)}</button>
          <button type="button" class="btn btn-danger" data-confirm>${esc(confirmText)}</button>
        </div>
      </div>`
    const finish = v => {
      overlay.remove()
      document.removeEventListener('keydown', onKey)
      resolve(v)
    }
    overlay.querySelector('[data-cancel]').addEventListener('click', () => finish(false))
    overlay.querySelector('[data-confirm]').addEventListener('click', () => finish(true))
    overlay.addEventListener('click', e => { if (e.target === overlay) finish(false) })
    const onKey = e => {
      if (e.key === 'Escape') finish(false)
      if (e.key === 'Enter') finish(true)
    }
    document.addEventListener('keydown', onKey)
    document.body.appendChild(overlay)
    overlay.querySelector('[data-cancel]').focus()
  })
}

// ── Helpers ──
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
