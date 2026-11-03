import React, { FC, useState } from 'react';
import {
  Layers,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  TrendingUp,
  Coins,
  Repeat,
  Users,
  Eye,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import {
  MATRIX_LEVELS_CONFIG,
  MatrixLevelConfig,
  UserRecord,
  getMatrixLevelConfig,
  OFFICIAL_TREASURY_WALLET,
} from '../../lib/referral-engine';
import { AppConfig } from '../../lib/solana';
import { AiqxSlotModal } from './AiqxSlotModal';

interface MySlotsSectionProps {
  config: AppConfig;
  user: UserRecord | null;
  aiqxBalance: number;
  onNavigateToMatrix?: () => void;
}

export const MySlotsSection: FC<MySlotsSectionProps> = ({
  config,
  user,
  aiqxBalance,
  onNavigateToMatrix,
}) => {
  const activeLevels = user?.activeLevels || [1];
  const maxActiveLevel = Math.max(...activeLevels, 1);
  const nextLevel = maxActiveLevel < 14 ? maxActiveLevel + 1 : null;
  const nextConfig = nextLevel ? getMatrixLevelConfig(nextLevel) : null;

  const [inspectingLevel, setInspectingLevel] = useState<MatrixLevelConfig | null>(null);

  const getSpotColorClass = (type?: 'direct' | 'spillover_above' | 'spillover_below' | 'reinvest') => {
    switch (type) {
      case 'direct':
        return 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-300 text-black shadow-[0_0_10px_rgba(16,185,129,0.4)]';
      case 'spillover_above':
        return 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-black shadow-[0_0_10px_rgba(245,166,35,0.4)]';
      case 'spillover_below':
        return 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-300 text-white shadow-[0_0_10px_rgba(139,92,246,0.4)]';
      case 'reinvest':
        return 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-300 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]';
      default:
        return 'bg-[#111722] border-[#222C3E] border-dashed text-[#526075]';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Overview Top Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#111622] via-[#0D121B] to-[#0A0D13] border border-[#1E2738] shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              AIQX Matrix 14-Level Architecture
            </span>
            <span className="text-xs text-[#8B949E]">|</span>
            <span className="text-xs text-[#8B949E] font-mono">
              Member <strong className="text-white">ID #{user?.id || 1}</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Matrix Slots
          </h1>
          <p className="text-xs text-[#8B949E] max-w-xl">
            Live slot capacity, circular node occupancies, cycle recycle counters, and progression tracking.
          </p>
        </div>

        {nextConfig && (
          <div className="p-4 rounded-2xl bg-[#090C12] border border-[#F5A623]/35 flex items-center space-x-4 shrink-0 shadow-lg">
            <div>
              <div className="text-[10px] text-[#8B949E] uppercase font-mono tracking-wider">Next Level Upgrade</div>
              <div className="text-base font-bold text-[#F5A623] font-mono">
                Level {nextLevel} ({nextConfig.totalPackageFee.toLocaleString()} AIQX)
              </div>
              <div className="text-[10px] text-emerald-400 font-mono">
                15 AIQX Activation • 0 Treasury on Join
              </div>
            </div>
            <button
              onClick={onNavigateToMatrix}
              className="px-4 py-2 rounded-xl bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] text-xs font-extrabold transition-all shadow-[0_2px_12px_rgba(245,166,35,0.3)] cursor-pointer"
            >
              Upgrade
            </button>
          </div>
        )}
      </div>

      {/* Quick Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#0E131C] border border-[#1A2332]">
          <span className="text-[11px] text-[#8B949E]">Current Highest Level</span>
          <p className="text-xl font-bold font-mono text-white mt-1">Level {maxActiveLevel}</p>
          <span className="text-[10px] text-emerald-400 font-mono">{activeLevels.length} of 14 Active</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0E131C] border border-[#1A2332]">
          <span className="text-[11px] text-[#8B949E]">Level 1 Slot Capacity</span>
          <p className="text-xl font-bold font-mono text-[#F5A623] mt-1">1 Spot</p>
          <span className="text-[10px] text-[#8B949E]">50 AIQX Direct Value</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0E131C] border border-[#1A2332]">
          <span className="text-[11px] text-[#8B949E]">Next Capacity Jump</span>
          <p className="text-xl font-bold font-mono text-white mt-1">
            {nextConfig ? `${nextConfig.slots.toLocaleString()} Spots` : 'Maxed Out'}
          </p>
          <span className="text-[10px] text-[#8B949E]">2x Doubling Rule</span>
        </div>
        <div className="p-4 rounded-xl bg-[#0E131C] border border-[#1A2332]">
          <span className="text-[11px] text-[#8B949E]">Slot Recycling Split</span>
          <p className="text-xl font-bold font-mono text-cyan-400 mt-1">
            100 AIQX
          </p>
          <span className="text-[10px] text-[#8B949E]">50 Upline • 10 Treasury • 40 Downline</span>
        </div>
      </div>

      {/* Matrix Color Legend Bar */}
      <div className="p-3.5 rounded-xl bg-[#0D1219] border border-[#1A2332] flex flex-wrap items-center justify-between gap-2.5 text-[11px] font-mono">
        <span className="text-white font-bold flex items-center space-x-1.5">
          <Layers className="w-3.5 h-3.5 text-[#F5A623]" />
          <span>Spot Key:</span>
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Direct</span>
          </span>
          <span className="flex items-center space-x-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Spillover (Above)</span>
          </span>
          <span className="flex items-center space-x-1 text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Spillover (Below)</span>
          </span>
          <span className="flex items-center space-x-1 text-cyan-400">
            <Repeat className="w-3 h-3 text-cyan-400" />
            <span>Reinvest Cycle</span>
          </span>
        </div>
      </div>

      {/* Active Slots Progression Cards with Visual Spots */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#F5A623]" />
          <span>14-Level Matrix Slots Breakdown</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MATRIX_LEVELS_CONFIG.map((lvl) => {
            const isUnlocked = activeLevels.includes(lvl.level);
            const isNext = lvl.level === nextLevel;
            const slotRecord = user?.slotRecords?.[lvl.level];
            const filled = slotRecord?.filledCount || (isUnlocked ? 1 : 0);
            const cycles = slotRecord?.completedCycles || (isUnlocked ? 1 : 0);
            const capacity = lvl.slots;
            const pct = Math.min(Math.round((filled / capacity) * 100), 100);
            const previewSpots = Math.min(capacity, 6);

            return (
              <div
                key={lvl.level}
                onClick={() => setInspectingLevel(lvl)}
                className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all duration-200 cursor-pointer ${
                  isUnlocked
                    ? 'bg-gradient-to-b from-[#131924] to-[#0E131A] border-emerald-500/35 hover:border-emerald-400 shadow-[0_4px_20px_rgba(16,185,129,0.06)]'
                    : isNext
                    ? 'bg-gradient-to-b from-[#171D28] to-[#10141D] border-[#F5A623]/50 hover:border-[#F5A623] shadow-[0_4px_20px_rgba(245,166,35,0.08)]'
                    : 'bg-[#0B0E14] border-[#1A2230] opacity-75 hover:opacity-90'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                        isUnlocked
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isNext
                          ? 'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30'
                          : 'bg-[#151C27] text-[#8B949E] border border-[#232D3F]'
                      }`}
                    >
                      L{lvl.level}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Matrix Level {lvl.level}</h4>
                      <p className="text-[10px] text-[#8B949E] font-mono">
                        {capacity.toLocaleString()} {capacity === 1 ? 'Spot' : 'Spots'} Capacity | Direct: +{lvl.directReward.toLocaleString()} AIQX
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#090C12] border border-[#1A2332] text-[10px] font-mono text-[#8B949E]">
                      <Repeat className="w-2.5 h-2.5 text-cyan-400" />
                      <span className="font-bold text-white">{cycles}</span>
                    </div>

                    {isUnlocked ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141B26] text-[#8B949E] border border-[#1E2838]">
                        {lvl.totalPackageFee.toLocaleString()} AIQX
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual Spots Preview */}
                <div className="p-3 rounded-xl bg-[#080B10] border border-[#18202D] flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {Array.from({ length: previewSpots }).map((_, idx) => {
                      const spotNum = idx + 1;
                      const isFilled = isUnlocked && idx < filled;
                      const isReinvest = spotNum === capacity && capacity > 1;

                      return (
                        <div
                          key={spotNum}
                          className={`w-7 h-7 rounded-full flex items-center justify-center border font-mono text-[10px] font-bold ${
                            isFilled
                              ? getSpotColorClass(idx === 0 ? 'direct' : 'spillover_above')
                              : isReinvest
                              ? getSpotColorClass('reinvest')
                              : getSpotColorClass()
                          }`}
                        >
                          {isFilled ? `#${idx + 2}` : isReinvest ? '🔄' : spotNum}
                        </div>
                      );
                    })}

                    {capacity > previewSpots && (
                      <div className="text-[10px] font-mono text-[#8B949E] pl-1">
                        +{capacity - previewSpots} more
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-cyan-400 font-mono flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>Inspect</span>
                  </span>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-[#8B949E]">Capacity Filled:</span>
                    <span className="text-white font-bold">
                      {isUnlocked ? `${filled} / ${capacity} Spots (${pct}%)` : `0 / ${capacity} Spots (Locked)`}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#080B10] overflow-hidden border border-[#1A2332]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isUnlocked ? 'bg-gradient-to-r from-[#F5A623] to-emerald-400' : 'bg-gray-800'
                      }`}
                      style={{ width: `${isUnlocked ? pct : 0}%` }}
                    />
                  </div>
                </div>

                {/* Footer specs */}
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#1A2332]">
                  <span className="text-[#8B949E]">Slot Activation / Recycling:</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    15 AIQX / 100 AIQX
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot Inspector Modal */}
      {inspectingLevel && (
        <AiqxSlotModal
          levelConfig={inspectingLevel}
          isOpen={Boolean(inspectingLevel)}
          onClose={() => setInspectingLevel(null)}
          userWallet={user?.wallet}
          userId={user?.id || 1}
          isUnlocked={activeLevels.includes(inspectingLevel.level)}
          isNextInLine={inspectingLevel.level === nextLevel}
          onActivate={onNavigateToMatrix || (() => {})}
          connected={Boolean(user?.wallet)}
        />
      )}
    </div>
  );
};
