'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Clock, AlarmClock, AlertCircle } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { GlowButton } from '@/components/primitives/GlowButton'
import { BlurModal } from '@/components/primitives/BlurModal'
import { GlassPanel } from '@/components/primitives/GlassPanel'
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] } },
}

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
    { label: 'Every hour', value: '0 * * * *' },
    { label: 'Every 6 hours', value: '0 */6 * * *' },
    { label: 'Daily at midnight', value: '0 0 * * *' },
    { label: 'Every Monday 9am', value: '0 9 * * 1' },
  ]

  const actions = (
    <GlowButton
      size="sm"
      onClick={() => setNewCronOpen(true)}
      icon={<Plus className="w-4 h-4" />}
    >
      New Cron Job
    </GlowButton>
  )

  return (
    <div className="flex flex-col h-full min-h-0">
      <TopBar title="Automation" subtitle="Cron jobs & heartbeat" actions={actions} />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Heartbeat monitor */}
          <motion.div variants={itemVariants}>
            <HeartbeatMonitor />
          </motion.div>

          {/* Cron table */}
          <motion.div variants={itemVariants}>
            <CronTable />
          </motion.div>
        </motion.div>
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
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Name <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g. Daily Status Report"
              className="w-full bg-surface-2 border border-white/[0.12] rounded-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
              autoFocus
            />
          </div>

          {/* Schedule */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Cron Schedule <span className="text-status-error">*</span>
            </label>
            <input
              type="text"
              value={form.schedule}
              onChange={(e) => updateField('schedule', e.target.value)}
              placeholder="* * * * *"
              className="w-full bg-surface-2 border border-white/[0.12] rounded-card px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {commonSchedules.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => updateField('schedule', s.value)}
                  className="text-xs px-2 py-1 rounded-full bg-surface-3 border border-white/[0.07] text-muted-foreground hover:text-foreground hover:border-white/[0.12] transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Webhook path */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Webhook Path
            </label>
            <input
              type="text"
              value={form.webhookPath}
              onChange={(e) => updateField('webhookPath', e.target.value)}
              placeholder="/webhook"
              className="w-full bg-surface-2 border border-white/[0.12] rounded-card px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>

          {/* Payload */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              JSON Payload
            </label>
            <textarea
              value={form.payload}
              onChange={(e) => updateField('payload', e.target.value)}
              rows={4}
              className={`w-full bg-surface-2 border rounded-card px-3 py-2 text-sm text-foreground font-mono placeholder:text-muted-foreground focus:outline-none transition-colors resize-none ${
                payloadError
                  ? 'border-status-error/50 focus:border-status-error focus:ring-1 focus:ring-status-error/20'
                  : 'border-white/[0.12] focus:border-primary/50 focus:ring-1 focus:ring-primary/20'
              }`}
            />
            {payloadError && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-status-error">
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
              className={`relative w-10 h-5 rounded-full transition-colors ${
                form.enabled ? 'bg-primary' : 'bg-surface-3'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  form.enabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground">Enable immediately</span>
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
              icon={<Clock className="w-4 h-4" />}
            >
              Create Job
            </GlowButton>
          </div>
        </form>
      </BlurModal>
    </div>
  )
}
