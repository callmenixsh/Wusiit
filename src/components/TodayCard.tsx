
import React from 'react'
import { CheckCircle2, SkipForward } from 'lucide-react'
import { AppState } from '../lib/storage'

type Props = {
  state: AppState
  onMark: (desc?: string)=>void
  onDoTomorrow: ()=>void
  actionState: 'idle'|'in-progress'|'completed'
  actionLabel: string
}

export default function TodayCard({state, onMark, onDoTomorrow, actionState, actionLabel}: Props){
  if(!state.split.length) {
    return <div className="bg-white dark:bg-black border border-black/20 dark:border-white/30 rounded-lg p-3">No split configured.</div>
  }
  const splitItem = state.split[0] ?? {name: 'Unconfigured'}
  const label = splitItem.name
  const nextTwo = [1, 2].map((offset) => {
    const nextIdx = offset % state.split.length
    return {
      offset,
      name: state.split[nextIdx]?.name ?? `Workout ${nextIdx + 1}`,
    }
  })

  return (
    <div className="mb-3 space-y-3">
      <div className="bg-white dark:bg-black p-6 rounded-lg border border-black/20 dark:border-white/30">
        <div className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Today</div>
        <div className="text-5xl font-extrabold leading-[0.95] text-black dark:text-white mt-1">{label}</div>

        {splitItem.description && <div className="text-sm leading-relaxed whitespace-pre-line text-black/85 dark:text-white/85 mt-3 p-3 border-t border-black/15 dark:border-white/20">{splitItem.description}</div>}

        {actionState !== 'idle' ? (
          <div className="mt-3">
            <button
              className="w-full py-3.5 bg-black text-white dark:bg-white dark:text-black rounded-md border border-black dark:border-white text-base font-medium flex items-center justify-center gap-2 opacity-70"
              disabled
            >
              <CheckCircle2 size={18} />
              <span>{actionLabel}</span>
            </button>
          </div>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="w-full py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-md border border-black dark:border-white text-sm flex items-center justify-center gap-2"
              onClick={()=>onMark(splitItem.description)}
            >
              <CheckCircle2 size={16} />
              <span>On it</span>
            </button>
            <button className="w-full py-2.5 rounded-md border border-black/20 dark:border-white/30 text-sm flex items-center justify-center gap-2" onClick={onDoTomorrow}>
              <SkipForward size={16} />
              <span>I'll do it tom</span>
            </button>
          </div>
        )}
      </div>

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
    </div>
  )
}
