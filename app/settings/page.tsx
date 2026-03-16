'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Link2, Key, Webhook, Palette, Settings2,
  CheckCircle2, XCircle, Loader2, Eye, EyeOff, Save, RefreshCw, Moon, Sun,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { TopBar } from '@/components/layout/TopBar'
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

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === 'idle')    return <span className="w-4 h-4 rounded-full inline-block" style={{ background: 'var(--surface-strong)' }} />
  if (status === 'loading') return <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--text-quiet)' }} />
  if (status === 'ok')      return <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />
  return <XCircle className="w-4 h-4" style={{ color: 'var(--danger)' }} />
}

export default function SettingsPage() {
  const { settings, isLoading, saveSettings, isSaving } = useSettings()
  const { theme, setTheme } = useTheme()

  const [form, setForm] = useState({
    gatewayUrl: '',
    apiKey: '',
    webhookBaseUrl: '',
    webhookToken: '',
    appName: '',
    monthlyBudget: 100,
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [showWebhookToken, setShowWebhookToken] = useState(false)
  const [checks, setChecks] = useState<ConnectionChecks>(defaultChecks)
  const [checkMessages, setCheckMessages] = useState<Record<string, string>>({})
  const [isTesting, setIsTesting] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setForm({
        gatewayUrl:     (settings.gatewayUrl as string) ?? '',
        apiKey:         (settings.apiKey as string) ?? '',
        webhookBaseUrl: (settings.webhookBaseUrl as string) ?? '',
        webhookToken:   (settings.webhookToken as string) ?? '',
        appName:        (settings.appName as string) ?? 'OpenClaw Control',
        monthlyBudget:  (settings.monthlyBudget as number) ?? 100,
      })
    }
  }, [settings])

  const updateField = (key: keyof typeof form, value: string | number) => {
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
    setChecks({ gatewayReachable: 'loading', websocketAuthenticated: 'loading', webhookReachable: 'loading' })
    setCheckMessages({})

    await saveSettings(form)

    let connectOk = false
    try {
      const res = await fetch('/api/openclaw/connect', { method: 'POST' })
      const data: CheckResult = await res.json()
      connectOk = res.ok && data.ok
      setChecks((prev) => ({ ...prev, gatewayReachable: connectOk ? 'ok' : 'error' }))
      if (!connectOk) {
        setCheckMessages((prev) => ({ ...prev, gatewayReachable: data.message ?? 'Connection failed' }))
      }
    } catch (err) {
      setChecks((prev) => ({ ...prev, gatewayReachable: 'error' }))
      setCheckMessages((prev) => ({ ...prev, gatewayReachable: err instanceof Error ? err.message : 'Network error' }))
    }

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
      if (!wsOk)      setCheckMessages((prev) => ({ ...prev, websocketAuthenticated: data.error ?? `Status: ${data.status ?? 'unknown'}` }))
      if (!webhookOk) setCheckMessages((prev) => ({ ...prev, webhookReachable: 'Webhook endpoint not reachable' }))
    } catch {
      setChecks((prev) => ({ ...prev, websocketAuthenticated: 'error', webhookReachable: 'error' }))
    } finally {
      setIsTesting(false)
    }
  }

  const checkItems = [
    { key: 'gatewayReachable' as const,       label: 'Gateway Reachable' },
    { key: 'websocketAuthenticated' as const,  label: 'WebSocket Authenticated' },
    { key: 'webhookReachable' as const,        label: 'Webhook Reachable' },
  ]

  const inputStyle = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '14px',
    color: 'var(--text)',
    outline: 'none',
  }

  const sectionStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: 'var(--shadow-card)',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--text-muted)',
    marginBottom: '6px',
  }

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: 'var(--bg)' }}>
      <TopBar title="Settings" subtitle="Configuration & connection" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1280px] mx-auto p-8">

          <div className="mb-8 pb-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-2xl font-semibold leading-tight tracking-tight" style={{ color: 'var(--text)' }}>Settings</h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Configure gateway connection, webhooks, and appearance.
            </p>
          </div>

          <div className="max-w-2xl space-y-6">

            {/* Gateway Connection */}
            <div style={sectionStyle}>
              <div className="flex items-center gap-2 mb-5">
                <Link2 className="w-4 h-4" style={{ color: 'var(--info)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Gateway Connection</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>Gateway URL</label>
                  <input
                    type="url"
                    value={form.gatewayUrl}
                    onChange={(e) => updateField('gatewayUrl', e.target.value)}
                    placeholder="wss://your-gateway.example.com"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--info)'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={form.apiKey}
                      onChange={(e) => updateField('apiKey', e.target.value)}
                      placeholder="sk-..."
                      style={{ ...inputStyle, paddingRight: '40px' }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--info)'
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-quiet)' }}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <GlowButton
                    size="sm"
                    variant="outline"
                    onClick={handleTestConnection}
                    loading={isTesting}
                    disabled={isTesting || !form.gatewayUrl}
                    icon={<RefreshCw className="w-3.5 h-3.5" />}
                  >
                    Test Connection
                  </GlowButton>
                </div>

                <AnimatePresence>
                  {checks.gatewayReachable !== 'idle' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-1 space-y-2">
                        <p
                          className="text-[10px] font-semibold uppercase tracking-widest mb-2"
                          style={{ color: 'var(--text-quiet)' }}
                        >
                          Connection Results
                        </p>
                        {checkItems.map((item) => (
                          <div
                            key={item.key}
                            className="flex items-center gap-3 p-3 rounded-lg"
                            style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                          >
                            <StatusIcon status={checks[item.key]} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm" style={{ color: 'var(--text)' }}>{item.label}</p>
                              {checkMessages[item.key] && (
                                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-quiet)' }}>
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
              </div>
            </div>

            {/* Webhook */}
            <div style={sectionStyle}>
              <div className="flex items-center gap-2 mb-5">
                <Webhook className="w-4 h-4" style={{ color: '#7C3AED' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Webhook</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>Webhook Base URL</label>
                  <input
                    type="url"
                    value={form.webhookBaseUrl}
                    onChange={(e) => updateField('webhookBaseUrl', e.target.value)}
                    placeholder="https://your-server.example.com"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--info)'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Webhook Token</label>
                  <div className="relative">
                    <input
                      type={showWebhookToken ? 'text' : 'password'}
                      value={form.webhookToken}
                      onChange={(e) => updateField('webhookToken', e.target.value)}
                      placeholder="Optional authentication token"
                      style={{ ...inputStyle, paddingRight: '40px' }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--info)'
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)'
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowWebhookToken((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--text-quiet)' }}
                    >
                      {showWebhookToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div style={sectionStyle}>
              <div className="flex items-center gap-2 mb-5">
                <Palette className="w-4 h-4" style={{ color: '#E11D48' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Appearance</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label style={labelStyle}>App Name</label>
                  <input
                    type="text"
                    value={form.appName}
                    onChange={(e) => updateField('appName', e.target.value)}
                    placeholder="OpenClaw Control"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--info)'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <p className="mt-1.5 text-xs" style={{ color: 'var(--text-quiet)' }}>
                    Displayed in the sidebar and browser tab.
                  </p>
                </div>

                <div>
                  <label style={labelStyle}>Monthly Budget (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={form.monthlyBudget}
                    onChange={(e) => updateField('monthlyBudget', parseFloat(e.target.value) || 0)}
                    placeholder="100"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--info)'
                      e.currentTarget.style.boxShadow = '0 0 0 2px rgba(37,99,235,0.12)'
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  />
                  <p className="mt-1.5 text-xs" style={{ color: 'var(--text-quiet)' }}>
                    Shows a warning on the Usage page when projected spend exceeds this amount.
                  </p>
                </div>

                {/* Dark mode toggle */}
                <div className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Dark Mode</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Toggle the application theme</p>
                  </div>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      border: '1px solid var(--border)',
                      background: 'var(--surface-muted)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {theme === 'dark' ? (
                      <><Sun className="w-3.5 h-3.5" /><span>Light mode</span></>
                    ) : (
                      <><Moon className="w-3.5 h-3.5" /><span>Dark mode</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced */}
            <div style={sectionStyle}>
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4" style={{ color: 'var(--text-quiet)' }} />
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Advanced</h2>
              </div>
              <div className="text-sm space-y-2" style={{ color: 'var(--text-muted)' }}>
                <p>
                  Data is stored locally in a SQLite database at{' '}
                  <code
                    className="px-1.5 py-0.5 rounded text-xs font-mono"
                    style={{ background: 'var(--surface-muted)', color: 'var(--text)' }}
                  >
                    ./data/mission-control.db
                  </code>
                </p>
                <p className="text-xs">
                  Real-time events are streamed via Server-Sent Events from{' '}
                  <code
                    className="px-1.5 py-0.5 rounded text-xs font-mono"
                    style={{ background: 'var(--surface-muted)', color: 'var(--text)' }}
                  >
                    /api/openclaw/events
                  </code>
                </p>
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pb-8">
              <GlowButton
                onClick={handleSave}
                loading={isSaving}
                disabled={isSaving}
                icon={saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              >
                {saved ? 'Settings Saved!' : 'Save All Settings'}
              </GlowButton>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
