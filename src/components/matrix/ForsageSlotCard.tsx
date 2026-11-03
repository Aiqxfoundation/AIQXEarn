import React, { FC, useState } from 'react';
import {
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Repeat,
  Users,
  Eye,
  Info,
  Sparkles,
} from 'lucide-react';
import { MatrixLevelConfig } from '../../lib/referral-engine';

export interface SlotOccupant {
  position: number;
  userId: number;
  wallet: string;
  placementType: 'direct' | 'spillover_above' | 'spillover_below' | 'reinvest';
  rewardEarned: number;
  timestamp: string;
  txSignature: string;
}

export interface SlotCardData {
  completedCycles: number;
  currentCycle?: number;
  filledCount: number;
  partnersCount: number;
  totalEarned: number;
  occupants: SlotOccupant[];
}

interface ForsageSlotCardProps {
  config: MatrixLevelConfig;
  isUnlocked: boolean;
  isNextInLine: boolean;
  slotData?: SlotCardData;
  connected: boolean;
  onInspect: (level: number) => void;
  onActivate: (config: MatrixLevelConfig) => void;
}

export const ForsageSlotCard: FC<ForsageSlotCardProps> = ({
  config,
  isUnlocked,
  isNextInLine,
  slotData,
  connected,
  onInspect,
  onActivate,
}) => {
  const [hoveredSpot, setHoveredSpot] = useState<SlotOccupant | null>(null);

  const completedCycles = slotData?.completedCycles || (isUnlocked ? 1 : 0);
  const partnersCount = slotData?.partnersCount || (isUnlocked ? (config.level === 1 ? 1 : 0) : 0);
  const filledCount = slotData?.filledCount || (isUnlocked ? (config.level === 1 ? 1 : 0) : 0);
  const occupants = slotData?.occupants || [];

  // Determine how many preview spots to render
  const previewLimit = Math.min(config.slots, 6);
  const remainingSlots = Math.max(0, config.slots - previewLimit);

  const getSpotColorClass = (type?: SlotOccupant['placementType']) => {
    switch (type) {
      case 'direct':
        return 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-300 text-black shadow-[0_0_12px_rgba(16,185,129,0.45)]';
      case 'spillover_above':
        return 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-black shadow-[0_0_12px_rgba(245,166,35,0.45)]';
      case 'spillover_below':
        return 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-300 text-white shadow-[0_0_12px_rgba(139,92,246,0.45)]';
      case 'reinvest':
        return 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-300 text-black shadow-[0_0_12px_rgba(6,182,212,0.45)]';
      default:
        return 'bg-[#121721] border-[#222C3D] border-dashed text-[#4A5568] hover:border-[#3E4C63]';
    }
  };

  return (
    <div
      onClick={() => onInspect(config.level)}
      className={`group relative rounded-2xl border p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
        isUnlocked
          ? 'bg-gradient-to-b from-[#131924] to-[#0E131A] border-emerald-500/35 hover:border-emerald-400 shadow-[0_4px_24px_rgba(16,185,129,0.06)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.14)]'
          : isNextInLine
          ? 'bg-gradient-to-b from-[#171D28] to-[#10141D] border-[#F5A623]/50 hover:border-[#F5A623] shadow-[0_4px_24px_rgba(245,166,35,0.08)] ring-1 ring-[#F5A623]/25'
          : 'bg-[#0B0E14] border-[#1A2230] opacity-80 hover:opacity-100 hover:border-[#28354A]'
      }`}
    >
      {/* Glow highlight effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-white/[0.03] to-transparent rounded-tr-2xl pointer-events-none" />

      {/* Card Header: Level, Price, Badges */}
      <div className="space-y-3 pb-3 border-b border-[#1A2332]">
        <div className="flex items-center justify-between">
          {/* Level Badge */}
          <div className="flex items-center space-x-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-extrabold text-sm tracking-tight transition-transform group-hover:scale-105 ${
                isUnlocked
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : isNextInLine
                  ? 'bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30 shadow-[0_0_10px_rgba(245,166,35,0.2)]'
                  : 'bg-[#151C27] text-[#8B949E] border border-[#232D3F]'
              }`}
            >
              {config.level < 10 ? `0${config.level}` : config.level}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-white tracking-wide">
                  LEVEL {config.level}
                </span>
                {isUnlocked && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </div>
              <div className="text-[10px] text-[#8B949E] font-mono">
                {config.slots.toLocaleString()} {config.slots === 1 ? 'Slot' : 'Slots'} Capacity
              </div>
            </div>
          </div>

          {/* Forsage Cycle & Partner Counters */}
          <div className="flex items-center space-x-1.5">
            {/* Cycle / Recycle Counter */}
            <div
              title={`Recycle Count: Completed ${completedCycles} full cycles`}
              className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#0D1219] border border-[#1E2736] text-[10px] font-mono text-[#8B949E]"
            >
              <Repeat className="w-2.5 h-2.5 text-cyan-400" />
              <span className="font-bold text-white">{completedCycles}</span>
            </div>

            {/* Total Partners Occupied */}
            <div
              title={`Total Partners in this level: ${partnersCount}`}
              className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#0D1219] border border-[#1E2736] text-[10px] font-mono text-[#8B949E]"
            >
              <Users className="w-2.5 h-2.5 text-[#F5A623]" />
              <span className="font-bold text-white">{partnersCount}</span>
            </div>
          </div>
        </div>

        {/* Level Cost & Payout Preview */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline space-x-1.5">
            <span className="text-lg font-mono font-extrabold text-white">
              {config.totalPackageFee.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-[#F5A623] font-mono">AIQX</span>
          </div>

          <div className="text-[11px] font-mono text-[#8B949E]">
            Direct: <strong className="text-emerald-400">+{config.directReward.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Forsage Signature Visual Circle Spots Layout */}
      <div className="py-4 my-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#7E8B9B]">
            Matrix Spots ({filledCount}/{config.slots})
          </span>
          <span className="text-[10px] text-cyan-400/80 hover:text-cyan-300 font-mono flex items-center space-x-1">
            <Eye className="w-3 h-3" />
            <span>Inspect</span>
          </span>
        </div>

        {/* Visual Circular Nodes Cluster */}
        <div className="relative p-3 rounded-xl bg-[#090C12] border border-[#18202D] flex items-center justify-center min-h-[76px]">
          {/* Connector background track */}
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-[2px] bg-[#1A2332] z-0" />

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-2.5 max-w-full">
            {Array.from({ length: previewLimit }).map((_, idx) => {
              const spotIndex = idx + 1;
              const occ = occupants.find((o) => o.position === spotIndex) || (idx === 0 && isUnlocked ? {
                position: 1,
                userId: 2,
                wallet: '6B7g...8k1a',
                placementType: 'direct' as const,
                rewardEarned: config.directReward,
                timestamp: new Date().toISOString(),
                txSignature: 'tx_preview_mock',
              } : null);

              const isReinvestSpot = spotIndex === config.slots && config.slots > 1;
              const type = occ ? occ.placementType : undefined;

              return (
                <div
                  key={spotIndex}
                  onMouseEnter={() => occ && setHoveredSpot(occ)}
                  onMouseLeave={() => setHoveredSpot(null)}
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center border-2 font-mono text-[11px] font-bold transition-all duration-150 ${getSpotColorClass(
                    type
                  )}`}
                >
                  {occ ? (
                    type === 'reinvest' ? (
                      <Repeat className="w-3.5 h-3.5 animate-spin-slow" />
                    ) : (
                      <span>#{occ.userId}</span>
                    )
                  ) : (
                    <span className="text-[9px] opacity-40">
                      {isReinvestSpot ? '🔄' : spotIndex}
                    </span>
                  )}
                </div>
              );
            })}

            {remainingSlots > 0 && (
              <div
                title={`${remainingSlots} additional matrix spots. Click to view full diagram.`}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-dashed border-[#28354A] bg-[#0E131C] text-[10px] font-mono text-[#8B949E] hover:border-[#F5A623]/50 hover:text-white transition-colors"
              >
                +{remainingSlots}
              </div>
            )}
          </div>
        </div>

        {/* Hover Tooltip Preview */}
        {hoveredSpot && (
          <div className="mt-2 p-2 rounded-lg bg-[#141A24] border border-[#232E40] text-[10px] font-mono space-y-1 animate-fadeIn">
            <div className="flex justify-between items-center text-white">
              <span className="font-bold">Partner #{hoveredSpot.userId}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                  hoveredSpot.placementType === 'direct'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : hoveredSpot.placementType === 'spillover_above'
                    ? 'bg-amber-500/20 text-amber-400'
                    : hoveredSpot.placementType === 'reinvest'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                {hoveredSpot.placementType.replace('_', ' ')}
              </span>
            </div>
            <div className="text-[#8B949E] flex justify-between">
              <span>Reward Payout:</span>
              <span className="text-emerald-400 font-bold">+{hoveredSpot.rewardEarned.toLocaleString()} AIQX</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer: Action Buttons */}
      <div className="pt-2 border-t border-[#1A2332] space-y-2">
        {/* Slot Activation / Recycle specs */}
        <div className="flex justify-between items-center text-[10px] font-mono text-[#8B949E]">
          <span>Activation / Recycle:</span>
          <span className="text-cyan-400 font-semibold">{config.slotActivationFee.toLocaleString()} / 100 AIQX</span>
        </div>

        {/* Main CTA */}
        {isUnlocked ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspect(config.level);
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-[0_2px_12px_rgba(16,185,129,0.1)]"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active • Inspect Matrix</span>
          </button>
        ) : isNextInLine ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onActivate(config);
            }}
            disabled={!connected}
            className="w-full py-2.5 px-3 rounded-xl bg-[#F5A623] hover:bg-[#e59917] disabled:bg-[#1A2230] disabled:text-[#6E7681] text-[#0B0E11] text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 shadow-[0_4px_16px_rgba(245,166,35,0.3)] cursor-pointer"
          >
            <span>Activate L{config.level} ({config.totalPackageFee.toLocaleString()} AIQX)</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="w-full py-2.5 px-3 rounded-xl bg-[#121721] text-[#6E7681] border border-[#1E2736] text-xs font-semibold flex items-center justify-center space-x-1.5 cursor-not-allowed"
          >
            <Lock className="w-3.5 h-3.5 text-[#4A5568]" />
            <span>Locked (Upgrade L{config.level - 1} First)</span>
          </button>
        )}
      </div>
    </div>
  );
};
