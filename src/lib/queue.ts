import { AppState, DayEntry, ExercisePerformance, makeId, WorkoutRating } from './storage'
import { localDateString } from './dates'

export function getDayDescription(state:AppState,index=0){
  const day=state.days[index]; if(!day)return''
  return day.exerciseIds.map(id=>state.exercises.find(x=>x.id===id)?.name).filter(Boolean).join('\n')
}
export function addHistoryForCurrentDay(state:AppState,details?:{durationSeconds?:number;rating?:WorkoutRating;performances?:ExercisePerformance[]},index=0){const day=state.days[index];const date=localDateString(),label=day?.name??'Workout 1';const description=getDayDescription(state,index);const entry:DayEntry={id:makeId('workout'),date,completedAt:new Date().toISOString(),label,...(description?{description}:{}),...(details?.durationSeconds!==undefined?{durationSeconds:Math.max(0,Math.round(details.durationSeconds))}:{}),...(details?.rating?{rating:details.rating}:{}),...(details?.performances?.length?{performances:details.performances}:{})};state.history.unshift(entry);return state}
