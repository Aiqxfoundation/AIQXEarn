import React, { FC, useState } from 'react';
import {
  Coins,
  TrendingUp,
  Award,
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Filter,
  ArrowDownLeft,
  Sparkles,
} from 'lucide-react';
import { EarningsRecord, UserRecord } from '../../lib/referral-engine';
import { AppConfig, formatAddress, getExplorerUrl } from '../../lib/solana';

interface EarningsSectionProps {
  config: AppConfig;
  user: UserRecord | null;
  earnings: {
    l1Earnings: number;
    l2Earnings: number;
    l3Earnings: number;
    crossoverEarnings?: number;
    uplineRecycleEarnings?: number;
    downlineRewardEarnings?: number;
    contributionEarnings?: number;
    totalEarnings: number;
    history: EarningsRecord[];
  };
  aiqxPriceUsd?: number;
}

export const EarningsSection: FC<EarningsSectionProps> = ({
  config,
  user,
  earnings,
  aiqxPriceUsd = 0.0002613,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const crossoverTotal = earnings.crossoverEarnings || 0;
  const uplineRecycleTotal = earnings.uplineRecycleEarnings || 0;
  const downlineRewardTotal = earnings.downlineRewardEarnings || 0;
  const totalReceived = earnings.totalEarnings;
  const totalUsd = totalReceived * aiqxPriceUsd;

  const filteredHistory = earnings.history.filter((item) => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'direct') return item.category === 'l1_reward';
    if (filterCategory === 'indirect') return item.category === 'l2_reward';
    if (filterCategory === 'third_line') return item.category === 'l3_reward';
    if (filterCategory === 'crossover') return item.category === 'crossover_split';
    if (filterCategory === 'upline_recycle') return item.category === 'upline_recycle';
    if (filterCategory === 'downline_reward') return item.category === 'downline_leader_reward';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Overview Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
              On-Chain Distributed Commissions &amp; Rewards
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Earnings &amp; Compensation</h1>
          <p className="text-xs text-[#8B949E]">
            Direct (50%), Indirect (30%), Third Line (5%), Crossover, Upline Recycle (50 AIQX) &amp; Downline Rewards (20/12/8 AIQX).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#1E2533] text-right shrink-0">
          <div className="text-[10px] text-[#8B949E] uppercase tracking-wider">Total Received</div>
          <div className="text-2xl font-black text-[#F5A623] font-mono mt-0.5">
            {totalReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })} AIQX
          </div>
          <div className="text-xs text-[#8B949E] font-mono">
            ≈ ${totalUsd.toFixed(4)} USD
          </div>
        </div>
      </div>

      {/* 6-Channel Income Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Direct (50%)</span>
          <p className="text-xl font-bold font-mono text-[#F5A623] mt-1">
            {earnings.l1Earnings.toLocaleString()} AIQX
          </p>
          <span className="text-[10px] text-[#4E5766]">50 AIQX Direct</span>
        </div>

        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Indirect (30%)</span>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {earnings.l2Earnings.toLocaleString()} AIQX
          </p>
          <span className="text-[10px] text-[#4E5766]">30 AIQX Line 2</span>
        </div>

        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Third Line (5%)</span>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {earnings.l3Earnings.toLocaleString()} AIQX
          </p>
          <span className="text-[10px] text-[#4E5766]">5 AIQX Line 3</span>
        </div>

        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Crossover</span>
          <p className="text-xl font-bold font-mono text-purple-400 mt-1">
            {crossoverTotal.toLocaleString()} AIQX
          </p>
          <span className="text-[10px] text-purple-400/80">Upward Qualified</span>
        </div>

        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Upline Recycle</span>
          <p className="text-xl font-bold font-mono text-cyan-400 mt-1">
            {uplineRecycleTotal.toLocaleString()} AIQX
          </p>
          <span className="text-[10px] text-cyan-400/80">50 AIQX per Recycle</span>
        </div>

        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Downline Reward</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {downlineRewardTotal.toLocaleString()} AIQX
          </p>
          <span className="text-[10px] text-emerald-400/80">Top 3 (20/12/8 AIQX)</span>
        </div>
      </div>

      {/* Transparent Ledger History */}
      <div className="p-5 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2533] pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#F5A623]" />
            <h3 className="text-sm font-bold text-white">Verifiable Commission Distributions</h3>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'all', label: 'All Payments' },
              { id: 'direct', label: 'Direct' },
              { id: 'indirect', label: 'Indirect' },
              { id: 'third_line', label: '3rd Line' },
              { id: 'crossover', label: 'Crossover' },
              { id: 'upline_recycle', label: 'Upline Recycle' },
              { id: 'downline_reward', label: 'Downline Reward' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterCategory(f.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                  filterCategory === f.id
                    ? 'bg-[#F5A623] text-[#0B0E11]'
                    : 'bg-[#171D27] text-[#8B949E] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#8B949E]">
            No commission distributions recorded for this category yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1E2533] text-[#8B949E]">
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Source Member</th>
                  <th className="py-2.5 px-3">Level</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2230]">
                {filteredHistory.map((item, idx) => {
                  let badge = { label: 'Reward', style: 'text-white bg-[#171D27] border-[#232B3B]' };
                  if (item.category === 'l1_reward') {
                    badge = { label: 'Direct 50%', style: 'text-[#F5A623] bg-[#F5A623]/10 border-[#F5A623]/30' };
                  } else if (item.category === 'l2_reward') {
                    badge = { label: 'Indirect 30%', style: 'text-white bg-[#171D27] border-[#232B3B]' };
                  } else if (item.category === 'l3_reward') {
                    badge = { label: '3rd Line 5%', style: 'text-[#8B949E] bg-[#171D27] border-[#232B3B]' };
                  } else if (item.category === 'crossover_split') {
                    badge = { label: 'Crossover Split', style: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
                  } else if (item.category === 'upline_recycle') {
                    badge = { label: 'Upline Recycle (50 AIQX)', style: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
                  } else if (item.category === 'downline_leader_reward') {
                    badge = { label: 'Downline Leader Reward', style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
                  } else if (item.category === 'contribution_grant') {
                    badge = { label: 'Community Grant', style: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
                  }

                  return (
                    <tr key={idx} className="hover:bg-[#151C27] transition-colors">
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.style}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-white font-mono">
                        {item.sourceUserId ? `#${item.sourceUserId} (${formatAddress(item.sourceWallet)})` : formatAddress(item.sourceWallet)}
                      </td>
                      <td className="py-2.5 px-3 text-[#8B949E]">L{item.level || 1}</td>
                      <td className="py-2.5 px-3 font-bold text-emerald-400">
                        +{Number(item.amount).toLocaleString()} AIQX
                      </td>
                      <td className="py-2.5 px-3 text-[#8B949E]">
                        {new Date(item.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <a
                          href={getExplorerUrl(item.transactionSignature, 'tx', config.network)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#F5A623] hover:underline inline-flex items-center space-x-1"
                        >
                          <span>{item.transactionSignature.slice(0, 8)}...</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
