'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Link2,
  Key,
  Webhook,
  Palette,
  Settings2,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
} from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { GlassPanel } from '@/components/primitives/GlassPanel'
import { GlowButton } from '@/components/primitives/GlowButton'
import { useSettings } from '@/hooks/useSettings'

type CheckStatus = 'idle' | 'loading' | 'ok' | 'error'

interface ConnectionChecks {
  gatewayReachable: CheckStatus
  websocketAuthenticated: CheckStatus
  webhookReachable: CheckStatus
}

interface CheckResult {
  ok: boolean
  message?: string
}

const defaultChecks: ConnectionChecks = {
  gatewayReachable: 'idle',
  websocketAuthenticated: 'idle',
  webhookReachable: 'idle',
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

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'idle') return <span className="w-4 h-4 rounded-full bg-white/10 inline-block" />
  if (status === 'loading') return <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
  if (status === 'ok') return <CheckCircle2 className="w-4 h-4 text-status-online" />
  return <XCircle className="w-4 h-4 text-status-error" />
}

export default function SettingsPage() {
  const { settings, isLoading, saveSettings, isSaving } = useSettings()

  const [form, setForm] = useState({
    gatewayUrl: '',
    apiKey: '',
    webhookBaseUrl: '',
    webhookToken: '',
    appName: '',
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [showWebhookToken, setShowWebhookToken] = useState(false)
  const [checks, setChecks] = useState<ConnectionChecks>(defaultChecks)
  const [checkMessages, setCheckMessages] = useState<Record<string, string>>({})
  const [isTesting, setIsTesting] = useState(false)
  const [saved, setSaved] = useState(false)

  // Populate form from fetched settings
  useEffect(() => {
    if (settings) {
      setForm({
        gatewayUrl: (settings.gatewayUrl as string) ?? '',
        apiKey: (settings.apiKey as string) ?? '',
        webhookBaseUrl: (settings.webhookBaseUrl as string) ?? '',
        webhookToken: (settings.webhookToken as string) ?? '',
        appName: (settings.appName as string) ?? 'Mission Control',
      })
    }
  }, [settings])

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    await saveSettings(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setChecks({
      gatewayReachable: 'loading',
      websocketAuthenticated: 'loading',
      webhookReachable: 'loading',
    })
    setCheckMessages({})

    // First save current settings
    await saveSettings(form)

    // Step 1: POST /api/openclaw/connect
    let connectOk = false
    try {
      const res = await fetch('/api/openclaw/connect', { method: 'POST' })
      const data: CheckResult = await res.json()
      connectOk = res.ok && data.ok
      setChecks((prev) => ({ ...prev, gatewayReachable: connectOk ? 'ok' : 'error' }))
      if (!connectOk) {
        setCheckMessages((prev) => ({
          ...prev,
          gatewayReachable: data.message ?? 'Connection failed',
        }))
      }
    } catch (err) {
      setChecks((prev) => ({ ...prev, gatewayReachable: 'error' }))
      setCheckMessages((prev) => ({
        ...prev,
        gatewayReachable: err instanceof Error ? err.message : 'Network error',
      }))
    }

    // Step 2: GET /api/openclaw/status
    try {
      const res = await fetch('/api/openclaw/status')
      const data = await res.json()
      const wsOk = data.status === 'connected'
      const webhookOk = data.webhookReachable === true

      setChecks((prev) => ({
        ...prev,
        websocketAuthenticated: wsOk ? 'ok' : 'error',
        webhookReachable: webhookOk ? 'ok' : 'error',
      }))
      if (!wsOk) {
        setCheckMessages((prev) => ({
          ...prev,
          websocketAuthenticated: data.error ?? `Status: ${data.status ?? 'unknown'}`,
        }))
      }
      if (!webhookOk) {
        setCheckMessages((prev) => ({
          ...prev,
          webhookReachable: 'Webhook endpoint not reachable',
        }))
      }
    } catch (err) {
      setChecks((prev) => ({
        ...prev,
        websocketAuthenticated: 'error',
        webhookReachable: 'error',
      }))
    } finally {
      setIsTesting(false)
    }
  }

  const checkItems = [
    { key: 'gatewayReachable', label: 'Gateway Reachable' },
    { key: 'websocketAuthenticated', label: 'WebSocket Authenticated' },
    { key: 'webhookReachable', label: 'Webhook Reachable' },
  ] as const

  const inputClass =
    'w-full bg-surface-2 border border-white/[0.12] rounded-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors'
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5'

  return (
    <div className="flex flex-col h-full min-h-0">
      <TopBar
        title="Settings"
        subtitle="Configuration & connection"
        actions={
          <GlowButton
            size="sm"
            onClick={handleSave}
            loading={isSaving}
            disabled={isSaving}
            icon={saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          >
            {saved ? 'Saved!' : 'Save Settings'}
          </GlowButton>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          className="max-w-2xl space-y-5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Gateway Connection */}
          <motion.div variants={itemVariants}>
            <GlassPanel className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Gateway Connection</h2>
              </div>

              <div>
                <label className={labelClass}>Gateway URL</label>
                <input
                  type="url"
                  value={form.gatewayUrl}
                  onChange={(e) => updateField('gatewayUrl', e.target.value)}
                  placeholder="wss://your-gateway.example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>API Key</label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={form.apiKey}
                    onChange={(e) => updateField('apiKey', e.target.value)}
                    placeholder="sk-..."
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <GlowButton
                  size="sm"
                  onClick={handleTestConnection}
                  loading={isTesting}
                  disabled={isTesting || !form.gatewayUrl}
                  icon={<RefreshCw className="w-4 h-4" />}
                >
                  Test Connection
                </GlowButton>
              </div>

              {/* Connection test results */}
              <AnimatePresence>
                {checks.gatewayReachable !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Connection Results
                      </p>
                      {checkItems.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center gap-3 p-3 rounded-card bg-surface-2/60 border border-white/[0.07]"
                        >
                          <StatusIcon status={checks[item.key]} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{item.label}</p>
                            {checkMessages[item.key] && (
                              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {checkMessages[item.key]}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassPanel>
          </motion.div>

          {/* Webhook */}
          <motion.div variants={itemVariants}>
            <GlassPanel className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Webhook className="w-4 h-4 text-secondary" />
                <h2 className="text-sm font-semibold text-foreground">Webhook</h2>
              </div>

              <div>
                <label className={labelClass}>Webhook Base URL</label>
                <input
                  type="url"
                  value={form.webhookBaseUrl}
                  onChange={(e) => updateField('webhookBaseUrl', e.target.value)}
                  placeholder="https://your-server.example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Webhook Token</label>
                <div className="relative">
                  <input
                    type={showWebhookToken ? 'text' : 'password'}
                    value={form.webhookToken}
                    onChange={(e) => updateField('webhookToken', e.target.value)}
                    placeholder="Optional authentication token"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowWebhookToken((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showWebhookToken ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </GlassPanel>
          </motion.div>

          {/* Appearance */}
          <motion.div variants={itemVariants}>
            <GlassPanel className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Palette className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
              </div>

              <div>
                <label className={labelClass}>App Name</label>
                <input
                  type="text"
                  value={form.appName}
                  onChange={(e) => updateField('appName', e.target.value)}
                  placeholder="Mission Control"
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Displayed in the sidebar and browser tab.
                </p>
              </div>
            </GlassPanel>
          </motion.div>

          {/* Advanced */}
          <motion.div variants={itemVariants}>
            <GlassPanel className="p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="w-4 h-4 text-secondary" />
                <h2 className="text-sm font-semibold text-foreground">Advanced</h2>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  Data is stored locally in a SQLite database at{' '}
                  <code className="px-1.5 py-0.5 rounded bg-surface-3 text-xs font-mono text-foreground">
                    ./data/mission-control.db
                  </code>
                  .
                </p>
                <p className="text-xs mt-2">
                  Real-time events are streamed via Server-Sent Events from{' '}
                  <code className="px-1.5 py-0.5 rounded bg-surface-3 text-xs font-mono text-foreground">
                    /api/openclaw/events
                  </code>
                  .
                </p>
              </div>
            </GlassPanel>
          </motion.div>

          {/* Save button (bottom) */}
          <motion.div variants={itemVariants} className="flex justify-end pb-6">
            <GlowButton
              onClick={handleSave}
              loading={isSaving}
              disabled={isSaving}
              icon={saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            >
              {saved ? 'Settings Saved!' : 'Save All Settings'}
            </GlowButton>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
