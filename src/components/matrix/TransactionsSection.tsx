import React, { FC, useState } from 'react';
import {
  Clock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Coins,
  Lock,
} from 'lucide-react';
import { EarningsRecord, OFFICIAL_TREASURY_WALLET } from '../../lib/referral-engine';
import { AppConfig, formatAddress, getExplorerUrl } from '../../lib/solana';

interface TransactionsSectionProps {
  config: AppConfig;
  earningsHistory: EarningsRecord[];
  userWallet?: string;
}

export const TransactionsSection: FC<TransactionsSectionProps> = ({
  config,
  earningsHistory = [],
  userWallet,
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = earningsHistory.filter((tx) => {
    if (filterType === 'all') return true;
    if (filterType === 'joining') return tx.category === 'l1_reward' && tx.level === 1;
    if (filterType === 'recycling') return tx.category === 'upline_recycle' || tx.category === 'downline_leader_reward';
    if (filterType === 'slot') return tx.level > 1;
    if (filterType === 'treasury') return tx.category === 'slot_fee_treasury';
    if (filterType === 'crossover') return tx.category === 'crossover_split';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
              Solana Blockchain Explorer Ledger
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">On-Chain Transactions</h1>
          <p className="text-xs text-[#8B949E]">
            Immutable transaction records: Joining fees, 14-level slot activations, recycling, and Treasury transfers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#8B949E] font-mono">
            Treasury: <strong className="text-emerald-400">{formatAddress(OFFICIAL_TREASURY_WALLET, 4)}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Ledger Table */}
      <div className="p-5 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2533] pb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#F5A623]" />
            <h3 className="text-sm font-bold text-white">Transaction History ({filtered.length})</h3>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'all', label: 'All Operations' },
              { id: 'joining', label: 'Joining (100 AIQX)' },
              { id: 'recycling', label: 'Recycling (100 AIQX)' },
              { id: 'slot', label: 'Slot Upgrades' },
              { id: 'crossover', label: 'Crossover Splits' },
              { id: 'treasury', label: 'Treasury Transfers' },
            ].map((b) => (
              <button
                key={b.id}
                onClick={() => setFilterType(b.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer transition-colors ${
                  filterType === b.id
                    ? 'bg-[#F5A623] text-[#0B0E11]'
                    : 'bg-[#171D27] text-[#8B949E] hover:text-white'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#8B949E]">
            No transactions found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1E2533] text-[#8B949E]">
                  <th className="py-2.5 px-3">Operation</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Source Member</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3 text-right">Solana Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2230]">
                {filtered.map((item, idx) => {
                  const isTreasury = item.category === 'slot_fee_treasury';
                  const isCrossover = item.category === 'crossover_split';
                  const isRecycle = item.category === 'upline_recycle';
                  const isLeaderReward = item.category === 'downline_leader_reward';
                  const isDirect = item.category === 'l1_reward';

                  return (
                    <tr key={idx} className="hover:bg-[#151C27] transition-colors">
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            isTreasury
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                              : isRecycle
                              ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                              : isLeaderReward
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                              : isCrossover
                              ? 'text-purple-400 bg-purple-500/10 border-purple-500/30'
                              : isDirect
                              ? 'text-[#F5A623] bg-[#F5A623]/10 border-[#F5A623]/30'
                              : 'text-white bg-[#171D27] border-[#232B3B]'
                          }`}
                        >
                          {isTreasury
                            ? 'Treasury (Recycle/Slot)'
                            : isRecycle
                            ? `Upline Recycle (L${item.level})`
                            : isLeaderReward
                            ? `Downline Reward (L${item.level})`
                            : isCrossover
                            ? 'Crossover Split'
                            : `Level ${item.level} Reward`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-white">
                        {isTreasury ? (
                          <span className="text-emerald-400 font-semibold">Treasury (2SSH...T8n1o)</span>
                        ) : (
                          formatAddress(item.wallet)
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-[#C9D1D9]">
                        {item.sourceUserId ? `#${item.sourceUserId} (${formatAddress(item.sourceWallet)})` : formatAddress(item.sourceWallet)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {Number(item.amount).toLocaleString()} AIQX
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
