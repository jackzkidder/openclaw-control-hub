'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import cronstrue from 'cronstrue';
import { GlassPanel } from '@/components/primitives/GlassPanel';
import { GlowButton } from '@/components/primitives/GlowButton';
import { formatRelativeTime, formatDateTime } from '@/lib/utils/formatters';
import type { CronJob } from '@/lib/openclaw/types';

async function fetchCronJobs(): Promise<CronJob[]> {
  const res = await fetch('/api/cron');
  if (!res.ok) throw new Error('Failed to fetch cron jobs');
  return res.json();
}

async function toggleCronJob(id: string, enabled: boolean): Promise<CronJob> {
  const res = await fetch(`/api/cron/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error('Failed to update cron job');
  return res.json();
}

async function runCronJobNow(id: string): Promise<void> {
  const res = await fetch(`/api/cron/${id}/run`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger cron job');
}

async function deleteCronJob(id: string): Promise<void> {
  const res = await fetch(`/api/cron/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete cron job');
}

function humanReadableCron(expression: string): string {
  try {
    return cronstrue.toString(expression, { throwExceptionOnParseError: true });
  } catch {
    return expression;
  }
}

function StatusBadge({ status }: { status: CronJob['lastRunStatus'] }) {
  if (status === null || status === undefined) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'var(--surface-muted)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
        Never run
      </span>
    );
  }
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-status-online/10 text-status-online border border-status-online/20">
        <span className="w-1.5 h-1.5 rounded-full bg-status-online" />
        Success
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-status-error/10 text-status-error border border-status-error/20">
      <span className="w-1.5 h-1.5 rounded-full bg-status-error" />
      Failed
    </span>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: checked ? 'var(--accent)' : 'var(--surface-strong)' }}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center p-8 m-4 rounded-xl"
      style={{ minHeight: '200px', border: '2px dashed var(--border)', background: 'var(--surface-muted)' }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
      >
        <svg className="w-7 h-7" style={{ color: 'var(--text-quiet)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text)' }}>No cron jobs scheduled</p>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Create a cron job to automate recurring tasks.</p>
    </motion.div>
  );
}

interface CronRowProps {
  job: CronJob;
  index: number;
  onToggle: (id: string, enabled: boolean) => void;
  onRunNow: (id: string) => void;
  onDelete: (id: string) => void;
  isTogglingId: string | null;
  isRunningId: string | null;
  isDeletingId: string | null;
}

function CronRow({
  job,
  index,
  onToggle,
  onRunNow,
  onDelete,
  isTogglingId,
  isRunningId,
  isDeletingId,
}: CronRowProps) {
  return (
    <motion.tr
      key={job.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="transition-colors"
      style={{ borderBottom: '1px solid var(--border)' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-muted)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {/* Job Name */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{job.name}</span>
          {job.description && (
            <span className="text-xs text-muted-foreground line-clamp-1">{job.description}</span>
          )}
        </div>
      </td>

      {/* Cron Expression */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-mono text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 w-fit">
            {job.expression}
          </span>
          <span className="text-xs text-muted-foreground">{humanReadableCron(job.expression)}</span>
        </div>
      </td>

      {/* Next Run */}
      <td className="px-4 py-3">
        {job.nextRunAt ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs" style={{ color: 'var(--text)' }}>{formatDateTime(job.nextRunAt)}</span>
            <span className="text-xs text-muted-foreground">{formatRelativeTime(job.nextRunAt)}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </td>

      {/* Last Run Status */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <StatusBadge status={job.lastRunStatus} />
          {job.lastRunAt && (
            <span className="text-xs text-muted-foreground">{formatRelativeTime(job.lastRunAt)}</span>
          )}
        </div>
      </td>

      {/* Enabled Toggle */}
      <td className="px-4 py-3">
        <Toggle
          checked={job.isEnabled}
          onChange={(val) => onToggle(job.id, val)}
          disabled={isTogglingId === job.id}
        />
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <GlowButton
            size="sm"
            variant="secondary"
            disabled={isRunningId === job.id || !job.isEnabled}
            onClick={() => onRunNow(job.id)}
            className="text-xs"
          >
            {isRunningId === job.id ? (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Running
              </span>
            ) : (
              'Run Now'
            )}
          </GlowButton>
          <button
            type="button"
            disabled={isDeletingId === job.id}
            onClick={() => onDelete(job.id)}
            className="p-1.5 rounded-card text-muted-foreground hover:text-status-error hover:bg-status-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Delete cron job"
          >
            {isDeletingId === job.id ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </td>
    </motion.tr>
  );
}

export function CronTable() {
  const queryClient = useQueryClient();
  const [isTogglingId, setIsTogglingId] = useState<string | null>(null);
  const [isRunningId, setIsRunningId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const {
    data: jobs = [],
    isLoading,
    isError,
    error,
  } = useQuery<CronJob[], Error>({
    queryKey: ['cron-jobs'],
    queryFn: fetchCronJobs,
    refetchInterval: 15_000,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      toggleCronJob(id, enabled),
    onMutate: ({ id }) => setIsTogglingId(id),
    onSettled: () => {
      setIsTogglingId(null);
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
    },
  });

  const runMutation = useMutation({
    mutationFn: (id: string) => runCronJobNow(id),
    onMutate: (id) => setIsRunningId(id),
    onSettled: () => {
      setIsRunningId(null);
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCronJob(id),
    onMutate: (id) => setIsDeletingId(id),
    onSettled: () => {
      setIsDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['cron-jobs'] });
    },
  });

  const handleToggle = (id: string, enabled: boolean) => {
    toggleMutation.mutate({ id, enabled });
  };

  const handleRunNow = (id: string) => {
    runMutation.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <GlassPanel className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Scheduled Jobs</h2>
          {!isLoading && (
            <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: 'var(--surface-muted)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {jobs.length}
            </span>
          )}
        </div>
        {isLoading && (
          <svg className="w-4 h-4 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        )}
      </div>

      {isError && (
        <div className="px-4 py-3 border-b border-status-error/20 bg-status-error/5 flex items-center gap-2">
          <svg className="w-4 h-4 text-status-error flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-status-error">{(error as Error)?.message ?? 'Failed to load cron jobs'}</p>
        </div>
      )}

      {isLoading ? (
        <div className="divide-y divide-[var(--border)]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-3 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-4 w-32 rounded" style={{ background: 'var(--surface-strong)' }} />
                <div className="h-4 w-24 rounded" style={{ background: 'var(--surface-strong)' }} />
                <div className="h-4 w-28 rounded ml-auto" style={{ background: 'var(--surface-strong)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--border-strong)' }}>
                {['Job Name', 'Schedule', 'Next Run', 'Last Status', 'Enabled', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-quiet)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {jobs.map((job, index) => (
                  <CronRow
                    key={job.id}
                    job={job}
                    index={index}
                    onToggle={handleToggle}
                    onRunNow={handleRunNow}
                    onDelete={handleDelete}
                    isTogglingId={isTogglingId}
                    isRunningId={isRunningId}
                    isDeletingId={isDeletingId}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </GlassPanel>
  );
}
