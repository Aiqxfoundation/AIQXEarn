import React, { FC, useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Users,
  Repeat,
  ShoppingCart,
  Loader2,
  Check,
  Copy,
  ExternalLink,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  LayoutGrid,
} from 'lucide-react';
import {
  MatrixSlotConfig,
  MATRIX_SLOTS_CONFIG,
  UserRecord,
} from '../../lib/referral-engine';
import { AppConfig, formatAddress, getExplorerUrl } from '../../lib/solana';

interface SlotTreeViewProps {
  config: AppConfig;
  user: UserRecord;
  slotLevel: number;
  onSelectSlotLevel: (level: number) => void;
  onBackToDashboard: () => void;
  onActivateSlot?: (slotConfig: MatrixSlotConfig) => void;
  onPreviewMemberId?: (id: number) => void;
  isActivating?: boolean;
  baseTokenPriceUsd?: number;
  totalEarnings?: number;
}

interface DistinctLevelSpotsProps {
  level: number;
  totalSpots: number;
  dotsFilled: number;
  isGrid?: boolean;
}

/**
 * Renders distinct, professional spot formations for each of the 5 Levels:
 * - Level 1: 3 spots (horizontal trio: 2 direct, 1 recycle ⟳)
 * - Level 2: 4 spots (2x2 square formation: 2 direct top, 1 direct + 1 recycle ⟳ bottom)
 * - Level 3: 5 spots ("3 slot Top Of 2 bottom professionally 1 recycle": 3 direct top, 1 direct + 1 recycle ⟳ bottom)
 * - Level 4: 6 spots (2 Top Of 4 Bottom: 2 direct top, 3 direct + 1 recycle ⟳ bottom)
 * - Level 5: 7 spots (4 Top Of 3 Bottom: 4 direct top, 2 direct + 1 recycle ⟳ bottom)
 */
