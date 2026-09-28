import React, { useEffect, useState } from 'react'
import { Dumbbell, History as HistoryIcon, ListTree, Settings as SettingsIcon } from 'lucide-react'
import Home from './pages/Home'
import QueueEditor from './pages/QueueEditor'
import History from './pages/History'
import Settings from './pages/Settings'
import { loadState, saveState, exportJSON, importJSON, AppState, WorkoutRating } from './lib/storage'
import { addHistoryForCurrentDay, advanceToNextDay } from './lib/queue'
import { localDateString } from './lib/dates'

const THEME_KEY = 'wusiit.theme'
const WORKOUT_TIMER_END_KEY = 'wusiit.workout.timerEnd'
const WORKOUT_START_KEY = 'wusiit.workout.startedAt'
const WORKOUT_PAUSED_AT_KEY = 'wusiit.workout.pausedAt'
const WORKOUT_PAUSED_TOTAL_KEY = 'wusiit.workout.pausedTotal'
const LAST_WORKOUT_DATE_KEY = 'wusiit.lastWorkoutDate'
const COMPLETED_EXERCISES_KEY = 'wusiit.workout.completed'
const ACTIVE_EXERCISE_KEY = 'wusiit.workout.activeExercise'
const EXERCISE_TIMER_END_KEY = 'wusiit.workout.exerciseTimerEnd'
const ADVANCED_HISTORY_ENTRY_KEY = 'wusiit.workout.advancedHistoryEntry'
const WORKOUT_FEEDBACK_KEY = 'wusiit.workout.feedback'

type PendingRest = { exerciseId:string; set:number; durationSeconds:number }
type FeedbackCounts = { hard:number; right:number; easy:number }

type ThemePref = 'system'|'light'|'dark'

