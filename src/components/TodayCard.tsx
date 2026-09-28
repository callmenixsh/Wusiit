
import React from 'react'
import { CheckCircle2, SkipForward } from 'lucide-react'
import { AppState } from '../lib/storage'

type Props = {
  state: AppState
  onMark: ()=>void
  onDoTomorrow: ()=>void
  onSwitchToNextDay: ()=>void
  onEndWorkout: ()=>void
  actionState: 'idle'|'in-progress'|'ready-next-day'
  actionLabel: string
  lastWorkoutDate: string
}

function formatLastWorkout(value: string) {
  if (!value) return 'No workout logged yet'
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function TodayCard({state, onMark, onDoTomorrow, onSwitchToNextDay, onEndWorkout, actionState, actionLabel, lastWorkoutDate}: Props){
  if(!state.split.length) {
    return <div className="bg-white dark:bg-black border border-black/20 dark:border-white/30 rounded-lg p-3">No split configured.</div>
  }
  const splitItem = state.split[0] ?? {name: 'Unconfigured'}
  const label = splitItem.name
  const upcoming = state.split.slice(1)
  const previewCount = Math.min(2, upcoming.length)
  const nextTwo = Array.from({ length: previewCount }, (_, i) => ({
    offset: i + 1,
    name: upcoming[i]?.name ?? `Workout ${i + 2}`,
  }))

  return (
    <div className="mb-3 space-y-3">
      <div className="bg-white dark:bg-black p-6 rounded-lg border border-black/20 dark:border-white/30">
        <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Today</div>
        <div className="text-5xl font-extrabold leading-[0.95] text-black dark:text-white mt-1">{label}</div>

        {splitItem.description && <div className="text-sm leading-relaxed whitespace-pre-line text-black/85 dark:text-white/85 mt-3 p-3 border-t border-black/15 dark:border-white/20">{splitItem.description}</div>}

        {actionState === 'in-progress' ? (
          <div className="mt-3">
            <button
              className="w-full py-2 bg-black text-white dark:bg-white dark:text-black rounded-md border border-black dark:border-white text-sm font-medium flex items-center justify-center gap-2 opacity-70"
              disabled
            >
              <CheckCircle2 size={18} />
              <span>{actionLabel}</span>
            </button>
            <button
              className="w-full mt-2 py-1.5 rounded-md border border-black/20 dark:border-white/30 text-xs text-black/70 dark:text-white/70"
              onClick={onEndWorkout}
            >
              End workout early
            </button>
          </div>
        ) : actionState === 'ready-next-day' ? (
          <div className="mt-1">
            <button
              className="w-full py-2 bg-black text-white dark:bg-white dark:text-black rounded-md border border-black dark:border-white text-sm font-medium flex flex-col items-center justify-center gap-0.5"
              onClick={onSwitchToNextDay}
            >
              <span>{actionLabel}</span>
            </button>
            <span className="text-[10px] opacity-80 ">Last workout: {formatLastWorkout(lastWorkoutDate)}</span>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="w-full py-2 bg-black text-white dark:bg-white dark:text-black rounded-md border border-black dark:border-white text-sm flex items-center justify-center gap-2"
              onClick={onMark}
            >
              <CheckCircle2 size={16} />
              <span>On it</span>
            </button>
            <button className="w-full py-2 rounded-md border border-black/20 dark:border-white/30 text-sm flex items-center justify-center gap-2" onClick={onDoTomorrow}>
              <SkipForward size={16} />
              <span>I'll do it tom</span>
            </button>
          </div>
        )}
      </div>

      {nextTwo.length > 0 && (
        <div className="bg-white dark:bg-black p-4 rounded-lg border border-black/20 dark:border-white/30">
          <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Coming Up</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {nextTwo.map((d) => (
              <div key={d.offset} className="rounded-md border border-black/10 dark:border-white/15 p-2.5 bg-black/[0.02] dark:bg-white/[0.03]">
                <div className="text-[10px] font-medium tracking-wide text-black/55 dark:text-white/55">Up Next {d.offset}</div>
                <div className="text-sm font-semibold text-black dark:text-white truncate mt-0.5">{d.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