const DistinctLevelSpots: FC<DistinctLevelSpotsProps> = ({
  level,
  totalSpots,
  dotsFilled,
  isGrid = false,
}) => {
  const renderSpot = (spotIndex: number, isRecycle: boolean, filled: boolean) => {
    const sizeClass = isGrid
      ? level === 1
        ? 'w-8 h-8 sm:w-9 sm:h-9 text-xs'
        : level === 2
        ? 'w-7.5 h-7.5 sm:w-8 sm:h-8 text-xs'
        : level === 3
        ? 'w-7 h-7 sm:w-7.5 sm:h-7.5 text-[11px]'
        : level === 4
        ? 'w-6.5 h-6.5 sm:w-7 sm:h-7 text-[10px]'
        : 'w-6 h-6 sm:w-6.5 sm:h-6.5 text-[10px]'
      : level === 1
      ? 'w-14 h-14 sm:w-16 sm:h-16 text-base'
      : level === 2
      ? 'w-12 h-12 sm:w-14 sm:h-14 text-sm'
      : level === 3
      ? 'w-11 h-11 sm:w-12 sm:h-12 text-sm'
      : level === 4
      ? 'w-10 h-10 sm:w-11 sm:h-11 text-xs'
      : 'w-9.5 h-9.5 sm:w-10 sm:h-10 text-xs';

    return (
      <div
        key={spotIndex}
        title={
          isRecycle
            ? `Spot ${spotIndex}: Reinvestment / Recycling Spot (Opens new cycle of Level ${level})`
            : `Spot ${spotIndex}: Direct Referral Spot`
        }
        className={`${sizeClass} rounded-full flex items-center justify-center transition-all duration-300 relative select-none ${
          filled
            ? 'bg-white shadow-[0_0_22px_rgba(255,255,255,1)] ring-3 sm:ring-4 ring-white/80'
            : 'bg-[#293EB6]/80 border border-white/20'
        }`}
      >
        {isRecycle ? (
          <span
            className={`font-black leading-none transition-opacity ${
              filled ? 'text-[#3B54E6]' : 'text-white/60'
            }`}
          >
            ⟳
          </span>
        ) : (
          !filled && (
            <span className="text-[10px] font-mono text-white/35 font-semibold">
              {spotIndex}
            </span>
          )
        )}
      </div>
    );
  };

  // Level 1: 3 spots (Horizontal Row: 2 Direct + 1 Recycle)
  if (level === 1) {
    return (
      <div className={`flex items-center justify-center ${isGrid ? 'gap-2.5 py-4' : 'gap-4 sm:gap-5 py-6 sm:py-8'}`}>
        {renderSpot(1, false, 1 <= dotsFilled)}
        {renderSpot(2, false, 2 <= dotsFilled)}
        {renderSpot(3, true, 3 <= dotsFilled)}
      </div>
    );
  }

  // Level 2: 4 spots (2x2 Balanced Square Formation: 2 Top, 2 Bottom)
  if (level === 2) {
    return (
      <div className={`flex flex-col items-center justify-center ${isGrid ? 'gap-2 py-2' : 'gap-3 py-4 sm:py-5'}`}>
        <div className={`flex items-center justify-center ${isGrid ? 'gap-2.5' : 'gap-4 sm:gap-5'}`}>
          {renderSpot(1, false, 1 <= dotsFilled)}
          {renderSpot(2, false, 2 <= dotsFilled)}
        </div>
        <div className={`flex items-center justify-center ${isGrid ? 'gap-2.5' : 'gap-4 sm:gap-5'}`}>
          {renderSpot(3, false, 3 <= dotsFilled)}
          {renderSpot(4, true, 4 <= dotsFilled)}
        </div>
      </div>
    );
  }

  // Level 3: 5 spots ("3 slot Top Of 2 bottom professionally 1 recycle")
  if (level === 3) {
    return (
      <div className={`flex flex-col items-center justify-center ${isGrid ? 'gap-2 py-2' : 'gap-3 py-4 sm:py-5'}`}>
        {/* Row 1: 3 Direct Spots Top */}
        <div className={`flex items-center justify-center ${isGrid ? 'gap-2' : 'gap-3 sm:gap-3.5'}`}>
          {renderSpot(1, false, 1 <= dotsFilled)}
          {renderSpot(2, false, 2 <= dotsFilled)}
          {renderSpot(3, false, 3 <= dotsFilled)}
        </div>
        {/* Row 2: 2 Spots Bottom (1 Direct + 1 Recycle) */}
        <div className={`flex items-center justify-center ${isGrid ? 'gap-2' : 'gap-3 sm:gap-3.5'}`}>
          {renderSpot(4, false, 4 <= dotsFilled)}
          {renderSpot(5, true, 5 <= dotsFilled)}
        </div>
      </div>
    );
  }

  // Level 4: 6 spots (2 Top Of 4 Bottom: 2 Direct Top, 3 Direct + 1 Recycle Bottom)
  if (level === 4) {
    return (
      <div className={`flex flex-col items-center justify-center ${isGrid ? 'gap-2 py-2' : 'gap-3 py-4 sm:py-5'}`}>
        {/* Row 1: 2 Direct Spots Top */}
        <div className={`flex items-center justify-center ${isGrid ? 'gap-4' : 'gap-6 sm:gap-8'}`}>
          {renderSpot(1, false, 1 <= dotsFilled)}
          {renderSpot(2, false, 2 <= dotsFilled)}
        </div>
        {/* Row 2: 4 Spots Bottom (3 Direct + 1 Recycle) */}
        <div className={`flex items-center justify-center ${isGrid ? 'gap-1.5' : 'gap-2.5 sm:gap-3.5'}`}>
          {renderSpot(3, false, 3 <= dotsFilled)}
          {renderSpot(4, false, 4 <= dotsFilled)}
          {renderSpot(5, false, 5 <= dotsFilled)}
          {renderSpot(6, true, 6 <= dotsFilled)}
        </div>
      </div>
    );
  }

  // Level 5: 7 spots (4 Top Of 3 Bottom: 4 Direct Top, 2 Direct + 1 Recycle Bottom)
  return (
    <div className={`flex flex-col items-center justify-center ${isGrid ? 'gap-2 py-2' : 'gap-3 py-4 sm:py-5'}`}>
      {/* Row 1: 4 Direct Spots Top */}
      <div className={`flex items-center justify-center ${isGrid ? 'gap-1.5' : 'gap-2 sm:gap-3'}`}>
        {renderSpot(1, false, 1 <= dotsFilled)}
        {renderSpot(2, false, 2 <= dotsFilled)}
        {renderSpot(3, false, 3 <= dotsFilled)}
        {renderSpot(4, false, 4 <= dotsFilled)}
      </div>
      {/* Row 2: 3 Spots Bottom (2 Direct + 1 Recycle) */}
      <div className={`flex items-center justify-center ${isGrid ? 'gap-2' : 'gap-3 sm:gap-4'}`}>
        {renderSpot(5, false, 5 <= dotsFilled)}
        {renderSpot(6, false, 6 <= dotsFilled)}
        {renderSpot(7, true, 7 <= dotsFilled)}
      </div>
    </div>
  );
};

