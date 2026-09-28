import React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'

type TemplateId = 'ppl' | '5day' | 'arnold' | 'home'

type SettingsProps = {
  onOpenTemplates: () => void
  onExportClipboard: () => void | Promise<void>
  onImport: () => void
  onResetHistory: () => void
  onReset: () => void
  isTemplateModalOpen: boolean
  onCloseTemplateModal: () => void
  onUseTemplate: (templateId: TemplateId) => void
  themePref: 'system' | 'light' | 'dark'
  onCycleTheme: () => void
  weightTrackingEnabled: boolean
  onToggleWeightTracking: () => void
  weeklyWorkoutGoal: number
  onWeeklyWorkoutGoalChange: (goal:number) => void
  restSeconds: number
  onRestSecondsChange: (seconds:number) => void
}

export default function Settings({
  onOpenTemplates,
  onExportClipboard,
  onImport,
  onResetHistory,
  onReset,
  isTemplateModalOpen,
  onCloseTemplateModal,
  onUseTemplate,
  themePref,
  onCycleTheme,
  weightTrackingEnabled,
  onToggleWeightTracking,
  weeklyWorkoutGoal,
  onWeeklyWorkoutGoalChange,
  restSeconds,
  onRestSecondsChange,
}: SettingsProps) {
  return (
    <>
      <section className="bg-white dark:bg-black rounded-lg space-y-3">
        <div className="rounded-xl border border-black/15 dark:border-white/25 p-4 bg-black/[0.015] dark:bg-white/[0.02]">
          <div className="text-[11px] uppercase tracking-wider text-black/60 dark:text-white/60">Appearance</div>
          <button
            className="mt-3 w-full py-2.5 rounded-lg border border-black/20 dark:border-white/30 bg-white dark:bg-black text-black dark:text-white flex items-center justify-center gap-2"
            onClick={onCycleTheme}
          >
            {themePref === 'system' ? (
              <Monitor size={16} strokeWidth={1.8} />
            ) : themePref === 'dark' ? (
              <Moon size={16} strokeWidth={1.8} />
            ) : (
              <Sun size={16} strokeWidth={1.8} />
            )}
            <span>
              Theme: {themePref === 'system' ? 'System' : themePref === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
        </div>

        <div className="rounded-xl border border-black/15 dark:border-white/25 p-4 bg-black/[0.015] dark:bg-white/[0.02]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-black/60 dark:text-white/60">Weight Tracking</div>
              <div className="text-xs mt-1 text-black/65 dark:text-white/65">Weight history and weekly weigh-in reminders</div>
            </div>
            <div className="flex shrink-0 items-center">
              <button type="button" role="switch" aria-checked={weightTrackingEnabled} aria-label="Weight tracking" onClick={onToggleWeightTracking} className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-black ${weightTrackingEnabled?'border-black bg-black dark:border-white dark:bg-white':'border-black/20 bg-black/15 dark:border-white/25 dark:bg-white/20'}`}>
                <span aria-hidden="true" className={`absolute left-0 top-1 h-5 w-5 rounded-full shadow-sm transition-transform ${weightTrackingEnabled?'translate-x-6 bg-white dark:bg-black':'translate-x-1 bg-white dark:bg-black'}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-black/15 dark:border-white/25 p-4 bg-black/[0.015] dark:bg-white/[0.02]">
          <div className="text-[11px] uppercase tracking-wider text-black/60 dark:text-white/60">Workout Settings</div>
          <label className="mt-3 flex items-center justify-between gap-4 rounded-lg border border-black/15 px-3 py-2.5 dark:border-white/20">
            <span><span className="block text-sm font-medium">Weekly streak goal</span><span className="mt-0.5 block text-xs text-black/55 dark:text-white/55">Workouts needed each week</span></span>
            <select aria-label="Weekly workout goal" value={weeklyWorkoutGoal} onChange={event=>onWeeklyWorkoutGoalChange(Number(event.target.value))} className="min-h-10 rounded-lg border border-black/20 bg-white px-3 text-sm font-medium text-black dark:border-white/30 dark:bg-black dark:text-white">
              {[1,2,3,4,5,6,7].map(goal=><option key={goal} value={goal}>{goal}×</option>)}
            </select>
          </label>
          <label className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-black/15 px-3 py-2.5 dark:border-white/20">
            <span><span className="block text-sm font-medium">Rest timer</span><span className="mt-0.5 block text-xs text-black/55 dark:text-white/55">Default rest after every set</span></span>
            <select aria-label="Rest timer duration" value={restSeconds} onChange={event=>onRestSecondsChange(Number(event.target.value))} className="min-h-10 rounded-lg border border-black/20 bg-white px-3 text-sm font-medium text-black dark:border-white/30 dark:bg-black dark:text-white">
              {[0,30,45,60,75,90,120,180,300].map(seconds=><option key={seconds} value={seconds}>{seconds===0?'Off':seconds<60?`${seconds}s`:`${seconds/60}m${seconds%60?` ${seconds%60}s`:''}`}</option>)}
            </select>
          </label>
          <button className="mt-3 w-full py-2.5 rounded-lg bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white" onClick={onOpenTemplates}>Use Templates</button>
        </div>

        <div className="rounded-xl border border-black/15 dark:border-white/25 p-4 bg-black/[0.015] dark:bg-white/[0.02]">
          <div className="text-[11px] uppercase tracking-wider text-black/60 dark:text-white/60">Backup</div>
          <div className="flex flex-col gap-2 mt-3">
            <button className="w-full py-2.5 rounded-lg border border-black/20 dark:border-white/30 bg-white dark:bg-black text-black dark:text-white" onClick={onExportClipboard}>Export JSON (clipboard)</button>
            <button className="w-full py-2.5 rounded-lg border border-black/20 dark:border-white/30 bg-white dark:bg-black text-black dark:text-white" onClick={onImport}>Import JSON</button>
          </div>
        </div>

        <div className="rounded-xl border border-red-300/80 dark:border-red-500/35 p-4 bg-red-50/70 dark:bg-red-950/20">
          <div className="text-[11px] uppercase tracking-wider text-red-700/80 dark:text-red-300/85">Delete</div>
          <div className="flex flex-col gap-2 mt-3">
            <button className="w-full py-2.5 rounded-lg border border-red-300/90 dark:border-red-500/45 bg-white/90 dark:bg-red-950/30 text-red-800 dark:text-red-200" onClick={onResetHistory}>Reset History</button>
            <button className="w-full py-2.5 rounded-lg border border-red-400 dark:border-red-500/55 bg-white/95 dark:bg-red-950/35 text-red-900 dark:text-red-100" onClick={onReset}>Reset All Data</button>
          </div>
        </div>
      </section>

      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3">
          <button
            aria-label="Close template picker"
            className="absolute inset-0 bg-black/45"
            onClick={onCloseTemplateModal}
          />
          <div className="relative w-full max-w-md rounded-lg border border-black/20 dark:border-white/30 bg-white dark:bg-black p-3">
            <div className="text-sm font-medium text-black dark:text-white">Choose Template</div>
            <div className="mt-2 grid gap-2">
              <button className="w-full text-left rounded-md border-2 border-black dark:border-white px-3 py-2" onClick={() => onUseTemplate('home')}>
                <div className="text-sm font-medium text-black dark:text-white">Home Workout</div>
                <div className="text-xs text-black/60 dark:text-white/60">3-day bodyweight strength and conditioning plan</div>
              </button>
              <button className="w-full text-left rounded-md border border-black/20 dark:border-white/30 px-3 py-2" onClick={() => onUseTemplate('ppl')}>
                <div className="text-sm font-medium text-black dark:text-white">Push Pull Legs</div>
                <div className="text-xs text-black/60 dark:text-white/60">Classic 3-day PPL split</div>
              </button>
              <button className="w-full text-left rounded-md border border-black/20 dark:border-white/30 px-3 py-2" onClick={() => onUseTemplate('5day')}>
                <div className="text-sm font-medium text-black dark:text-white">5-Day</div>
                <div className="text-xs text-black/60 dark:text-white/60">Back, Chest, Biceps, Shoulder, Legs</div>
              </button>
              <button className="w-full text-left rounded-md border border-black/20 dark:border-white/30 px-3 py-2" onClick={() => onUseTemplate('arnold')}>
                <div className="text-sm font-medium text-black dark:text-white">Arnold Split</div>
                <div className="text-xs text-black/60 dark:text-white/60">Famous bodybuilding split variation</div>
              </button>
            </div>
            <button className="mt-2 w-full py-2 rounded-md border border-black/20 dark:border-white/30" onClick={onCloseTemplateModal}>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}
