import React,{useEffect,useMemo,useRef,useState} from 'react'
import {BookOpen,CalendarDays,Check,ChevronDown,Dumbbell,Plus,Trash2} from 'lucide-react'
import {AppState,makeId} from '../lib/storage'

type Props={state:AppState;onSave:(state:AppState)=>void;templateDraftItems?:{name:string;description?:string}[]|null;templateDraftToken?:number;onTemplateDraftApplied?:()=>void}
type Tab='days'|'groups'|'exercises'
type Option={id:string;label:string;meta?:string}
const clone=(s:AppState):AppState=>JSON.parse(JSON.stringify(s))
const WEEKDAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const asWeek=(source:AppState)=>{const s=clone(source);while(s.days.length<7){const i=s.days.length;s.days.push({id:makeId('day'),name:i===6?'Rest day':'Recovery',muscleGroupIds:[],isRestDay:true})}s.days=s.days.slice(0,7);return s}
const field='w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm text-black outline-none transition focus:border-black focus:ring-2 focus:ring-black/5 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white dark:focus:ring-white/10'
const homeExercise:Record<string,Partial<AppState['exercises'][number]>>={
  'Bodyweight squat':{sets:3,reps:'12–15',instructions:'Stand shoulder-width apart, sit your hips back and down, then drive through the whole foot.',commonMistakes:'Avoid knees collapsing inward, heels lifting, or rounding the lower back.'},
  'Push-up':{sets:3,reps:'8–15',instructions:'Keep a straight line from head to heels and lower your chest between your hands.',commonMistakes:'Avoid flared elbows, sagging hips, and shortening the range of motion.'},
  'Glute bridge':{sets:3,reps:'12–15',instructions:'Drive through your heels and squeeze your glutes at the top without arching your back.',commonMistakes:'Do not push through the toes or overextend the lower back.'},
  'Superman':{sets:3,reps:'10–12',instructions:'Lift arms and legs gently while keeping your neck neutral.',commonMistakes:'Avoid throwing the limbs upward or cranking the neck.'},
  'Mountain climbers':{tracking:'timed',sets:3,durationSeconds:30,instructions:'Hold a strong plank and alternate driving each knee toward your chest.',commonMistakes:'Avoid bouncing hips, collapsed shoulders, and sacrificing form for speed.'},
  'Forearm plank':{tracking:'timed',sets:3,durationSeconds:30,instructions:'Brace your trunk and maintain a straight line from head to heels.',commonMistakes:'Do not let the hips sag or rise, and avoid holding your breath.'},
  'Dead bug':{sets:3,reps:'8–10 / side',instructions:'Keep your lower back gently pressed down as opposite arm and leg extend.',commonMistakes:'Avoid arching the lower back or moving too quickly.'},
  'Jumping jacks':{tracking:'timed',sets:3,durationSeconds:30,instructions:'Land softly while moving arms and legs through a comfortable range.',commonMistakes:'Avoid locked knees, heavy landings, or shrugging the shoulders.'},
  'Reverse lunge':{sets:3,reps:'8–12 / side',instructions:'Step back, lower under control, then drive through the front foot.',commonMistakes:'Avoid the front knee collapsing inward or pushing off the rear foot.'},
  'Single-leg glute bridge':{sets:3,reps:'8–12 / side',instructions:'Keep hips level and extend them using the planted-side glute.',commonMistakes:'Avoid rotating the pelvis or driving through the lower back.'},
  'Calf raise':{sets:3,reps:'15–20',instructions:'Rise onto the ball of the foot, pause, and lower through the full range.',commonMistakes:'Avoid bouncing or rolling the ankles outward.'},
  'Wall sit':{tracking:'timed',sets:3,durationSeconds:30,instructions:'Keep your back against the wall with knees tracking over the feet.',commonMistakes:'Avoid placing hands on the thighs or letting knees cave inward.'}
}
const musclesByExercise:Record<string,string[]>={
  'Bench press':['Chest','Triceps','Shoulders'],'Incline dumbbell press':['Chest','Triceps','Shoulders'],'Shoulder press':['Shoulders','Triceps'],'Lateral raises':['Shoulders'],'Triceps pushdown':['Triceps'],
  'Pull-ups':['Back','Biceps'],'Lat pulldown':['Back','Biceps'],'Barbell row':['Back','Biceps'],'Face pull':['Shoulders','Back'],'Bicep curls':['Biceps'],
  'Squats':['Quadriceps','Glutes'],'Romanian deadlift':['Hamstrings','Glutes'],'Leg press':['Quadriceps','Glutes'],'Leg curls':['Hamstrings'],'Calf raises':['Calves'],
  'Incline press':['Chest','Shoulders','Triceps'],'Rows':['Back','Biceps'],'Pulldowns':['Back','Biceps'],'Overhead press':['Shoulders','Triceps'],'Curls':['Biceps'],'Skull crushers':['Triceps'],'Hammer curls':['Biceps','Forearms'],'Lunges':['Quadriceps','Glutes','Hamstrings'],'Hamstring curls':['Hamstrings'],'Calves':['Calves'],
  'Lat machine top':['Back','Biceps'],'Lat machine bottom':['Back','Biceps'],'Rowing':['Back','Biceps'],'One-arm rowing':['Back','Biceps'],'Bench flat':['Chest','Triceps'],'Bench incline':['Chest','Shoulders','Triceps'],'Bench decline':['Chest','Triceps'],'Flys':['Chest'],'Pushups':['Chest','Shoulders','Triceps'],'Hammer':['Biceps','Forearms'],'Barbell':['Biceps'],'Preacher':['Biceps'],'Press':['Shoulders','Triceps'],'Lateral':['Shoulders'],'Front':['Shoulders'],'Shrugs':['Shoulders','Back'],'Extensions':['Quadriceps'],
  'Bodyweight squat':['Quadriceps','Glutes'],'Push-up':['Chest','Shoulders','Triceps'],'Glute bridge':['Glutes','Hamstrings'],'Superman':['Lower Back','Glutes'],'Mountain climbers':['Abs','Shoulders'],'Forearm plank':['Abs','Lower Back'],'Dead bug':['Abs'],'Jumping jacks':['Quadriceps','Calves','Shoulders'],'Reverse lunge':['Quadriceps','Glutes','Hamstrings'],'Single-leg glute bridge':['Glutes','Hamstrings'],'Calf raise':['Calves'],'Wall sit':['Quadriceps','Glutes']
}