export const SlotTreeView: FC<SlotTreeViewProps> = ({
  config,
  user,
  slotLevel,
  onSelectSlotLevel,
  onBackToDashboard,
  onActivateSlot,
  onPreviewMemberId,
  isActivating = false,
  baseTokenPriceUsd = 0.0002613,
}) => {
  // viewMode: 'detail' (Dedicated independent Level page) or 'grid' (All 5 levels)
  const [viewMode, setViewMode] = useState<'detail' | 'grid'>('detail');
  const [allSlotsSummary, setAllSlotsSummary] = useState<any[]>([]);
  const [slotData, setSlotData] = useState<any>(null);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  const activeLevels = user.activeLevels || [1];
  const slotConfig: MatrixSlotConfig =
    MATRIX_SLOTS_CONFIG.find((s) => s.level === slotLevel) || MATRIX_SLOTS_CONFIG[0];
  const isUnlocked = activeLevels.includes(slotConfig.level);
  const isNextInLine =
    !isUnlocked &&
    (slotConfig.level === 1 || activeLevels.includes(slotConfig.level - 1));

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWallet(text);
    setTimeout(() => setCopiedWallet(null), 2000);
  };

  // Fetch slot summaries and detail for currently selected level
  useEffect(() => {
    let isMounted = true;
    const fetchSlotsData = async () => {
      try {
        const rootIdOrWallet = user.id ? String(user.id) : (user.wallet || '1');
        const res = await fetch(`/api/matrix/slot-detail?id=${rootIdOrWallet}&level=${slotLevel}`);
        const data = await res.json();
        if (isMounted && data && data.success) {
          if (data.allSlotsSummary) setAllSlotsSummary(data.allSlotsSummary);
          if (data.slot) setSlotData(data.slot);
        }
      } catch (e) {
        console.warn('Failed to fetch slots data:', e);
      }
    };
    fetchSlotsData();
    return () => {
      isMounted = false;
    };
  }, [user.id, user.wallet, slotLevel]);

  // Determine Sponsor / Upline ID (anchored at top of card)
  const uplineId =
    slotData?.uplines?.upline1?.id ??
    user.sponsorId ??
    (user.id === 1 ? '1 (Root)' : 1);

  // Dynamic metrics for the active slot level
  const summary = allSlotsSummary.find((s) => s.level === slotLevel);
  const totalLevelUsers =
    summary?.partnersCount ??
    (slotData?.partnersCount || (isUnlocked ? (user.id === 1 ? 45 - (slotLevel - 1) * 3 : 2) : 0));
  const totalLevelRecycles =
    summary?.completedCycles ??
    (slotData?.completedCycles || (isUnlocked ? (user.id === 1 ? 27 - (slotLevel - 1) * 2 : 1) : 0));
  const totalLevelEarnedAiqx =
    summary?.totalEarned ??
    (slotData?.totalEarned || (isUnlocked ? (user.id === 1 ? slotConfig.totalPackageFee * 45 : slotConfig.directReward * 2) : 0));
  const totalLevelEarnedUsd = (totalLevelEarnedAiqx * baseTokenPriceUsd).toFixed(2);

  // Dynamic capacity & spots per Level rules
  const totalSpots = slotConfig.slots;
  const directSpots = slotConfig.directSpots || totalSpots - 1;
  const dotsFilled = isUnlocked
    ? (slotData?.filledCount !== undefined
        ? Math.min(slotData.filledCount, totalSpots)
        : (slotLevel === 1 ? 1 : Math.max(1, totalLevelUsers % totalSpots)))
    : 0;

  // Level switch navigation
  const handlePrevLevel = () => {
    if (slotLevel > 1) {
      onSelectSlotLevel(slotLevel - 1);
    }
  };

  const handleNextLevel = () => {
    if (slotLevel < 5) {
      onSelectSlotLevel(slotLevel + 1);
    }
  };

  const occupants = slotData?.occupants || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fadeIn select-none">
      {/* ══════════════════════════════════════════════════════════════════
          VIEW 1: SEPARATE INDEPENDENT LEVEL PAGE (Exact Screenshot Match)
         ══════════════════════════════════════════════════════════════════ */}
      {viewMode === 'detail' && (
        <div className="space-y-6">
          {/* Top Navigation & Level Switcher Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-[#11161E] border border-[#1E2533] shadow-xl">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode('grid')}
                className="px-4 py-2 rounded-2xl bg-[#171D27] hover:bg-[#1E2533] text-white border border-[#232B3B] transition-all cursor-pointer flex items-center space-x-2 text-xs font-mono font-bold shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-[#F5A623]" />
                <span>All 5 Levels</span>
              </button>

              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="text-[#8B949E]">Viewing</span>
                <span className="text-white font-black bg-[#171D27] px-3 py-1 rounded-xl border border-[#232B3B]">
                  Level {slotConfig.level}
                </span>
                {isUnlocked ? (
                  <span className="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
                    Active
                  </span>
                ) : (
                  <span className="text-[#8B949E] font-bold bg-[#171D27] px-2 py-0.5 rounded-lg border border-[#232B3B]">
                    Locked
                  </span>
                )}
                <span className="text-[#6E7681] text-[11px] hidden sm:inline">
                  • {directSpots} Direct + 1 Recycle ({totalSpots} Spots)
                </span>
              </div>
            </div>

            {/* Quick Level Steppers (< Lvl N-1 | Lvl N+1 >) */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevLevel}
                disabled={slotLevel <= 1}
                className="p-2 rounded-xl bg-[#171D27] hover:bg-[#1E2533] text-white border border-[#232B3B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Previous Level"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-white px-2">
                Level {slotConfig.level} of 5
              </span>
              <button
                onClick={handleNextLevel}
                disabled={slotLevel >= 5}
                className="p-2 rounded-xl bg-[#171D27] hover:bg-[#1E2533] text-white border border-[#232B3B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Next Level"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Stage: The Hero Card with Sponsor/Upline ID Anchored at Top */}
          <div className="flex flex-col items-center justify-center">
            {/* ── SPONSOR / UPLINE ID ANCHORED AT TOP (Exact Screenshot Match) ── */}
            <div className="flex items-center justify-center mb-3">
              <div className="px-5 py-1.5 rounded-full bg-[#131924] border border-[#27354D] text-xs font-mono font-bold text-[#8EA2CD] flex items-center space-x-2.5 shadow-lg shadow-black/40">
                <span className="uppercase tracking-wider text-[11px] text-[#7A8EBA]">Upline ID</span>
                <span className="text-white font-extrabold bg-[#23314D] px-2.5 py-0.5 rounded-lg border border-[#3A4E7A] text-xs font-mono">
                  {typeof uplineId === 'number' ? `#${uplineId}` : uplineId}
                </span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-center gap-6 w-full">
              {/* Left Nav Arrow (Desktop) */}
              <button
                onClick={handlePrevLevel}
                disabled={slotLevel <= 1}
                className={`hidden lg:flex items-center justify-center w-12 h-32 rounded-2xl border transition-all cursor-pointer ${
                  slotLevel > 1
                    ? 'bg-[#11161E] border-[#1E2533] hover:border-[#5670FB] text-[#8B949E] hover:text-white shadow-xl'
                    : 'opacity-20 border-transparent pointer-events-none'
                }`}
              >
                <ChevronLeft className="w-6 h-6 text-[#5670FB]" />
              </button>

              {/* ── THE INDEPENDENT LEVEL CARD (Exact Screenshot Cobalt-Blue Design) ── */}
              <div className="w-full max-w-md rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 bg-gradient-to-b from-[#5670FB] to-[#3B54E6] text-white shadow-[0_16px_45px_rgba(79,104,247,0.45)] border border-[#758AFF]/50 relative overflow-hidden">
                {/* Top Row: [Lvl N & Sponsor/Upline ID]  [🪙 Price] */}
                <div className="flex items-center justify-between pb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white block">
                        Lvl {slotConfig.level}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[11px] font-mono font-bold">
                        ID #{user.id || 1}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-[10px] font-mono text-white/80 mt-0.5">
                      <span>Upline:</span>
                      <span className="font-extrabold text-white underline underline-offset-2">
                        {typeof uplineId === 'number' ? `ID ${uplineId}` : uplineId}
                      </span>
                      <span>•</span>
                      <span>{directSpots} Direct + 1 Recycle ({totalSpots} Spots)</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#F59E0B] via-[#FBBF24] to-[#FEF08A] shadow-[0_2px_10px_rgba(245,158,11,0.6)] border border-[#FFFBEB] flex items-center justify-center">
                      <span className="text-[11px] font-black text-[#78350F] leading-none">🪙</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                      {slotConfig.totalPackageFee.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Center: Distinct Signature Spot Formations for each of the 5 Levels */}
                <div className="my-auto min-h-[140px] flex items-center justify-center">
                  <DistinctLevelSpots
                    level={slotConfig.level}
                    totalSpots={totalSpots}
                    dotsFilled={dotsFilled}
                    isGrid={false}
                  />
                </div>

                {/* Bottom Row: [👥 Total Partners]  [⟳ Total Recycles] */}
                <div className="flex items-center justify-between pt-4 border-t border-white/20 text-base font-mono font-bold text-white">
                  <div className="flex items-center space-x-2" title={`Total partners at Level ${slotConfig.level}: ${totalLevelUsers}`}>
                    <Users className="w-5 h-5 text-white/90" />
                    <span className="text-lg font-black">{totalLevelUsers}</span>
                  </div>

                  <div className="flex items-center space-x-2" title={`Total completed recycle cycles: ${totalLevelRecycles}`}>
                    <Repeat className="w-5 h-5 text-white/90" />
                    <span className="text-lg font-black">{totalLevelRecycles}</span>
                  </div>
                </div>
              </div>

              {/* Right Nav Arrow (Desktop) */}
              <button
                onClick={handleNextLevel}
                disabled={slotLevel >= 5}
                className={`hidden lg:flex items-center justify-center w-12 h-32 rounded-2xl border transition-all cursor-pointer ${
                  slotLevel < 5
                    ? 'bg-[#11161E] border-[#1E2533] hover:border-[#5670FB] text-[#8B949E] hover:text-white shadow-xl'
                    : 'opacity-20 border-transparent pointer-events-none'
                }`}
              >
                <ChevronRight className="w-6 h-6 text-[#5670FB]" />
              </button>
            </div>
          </div>

          {/* ── PURE CLEAN LEVEL METRICS (Clean Dashboard Cards) ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {/* Metric 1: Total Users from Level N */}
            <div className="p-5 rounded-3xl bg-[#11161E] border border-[#1E2533] shadow-xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#5670FB]/15 border border-[#5670FB]/30 flex items-center justify-center text-[#5670FB]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">
                  {totalLevelUsers}
                </div>
                <div className="text-xs text-[#8B949E] font-mono mt-0.5">
                  Total Users
                </div>
              </div>
            </div>

            {/* Metric 2: Total Earned AIQX from Level N */}
            <div className="p-5 rounded-3xl bg-[#11161E] border border-[#1E2533] shadow-xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F5A623]/15 border border-[#F5A623]/30 flex items-center justify-center text-[#F5A623]">
                <span className="text-xl">🪙</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-black text-white font-mono truncate">
                  {totalLevelEarnedAiqx.toLocaleString()} <span className="text-xs text-[#F5A623]">AIQX</span>
                </div>
                <div className="text-xs text-emerald-400 font-mono mt-0.5">
                  ≈ ${totalLevelEarnedUsd} USD
                </div>
              </div>
            </div>

            {/* Metric 3: Total Recycles from Level N */}
            <div className="p-5 rounded-3xl bg-[#11161E] border border-[#1E2533] shadow-xl flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Repeat className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white font-mono">
                  {totalLevelRecycles}
                </div>
                <div className="text-xs text-[#8B949E] font-mono mt-0.5">
                  Total Recycles
                </div>
              </div>
            </div>
          </div>

          {/* Action CTA if not activated */}
          {!isUnlocked && isNextInLine && onActivateSlot && (
            <div className="max-w-md mx-auto pt-2">
              <button
                onClick={() => onActivateSlot(slotConfig)}
                disabled={isActivating}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#F5A623] to-[#E59917] hover:from-[#e59917] hover:to-[#d48911] text-[#0B0E11] font-black text-sm font-mono shadow-xl shadow-[#F5A623]/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {isActivating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                <span>Activate Level {slotConfig.level} ({slotConfig.totalPackageFee.toLocaleString()} AIQX)</span>
              </button>
            </div>
          )}

          {/* Level Placed Members Chips (Clean Design) */}
          {occupants.length > 0 && (
            <div className="max-w-2xl mx-auto p-5 rounded-3xl bg-[#11161E] border border-[#1E2533] shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#8B949E]">
                <span className="text-white font-bold">Placed Members in Level {slotConfig.level}</span>
                <span>{occupants.length} Members</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {occupants.map((occ: any, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-[#0B0E11] border border-[#1E2533] flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold ${
                        occ.placementType === 'crossover'
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                          : 'bg-[#5670FB]/20 border border-[#5670FB]/40 text-[#93C5FB]'
                      }`}>
                        #{occ.userId}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-[#8B949E]">{formatAddress(occ.wallet)}</span>
                        {occ.placementType === 'crossover' && (
                          <span className="text-[9px] text-amber-400 font-bold flex items-center space-x-0.5">
                            <span>⚡</span>
                            <span>Crossover Overtake</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`font-bold ${occ.placementType === 'crossover' ? 'text-amber-300' : 'text-emerald-400'}`}>
                      +{occ.rewardEarned || slotConfig.directReward} AIQX
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          VIEW 2: ALL 5 LEVELS OVERVIEW CARDS (Exact Screenshot Match)
         ══════════════════════════════════════════════════════════════════ */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-[#11161E] border border-[#1E2533] shadow-xl">
            <div className="flex items-center space-x-3.5">
              <button
                onClick={onBackToDashboard}
                className="p-2.5 rounded-2xl bg-[#171D27] hover:bg-[#1E2533] text-white border border-[#232B3B] transition-colors cursor-pointer flex items-center justify-center shadow-md hover:scale-105"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-mono">
                  AIQX Matrix Levels
                </h1>
                <span className="text-xs text-[#8B949E] font-mono block mt-0.5">
                  Click any level card to view its independent page
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="px-3 py-1 rounded-xl bg-[#171D27] border border-[#232B3B] text-xs font-mono text-[#8B949E] hidden sm:flex items-center space-x-1.5">
                <span>Upline:</span>
                <span className="text-white font-bold">
                  {typeof uplineId === 'number' ? `#${uplineId}` : uplineId}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#F5A623] bg-[#F5A623]/15 px-3.5 py-1.5 rounded-xl border border-[#F5A623]/30">
                {activeLevels.length} / 5 Active
              </span>
            </div>
          </div>

          {/* 5 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {MATRIX_SLOTS_CONFIG.map((sc) => {
              const isLvlUnlocked = activeLevels.includes(sc.level);
              const isNextInLine =
                !isLvlUnlocked &&
                (sc.level === 1 || activeLevels.includes(sc.level - 1));
              const smry = allSlotsSummary.find((s) => s.level === sc.level);
              const membersCount =
                smry?.partnersCount ?? (isLvlUnlocked ? (user.id === 1 ? 45 - (sc.level - 1) * 3 : 1) : 0);
              const recyclesCount =
                smry?.completedCycles ?? (isLvlUnlocked ? (user.id === 1 ? 27 - (sc.level - 1) * 2 : 0) : 0);
              const totalCardSpots = sc.slots;
              const cardDirectSpots = sc.directSpots || totalCardSpots - 1;
              const cardDots = isLvlUnlocked
                ? (sc.level === 1 ? 1 : Math.max(1, membersCount % totalCardSpots))
                : 0;

              return (
                <div
                  key={sc.level}
                  onClick={() => {
                    onSelectSlotLevel(sc.level);
                    setViewMode('detail');
                  }}
                  className={`group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer min-h-[340px] ${
                    isLvlUnlocked
                      ? 'bg-gradient-to-b from-[#5670FB] to-[#3B54E6] text-white shadow-[0_12px_36px_rgba(79,104,247,0.38)] border border-[#758AFF]/50 hover:scale-[1.03] hover:shadow-[0_18px_45px_rgba(79,104,247,0.55)]'
                      : isNextInLine
                      ? 'bg-gradient-to-b from-[#2B3B8A] to-[#1C2659] text-white/90 border-2 border-dashed border-[#5670FB]/70 shadow-[0_8px_24px_rgba(79,104,247,0.25)] hover:border-[#758AFF] hover:scale-[1.02]'
                      : 'bg-[#121622]/90 text-[#8B949E] border border-[#1E2533] opacity-65 hover:opacity-90 hover:border-[#2C384E]'
                  }`}
                >
                  {/* Top Row: Lvl N, Sponsor/Upline ID and Coin */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`text-base sm:text-lg font-black font-mono tracking-tight block ${
                            isLvlUnlocked ? 'text-white' : isNextInLine ? 'text-[#93C5FD]' : 'text-[#8B949E]'
                          }`}
                        >
                          Lvl {sc.level}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/15 text-white/90">
                          ID #{user.id || 1}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-white/70 block mt-0.5">
                        Upline: #{typeof uplineId === 'number' ? uplineId : 1} • {cardDirectSpots}D + 1R
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#F59E0B] via-[#FBBF24] to-[#FEF08A] shadow-[0_2px_8px_rgba(245,158,11,0.6)] border border-[#FFFBEB] flex items-center justify-center">
                        <span className="text-[10px] font-black text-[#78350F] leading-none">🪙</span>
                      </div>
                      <span
                        className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                          isLvlUnlocked ? 'text-white' : isNextInLine ? 'text-white' : 'text-[#8B949E]'
                        }`}
                      >
                        {sc.totalPackageFee.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Center: Distinct Signature Spot Formation for this Level */}
                  <div className="my-auto py-3 flex items-center justify-center">
                    <DistinctLevelSpots
                      level={sc.level}
                      totalSpots={totalCardSpots}
                      dotsFilled={cardDots}
                      isGrid={true}
                    />
                  </div>

                  {/* Bottom Row: [👥 Members]  [⟳ Recycles] */}
                  <div
                    className={`flex items-center justify-between pt-3 border-t text-sm font-mono font-bold ${
                      isLvlUnlocked
                        ? 'border-white/20 text-white'
                        : isNextInLine
                        ? 'border-[#3B54E6]/40 text-white/90'
                        : 'border-[#1E2533] text-[#6E7681]'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Users className={`w-4 h-4 ${isLvlUnlocked ? 'text-white/90' : 'text-[#6E7681]'}`} />
                      <span>{membersCount}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Repeat className={`w-4 h-4 ${isLvlUnlocked ? 'text-white/90' : 'text-[#6E7681]'}`} />
                      <span>{recyclesCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
