'use client';

import { motion } from 'framer-motion';
import AnimatedMetricCard from '@/components/cards/AnimatedMetricCard';
import { formatTokenCount, formatCost } from '@/lib/utils/formatters';
import type { UsageSummary } from '@/lib/openclaw/types';

interface UsageSummaryCardsProps {
  summary: UsageSummary | null;
  loading: boolean;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

function TrendIndicator({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return null;

  const isUp = value > 0;
  const isFlat = value === 0;

  if (isFlat) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
        No change
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        isUp ? 'text-status-error' : 'text-status-online'
      }`}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={
            isUp
              ? 'M5 15l7-7 7 7'
              : 'M19 9l-7 7-7-7'
          }
        />
      </svg>
      {Math.abs(value).toFixed(1)}% vs yesterday
    </span>
  );
}

export default function UsageSummaryCards({ summary, loading }: UsageSummaryCardsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {/* Total Tokens Today */}
      <motion.div variants={cardVariants}>
        <AnimatedMetricCard
          label="Tokens Today"
          value={loading ? null : summary ? formatTokenCount(summary.totalTokensToday) : '—'}
          loading={loading}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          }
          accent="primary"
          subtext={
            summary ? (
              <span className="text-xs text-muted-foreground">
                {formatTokenCount(summary.promptTokensToday)} prompt
                {' · '}
                {formatTokenCount(summary.completionTokensToday)} completion
              </span>
            ) : null
          }
        />
      </motion.div>

      {/* Total Cost Today */}
      <motion.div variants={cardVariants}>
        <AnimatedMetricCard
          label="Cost Today"
          value={loading ? null : summary ? formatCost(summary.totalCostToday) : '—'}
          loading={loading}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          accent="secondary"
          subtext={
            summary ? <TrendIndicator value={summary.costTrendPercent} /> : null
          }
        />
      </motion.div>

      {/* Most Active Agent */}
      <motion.div variants={cardVariants}>
        <AnimatedMetricCard
          label="Most Active Agent"
          value={loading ? null : summary?.mostActiveAgent?.name ?? '—'}
          loading={loading}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          accent="online"
          subtext={
            summary?.mostActiveAgent ? (
              <span className="text-xs text-muted-foreground">
                {formatTokenCount(summary.mostActiveAgent.tokens)} tokens
              </span>
            ) : null
          }
        />
      </motion.div>

      {/* Cost Trend vs Yesterday */}
      <motion.div variants={cardVariants}>
        <AnimatedMetricCard
          label="Cost Trend"
          value={
            loading
              ? null
              : summary?.costTrendPercent !== null && summary?.costTrendPercent !== undefined
              ? `${summary.costTrendPercent > 0 ? '+' : ''}${summary.costTrendPercent.toFixed(1)}%`
              : '—'
          }
          loading={loading}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
          accent={
            summary?.costTrendPercent !== null && summary?.costTrendPercent !== undefined
              ? summary.costTrendPercent > 0
                ? 'error'
                : 'online'
              : 'primary'
          }
          subtext={
            summary?.costYesterday !== undefined ? (
              <span className="text-xs text-muted-foreground">
                Yesterday: {formatCost(summary.costYesterday)}
              </span>
            ) : null
          }
        />
      </motion.div>
    </motion.div>
  );
}
