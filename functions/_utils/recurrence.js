const TZ_OFFSET_MS = 25200000

function dateUTC(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function serverToday() {
  return new Date(Date.now() + TZ_OFFSET_MS).toISOString().slice(0, 10)
}

export function occurrenceDates(event, maxDates = 56) {
  const days = parseRepeatDays(event)
  if (event.repeat_type !== 'weekly' || days.length === 0) {
    return [event.date]
  }
  const start = dateUTC(event.date)
  const dates = []
  for (let i = 0; i < maxDates; i++) {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() + i)
    if (days.includes(d.getUTCDay())) {
      dates.push(d.toISOString().slice(0, 10))
    }
  }
  return dates
}

export function isScheduledOn(event, dateStr) {
  if (event.repeat_type !== 'weekly') {
    return dateStr === event.date
  }
  const days = parseRepeatDays(event)
  if (days.length === 0) return dateStr === event.date
  const d = dateUTC(dateStr)
  return days.includes(d.getUTCDay())
}

export function nextScheduledDate(event, afterDateStr) {
  const dates = occurrenceDates(event)
  return dates.find(d => d >= afterDateStr) || null
}

export function countOccurrencesUpTo(event, endDateStr) {
  const days = parseRepeatDays(event)
  if (event.repeat_type !== 'weekly' || days.length === 0) {
    return event.date <= endDateStr ? 1 : 0
  }
  const start = dateUTC(event.date)
  const end = dateUTC(endDateStr)
  if (end < start) return 0
  const dayMs = 86400000
  const totalDays = Math.round((end - start) / dayMs)
  let count = 0
  for (let i = 0; i <= totalDays; i++) {
    const d = new Date(start)
    d.setUTCDate(d.getUTCDate() + i)
    if (days.includes(d.getUTCDay())) count++
  }
  return count
}

export function parseRepeatDays(event) {
  if (event.repeat_type !== 'weekly' || !event.repeat_days) return []
  return String(event.repeat_days)
    .split(',')
    .map(s => parseInt(s, 10))
    .filter(n => Number.isInteger(n) && n >= 0 && n <= 6)
}

export function serializeRepeatDays(repeatType, days) {
  if (repeatType !== 'weekly' || !Array.isArray(days) || days.length === 0) {
    return { repeat_type: 'none', repeat_days: '' }
  }
  const sorted = [...new Set(days)].sort((a, b) => a - b)
  return { repeat_type: 'weekly', repeat_days: sorted.join(',') }
}
