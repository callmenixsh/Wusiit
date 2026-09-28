import type { DayEntry } from './storage'
import { localDateString } from './dates'

export const DEFAULT_WEEKLY_WORKOUT_GOAL = 3

function weekKey(date:Date){
  const d=new Date(date.getFullYear(),date.getMonth(),date.getDate())
  const day=(d.getDay()+6)%7
  d.setDate(d.getDate()-day)
  return localDateString(d)
}

export function getWeeklyStats(history:DayEntry[],goal=DEFAULT_WEEKLY_WORKOUT_GOAL,today=new Date()){
  const weeklyGoal=Math.min(7,Math.max(1,Math.round(goal)))
  const counts=new Map<string,number>()
  history.forEach(entry=>{
    const date=new Date(`${entry.date}T00:00:00`)
    if(!Number.isNaN(date.getTime()))counts.set(weekKey(date),(counts.get(weekKey(date))||0)+1)
  })
  const currentWeek=weekKey(today)
  const thisWeek=counts.get(currentWeek)||0
  const cursor=new Date(`${currentWeek}T00:00:00`)
  if(thisWeek<weeklyGoal)cursor.setDate(cursor.getDate()-7)
  let currentStreak=0
  while((counts.get(weekKey(cursor))||0)>=weeklyGoal){
    currentStreak+=1
    cursor.setDate(cursor.getDate()-7)
  }
  const successful=[...counts.entries()].filter(([,count])=>count>=weeklyGoal).map(([key])=>key).sort()
  let highestStreak=0,run=0,previous=''
  successful.forEach(key=>{
    const expected=previous?new Date(`${previous}T00:00:00`):null
    if(expected)expected.setDate(expected.getDate()+7)
    run=expected&&localDateString(expected)===key?run+1:1
    highestStreak=Math.max(highestStreak,run)
    previous=key
  })
  return {thisWeek,currentStreak,highestStreak,goal:weeklyGoal}
}
