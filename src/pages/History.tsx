import React, { useState } from 'react'
import type { AppState } from '../lib/storage'
import { localDateString } from '../lib/dates'

const DAY_MS = 24 * 60 * 60 * 1000

type HistoryProps = {
  state: AppState
  lastWorkoutDate?: string
  onLogWeight: (weight:number, date?:string) => void
  onDeleteWeight: (id:string) => void
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

export default function History({ state, lastWorkoutDate, onLogWeight, onDeleteWeight }: HistoryProps){
  const [weightDraft,setWeightDraft]=useState('')
  const [weightDate,setWeightDate]=useState(localDateString())
  const [selectedWeightId,setSelectedWeightId]=useState<string|null>(null)
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
  const weightEntries=state.weightTracking.entries
  const chartEntries=[...weightEntries].slice(0,12).reverse()
  const rawChartMin=chartEntries.length?Math.min(...chartEntries.map(entry=>entry.weight)):0
  const rawChartMax=chartEntries.length?Math.max(...chartEntries.map(entry=>entry.weight)):0
  const chartPadding=Math.max(0.5,(rawChartMax-rawChartMin)*0.15)
  const chartMin=rawChartMin-chartPadding
  const chartMax=rawChartMax+chartPadding
  const chartPoints=chartEntries.map((entry,index)=>{
    const x=chartEntries.length===1?160:28+(index/(chartEntries.length-1))*264
    const y=105-((entry.weight-chartMin)/(chartMax-chartMin))*85
    return {entry,x,y}
  })
  const selectedWeight=weightEntries.find(entry=>entry.id===selectedWeightId)

  function submitWeight(event:React.FormEvent){
    event.preventDefault()
    const value=Number(weightDraft)
    if(!Number.isFinite(value)||value<=0||value>1000)return
    onLogWeight(value,weightDate)
    setWeightDraft('')
  }

  return (
    <div className="space-y-3 mb-3">
      {state.weightTracking.enabled && <section className="bg-white dark:bg-black p-3 rounded-lg border border-black/15 dark:border-white/20">
        <div className="flex items-end justify-between gap-3">
          <div><div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Weight History</div><div className="text-2xl font-semibold text-black dark:text-white mt-1">{weightEntries[0]?`${weightEntries[0].weight} kg`:'—'}</div></div>
          {weightEntries.length>1 && <div className="text-xs text-black/60 dark:text-white/60">{weightEntries[0].weight-weightEntries[weightEntries.length-1].weight>0?'+':''}{Math.round((weightEntries[0].weight-weightEntries[weightEntries.length-1].weight)*10)/10} kg overall</div>}
        </div>
        {chartEntries.length>0 && <div className="mt-3 rounded-md border border-black/10 dark:border-white/15 p-2" aria-label="Recent weight trend">
          <svg viewBox="0 0 320 125" className="h-32 w-full overflow-visible">
            {[20,62.5,105].map(y=><line key={y} x1="28" x2="292" y1={y} y2={y} stroke="currentColor" strokeWidth="1" className="text-black/10 dark:text-white/10"/>)}
            <text x="2" y="24" fontSize="9" className="fill-black/45 dark:fill-white/45">{rawChartMax}</text>
            <text x="2" y="108" fontSize="9" className="fill-black/45 dark:fill-white/45">{rawChartMin}</text>
            {chartPoints.length>1&&<polyline points={chartPoints.map(point=>`${point.x},${point.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="text-black dark:text-white"/>}
            {chartPoints.map(({entry,x,y})=><g key={entry.id} role="button" tabIndex={0} aria-label={`${entry.date}: ${entry.weight} kilograms`} className="cursor-pointer outline-none" onClick={()=>setSelectedWeightId(entry.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelectedWeightId(entry.id)}}}><circle cx={x} cy={y} r={selectedWeightId===entry.id?7:5} className="fill-white stroke-black dark:fill-black dark:stroke-white" strokeWidth={selectedWeightId===entry.id?3:2}/><circle cx={x} cy={y} r="1.75" className="fill-black dark:fill-white"/></g>)}
          </svg>
          <div className="flex justify-between px-6 text-[10px] text-black/45 dark:text-white/45"><span>{formatDateLabel(chartEntries[0].date)}</span>{chartEntries.length>1&&<span>{formatDateLabel(chartEntries[chartEntries.length-1].date)}</span>}</div>
        </div>}
        {selectedWeight&&<div className="mt-2 flex items-center justify-between rounded-md border border-black/15 bg-black/[.02] px-3 py-2 dark:border-white/20 dark:bg-white/[.04]"><div><div className="text-sm font-semibold text-black dark:text-white">{selectedWeight.weight} kg</div><div className="text-[11px] text-black/55 dark:text-white/55">{formatDateLabel(selectedWeight.date)}</div></div><button type="button" className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs font-medium text-red-700 dark:border-red-500/40 dark:text-red-300" onClick={()=>{onDeleteWeight(selectedWeight.id);setSelectedWeightId(null)}}>Delete point</button></div>}
        <form className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2" onSubmit={submitWeight}>
          <input aria-label="Weight in kilograms" type="number" min="1" max="1000" step="0.1" required placeholder="Weight (kg)" value={weightDraft} onChange={e=>setWeightDraft(e.target.value)} className="min-w-0 rounded-md border border-black/20 dark:border-white/30 bg-white dark:bg-black px-2 py-2 text-sm text-black dark:text-white" />
          <input aria-label="Weight date" type="date" required max={localDateString()} value={weightDate} onChange={e=>setWeightDate(e.target.value)} className="min-w-0 rounded-md border border-black/20 dark:border-white/30 bg-white dark:bg-black px-2 py-2 text-sm text-black dark:text-white" />
          <button className="rounded-md bg-black text-white dark:bg-white dark:text-black px-3 text-sm font-medium">Add</button>
        </form>
      </section>}
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
