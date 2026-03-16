'use client'

import { motion } from 'framer-motion'
import { TopBar } from '@/components/layout/TopBar'
import { DropZone } from '@/components/docu-digest/DropZone'
import { DocumentList } from '@/components/docu-digest/DocumentList'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] } },
}

export default function DocuDigestPage() {
  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: 'var(--bg)' }}>
      <TopBar title="Docu Digest" subtitle="Intelligence ingestion workspace" />

      <div className="flex-1 overflow-hidden p-6">
        <motion.div
          className="flex flex-col lg:flex-row gap-5 h-full"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Upload zone — left on large, top on small */}
          <motion.div
            variants={itemVariants}
            className="lg:w-[360px] xl:w-[400px] flex-shrink-0 flex flex-col"
          >
            <DropZone />
          </motion.div>

          {/* Document list — takes remaining space */}
          <motion.div variants={itemVariants} className="flex-1 min-w-0 min-h-0 flex flex-col">
            <DocumentList />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