export default function App(){
  const [state, setState] = useState<AppState>(()=>loadState())
  const [view, setView] = useState<'home'|'edit'|'history'|'settings'>('home')
  const [workoutStartedAt, setWorkoutStartedAt] = useState<number>(()=>Number(localStorage.getItem(WORKOUT_START_KEY))||0)
  const [workoutPausedAt, setWorkoutPausedAt] = useState<number>(()=>Number(localStorage.getItem(WORKOUT_PAUSED_AT_KEY))||0)
  const [workoutPausedTotal, setWorkoutPausedTotal] = useState<number>(()=>Number(localStorage.getItem(WORKOUT_PAUSED_TOTAL_KEY))||0)
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string>(()=>localStorage.getItem(LAST_WORKOUT_DATE_KEY) || '')
  const [nowTs, setNowTs] = useState<number>(()=>Date.now())
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>(()=>{
    try{return JSON.parse(localStorage.getItem(COMPLETED_EXERCISES_KEY)||'[]')}catch{return[]}
  })
  const [activeExerciseId, setActiveExerciseId] = useState(()=>localStorage.getItem(ACTIVE_EXERCISE_KEY)||'')
  const [exerciseTimerEnd, setExerciseTimerEnd] = useState(()=>Number(localStorage.getItem(EXERCISE_TIMER_END_KEY))||0)
  const [ratingExerciseId, setRatingExerciseId] = useState<string|null>(null)
  const [showNextWorkoutToday, setShowNextWorkoutToday] = useState(false)
  const [feedbackCounts,setFeedbackCounts]=useState<FeedbackCounts>(()=>{
    try{const value=JSON.parse(localStorage.getItem(WORKOUT_FEEDBACK_KEY)||'{}');return {hard:Number(value.hard)||0,right:Number(value.right)||0,easy:Number(value.easy)||0}}catch{return {hard:0,right:0,easy:0}}
  })
  const [activeSet, setActiveSet] = useState(1)
  const [restTimerEnd, setRestTimerEnd] = useState(0)
  const [pendingRest, setPendingRest] = useState<PendingRest|null>(null)
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
    const latest=state.history[0]
    if(!latest?.id || latest.date>=localDateString())return
    if(localStorage.getItem(ADVANCED_HISTORY_ENTRY_KEY)===latest.id)return
    localStorage.setItem(ADVANCED_HISTORY_ENTRY_KEY,latest.id)
    setState(prev=>{const next:AppState=JSON.parse(JSON.stringify(prev));advanceToNextDay(next);return next})
  },[state.history,nowTs])

  useEffect(()=>{workoutStartedAt?localStorage.setItem(WORKOUT_START_KEY,String(workoutStartedAt)):localStorage.removeItem(WORKOUT_START_KEY)},[workoutStartedAt])
  useEffect(()=>{workoutPausedAt?localStorage.setItem(WORKOUT_PAUSED_AT_KEY,String(workoutPausedAt)):localStorage.removeItem(WORKOUT_PAUSED_AT_KEY)},[workoutPausedAt])
  useEffect(()=>localStorage.setItem(WORKOUT_PAUSED_TOTAL_KEY,String(workoutPausedTotal)),[workoutPausedTotal])


  useEffect(()=>{
    if(lastWorkoutDate) localStorage.setItem(LAST_WORKOUT_DATE_KEY, lastWorkoutDate)
    else localStorage.removeItem(LAST_WORKOUT_DATE_KEY)
  }, [lastWorkoutDate])

  useEffect(()=>{
    const id = window.setInterval(()=>setNowTs(Date.now()), 1000)
    return ()=>window.clearInterval(id)
  },[])

  useEffect(()=>localStorage.setItem(COMPLETED_EXERCISES_KEY,JSON.stringify(completedExerciseIds)),[completedExerciseIds])
  useEffect(()=>{activeExerciseId?localStorage.setItem(ACTIVE_EXERCISE_KEY,activeExerciseId):localStorage.removeItem(ACTIVE_EXERCISE_KEY)},[activeExerciseId])
  useEffect(()=>localStorage.setItem(EXERCISE_TIMER_END_KEY,String(exerciseTimerEnd)),[exerciseTimerEnd])
  useEffect(()=>localStorage.setItem(WORKOUT_FEEDBACK_KEY,JSON.stringify(feedbackCounts)),[feedbackCounts])

  function currentExerciseIds(source=state){
    const day=source.days[0]
    return [...new Set(day?.exerciseIds||[])]
  }

  function startExercise(id:string){
    const exercise=state.exercises.find(ex=>ex.id===id)
    setActiveExerciseId(id)
    setActiveSet(1)
    setExerciseTimerEnd(exercise?.tracking==='timed'?Date.now()+(exercise.durationSeconds||30)*1000:0)
  }

  function handleCompleteExercise(id:string){
    setRatingExerciseId(id)
  }

  function handleStartWorkout(){
    if(workoutStartedAt > 0) return
    setCompletedExerciseIds([])
    setWorkoutStartedAt(Date.now())
    setWorkoutPausedAt(0)
    setWorkoutPausedTotal(0)
    setFeedbackCounts({hard:0,right:0,easy:0})
    const first=currentExerciseIds()[0]
    if(first)startExercise(first)
  }

  function handleFinishWorkout(){
    if(workoutStartedAt <= 0) return
    const finishedAt=workoutPausedAt||Date.now()
    const durationSeconds=Math.max(0,Math.floor((finishedAt-workoutStartedAt-workoutPausedTotal)/1000))
    const feedbackTotal=feedbackCounts.hard+feedbackCounts.right+feedbackCounts.easy
    const feedbackAverage=feedbackTotal?(feedbackCounts.easy-feedbackCounts.hard)/feedbackTotal:0
    const rating:WorkoutRating=feedbackAverage<=-0.35?'challenging':feedbackAverage>=0.35?'easy':'balanced'
    setState(prev=>{const next:AppState=JSON.parse(JSON.stringify(prev));addHistoryForCurrentDay(next,{durationSeconds,rating});return next})
    setLastWorkoutDate(localDateString())
    setShowNextWorkoutToday(false)
    setFeedbackCounts({hard:0,right:0,easy:0})
    setWorkoutStartedAt(0);setWorkoutPausedAt(0);setWorkoutPausedTotal(0);setExerciseTimerEnd(0);setRestTimerEnd(0);setPendingRest(null);setActiveExerciseId('');setCompletedExerciseIds([]);setRatingExerciseId(null)
  }

  function handleDoTomorrow(){
    if(state.days.length < 2) return
    setState(prev => {
      const days = [...prev.days]
      const first = days.shift()
      if(first) days.push(first)
      return { ...prev, days }
    })
  }

  function handleStartNextWorkoutToday(){
    const nextDay=state.days[1]
    if(!nextDay)return
    if(state.history[0]?.id)localStorage.setItem(ADVANCED_HISTORY_ENTRY_KEY,state.history[0].id)
    setShowNextWorkoutToday(true)
    setState(prev=>{const next:AppState=JSON.parse(JSON.stringify(prev));advanceToNextDay(next);return next})
    if(nextDay.isRestDay)return
    setCompletedExerciseIds([])
    setWorkoutStartedAt(Date.now())
    setWorkoutPausedAt(0)
    setWorkoutPausedTotal(0)
    setFeedbackCounts({hard:0,right:0,easy:0})
    const first=[...new Set(nextDay.exerciseIds)][0]
    if(first){
      const exercise=state.exercises.find(ex=>ex.id===first)
      setActiveExerciseId(first)
      setActiveSet(1)
      setExerciseTimerEnd(exercise?.tracking==='timed'?Date.now()+(exercise.durationSeconds||30)*1000:0)
    }
  }

  function handleEndWorkout(){
    if(!(workoutStartedAt > 0)) return
    if(!confirm('Cancel this workout? It will not be added to history.')) return
    setWorkoutStartedAt(0)
    setWorkoutPausedAt(0)
    setWorkoutPausedTotal(0)
    setExerciseTimerEnd(0)
    setRestTimerEnd(0)
    setPendingRest(null)
    setActiveExerciseId('')
    setCompletedExerciseIds([])
    setRatingExerciseId(null)
    setFeedbackCounts({hard:0,right:0,easy:0})
  }

  function handleToggleWorkoutPause(){
    if(!workoutStartedAt)return
    if(workoutPausedAt){
      const pausedFor=Date.now()-workoutPausedAt
      setWorkoutPausedTotal(value=>value+pausedFor)
      if(exerciseTimerEnd)setExerciseTimerEnd(value=>value+pausedFor)
      if(restTimerEnd)setRestTimerEnd(value=>value+pausedFor)
      setWorkoutPausedAt(0)
    }else setWorkoutPausedAt(Date.now())
  }

  const isWorkoutActive = workoutStartedAt > 0
  const isWorkoutPaused = workoutPausedAt > 0
  const timerNow=workoutPausedAt||Date.now()
  const elapsedWorkoutSeconds = workoutStartedAt?Math.max(0,Math.floor((timerNow-workoutStartedAt-workoutPausedTotal)/1000)):0
  const exerciseSecondsRemaining = Math.max(0,Math.ceil((exerciseTimerEnd-timerNow)/1000))
  const restSecondsRemaining = Math.max(0,Math.ceil((restTimerEnd-timerNow)/1000))

  function finishRest(){
    if(!pendingRest)return
    const next=pendingRest
    setPendingRest(null)
    setRestTimerEnd(0)
    setActiveExerciseId(next.exerciseId)
    setActiveSet(next.set)
    setExerciseTimerEnd(next.durationSeconds?Date.now()+next.durationSeconds*1000:0)
  }

  function extendRest(){if(restTimerEnd)setRestTimerEnd(value=>value+30000)}

  function notifyRestComplete(){
    if(state.restTimerVibration&&navigator.vibrate)navigator.vibrate([180,80,180])
    if(state.restTimerSound)try{const AudioContextClass=window.AudioContext||(window as typeof window&{webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(AudioContextClass){const context=new AudioContextClass(),oscillator=context.createOscillator(),gain=context.createGain();oscillator.connect(gain);gain.connect(context.destination);oscillator.frequency.value=880;gain.gain.value=.08;oscillator.start();oscillator.stop(context.currentTime+.18)}}catch{}
  }

  useEffect(()=>{
    if(pendingRest&&restTimerEnd>0&&!workoutPausedAt&&nowTs>=restTimerEnd){notifyRestComplete();finishRest()}
  },[nowTs,restTimerEnd,workoutPausedAt,pendingRest])

  function shiftReps(reps:string|undefined,delta:number){
    if(!reps)return reps
    return reps.replace(/\d+/g,value=>String(Math.max(1,Number(value)+delta)))
  }

  function handleExerciseRating(rating:'hard'|'right'|'easy'){
    if(!ratingExerciseId)return
    const finishedId=ratingExerciseId
    const exercise=state.exercises.find(ex=>ex.id===finishedId)
    setFeedbackCounts(counts=>({...counts,[rating]:counts[rating]+1}))
    if(rating!=='right')setState(prev=>({...prev,exercises:prev.exercises.map(ex=>ex.id===finishedId?(ex.tracking==='timed'?{...ex,durationSeconds:Math.max(5,(ex.durationSeconds||30)+(rating==='easy'?5:-5))}:{...ex,reps:shiftReps(ex.reps,rating==='easy'?2:-2)}):ex)}))
    setRatingExerciseId(null)
    if(exercise&&activeSet<(exercise.sets||1)){
      const duration=exercise.tracking==='timed'?Math.max(5,(exercise.durationSeconds||30)+(rating==='easy'?5:rating==='hard'?-5:0)):0
      setExerciseTimerEnd(0)
      if(state.restSeconds===0){setActiveExerciseId(finishedId);setActiveSet(activeSet+1);setExerciseTimerEnd(duration?Date.now()+duration*1000:0);return}
      setPendingRest({exerciseId:finishedId,set:activeSet+1,durationSeconds:duration})
      setRestTimerEnd(Date.now()+state.restSeconds*1000)
      return
    }
    const completed=[...new Set([...completedExerciseIds,finishedId])]
    setCompletedExerciseIds(completed)
    const next=currentExerciseIds().find(id=>!completed.includes(id))
    if(next){
      const nextExercise=state.exercises.find(ex=>ex.id===next)
      setExerciseTimerEnd(0)
      if(state.restSeconds===0){setActiveExerciseId(next);setActiveSet(1);setExerciseTimerEnd(nextExercise?.tracking==='timed'?Date.now()+(nextExercise.durationSeconds||30)*1000:0);return}
      setPendingRest({exerciseId:next,set:1,durationSeconds:nextExercise?.tracking==='timed'?(nextExercise.durationSeconds||30):0})
      setRestTimerEnd(Date.now()+state.restSeconds*1000)
    }else{setActiveExerciseId('');setExerciseTimerEnd(0)}
  }

  function handleSaveProgram(next: AppState){
    setState(next)
  }

  function handleUseTemplate(templateId: 'ppl'|'5day'|'arnold'|'home'){
    let preset: {name:string,description?:string}[]
    if(templateId === 'home'){
      preset = [
        {name:'Full Body',description:'Bodyweight squat\nPush-up\nGlute bridge\nSuperman'},
        {name:'Core + Conditioning',description:'Mountain climbers\nForearm plank\nDead bug\nJumping jacks'},
        {name:'Recovery',description:'__REST__'},
        {name:'Lower Body + Stability',description:'Reverse lunge\nSingle-leg glute bridge\nCalf raise\nWall sit'},
        {name:'Full Body',description:'Bodyweight squat\nPush-up\nGlute bridge\nSuperman'},
        {name:'Mobility + Rest',description:'__REST__'},
        {name:'Rest day',description:'__REST__'}
      ]
    } else if(templateId === 'ppl'){
      preset = [
        {name:'Push', description:'Bench press\nIncline dumbbell press\nShoulder press\nLateral raises\nTriceps pushdown'},
        {name:'Pull', description:'Pull-ups\nLat pulldown\nBarbell row\nFace pull\nBicep curls'},
        {name:'Legs', description:'Squats\nRomanian deadlift\nLeg press\nLeg curls\nCalf raises'},
        {name:'Rest day',description:'__REST__'},
        {name:'Push', description:'Bench press\nIncline dumbbell press\nShoulder press\nLateral raises\nTriceps pushdown'},
        {name:'Pull', description:'Pull-ups\nLat pulldown\nBarbell row\nFace pull\nBicep curls'},
        {name:'Rest day',description:'__REST__'}
      ]
    } else if(templateId === 'arnold'){
      preset = [
        {name:'Chest + Back', description:'Bench press\nIncline press\nPull-ups\nRows\nPulldowns'},
        {name:'Shoulders + Arms', description:'Overhead press\nLateral raises\nCurls\nSkull crushers\nHammer curls'},
        {name:'Legs', description:'Squats\nLunges\nLeg press\nHamstring curls\nCalves'},
        {name:'Rest day',description:'__REST__'},
        {name:'Chest + Back', description:'Bench press\nIncline press\nPull-ups\nRows\nPulldowns'},
        {name:'Shoulders + Arms', description:'Overhead press\nLateral raises\nCurls\nSkull crushers\nHammer curls'},
        {name:'Rest day',description:'__REST__'}
      ]
    } else {
      preset = [
        {name:'Back', description:'Lat machine top\nLat machine bottom\nRowing\nOne-arm rowing'},
        {name:'Chest', description:'Bench flat\nBench incline\nBench decline\nFlys\nPushups'},
        {name:'Biceps', description:'Curls\nHammer\nBarbell\nPreacher'},
        {name:'Shoulder', description:'Press\nLateral\nFront\nShrugs'},
        {name:'Legs', description:'Squats\nLunges\nExtensions\nPress\nCalves'},
        {name:'Rest day',description:'__REST__'},
        {name:'Rest day',description:'__REST__'}
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
    a.download = 'wuwiit-backup.json'
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
    const hasExistingData = state.history.length > 0 || state.days.length > 0
    if(hasExistingData && !confirm('Importing will replace all current data. Continue?')) return
    setState(parsed)
  }

  function handleReset(){
    if(!confirm('Reset all data?')) return
    localStorage.removeItem('wdiit.state.v1')
    localStorage.removeItem('wdiit.state.v2')
    localStorage.removeItem(WORKOUT_TIMER_END_KEY)
    localStorage.removeItem(WORKOUT_START_KEY)
    localStorage.removeItem(WORKOUT_PAUSED_AT_KEY)
    localStorage.removeItem(WORKOUT_PAUSED_TOTAL_KEY)
    localStorage.removeItem(LAST_WORKOUT_DATE_KEY)
    localStorage.removeItem(COMPLETED_EXERCISES_KEY)
    localStorage.removeItem(ACTIVE_EXERCISE_KEY)
    localStorage.removeItem(EXERCISE_TIMER_END_KEY)
    localStorage.removeItem(ADVANCED_HISTORY_ENTRY_KEY)
    localStorage.removeItem(WORKOUT_FEEDBACK_KEY)
    setState(loadState())
    setWorkoutStartedAt(0)
    setWorkoutPausedAt(0)
    setWorkoutPausedTotal(0)
    setCompletedExerciseIds([])
    setActiveExerciseId('')
    setExerciseTimerEnd(0)
    setLastWorkoutDate('')
  }

  function handleResetHistory(){
    if(!confirm('Reset history only?')) return
    setState(prev => ({...prev, history: []}))
  }

  function handleLogWeight(weight:number,date=localDateString()){
    setState(prev=>({...prev,weightTracking:{...prev.weightTracking,entries:[
      {id:`weight-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`,date,weight:Math.round(weight*10)/10},
      ...prev.weightTracking.entries.filter(entry=>entry.date!==date)
    ].sort((a,b)=>b.date.localeCompare(a.date))}}))
  }

  function handleDeleteWeight(id:string){
    setState(prev=>({...prev,weightTracking:{...prev.weightTracking,entries:prev.weightTracking.entries.filter(entry=>entry.id!==id)}}))
  }

  function handleDeleteWorkout(id:string){
    setState(prev=>({...prev,history:prev.history.filter(entry=>entry.id!==id)}))
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col p-4">
        <header className="mb-4 flex items-center justify-between">
          <button className="text-left" onClick={()=>setView('home')} aria-label="Go to home">
            <h1 className="text-xl font-medium text-black dark:text-white brand-logo">Wuwiit</h1>
            <div className="text-[10px] uppercase text-black/60 dark:text-white/60">What workout is it today?</div>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              className={`p-2 rounded-md border ${view==='edit' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-black/20 dark:border-white/30 bg-white dark:bg-black text-black dark:text-white'}`}
              onClick={()=>setView('edit')}
              aria-label="Program"
              title="Program"
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
              onFinishWorkout={handleFinishWorkout}
              onEndWorkout={handleEndWorkout}
              isWorkoutActive={isWorkoutActive}
              elapsedWorkoutSeconds={elapsedWorkoutSeconds}
              isWorkoutPaused={isWorkoutPaused}
              onToggleWorkoutPause={handleToggleWorkoutPause}
              exerciseSecondsRemaining={exerciseSecondsRemaining}
              restSecondsRemaining={restSecondsRemaining}
              isResting={Boolean(pendingRest)}
              restNextExerciseId={pendingRest?.exerciseId||''}
              onSkipRest={finishRest}
              onExtendRest={extendRest}
              onToggleRestSound={()=>setState(prev=>({...prev,restTimerSound:!prev.restTimerSound}))}
              onToggleRestVibration={()=>setState(prev=>({...prev,restTimerVibration:!prev.restTimerVibration}))}
              activeExerciseId={activeExerciseId}
              activeSet={activeSet}
              completedExerciseIds={completedExerciseIds}
              onSelectExercise={startExercise}
              ratingExerciseId={ratingExerciseId}
              onCompleteExercise={handleCompleteExercise}
              onRateExercise={handleExerciseRating}
              lastWorkoutDate={lastWorkoutDate}
              completedToday={!showNextWorkoutToday&&state.history[0]?.date===localDateString()?state.history[0]:undefined}
              onStartNextWorkoutToday={handleStartNextWorkoutToday}
              onLogWeight={handleLogWeight}
            />
          )}
          {view==='edit' && (
            <QueueEditor
              state={state}
              onSave={handleSaveProgram}
              templateDraftItems={templateDraftItems}
              templateDraftToken={templateDraftToken}
              onTemplateDraftApplied={()=>setTemplateDraftItems(null)}
            />
          )}
          {view==='history' && <History state={state} lastWorkoutDate={lastWorkoutDate} onLogWeight={handleLogWeight} onDeleteWeight={handleDeleteWeight} onDeleteWorkout={handleDeleteWorkout} onGoHome={()=>setView('home')} />}

          {view==='settings' && (
            <Settings
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
              weightTrackingEnabled={state.weightTracking.enabled}
              onToggleWeightTracking={()=>setState(prev=>({...prev,weightTracking:{...prev.weightTracking,enabled:!prev.weightTracking.enabled}}))}
              weeklyWorkoutGoal={state.weeklyWorkoutGoal}
              onWeeklyWorkoutGoalChange={weeklyWorkoutGoal=>setState(prev=>({...prev,weeklyWorkoutGoal}))}
              restSeconds={state.restSeconds}
              onRestSecondsChange={restSeconds=>setState(prev=>({...prev,restSeconds}))}
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
