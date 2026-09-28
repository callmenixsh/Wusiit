import { AppState, DayEntry } from './storage'
import { localDateString } from './dates'

export function addHistoryForCurrentDay(state: AppState){
  const splitItem = state.split[0]
  const today = localDateString()
  const normalizedLabel = splitItem?.name ?? 'Workout 1'
  const description = splitItem?.description?.trim() || undefined

  // Idempotency guard: avoid duplicate entry writes for the same completed split.
  const latest = state.history[0]
  if (
    latest &&
    latest.date === today &&
    (latest.label || '') === normalizedLabel
  ) {
    return state
  }

  const entry: DayEntry = {
    date: today,
    label: normalizedLabel,
    ...(description ? { description } : {}),
  }
  state.history.unshift(entry)
  return state
}

export function advanceToNextDay(state: AppState){
  if (state.split.length > 1) {
    const first = state.split[0]
    state.split = [...state.split.slice(1), first]
  }
  return state
}

export function markToday(state: AppState){
  addHistoryForCurrentDay(state)
  advanceToNextDay(state)
  return state
}

export function setSplit(state: AppState, newSplit: {name:string,description?:string}[]){
  state.split = newSplit.length ? newSplit : [{name:'Workout 1'}]
  return state
}
