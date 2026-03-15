'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '@/components/primitives/GlassPanel';
import { formatRelativeTime, formatDateTime } from '@/lib/utils/formatters';
import { useHeartbeat } from '@/store/useAppStore';

function StatCard({
  label,
  value,
  icon,
  accent = 'primary',
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: 'primary' | 'secondary' | 'online' | 'warning';
}) {
  const accentClasses: Record<string, string> = {
    primary: 'text-primary bg-primary/5 border-primary/10',
    secondary: 'text-secondary bg-secondary/5 border-secondary/10',
    online: 'text-status-online bg-status-online/5 border-status-online/10',
    warning: 'text-status-warning bg-status-warning/5 border-status-warning/10',
  };

  return (
    <div className="flex flex-col gap-2 p-3 rounded-card bg-white/[0.03] border border-white/[0.07]">
      <div className={`w-7 h-7 rounded-card flex items-center justify-center border ${accentClasses[accent]}`}>
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold text-white leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}

function HeartbeatWave({ beats }: { beats: number[] }) {
  const width = 200;
  const height = 48;
  const points = beats
    .map((v, i) => {
      const x = (i / (beats.length - 1)) * width;
      const y = height / 2 - (v * height) / 2.5;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-12"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.8" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke="url(#waveGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      />
    </svg>
  );
}

const BEAT_HISTORY_LENGTH = 30;

export function HeartbeatMonitor() {
  const heartbeat = useHeartbeat();
  const pulseControls = useAnimation();
  const ringControls = useAnimation();
  const prevHeartbeatRef = useRef<number | null>(null);
  const [beatHistory, setBeatHistory] = useState<number[]>(() => Array(BEAT_HISTORY_LENGTH).fill(0));
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live counter — ticks every second
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!heartbeat?.lastHeartbeatAt) return;

    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(heartbeat.lastHeartbeatAt).getTime()) / 1000);
      setElapsedSeconds(diff);
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [heartbeat?.lastHeartbeatAt]);

  // Pulse animation triggered by heartbeat changes
  useEffect(() => {
    const ts = heartbeat?.lastHeartbeatAt
      ? new Date(heartbeat.lastHeartbeatAt).getTime()
      : null;

    if (ts !== null && ts !== prevHeartbeatRef.current) {
      prevHeartbeatRef.current = ts;

      // Update beat history with a spike
      setBeatHistory((prev) => {
        const next = [...prev.slice(1), 1];
        // Decay the spike over the next few ticks visually
        return next;
      });

      // Animate the central pulse dot
      pulseControls.start({
        scale: [1, 1.8, 1],
        opacity: [1, 0.6, 1],
        transition: { duration: 0.5, ease: 'easeOut' },
      });

      // Animate the outer ring
      ringControls.start({
        scale: [1, 2.4],
        opacity: [0.6, 0],
        transition: { duration: 0.8, ease: 'easeOut' },
      });
    } else {
      // Decay the latest beat spike back to baseline
      setBeatHistory((prev) => {
        const last = prev[prev.length - 1];
        if (last > 0) {
          return [...prev.slice(1), Math.max(0, last - 0.15)];
        }
        return prev;
      });
    }
  }, [heartbeat?.lastHeartbeatAt, pulseControls, ringControls]);

  const isStale = elapsedSeconds > 30;
  const statusColor = !heartbeat
    ? 'text-muted-foreground'
    : isStale
    ? 'text-status-warning'
    : 'text-status-online';

  return (
    <GlassPanel className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-sm font-semibold text-white">Heartbeat Monitor</h2>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${statusColor}`}>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              !heartbeat
                ? 'bg-muted-foreground'
                : isStale
                ? 'bg-status-warning animate-pulse'
                : 'bg-status-online animate-pulse'
            }`}
          />
          {!heartbeat ? 'No signal' : isStale ? 'Stale' : 'Live'}
        </div>
      </div>

      {/* Central pulse visualizer */}
      <div className="flex items-center justify-center py-4">
        <div className="relative flex items-center justify-center">
          {/* Outer ring */}
          <motion.div
            animate={ringControls}
            className="absolute w-10 h-10 rounded-full border border-status-online/40"
            style={{ originX: '50%', originY: '50%' }}
          />
          {/* Middle ring */}
          <motion.div
            animate={ringControls}
            className="absolute w-8 h-8 rounded-full border border-status-online/20"
            style={{ originX: '50%', originY: '50%' }}
            transition={{ delay: 0.1 }}
          />
          {/* Center dot */}
          <motion.div
            animate={pulseControls}
            className={`w-4 h-4 rounded-full ${
              !heartbeat
                ? 'bg-muted-foreground/40'
                : isStale
                ? 'bg-status-warning'
                : 'bg-status-online'
            } shadow-lg`}
            style={{ originX: '50%', originY: '50%' }}
          />
        </div>

        {/* Waveform */}
        <div className="flex-1 ml-6 text-primary">
          <HeartbeatWave beats={beatHistory} />
        </div>
      </div>

      {/* Last heartbeat timestamp */}
      <div className="flex flex-col items-center gap-0.5 -mt-2">
        {heartbeat?.lastHeartbeatAt ? (
          <>
            <p className="text-xs text-muted-foreground">
              Last heartbeat: <span className="text-white/80">{formatDateTime(heartbeat.lastHeartbeatAt)}</span>
            </p>
            <p className={`text-xs font-medium ${statusColor}`}>
              {elapsedSeconds < 5
                ? 'Just now'
                : `${elapsedSeconds}s ago`}
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Waiting for first heartbeat…</p>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Active Agents"
          value={heartbeat?.activeAgents ?? '—'}
          accent="primary"
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          label="Queued Tasks"
          value={heartbeat?.queuedTasks ?? '—'}
          accent={
            heartbeat?.queuedTasks && heartbeat.queuedTasks > 10 ? 'warning' : 'secondary'
          }
          icon={
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          }
        />
      </div>
    </GlassPanel>
  );
}
