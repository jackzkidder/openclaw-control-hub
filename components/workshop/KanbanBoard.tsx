'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, LayoutKanban, ChevronDown } from 'lucide-react'

import type { Task, TaskStatus, TaskPriority, CreateTaskInput } from '@/lib/openclaw/types'
import { useTasks, useUpdateTask, useCreateTask } from '@/hooks/useTasks'
import { GlassPanel } from '@/components/primitives/GlassPanel'
import { TaskCard } from '@/components/cards/TaskCard'
import { GlowButton } from '@/components/primitives/GlowButton'
import { BlurModal } from '@/components/primitives/BlurModal'

// ─── Column configuration ─────────────────────────────────────────────────────

interface ColumnConfig {
  id: TaskStatus
  label: string
  color: string
  headerColor: string
}

const COLUMNS: ColumnConfig[] = [
  { id: 'backlog',     label: 'Backlog',     color: 'border-slate-500/20',  headerColor: 'bg-slate-500/10 text-slate-400' },
  { id: 'todo',        label: 'To Do',       color: 'border-blue-500/20',   headerColor: 'bg-blue-500/10 text-blue-400' },
  { id: 'in_progress', label: 'In Progress', color: 'border-primary/20',    headerColor: 'bg-primary/10 text-primary' },
  { id: 'review',      label: 'Review',      color: 'border-violet-500/20', headerColor: 'bg-violet-500/10 text-violet-400' },
  { id: 'done',        label: 'Done',        color: 'border-emerald-500/20',headerColor: 'bg-emerald-500/10 text-emerald-400' },
]

// ─── Sortable Task Item ───────────────────────────────────────────────────────

interface SortableTaskItemProps {
  task: Task
  onSelect: (task: Task) => void
}

function SortableTaskItem({ task, onSelect }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} onClick={() => onSelect(task)} isDragging={isDragging} />
    </div>
  )
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  config: ColumnConfig
  tasks: Task[]
  onSelect: (task: Task) => void
}

