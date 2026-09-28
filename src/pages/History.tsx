import React from 'react'
import type { AppState } from '../lib/storage'
import { localDateString } from '../lib/dates'

const DAY_MS = 24 * 60 * 60 * 1000

type HistoryProps = {
  state: AppState
  lastWorkoutDate?: string
}

function parseIsoDate(value: string) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function getStreakStats(state: AppState) {
  const sessionDates = Array.from(
    new Set(
      state.history
        .map((h) => h.date)
        .filter(Boolean)
    )
  )
    .map(parseIsoDate)
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime())

  if (!sessionDates.length) return { currentStreak: 0, highestStreak: 0 }

  const getGapDays = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / DAY_MS)
  const ALLOWED_GAP_DAYS = 2 // one missing day is allowed

  const todayIso = localDateString()
  const today = parseIsoDate(todayIso)
  const latest = sessionDates[0]

  let currentStreak = 0
  if (today && latest && getGapDays(today, latest) <= ALLOWED_GAP_DAYS) {
    currentStreak = 1
    for (let i = 1; i < sessionDates.length; i += 1) {
      const gapDays = getGapDays(sessionDates[i - 1], sessionDates[i])
      if (gapDays <= ALLOWED_GAP_DAYS) currentStreak += 1
      else break
    }
  }

  let highestStreak = 1
  let run = 1
  for (let i = 1; i < sessionDates.length; i += 1) {
    const gapDays = getGapDays(sessionDates[i - 1], sessionDates[i])
    if (gapDays <= ALLOWED_GAP_DAYS) run += 1
    else run = 1
    if (run > highestStreak) highestStreak = run
  }

  return { currentStreak, highestStreak }
}

function formatDateLabel(value: string) {
  const parsed = parseIsoDate(value)
  if (!parsed) return value || 'Unknown date'
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function getRecentWeek(state: AppState) {
  const sessionSet = new Set(state.history.map((h) => h.date))
  const today = new Date()

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    const iso = localDateString(d)

    return {
      iso,
      weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
      day: d.getDate(),
      hasSession: sessionSet.has(iso),
    }
  })
}

function getDateRangeStats(state: AppState) {
  const sessionDates = Array.from(new Set(state.history.map((h) => h.date)))
    .map(parseIsoDate)
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => a.getTime() - b.getTime())

  if (!sessionDates.length) {
    return {
      firstDateLabel: 'N/A',
      lastDateLabel: 'N/A',
      daysSinceLast: null as number | null,
    }
  }

  const first = sessionDates[0]
  const last = sessionDates[sessionDates.length - 1]
  const now = new Date()
  const daysSinceLast = Math.max(0, Math.floor((now.getTime() - last.getTime()) / DAY_MS))

  return {
    firstDateLabel: formatDateLabel(localDateString(first)),
    lastDateLabel: formatDateLabel(localDateString(last)),
    daysSinceLast,
  }
}

