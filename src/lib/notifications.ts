export type NotificationStatus='unsupported'|'default'|'denied'|'granted'

export function notificationStatus():NotificationStatus{
  return !('Notification' in window)?'unsupported':Notification.permission
}

export async function requestNotifications():Promise<NotificationStatus>{
  if(!('Notification' in window) || !('serviceWorker' in navigator))return 'unsupported'
  return Notification.requestPermission()
}

export async function showSystemNotification(title:string,options:NotificationOptions={}){
  if(notificationStatus()!=='granted' || !('serviceWorker' in navigator))return false
  const registration=await navigator.serviceWorker.ready
  await registration.showNotification(title,{icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',...options})
  return true
}

export function isStandalone(){
  return window.matchMedia('(display-mode: standalone)').matches || ('standalone' in navigator && Boolean((navigator as Navigator&{standalone?:boolean}).standalone))
}

function urlBase64ToUint8Array(value:string){
  const padding='='.repeat((4-value.length%4)%4),base64=(value+padding).replace(/-/g,'+').replace(/_/g,'/')
  const raw=atob(base64)
  return Uint8Array.from([...raw].map(char=>char.charCodeAt(0)))
}

export async function syncPushSubscription(reminders:unknown){
  const key=import.meta.env.VITE_VAPID_PUBLIC_KEY as string|undefined
  if(!key || notificationStatus()!=='granted' || !('serviceWorker' in navigator))return
  const registration=await navigator.serviceWorker.ready
  let subscription=await registration.pushManager.getSubscription()
  if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(key)})
  const response=await fetch('/.netlify/functions/push-subscription',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({subscription,reminders,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone})})
  if(!response.ok)throw new Error('Could not save notification schedule')
}

export async function syncRestNotification(reminders:unknown,restEndsAt:number){
  if(notificationStatus()!=='granted'||!('serviceWorker' in navigator))return
  const subscription=await (await navigator.serviceWorker.ready).pushManager.getSubscription()
  if(!subscription)return
  await fetch('/.netlify/functions/push-subscription',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({subscription,reminders,restEndsAt,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone})})
}
