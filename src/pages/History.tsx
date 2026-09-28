import React, { useMemo, useState } from 'react'
import { Activity, CalendarDays, ChevronDown, Clock3, Dumbbell, Plus, Scale, Trash2, Trophy } from 'lucide-react'
import type { AppState, DayEntry, WorkoutRating } from '../lib/storage'
import { localDateString } from '../lib/dates'
import { getWeeklyStats } from '../lib/history'
import Modal, { dangerButton, DialogActions, secondaryButton } from '../components/Modal'

const DAY_MS = 24 * 60 * 60 * 1000

type HistoryProps = {
  state: AppState
  lastWorkoutDate?: string
  onLogWeight: (weight:number, date?:string) => void
  onDeleteWeight: (id:string) => void
  onDeleteWorkout: (id:string) => void
  onGoHome: () => void
}
type HistoryTab = 'overview' | 'workouts' | 'exercise' | 'weight'
type RatingFilter = 'all' | WorkoutRating

function parseIsoDate(value:string){
  const date=new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())?null:date
}
function formatDateLabel(value:string,includeYear=true){
  const date=parseIsoDate(value)
  if(!date)return value||'Unknown date'
  return date.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric',...(includeYear?{year:'numeric'}:{})})
}
function formatDuration(seconds:number){
  if(seconds<60)return '<1m'
  if(seconds<3600)return `${Math.floor(seconds/60)}m`
  const hours=Math.floor(seconds/3600),minutes=Math.floor((seconds%3600)/60)
  return `${hours}h${minutes?` ${minutes}m`:''}`
}
function ratingLabel(rating:WorkoutRating){return rating==='challenging'?'Challenging':rating==='easy'?'Could progress':'Well balanced'}
function ratingClasses(rating:WorkoutRating){
  if(rating==='challenging')return 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/35 dark:bg-amber-950/35 dark:text-amber-200'
  if(rating==='easy')return 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-500/35 dark:bg-sky-950/35 dark:text-sky-200'
  return 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/35 dark:bg-emerald-950/35 dark:text-emerald-200'
}
function Metric({icon,label,value}:{icon:React.ReactNode;label:string;value:string|number}){
  return <div className="rounded-xl border border-black/10 bg-black/[.02] p-3 dark:border-white/15 dark:bg-white/[.035]">
    <div className="flex items-center gap-1.5 text-black/50 dark:text-white/50">{icon}<span className="text-[10px] font-medium uppercase tracking-wider">{label}</span></div>
    <div className="mt-2 text-xl font-semibold tracking-tight text-black dark:text-white">{value}</div>
  </div>
}
function exerciseCount(entry:DayEntry){return entry.description?.split('\n').map(line=>line.trim()).filter(Boolean).length||0}

