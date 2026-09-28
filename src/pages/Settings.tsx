import React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { ReminderSettings } from '../lib/storage'
import { NotificationStatus } from '../lib/notifications'

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
  reminders: ReminderSettings
  onRemindersChange: (settings:ReminderSettings) => void
  notificationPermission: NotificationStatus
  onEnableNotifications: () => void | Promise<void>
  isInstalled: boolean
  canInstall: boolean
  onInstall: () => void | Promise<void>
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
  reminders,
  onRemindersChange,
  notificationPermission,
  onEnableNotifications,
  isInstalled,
  canInstall,
  onInstall,
}: SettingsProps) {
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const update=(next:Partial<ReminderSettings>)=>onRemindersChange({...reminders,...next,enabled:true})
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

        <div className="rounded-xl border border-black/15 p-4 dark:border-white/25 bg-black/[0.015] dark:bg-white/[0.02]">
          <div className="text-[11px] uppercase tracking-wider text-black/60 dark:text-white/60">App & offline</div>
          <div className="mt-1 text-xs text-black/55 dark:text-white/55">Installed workouts and data remain available without a connection.</div>
          {isInstalled?<div className="mt-3 rounded-lg border border-black/15 px-3 py-2.5 text-sm dark:border-white/20">Installed on this device</div>:canInstall?<button className="mt-3 w-full rounded-lg bg-black py-2.5 text-white dark:bg-white dark:text-black" onClick={onInstall}>Install Wuwiit</button>:<div className="mt-3 rounded-lg border border-black/15 px-3 py-2.5 text-xs dark:border-white/20">On iPhone or iPad, use Share → Add to Home Screen. In other browsers, use the install option in the address bar or menu.</div>}
        </div>

        <div className="rounded-xl border border-black/15 p-4 dark:border-white/25 bg-black/[0.015] dark:bg-white/[0.02]">
          <div className="text-[11px] uppercase tracking-wider text-black/60 dark:text-white/60">Notifications</div>
          {notificationPermission!=='granted'?<><div className="mt-1 text-xs text-black/55 dark:text-white/55">Allow notifications for timer completion and reminders while Wuwiit is in the background.</div><button disabled={notificationPermission==='denied'||notificationPermission==='unsupported'} className="mt-3 w-full rounded-lg bg-black py-2.5 text-white disabled:opacity-40 dark:bg-white dark:text-black" onClick={onEnableNotifications}>{notificationPermission==='denied'?'Blocked in browser settings':notificationPermission==='unsupported'?'Not supported on this device':'Enable notifications'}</button></>:<>
            <label className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-black/15 px-3 py-2.5 dark:border-white/20"><span className="text-sm font-medium">Rest timer complete</span><input type="checkbox" checked={reminders.restTimer} onChange={event=>update({restTimer:event.target.checked})}/></label>
            <div className="mt-2 rounded-lg border border-black/15 p-3 dark:border-white/20">
              <label className="flex items-center justify-between"><span className="text-sm font-medium">Workout reminders</span><input type="checkbox" checked={reminders.workout.enabled} onChange={event=>update({workout:{...reminders.workout,enabled:event.target.checked}})}/></label>
              {reminders.workout.enabled&&<><div className="mt-3 flex flex-wrap gap-1">{days.map((day,index)=><button type="button" key={day} onClick={()=>update({workout:{...reminders.workout,weekdays:reminders.workout.weekdays.includes(index)?reminders.workout.weekdays.filter(value=>value!==index):[...reminders.workout.weekdays,index].sort()}})} className={`rounded-full border px-2.5 py-1 text-xs ${reminders.workout.weekdays.includes(index)?'bg-black text-white dark:bg-white dark:text-black':'border-black/20 dark:border-white/25'}`}>{day}</button>)}</div><input aria-label="Workout reminder time" type="time" value={reminders.workout.time} onChange={event=>update({workout:{...reminders.workout,time:event.target.value}})} className="mt-3 w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/30 dark:bg-black"/></>}
            </div>
            <div className="mt-2 rounded-lg border border-black/15 p-3 dark:border-white/20">
              <label className="flex items-center justify-between"><span className="text-sm font-medium">Weekly weigh-in</span><input type="checkbox" checked={reminders.weighIn.enabled} onChange={event=>update({weighIn:{...reminders.weighIn,enabled:event.target.checked}})}/></label>
              {reminders.weighIn.enabled&&<div className="mt-3 grid grid-cols-2 gap-2"><select aria-label="Weigh-in reminder day" value={reminders.weighIn.weekday} onChange={event=>update({weighIn:{...reminders.weighIn,weekday:Number(event.target.value)}})} className="rounded-lg border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/30 dark:bg-black">{days.map((day,index)=><option key={day} value={index}>{day}</option>)}</select><input aria-label="Weigh-in reminder time" type="time" value={reminders.weighIn.time} onChange={event=>update({weighIn:{...reminders.weighIn,time:event.target.value}})} className="rounded-lg border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/30 dark:bg-black"/></div>}
            </div>
          </>}
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
