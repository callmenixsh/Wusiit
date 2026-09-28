export type WarmupStep={name:string;amount:string;detail:string}

export const WARMUP_AREAS=['Lower body','Upper body','Core','Full body']

export const WARMUP_AREA_STEPS:Record<string,WarmupStep[]>={
  'Lower body':[
    {name:'Bodyweight squats',amount:'10 reps',detail:'Stand with your feet about shoulder width apart. Push your hips back like you are sitting into a chair, then stand back up. Let your knees point the same way as your toes.'},
    {name:'Reverse lunges',amount:'8 each leg',detail:'Step one foot back and lower yourself until both knees are bent. Push through the heel of your front foot to stand back up, then do the other leg.'},
    {name:'Glute bridges',amount:'12 reps',detail:'Lie on your back with your knees bent and feet flat on the floor. Squeeze your butt to lift your hips up, hold for a second, then lower back down slowly.'},
    {name:'Calf raises',amount:'15 reps',detail:'Stand up straight and lift your heels off the floor as high as you can go. Hold a second, then lower your heels back down slowly.'},
  ],
  'Upper body':[
    {name:'Arm circles',amount:'10 each way',detail:'Stretch your arms out to the sides and draw small circles in the air. Make the circles bigger as you go, and switch direction halfway.'},
    {name:'Wall push-ups',amount:'10 reps',detail:'Put both hands on a wall at chest height. Bend your elbows to bring your chest closer to the wall, then push back out until your arms are straight.'},
    {name:'Band pull-aparts',amount:'15 reps',detail:'Hold a resistance band in front of you at shoulder height with your arms straight. Slowly pull it apart until your hands are wide, then slowly let it back together.'},
    {name:'Shoulder rotations',amount:'10 reps',detail:'Roll your shoulders up, then back, then down, in one slow circle. Keep the circle smooth and do not force it.'},
  ],
  'Core':[
    {name:'Dead bugs',amount:'8 each side',detail:'Lie on your back with your arms pointing at the ceiling and your knees bent above your hips. Slowly lower one arm and the opposite leg toward the floor while keeping your lower back flat on the floor, then switch sides.'},
    {name:'Forearm plank',amount:'30 sec',detail:'Rest on your forearms with your elbows directly under your shoulders. Squeeze your stomach so your body makes one straight line, and hold still.'},
    {name:'Bird dogs',amount:'8 each side',detail:'Start on your hands and knees. At the same time, stretch one arm forward and the opposite leg back until both are level with the floor. Hold a second, then put them back down and switch sides.'},
    {name:'Side plank',amount:'20 sec each side',detail:'Lie on one side, resting on your forearm, with your feet stacked on top of each other. Lift your hips up so your body makes a straight line, hold, then switch sides.'},
  ],
  'Full body':[
    {name:'March in place',amount:'30 sec',detail:'Stand tall and march on the spot, bringing your knees up and swinging the opposite arm. Stay relaxed and light on your feet.'},
    {name:'Jumping jacks',amount:'20 reps',detail:'Jump your feet out wide while swinging your arms over your head, then jump back to the start. Keep your landings soft and quiet.'},
    {name:'Bodyweight squats',amount:'10 reps',detail:'Stand with your feet about shoulder width apart. Push your hips back like you are sitting into a chair, then stand back up. Let your knees point the same way as your toes.'},
    {name:'Incline push-ups',amount:'8 reps',detail:'Put both hands on a bench, counter, or step. Bend your elbows to lower your chest down toward it, then push back up until your arms are straight.'},
    {name:'Dead bugs',amount:'8 each side',detail:'Lie on your back with your arms pointing at the ceiling and your knees bent above your hips. Slowly lower one arm and the opposite leg toward the floor while keeping your lower back flat on the floor, then switch sides.'},
  ],
}

export const DEFAULT_WARMUP_STEPS:WarmupStep[]=[
  {name:'March in place',amount:'30 sec',detail:'Stand tall and march on the spot, bringing your knees up and swinging the opposite arm.'},
  {name:'Arm circles',amount:'10 each way',detail:'Stretch your arms out to the sides and draw slow circles in the air, making them bigger as you go.'},
  {name:'Joint mobility flow',amount:'30 sec',detail:'Move your joints slowly through a comfortable range. Roll your shoulders, circle your hips, and bend your knees. Go slow and never push into pain.'},
]

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
