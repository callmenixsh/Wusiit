import React, { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

type Props={open:boolean;title:string;description?:string;onClose:()=>void;children?:React.ReactNode;closeLabel?:string}

export default function Modal({open,title,description,onClose,children,closeLabel='Close dialog'}:Props){
  const titleId=useId(),descriptionId=useId(),panel=useRef<HTMLDivElement>(null),closeRef=useRef(onClose)
  closeRef.current=onClose
  useEffect(()=>{
    if(!open)return
    const previous=document.activeElement as HTMLElement|null
    const frame=requestAnimationFrame(()=>panel.current?.querySelector<HTMLElement>('input, textarea, select, button')?.focus())
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape')closeRef.current()}
    document.addEventListener('keydown',key)
    const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden'
    return()=>{cancelAnimationFrame(frame);document.removeEventListener('keydown',key);document.body.style.overflow=oldOverflow;previous?.focus()}
  },[open])
  if(!open)return null
  return <div className="fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center" role="presentation">
    <button type="button" aria-label={closeLabel} className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose}/>
    <div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description?descriptionId:undefined} className="relative w-full max-w-sm rounded-2xl border border-black/15 bg-white p-5 text-black shadow-2xl dark:border-white/20 dark:bg-neutral-950 dark:text-white">
      <div className="flex items-start gap-3"><div className="min-w-0 flex-1"><h2 id={titleId} className="text-lg font-bold">{title}</h2>{description&&<p id={descriptionId} className="mt-1 text-sm leading-relaxed text-black/55 dark:text-white/55">{description}</p>}</div><button type="button" onClick={onClose} aria-label={closeLabel} className="rounded-full p-1.5 text-black/45 hover:bg-black/5 dark:text-white/45 dark:hover:bg-white/10"><X size={18}/></button></div>
      {children&&<div className="mt-5">{children}</div>}
    </div>
  </div>
}

export function DialogActions({children}:{children:React.ReactNode}){return <div className="flex gap-2">{children}</div>}
export const secondaryButton='min-h-11 flex-1 rounded-xl border border-black/15 px-4 text-sm font-semibold dark:border-white/20'
export const primaryButton='min-h-11 flex-1 rounded-xl bg-black px-4 text-sm font-semibold text-white dark:bg-white dark:text-black'
export const dangerButton='min-h-11 flex-1 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white dark:bg-red-600'
