import { AppState, DayEntry, ExercisePerformance, makeId, WorkoutRating } from './storage'
import { localDateString } from './dates'

export function getDayDescription(state:AppState,index=0){
  const day=state.days[index]; if(!day)return''
  return day.exerciseIds.map(id=>state.exercises.find(x=>x.id===id)?.name).filter(Boolean).join('\n')
}
export function addHistoryForCurrentDay(state:AppState,details?:{durationSeconds?:number;rating?:WorkoutRating;performances?:ExercisePerformance[]}){const day=state.days[0],date=localDateString(),label=day?.name??'Workout 1';const description=getDayDescription(state);const entry:DayEntry={id:makeId('workout'),date,completedAt:new Date().toISOString(),label,...(description?{description}:{}),...(details?.durationSeconds!==undefined?{durationSeconds:Math.max(0,Math.round(details.durationSeconds))}:{}),...(details?.rating?{rating:details.rating}:{}),...(details?.performances?.length?{performances:details.performances}:{})};state.history.unshift(entry);return state}
export function advanceToNextDay(state:AppState){if(state.days.length>1)state.days=[...state.days.slice(1),state.days[0]];return state}
