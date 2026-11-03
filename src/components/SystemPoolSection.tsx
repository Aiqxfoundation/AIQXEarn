import React, { FC } from 'react';
import { ShieldCheck, ExternalLink, Database, Landmark, Lock, ArrowDownRight } from 'lucide-react';
import { AppConfig, formatAddress, getExplorerUrl } from '../lib/solana';
import { SystemPoolBreakdown } from '../lib/referral-engine';

interface SystemPoolSectionProps {
  config: AppConfig;
  poolData: SystemPoolBreakdown | null;
}

export const SystemPoolSection: FC<SystemPoolSectionProps> = ({
  config,
  poolData,
}) => {
  const total = poolData?.totalSystemPool || 0;
  const fixed = poolData?.fixedAdminAllocation || 0;
  const l2 = poolData?.level2Reserve || 0;
  const l3 = poolData?.level3Reserve || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-blue-400">
              Treasury Accounting Ledger
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Pool Reserve & Accounting</h1>
          <p className="text-xs text-[#8B949E]">
            Automated decentralized treasury reconciliation. Publicly audited on Solana.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#1E2533] text-right">
            <span className="text-[#8B949E] block text-[11px]">System Treasury Total</span>
            <span className="text-xl font-bold text-[#F5A623]">
              {total.toLocaleString(undefined, { minimumFractionDigits: 2 })} AIQX
            </span>
          </div>
        </div>
      </div>

      {/* Accounting Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Fixed 15 AIQX */}
        <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <div className="flex items-center justify-between mb-3 text-xs text-[#8B949E]">
            <span className="font-semibold text-white">Fixed Platform Share</span>
            <span className="font-mono text-[#F5A623]">15 AIQX / join</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white mb-2">
            {fixed.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-[#8B949E]">AIQX</span>
          </div>
          <p className="text-xs text-[#8B949E] leading-relaxed">
            Non-negotiable fixed allocation directed to ecosystem maintenance and liquidity backing.
          </p>
        </div>

        {/* Level 2 Reserve */}
        <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <div className="flex items-center justify-between mb-3 text-xs text-[#8B949E]">
            <span className="font-semibold text-white">Level 2 Reserve</span>
            <span className="font-mono text-amber-400">30 AIQX if missing</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white mb-2">
            {l2.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-[#8B949E]">AIQX</span>
          </div>
          <p className="text-xs text-[#8B949E] leading-relaxed">
            Preserved in treasury when a registering member does not have a second-level upline sponsor.
          </p>
        </div>

        {/* Level 3 Reserve */}
        <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <div className="flex items-center justify-between mb-3 text-xs text-[#8B949E]">
            <span className="font-semibold text-white">Level 3 Reserve</span>
            <span className="font-mono text-amber-400">5 AIQX if missing</span>
          </div>
          <div className="text-3xl font-mono font-bold text-white mb-2">
            {l3.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-[#8B949E]">AIQX</span>
          </div>
          <p className="text-xs text-[#8B949E] leading-relaxed">
            Preserved in treasury when a registering member does not have a third-level upline sponsor.
          </p>
        </div>
      </div>

      {/* Treasury Wallet & On-Chain Reconciled Address */}
      <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2533]">
          <div className="text-xs font-mono uppercase tracking-wider text-[#F5A623] font-semibold">
            Configured Treasury Wallet
          </div>
          <span className="text-[11px] font-mono text-[#8B949E]">
            Non-Custodial Destination
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-[#0B0E11] border border-[#1E2533]">
          <div>
            <span className="text-xs text-[#8B949E] block mb-1">System Wallet Address</span>
            <span className="text-sm font-mono text-white break-all">{config.systemWallet}</span>
          </div>

          <a
            href={getExplorerUrl(config.systemWallet, 'address', config.network)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-[#171D27] hover:bg-[#1E2533] text-[#F5A623] text-xs font-semibold border border-[#232B3B] transition-colors"
          >
            <span>Verify Treasury On-Chain</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="mt-4 text-xs text-[#8B949E] leading-relaxed">
          Notice: The System Wallet is an on-chain repository for platform allocations. There is no admin login or manual intervention. All distributions are hardcoded and executed atomically by user-signed Solana transactions.
        </div>
      </div>
    </div>
  );
};
