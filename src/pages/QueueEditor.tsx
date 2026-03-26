import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import type { AppState } from '../lib/storage'

type SplitItem = {
  id: string
  name: string
  description?: string
}

type QueueEditorProps = {
  state: AppState
  onSave: (s:{name:string,description?:string}[])=>void
  templateDraftItems?: {name:string,description?:string}[] | null
  templateDraftToken?: number
  onTemplateDraftApplied?: () => void
}

function SortableQueueCard({
  item,
  index,
  onNameChange,
  onDescriptionChange,
  onRemove,
  canRemove,
}: {
  item: SplitItem
  index: number
  onNameChange: (id: string, value: string) => void
  onDescriptionChange: (id: string, value: string) => void
  onRemove: (id: string) => void
  canRemove: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null)
  const verticalTransform = transform ? { ...transform, x: 0 } : null
  const style = {
    transform: CSS.Transform.toString(verticalTransform),
    transition,
  }

  function resizeDescription(){
    if(!descriptionRef.current) return
    descriptionRef.current.style.height = 'auto'
    descriptionRef.current.style.height = `${descriptionRef.current.scrollHeight}px`
  }

  useEffect(()=>{
    resizeDescription()
  }, [item.description])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`w-full rounded-lg p-2 bg-white dark:bg-black border border-black/20 dark:border-white/30 ${
        isDragging ? 'border-black dark:border-white' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-0.5">
        <div className="flex items-start gap-1">
          <button
            type="button"
            className="p-1 rounded-md text-black dark:text-white disabled:opacity-40"
            aria-label="Delete split item"
            disabled={!canRemove}
            onClick={() => onRemove(item.id)}
          >
            <Trash2 size={14} />
          </button>
          <div className="text-[10px] font-medium leading-none uppercase tracking-wide text-black/60 dark:text-white/60 pt-1">Pos {index + 1}</div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1 rounded-md text-black dark:text-white touch-none select-none"
            aria-label="Drag to reorder"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={14} />
          </button>
        </div>
      </div>

      <input
        className="w-full p-2 rounded-md text-sm bg-white dark:bg-black text-black dark:text-white"
        value={item.name}
        placeholder={`Workout ${index + 1}`}
        onChange={(e) => onNameChange(item.id, e.target.value)}
      />

      <div className="my-1.5 border-t border-black/15 dark:border-white/20" />

      <textarea
        ref={descriptionRef}
        className="w-full mt-1 p-2 min-h-[84px] overflow-hidden resize-none rounded-md text-sm bg-white dark:bg-black text-black dark:text-white"
        placeholder="Exercises / notes"
        value={item.description || ''}
        onChange={(e) => {
          onDescriptionChange(item.id, e.target.value)
          resizeDescription()
        }}
      />
    </div>
  )
}

export default function QueueEditor({
  state,
  onSave,
  templateDraftItems,
  templateDraftToken,
  onTemplateDraftApplied,
}: QueueEditorProps){
  const nextId = useRef(0)
  const makeId = () => {
    nextId.current += 1
    return `queue-${nextId.current}`
  }

  const mapSplitToItems = (split: AppState['split']): SplitItem[] => {
    if (!split.length) return [{ id: makeId(), name: '', description: '' }]
    return split.map((s) => ({ id: makeId(), name: s.name, description: s.description }))
  }

  const mapListToItems = (list: {name:string,description?:string}[]): SplitItem[] => {
    if (!list.length) return [{ id: makeId(), name: '', description: '' }]
    return list.map((s) => ({ id: makeId(), name: s.name, description: s.description }))
  }

  const [items, setItems] = useState<SplitItem[]>(() => mapSplitToItems(state.split))

  useEffect(() => {
    if(!templateDraftItems || templateDraftItems.length === 0) return
    setItems(mapListToItems(templateDraftItems))
    onTemplateDraftApplied?.()
  }, [templateDraftToken])

  const stateSignature = useMemo(
    () => JSON.stringify(state.split.map((s) => ({ name: (s.name || '').trim(), description: (s.description || '').trim() }))),
    [state.split]
  )

  const draftSignature = useMemo(
    () => JSON.stringify(items.map((s) => ({ name: (s.name || '').trim(), description: (s.description || '').trim() }))),
    [items]
  )

  const isDirty = draftSignature !== stateSignature
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 180,
        tolerance: 8,
      },
    })
  )

  function updateName(id: string, value: string){
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, name: value } : x)))
  }

  function updateDescription(id: string, value: string){
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, description: value } : x)))
  }

  function addItem(){
    setItems((prev) => [...prev, { id: makeId(), name: '', description: '' }])
  }

  function removeItem(id: string){
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id)
      return next.length ? next : [{ id: makeId(), name: '', description: '' }]
    })
  }

  function handleDragEnd(event: DragEndEvent){
    const { active, over } = event
    if (!over || active.id === over.id) return
    setItems((prev) => {
      const oldIndex = prev.findIndex((x) => x.id === active.id)
      const newIndex = prev.findIndex((x) => x.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  function handleSave(){
    const cleaned = items.map(s=>({name:(s.name||'').trim(), description:(s.description||'').trim()})).filter(s=>s.name)
    if(cleaned.length===0) return alert('Add at least one split item')
    setItems(cleaned.map((s) => ({ id: makeId(), name: s.name, description: s.description })))
    onSave(cleaned)
  }

  function handleCancel(){
    setItems(mapSplitToItems(state.split))
  }

  return (
    <div className="bg-white dark:bg-black rounded-lg mb-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((x) => x.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-4 space-y-3">
            {items.map((item, i) => (
              <SortableQueueCard
                key={item.id}
                item={item}
                index={i}
                onNameChange={updateName}
                onDescriptionChange={updateDescription}
                onRemove={removeItem}
                canRemove={items.length > 1}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4">
        <button className="w-full py-3 rounded-md bg-white dark:bg-black text-black dark:text-white border border-black/15 dark:border-white/20" onClick={addItem}>Add workout</button>
      </div>

      {isDirty && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md p-3 pb-[max(12px,env(safe-area-inset-bottom))] bg-white/95 dark:bg-black/95 backdrop-blur border-t border-black/20 dark:border-white/30">
          <div className="flex gap-2">
            <button className="flex-1 py-3 rounded-md bg-white dark:bg-black text-black dark:text-white border border-black/15 dark:border-white/20" onClick={handleCancel}>Undo</button>
            <button className="flex-1 py-3 bg-black text-white dark:bg-white dark:text-black rounded-md border border-black dark:border-white" onClick={handleSave}>Save</button>
          </div>
        </div>
      )}
    </div>
  )
}
