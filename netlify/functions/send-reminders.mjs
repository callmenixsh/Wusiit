import { getStore } from '@netlify/blobs'
import webpush from 'web-push'
import { nextOccurrence } from './reminder-utils.mjs'

export default async()=>{
  const {VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY,VAPID_SUBJECT='mailto:admin@example.com'}=process.env
  if(!VAPID_PUBLIC_KEY||!VAPID_PRIVATE_KEY)return new Response('VAPID keys are not configured',{status:503})
  webpush.setVapidDetails(VAPID_SUBJECT,VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY)
  const store=getStore('push-subscriptions'),now=Date.now()
  let cursor
  do{
    const page=await store.list({paginate:true,cursor})
    for(const blob of page.blobs){
      const record=await store.get(blob.key,{type:'json'})
      if(!record)continue
      const due=[]
      if(record.nextRestAt&&record.nextRestAt<=now)due.push({kind:'rest',payload:{title:'Rest complete',body:'Your next set is ready.',tag:'rest-timer',url:'/?action=workout'}})
      if(record.nextWorkoutAt&&record.nextWorkoutAt<=now)due.push({kind:'workout',payload:{title:'Workout reminder',body:"It's time for your scheduled workout.",tag:'workout-reminder',url:'/?action=workout'}})
      if(record.nextWeighInAt&&record.nextWeighInAt<=now)due.push({kind:'weighIn',payload:{title:'Weekly weigh-in',body:'Keep your weight trend up to date.',tag:'weigh-in-reminder',url:'/?action=weigh-in'}})
      for(const item of due){
        try{await webpush.sendNotification(record.subscription,JSON.stringify(item.payload))}
        catch(error){if(error.statusCode===404||error.statusCode===410){await store.delete(blob.key);break}console.error(error)}
        if(item.kind==='workout')record.nextWorkoutAt=nextOccurrence(record.reminders.workout,record.timeZone,now+60000)
        else if(item.kind==='weighIn')record.nextWeighInAt=nextOccurrence(record.reminders.weighIn,record.timeZone,now+60000)
        else record.nextRestAt=null
      }
      if(due.length)await store.setJSON(blob.key,{...record,updatedAt:now})
    }
    cursor=page.next_cursor
  }while(cursor)
  return Response.json({ok:true})
}
