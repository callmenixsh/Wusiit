export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Monday = 0 through Sunday = 6, matching the fixed weekly plan. */
export function weekdayIndex(date: Date = new Date()): number {
  return (date.getDay() + 6) % 7
}
