'use client'

import { useState } from 'react'
import { Plus, Clock, AlertCircle } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { TopBar } from '@/components/layout/TopBar'
import { GlowButton } from '@/components/primitives/GlowButton'
import { BlurModal } from '@/components/primitives/BlurModal'
import { HeartbeatMonitor } from '@/components/automation/HeartbeatMonitor'
import { CronTable } from '@/components/automation/CronTable'

interface NewCronForm {
  name: string
  schedule: string
  webhookPath: string
  payload: string
  enabled: boolean
}

const defaultForm: NewCronForm = {
  name: '',
  schedule: '0 * * * *',
  webhookPath: '/webhook',
  payload: '{}',
  enabled: true,
}

const inputClass = 'w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-all'

export default function AutomationPage() {
  const [newCronOpen, setNewCronOpen] = useState(false)
  const [form, setForm] = useState<NewCronForm>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [payloadError, setPayloadError] = useState<string | null>(null)

  const updateField = <K extends keyof NewCronForm>(key: K, value: NewCronForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key === 'payload') setPayloadError(null)
  }

  const validatePayload = () => {
    try {
      JSON.parse(form.payload)
      return true
    } catch {
      setPayloadError('Invalid JSON payload')
      return false
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.schedule.trim()) return
    if (!validatePayload()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          schedule: form.schedule.trim(),
          webhookPath: form.webhookPath.trim(),
          payload: JSON.parse(form.payload),
          enabled: form.enabled,
        }),
      })
      if (res.ok) {
        setForm(defaultForm)
        setNewCronOpen(false)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const commonSchedules = [
    { label: 'Every hour',       value: '0 * * * *' },
    { label: 'Every 6 hours',    value: '0 */6 * * *' },
    { label: 'Daily at midnight',value: '0 0 * * *' },
    { label: 'Every Monday 9am', value: '0 9 * * 1' },
  ]

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: 'var(--bg)' }}>
      <TopBar
        title="Automation"
        subtitle="Cron jobs & heartbeat"
        actions={
          <GlowButton
            size="sm"
            onClick={() => setNewCronOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New Cron Job
          </GlowButton>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto p-8 space-y-8">

          <div className="pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight" style={{ color: 'var(--text)' }}>Automation</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Scheduled cron jobs and real-time heartbeat monitoring.
            </p>
          </div>

          <HeartbeatMonitor />
          <CronTable />

        </div>
      </div>

      {/* New Cron Modal */}
      <BlurModal
        open={newCronOpen}
        onClose={() => {
          setNewCronOpen(false)
          setForm(defaultForm)
          setPayloadError(null)
        }}
        title="Create Cron Job"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Name <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Daily Status Report"
              className={inputClass}
              autoFocus
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Cron Schedule <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={form.schedule}
              onChange={(e) => updateField('schedule', e.target.value)}
              placeholder="* * * * *"
              className={`${inputClass} font-mono`}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {commonSchedules.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => updateField('schedule', s.value)}
                  className="text-xs px-2.5 py-1 rounded-full transition-colors"
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Webhook path */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Webhook Path
            </label>
            <input
              type="text"
              value={form.webhookPath}
              onChange={(e) => updateField('webhookPath', e.target.value)}
              placeholder="/webhook"
              className={`${inputClass} font-mono`}
            />
          </div>

          {/* Payload */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              JSON Payload
            </label>
            <textarea
              value={form.payload}
              onChange={(e) => updateField('payload', e.target.value)}
              rows={4}
              className="w-full rounded-lg px-3 py-2 text-sm font-mono focus:outline-none transition-all resize-none"
              style={{
                background: 'var(--surface)',
                border: `1px solid ${payloadError ? 'var(--danger)' : 'var(--border)'}`,
                color: 'var(--text)',
              }}
            />
            {payloadError && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: 'var(--danger)' }}>
                <AlertCircle className="w-3.5 h-3.5" />
                {payloadError}
              </div>
            )}
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateField('enabled', !form.enabled)}
              className="relative w-10 h-5 rounded-full transition-colors"
              style={{ background: form.enabled ? 'var(--accent)' : 'var(--surface-strong)' }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full shadow transition-transform"
                style={{
                  background: 'var(--surface)',
                  transform: form.enabled ? 'translateX(20px)' : 'translateX(2px)',
                }}
              />
            </button>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Enable immediately</span>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <GlowButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setNewCronOpen(false)
                setForm(defaultForm)
                setPayloadError(null)
              }}
            >
              Cancel
            </GlowButton>
            <GlowButton
              type="submit"
              size="sm"
              disabled={!form.name.trim() || !form.schedule.trim() || isSubmitting}
              loading={isSubmitting}
              icon={<Clock className="w-3.5 h-3.5" />}
            >
              Create Job
            </GlowButton>
          </div>
        </form>
      </BlurModal>
    </div>
  )
}
