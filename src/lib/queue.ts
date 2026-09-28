import { AppState, DayEntry } from './storage'
import { localDateString } from './dates'

export function getDayDescription(state:AppState,index=0){
  const day=state.days[index]; if(!day)return''
  return day.exerciseIds.map(id=>state.exercises.find(x=>x.id===id)?.name).filter(Boolean).join('\n')
}
export function addHistoryForCurrentDay(state:AppState){const day=state.days[0],date=localDateString(),label=day?.name??'Workout 1';if(state.history[0]?.date===date&&state.history[0]?.label===label)return state;const description=getDayDescription(state);const entry:DayEntry={date,label,...(description?{description}:{})};state.history.unshift(entry);return state}
export function advanceToNextDay(state:AppState){if(state.days.length>1)state.days=[...state.days.slice(1),state.days[0]];return state}
