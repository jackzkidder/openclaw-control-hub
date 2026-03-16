'use client';

import { useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFileSize } from '@/lib/utils/formatters';

const ACCEPTED_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'text/plain': 'TXT',
  'text/markdown': 'MD',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

const ACCEPTED_EXTENSIONS = ['.pdf', '.txt', '.md', '.docx'];

function getFileTypeLabel(file: File): string {
  return ACCEPTED_TYPES[file.type] ?? file.name.split('.').pop()?.toUpperCase() ?? 'FILE';
}

function FileTypeIcon({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    PDF: 'text-status-error bg-status-error/10 border-status-error/20',
    TXT: 'text-primary bg-primary/10 border-primary/20',
    MD: 'text-secondary bg-secondary/10 border-secondary/20',
    DOCX: 'text-status-warning bg-status-warning/10 border-status-warning/20',
  };
  const cls = colorMap[type] ?? 'text-[var(--text-muted)] bg-[var(--surface-muted)] border-[var(--border)]';

  return (
    <div className={`w-10 h-12 rounded-card flex items-center justify-center border text-xs font-bold flex-shrink-0 ${cls}`}>
      {type}
    </div>
  );
}

interface FilePreviewItem {
  file: File;
  typeLabel: string;
}

interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  error: string | null;
}

interface DropZoneProps {
  onUploaded?: (document: unknown) => void;
}

