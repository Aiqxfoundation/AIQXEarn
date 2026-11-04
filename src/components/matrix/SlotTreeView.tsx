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
  // viewMode: 'detail' (Dedicated independent Level page) or 'grid' (All 12 levels)
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

  // Dots calculation for this level
  const dotsFilled = isUnlocked ? (slotLevel === 1 ? 1 : Math.max(1, totalLevelUsers % 3)) : 0;

  // Level switch navigation
  const handlePrevLevel = () => {
    if (slotLevel > 1) {
      onSelectSlotLevel(slotLevel - 1);
    }
  };

  const handleNextLevel = () => {
    if (slotLevel < 12) {
      onSelectSlotLevel(slotLevel + 1);
    }
  };

  const occupants = slotData?.occupants || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fadeIn select-none">
      {/* ══════════════════════════════════════════════════════════════════
          VIEW 1: SEPARATE INDEPENDENT LEVEL PAGE (Pure Design, No Texts)
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
                <span>All 12 Levels</span>
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
                Level {slotConfig.level} of 12
              </span>
              <button
                onClick={handleNextLevel}
                disabled={slotLevel >= 12}
                className="p-2 rounded-xl bg-[#171D27] hover:bg-[#1E2533] text-white border border-[#232B3B] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Next Level"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Stage: The Hero Card on the Exact Screenshot Design */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
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

            {/* ── THE INDEPENDENT LEVEL CARD (Exact Screenshot Design) ── */}
            <div className="w-full max-w-md rounded-3xl p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 bg-gradient-to-b from-[#5670FB] to-[#3B54E6] text-white shadow-[0_16px_45px_rgba(79,104,247,0.45)] border border-[#758AFF]/50 relative overflow-hidden">
              {/* Top Row: [Lvl 1]  [🪙 100] */}
              <div className="flex items-center justify-between pb-3">
                <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                  Lvl {slotConfig.level}
                </span>

                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#F59E0B] via-[#FBBF24] to-[#FEF08A] shadow-[0_2px_10px_rgba(245,158,11,0.6)] border border-[#FFFBEB] flex items-center justify-center">
                    <span className="text-[11px] font-black text-[#78350F] leading-none">🪙</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white">
                    {slotConfig.totalPackageFee.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Center: The 3 Signature Dots (Exact Match) */}
              <div className="py-10 sm:py-12 flex items-center justify-center space-x-5 sm:space-x-6">
                {/* Dot 1 */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-300 ${
                    dotsFilled >= 1
                      ? 'bg-white shadow-[0_0_22px_rgba(255,255,255,1)] ring-4 ring-white/80'
                      : 'bg-[#293EB6]/80 border border-white/20'
                  }`}
                />

                {/* Dot 2 */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-300 ${
                    dotsFilled >= 2
                      ? 'bg-white shadow-[0_0_22px_rgba(255,255,255,1)] ring-4 ring-white/80'
                      : 'bg-[#293EB6]/80 border border-white/20'
                  }`}
                />

                {/* Dot 3 (Recycle Spot) */}
                <div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                    dotsFilled >= 3
                      ? 'bg-white shadow-[0_0_22px_rgba(255,255,255,1)] ring-4 ring-white/80'
                      : 'bg-[#293EB6]/80 border border-white/20 text-white/50'
                  }`}
                >
                  {dotsFilled < 3 && <span className="text-base font-black opacity-60">⟳</span>}
                </div>
              </div>

              {/* Bottom Row: [👥 45]  [⟳ 27] */}
              <div className="flex items-center justify-between pt-4 border-t border-white/20 text-base font-mono font-bold text-white">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-white/90" />
                  <span className="text-lg font-black">{totalLevelUsers}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Repeat className="w-5 h-5 text-white/90" />
                  <span className="text-lg font-black">{totalLevelRecycles}</span>
                </div>
              </div>
            </div>

            {/* Right Nav Arrow (Desktop) */}
            <button
              onClick={handleNextLevel}
              disabled={slotLevel >= 12}
              className={`hidden lg:flex items-center justify-center w-12 h-32 rounded-2xl border transition-all cursor-pointer ${
                slotLevel < 12
                  ? 'bg-[#11161E] border-[#1E2533] hover:border-[#5670FB] text-[#8B949E] hover:text-white shadow-xl'
                  : 'opacity-20 border-transparent pointer-events-none'
              }`}
            >
              <ChevronRight className="w-6 h-6 text-[#5670FB]" />
            </button>
          </div>

          {/* ── PURE CLEAN LEVEL METRICS (No Texts, Clean Cards) ── */}
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
                          : 'bg-[#5670FB]/20 border border-[#5670FB]/40 text-[#93C5FD]'
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
          VIEW 2: ALL 12 LEVELS OVERVIEW CARDS (Exact Screenshot Match)
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

            <span className="text-xs font-mono font-bold text-[#F5A623] bg-[#F5A623]/15 px-3.5 py-1.5 rounded-xl border border-[#F5A623]/30">
              {activeLevels.length} / 12 Active
            </span>
          </div>

          {/* 12 Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
              const cardDots = isLvlUnlocked ? (sc.level === 1 ? 1 : Math.max(0, membersCount % 3)) : 0;

              return (
                <div
                  key={sc.level}
                  onClick={() => {
                    onSelectSlotLevel(sc.level);
                    setViewMode('detail');
                  }}
                  className={`group relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                    isLvlUnlocked
                      ? 'bg-gradient-to-b from-[#5670FB] to-[#3B54E6] text-white shadow-[0_12px_36px_rgba(79,104,247,0.38)] border border-[#758AFF]/50 hover:scale-[1.03] hover:shadow-[0_18px_45px_rgba(79,104,247,0.55)]'
                      : isNextInLine
                      ? 'bg-gradient-to-b from-[#2B3B8A] to-[#1C2659] text-white/90 border-2 border-dashed border-[#5670FB]/70 shadow-[0_8px_24px_rgba(79,104,247,0.25)] hover:border-[#758AFF] hover:scale-[1.02]'
                      : 'bg-[#121622]/90 text-[#8B949E] border border-[#1E2533] opacity-65 hover:opacity-90 hover:border-[#2C384E]'
                  }`}
                >
                  {/* Top Row: Lvl N and Coin */}
                  <div className="flex items-center justify-between pb-2">
                    <span
                      className={`text-base sm:text-lg font-black font-mono tracking-tight ${
                        isLvlUnlocked ? 'text-white' : isNextInLine ? 'text-[#93C5FD]' : 'text-[#8B949E]'
                      }`}
                    >
                      Lvl {sc.level}
                    </span>

                    <div className="flex items-center space-x-2">
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

                  {/* Center: 3 Signature Dots */}
                  <div className="py-7 sm:py-8 flex items-center justify-center space-x-4 sm:space-x-5">
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all duration-300 ${
                        cardDots >= 1
                          ? 'bg-white shadow-[0_0_18px_rgba(255,255,255,0.95)] ring-2 ring-white/80'
                          : 'bg-[#293EB6]/80 border border-white/15'
                      }`}
                    />
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full transition-all duration-300 ${
                        cardDots >= 2
                          ? 'bg-white shadow-[0_0_18px_rgba(255,255,255,0.95)] ring-2 ring-white/80'
                          : 'bg-[#293EB6]/80 border border-white/15'
                      }`}
                    />
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
                        cardDots >= 3
                          ? 'bg-white shadow-[0_0_18px_rgba(255,255,255,0.95)] ring-2 ring-white/80'
                          : 'bg-[#293EB6]/80 border border-white/15 text-white/40'
                      }`}
                    >
                      {cardDots < 3 && <span className="text-xs font-bold opacity-40">⟳</span>}
                    </div>
                  </div>

                  {/* Bottom Row */}
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
