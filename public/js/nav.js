// Mobile navigation drawer (off-canvas sidebar)
;(() => {
  const toggle = document.getElementById('navToggle')
  const nav = document.getElementById('siteNav')
  const backdrop = document.getElementById('navBackdrop')
  if (!toggle || !nav) return

  const setOpen = open => {
    document.body.classList.toggle('nav-open', open)
    toggle.setAttribute('aria-expanded', String(open))
    toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu')
  }
  const isOpen = () => document.body.classList.contains('nav-open')

  toggle.addEventListener('click', () => setOpen(!isOpen()))
  if (backdrop) backdrop.addEventListener('click', () => setOpen(false))
  nav.addEventListener('click', e => {
    if (e.target.closest('.nav-btn')) setOpen(false)
  })
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) setOpen(false)
  })
})()