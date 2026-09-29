import type { WarmupStep } from './warmup'

export type Exercise = { id:string; name:string; instructions?:string; commonMistakes?:string; equipment?:string; sets?:number; reps?:string; tracking?:'reps'|'timed'; durationSeconds?:number; muscleGroupIds?:string[] }
export type MuscleGroup = { id:string; name:string; exerciseIds:string[] }
export type PlanDay = { id:string; name:string; exerciseIds:string[]; muscleGroupIds?:string[]; isRestDay?:boolean; warmup?:WarmupStep[] }
const warmupOf=(value:unknown):WarmupStep[]=>{
  if(!Array.isArray(value))return []
  const steps:WarmupStep[]=[]
  value.forEach(entry=>{
    if(steps.length>=12)return
    if(typeof entry==='string'){
      const name=entry.trim()
      if(name)steps.push({name,amount:'',detail:''})
      return
    }
    if(!entry||typeof entry!=='object')return
    const step=entry as Record<string,unknown>
    const name=typeof step.name==='string'?step.name.trim():''
    if(!name)return
    const amount=typeof step.amount==='string'?step.amount.trim():''
    const detail=typeof step.detail==='string'?step.detail.trim():''
    steps.push({name,amount,detail})
  })
  return steps
}

export type WorkoutRating = 'challenging'|'balanced'|'easy'
export type ExercisePerformance = { exerciseId:string; exerciseName:string; set:number; reps?:number; weight?:number; durationSeconds?:number }
export type DayEntry = { id?:string; date:string; completedAt?:string; label:string; description?:string; durationSeconds?:number; rating?:WorkoutRating; performances?:ExercisePerformance[] }
export type WeightEntry = { id:string; date:string; weight:number }
export type WeightTracking = { enabled:boolean; entries:WeightEntry[] }
export type ReminderSettings = {
  enabled:boolean
  restTimer:boolean
  workout:{enabled:boolean;weekdays:number[];time:string}
  weighIn:{enabled:boolean;weekday:number;time:string}
}
export type AppState = { exercises:Exercise[]; muscleGroups:MuscleGroup[]; days:PlanDay[]; history:DayEntry[]; weightTracking:WeightTracking; weeklyWorkoutGoal:number; restSeconds:number; restTimerSound:boolean; restTimerVibration:boolean; reminders:ReminderSettings }
export type WorkoutPlan = Pick<AppState,'exercises'|'muscleGroups'|'days'>
type WorkoutPlanFile = {format:'wuwiit-workout-plan';version:1;plan:WorkoutPlan}

export const STANDARD_MUSCLE_GROUPS=[
  {id:'group-chest',name:'Chest'},
  {id:'group-back',name:'Back'},
  {id:'group-shoulders',name:'Shoulders'},
  {id:'group-biceps',name:'Biceps'},
  {id:'group-triceps',name:'Triceps'},
  {id:'group-forearms',name:'Forearms'},
  {id:'group-core',name:'Abs'},
  {id:'group-quads',name:'Quadriceps'},
  {id:'group-hamstrings',name:'Hamstrings'},
  {id:'group-glutes',name:'Glutes'},
  {id:'group-calves',name:'Calves'},
  {id:'group-lower-back',name:'Lower Back'},
  {id:'group-traps',name:'Traps'},
  {id:'group-full-body',name:'Full Body'},
] as const

