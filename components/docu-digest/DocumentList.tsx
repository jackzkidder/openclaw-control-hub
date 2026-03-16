'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '@/components/primitives/GlassPanel';
import { GlowButton } from '@/components/primitives/GlowButton';
import { BlurModal } from '@/components/primitives/BlurModal';
import { PulseIndicator } from '@/components/primitives/PulseIndicator';
import { formatFileSize, formatRelativeTime } from '@/lib/utils/formatters';
import type { Document, Task } from '@/lib/openclaw/types';

// ─── API helpers ─────────────────────────────────────────────────────────────

async function fetchDocuments(): Promise<Document[]> {
  const res = await fetch('/api/documents');
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

async function deleteDocument(id: string): Promise<void> {
  const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete document');
}

async function attachToTask(documentId: string, taskId: string): Promise<void> {
  const res = await fetch('/api/tasks/attach-document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ documentId, taskId }),
  });
  if (!res.ok) throw new Error('Failed to attach document to task');
}

// ─── Status badge ─────────────────────────────────────────────────────────────

type DocStatus = 'pending' | 'processing' | 'ready' | 'failed';

interface StatusBadgeProps {
  status: DocStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const configs: Record<
    DocStatus,
    { label: string; className: string; pulse?: boolean }
  > = {
    pending: {
      label: 'Pending',
      className: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    },
    processing: {
      label: 'Processing',
      className: 'bg-primary/10 text-primary border-primary/20',
      pulse: true,
    },
    ready: {
      label: 'Ready',
      className: 'bg-status-online/10 text-status-online border-status-online/20',
    },
    failed: {
      label: 'Failed',
      className: 'bg-status-error/10 text-status-error border-status-error/20',
    },
  };

