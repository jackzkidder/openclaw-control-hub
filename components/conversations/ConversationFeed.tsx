'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassPanel } from '@/components/primitives/GlassPanel';
import { formatRelativeTime } from '@/lib/utils/formatters';
import { useRecentEvents, useAppStore } from '@/store/useAppStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

interface FeedMessage {
  id: string;
  type: 'agent.message' | 'agent.tool_call';
  role: MessageRole;
  agentId?: string;
  agentName?: string;
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  timestamp: string;
}

interface PersistedConversation {
  id: string;
  messages: FeedMessage[];
  updatedAt: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchConversations(): Promise<PersistedConversation[]> {
  const res = await fetch('/api/conversations');
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function AgentAvatar({
  name,
  role,
  isToolCall,
}: {
  name?: string;
  role: MessageRole;
  isToolCall?: boolean;
}) {
  if (isToolCall) {
    return (
      <div className="w-7 h-7 rounded-card bg-secondary/10 border border-secondary/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    );
  }

  const initials = name
    ? name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : role === 'user'
    ? 'U'
    : 'A';

  const bgClass =
    role === 'user'
      ? 'bg-primary/10 border-primary/20 text-primary'
      : role === 'assistant'
      ? 'bg-secondary/10 border-secondary/20 text-secondary'
      : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-muted)]';

  return (
    <div
      className={`w-7 h-7 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-semibold ${bgClass}`}
    >
      {initials}
    </div>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role, isToolCall }: { role: MessageRole; isToolCall?: boolean }) {
  if (isToolCall) {
    return (
      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
        tool call
      </span>
    );
  }
  const map: Record<MessageRole, string> = {
    user: 'bg-primary/10 text-primary border-primary/20',
    assistant: 'bg-[var(--surface-muted)] text-[var(--text-muted)] border-[var(--border)]',
    system: 'bg-status-warning/10 text-status-warning border-status-warning/20',
    tool: 'bg-secondary/10 text-secondary border-secondary/20',
  };
  return (
    <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${map[role] ?? map.assistant}`}>
      {role}
    </span>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: FeedMessage }) {
  const isToolCall = msg.type === 'agent.tool_call';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`flex items-start gap-2.5 px-4 py-2.5 ${
        isToolCall ? 'bg-secondary/[0.03]' : ''
      }`}
    >
      <AgentAvatar name={msg.agentName} role={msg.role} isToolCall={isToolCall} />

      <div className="flex-1 min-w-0">
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {msg.agentName && (
            <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>{msg.agentName}</span>
          )}
          <RoleBadge role={msg.role} isToolCall={isToolCall} />
          {isToolCall && msg.toolName && (
            <span className="text-xs font-mono text-secondary/80 bg-secondary/5 px-1.5 py-0.5 rounded border border-secondary/10">
              {msg.toolName}
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {formatRelativeTime(msg.timestamp)}
          </span>
        </div>

        {/* Content */}
        {isToolCall ? (
          <div className="rounded-card bg-secondary/5 border border-secondary/10 px-3 py-2">
            {msg.content && (
              <p className="text-xs mb-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{msg.content}</p>
            )}
            {msg.toolInput && Object.keys(msg.toolInput).length > 0 && (
              <pre className="text-xs font-mono text-secondary/80 overflow-x-auto whitespace-pre-wrap break-words">
                {JSON.stringify(msg.toolInput, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--text)' }}>
            {msg.content}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const FEED_EVENT_TYPES = new Set(['agent.message', 'agent.tool_call']);

export function ConversationFeed() {
  const recentEvents = useRecentEvents();
  const clearEvents = useAppStore((s) => s.clearEvents);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [localMessages, setLocalMessages] = useState<FeedMessage[]>([]);

  // Pull persisted conversations
  const { data: conversations = [] } = useQuery<PersistedConversation[], Error>({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    refetchInterval: 10_000,
  });

  // Filter relevant gateway events
  const eventMessages: FeedMessage[] = (recentEvents ?? [])
    .filter((e) => FEED_EVENT_TYPES.has(e.type))
    .map((e) => ({
      id: e.id ?? `evt-${e.timestamp}-${Math.random()}`,
      type: e.type as FeedMessage['type'],
      role: (e.payload?.role as MessageRole) ?? 'assistant',
      agentId: e.payload?.agentId as string | undefined,
      agentName: e.payload?.agentName as string | undefined,
      content: (e.payload?.content as string) ?? '',
      toolName: e.payload?.toolName as string | undefined,
      toolInput: e.payload?.toolInput as Record<string, unknown> | undefined,
      timestamp: e.timestamp,
    }));

  // Flatten persisted messages
  const persistedMessages: FeedMessage[] = conversations
    .flatMap((c) => c.messages)
    .filter((m) => FEED_EVENT_TYPES.has(m.type));

  // Merge: dedup by id, prefer live events
  const allMessages = (() => {
    const merged = new Map<string, FeedMessage>();
    [...persistedMessages, ...eventMessages, ...localMessages].forEach((m) => {
      merged.set(m.id, m);
    });
    return Array.from(merged.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  })();

  // Auto-scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [allMessages.length, isAtBottom]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAtBottom(distFromBottom < 60);
  }, []);

  const handleScrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      setIsAtBottom(true);
    }
  };

  const handleClearFeed = () => {
    setLocalMessages([]);
    clearEvents();
  };

  return (
    <GlassPanel className="flex flex-col overflow-hidden" style={{ minHeight: 400 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Conversation Feed</h2>
          <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: 'var(--surface-muted)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            {allMessages.length}
          </span>
          {/* Live indicator */}
          <span className="flex items-center gap-1 text-xs text-status-online">
            <span className="w-1.5 h-1.5 rounded-full bg-status-online animate-pulse" />
            Live
          </span>
        </div>
        <button
          type="button"
          onClick={handleClearFeed}
          className="text-xs transition-colors flex items-center gap-1.5 px-2 py-1 rounded-card hover:bg-[var(--surface-muted)]" style={{ color: 'var(--text-muted)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear feed
        </button>
      </div>

      {/* Scrollable message list */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto divide-y divide-[var(--border)]"
        style={{ maxHeight: 520 }}
      >
        {allMessages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Agent messages and tool calls will appear here.</p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {allMessages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {!isAtBottom && allMessages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-4 right-4"
          >
            <button
              type="button"
              onClick={handleScrollToBottom}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary/90 text-white shadow-lg hover:bg-primary transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Jump to latest
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassPanel>
  );
}
