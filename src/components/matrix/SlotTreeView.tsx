import React, { FC, useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Repeat,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Users,
  Award,
  Sparkles,
  Zap,
  Loader2,
  User,
  ShieldCheck,
  Circle,
} from 'lucide-react';
import {
  MatrixSlotConfig,
  MATRIX_SLOTS_CONFIG,
  UserRecord,
} from '../../lib/referral-engine';
import { AppConfig, formatAddress } from '../../lib/solana';

interface SlotOccupant {
  id: number;
  wallet: string;
  sponsorId?: number | null;
  isDirect: boolean;
  rewardEarned: number;
  subPartners?: { id: number; wallet: string }[];
}

interface SlotTreeViewProps {
  config: AppConfig;
  user: UserRecord;
  slotLevel: number;
  onSelectSlotLevel: (level: number) => void;
  onBackToDashboard: () => void;
  onActivateSlot?: (slotConfig: MatrixSlotConfig) => void;
  onPreviewMemberId?: (id: number) => void;
  isActivating?: boolean;
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
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  const activeLevels = user.activeLevels || [1];
  const slotConfig: MatrixSlotConfig =
    MATRIX_SLOTS_CONFIG.find((s) => s.level === slotLevel) || MATRIX_SLOTS_CONFIG[0];
  const isUnlocked = activeLevels.includes(slotConfig.level);
  const isNextInLine =
    !isUnlocked &&
    (slotConfig.level === 1 || activeLevels.includes(slotConfig.level - 1));

  // Load team downlines for realistic occupants in the tree
  useEffect(() => {
    let isMounted = true;
    const fetchTreeData = async () => {
      try {
        const rootIdOrWallet = user.id ? String(user.id) : (user.wallet || '1');
        const res = await fetch(`/api/team/picture/${rootIdOrWallet}`);
        const data = await res.json();
        if (isMounted && data && data.success && data.directPartners) {
          setTeamMembers(data.directPartners);
        }
      } catch (e) {
        console.warn('Failed to fetch tree nodes:', e);
      }
    };
    fetchTreeData();
    return () => {
      isMounted = false;
    };
  }, [user.id, user.wallet, slotLevel]);

  // Construct spots for this slot based on rule: N direct spots + 1 recycling spot
  const totalSpots = slotConfig.slots;
  const directSpotsCount = slotConfig.directSpots || totalSpots - 1;

  // Derive occupants for the spots
  const spots: (SlotOccupant | null)[] = Array.from({ length: totalSpots }, (_, i) => {
    const isRecycleSpot = i === totalSpots - 1;
    if (!isUnlocked) return null;

    // Direct spot occupants from team
    if (!isRecycleSpot) {
      const partner = teamMembers[i];
      if (partner) {
        return {
          id: partner.id,
          wallet: partner.wallet,
          sponsorId: partner.sponsorId,
          isDirect: true,
          rewardEarned: slotConfig.directReward,
          subPartners: partner.subDownlines || [
            { id: partner.id * 10 + 1, wallet: 'DownlineA' },
            { id: partner.id * 10 + 2, wallet: 'DownlineB' },
            { id: partner.id * 10 + 3, wallet: 'DownlineC' },
          ],
        };
      }
      // If user is ID 1 (root) or has active slots, populate demo nodes so tree is never empty
      if (user.id === 1 || activeLevels.length > 1) {
        const demoId = 42430 + (slotLevel * 10) + (i + 1);
        return {
          id: demoId,
          wallet: `0x${demoId.toString(16)}...${(demoId * 7).toString(16).slice(0, 4)}`,
          sponsorId: user.id || 1,
          isDirect: true,
          rewardEarned: slotConfig.directReward,
          subPartners: [
            { id: demoId * 10 + 1, wallet: `0x${(demoId + 100).toString(16)}` },
            { id: demoId * 10 + 2, wallet: `0x${(demoId + 200).toString(16)}` },
            { id: demoId * 10 + 3, wallet: `0x${(demoId + 300).toString(16)}` },
          ],
        };
      }
      return null;
    } else {
      // Recycle spot
      if (user.id === 1 && slotLevel <= 2) {
        return {
          id: 42499,
          wallet: '0xReinvestUpline...99',
          sponsorId: user.sponsorId || null,
          isDirect: false,
          rewardEarned: slotConfig.slotActivationFee,
        };
      }
      return null;
    }
  });