function KanbanColumn({ config, tasks, onSelect }: KanbanColumnProps) {
  const taskIds = tasks.map((t) => t.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col min-w-[260px] max-w-[300px] flex-1"
    >
      <GlassPanel
        noPadding
        className={`flex flex-col h-full border ${config.color} hover:border-opacity-40 transition-colors`}
      >
        {/* Column header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.headerColor}`}>
              {config.label}
            </span>
          </div>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {tasks.length}
          </span>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-3 min-h-[120px]">
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {tasks.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center h-20 border border-dashed border-white/[0.06] rounded-lg"
                >
                  <p className="text-xs text-muted-foreground/40">Drop here</p>
                </motion.div>
              ) : (
                tasks.map((task) => (
                  <SortableTaskItem key={task.id} task={task} onSelect={onSelect} />
                ))
              )}
            </AnimatePresence>
          </SortableContext>
        </div>
      </GlassPanel>
    </motion.div>
  )
}

// ─── Create Task Modal ────────────────────────────────────────────────────────

interface CreateTaskModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (input: CreateTaskInput) => void
  isLoading: boolean
}

function CreateTaskModal({ open, onClose, onSubmit, isLoading }: CreateTaskModalProps) {
  const [title, setTitle]                   = useState('')
  const [description, setDescription]       = useState('')
  const [priority, setPriority]             = useState<TaskPriority>('medium')
  const [assignedAgentId, setAssignedAgent] = useState('')
  const [status, setStatus]                 = useState<TaskStatus>('backlog')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onSubmit({
      title:           title.trim(),
      description:     description.trim() || undefined,
      priority,
      status,
      assignedAgentId: assignedAgentId.trim() || undefined,
    })
    // Reset fields
    setTitle('')
    setDescription('')
    setPriority('medium')
    setAssignedAgent('')
    setStatus('backlog')
  }

  const inputClass =
    'w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:bg-white/[0.06] transition-all'

  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5'

  return (
    <BlurModal
      open={open}
      onClose={onClose}
      title="New Task"
      description="Add a task to your kanban board"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className={labelClass}>Title *</label>
          <input
            className={inputClass}
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={`${inputClass} resize-none`}
            placeholder="Optional details…"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Priority + Status row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Priority</label>
            <div className="relative">
              <select
                className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Initial Status</label>
            <div className="relative">
              <select
                className={`${inputClass} appearance-none pr-8 cursor-pointer`}
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
              >
                {COLUMNS.map((col) => (
                  <option key={col.id} value={col.id}>{col.label}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Assigned Agent */}
        <div>
          <label className={labelClass}>Assigned Agent ID</label>
          <input
            className={inputClass}
            placeholder="e.g. main, agent-abc123"
            value={assignedAgentId}
            onChange={(e) => setAssignedAgent(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
          <GlowButton type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </GlowButton>
          <GlowButton
            type="submit"
            variant="primary"
            size="sm"
            loading={isLoading}
            disabled={!title.trim() || isLoading}
          >
            Create Task
          </GlowButton>
        </div>
      </form>
    </BlurModal>
  )
}

// ─── KanbanBoard ──────────────────────────────────────────────────────────────

interface KanbanBoardProps {
  onTaskSelect?: (task: Task) => void
}

export function KanbanBoard({ onTaskSelect }: KanbanBoardProps) {
  const { data: tasks = [], isLoading } = useTasks()
  const updateTask = useUpdateTask()
  const createTask = useCreateTask()

  const [activeTaskId, setActiveTaskId]     = useState<string | null>(null)
  const [createModalOpen, setCreateModal]   = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  // Group tasks by status, sorted by columnOrder
  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      backlog: [], todo: [], in_progress: [], review: [], done: [], cancelled: [],
    }
    for (const task of tasks) {
      if (map[task.status]) {
        map[task.status].push(task)
      }
    }
    // Sort each column by columnOrder
    for (const col of Object.keys(map) as TaskStatus[]) {
      map[col].sort((a, b) => a.columnOrder - b.columnOrder)
    }
    return map
  }, [tasks])

  const activeTask = useMemo(
    () => (activeTaskId ? tasks.find((t) => t.id === activeTaskId) ?? null : null),
    [activeTaskId, tasks]
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id))
  }

  function handleDragOver(_event: DragOverEvent) {
    // Optimistic column preview can be added here
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTaskId(null)

    if (!over || active.id === over.id) return

    const draggedTask = tasks.find((t) => t.id === active.id)
    if (!draggedTask) return

    // Determine the target column: over.id can be a column id or task id
    const targetColumnId = COLUMNS.find((c) => c.id === over.id)?.id
      ?? tasks.find((t) => t.id === over.id)?.status

    if (!targetColumnId || targetColumnId === draggedTask.status) return

    updateTask.mutate({
      id:     draggedTask.id,
      status: targetColumnId,
    })
  }

  function handleCreateTask(input: CreateTaskInput) {
    createTask.mutate(input, {
      onSuccess: () => setCreateModal(false),
    })
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Board header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <LayoutKanban size={15} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Kanban Board</h2>
          {isLoading && (
            <span className="text-xs text-muted-foreground animate-pulse">Loading…</span>
          )}
          {!isLoading && (
            <span className="text-xs text-muted-foreground">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <GlowButton
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setCreateModal(true)}
        >
          New Task
        </GlowButton>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              config={col}
              tasks={tasksByStatus[col.id]}
              onSelect={(task) => onTaskSelect?.(task)}
            />
          ))}
        </div>

        {/* Drag overlay — renders the card being dragged */}
        <DragOverlay dropAnimation={{ duration: 200, easing: 'ease' }}>
          {activeTask ? (
            <div className="rotate-1 opacity-90 pointer-events-none">
              <TaskCard task={activeTask} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Task Modal */}
      <CreateTaskModal
        open={createModalOpen}
        onClose={() => setCreateModal(false)}
        onSubmit={handleCreateTask}
        isLoading={createTask.isPending}
      />
    </div>
  )
}