export default function History({state,lastWorkoutDate,onLogWeight,onDeleteWeight,onDeleteWorkout,onGoHome}:HistoryProps){
  const [tab,setTab]=useState<HistoryTab>('overview')
  const [weightDraft,setWeightDraft]=useState('')
  const [weightDate,setWeightDate]=useState(localDateString())
  const [showWeightForm,setShowWeightForm]=useState(false)
  const [selectedWeightId,setSelectedWeightId]=useState<string|null>(null)
  const [splitFilter,setSplitFilter]=useState('all')
  const [ratingFilter,setRatingFilter]=useState<RatingFilter>('all')
  const [pendingDelete,setPendingDelete]=useState<{kind:'weight'|'workout';id:string;title:string;description:string}|null>(null)
  const exerciseIds=[...new Set(state.history.flatMap(entry=>(entry.performances||[]).map(item=>item.exerciseId)))]
  const [progressExerciseId,setProgressExerciseId]=useState(exerciseIds[0]||'')
  const {currentStreak,highestStreak,thisWeek,goal}=getWeeklyStats(state.history,state.weeklyWorkoutGoal)
  const timedWorkouts=state.history.filter(entry=>entry.durationSeconds!==undefined)
  const totalSeconds=timedWorkouts.reduce((sum,entry)=>sum+(entry.durationSeconds||0),0)
  const totalWorkoutDays=new Set(state.history.map(entry=>entry.date)).size
  const todayIso=localDateString()
  const sessionDates=[...new Set(state.history.map(entry=>entry.date))].sort()
  const lastDate=sessionDates.at(-1)
  const daysSinceLast=lastDate?Math.max(0,Math.floor((new Date(`${todayIso}T00:00:00`).getTime()-new Date(`${lastDate}T00:00:00`).getTime())/DAY_MS)):null
  const loggedToday=state.history.some(entry=>entry.date===todayIso)||lastWorkoutDate===todayIso
  const week=Array.from({length:7},(_,index)=>{
    const date=new Date();date.setHours(0,0,0,0);date.setDate(date.getDate()-(6-index))
    const iso=localDateString(date)
    return {iso,weekday:date.toLocaleDateString(undefined,{weekday:'narrow'}),day:date.getDate(),hasSession:state.history.some(entry=>entry.date===iso),isToday:iso===todayIso}
  })
  const splits=useMemo(()=>{
    const counts=new Map<string,number>()
    state.history.forEach(entry=>counts.set(entry.label||'Unknown',(counts.get(entry.label||'Unknown')||0)+1))
    return [...counts.entries()].sort((a,b)=>b[1]-a[1])
  },[state.history])
  const maxSplit=Math.max(1,...splits.map(([,count])=>count))
  const filteredHistory=state.history.filter(entry=>(splitFilter==='all'||entry.label===splitFilter)&&(ratingFilter==='all'||entry.rating===ratingFilter))
  const groupedHistory=filteredHistory.reduce<Record<string,DayEntry[]>>((groups,entry)=>{
    const date=parseIsoDate(entry.date)
    const key=date?date.toLocaleDateString(undefined,{month:'long',year:'numeric'}):'Unknown date'
    ;(groups[key]||=[]).push(entry)
    return groups
  },{})
  const weightEntries=state.weightTracking.entries
  const chartEntries=[...weightEntries].slice(0,12).reverse()
  const rawMin=chartEntries.length?Math.min(...chartEntries.map(entry=>entry.weight)):0
  const rawMax=chartEntries.length?Math.max(...chartEntries.map(entry=>entry.weight)):0
  const padding=Math.max(.5,(rawMax-rawMin)*.15),chartMin=rawMin-padding,chartMax=rawMax+padding
  const points=chartEntries.map((entry,index)=>({entry,x:chartEntries.length===1?160:34+(index/(chartEntries.length-1))*252,y:102-((entry.weight-chartMin)/(chartMax-chartMin))*76}))
  const selectedWeight=weightEntries.find(entry=>entry.id===selectedWeightId)
  const overallChange=weightEntries.length>1?Math.round((weightEntries[0].weight-weightEntries.at(-1)!.weight)*10)/10:null
  const recentChange=weightEntries.length>1?Math.round((weightEntries[0].weight-weightEntries[1].weight)*10)/10:null
  const tabs:[HistoryTab,string][]=[['overview','Overview'],['workouts','Workouts'],...(exerciseIds.length?[['exercise','Exercises'] as [HistoryTab,string]]:[]),...(state.weightTracking.enabled?[['weight','Weight'] as [HistoryTab,string]]:[])]

  function submitWeight(event:React.FormEvent){
    event.preventDefault();const value=Number(weightDraft)
    if(!Number.isFinite(value)||value<=0||value>1000)return
    onLogWeight(value,weightDate);setWeightDraft('');setShowWeightForm(false)
  }
  function deleteWeight(){
    if(!selectedWeight)return
    setPendingDelete({kind:'weight',id:selectedWeight.id,title:'Delete weight entry?',description:`Delete the ${selectedWeight.weight} kg entry from ${formatDateLabel(selectedWeight.date)}?`})
  }

  function confirmDelete(){if(!pendingDelete)return;if(pendingDelete.kind==='weight'){onDeleteWeight(pendingDelete.id);setSelectedWeightId(null)}else onDeleteWorkout(pendingDelete.id);setPendingDelete(null)}

  return <div className="mb-4 space-y-4">
    <Modal open={Boolean(pendingDelete)} title={pendingDelete?.title||''} description={pendingDelete?.description} onClose={()=>setPendingDelete(null)}><DialogActions><button className={secondaryButton} onClick={()=>setPendingDelete(null)}>Keep it</button><button className={dangerButton} onClick={confirmDelete}>Delete</button></DialogActions></Modal>
    <div className="grid rounded-xl bg-black/[.055] p-1 dark:bg-white/[.09]" style={{gridTemplateColumns:`repeat(${tabs.length}, minmax(0, 1fr))`}} role="tablist" aria-label="Progress sections">
      {tabs.map(([id,label])=><button key={id} role="tab" aria-selected={tab===id} onClick={()=>setTab(id)} className={`min-h-10 rounded-lg px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:focus-visible:ring-white/50 ${tab===id?'bg-white text-black shadow-sm dark:bg-black dark:text-white':'text-black/55 hover:text-black dark:text-white/55 dark:hover:text-white'}`}>{label}</button>)}
    </div>

    {tab==='overview'&&<div role="tabpanel" className="space-y-3">
      <section className="overflow-hidden rounded-2xl border border-black/15 bg-black text-white dark:border-white/20 dark:bg-white dark:text-black">
        <div className="p-4"><div className="flex items-start justify-between gap-4"><div><div className="text-xs font-medium uppercase tracking-widest opacity-60">This week</div><div className="mt-1 text-3xl font-semibold tracking-tight">{thisWeek} <span className="text-lg font-normal opacity-55">of {goal}</span></div></div><div className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium dark:bg-black/10">{thisWeek>=goal?'Goal reached':`${goal-thisWeek} to go`}</div></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20 dark:bg-black/15"><div className="h-full rounded-full bg-white transition-all dark:bg-black" style={{width:`${Math.min(100,(thisWeek/goal)*100)}%`}} /></div><div className="mt-3 flex items-center justify-between text-xs opacity-70"><span>{loggedToday?'Workout logged today':'No workout logged today'}</span><span>{currentStreak} week streak · best {highestStreak}</span></div></div>
        <div className="grid grid-cols-7 gap-px border-t border-white/15 bg-white/15 dark:border-black/10 dark:bg-black/10">{week.map(day=><div key={day.iso} title={`${formatDateLabel(day.iso)} · ${day.hasSession?'Workout logged':'No workout'}`} className={`bg-black py-2.5 text-center dark:bg-white ${day.isToday?'ring-1 ring-inset ring-white/60 dark:ring-black/50':''}`}><div className="text-[10px] uppercase opacity-50">{day.weekday}</div><div className={`mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${day.hasSession?'bg-white text-black dark:bg-black dark:text-white':'opacity-55'}`}>{day.day}</div></div>)}</div>
      </section>
      <section className="grid grid-cols-2 gap-2"><Metric icon={<Dumbbell size={14}/>} label="Workouts" value={totalWorkoutDays}/><Metric icon={<Clock3 size={14}/>} label="Training time" value={timedWorkouts.length?formatDuration(totalSeconds):'Not tracked'}/><Metric icon={<Activity size={14}/>} label="Average" value={timedWorkouts.length?formatDuration(Math.round(totalSeconds/timedWorkouts.length)):'Not tracked'}/><Metric icon={<CalendarDays size={14}/>} label="Last workout" value={daysSinceLast===null?'No data':daysSinceLast===0?'Today':`${daysSinceLast}d ago`}/></section>
      {state.history.length>0&&<section className="rounded-2xl border border-black/15 p-4 dark:border-white/20"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Workout balance</h3><p className="mt-0.5 text-xs text-black/50 dark:text-white/50">Sessions by workout type</p></div><Trophy size={18} className="text-black/40 dark:text-white/40"/></div><div className="mt-4 space-y-3">{splits.map(([label,count])=><div key={label}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="truncate font-medium">{label}</span><span className="text-black/50 dark:text-white/50">{count}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/15"><div className="h-full rounded-full bg-black dark:bg-white" style={{width:`${Math.max(8,(count/maxSplit)*100)}%`}}/></div></div>)}</div><div className="mt-4 border-t border-black/10 pt-3 text-xs text-black/50 dark:border-white/10 dark:text-white/50">Training since {formatDateLabel(sessionDates[0],false)}</div></section>}
      {state.history.length===0&&<EmptyHistory onGoHome={onGoHome}/>}
    </div>}

    {tab==='workouts'&&<div role="tabpanel" className="space-y-3">
      {state.history.length>0&&<div className="grid grid-cols-2 gap-2"><Filter value={splitFilter} onChange={setSplitFilter} label="Filter by workout"><option value="all">All workouts</option>{splits.map(([label])=><option key={label}>{label}</option>)}</Filter><Filter value={ratingFilter} onChange={value=>setRatingFilter(value as RatingFilter)} label="Filter by rating"><option value="all">All ratings</option><option value="challenging">Challenging</option><option value="balanced">Well balanced</option><option value="easy">Could progress</option></Filter></div>}
      {Object.entries(groupedHistory).map(([month,entries])=><section key={month}><h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-black/45 dark:text-white/45">{month}</h3><div className="overflow-hidden rounded-2xl border border-black/15 dark:border-white/20">{entries.map((entry,index)=><WorkoutRow key={entry.id||`${entry.date}-${index}`} entry={entry} onDelete={entry.id?()=>setPendingDelete({kind:'workout',id:entry.id!,title:'Delete workout?',description:`Delete ${entry.label} from ${formatDateLabel(entry.date)}? This cannot be undone.`}):undefined}/>)}</div></section>)}
      {state.history.length>0&&filteredHistory.length===0&&<div className="rounded-2xl border border-dashed border-black/20 px-5 py-10 text-center text-sm text-black/55 dark:border-white/25 dark:text-white/55">No workouts match these filters.</div>}
      {state.history.length===0&&<EmptyHistory onGoHome={onGoHome}/>}
    </div>}

    {tab==='exercise'&&<ExerciseProgress state={state} exerciseId={progressExerciseId||exerciseIds[0]} onExerciseChange={setProgressExerciseId}/>}

    {tab==='weight'&&state.weightTracking.enabled&&<div role="tabpanel" className="space-y-3">
      <section className="rounded-2xl border border-black/15 p-4 dark:border-white/20">
        <div className="flex items-start justify-between gap-3"><div><div className="text-xs font-medium uppercase tracking-widest text-black/45 dark:text-white/45">Current weight</div><div className="mt-1 text-3xl font-semibold tracking-tight">{weightEntries[0]?`${weightEntries[0].weight} kg`:'—'}</div>{recentChange!==null&&<div className="mt-1 text-xs text-black/50 dark:text-white/50">{recentChange>0?'+':''}{recentChange} kg since last entry</div>}</div><button onClick={()=>setShowWeightForm(value=>!value)} aria-expanded={showWeightForm} className="flex min-h-11 items-center gap-1.5 rounded-xl bg-black px-3 text-sm font-medium text-white dark:bg-white dark:text-black"><Plus size={15}/>Log weight</button></div>
        {showWeightForm&&<form onSubmit={submitWeight} className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-black/[.035] p-3 dark:bg-white/[.06]"><label className="text-xs font-medium text-black/60 dark:text-white/60">Weight (kg)<input autoFocus type="number" min="1" max="1000" step="0.1" required value={weightDraft} onChange={event=>setWeightDraft(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-black/15 bg-white px-3 text-sm text-black dark:border-white/20 dark:bg-black dark:text-white"/></label><label className="text-xs font-medium text-black/60 dark:text-white/60">Date<input type="date" required max={todayIso} value={weightDate} onChange={event=>setWeightDate(event.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-black/15 bg-white px-2 text-sm text-black dark:border-white/20 dark:bg-black dark:text-white"/></label><button className="col-span-2 min-h-11 rounded-lg bg-black text-sm font-medium text-white dark:bg-white dark:text-black">Save entry</button></form>}
        {chartEntries.length>0?<div className="mt-5"><div className="flex items-center justify-between text-xs text-black/50 dark:text-white/50"><span>Last {chartEntries.length} entr{chartEntries.length===1?'y':'ies'}</span>{overallChange!==null&&<span>{overallChange>0?'+':''}{overallChange} kg overall</span>}</div><div className="mt-2 rounded-xl bg-black/[.025] p-2 dark:bg-white/[.04]" aria-label="Recent weight trend"><svg viewBox="0 0 320 120" className="h-40 w-full overflow-visible"><title>Recent weight trend from {rawMin} to {rawMax} kilograms</title>{[20,60,100].map(y=><line key={y} x1="34" x2="286" y1={y} y2={y} stroke="currentColor" strokeWidth="1" className="text-black/10 dark:text-white/10"/>)}<text x="2" y="23" fontSize="9" className="fill-black/45 dark:fill-white/45">{rawMax}</text><text x="2" y="103" fontSize="9" className="fill-black/45 dark:fill-white/45">{rawMin}</text>{points.length>1&&<polyline points={points.map(point=>`${point.x},${point.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" className="text-black dark:text-white"/>}{points.map(({entry,x,y})=><g key={entry.id} role="button" tabIndex={0} aria-label={`${formatDateLabel(entry.date)}: ${entry.weight} kilograms`} onClick={()=>setSelectedWeightId(entry.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelectedWeightId(entry.id)}}} className="cursor-pointer outline-none"><circle cx={x} cy={y} r={selectedWeightId===entry.id?7:5} className="fill-white stroke-black dark:fill-black dark:stroke-white" strokeWidth={selectedWeightId===entry.id?3:2}/></g>)}</svg><div className="flex justify-between px-7 text-[10px] text-black/45 dark:text-white/45"><span>{formatDateLabel(chartEntries[0].date,false)}</span>{chartEntries.length>1&&<span>{formatDateLabel(chartEntries.at(-1)!.date,false)}</span>}</div></div><ol className="sr-only">{chartEntries.map(entry=><li key={entry.id}>{formatDateLabel(entry.date)}: {entry.weight} kilograms</li>)}</ol></div>:<div className="py-10 text-center"><Scale size={22} className="mx-auto opacity-40"/><h3 className="mt-3 font-semibold">Log your first weigh-in</h3><p className="mt-1 text-sm text-black/55 dark:text-white/55">A trend will appear after you start adding entries.</p></div>}
      </section>
      {selectedWeight&&<section aria-live="polite" className="flex items-center justify-between rounded-xl border border-black/15 px-4 py-3 dark:border-white/20"><div><div className="font-semibold">{selectedWeight.weight} kg</div><div className="mt-0.5 text-xs text-black/50 dark:text-white/50">{formatDateLabel(selectedWeight.date)}</div></div><button onClick={deleteWeight} className="min-h-10 rounded-lg border border-red-300 px-3 text-xs font-medium text-red-700 dark:border-red-500/40 dark:text-red-300">Delete entry</button></section>}
    </div>}
  </div>
}

function Filter({value,onChange,label,children}:{value:string;onChange:(value:string)=>void;label:string;children:React.ReactNode}){
  return <label className="relative"><span className="sr-only">{label}</span><select value={value} onChange={event=>onChange(event.target.value)} className="min-h-11 w-full appearance-none rounded-xl border border-black/15 bg-white px-3 pr-8 text-sm dark:border-white/20 dark:bg-black">{children}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-3.5 opacity-45"/></label>
}
function WorkoutRow({entry,onDelete}:{entry:DayEntry;onDelete?:()=>void}){
  const date=parseIsoDate(entry.date),count=exerciseCount(entry)
  return <article className="p-4 [&+&]:border-t [&+&]:border-black/10 dark:[&+&]:border-white/10"><div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black"><span className="text-[9px] font-medium uppercase leading-none opacity-60">{date?.toLocaleDateString(undefined,{month:'short'})}</span><span className="mt-0.5 text-base font-semibold leading-none">{date?.getDate()}</span></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h4 className="truncate font-semibold">{entry.label}</h4><div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-black/50 dark:text-white/50">{entry.durationSeconds!==undefined&&<span className="flex items-center gap-1"><Clock3 size={12}/>{formatDuration(entry.durationSeconds)}</span>}{count>0&&<span className="flex items-center gap-1"><Dumbbell size={12}/>{count} exercise{count===1?'':'s'}</span>}</div></div>{entry.rating&&<span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-medium ${ratingClasses(entry.rating)}`}>{ratingLabel(entry.rating)}</span>}</div>{entry.description&&<details className="group mt-3"><summary className="flex min-h-9 cursor-pointer list-none items-center justify-between rounded-lg bg-black/[.035] px-3 text-xs font-medium dark:bg-white/[.06]">Exercises<ChevronDown size={14} className="transition-transform group-open:rotate-180"/></summary><div className="whitespace-pre-line px-3 pt-2 text-xs leading-relaxed text-black/60 dark:text-white/60">{entry.description}</div></details>}{onDelete&&<button onClick={onDelete} className="mt-3 flex min-h-9 items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400"><Trash2 size={14}/>Delete workout</button>}</div></div></article>
}
function ExerciseProgress({state,exerciseId,onExerciseChange}:{state:AppState;exerciseId:string;onExerciseChange:(id:string)=>void}){
  const options=[...new Map(state.history.flatMap(entry=>(entry.performances||[]).map(item=>[item.exerciseId,item.exerciseName] as const))).entries()]
  const sessions=[...state.history].reverse().flatMap(entry=>{
    const sets=(entry.performances||[]).filter(item=>item.exerciseId===exerciseId)
    if(!sets.length)return[]
    const weighted=sets.filter(item=>item.weight!==undefined&&item.reps!==undefined)
    return [{date:entry.date,reps:Math.max(0,...sets.map(item=>item.reps||0)),weight:Math.max(0,...sets.map(item=>item.weight||0)),volume:weighted.reduce((sum,item)=>sum+(item.weight||0)*(item.reps||0),0),e1rm:Math.max(0,...weighted.map(item=>(item.weight||0)*(1+(item.reps||0)/30)))}]
  })
  const latest=sessions.at(-1)
  return <div role="tabpanel" className="space-y-3"><label className="relative block"><span className="sr-only">Exercise</span><select value={exerciseId} onChange={event=>onExerciseChange(event.target.value)} className="min-h-11 w-full appearance-none rounded-xl border border-black/15 bg-white px-3 pr-8 text-sm font-medium dark:border-white/20 dark:bg-black">{options.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-3 top-3.5 opacity-45"/></label><div className="grid grid-cols-2 gap-2"><Metric icon={<Dumbbell size={14}/>} label="Latest weight" value={latest?.weight?`${latest.weight} kg`:'—'}/><Metric icon={<Activity size={14}/>} label="Latest reps" value={latest?.reps||'—'}/><Metric icon={<Trophy size={14}/>} label="Latest volume" value={latest?.volume?`${Math.round(latest.volume)} kg`:'—'}/><Metric icon={<Activity size={14}/>} label="Est. 1RM" value={latest?.e1rm?`${Math.round(latest.e1rm*10)/10} kg`:'—'}/></div>{sessions.length?<section className="rounded-2xl border border-black/15 p-4 dark:border-white/20"><h3 className="font-semibold">Performance trends</h3><p className="mt-0.5 text-xs text-black/50 dark:text-white/50">Estimated 1RM uses the Epley formula.</p><div className="mt-4 space-y-5"><Trend label="Weight" unit="kg" values={sessions.map(item=>({date:item.date,value:item.weight}))}/><Trend label="Reps" values={sessions.map(item=>({date:item.date,value:item.reps}))}/><Trend label="Volume" unit="kg" values={sessions.map(item=>({date:item.date,value:item.volume}))}/><Trend label="Estimated 1RM" unit="kg" values={sessions.map(item=>({date:item.date,value:item.e1rm}))}/></div></section>:null}</div>
}
function Trend({label,unit='',values}:{label:string;unit?:string;values:{date:string;value:number}[]}){
  const valid=values.filter(item=>item.value>0),min=Math.min(...valid.map(item=>item.value)),max=Math.max(...valid.map(item=>item.value)),range=Math.max(1,max-min)
  const points=valid.map((item,index)=>({item,x:valid.length===1?150:10+(index/(valid.length-1))*280,y:62-((item.value-min)/range)*48}))
  return <div><div className="flex justify-between text-xs"><span className="font-medium">{label}</span><span className="text-black/50 dark:text-white/50">{valid.length?`${Math.round(valid.at(-1)!.value*10)/10}${unit?` ${unit}`:''}`:'No data'}</span></div><div className="mt-2 h-20 rounded-lg bg-black/[.025] p-2 dark:bg-white/[.04]">{valid.length?<svg viewBox="0 0 300 72" className="h-full w-full" aria-label={`${label} trend`}><polyline points={points.map(point=>`${point.x},${point.y}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round"/>{points.map(({item,x,y})=><circle key={`${item.date}-${x}`} cx={x} cy={y} r="3.5" className="fill-white stroke-black dark:fill-black dark:stroke-white" strokeWidth="2"><title>{formatDateLabel(item.date)}: {Math.round(item.value*10)/10} {unit}</title></circle>)}</svg>:<div className="flex h-full items-center justify-center text-xs text-black/40 dark:text-white/40">Log reps and weight during a workout</div>}</div></div>
}
function EmptyHistory({onGoHome}:{onGoHome:()=>void}){
  return <section className="rounded-2xl border border-dashed border-black/20 px-6 py-10 text-center dark:border-white/25"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/[.06] dark:bg-white/[.09]"><Dumbbell size={20}/></div><h3 className="mt-3 font-semibold">No workouts yet</h3><p className="mx-auto mt-1 max-w-xs text-sm text-black/55 dark:text-white/55">Finish your first workout to see streaks, timing, and training balance here.</p><button onClick={onGoHome} className="mt-4 min-h-11 rounded-lg bg-black px-4 text-sm font-medium text-white dark:bg-white dark:text-black">Go to today’s workout</button></section>
}
