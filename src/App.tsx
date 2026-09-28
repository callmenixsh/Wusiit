import React, { useEffect, useState } from 'react'
import { Dumbbell, History as HistoryIcon, ListTree, Settings as SettingsIcon } from 'lucide-react'
import Home from './pages/Home'
import QueueEditor from './pages/QueueEditor'
import History from './pages/History'
import Settings from './pages/Settings'
import { loadState, saveState, exportJSON, importJSON, AppState } from './lib/storage'
import { addHistoryForCurrentDay, advanceToNextDay, setSplit } from './lib/queue'
import { localDateString } from './lib/dates'

const THEME_KEY = 'wusiit.theme'
const WORKOUT_TIMER_END_KEY = 'wusiit.workout.timerEnd'
const WORKOUT_MINUTES_KEY = 'wusiit.workout.minutes'
const LEGACY_WORKOUT_HOURS_KEY = 'wusiit.workout.hours'
const LAST_WORKOUT_DATE_KEY = 'wusiit.lastWorkoutDate'

type ThemePref = 'system'|'light'|'dark'

export default function App(){
  const [state, setState] = useState<AppState>(()=>loadState())
  const [view, setView] = useState<'home'|'edit'|'history'|'settings'>('home')
  const [workoutTimerEnd, setWorkoutTimerEnd] = useState<number>(()=>{
    const raw = localStorage.getItem(WORKOUT_TIMER_END_KEY)
    return raw ? Number(raw) || 0 : 0
  })
  const [workoutMinutes, setWorkoutMinutes] = useState<number | null>(()=>{
    const minuteRaw = localStorage.getItem(WORKOUT_MINUTES_KEY)
    const hourRaw = localStorage.getItem(LEGACY_WORKOUT_HOURS_KEY)
    if(minuteRaw){
      const parsed = Number(minuteRaw)
      if(Number.isFinite(parsed) && parsed > 0) return parsed
    }
    if(hourRaw){
      const parsedHours = Number(hourRaw)
      if(Number.isFinite(parsedHours) && parsedHours > 0) return Math.round(parsedHours * 60)
    }
    return 60
  })
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string>(()=>localStorage.getItem(LAST_WORKOUT_DATE_KEY) || '')
  const [nowTs, setNowTs] = useState<number>(()=>Date.now())
  const [themePref, setThemePref] = useState<ThemePref>(()=>{
    const t = localStorage.getItem(THEME_KEY)
    return (t === 'light' || t === 'dark') ? t : 'system'
  })
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const [templateDraftItems, setTemplateDraftItems] = useState<{name:string,description?:string}[] | null>(null)
  const [templateDraftToken, setTemplateDraftToken] = useState(0)

  // apply effective theme
  useEffect(()=>{
    function apply(pref: ThemePref){
      const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      const effectiveDark = pref === 'system' ? systemDark : pref === 'dark'
      if(effectiveDark) document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
    apply(themePref)

    // listen for system changes when following system
    const mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)')
    function onChange(){ if(themePref === 'system') apply('system') }
    mql && mql.addEventListener && mql.addEventListener('change', onChange)
    return ()=> mql && mql.removeEventListener && mql.removeEventListener('change', onChange)
  },[themePref])

  useEffect(()=>{
    saveState(state)
  },[state])

  useEffect(()=>{
    localStorage.setItem(WORKOUT_TIMER_END_KEY, String(workoutTimerEnd))
  }, [workoutTimerEnd])

  useEffect(()=>{
    if(workoutMinutes === null) localStorage.removeItem(WORKOUT_MINUTES_KEY)
    else localStorage.setItem(WORKOUT_MINUTES_KEY, String(workoutMinutes))
  }, [workoutMinutes])

  useEffect(()=>{
    if(lastWorkoutDate) localStorage.setItem(LAST_WORKOUT_DATE_KEY, lastWorkoutDate)
    else localStorage.removeItem(LAST_WORKOUT_DATE_KEY)
  }, [lastWorkoutDate])

  useEffect(()=>{
    const id = window.setInterval(()=>setNowTs(Date.now()), 30000)
    return ()=>window.clearInterval(id)
  },[])

  function handleStartWorkout(){
    if(workoutTimerEnd > 0) return
    const today = localDateString()
    const minutes = workoutMinutes ?? 60
    setState(prev => {
      const next = { ...prev }
      addHistoryForCurrentDay(next)
      return next
    })
    setLastWorkoutDate(today)
    setWorkoutTimerEnd(Date.now() + minutes * 60 * 1000)
  }

  function handleSwitchToNextDay(){
    if(!(workoutTimerEnd > 0 && nowTs >= workoutTimerEnd)) return
    setState(prev => {
      const next = { ...prev }
      advanceToNextDay(next)
      return next
    })
    setWorkoutTimerEnd(0)
  }

  function handleDoTomorrow(){
    if(state.split.length < 2) return
    setState(prev => {
      const split = [...prev.split]
      const first = split.shift()
      if(first) split.push(first)
      return { ...prev, split }
    })
  }

  function handleEndWorkout(){
    if(!(workoutTimerEnd > 0)) return
    if(!confirm('End workout and reset the timer? Today\'s session stays in history.')) return
    setWorkoutTimerEnd(0)
  }

  const isWorkoutInProgress = workoutTimerEnd > 0 && nowTs < workoutTimerEnd
  const isReadyForNextDay = workoutTimerEnd > 0 && nowTs >= workoutTimerEnd
  const minutesRemaining = Math.max(0, Math.ceil((workoutTimerEnd - nowTs) / (60 * 1000)))
  const homeActionState: 'idle'|'in-progress'|'ready-next-day' = isWorkoutInProgress
    ? 'in-progress'
    : isReadyForNextDay
      ? 'ready-next-day'
      : 'idle'
  const homeActionLabel = isReadyForNextDay
    ? 'Switch to next day'
    : `Workout in progress (${minutesRemaining}m left)`

  function handleWorkoutMinutesChange(value: string){
    const trimmed = value.trim()
    if(trimmed === ''){
      setWorkoutMinutes(null)
      return
    }
    const parsed = Number(trimmed)
    if(!Number.isFinite(parsed) || parsed < 1) return
    setWorkoutMinutes(Math.min(720, Math.round(parsed)))
  }

  function handleSaveSplit(items: {name:string,description?:string}[]){
    const next = {...state}
    setSplit(next, items)
    setState(next)
  }

  function handleUseTemplate(templateId: 'ppl'|'5day'|'arnold'){
    let preset: {name:string,description?:string}[]
    if(templateId === 'ppl'){
      preset = [
        {name:'Push', description:'Bench press\nIncline dumbbell press\nShoulder press\nLateral raises\nTriceps pushdown'},
        {name:'Pull', description:'Pull-ups\nLat pulldown\nBarbell row\nFace pull\nBicep curls'},
        {name:'Legs', description:'Squats\nRomanian deadlift\nLeg press\nLeg curls\nCalf raises'}
      ]
    } else if(templateId === 'arnold'){
      preset = [
        {name:'Chest + Back', description:'Bench press\nIncline press\nPull-ups\nRows\nPulldowns'},
        {name:'Shoulders + Arms', description:'Overhead press\nLateral raises\nCurls\nSkull crushers\nHammer curls'},
        {name:'Legs', description:'Squats\nLunges\nLeg press\nHamstring curls\nCalves'}
      ]
    } else {
      preset = [
        {name:'Back', description:'Lat machine top\nLat machine bottom\nRowing\nOne-arm rowing'},
        {name:'Chest', description:'Bench flat\nBench incline\nBench decline\nFlys\nPushups'},
        {name:'Biceps', description:'Curls\nHammer\nBarbell\nPreacher'},
        {name:'Shoulder', description:'Press\nLateral\nFront\nShrugs'},
        {name:'Legs', description:'Squats\nLunges\nExtensions\nPress\nCalves'}
      ]
    }
    setTemplateDraftItems(preset)
    setTemplateDraftToken((prev) => prev + 1)
    setView('edit')
    setIsTemplateModalOpen(false)
  }

  function handleExport(){
    const data = exportJSON(state)
    const blob = new Blob([data], {type:'application/json'})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'wusiit-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleExportClipboard(){
    const data = exportJSON(state)
    try{
      await navigator.clipboard.writeText(data)
      alert('Exported JSON to clipboard')
    }catch(e){
      // fallback
      const ta = document.createElement('textarea')
      ta.value = data
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
      alert('Copied to clipboard (fallback)')
    }
  }

  function handleImport(){
    const txt = prompt('Paste exported JSON to import')
    if(!txt) return
    const parsed = importJSON(txt)
    if(!parsed) return alert('Invalid JSON')
    const hasExistingData = state.history.length > 0 || state.split.some((s) => (s.name || '').trim())
    if(hasExistingData && !confirm('Importing will replace all current data. Continue?')) return
    setState(parsed)
  }

  function handleReset(){
    if(!confirm('Reset all data?')) return
    localStorage.removeItem('wdiit.state.v1')
    localStorage.removeItem(WORKOUT_TIMER_END_KEY)
    localStorage.removeItem(LAST_WORKOUT_DATE_KEY)
    setState(loadState())
    setWorkoutTimerEnd(0)
    setLastWorkoutDate('')
  }

  function handleResetHistory(){
    if(!confirm('Reset history only?')) return
    setState(prev => ({...prev, history: []}))
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col p-4">
        <header className="mb-4 flex items-center justify-between">
          <button className="text-left" onClick={()=>setView('home')} aria-label="Go to home">
            <h1 className="text-xl font-medium text-black dark:text-white brand-logo">Wusiit</h1>
            <div className="text-[10px] uppercase text-black/60 dark:text-white/60">What split is it today?</div>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              className={`p-2 rounded-md border ${view==='edit' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-black/20 dark:border-white/30 bg-white dark:bg-black text-black dark:text-white'}`}
              onClick={()=>setView('edit')}
              aria-label="Split"
              title="Split"
            >
              <ListTree size={18} strokeWidth={1.8} />
            </button>
            <button
              className={`p-2 rounded-md border ${view==='history' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-black/20 dark:border-white/30 bg-white dark:bg-black text-black dark:text-white'}`}
              onClick={()=>setView('history')}
              aria-label="History"
              title="History"
            >
              <HistoryIcon size={18} strokeWidth={1.8} />
            </button>
            <button
              className={`p-2 rounded-md border ${view==='settings' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-black/20 dark:border-white/30 bg-white dark:bg-black text-black dark:text-white'}`}
              onClick={()=>setView('settings')}
              aria-label="Settings"
              title="Settings"
            >
              <SettingsIcon size={18} strokeWidth={1.8} />
            </button>
          </div>
        </header>

        <main className="flex-1">
          {view==='home' && (
            <Home
              state={state}
              onStartWorkout={handleStartWorkout}
              onDoTomorrow={handleDoTomorrow}
              onSwitchToNextDay={handleSwitchToNextDay}
              onEndWorkout={handleEndWorkout}
              actionState={homeActionState}
              actionLabel={homeActionLabel}
              lastWorkoutDate={lastWorkoutDate}
            />
          )}
          {view==='edit' && (
            <QueueEditor
              state={state}
              onSave={handleSaveSplit}
              templateDraftItems={templateDraftItems}
              templateDraftToken={templateDraftToken}
              onTemplateDraftApplied={()=>setTemplateDraftItems(null)}
            />
          )}
          {view==='history' && <History state={state} lastWorkoutDate={lastWorkoutDate} />}

          {view==='settings' && (
            <Settings
              workoutMinutes={workoutMinutes}
              onWorkoutMinutesChange={handleWorkoutMinutesChange}
              onOpenTemplates={()=>setIsTemplateModalOpen(true)}
              onExportClipboard={handleExportClipboard}
              onImport={handleImport}
              onResetHistory={handleResetHistory}
              onReset={handleReset}
              isTemplateModalOpen={isTemplateModalOpen}
              onCloseTemplateModal={()=>setIsTemplateModalOpen(false)}
              onUseTemplate={handleUseTemplate}
              themePref={themePref}
              onCycleTheme={()=>{
                const next = themePref === 'system' ? 'dark' : themePref === 'dark' ? 'light' : 'system'
                setThemePref(next as ThemePref)
                if(next === 'system') localStorage.removeItem(THEME_KEY)
                else localStorage.setItem(THEME_KEY, next)
              }}
            />
          )}
        </main>

        <footer className="mt-6 text-xs text-black/60 dark:text-white/60 flex items-center justify-center gap-1.5">
          <span>made with</span>
          <Dumbbell size={14} className='text-red-900' />
          <span>by</span>
          <a
            href="https://github.com/callmenixsh"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            callmenixsh
          </a>
        </footer>

      </div>
    </div>
  )
}