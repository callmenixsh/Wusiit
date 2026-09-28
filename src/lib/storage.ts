export type Exercise = { id:string; name:string; instructions?:string; commonMistakes?:string; equipment?:string; sets?:number; reps?:string; tracking?:'reps'|'timed'; durationSeconds?:number; muscleGroupIds?:string[] }
export type MuscleGroup = { id:string; name:string; exerciseIds:string[] }
export type PlanDay = { id:string; name:string; muscleGroupIds:string[]; isRestDay?:boolean }
export type DayEntry = { date:string; label:string; description?:string }
export type WeightEntry = { id:string; date:string; weight:number }
export type WeightTracking = { enabled:boolean; entries:WeightEntry[] }
export type AppState = { exercises:Exercise[]; muscleGroups:MuscleGroup[]; days:PlanDay[]; history:DayEntry[]; weightTracking:WeightTracking }

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
  ],
    days: [
      {id:'day-mon',name:'Push day',muscleGroupIds:['group-chest','group-shoulders','group-triceps']},
      {id:'day-tue',name:'Pull day',muscleGroupIds:['group-back','group-biceps']},
      {id:'day-wed',name:'Leg day',muscleGroupIds:['group-quads','group-hamstrings','group-glutes']},
      {id:'day-thu',name:'Recovery',muscleGroupIds:[],isRestDay:true},
      {id:'day-fri',name:'Push day',muscleGroupIds:['group-chest','group-shoulders','group-triceps']},
      {id:'day-sat',name:'Pull day',muscleGroupIds:['group-back','group-biceps']},
      {id:'day-sun',name:'Rest day',muscleGroupIds:[],isRestDay:true},
    ], history: [], weightTracking: { enabled: false, entries: [] }
})

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

function historyOf(value:unknown):DayEntry[]{
  if(!Array.isArray(value)) return []
  return value.flatMap((v):DayEntry[]=>{
    if(!v || typeof v!=='object') return []
    const x=v as Record<string,unknown>, date=typeof x.date==='string'?x.date.trim():'', label=typeof x.label==='string'?x.label.trim():'', description=typeof x.description==='string'?x.description.trim():''
    return date&&label?[{date,label,...(description?{description}:{})}]:[]
  }).slice(0,1000)
}

function migrate(raw:Record<string,unknown>):AppState{
  if(!Array.isArray(raw.split)) return {...defaultState(),history:historyOf(raw.history),weightTracking:weightTrackingOf(raw.weightTracking)}
  const exercises:Exercise[]=[], muscleGroups:MuscleGroup[]=[], days:PlanDay[]=[]
  raw.split.forEach((v,i)=>{
    const x=typeof v==='string'?{name:v}:v&&typeof v==='object'?v as Record<string,unknown>:{}
    const name=typeof x.name==='string'&&x.name.trim()?x.name.trim():`Workout ${i+1}`
    const lines=typeof x.description==='string'?x.description.split('\n').map(s=>s.trim()).filter(Boolean):[]
    const exerciseIds=lines.map((name,j)=>{const id=`migrated-ex-${i}-${j}`; exercises.push({id,name,sets:3,reps:'8–12'}); return id})
    const groupId=`migrated-group-${i}`
    muscleGroups.push({id:groupId,name,exerciseIds}); days.push({id:`migrated-day-${i}`,name,muscleGroupIds:[groupId]})
  })
  return {exercises,muscleGroups,days,history:historyOf(raw.history),weightTracking:weightTrackingOf(raw.weightTracking)}
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
  const groupIds=new Set(muscleGroups.map(x=>x.id))
  exercises=exercises.map(ex=>({...ex,muscleGroupIds:[...new Set([...(ex.muscleGroupIds||[]).filter(id=>groupIds.has(id)),...muscleGroups.filter(group=>group.exerciseIds.includes(ex.id)).map(group=>group.id)])]}))
  muscleGroups.forEach(group=>group.exerciseIds=exercises.filter(ex=>ex.muscleGroupIds?.includes(group.id)).map(ex=>ex.id))
  const days=raw.days.flatMap((v):PlanDay[]=>{if(!v||typeof v!=='object')return[];const x=v as Record<string,unknown>;if(typeof x.id!=='string'||typeof x.name!=='string'||!x.name.trim())return[];return[{id:x.id,name:x.name.trim(),muscleGroupIds:Array.isArray(x.muscleGroupIds)?x.muscleGroupIds.filter((id):id is string=>typeof id==='string'&&groupIds.has(id)):[],...(x.isRestDay===true?{isRestDay:true}:{})}]})
  return {exercises,muscleGroups,days,history:historyOf(raw.history),weightTracking:weightTrackingOf(raw.weightTracking)}
}

export function loadState():AppState{try{const raw=localStorage.getItem(KEY)||localStorage.getItem(LEGACY_KEY);return raw?normalize(JSON.parse(raw)):defaultState()}catch(e){console.error(e);return defaultState()}}
export const saveState=(state:AppState)=>localStorage.setItem(KEY,JSON.stringify(normalize(state)))
export const exportJSON=(state:AppState)=>JSON.stringify(normalize(state),null,2)
export function importJSON(json:string):AppState|null{try{return normalize(JSON.parse(json))}catch{return null}}
