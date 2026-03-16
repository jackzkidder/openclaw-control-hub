'use client';

import { motion } from 'framer-motion';
import { AnimatedMetricCard } from '@/components/cards/AnimatedMetricCard';
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
          title="Tokens Today"
          value={summary ? formatTokenCount(summary.totalTokensToday ?? (summary.totalInputTokens + summary.totalOutputTokens)) : '—'}
          loading={loading}
          accent="cyan"
          subtitle={
            summary
              ? `${formatTokenCount(summary.promptTokensToday ?? summary.totalInputTokens)} in · ${formatTokenCount(summary.completionTokensToday ?? summary.totalOutputTokens)} out`
              : undefined
          }
        />
      </motion.div>

      {/* Total Cost Today */}
      <motion.div variants={cardVariants}>
        <AnimatedMetricCard
          title="Cost Today"
          value={summary ? formatCost(summary.totalCostToday ?? summary.totalCostUsd) : '—'}
          loading={loading}
          accent="violet"
          subtitle={
            summary?.costTrendPercent != null
              ? `${summary.costTrendPercent > 0 ? '+' : ''}${summary.costTrendPercent.toFixed(1)}% vs yesterday`
              : undefined
          }
        />
      </motion.div>

      {/* Most Active Agent */}
      <motion.div variants={cardVariants}>
        <AnimatedMetricCard
          title="Most Active Agent"
          value={summary?.mostActiveAgent?.name ?? '—'}
          loading={loading}
          accent="green"
          subtitle={
            summary?.mostActiveAgent
              ? `${formatTokenCount(summary.mostActiveAgent.tokens)} tokens`
              : undefined
          }
        />
      </motion.div>

      {/* Cost Trend vs Yesterday */}
      <motion.div variants={cardVariants}>
        <AnimatedMetricCard
          title="Cost Trend"
          value={
            summary?.costTrendPercent != null
              ? `${summary.costTrendPercent > 0 ? '+' : ''}${summary.costTrendPercent.toFixed(1)}%`
              : '—'
          }
          loading={loading}
          accent={
            summary?.costTrendPercent != null
              ? summary.costTrendPercent > 0 ? 'rose' : 'green'
              : 'cyan'
          }
          subtitle={
            summary?.costYesterday !== undefined
              ? `Yesterday: ${formatCost(summary.costYesterday)}`
              : undefined
          }
        />
      </motion.div>
    </motion.div>
  );
}
