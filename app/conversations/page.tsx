'use client'

import { motion } from 'framer-motion'
import { TopBar } from '@/components/layout/TopBar'
import { ConversationFeed } from '@/components/conversations/ConversationFeed'

export default function ConversationsPage() {
  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: 'var(--bg)' }}>
      <TopBar title="Conversations" subtitle="Agent communication feed" />

      <motion.div
        className="flex-1 min-h-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <ConversationFeed />
      </motion.div>
    </div>
  )
}
