'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Task, CreateTaskInput, UpdateTaskInput } from '@/lib/openclaw/types'

async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks')
  if (!res.ok) throw new Error('Failed to fetch tasks')
  return res.json()
}

async function createTaskFn(input: CreateTaskInput): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to create task')
  return res.json()
}

async function updateTaskFn(input: UpdateTaskInput): Promise<Task> {
  const res = await fetch(`/api/tasks/${input.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error('Failed to update task')
  return res.json()
}

async function deleteTaskFn(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete task')
}

export function useTasks() {
  return useQuery({ queryKey: ['tasks'], queryFn: fetchTasks })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createTaskFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateTaskFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTaskFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