function MultiSelect({label,options,value,onChange}:{label:string;options:Option[];value:string[];onChange:(ids:string[])=>void}){
  const [open,setOpen]=useState(false),root=useRef<HTMLDivElement>(null)
  useEffect(()=>{const close=(e:MouseEvent)=>{if(!root.current?.contains(e.target as Node))setOpen(false)};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[])
  const selected=options.filter(o=>value.includes(o.id))
  return <div ref={root} className="relative"><button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} className={`${field} flex min-h-[42px] items-center gap-2 text-left`}><span className={`min-w-0 flex-1 truncate ${selected.length?'':'text-black/40 dark:text-white/40'}`}>{selected.length===0?label:selected.length<=2?selected.map(x=>x.label).join(', '):`${selected.length} selected`}</span>{selected.length>0&&<span className="rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white dark:bg-white dark:text-black">{selected.length}</span>}<ChevronDown size={15} className={`shrink-0 transition ${open?'rotate-180':''}`}/></button>{open&&<div className="absolute left-0 right-0 z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-black/15 bg-white p-1.5 shadow-xl dark:border-white/20 dark:bg-neutral-950">{options.length?options.map(o=>{const checked=value.includes(o.id);return <button type="button" key={o.id} onClick={()=>onChange(checked?value.filter(id=>id!==o.id):[...value,o.id])} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-black/5 dark:hover:bg-white/10"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked?'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black':'border-black/20 dark:border-white/25'}`}>{checked&&<Check size={13}/>}</span><span className="min-w-0 flex-1 truncate text-sm font-medium">{o.label}</span>{o.meta&&<span className="text-[10px] text-black/40 dark:text-white/40">{o.meta}</span>}</button>}):<div className="px-3 py-5 text-center text-xs text-black/45 dark:text-white/45">Nothing available yet</div>}</div>}</div>
}

function NativeSelect({value,onChange,children}:{value:string;onChange:(value:string)=>void;children:React.ReactNode}){return <div className="relative"><select className={`${field} appearance-none pr-9`} value={value} onChange={e=>onChange(e.target.value)}>{children}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/45 dark:text-white/45"/></div>}

export default function QueueEditor({state,onSave,templateDraftItems,templateDraftToken,onTemplateDraftApplied}:Props){
  const [tab,setTab]=useState<Tab>('days'),[draft,setDraft]=useState(()=>asWeek(state)),[expanded,setExpanded]=useState<string|null>(null)
  useEffect(()=>setDraft(asWeek(state)),[state])
  useEffect(()=>{
    if(!templateDraftItems?.length)return
    const next:AppState={exercises:[],muscleGroups:[],days:[],history:clone(state).history}
    const ensureGroup=(name:string)=>{let group=next.muscleGroups.find(g=>g.name===name);if(!group){group={id:makeId('group'),name,exerciseIds:[]};next.muscleGroups.push(group)}return group}
    templateDraftItems.forEach(item=>{
      if(item.description==='__REST__'){next.days.push({id:makeId('day'),name:item.name,muscleGroupIds:[],isRestDay:true});return}
      const dayGroupIds=new Set<string>()
      ;(item.description||'').split('\n').map(x=>x.trim()).filter(Boolean).forEach(name=>{
        const muscleNames=musclesByExercise[name]||['Full Body']
        const groupIds=muscleNames.map(muscle=>ensureGroup(muscle).id)
        groupIds.forEach(id=>dayGroupIds.add(id))
        let exercise=next.exercises.find(ex=>ex.name===name)
        if(!exercise){const preset=homeExercise[name]||{};exercise={id:makeId('ex'),name,tracking:preset.tracking||'reps',sets:preset.sets||3,reps:preset.reps||'8–12',muscleGroupIds:groupIds,...preset};next.exercises.push(exercise)}
        exercise.muscleGroupIds=[...new Set([...(exercise.muscleGroupIds||[]),...groupIds])]
        groupIds.forEach(groupId=>{const group=next.muscleGroups.find(g=>g.id===groupId)!;if(!group.exerciseIds.includes(exercise!.id))group.exerciseIds.push(exercise!.id)})
      })
      next.days.push({id:makeId('day'),name:item.name,muscleGroupIds:[...dayGroupIds]})
    })
    setDraft(next);setTab('days');setExpanded(null);onTemplateDraftApplied?.()
  },[templateDraftToken])
  const dirty=useMemo(()=>JSON.stringify(draft)!==JSON.stringify(state),[draft,state])
  const update=(fn:(s:AppState)=>void)=>setDraft(old=>{const next=clone(old);fn(next);return next})
  const groupOptions=draft.muscleGroups.map(x=>({id:x.id,label:x.name||'Untitled group',meta:`${x.exerciseIds.length} exercises`}))
  const removeExercise=(id:string)=>update(s=>{s.exercises=s.exercises.filter(x=>x.id!==id);s.muscleGroups.forEach(g=>g.exerciseIds=g.exerciseIds.filter(x=>x!==id))})
  const removeGroup=(id:string)=>update(s=>{s.muscleGroups=s.muscleGroups.filter(x=>x.id!==id);s.days.forEach(d=>d.muscleGroupIds=d.muscleGroupIds.filter(x=>x!==id));s.exercises.forEach(ex=>ex.muscleGroupIds=ex.muscleGroupIds?.filter(x=>x!==id))})
  const tabs=[{id:'days' as const,label:'Days',Icon:CalendarDays,count:draft.days.length},{id:'groups' as const,label:'Groups',Icon:Dumbbell,count:draft.muscleGroups.length},{id:'exercises' as const,label:'Exercises',Icon:BookOpen,count:draft.exercises.length}]
  const add=(kind:Tab)=>{if(kind==='days'&&draft.days.length>=7)return;const id=makeId(kind==='days'?'day':kind==='groups'?'group':'ex');update(s=>kind==='days'?s.days.push({id,name:'',muscleGroupIds:[]}):kind==='groups'?s.muscleGroups.push({id,name:'',exerciseIds:[]}):s.exercises.push({id,name:'',tracking:'reps',sets:3,reps:'8–12'}));setExpanded(id)}

  return <div className="mb-28">
    <nav className="grid grid-cols-3 gap-1 rounded-2xl border border-black/10 bg-black/[.03] p-1 dark:border-white/10 dark:bg-white/[.06]">{tabs.map(({id,label,Icon,count})=><button key={id} onClick={()=>{setTab(id);setExpanded(null)}} className={`rounded-xl px-2 py-2.5 transition ${tab===id?'bg-white text-black shadow-sm dark:bg-white dark:text-black':'text-black/45 dark:text-white/45'}`}><span className="flex items-center justify-center gap-1.5 text-xs font-semibold"><Icon size={14}/>{label}<span className="font-normal opacity-50">{count}</span></span></button>)}</nav>
    <div className="mb-3 mt-4 flex justify-end"><button onClick={()=>add(tab)} className="flex items-center gap-1.5 rounded-xl bg-black px-3 py-2 text-xs font-semibold text-white dark:bg-white dark:text-black"><Plus size={15}/>Add</button></div>

    <div className="space-y-2">
      {tab==='days'&&draft.days.map((day,i)=><EditorCard key={day.id} open={expanded===day.id} onToggle={()=>setExpanded(expanded===day.id?null:day.id)} title={day.name||'Untitled day'} eyebrow={WEEKDAYS[i%7]} summary={day.isRestDay?'Rest':`${day.muscleGroupIds.length} groups`} onDelete={()=>update(s=>s.days=s.days.filter(x=>x.id!==day.id))}>
        <L>Day type</L><NativeSelect value={day.isRestDay?'rest':'training'} onChange={value=>update(s=>{const x=s.days.find(x=>x.id===day.id);if(x){x.isRestDay=value==='rest';if(x.isRestDay)x.muscleGroupIds=[]}})}><option value="training">Training day</option><option value="rest">Rest / recovery day</option></NativeSelect>
        <L>Name</L><input className={field} value={day.name} placeholder={day.isRestDay?'e.g. Recovery':'e.g. Push day'} onChange={e=>update(s=>{const x=s.days.find(x=>x.id===day.id);if(x)x.name=e.target.value})}/>
        {!day.isRestDay&&<><L>Muscle groups</L><MultiSelect label="Choose muscle groups" options={groupOptions} value={day.muscleGroupIds} onChange={ids=>update(s=>{const x=s.days.find(x=>x.id===day.id);if(x)x.muscleGroupIds=ids})}/></>}
      </EditorCard>)}
      {tab==='groups'&&draft.muscleGroups.map(group=><EditorCard key={group.id} open={expanded===group.id} onToggle={()=>setExpanded(expanded===group.id?null:group.id)} title={group.name||'Untitled group'} eyebrow="Muscle group" summary={`${draft.exercises.filter(ex=>(ex.muscleGroupIds||[]).includes(group.id)||group.exerciseIds.includes(ex.id)).length} exercises`} onDelete={()=>removeGroup(group.id)}><L>Muscle group name</L><input className={field} value={group.name} placeholder="e.g. Chest, Triceps, Hamstrings" onChange={e=>update(s=>{const x=s.muscleGroups.find(x=>x.id===group.id);if(x)x.name=e.target.value})}/><p className="mt-3 text-xs leading-relaxed text-black/45 dark:text-white/45">Assign this tag from each exercise. Days use these tags to build the workout.</p></EditorCard>)}
      {tab==='exercises'&&draft.exercises.map(ex=><EditorCard key={ex.id} open={expanded===ex.id} onToggle={()=>setExpanded(expanded===ex.id?null:ex.id)} title={ex.name||'Untitled exercise'} eyebrow={ex.tracking==='timed'?'Timed exercise':'Reps exercise'} summary={ex.tracking==='timed'?`${ex.durationSeconds||30}s × ${ex.sets||3}`:`${ex.sets||3} × ${ex.reps||'8–12'}`} onDelete={()=>removeExercise(ex.id)}>
        <L>Name</L><input className={field} value={ex.name} placeholder="e.g. Bench press" onChange={e=>update(s=>{const x=s.exercises.find(x=>x.id===ex.id);if(x)x.name=e.target.value})}/>
        <L>Muscle groups</L><MultiSelect label="Choose muscle groups" options={groupOptions} value={ex.muscleGroupIds||draft.muscleGroups.filter(g=>g.exerciseIds.includes(ex.id)).map(g=>g.id)} onChange={ids=>update(s=>{const x=s.exercises.find(x=>x.id===ex.id);if(x)x.muscleGroupIds=ids;s.muscleGroups.forEach(g=>g.exerciseIds=ids.includes(g.id)?[...new Set([...g.exerciseIds,ex.id])]:g.exerciseIds.filter(id=>id!==ex.id))})}/>
        <div className="grid grid-cols-2 gap-2"><div><L>Tracking</L><NativeSelect value={ex.tracking||'reps'} onChange={v=>update(s=>{const x=s.exercises.find(x=>x.id===ex.id);if(x)x.tracking=v as 'reps'|'timed'})}><option value="reps">Sets × reps</option><option value="timed">Time × sets</option></NativeSelect></div><div><L>Sets</L><input className={field} type="number" min="1" value={ex.sets||''} onChange={e=>update(s=>{const x=s.exercises.find(x=>x.id===ex.id);if(x)x.sets=Number(e.target.value)||undefined})}/></div></div>
        <div className="grid grid-cols-2 gap-2"><div><L>{ex.tracking==='timed'?'Seconds':'Reps'}</L><input className={field} type={ex.tracking==='timed'?'number':'text'} min="1" value={ex.tracking==='timed'?ex.durationSeconds||'':ex.reps||''} placeholder={ex.tracking==='timed'?'30':'8–12'} onChange={e=>update(s=>{const x=s.exercises.find(x=>x.id===ex.id);if(!x)return;if(x.tracking==='timed')x.durationSeconds=Number(e.target.value)||undefined;else x.reps=e.target.value})}/></div><div><L>Equipment</L><input className={field} value={ex.equipment||''} placeholder="Optional" onChange={e=>update(s=>{const x=s.exercises.find(x=>x.id===ex.id);if(x)x.equipment=e.target.value})}/></div></div>
        <L>Instructions</L><textarea className={`${field} min-h-24 resize-y`} value={ex.instructions||''} placeholder="Setup, movement and useful cues…" onChange={e=>update(s=>{const x=s.exercises.find(x=>x.id===ex.id);if(x)x.instructions=e.target.value})}/>
        <L>Common mistakes / things to avoid</L><textarea className={`${field} min-h-20 resize-y`} value={ex.commonMistakes||''} placeholder="What should someone avoid doing?" onChange={e=>update(s=>{const x=s.exercises.find(x=>x.id===ex.id);if(x)x.commonMistakes=e.target.value})}/>
      </EditorCard>)}
      {(tab==='days'?draft.days:tab==='groups'?draft.muscleGroups:draft.exercises).length===0&&<div className="rounded-2xl border border-dashed border-black/20 px-5 py-10 text-center dark:border-white/20"><div className="text-sm font-semibold">No {tab} yet</div><button onClick={()=>add(tab)} className="mt-3 text-xs underline underline-offset-4">Add the first one</button></div>}
    </div>
    {dirty&&<div className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-md -translate-x-1/2 gap-2 border-t border-black/10 bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur dark:border-white/15 dark:bg-black/95"><button className="flex-1 rounded-xl border border-black/15 py-3 text-sm font-semibold dark:border-white/20" onClick={()=>{setDraft(clone(state));setExpanded(null)}}>Discard</button><button className="flex-[1.4] rounded-xl bg-black py-3 text-sm font-semibold text-white dark:bg-white dark:text-black" onClick={()=>draft.days.length?onSave(draft):alert('Add at least one training day')}>Save program</button></div>}
  </div>
}

function L({children}:{children:React.ReactNode}){return <label className="mb-1 mt-3 block text-[10px] font-semibold uppercase tracking-wider text-black/45 dark:text-white/45">{children}</label>}
function EditorCard({open,onToggle,title,eyebrow,summary,onDelete,children}:{open:boolean;onToggle:()=>void;title:string;eyebrow:string;summary:string;onDelete:()=>void;children:React.ReactNode}){return <section className={`overflow-visible rounded-2xl border transition ${open?'border-black/30 bg-black/[.015] dark:border-white/35 dark:bg-white/[.04]':'border-black/10 dark:border-white/15'}`}><button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-3.5 text-left"><div className="min-w-0 flex-1"><div className="text-[9px] font-semibold uppercase tracking-widest text-black/40 dark:text-white/40">{eyebrow}</div><div className="mt-0.5 truncate font-semibold">{title}</div></div><span className="text-xs text-black/40 dark:text-white/40">{summary}</span><ChevronDown size={17} className={`transition ${open?'rotate-180':''}`}/></button>{open&&<div className="border-t border-black/10 p-3.5 pt-1 dark:border-white/10">{children}<button type="button" onClick={onDelete} className="mt-4 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400"><Trash2 size={14}/>Delete</button></div>}</section>}
