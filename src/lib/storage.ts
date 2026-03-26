export type DayEntry = {
  date: string // ISO date
  label: string
}

export type SplitItem = {
  name: string
  description?: string
}

export type AppState = {
  split: SplitItem[]
  history: DayEntry[]
}

const KEY = 'wdiit.state.v1'
const MAX_HISTORY_ENTRIES = 1000

export const defaultState = (): AppState => ({
  split: [
    {name: 'Push'},
    {name: 'Pull'},
    {name: 'Legs'}
  ],
  history: []
})

function normalizeHistoryEntry(entry: unknown): DayEntry | null {
  if (!entry || typeof entry !== 'object') return null
  const raw = entry as Record<string, unknown>

  const date = typeof raw.date === 'string' ? raw.date.trim() : ''
  const label = typeof raw.label === 'string' ? raw.label.trim() : ''
  if (!date || !label) return null

  return {
    date,
    label,
  }
}

function normalizeState(parsed: unknown): AppState {
  if (!parsed || typeof parsed !== 'object') return defaultState()
  const raw = parsed as Record<string, unknown>

  let split: SplitItem[] = []
  if (Array.isArray(raw.split)) {
    if (raw.split.length && typeof raw.split[0] === 'string') {
      split = (raw.split as string[])
        .map((s) => ({ name: String(s).trim() }))
        .filter((item) => item.name)
    } else {
      split = (raw.split as unknown[])
        .map((item) => {
          if (!item || typeof item !== 'object') return null
          const source = item as Record<string, unknown>
          const name = typeof source.name === 'string' ? source.name.trim() : ''
          if (!name) return null
          const description = typeof source.description === 'string' ? source.description.trim() : ''
          return {
            name,
            ...(description ? { description } : {}),
          }
        })
        .filter((item): item is SplitItem => Boolean(item))
    }
  }
  if (!split.length) split = defaultState().split

  const seen = new Set<string>()
  const history = Array.isArray(raw.history)
    ? raw.history
        .map(normalizeHistoryEntry)
        .filter((item): item is DayEntry => Boolean(item))
        .filter((item) => {
          const key = `${item.date}|${item.label}`
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
        .slice(0, MAX_HISTORY_ENTRIES)
    : []

  return { split, history }
}

function compactState(state: AppState): AppState {
  return {
    split: state.split.map((item) => ({
      name: item.name,
      ...(item.description ? { description: item.description } : {}),
    })),
    history: state.history.map((item) => ({
      date: item.date,
      label: item.label,
    })),
  }
}

export function loadState(): AppState {
  try{
    const raw = localStorage.getItem(KEY)
    if(!raw) return defaultState()
    const parsed = JSON.parse(raw)
    return normalizeState(parsed)
  }catch(e){
    console.error('loadState',e)
    return defaultState()
  }
}

export function saveState(s: AppState){
  localStorage.setItem(KEY, JSON.stringify(compactState(normalizeState(s))))
}

export function exportJSON(s: AppState){
  return JSON.stringify(compactState(normalizeState(s)), null, 2)
}

export function importJSON(json: string): AppState | null{
  try{
    const parsed = JSON.parse(json)
    if(!parsed) return null
    return normalizeState(parsed)
  }catch(e){
    return null
  }
}