export default function History({ state, lastWorkoutDate }: HistoryProps){
  const totalWorkoutDays = state.history.length
  const { currentStreak, highestStreak } = getStreakStats(state)
  const week = getRecentWeek(state)
  const { firstDateLabel, lastDateLabel, daysSinceLast } = getDateRangeStats(state)
  const todayIso = localDateString()
  const todayStatus = lastWorkoutDate === todayIso ? 'Logged today' : 'Not logged today'
  const splitCounts = state.history.reduce<Record<string, number>>((acc, h) => {
    const key = h.label || 'Unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const splitStats = Object.entries(splitCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="space-y-3 mb-3">
      <section className="bg-white dark:bg-black p-3 rounded-lg border border-black/15 dark:border-white/20">
        <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Stats</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-md border border-black/10 dark:border-white/15 p-3 bg-black/[0.02] dark:bg-white/[0.03]">
            <div className="text-[11px] uppercase tracking-wide text-black/55 dark:text-white/55">Workout Days</div>
            <div className="text-2xl font-semibold text-black dark:text-white mt-0.5">{totalWorkoutDays}</div>
          </div>
          <div className="rounded-md border border-black/10 dark:border-white/15 p-3 bg-black/[0.02] dark:bg-white/[0.03]">
            <div className="text-[11px] uppercase tracking-wide text-black/55 dark:text-white/55">Streak</div>
            <div className="text-2xl font-semibold text-black dark:text-white mt-0.5">{currentStreak}</div>
          </div>
          <div className="rounded-md border border-black/10 dark:border-white/15 p-3 bg-black/[0.02] dark:bg-white/[0.03]">
            <div className="text-[11px] uppercase tracking-wide text-black/55 dark:text-white/55">Highest Streak</div>
            <div className="text-2xl font-semibold text-black dark:text-white mt-0.5">{highestStreak}</div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-black/10 dark:border-white/15 p-3">
            <div className="text-[11px] uppercase tracking-wide text-black/55 dark:text-white/55">Today</div>
            <div className="text-sm font-medium text-black dark:text-white mt-0.5">{todayStatus}</div>
          </div>
          <div className="rounded-md border border-black/10 dark:border-white/15 p-3">
            <div className="text-[11px] uppercase tracking-wide text-black/55 dark:text-white/55">Last Session</div>
            <div className="text-sm font-medium text-black dark:text-white mt-0.5">
              {daysSinceLast === null ? 'No data yet' : `${daysSinceLast} day${daysSinceLast === 1 ? '' : 's'} ago`}
            </div>
          </div>
        </div>

        <div className="mt-2 rounded-md border border-black/10 dark:border-white/15 p-3">
          <div className="text-[11px] uppercase tracking-wide text-black/55 dark:text-white/55">Recent Week</div>
          <div className="grid grid-cols-7 gap-1.5 mt-2">
            {week.map((d) => (
              <div
                key={d.iso}
                className={`rounded-md border px-1 py-2 text-center ${d.hasSession
                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
                  : 'border-black/10 dark:border-white/15 text-black/75 dark:text-white/75'
                }`}
                title={`${formatDateLabel(d.iso)} • ${d.hasSession ? 'Session logged' : 'No session'}`}
              >
                <div className="text-[10px] uppercase tracking-wide opacity-70">{d.weekday}</div>
                <div className="text-sm font-semibold mt-0.5">{d.day}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 rounded-md border border-black/10 dark:border-white/15 px-3 py-2 text-xs text-black/65 dark:text-white/65">
          <span>First recorded: {firstDateLabel}</span>
          <br/>
          <span>Latest recorded: {lastDateLabel}</span>
        </div>

        {splitStats.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {splitStats.map(([label, count]) => (
              <div key={label} className="flex items-center justify-between rounded-md border border-black/10 dark:border-white/15 px-3 py-2">
                <span className="text-sm text-black/85 dark:text-white/85 truncate pr-2">{label}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-black text-white dark:bg-white dark:text-black">{count}x</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-black/60 dark:text-white/60 mt-2">No split stats yet.</div>
        )}
      </section>

      <section className="bg-white dark:bg-black p-3 rounded-lg border border-black/15 dark:border-white/20">
        <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">History</div>
        {state.history.length===0 && <div className="text-black/60 dark:text-white/60 text-xs mt-2">No entries yet.</div>}
        <ul className="mt-2 divide-y divide-black/10 dark:divide-white/10 text-sm">
          {state.history.map((h, i)=> (
            <li key={i} className="py-2.5">
              <div className="font-medium text-black dark:text-white truncate">{h.label}</div>
              <div className="text-[11px] text-black/55 dark:text-white/55 mt-0.5">{formatDateLabel(h.date)}</div>
              {h.description && <div className="text-xs whitespace-pre-line text-black/65 dark:text-white/65 mt-1">{h.description}</div>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
