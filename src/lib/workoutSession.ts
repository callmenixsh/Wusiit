export type PendingRest = { exerciseId:string; set:number; durationSeconds:number }
export type FeedbackCounts = { hard:number; right:number; easy:number }

export type WorkoutSession = {
  version: 1
  startedAt: number
  pausedAt: number
  pausedTotal: number
  completedExerciseIds: string[]
  activeExerciseId: string
  activeSet: number
  exerciseTimerEnd: number
  restTimerEnd: number
  pendingRest: PendingRest|null
  feedbackCounts: FeedbackCounts
}

const KEY='wusiit.workout.session.v1'

export function loadWorkoutSession():WorkoutSession|null{
  try{
    const value=JSON.parse(localStorage.getItem(KEY)||'null') as Partial<WorkoutSession>|null
    if(!value || value.version!==1 || !Number.isFinite(value.startedAt) || !value.startedAt)return null
    return {
      version:1,startedAt:Number(value.startedAt),pausedAt:Number(value.pausedAt)||0,pausedTotal:Number(value.pausedTotal)||0,
      completedExerciseIds:Array.isArray(value.completedExerciseIds)?value.completedExerciseIds.filter((id):id is string=>typeof id==='string'):[],
      activeExerciseId:typeof value.activeExerciseId==='string'?value.activeExerciseId:'',activeSet:Math.max(1,Number(value.activeSet)||1),
      exerciseTimerEnd:Number(value.exerciseTimerEnd)||0,restTimerEnd:Number(value.restTimerEnd)||0,
      pendingRest:value.pendingRest&&typeof value.pendingRest.exerciseId==='string'?value.pendingRest as PendingRest:null,
      feedbackCounts:{hard:Number(value.feedbackCounts?.hard)||0,right:Number(value.feedbackCounts?.right)||0,easy:Number(value.feedbackCounts?.easy)||0},
    }
  }catch{return null}
}

export function saveWorkoutSession(session:WorkoutSession|null){
  if(session)localStorage.setItem(KEY,JSON.stringify(session));else localStorage.removeItem(KEY)
}

export function clearLegacyWorkoutSession(){
  ['wusiit.workout.timerEnd','wusiit.workout.startedAt','wusiit.workout.pausedAt','wusiit.workout.pausedTotal','wusiit.workout.completed','wusiit.workout.activeExercise','wusiit.workout.exerciseTimerEnd','wusiit.workout.feedback'].forEach(key=>localStorage.removeItem(key))
}
