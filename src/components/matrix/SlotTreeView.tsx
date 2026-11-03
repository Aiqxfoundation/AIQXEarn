import React, { FC, useState, useEffect } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Repeat,
  ArrowUpRight,
  User,
  Loader2,
  Lock,
  CheckCircle2,
  Check,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  MatrixSlotConfig,
  MATRIX_SLOTS_CONFIG,
  UserRecord,
} from '../../lib/referral-engine';
import { AppConfig, formatAddress, getExplorerUrl } from '../../lib/solana';

export interface SlotOccupant {
  id: number;
  wallet: string;
  sponsorId?: number | null;
  isDirect: boolean;
  rewardEarned: number;
  placementType?: 'direct' | 'spillover_above' | 'spillover_below' | 'reinvest';
  timestamp?: string;
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
  totalEarnings,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedOccupant, setSelectedOccupant] = useState<SlotOccupant | null>(null);
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

  const totalSpots = slotConfig.slots;
  const directSpotsCount = slotConfig.directSpots || totalSpots - 1;

  const spots: (SlotOccupant | null)[] = Array.from({ length: totalSpots }, (_, i) => {
    const isRecycleSpot = i === totalSpots - 1;
    if (!isUnlocked) return null;

    if (!isRecycleSpot) {
      const partner = teamMembers[i];
      if (partner) {
        return {
          id: partner.id,
          wallet: partner.wallet,
          sponsorId: partner.sponsorId,
          isDirect: true,
          placementType: 'direct',
          rewardEarned: slotConfig.directReward,
          timestamp: new Date().toISOString(),
          subPartners: partner.subDownlines || [
            { id: partner.id * 10 + 1, wallet: 'DownlineA' },
            { id: partner.id * 10 + 2, wallet: 'DownlineB' },
          ],
        };
      }
      if (user.id === 1 || activeLevels.length > 1) {
        const demoId = 42000 + slotLevel * 10 + (i + 1);
        const placement = i === 1 ? 'spillover_above' : 'direct';
        return {
          id: demoId,
          wallet: `0x${demoId.toString(16)}...${(demoId * 3).toString(16).slice(0, 4)}`,
          sponsorId: user.id || 1,
          isDirect: placement === 'direct',
          placementType: placement as any,
          rewardEarned: slotConfig.directReward,
          timestamp: new Date().toISOString(),
          subPartners: [
            { id: demoId * 10 + 1, wallet: `0x${demoId + 1}` },
            { id: demoId * 10 + 2, wallet: `0x${demoId + 2}` },
          ],
        };
      }
      return null;
    } else {
      if (user.id === 1 && slotLevel <= 2) {
        return {
          id: 42999,
          wallet: '0xReinvest...Cycle1',
          sponsorId: user.sponsorId || null,
          isDirect: false,
          placementType: 'reinvest',
          rewardEarned: slotConfig.slotActivationFee,
          timestamp: new Date().toISOString(),
        };
      }
      return null;
    }
  });

  const filledSpotsCount = spots.filter(Boolean).length;
  const slotProfitAiqx = filledSpotsCount * slotConfig.directReward;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fadeIn">
      {/* TOP CONTROLS & 12-SLOT SELECTOR (Pure UI, No Text) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-[#111622] border border-[#1E2533] shadow-md">
        {/* Back Button & Slot Header */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToDashboard}
            className="p-2.5 rounded-2xl bg-[#151D2A] hover:bg-[#1E293B] text-white border border-[#222E42] transition-colors cursor-pointer flex items-center justify-center shadow-sm"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center space-x-2">
            <span className="text-base font-black text-white font-mono tracking-wide">
              SLOT {slotConfig.level}
            </span>
            <span className="text-xs font-mono font-bold text-blue-400 bg-blue-600/15 px-2.5 py-0.5 rounded-full border border-blue-500/30">
              {slotConfig.totalPackageFee.toLocaleString()} AIQX
            </span>
            {isUnlocked ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-[#6E7681]" />
            )}
          </div>
        </div>

        {/* 12-Slot Quick Switcher */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1 px-1.5 rounded-2xl bg-[#0B0E14] border border-[#18202D]">
          {MATRIX_SLOTS_CONFIG.map((lvl) => {
            const unlocked = activeLevels.includes(lvl.level);
            const isSelected = lvl.level === slotConfig.level;

            return (
              <button
                key={lvl.level}
                onClick={() => onSelectSlotLevel(lvl.level)}
                className={`w-8 h-8 rounded-xl font-mono text-xs font-black transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 scale-105 ring-2 ring-blue-400'
                    : unlocked
                    ? 'bg-[#151D2A] text-emerald-400 hover:bg-[#1E293B] border border-emerald-500/30'
                    : 'bg-[#0E131C] text-[#556070] hover:text-[#8B949E] hover:bg-[#151D2A]'
                }`}
              >
                {lvl.level}
              </button>
            );
          })}
        </div>

        {/* Cycle Navigator & Upgrade CTA */}
        <div className="flex items-center space-x-2">
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

          {!isUnlocked && isNextInLine && onActivateSlot && (
            <button
              onClick={() => onActivateSlot(slotConfig)}
              disabled={isActivating}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center space-x-1.5"
            >
              {isActivating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5" />
              )}
              <span>Upgrade {slotConfig.totalPackageFee.toLocaleString()} AIQX</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 CLEAN METRIC CARDS (Exact Dashboard Theme) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#111622] border border-[#1E2533] shadow-sm">
          <div className="text-xs text-[#8B949E] mb-1 font-mono">Cost</div>
          <div className="text-2xl font-black text-white font-mono">
            {slotConfig.totalPackageFee.toLocaleString()} <span className="text-xs text-blue-400">AIQX</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#111622] border border-[#1E2533] shadow-sm">
          <div className="text-xs text-[#8B949E] mb-1 font-mono">Spots</div>
          <div className="text-2xl font-black text-white font-mono">
            {filledSpotsCount} / {totalSpots}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#111622] border border-[#1E2533] shadow-sm">
          <div className="text-xs text-[#8B949E] mb-1 font-mono">Reward</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            +{slotConfig.directReward.toLocaleString()} <span className="text-xs text-white">AIQX</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#111622] border border-[#1E2533] shadow-sm">
          <div className="text-xs text-[#8B949E] mb-1 font-mono">Profits</div>
          <div className="text-2xl font-black text-white font-mono">
            {slotProfitAiqx.toLocaleString()} <span className="text-xs text-blue-400">AIQX</span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE VISUAL MATRIX TREE (AIQX Matrix Connected Tree Architecture) */}
      <div className="rounded-3xl bg-[#0A0D14] border border-[#1A2232] shadow-2xl overflow-hidden relative">
        {/* Zoom Controls Bar */}
        <div className="bg-[#0E131E]/90 backdrop-blur-md border-b border-[#1A2333] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-white">Tree Matrix</span>
            <span className="text-[10px] font-mono text-blue-400 bg-blue-600/15 px-2 py-0.5 rounded-full">
              Cycle #{currentCycle}
            </span>
          </div>

          <div className="flex items-center space-x-1.5 px-1.5 py-1 rounded-xl bg-[#141B28] border border-[#202C3F]">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              className="p-1 text-[#8B949E] hover:text-white rounded-lg cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-[#8B949E] px-1">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1 text-[#8B949E] hover:text-white rounded-lg cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tree Canvas - Unified SVG (Lines and Nodes Mathematically Locked) */}
        <div className="p-4 sm:p-8 flex flex-col items-center justify-center relative bg-[radial-gradient(#172133_1px,transparent_1px)] [background-size:24px_24px] min-h-[440px] overflow-x-auto">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          <div
            className="w-full flex justify-center transition-transform duration-150 ease-out origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* 100% Vector Single SVG Tree */}
            <svg
              viewBox="0 0 900 420"
              className="w-full max-w-4xl h-auto select-none"
              style={{ minWidth: '320px' }}
            >
              <defs>
                <linearGradient id="slotRootGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#1E3A8A" />
                </linearGradient>

                <linearGradient id="slotAmberGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#B45309" />
                </linearGradient>

                <linearGradient id="slotPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#6D28D9" />
                </linearGradient>

                <linearGradient id="slotEmptyAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#18150D" />
                  <stop offset="100%" stopColor="#0F0D08" />
                </linearGradient>

                <linearGradient id="slotEmptyPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#141126" />
                  <stop offset="100%" stopColor="#0B0915" />
                </linearGradient>

                <linearGradient id="slotSubGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#1D4ED8" />
                </linearGradient>

                <filter id="slotBlueGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="slotAmberGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="slotPurpleGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* ── VECTOR CONNECTING DROPLINES (MATHEMATICALLY LOCKED TO SPOT CENTERS) ── */}
              {/* Leader Stem Downward */}
              <line
                x1="450"
                y1="95"
                x2="450"
                y2="135"
                stroke="#3B82F6"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Horizontal Distribution Rail */}
              {totalSpots > 1 && (() => {
                const pad = totalSpots <= 4 ? 140 : 80;
                const usable = 900 - 2 * pad;
                const firstX = pad + (0.5 / totalSpots) * usable;
                const lastX = pad + ((totalSpots - 0.5) / totalSpots) * usable;
                return (
                  <line
                    x1={firstX}
                    y1="135"
                    x2={lastX}
                    y2="135"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })()}

              {/* Individual Spot Droplines */}
              {spots.map((_, idx) => {
                const pad = totalSpots <= 4 ? 140 : 80;
                const usable = 900 - 2 * pad;
                const spotX = pad + ((idx + 0.5) / totalSpots) * usable;
                const isRecycle = idx === totalSpots - 1;
                const spotR = totalSpots <= 4 ? 34 : Math.max(26, 34 - (totalSpots - 4) * 2);
                return (
                  <line
                    key={`line-${idx}`}
                    x1={spotX}
                    y1="135"
                    x2={spotX}
                    y2={205 - spotR}
                    stroke={isRecycle ? '#8B5CF6' : '#F59E0B'}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                );
              })}

              {/* Sub-partner droplines (for filled direct spots) */}
              {spots.map((spot, idx) => {
                const isRecycle = idx === totalSpots - 1;
                if (!spot || isRecycle || !spot.subPartners || spot.subPartners.length === 0) return null;
                const pad = totalSpots <= 4 ? 140 : 80;
                const usable = 900 - 2 * pad;
                const spotX = pad + ((idx + 0.5) / totalSpots) * usable;
                const spotR = totalSpots <= 4 ? 34 : Math.max(26, 34 - (totalSpots - 4) * 2);
                const subX1 = spotX - 22;
                const subX2 = spotX + 22;
                return (
                  <g key={`sublines-${idx}`}>
                    <line x1={spotX} y1={205 + spotR} x2={spotX} y2="280" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                    <line x1={subX1} y1="280" x2={subX2} y2="280" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                    <line x1={subX1} y1="280" x2={subX1} y2="305" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                    <line x1={subX2} y1="280" x2={subX2} y2="305" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                  </g>
                );
              })}

              {/* ── ROOT LEADER NODE (YOU) ── */}
              <g className="cursor-pointer">
                <circle
                  cx="450"
                  cy="55"
                  r="38"
                  fill="url(#slotRootGrad)"
                  stroke="#60A5FA"
                  strokeWidth="3"
                  filter="url(#slotBlueGlow)"
                />
                <text
                  x="450"
                  y="52"
                  fill="#FFFFFF"
                  fontSize="12"
                  fontWeight="900"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  YOU
                </text>
                <text
                  x="450"
                  y="67"
                  fill="#93C5FD"
                  fontSize="11"
                  fontWeight="700"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  ID #{user.id || 1}
                </text>
              </g>

              {/* ── LEVEL 1 SPOT NODES (DIRECT SPOTS & REINVEST) ── */}
              {spots.map((spot, idx) => {
                const pad = totalSpots <= 4 ? 140 : 80;
                const usable = 900 - 2 * pad;
                const spotX = pad + ((idx + 0.5) / totalSpots) * usable;
                const spotR = totalSpots <= 4 ? 34 : Math.max(26, 34 - (totalSpots - 4) * 2);
                const isRecycle = idx === totalSpots - 1;
                const isFilled = spot !== null;

                return (
                  <g
                    key={`node-${idx}`}
                    className="cursor-pointer"
                    onClick={() => spot && setSelectedOccupant(spot)}
                  >
                    {/* Circle Node */}
                    <circle
                      cx={spotX}
                      cy="205"
                      r={spotR}
                      fill={
                        isFilled
                          ? isRecycle
                            ? 'url(#slotPurpleGrad)'
                            : 'url(#slotAmberGrad)'
                          : isRecycle
                          ? 'url(#slotEmptyPurple)'
                          : 'url(#slotEmptyAmber)'
                      }
                      stroke={
                        isFilled
                          ? isRecycle
                            ? '#DDD6FE'
                            : '#FDE68A'
                          : isRecycle
                          ? '#8B5CF6'
                          : '#F59E0B'
                      }
                      strokeWidth={isFilled ? '3' : '2'}
                      strokeDasharray={isFilled ? 'none' : '4 3'}
                      strokeOpacity={isFilled ? '1' : '0.6'}
                      filter={
                        isFilled
                          ? isRecycle
                            ? 'url(#slotPurpleGlow)'
                            : 'url(#slotAmberGlow)'
                          : undefined
                      }
                    />

                    {/* Node Text / Icon Labels */}
                    {isFilled ? (
                      isRecycle ? (
                        <>
                          <text
                            x={spotX}
                            y="201"
                            fill="#FFFFFF"
                            fontSize={totalSpots > 5 ? '10' : '11'}
                            fontWeight="900"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            ⟳ REINVEST
                          </text>
                          <text
                            x={spotX}
                            y="215"
                            fill="#DDD6FE"
                            fontSize={totalSpots > 5 ? '8' : '9'}
                            fontWeight="700"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            UPLINE
                          </text>
                        </>
                      ) : (
                        <>
                          <text
                            x={spotX}
                            y="201"
                            fill="#FFFFFF"
                            fontSize={totalSpots > 5 ? '10' : '11'}
                            fontWeight="900"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            ID #{spot.id}
                          </text>
                          <text
                            x={spotX}
                            y="215"
                            fill="#FEF08A"
                            fontSize={totalSpots > 5 ? '8' : '9'}
                            fontWeight="800"
                            textAnchor="middle"
                            fontFamily="monospace"
                          >
                            +{slotConfig.directReward}
                          </text>
                        </>
                      )
                    ) : isRecycle ? (
                      <>
                        <text
                          x={spotX}
                          y="202"
                          fill="#A78BFA"
                          fontSize={totalSpots > 5 ? '11' : '13'}
                          fontWeight="900"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          ⟳
                        </text>
                        <text
                          x={spotX}
                          y="216"
                          fill="#7C3AED"
                          fontSize={totalSpots > 5 ? '7' : '8'}
                          fontWeight="700"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          CYCLE
                        </text>
                      </>
                    ) : (
                      <>
                        <text
                          x={spotX}
                          y="202"
                          fill="#D97706"
                          fontSize={totalSpots > 5 ? '11' : '12'}
                          fontWeight="900"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          #{idx + 1}
                        </text>
                        <text
                          x={spotX}
                          y="216"
                          fill="#92400E"
                          fontSize={totalSpots > 5 ? '7' : '8'}
                          fontWeight="700"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          OPEN
                        </text>
                      </>
                    )}

                    {/* Sub-partners underneath occupied direct spots */}
                    {isFilled && !isRecycle && spot.subPartners && spot.subPartners.length > 0 && (
                      <g>
                        {/* Sub 1 */}
                        <circle
                          cx={spotX - 22}
                          cy="320"
                          r="12"
                          fill="url(#slotSubGrad)"
                          stroke="#60A5FA"
                          strokeWidth="1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (spot.subPartners?.[0]) onPreviewMemberId?.(spot.subPartners[0].id);
                          }}
                        />
                        <text
                          x={spotX - 22}
                          y="323"
                          fill="#FFFFFF"
                          fontSize="7"
                          fontWeight="800"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          L2
                        </text>

                        {/* Sub 2 */}
                        <circle
                          cx={spotX + 22}
                          cy="320"
                          r="12"
                          fill="url(#slotSubGrad)"
                          stroke="#60A5FA"
                          strokeWidth="1.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (spot.subPartners?.[1]) onPreviewMemberId?.(spot.subPartners[1].id);
                          }}
                        />
                        <text
                          x={spotX + 22}
                          y="323"
                          fill="#FFFFFF"
                          fontSize="7"
                          fontWeight="800"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          L2
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Occupant Popover Chip */}
        {selectedOccupant && (
          <div className="mx-6 mb-6 p-4 rounded-2xl bg-[#141B28] border border-blue-500/40 flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-xs">
                #{selectedOccupant.id}
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono text-white">
                <span className="font-bold">Member #{selectedOccupant.id}</span>
                <span className="text-[#8B949E]">({formatAddress(selectedOccupant.wallet)})</span>
                <button
                  onClick={() => handleCopy(selectedOccupant.wallet)}
                  className="hover:text-blue-400 cursor-pointer"
                >
                  {copiedWallet === selectedOccupant.wallet ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold text-emerald-400">
                +{selectedOccupant.rewardEarned} AIQX
              </span>
              <button
                onClick={() => setSelectedOccupant(null)}
                className="px-2.5 py-1 rounded-lg bg-[#1B2434] hover:bg-[#253246] text-white text-xs font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RECENT OCCUPANTS STRIP (Clean Card Chips, No Text Essays) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {spots.map((spot, idx) => {
          const isRecycleSpot = idx === totalSpots - 1;

          if (spot) {
            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-[#111622] border border-[#1E2533] flex items-center justify-between space-x-3"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      isRecycleSpot
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {isRecycleSpot ? '⟳' : `#${idx + 1}`}
                  </div>
                  <div className="text-xs font-mono font-bold text-white truncate">
                    Member #{spot.id}
                  </div>
                </div>

                <div className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                  +{spot.rewardEarned} AIQX
                </div>
              </div>
            );
          }

          return (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#0E121A] border border-dashed border-[#1A2230] flex items-center justify-between space-x-3 opacity-60"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#151D2A] flex items-center justify-center font-mono text-xs text-[#526075]">
                  {isRecycleSpot ? '⟳' : `#${idx + 1}`}
                </div>
                <div className="text-xs font-mono text-[#8B949E]">
                  {isRecycleSpot ? 'Recycle' : `Spot #${idx + 1}`}
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#526075]">Open</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