  const cfg = configs[status] ?? configs.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}
    >
      {cfg.pulse ? (
        <PulseIndicator size="sm" color="cyan" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full bg-current`} />
      )}
      {cfg.label}
    </span>
  );
}

// ─── MIME type icon ───────────────────────────────────────────────────────────

function FileIcon({ mimeType }: { mimeType: string }) {
  const isPdf = mimeType === 'application/pdf';
  const isWord = mimeType.includes('wordprocessingml') || mimeType.includes('msword');
  const isMarkdown = mimeType === 'text/markdown';

  if (isPdf) {
    return (
      <div className="w-9 h-11 rounded-card flex items-center justify-center bg-status-error/10 border border-status-error/20 text-status-error text-xs font-bold flex-shrink-0">
        PDF
      </div>
    );
  }
  if (isWord) {
    return (
      <div className="w-9 h-11 rounded-card flex items-center justify-center bg-status-warning/10 border border-status-warning/20 text-status-warning text-xs font-bold flex-shrink-0">
        DOC
      </div>
    );
  }
  if (isMarkdown) {
    return (
      <div className="w-9 h-11 rounded-card flex items-center justify-center bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold flex-shrink-0">
        MD
      </div>
    );
  }
  return (
    <div className="w-9 h-11 rounded-card flex items-center justify-center bg-primary/10 border border-primary/20 text-primary text-xs font-bold flex-shrink-0">
      TXT
    </div>
  );
}

// ─── Summary preview ─────────────────────────────────────────────────────────

function SummaryPreview({ summary }: { summary: string | null | undefined }) {
  const [expanded, setExpanded] = useState(false);

  if (!summary) return null;

  const isLong = summary.length > 120;
  const displayText = !expanded && isLong ? summary.slice(0, 120) + '…' : summary;

  return (
    <div className="mt-2">
      <p className="text-xs text-muted-foreground leading-relaxed">{displayText}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-primary hover:text-primary/80 transition-colors mt-0.5"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

// ─── Document item ────────────────────────────────────────────────────────────

interface DocumentItemProps {
  doc: Document;
  index: number;
  onDelete: (id: string) => void;
  onAttach: (id: string) => void;
  isDeletingId: string | null;
}

function DocumentItem({ doc, index, onDelete, onAttach, isDeletingId }: DocumentItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.22, delay: index * 0.04 }}
      className="flex items-start gap-3 px-4 py-3 hover:bg-[var(--surface-muted)] transition-colors"
    >
      {/* File icon */}
      <FileIcon mimeType={doc.mimeType ?? ''} />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{doc.name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{formatFileSize(doc.sizeBytes ?? 0)}</span>
              {doc.uploadedAt && (
                <>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(doc.uploadedAt)}</span>
                </>
              )}
              {doc.linkedTaskIds.length > 0 && (
                <>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <span className="inline-flex items-center gap-1 text-xs text-secondary">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {doc.linkedTaskIds.length} task{doc.linkedTaskIds.length !== 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status badge */}
          <StatusBadge status={(doc.status as DocStatus) ?? 'pending'} />
        </div>

        {/* Summary preview */}
        <SummaryPreview summary={doc.summary} />
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
        <GlowButton
          size="sm"
          variant="secondary"
          onClick={() => onAttach(doc.id)}
          disabled={(doc.status as DocStatus) !== 'ready'}
          className="text-xs"
        >
          Attach
        </GlowButton>
        <button
          type="button"
          disabled={isDeletingId === doc.id}
          onClick={() => onDelete(doc.id)}
          className="p-1.5 rounded-card text-muted-foreground hover:text-status-error hover:bg-status-error/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Delete document"
        >
          {isDeletingId === doc.id ? (
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
    </motion.div>
  );
}

// ─── Attach Task Modal ────────────────────────────────────────────────────────

async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks');
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

function AttachTaskModal({
  documentId,
  onClose,
  onAttached,
}: {
  documentId: string | null;
  onClose: () => void;
  onAttached: () => void;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
    enabled: !!documentId,
  });

  const activeTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');

  async function handleConfirm() {
    if (!documentId || !selectedTaskId) return;
    setAttaching(true);
    setError(null);
    try {
      const res = await fetch('/api/tasks/attach-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, taskId: selectedTaskId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      onAttached();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to attach');
    } finally {
      setAttaching(false);
    }
  }

  return (
    <BlurModal open={!!documentId} onClose={onClose} title="Attach to Task">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Select a task to link this document to.</p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground animate-pulse py-4 text-center">Loading tasks…</p>
        ) : activeTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No active tasks found.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {activeTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => setSelectedTaskId(task.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                  selectedTaskId === task.id
                    ? 'bg-primary/10 border-primary/30 text-foreground'
                    : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-strong)] hover:text-[var(--text)]'
                }`}
              >
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-xs mt-0.5 opacity-60 capitalize">{task.status.replace('_', ' ')} · {task.priority}</p>
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs text-status-error">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border)]">
          <GlowButton variant="ghost" size="sm" onClick={onClose}>Cancel</GlowButton>
          <GlowButton
            variant="primary"
            size="sm"
            disabled={!selectedTaskId || attaching}
            loading={attaching}
            onClick={handleConfirm}
          >
            Attach
          </GlowButton>
        </div>
      </div>
    </BlurModal>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-14 text-center"
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
        <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-muted-foreground">No documents uploaded</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Upload PDF, TXT, MD, or DOCX files to get started.</p>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DocumentList() {
  const queryClient = useQueryClient();
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [attachingDocId, setAttachingDocId] = useState<string | null>(null);

  const { data: documents = [], isLoading, isError } = useQuery<Document[], Error>({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
    refetchInterval: (query) => {
      const docs = query.state.data ?? [];
      const hasProcessing = docs.some(
        (d) => d.status === 'pending' || d.status === 'processing'
      );
      return hasProcessing ? 3_000 : 30_000;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onMutate: (id) => setIsDeletingId(id),
    onSettled: () => {
      setIsDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const handleDelete = (id: string) => deleteMutation.mutate(id);

  const handleAttach = (id: string) => {
    setAttachingDocId(id);
  };

  const processingCount = documents.filter(
    (d) => d.status === 'pending' || d.status === 'processing'
  ).length;

  return (
    <GlassPanel className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Document Library</h2>
          {!isLoading && (
            <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: 'var(--surface-muted)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {documents.length}
            </span>
          )}
          {processingCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-primary">
              <PulseIndicator size="sm" color="cyan" />
              {processingCount} processing
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

      {/* Error */}
      {isError && (
        <div className="px-4 py-2 border-b border-status-error/20 bg-status-error/5">
          <p className="text-xs text-status-error">Failed to load documents. Retrying…</p>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="divide-y divide-[var(--border)]">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-4 py-3 animate-pulse flex items-center gap-3">
              <div className="w-9 h-11 rounded-card" style={{ background: 'var(--surface-strong)' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-48 rounded" style={{ background: 'var(--surface-strong)' }} />
                <div className="h-3 w-24 rounded" style={{ background: 'var(--surface-strong)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="divide-y divide-[var(--border)]">
          <AnimatePresence initial={false}>
            {documents.map((doc, index) => (
              <DocumentItem
                key={doc.id}
                doc={doc}
                index={index}
                onDelete={handleDelete}
                onAttach={handleAttach}
                isDeletingId={isDeletingId}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AttachTaskModal
        documentId={attachingDocId}
        onClose={() => setAttachingDocId(null)}
        onAttached={() => queryClient.invalidateQueries({ queryKey: ['documents'] })}
      />
    </GlassPanel>
  );
}
