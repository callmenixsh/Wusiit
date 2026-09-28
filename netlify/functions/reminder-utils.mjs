export function nextOccurrence(schedule,timeZone,after=Date.now()){
  if(!schedule?.enabled)return null
  const [hour,minute]=String(schedule.time||'00:00').split(':').map(Number)
  const formatter=new Intl.DateTimeFormat('en-US',{timeZone,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
  const weekdayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const wanted=Array.isArray(schedule.weekdays)?schedule.weekdays:[schedule.weekday]
  const cursor=Math.floor(after/60000)*60000+60000
  for(let value=cursor;value<=cursor+8*86400000;value+=60000){
    const parts=Object.fromEntries(formatter.formatToParts(value).map(part=>[part.type,part.value]))
    if(wanted.includes(weekdayNames.indexOf(parts.weekday))&&Number(parts.hour)===hour&&Number(parts.minute)===minute)return value
  }
  return null
}
