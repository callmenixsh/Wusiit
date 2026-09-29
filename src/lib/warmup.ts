import warmupBuilder from '../data/warmupBuilder.json'

export type WarmupStep={name:string;amount:string;detail:string}

export const WARMUP_AREAS:string[]=[...warmupBuilder.areas]
export const WARMUP_AREA_STEPS:Record<string,WarmupStep[]>=warmupBuilder.steps
export const DEFAULT_WARMUP_STEPS:WarmupStep[]=warmupBuilder.defaultSteps

export const warmupStepsFor=(areas:string[])=>{
  const byName=new Map<string,WarmupStep>()
  areas.forEach(area=>(WARMUP_AREA_STEPS[area]||[]).forEach(step=>{if(!byName.has(step.name))byName.set(step.name,step)}))
  // Keep combined routines useful without turning the warm-up into a workout.
  return [...byName.values()].slice(0,7).map(step=>({...step}))
}

const LOWER_GROUPS=new Set(['quadriceps','quads','hamstrings','glutes','calves','lower back'])
const CORE_GROUPS=new Set(['abs','core'])

/** Suggest broad warm-up areas from the muscles used by a workout day. */
export function recommendedWarmupAreas(muscleNames:string[]){
  const names=muscleNames.map(name=>name.trim().toLowerCase())
  const areas:string[]=[]
  if(names.some(name=>LOWER_GROUPS.has(name)))areas.push('Lower body')
  if(names.some(name=>CORE_GROUPS.has(name)))areas.push('Core')
  if(names.some(name=>!LOWER_GROUPS.has(name)&&!CORE_GROUPS.has(name)&&name!=='full body'))areas.push('Upper body')
  if(names.includes('full body')||(areas.includes('Lower body')&&areas.includes('Upper body')))return ['Full body']
  return areas.length?areas:['Full body']
}
