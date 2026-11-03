import React, { FC, useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  Lock,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  FileCode2,
  Users,
  Coins,
  Sparkles,
  ArrowUpRight,
  Database,
} from 'lucide-react';
import { MATRIX_LEVELS_CONFIG, OFFICIAL_TREASURY_WALLET, GENESIS_ROOT_WALLET } from '../../lib/referral-engine';
import { AppConfig, formatAddress, getExplorerUrl } from '../../lib/solana';

interface FoundationOverviewProps {
  config: AppConfig;
  onNavigateToMatrix?: () => void;
  onNavigateToContribute?: () => void;
}

export const FoundationOverview: FC<FoundationOverviewProps> = ({
  config,
  onNavigateToMatrix,
  onNavigateToContribute,
}) => {
  const [copiedTreasury, setCopiedTreasury] = useState(false);
  const [copiedRoot, setCopiedRoot] = useState(false);

  const copy = (text: string, type: 'treasury' | 'root') => {
    navigator.clipboard.writeText(text);
    if (type === 'treasury') {
      setCopiedTreasury(true);
      setTimeout(() => setCopiedTreasury(false), 2000);
    } else {
      setCopiedRoot(true);
      setTimeout(() => setCopiedRoot(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-2">
      {/* Hero Protocol Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#141A23] to-[#0D1117] border border-[#1E2533] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-[#F5A623]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AIQX Foundation Matrix Program</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Contribute to Earn <span className="text-[#F5A623]">&amp; Matrix X</span>
            </h1>
            <p className="text-sm text-[#8B949E] leading-relaxed">
              A 100% on-chain, non-custodial Solana ecosystem built for community token adoption.
              Featuring an automated 14-level doubling matrix, permanent sequential ID network,
              and mathematically guaranteed smart contract reward execution with zero admin interference.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={onNavigateToMatrix}
                className="px-5 py-2.5 rounded-lg bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] font-bold text-xs flex items-center space-x-2 transition-all shadow-[0_4px_16px_rgba(245,166,35,0.25)] cursor-pointer"
              >
                <span>Explore Matrix X (14 Levels)</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={onNavigateToContribute}
                className="px-5 py-2.5 rounded-lg bg-[#171D27] hover:bg-[#1E2533] text-white border border-[#232B3B] font-semibold text-xs flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-[#F5A623]" />
                <span>Contribute to Earn</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="grid grid-cols-2 gap-3 sm:w-80">
            <div className="p-3.5 rounded-xl bg-[#0B0E11]/80 border border-[#1E2533]">
              <span className="text-[11px] text-[#8B949E]">Doubling Levels</span>
              <p className="text-xl font-mono font-bold text-white mt-0.5">14 Levels</p>
              <span className="text-[10px] text-emerald-400 font-mono">1 to 8,192 Slots</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B0E11]/80 border border-[#1E2533]">
              <span className="text-[11px] text-[#8B949E]">Total Fixed Supply</span>
              <p className="text-xl font-mono font-bold text-white mt-0.5">4.5M AIQX</p>
              <span className="text-[10px] text-[#8B949E]">SPL Decimals: 6</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B0E11]/80 border border-[#1E2533]">
              <span className="text-[11px] text-[#8B949E]">Direct Payout</span>
              <p className="text-xl font-mono font-bold text-[#F5A623] mt-0.5">50%</p>
              <span className="text-[10px] text-[#8B949E]">Level 1 Direct</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B0E11]/80 border border-[#1E2533]">
              <span className="text-[11px] text-[#8B949E]">Custody Model</span>
              <p className="text-xl font-mono font-bold text-emerald-400 mt-0.5">0% Admin</p>
              <span className="text-[10px] text-emerald-400 font-mono">Non-Custodial</span>
            </div>
          </div>
        </div>
      </div>

      {/* Strict Protocol Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-2.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Lock className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Strict Treasury Rule</h3>
          <p className="text-xs text-[#8B949E] leading-relaxed">
            The Treasury wallet receives <strong>strictly slot activation fees</strong> (15 AIQX in L1, doubling per level).
            No referral commissions or crossover splits are ever sent to Treasury.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#F5A623]/10 border border-[#F5A623]/20 flex items-center justify-center text-[#F5A623]">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">No Admin Control</h3>
          <p className="text-xs text-[#8B949E] leading-relaxed">
            No administrator can freeze earnings, block withdrawals, change balances, redirect commissions,
            or confiscate member funds. All rules are immutably executed on Solana.
          </p>
        </div>

        <div className="p-5 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-bold text-white">Permanent Sequential ID</h3>
          <p className="text-xs text-[#8B949E] leading-relaxed">
            Every member is assigned an immutable numerical ID (ID 1 Root, ID 2, ID 3...).
            Referral links follow <code>?ref=&lt;ID&gt;</code> and matrix placements persist perpetually.
          </p>
        </div>
      </div>

      {/* Verified Core Contracts & Addresses */}
      <div className="p-5 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-4">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#F5A623]" />
          <span>Verified On-Chain Architecture &amp; Accounts</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Treasury Address */}
          <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#1E2533] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Official Treasury Wallet:</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Slot Fees Only
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs text-[#8B949E] break-all">
              <span>{OFFICIAL_TREASURY_WALLET}</span>
              <div className="flex items-center space-x-1 ml-2 shrink-0">
                <button
                  onClick={() => copy(OFFICIAL_TREASURY_WALLET, 'treasury')}
                  className="p-1 rounded hover:bg-[#1E2533] text-[#8B949E] hover:text-white transition-colors cursor-pointer"
                  title="Copy Treasury Address"
                >
                  {copiedTreasury ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={getExplorerUrl(OFFICIAL_TREASURY_WALLET, 'address', config.network)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded hover:bg-[#1E2533] text-[#8B949E] hover:text-[#F5A623] transition-colors cursor-pointer"
                  title="View on Solana Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Root Genesis Sponsor */}
          <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#1E2533] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Genesis Root Sponsor (ID #1):</span>
              <span className="text-[10px] font-mono text-[#F5A623] bg-[#F5A623]/10 px-2 py-0.5 rounded border border-[#F5A623]/20">
                Permanent Root
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs text-[#8B949E] break-all">
              <span>{GENESIS_ROOT_WALLET}</span>
              <div className="flex items-center space-x-1 ml-2 shrink-0">
                <button
                  onClick={() => copy(GENESIS_ROOT_WALLET, 'root')}
                  className="p-1 rounded hover:bg-[#1E2533] text-[#8B949E] hover:text-white transition-colors cursor-pointer"
                  title="Copy Genesis Address"
                >
                  {copiedRoot ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={getExplorerUrl(GENESIS_ROOT_WALLET, 'address', config.network)}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 rounded hover:bg-[#1E2533] text-[#8B949E] hover:text-[#F5A623] transition-colors cursor-pointer"
                  title="View on Solana Explorer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 14-Level Doubling Matrix Specification Table */}
      <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white">14-Level Doubling Matrix Mathematics</h3>
            <p className="text-xs text-[#8B949E]">
              Each level doubles slot capacity, commission allocation, and slot activation fee.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
            Integer-Based Exact Math
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1E2533] text-[#8B949E]">
                <th className="py-2.5 px-3">Level</th>
                <th className="py-2.5 px-3">Slots</th>
                <th className="py-2.5 px-3 text-[#F5A623]">Direct (50%)</th>
                <th className="py-2.5 px-3">Indirect (30%)</th>
                <th className="py-2.5 px-3">3rd Line (5%)</th>
                <th className="py-2.5 px-3 text-emerald-400">Slot Fee (15%)</th>
                <th className="py-2.5 px-3 text-white font-bold text-right">Total Package</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2230]">
              {MATRIX_LEVELS_CONFIG.map((lvl) => (
                <tr key={lvl.level} className="hover:bg-[#151C27] transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">L{lvl.level}</td>
                  <td className="py-2.5 px-3 text-[#C9D1D9]">{lvl.slots.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-[#F5A623] font-semibold">{lvl.directReward.toLocaleString()} AIQX</td>
                  <td className="py-2.5 px-3 text-[#C9D1D9]">{lvl.indirectReward.toLocaleString()} AIQX</td>
                  <td className="py-2.5 px-3 text-[#8B949E]">{lvl.thirdLineReward.toLocaleString()} AIQX</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-semibold">{lvl.slotActivationFee.toLocaleString()} AIQX</td>
                  <td className="py-2.5 px-3 text-right font-extrabold text-white">
                    {lvl.totalPackageFee.toLocaleString()} AIQX
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
