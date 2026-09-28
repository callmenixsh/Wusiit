import React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'

type TemplateId = 'ppl' | '5day' | 'arnold'

type SettingsProps = {
  workoutMinutes: number | null
  onWorkoutMinutesChange: (value: string) => void
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
}

export default function Settings({
  workoutMinutes,
  onWorkoutMinutesChange,
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
          <div className="text-[11px] uppercase tracking-wider text-black/60 dark:text-white/60">Workout Settings</div>
          <label htmlFor="workout-minutes" className="block text-xs mt-3 text-black/70 dark:text-white/70">Workout Duration (Minutes)</label>
          <input
            id="workout-minutes"
            type="number"
            min={1}
            max={720}
            step={1}
            value={workoutMinutes === null ? '' : workoutMinutes}
            onChange={(e) => onWorkoutMinutesChange(e.target.value)}
            className="mt-2 w-full rounded-lg border border-black/20 dark:border-white/30 bg-white dark:bg-black px-3 py-2.5 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black/15 dark:focus:ring-white/25"
          />
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