export function DropZone({ onUploaded }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<FilePreviewItem[]>([]);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const isAccepted = useCallback((file: File) => {
    if (ACCEPTED_TYPES[file.type]) return true;
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_EXTENSIONS.includes(ext);
  }, []);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      const valid = arr.filter(isAccepted);
      const invalid = arr.filter((f) => !isAccepted(f));

      if (invalid.length > 0) {
        setDragError(
          `${invalid.length} file(s) not accepted. Allowed: PDF, TXT, MD, DOCX.`
        );
        setTimeout(() => setDragError(null), 4000);
      }

      if (valid.length === 0) return;

      const items: FilePreviewItem[] = valid.map((file) => ({
        file,
        typeLabel: getFileTypeLabel(file),
      }));

      setPendingFiles((prev) => {
        const existingNames = new Set(prev.map((p) => p.file.name));
        return [...prev, ...items.filter((i) => !existingNames.has(i.file.name))];
      });
    },
    [isAccepted]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = '';
      }
    },
    [addFiles]
  );

  const handleZoneClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const removeFile = useCallback((name: string) => {
    setPendingFiles((prev) => prev.filter((p) => p.file.name !== name));
    setUploadStates((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const uploadFile = useCallback(
    async (item: FilePreviewItem) => {
      const key = item.file.name;

      setUploadStates((prev) => ({
        ...prev,
        [key]: { status: 'uploading', progress: 0, error: null },
      }));

      try {
        // Simulate XHR progress — use fetch with a progress-like approach
        const formData = new FormData();
        formData.append('file', item.file);

        // Progress simulation (fetch doesn't expose upload progress natively)
        const progressInterval = setInterval(() => {
          setUploadStates((prev) => {
            const current = prev[key];
            if (!current || current.status !== 'uploading') {
              clearInterval(progressInterval);
              return prev;
            }
            const next = Math.min(current.progress + Math.random() * 20, 90);
            return { ...prev, [key]: { ...current, progress: next } };
          });
        }, 200);

        const res = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.message ?? `Upload failed (${res.status})`);
        }

        const data = await res.json();

        setUploadStates((prev) => ({
          ...prev,
          [key]: { status: 'success', progress: 100, error: null },
        }));

        onUploaded?.(data);

        // Auto-remove from pending after success
        setTimeout(() => {
          setPendingFiles((prev) => prev.filter((p) => p.file.name !== key));
          setUploadStates((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
          });
        }, 2000);
      } catch (err) {
        setUploadStates((prev) => ({
          ...prev,
          [key]: {
            status: 'error',
            progress: 0,
            error: err instanceof Error ? err.message : 'Upload failed',
          },
        }));
      }
    },
    [onUploaded]
  );

  const handleUploadAll = useCallback(() => {
    const toUpload = pendingFiles.filter((item) => {
      const s = uploadStates[item.file.name];
      return !s || s.status === 'error';
    });
    toUpload.forEach(uploadFile);
  }, [pendingFiles, uploadStates, uploadFile]);

  const anyUploading = Object.values(uploadStates).some((s) => s.status === 'uploading');
  const hasFiles = pendingFiles.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Drop Zone */}
      <motion.div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleZoneClick}
        animate={
          isDragOver
            ? { scale: 1.01 }
            : { scale: 1 }
        }
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`relative cursor-pointer rounded-panel border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 transition-colors select-none ${
          isDragOver
            ? 'border-primary/60 bg-primary/5'
            : 'border-[var(--border)] bg-[var(--surface-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-strong)]'
        }`}
      >
        {/* Animated border glow on drag-over */}
        <AnimatePresence>
          {isDragOver && (
            <motion.div
              key="glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 rounded-panel"
              style={{
                boxShadow: '0 0 0 1px rgba(6,182,212,0.4), 0 0 24px 4px rgba(6,182,212,0.15)',
              }}
            />
          )}
        </AnimatePresence>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(',')}
          className="hidden"
          onChange={handleInputChange}
        />

        <motion.div
          animate={isDragOver ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`w-12 h-12 rounded-full border flex items-center justify-center ${
            isDragOver
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-muted)]'
          }`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </motion.div>

        <div className="text-center">
          <p className={`text-sm font-medium ${isDragOver ? 'text-primary' : 'text-[var(--text)]'}`}>
            {isDragOver ? 'Release to add files' : 'Drag & drop files here'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or <span className="text-primary underline">click to browse</span>
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1">
          {['PDF', 'TXT', 'MD', 'DOCX'].map((ext) => (
            <span
              key={ext}
              className="px-1.5 py-0.5 rounded text-xs font-mono text-[var(--text-muted)] bg-[var(--surface-muted)] border border-[var(--border)]"
            >
              .{ext.toLowerCase()}
            </span>
          ))}
        </div>

        <AnimatePresence>
          {dragError && (
            <motion.p
              key="drag-error"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs text-status-error text-center"
            >
              {dragError}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* File Preview List */}
      <AnimatePresence initial={false}>
        {hasFiles && (
          <motion.div
            key="file-list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-panel divide-y divide-[var(--border)]" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
              {pendingFiles.map((item) => {
                const state = uploadStates[item.file.name];
                const isUploading = state?.status === 'uploading';
                const isSuccess = state?.status === 'success';
                const isError = state?.status === 'error';

                return (
                  <motion.div
                    key={item.file.name}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <FileTypeIcon type={item.typeLabel} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{item.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</p>

                      {/* Progress bar */}
                      {(isUploading || isSuccess) && (
                        <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'var(--surface-strong)' }}>
                          <motion.div
                            className={`h-full rounded-full ${isSuccess ? 'bg-status-online' : 'bg-primary'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${state?.progress ?? 0}%` }}
                            transition={{ ease: 'easeOut', duration: 0.3 }}
                          />
                        </div>
                      )}

                      {isError && (
                        <p className="text-xs text-status-error mt-0.5">{state?.error}</p>
                      )}
                    </div>

                    {/* Status indicator */}
                    <div className="flex-shrink-0">
                      {isUploading && (
                        <svg className="w-4 h-4 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      )}
                      {isSuccess && (
                        <svg className="w-4 h-4 text-status-online" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {(isError || !state) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(item.file.name);
                          }}
                          className="p-1 rounded-card text-muted-foreground hover:text-status-error hover:bg-status-error/10 transition-colors"
                          aria-label="Remove file"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Upload button */}
            <div className="flex justify-end mt-3">
              <button
                type="button"
                disabled={anyUploading}
                onClick={handleUploadAll}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-card text-sm font-medium bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {anyUploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Uploading…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