const KEY = 'wdiit.state.v2'
const LEGACY_KEY = 'wdiit.state.v1'
export const makeId = (prefix:string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`

export const defaultState = ():AppState => ({
  exercises: [
    {id:'ex-bench',name:'Bench press',equipment:'Barbell',sets:3,reps:'8–12',muscleGroupIds:['group-chest','group-triceps','group-shoulders'],instructions:'Retract your shoulder blades, keep your feet planted, and lower the bar with control.'},
    {id:'ex-ohp',name:'Overhead press',equipment:'Barbell',sets:3,reps:'8–12',muscleGroupIds:['group-shoulders','group-triceps'],instructions:'Brace your core and press overhead without leaning back.'},
    {id:'ex-row',name:'Barbell row',equipment:'Barbell',sets:3,reps:'8–12',muscleGroupIds:['group-back','group-biceps'],instructions:'Hinge at the hips and pull the bar toward your lower ribs.'},
    {id:'ex-pulldown',name:'Lat pulldown',equipment:'Cable',sets:3,reps:'10–12',muscleGroupIds:['group-back','group-biceps'],instructions:'Drive your elbows down without swinging your torso.'},
    {id:'ex-squat',name:'Squat',equipment:'Barbell',sets:3,reps:'6–10',muscleGroupIds:['group-quads','group-glutes'],instructions:'Brace, sit between your hips, and track knees over toes.'},
    {id:'ex-rdl',name:'Romanian deadlift',equipment:'Barbell',sets:3,reps:'8–12',muscleGroupIds:['group-hamstrings','group-glutes'],instructions:'Push hips back with a neutral spine and keep the bar close.'},
  ],
  muscleGroups: [
    {id:'group-chest',name:'Chest',exerciseIds:['ex-bench']},
    {id:'group-shoulders',name:'Shoulders',exerciseIds:['ex-bench','ex-ohp']},
    {id:'group-triceps',name:'Triceps',exerciseIds:['ex-bench','ex-ohp']},
    {id:'group-back',name:'Back',exerciseIds:['ex-row','ex-pulldown']},
    {id:'group-biceps',name:'Biceps',exerciseIds:['ex-row','ex-pulldown']},
    {id:'group-quads',name:'Quadriceps',exerciseIds:['ex-squat']},
    {id:'group-hamstrings',name:'Hamstrings',exerciseIds:['ex-rdl']},
    {id:'group-glutes',name:'Glutes',exerciseIds:['ex-squat','ex-rdl']},
    {id:'group-forearms',name:'Forearms',exerciseIds:[]},
    {id:'group-core',name:'Abs',exerciseIds:[]},
    {id:'group-calves',name:'Calves',exerciseIds:[]},
    {id:'group-lower-back',name:'Lower Back',exerciseIds:[]},
    {id:'group-traps',name:'Traps',exerciseIds:[]},
    {id:'group-full-body',name:'Full Body',exerciseIds:[]},
  ],
    days: [
      {id:'day-mon',name:'Push day',exerciseIds:['ex-bench','ex-ohp']},
      {id:'day-tue',name:'Pull day',exerciseIds:['ex-row','ex-pulldown']},
      {id:'day-wed',name:'Leg day',exerciseIds:['ex-squat','ex-rdl']},
      {id:'day-thu',name:'Recovery',exerciseIds:[],isRestDay:true},
      {id:'day-fri',name:'Push day',exerciseIds:['ex-bench','ex-ohp']},
      {id:'day-sat',name:'Pull day',exerciseIds:['ex-row','ex-pulldown']},
      {id:'day-sun',name:'Rest day',exerciseIds:[],isRestDay:true},
    ], history: [], weightTracking: { enabled: false, entries: [] }, weeklyWorkoutGoal: 3, restSeconds: 60, restTimerSound: true, restTimerVibration: true,
    reminders:{enabled:false,restTimer:true,workout:{enabled:false,weekdays:[1,3,5],time:'18:00'},weighIn:{enabled:false,weekday:1,time:'08:00'}}
})

function timeOf(value:unknown,fallback:string){return typeof value==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(value)?value:fallback}
function remindersOf(value:unknown):ReminderSettings{
  const raw=value&&typeof value==='object'?value as Record<string,unknown>:{}
  const workout=raw.workout&&typeof raw.workout==='object'?raw.workout as Record<string,unknown>:{}
  const weighIn=raw.weighIn&&typeof raw.weighIn==='object'?raw.weighIn as Record<string,unknown>:{}
  const weekdays=Array.isArray(workout.weekdays)?[...new Set(workout.weekdays.map(Number).filter(day=>Number.isInteger(day)&&day>=0&&day<=6))]:[1,3,5]
  return {enabled:raw.enabled===true,restTimer:raw.restTimer!==false,workout:{enabled:workout.enabled===true,weekdays,time:timeOf(workout.time,'18:00')},weighIn:{enabled:weighIn.enabled===true,weekday:Math.min(6,Math.max(0,Math.round(Number(weighIn.weekday)||0))),time:timeOf(weighIn.time,'08:00')}}
}

function weightTrackingOf(value:unknown):WeightTracking{
  if(!value || typeof value !== 'object') return {enabled:false,entries:[]}
  const raw=value as Record<string,unknown>
  const entries=Array.isArray(raw.entries)?raw.entries.flatMap((v):WeightEntry[]=>{
    if(!v || typeof v !== 'object') return []
    const x=v as Record<string,unknown>
    const date=typeof x.date==='string'?x.date.trim():''
    const weight=typeof x.weight==='number'?x.weight:Number(x.weight)
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(weight) || weight<=0 || weight>1000) return []
    const id=typeof x.id==='string'&&x.id?x.id:makeId('weight')
    return [{id,date,weight:Math.round(weight*10)/10}]
  }).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,1000):[]
  return {enabled:raw.enabled===true,entries}
}

function weeklyWorkoutGoalOf(value:unknown){
  const goal=typeof value==='number'?value:Number(value)
  return Number.isFinite(goal)?Math.min(7,Math.max(1,Math.round(goal))):3
}

function restSecondsOf(value:unknown){
  const seconds=typeof value==='number'?value:Number(value)
  return Number.isFinite(seconds)?Math.min(600,Math.max(0,Math.round(seconds))):60
}

function historyOf(value:unknown):DayEntry[]{
  if(!Array.isArray(value)) return []
  return value.flatMap((v):DayEntry[]=>{
    if(!v || typeof v!=='object') return []
    const x=v as Record<string,unknown>, date=typeof x.date==='string'?x.date.trim():'', label=typeof x.label==='string'?x.label.trim():'', description=typeof x.description==='string'?x.description.trim():''
    const rating=x.rating==='challenging'||x.rating==='balanced'||x.rating==='easy'?x.rating:undefined
    const duration=typeof x.durationSeconds==='number'&&Number.isFinite(x.durationSeconds)?Math.max(0,Math.round(x.durationSeconds)):undefined
    const performances=Array.isArray(x.performances)?x.performances.flatMap((item):ExercisePerformance[]=>{if(!item||typeof item!=='object')return[];const p=item as Record<string,unknown>;if(typeof p.exerciseId!=='string'||typeof p.exerciseName!=='string')return[];const set=Math.max(1,Math.round(Number(p.set)||1)),reps=Number(p.reps),weight=Number(p.weight),durationSeconds=Number(p.durationSeconds);return[{exerciseId:p.exerciseId,exerciseName:p.exerciseName,set,...(Number.isFinite(reps)&&reps>0?{reps}:{}),...(Number.isFinite(weight)&&weight>=0?{weight}:{}),...(Number.isFinite(durationSeconds)&&durationSeconds>0?{durationSeconds:Math.round(durationSeconds)}:{})}]}):[]
    return date&&label?[{date,label,...(typeof x.id==='string'&&x.id?{id:x.id}:{}),...(typeof x.completedAt==='string'&&x.completedAt?{completedAt:x.completedAt}:{}),...(description?{description}:{}),...(duration!==undefined?{durationSeconds:duration}:{}),...(rating?{rating}:{}),...(performances.length?{performances}:{})}]:[]
  }).slice(0,1000)
}

function migrate(raw:Record<string,unknown>):AppState{
  if(!Array.isArray(raw.split)) return {...defaultState(),history:historyOf(raw.history),weightTracking:weightTrackingOf(raw.weightTracking),weeklyWorkoutGoal:weeklyWorkoutGoalOf(raw.weeklyWorkoutGoal),restSeconds:restSecondsOf(raw.restSeconds),restTimerSound:raw.restTimerSound!==false,restTimerVibration:raw.restTimerVibration!==false}
  const exercises:Exercise[]=[], muscleGroups:MuscleGroup[]=[], days:PlanDay[]=[]
  raw.split.forEach((v,i)=>{
    const x=typeof v==='string'?{name:v}:v&&typeof v==='object'?v as Record<string,unknown>:{}
    const name=typeof x.name==='string'&&x.name.trim()?x.name.trim():`Workout ${i+1}`
    const lines=typeof x.description==='string'?x.description.split('\n').map(s=>s.trim()).filter(Boolean):[]
    const exerciseIds=lines.map((name,j)=>{const id=`migrated-ex-${i}-${j}`; exercises.push({id,name,sets:3,reps:'8–12'}); return id})
    const groupId=`migrated-group-${i}`
    muscleGroups.push({id:groupId,name,exerciseIds}); days.push({id:`migrated-day-${i}`,name,exerciseIds})
  })
  STANDARD_MUSCLE_GROUPS.forEach(group=>{if(!muscleGroups.some(existing=>existing.name.toLowerCase()===group.name.toLowerCase()))muscleGroups.push({...group,exerciseIds:[]})})
  return {exercises,muscleGroups,days,history:historyOf(raw.history),weightTracking:weightTrackingOf(raw.weightTracking),weeklyWorkoutGoal:weeklyWorkoutGoalOf(raw.weeklyWorkoutGoal),restSeconds:restSecondsOf(raw.restSeconds),restTimerSound:raw.restTimerSound!==false,restTimerVibration:raw.restTimerVibration!==false,reminders:remindersOf(raw.reminders)}
}

function normalize(value:unknown):AppState{
  if(!value||typeof value!=='object') return defaultState()
  const raw=value as Record<string,unknown>
  if(!Array.isArray(raw.exercises)||!Array.isArray(raw.muscleGroups)||!Array.isArray(raw.days)) return migrate(raw)
  let exercises=raw.exercises.flatMap((v):Exercise[]=>{
    if(!v||typeof v!=='object')return[]; const x=v as Record<string,unknown>
    if(typeof x.id!=='string'||typeof x.name!=='string'||!x.name.trim())return[]
    return [{id:x.id,name:x.name.trim(),tracking:x.tracking==='timed'?'timed':'reps',muscleGroupIds:Array.isArray(x.muscleGroupIds)?x.muscleGroupIds.filter((id):id is string=>typeof id==='string'):[],...(typeof x.instructions==='string'&&x.instructions.trim()?{instructions:x.instructions.trim()}:{}),...(typeof x.commonMistakes==='string'&&x.commonMistakes.trim()?{commonMistakes:x.commonMistakes.trim()}:{}),...(typeof x.equipment==='string'&&x.equipment.trim()?{equipment:x.equipment.trim()}:{}),...(typeof x.sets==='number'?{sets:Math.max(1,Math.round(x.sets))}:{}),...(typeof x.reps==='string'&&x.reps.trim()?{reps:x.reps.trim()}:{}),...(typeof x.durationSeconds==='number'?{durationSeconds:Math.max(1,Math.round(x.durationSeconds))}:{})}]
  })
  const exIds=new Set(exercises.map(x=>x.id))
  const muscleGroups=raw.muscleGroups.flatMap((v):MuscleGroup[]=>{if(!v||typeof v!=='object')return[];const x=v as Record<string,unknown>;if(typeof x.id!=='string'||typeof x.name!=='string'||!x.name.trim())return[];return[{id:x.id,name:x.name.trim(),exerciseIds:Array.isArray(x.exerciseIds)?x.exerciseIds.filter((id):id is string=>typeof id==='string'&&exIds.has(id)):[]}]})
  STANDARD_MUSCLE_GROUPS.forEach(group=>{if(!muscleGroups.some(existing=>existing.id===group.id||existing.name.toLowerCase()===group.name.toLowerCase()))muscleGroups.push({...group,exerciseIds:[]})})
  const groupIds=new Set(muscleGroups.map(x=>x.id))
  exercises=exercises.map(ex=>({...ex,muscleGroupIds:[...new Set([...(ex.muscleGroupIds||[]).filter(id=>groupIds.has(id)),...muscleGroups.filter(group=>group.exerciseIds.includes(ex.id)).map(group=>group.id)])]}))
  muscleGroups.forEach(group=>group.exerciseIds=exercises.filter(ex=>ex.muscleGroupIds?.includes(group.id)).map(ex=>ex.id))
  const days=raw.days.flatMap((v):PlanDay[]=>{if(!v||typeof v!=='object')return[];const x=v as Record<string,unknown>;if(typeof x.id!=='string'||typeof x.name!=='string'||!x.name.trim())return[];const legacyGroupIds=Array.isArray(x.muscleGroupIds)?x.muscleGroupIds.filter((id):id is string=>typeof id==='string'&&groupIds.has(id)):[];const directIds=Array.isArray(x.exerciseIds)?x.exerciseIds.filter((id):id is string=>typeof id==='string'&&exIds.has(id)):[];const exerciseIds=directIds.length||Array.isArray(x.exerciseIds)?directIds:[...new Set(legacyGroupIds.flatMap(id=>muscleGroups.find(group=>group.id===id)?.exerciseIds||[]))];const warmup=warmupOf(x.warmup);return[{id:x.id,name:x.name.trim(),exerciseIds,...(legacyGroupIds.length?{muscleGroupIds:legacyGroupIds}:{}),...(x.isRestDay===true?{isRestDay:true}:{}),...(warmup.length?{warmup}:{})}]})
  return {exercises,muscleGroups,days,history:historyOf(raw.history),weightTracking:weightTrackingOf(raw.weightTracking),weeklyWorkoutGoal:weeklyWorkoutGoalOf(raw.weeklyWorkoutGoal),restSeconds:restSecondsOf(raw.restSeconds),restTimerSound:raw.restTimerSound!==false,restTimerVibration:raw.restTimerVibration!==false,reminders:remindersOf(raw.reminders)}
}

export function loadState():AppState{try{const raw=localStorage.getItem(KEY)||localStorage.getItem(LEGACY_KEY);return raw?normalize(JSON.parse(raw)):defaultState()}catch(e){console.error(e);return defaultState()}}
export const saveState=(state:AppState)=>localStorage.setItem(KEY,JSON.stringify(normalize(state)))
const readableJSON=(value:unknown)=>`${JSON.stringify(value,null,2)}\n`
const withoutBOM=(json:string)=>json.replace(/^\uFEFF/,'')

export const exportJSON=(state:AppState)=>readableJSON(normalize(state))
export function importJSON(json:string):AppState|null{try{return normalize(JSON.parse(withoutBOM(json)))}catch{return null}}

/** A portable program file. Progress, preferences, and reminders are intentionally excluded. */
export function exportPlanJSON(state:AppState){
  const normalized=normalize(state)
  const file:WorkoutPlanFile={format:'wuwiit-workout-plan',version:1,plan:{exercises:normalized.exercises,muscleGroups:normalized.muscleGroups,days:normalized.days}}
  return readableJSON(file)
}

export function importPlanJSON(json:string):WorkoutPlan|null{
  try{
    const value:unknown=JSON.parse(withoutBOM(json))
    if(!value||typeof value!=='object')return null
    const file=value as Record<string,unknown>
    if(file.format!=='wuwiit-workout-plan'||file.version!==1||!file.plan||typeof file.plan!=='object')return null
    const plan=file.plan as Record<string,unknown>
    if(!Array.isArray(plan.exercises)||!Array.isArray(plan.muscleGroups)||!Array.isArray(plan.days))return null
    const normalized=normalize({...defaultState(),exercises:plan.exercises,muscleGroups:plan.muscleGroups,days:plan.days,history:[]})
    // Do not silently turn a malformed non-empty plan into an empty one.
    if((plan.exercises.length&&!normalized.exercises.length)||(plan.days.length&&!normalized.days.length))return null
    return {exercises:normalized.exercises,muscleGroups:normalized.muscleGroups,days:normalized.days}
  }catch{return null}
}
