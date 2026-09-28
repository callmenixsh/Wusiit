import { createHash } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import { nextOccurrence } from './reminder-utils.mjs'

export default async request=>{
  if(request.method!=='POST')return new Response('Method not allowed',{status:405})
  try{
    const {subscription,reminders,timeZone,restEndsAt}=await request.json()
    if(!subscription?.endpoint||!reminders||typeof timeZone!=='string')return new Response('Invalid subscription',{status:400})
    const id=createHash('sha256').update(subscription.endpoint).digest('hex')
    const existing=await getStore('push-subscriptions').get(id,{type:'json'})
    const record={subscription,reminders,timeZone,nextWorkoutAt:nextOccurrence(reminders.workout,timeZone),nextWeighInAt:nextOccurrence(reminders.weighIn,timeZone),nextRestAt:restEndsAt===undefined?(existing?.nextRestAt||null):(Number(restEndsAt)||null),updatedAt:Date.now()}
    await getStore('push-subscriptions').setJSON(id,record)
    return Response.json({ok:true})
  }catch(error){console.error(error);return new Response('Could not save subscription',{status:500})}
}