  const filledSpotsCount = spots.filter(Boolean).length;

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] min-h-[640px] bg-[#0A0D14] rounded-3xl border border-[#1A2232] shadow-2xl overflow-hidden relative selection:bg-none">
      {/* ── TOP CONTROL UI (STRICTLY NO TEXT ESSAYS, ONLY CLEAN UI CONTROLS) ── */}
      <div className="shrink-0 bg-[#0E131E]/90 backdrop-blur-md border-b border-[#1A2333] px-4 py-3 flex flex-wrap items-center justify-between gap-3 z-20">
        {/* Left: Back Button & Slot Level Pill */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-2xl bg-[#151D2A] hover:bg-[#1E293B] text-white border border-[#222E42] transition-colors cursor-pointer flex items-center justify-center shadow-sm"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>

          {/* Current Slot Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-[#141B28] border border-[#202C3F]">
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                isUnlocked
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-[#1E293B] text-[#8B949E]'
              }`}
            >
              {slotConfig.level < 10 ? `0${slotConfig.level}` : slotConfig.level}
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="font-mono font-black text-white text-xs sm:text-sm tracking-wide">
                SLOT {slotConfig.level}
              </span>
              <span className="text-[11px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                {slotConfig.totalPackageFee.toLocaleString()} AIQX
              </span>
            </div>
          </div>
        </div>

        {/* Center: 12-Slot Quick Switcher Bar */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1 px-1.5 rounded-2xl bg-[#080B10] border border-[#17202E] max-w-full">
          {MATRIX_SLOTS_CONFIG.map((lvl) => {
            const unlocked = activeLevels.includes(lvl.level);
            const isSelected = lvl.level === slotConfig.level;

            return (
              <button
                key={lvl.level}
                onClick={() => onSelectSlotLevel(lvl.level)}
                className={`w-7 h-7 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 scale-105 ring-1 ring-blue-400'
                    : unlocked
                    ? 'bg-[#151D2A] text-emerald-400 hover:bg-[#1E293B] border border-emerald-500/30'
                    : 'bg-[#0E131C] text-[#556070] hover:text-[#8B949E] hover:bg-[#151D2A]'
                }`}
                title={`Slot ${lvl.level}: ${lvl.totalPackageFee.toLocaleString()} AIQX`}
              >
                {lvl.level}
              </button>
            );
          })}
        </div>

        {/* Right: Cycle Pill & Activation / Zoom Controls */}
        <div className="flex items-center space-x-2">
          {/* Cycle Pill with Pagination */}
          <div className="flex items-center space-x-1 px-2.5 py-1.5 rounded-2xl bg-[#141B28] border border-[#202C3F]">
            <button
              onClick={() => setCurrentCycle((prev) => Math.max(1, prev - 1))}
              disabled={currentCycle <= 1}
              className="p-1 rounded-lg text-[#8B949E] hover:text-white disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center space-x-1 px-1.5 font-mono text-xs font-bold text-white">
              <Repeat className="w-3.5 h-3.5 text-blue-400" />
              <span>{currentCycle}</span>
            </div>
            <button
              onClick={() => setCurrentCycle((prev) => prev + 1)}
              className="p-1 rounded-lg text-[#8B949E] hover:text-white cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Upgrade / Unlock CTA Button (If Locked) */}
          {!isUnlocked && isNextInLine && onActivateSlot && (
            <button
              onClick={() => onActivateSlot(slotConfig)}
              disabled={isActivating}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center space-x-1.5"
            >
              {isActivating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5" />
              )}
              <span>{slotConfig.totalPackageFee.toLocaleString()} AIQX</span>
            </button>
          )}

          {/* Zoom Buttons */}
          <div className="flex items-center space-x-1 px-1 py-1 rounded-xl bg-[#141B28] border border-[#202C3F]">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1.5 text-[#8B949E] hover:text-white rounded-lg cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-1.5 text-[10px] font-mono text-[#8B949E] hover:text-white cursor-pointer"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 text-[#8B949E] hover:text-white rounded-lg cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── CANVAS VIEWPORT (PURE VISUAL TREE & UI) ── */}
      <div className="flex-1 w-full h-full overflow-auto p-4 sm:p-8 flex flex-col items-center justify-center relative bg-[radial-gradient(#172133_1px,transparent_1px)] [background-size:24px_24px]">
        {/* Glow backdrop behind tree root */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div
          className="transition-transform duration-200 ease-out origin-center flex flex-col items-center select-none"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* ════ LEVEL 0: ROOT NODE (YOU / ACTIVE USER) ════ */}
          <div className="flex flex-col items-center relative z-10">
            <div className="relative group cursor-pointer">
              {/* Outer halo */}
              <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-red-500/30 to-amber-500/30 blur-md group-hover:blur-lg transition-all" />

              {/* Node Circle matching user attachment (Red/Coral theme for Root) */}
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-b from-[#E74C3C] to-[#C0392B] border-4 border-[#FADBD8] shadow-[0_0_30px_rgba(231,76,60,0.4)] flex flex-col items-center justify-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                  <User className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
              </div>

              {/* ID Badge Pill */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#0D121D] border border-[#2B394E] shadow-md flex items-center space-x-1 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] font-mono font-black text-white">
                  ID {user.id || 1}
                </span>
              </div>
            </div>

            <div className="mt-3.5 px-3 py-1 rounded-full bg-[#141C2B]/80 border border-[#222E42] text-[10px] font-mono text-[#8B949E]">
              {formatAddress(user.wallet || '11111111111111111111111111111111')}
            </div>
          </div>

          {/* ════ ORTHOGONAL SVG CONNECTING LINES (ROOT -> LEVEL 1 SPOTS) ════ */}
          <div className="w-full flex justify-center py-2 relative">
            <svg
              className="w-full max-w-4xl h-16 pointer-events-none"
              viewBox="0 0 800 64"
              preserveAspectRatio="none"
            >
              {/* Vertical line from root center down */}
              <line
                x1="400"
                y1="0"
                x2="400"
                y2="32"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Horizontal crossbar line connecting across all spots */}
              {totalSpots > 1 && (
                <line
                  x1={`${(1 / (totalSpots * 2)) * 800}`}
                  y1="32"
                  x2={`${((totalSpots * 2 - 1) / (totalSpots * 2)) * 800}`}
                  y2="32"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}
              {/* Vertical droplines into each spot */}
              {Array.from({ length: totalSpots }).map((_, i) => {
                const xPos = ((i * 2 + 1) / (totalSpots * 2)) * 800;
                return (
                  <line
                    key={i}
                    x1={xPos}
                    y1="32"
                    x2={xPos}
                    y2="64"
                    stroke={i === totalSpots - 1 ? '#8B5CF6' : '#10B981'}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
          </div>

          {/* ════ LEVEL 1: DIRECT & RECYCLING SPOTS (MATCHING ATTACHMENT) ════ */}
          <div className="flex items-start justify-center gap-4 sm:gap-8 px-4 flex-wrap max-w-5xl">
            {spots.map((spot, index) => {
              const isRecycleSpot = index === totalSpots - 1;
              const isFilled = spot !== null;

              return (
                <div key={index} className="flex flex-col items-center">
                  {/* Spot Circle Node */}
                  <div className="relative group cursor-pointer">
                    {/* Glow when filled */}
                    {isFilled && (
                      <div
                        className={`absolute -inset-1.5 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-all ${
                          isRecycleSpot
                            ? 'bg-purple-500/40'
                            : 'bg-emerald-500/40'
                        }`}
                      />
                    )}

                    {/* Spot Circle */}
                    <div
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex flex-col items-center justify-center transition-transform group-hover:scale-105 ${
                        isFilled
                          ? isRecycleSpot
                            ? 'bg-gradient-to-b from-[#8B5CF6] to-[#6D28D9] border-4 border-[#DDD6FE] shadow-[0_0_20px_rgba(139,92,246,0.5)]'
                            : 'bg-gradient-to-b from-[#10B981] to-[#047857] border-4 border-[#A7F3D0] shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                          : isRecycleSpot
                          ? 'bg-[#141126] border-2 border-dashed border-purple-500/40 text-purple-400'
                          : 'bg-[#0E151A] border-2 border-dashed border-emerald-500/30 text-emerald-400/60'
                      }`}
                    >
                      {isFilled ? (
                        isRecycleSpot ? (
                          <Repeat className="w-8 h-8 text-white animate-spin-slow" />
                        ) : (
                          <User className="w-8 h-8 sm:w-9 sm:h-9 text-white" />
                        )
                      ) : isRecycleSpot ? (
                        <div className="flex flex-col items-center">
                          <Repeat className="w-5 h-5 text-purple-400/80" />
                          <span className="text-[9px] font-mono font-bold mt-0.5">RECYCLE</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <span className="text-sm sm:text-base font-black font-mono">
                            #{index + 1}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* ID / Status Pill Below Spot */}
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#0D121D] border border-[#2B394E] shadow-md flex items-center space-x-1 whitespace-nowrap">
                      {isFilled ? (
                        <>
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isRecycleSpot ? 'bg-purple-400' : 'bg-emerald-400'
                            }`}
                          />
                          <span className="text-[10px] font-mono font-black text-white">
                            {isRecycleSpot ? '⟳ Reinvest' : `ID ${spot.id}`}
                          </span>
                        </>
                      ) : (
                        <span className="text-[9px] font-mono font-bold text-[#6E7681]">
                          {isRecycleSpot ? 'Cycle Spot' : 'Empty'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reward Earned Chip if filled */}
                  {isFilled && !isRecycleSpot && (
                    <div className="mt-4 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-extrabold text-emerald-400">
                      +{spot.rewardEarned} AIQX
                    </div>
                  )}

                  {/* ════ LEVEL 2: SUB-DOWNLINES UNDER FILLED DIRECT SPOTS ════ */}
                  {/* (Matches user attachment diagram with 3 sub-child nodes branching under each direct) */}
                  {isFilled && !isRecycleSpot && spot.subPartners && (
                    <div className="flex flex-col items-center mt-3">
                      {/* Droplines */}
                      <svg
                        className="w-24 sm:w-28 h-8 pointer-events-none"
                        viewBox="0 0 100 32"
                      >
                        <line x1="50" y1="0" x2="50" y2="16" stroke="#06B6D4" strokeWidth="2" />
                        <line x1="16" y1="16" x2="84" y2="16" stroke="#06B6D4" strokeWidth="2" />
                        <line x1="16" y1="16" x2="16" y2="32" stroke="#06B6D4" strokeWidth="2" />
                        <line x1="50" y1="16" x2="50" y2="32" stroke="#06B6D4" strokeWidth="2" />
                        <line x1="84" y1="16" x2="84" y2="32" stroke="#06B6D4" strokeWidth="2" />
                      </svg>

                      {/* 3 Sub-Nodes (Cyan themed matching attachment) */}
                      <div className="flex items-center space-x-2">
                        {spot.subPartners.slice(0, 3).map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            onClick={() => onPreviewMemberId?.(sub.id)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#06B6D4] to-[#0891B2] border-2 border-[#A5F3FC] shadow-sm flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                            title={`Sub-partner ID ${sub.id}`}
                          >
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── BOTTOM FLOATING STATUS BAR (ICONS & METRICS ONLY, NO TEXT WALLS) ── */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 px-4 py-2 rounded-2xl bg-[#0E1420]/90 backdrop-blur-md border border-[#1E293B] shadow-xl">
          {/* Filled Counter */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#141C2B] border border-[#232F42] text-xs font-mono font-bold text-white">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>
              {filledSpotsCount} / {totalSpots}
            </span>
          </div>

          {/* Recycle Indicator */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#141C2B] border border-[#232F42] text-xs font-mono font-bold text-purple-400">
            <Repeat className="w-3.5 h-3.5 text-purple-400" />
            <span>1 Recycle</span>
          </div>

          {/* Direct Earning Per Spot */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-[#141C2B] border border-[#232F42] text-xs font-mono font-bold text-emerald-400">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>+{slotConfig.directReward} AIQX</span>
          </div>
        </div>
      </div>
    </div>
  );
};
