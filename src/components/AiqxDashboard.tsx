import React, { FC, useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  ArrowUpRight,
  TrendingUp,
  Users,
  User,
  Award,
  Settings,
  HelpCircle,
  Share2,
  Lock,
  Loader2,
} from 'lucide-react';
import { AppConfig, formatAddress, getExplorerUrl } from '../lib/solana';
import {
  UserRecord,
  EarningsRecord,
  MATRIX_SLOTS_CONFIG,
  MatrixSlotConfig,
} from '../lib/referral-engine';

interface AiqxDashboardProps {
  config: AppConfig;
  user: UserRecord;
  earnings: {
    l1Earnings: number;
    l2Earnings: number;
    l3Earnings: number;
    crossoverEarnings?: number;
    crossoverCount?: number;
    contributionEarnings?: number;
    totalEarnings: number;
    uplineRecycleEarnings?: number;
    downlineRewardEarnings?: number;
    history: EarningsRecord[];
  };
  referrals: {
    l1Count: number;
    l2Count: number;
    l3Count: number;
    totalNetworkCount: number;
    tree: {
      l1: UserRecord[];
      l2: UserRecord[];
      l3: UserRecord[];
    };
  };
  aiqxBalance: number;
  solBalance: number;
  isPreviewMode?: boolean;
  onExitPreview?: () => void;
  onPreviewMemberId?: (id: number) => void;
  onNavigateToMatrix?: () => void;
  onNavigateToTeamPicture?: () => void;
  onNavigateToDocs?: () => void;
  onNavigateToJoin?: () => void;
  onInspectSlotLevel?: (level: number) => void;
  onRefreshData?: () => void;
  baseTokenPriceUsd?: number;
}

export const AiqxDashboard: FC<AiqxDashboardProps> = ({
  config,
  user,
  earnings,
  referrals,
  aiqxBalance,
  solBalance,
  baseTokenPriceUsd = 0.0002613,
  isPreviewMode = false,
  onExitPreview,
  onPreviewMemberId,
  onNavigateToDocs,
  onNavigateToJoin,
  onInspectSlotLevel,
  onRefreshData,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const memberId = user.id || 1;
  const refParam = String(memberId);
  const personalLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${refParam}`
      : `https://aiqx.network/?ref=${refParam}`;

  const copyToClipboard = async (text: string, type: 'link' | 'wallet') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedWallet(true);
        setTimeout(() => setCopiedWallet(false), 2000);
      }
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join AIQX Solana Matrix',
          text: `Join my AIQX Matrix team with Sponsor ID #${memberId}!`,
          url: personalLink,
        });
      } catch (e) {
        copyToClipboard(personalLink, 'link');
      }
    } else {
      copyToClipboard(personalLink, 'link');
    }
  };

  const joinDateFormatted = user.joinTime
    ? new Date(user.joinTime).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '07.06.2024';

  const sponsorId = user.sponsorId || (memberId > 1 ? 1 : null);
  const activeLevels = user.activeLevels || [1];
  const nextSlotToUpgrade = MATRIX_SLOTS_CONFIG.find((s) => !activeLevels.includes(s.level));

  const handleActivateLevel = async (lvl: MatrixSlotConfig, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      setIsActivating(true);
      const target = user.wallet || String(memberId);
      const res = await fetch('/api/matrix/upgrade-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: target,
          level: lvl.level,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onRefreshData?.();
      }
    } catch (err: any) {
      console.warn('Slot activation error:', err);
    } finally {
      setIsActivating(false);
    }
  };

  // Efficiency ratio
  const activeLevelsCost = activeLevels.reduce((acc, lvl) => {
    return acc + 100 * Math.pow(2, lvl - 1);
  }, 0);
  const ratioPercent =
    activeLevelsCost > 0
      ? Math.max(100, Math.round((earnings.totalEarnings / activeLevelsCost) * 100))
      : 100;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-[#F5A623]/10 border border-[#F5A623]/30 text-xs shadow-md">
          <div className="flex items-center space-x-2 text-[#F5A623]">
            <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-ping" />
            <span className="font-semibold">
              Preview Mode: ID #{memberId}
            </span>
          </div>
          {onExitPreview && (
            <button
              onClick={onExitPreview}
              className="px-3.5 py-1.5 rounded-xl bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] font-bold cursor-pointer transition-colors shadow-sm"
            >
              Exit Preview
            </button>
          )}
        </div>
      )}

      {/* ROW 1: USER PROFILE BANNER (AIQX Matrix UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left User Card (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#11161E] border border-[#1E2533] flex items-center space-x-5 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#F5A623]/5 rounded-full blur-2xl pointer-events-none" />

          {/* Avatar with Gold Badge */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-[#171D27] border-2 border-[#F5A623]/40 flex items-center justify-center text-[#F5A623] shadow-lg">
              <User className="w-10 h-10 text-[#F5A623]" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#F5A623] border-2 border-[#11161E] flex items-center justify-center text-[#0B0E11] font-black text-[9px] shadow-md">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Member Details */}
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
                MEMBER {memberId}
              </h1>
              <span className="text-xs font-mono font-bold text-[#F5A623] bg-[#F5A623]/15 px-2 py-0.5 rounded-lg border border-[#F5A623]/30">
                ID {memberId}
              </span>
              <Settings className="w-4 h-4 text-[#6E7681] hover:text-white cursor-pointer transition-colors shrink-0" />
            </div>

            {/* Wallet Address with Copy and Explorer */}
            <div className="flex items-center space-x-2 text-xs font-mono text-[#8B949E]">
              <span className="truncate">{formatAddress(user.wallet)}</span>
              <button
                onClick={() => copyToClipboard(user.wallet, 'wallet')}
                className="hover:text-white transition-colors cursor-pointer"
                title="Copy Address"
              >
                {copiedWallet ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <a
                href={getExplorerUrl(user.wallet, 'address', 'mainnet-beta')}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#F5A623] transition-colors"
                title="View on Solana Explorer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Invited By Sponsor */}
            <div className="text-xs text-[#6E7681] pt-0.5">
              <span>invited {joinDateFormatted} by </span>
              {sponsorId ? (
                <button
                  onClick={() => onPreviewMemberId?.(sponsorId)}
                  className="text-[#F5A623] font-bold hover:underline cursor-pointer"
                >
                  ID {sponsorId}
                </button>
              ) : (
                <span className="text-emerald-400 font-bold">GENESIS ROOT</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Personal Link Card (7 cols - Sleek DEX Theme Card) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-[#11161E] border border-[#1E2533] flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-[#F5A623]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8B949E]">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm text-white">My personal link</span>
                <HelpCircle className="w-3.5 h-3.5 text-[#6E7681]" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#8B949E]" />
            </div>

            {/* Link Text */}
            <div className="text-sm sm:text-base font-extrabold text-[#F5A623] font-mono tracking-tight truncate py-1">
              {personalLink}
            </div>

            {/* Action Buttons: Copy & Share */}
            <div className="flex items-center space-x-3 pt-1">
              <button
                onClick={() => copyToClipboard(personalLink, 'link')}
                className="px-5 py-2 rounded-xl bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-[0_2px_8px_rgba(245,166,35,0.25)]"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#0B0E11]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="px-5 py-2 rounded-xl bg-[#171D27] hover:bg-[#1E2533] text-white border border-[#232B3B] font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>Share</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 text-xs text-[#8B949E] border-t border-[#1E2533] mt-3">
            <span>Not a member yet? Sign up with this upline</span>
            <button
              onClick={onNavigateToJoin}
              className="px-4 py-1.5 rounded-lg bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] font-extrabold text-xs shadow-sm transition-all cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* ROW 2: TOTAL PROFITS (Prominent Card with Smooth Cyan/Blue Rising Curve & Dial - Exact 1673642635095_2_e3b8dde4.jpeg) */}
      <div className="p-6 rounded-2xl bg-[#11161E] border border-[#1E2533] shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="space-y-1 relative z-10 max-w-md">
          {/* Header: Profits ? */}
          <div className="flex items-center space-x-1.5 text-xs text-[#8B949E]">
            <span className="font-bold text-white text-base">Profits</span>
            <span title="Total cumulative AIQX reward payments sent directly to your Solana wallet">
              <HelpCircle className="w-3.5 h-3.5 text-[#6E7681] hover:text-white transition-colors cursor-pointer" />
            </span>
          </div>

          {/* Large Main Number e.g. 217.2 AIQX */}
          <div className="pt-1">
            <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">
              {earnings.totalEarnings.toLocaleString()}{' '}
              <span className="text-base sm:text-lg font-bold text-[#F5A623]">AIQX</span>
            </div>
            <div className="text-xs text-[#6E7681] font-mono mt-0.5">
              ≈ ${(earnings.totalEarnings * baseTokenPriceUsd).toFixed(2)} USD
            </div>
          </div>

          {/* Bottom Green Badge with Dial: ↑ +X AIQX (Exact Image Match) */}
          <div className="pt-3 flex items-center space-x-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs font-mono font-bold text-emerald-400 shadow-sm">
              <span>↑ {earnings.totalEarnings > 0 ? `+${earnings.totalEarnings.toLocaleString()} AIQX` : '0 AIQX'}</span>
              {/* Mini Green Pie Dial */}
              <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" fill="#143A2C" />
                  <circle
                    cx="10"
                    cy="10"
                    r="4.5"
                    stroke="#10B981"
                    strokeWidth="7"
                    strokeDasharray={earnings.totalEarnings > 0 ? '21 28.27' : '0 28.27'}
                    transform="rotate(-90 10 10)"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Smooth Rising Electric-Blue Wave Curve Chart (Exact Image 1673642635095_2_e3b8dde4.jpeg) */}
        <div className="absolute right-0 bottom-0 w-52 sm:w-80 h-28 sm:h-32 pointer-events-none select-none">
          <svg viewBox="0 0 320 120" fill="none" className="w-full h-full">
            <defs>
              <filter id="profitBlueGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <linearGradient id="profitCurveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            {/* Subtle Gradient Area Under Curve */}
            <path
              d="M 10,105 C 90,105 150,100 205,68 C 260,35 290,18 320,8 L 320,120 L 10,120 Z"
              fill="url(#profitCurveGrad)"
            />
            {/* Smooth Electric-Blue Rising Curve */}
            <path
              d="M 10,105 C 90,105 150,100 205,68 C 260,35 290,18 320,8"
              stroke="#38BDF8"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#profitBlueGlow)"
            />
          </svg>
        </div>
      </div>

      {/* ROW 3: 3 CARDS ROW (Partners | Team | Matrix Grid with L2-L3 Income Notice) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Partners (Direct Partners) */}
        <div className="p-5 rounded-2xl bg-[#11161E] border border-[#1E2533] shadow-2xl group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-white text-sm">Partners</span>
              <span title="Direct members invited by your link (Line 1, 50% reward)">
                <HelpCircle className="w-3.5 h-3.5 text-[#6E7681]" />
              </span>
            </div>
            <span className="text-[10px] text-[#8B949E] block mb-2 font-mono">Personal Referrals (L1)</span>
          </div>

          <div>
            <div className="text-3xl font-black text-white font-mono group-hover:text-[#F5A623] transition-colors">
              {referrals.l1Count.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1E2533]/60">
              <div className="text-xs text-emerald-400 font-bold flex items-center space-x-1 font-mono">
                <span>↑</span>
                <span>{referrals.l1Count > 0 ? `+${referrals.l1Count}` : '0'}</span>
              </div>
              {/* Mini Circular Dial */}
              <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" fill="#171D27" />
                  <circle
                    cx="10"
                    cy="10"
                    r="4.5"
                    stroke={referrals.l1Count > 0 ? '#10B981' : '#4B5563'}
                    strokeWidth="7"
                    strokeDasharray={referrals.l1Count > 0 ? '18 28.27' : '0 28.27'}
                    transform="rotate(-90 10 10)"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Team (Total Network) */}
        <div className="p-5 rounded-2xl bg-[#11161E] border border-[#1E2533] shadow-2xl group flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-white text-sm">Team</span>
              <span title="Total downline members across all lines in your community matrix">
                <HelpCircle className="w-3.5 h-3.5 text-[#6E7681]" />
              </span>
            </div>
            <span className="text-[10px] text-[#8B949E] block mb-2 font-mono">Full Community Network</span>
          </div>

          <div>
            <div className="text-3xl font-black text-white font-mono group-hover:text-[#F5A623] transition-colors">
              {referrals.totalNetworkCount.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1E2533]/60">
              <div className="text-xs text-emerald-400 font-bold flex items-center space-x-1 font-mono">
                <span>↑</span>
                <span>{referrals.totalNetworkCount > 0 ? `+${referrals.totalNetworkCount}` : '0'}</span>
              </div>
              {/* Mini Circular Dial */}
              <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" fill="#171D27" />
                  <circle
                    cx="10"
                    cy="10"
                    r="4.5"
                    stroke={referrals.totalNetworkCount > 0 ? '#10B981' : '#4B5563'}
                    strokeWidth="7"
                    strokeDasharray={referrals.totalNetworkCount > 0 ? '24 28.27' : '0 28.27'}
                    transform="rotate(-90 10 10)"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Matrix Grid (With dynamic L2-L3 & Crossover Overtake notice & dots) */}
        {(() => {
          const l2Earned = earnings.l2Earnings || 0;
          const l3Earned = earnings.l3Earnings || 0;

          // Detect Crossover events & earnings from history or direct fields
          const crossoverHistory = (earnings.history || []).filter(
            (e) => e.category === 'crossover_split' || Boolean(e.notes && e.notes.includes('CROSSOVER'))
          );
          const crossoverCount = earnings.crossoverCount ?? crossoverHistory.length;
          const crossoverEarned =
            earnings.crossoverEarnings && earnings.crossoverEarnings > 0
              ? earnings.crossoverEarnings
              : crossoverHistory.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

          const hasCrossover = crossoverCount > 0 || crossoverEarned > 0;
          const totalL2L3Earned = l2Earned + l3Earned;
          const totalMatrixGridEarned = totalL2L3Earned + crossoverEarned;
          const hasL2L3 = referrals.l2Count > 0 || referrals.l3Count > 0 || totalL2L3Earned > 0;

          return (
            <div className="p-5 rounded-2xl bg-[#11161E] border border-[#1E2533] shadow-2xl flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-white text-sm">Matrix Grid</span>
                    <span title="Downline Matrix Grid showing automated Line 2 (30%), Line 3 (5%), and Crossover (Overtake pass-up) team rewards">
                      <HelpCircle className="w-3.5 h-3.5 text-[#6E7681]" />
                    </span>
                  </div>

                  {/* Dynamic Badges: Crossover & L2-L3 */}
                  <div className="flex items-center space-x-1.5">
                    {hasCrossover && (
                      <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-[10px] font-mono text-amber-300 font-bold shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                        <span>⚡ Crossover Active</span>
                      </div>
                    )}

                    {hasL2L3 ? (
                      <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>L2–L3 Active</span>
                      </div>
                    ) : !hasCrossover ? (
                      <span className="text-[10px] text-[#6E7681] font-mono">L2–L3 Standby</span>
                    ) : null}
                  </div>
                </div>

                {/* Subtitle / Income Notice Description */}
                <span className="text-[10px] text-[#8B949E] block mb-2 font-mono truncate">
                  {hasCrossover ? (
                    <span className="text-amber-300/90 font-medium">
                      ⚡ Crossover: +{crossoverEarned.toLocaleString()} AIQX
                      {hasL2L3 ? ` • L2 (30%): +${l2Earned} • L3 (5%): +${l3Earned}` : ''}
                    </span>
                  ) : hasL2L3 ? (
                    `L2 (30%): +${l2Earned} AIQX • L3 (5%): +${l3Earned} AIQX`
                  ) : (
                    'L2 (30%) • L3 (5%) • Crossover (Overtake) Rewards'
                  )}
                </span>

                {/* Mini Visual Matrix Grid (Lines 1, 2, 3 Dots + Crossover Row) */}
                <div className="bg-[#0B0E11] p-2.5 rounded-xl border border-[#1E2533] space-y-1.5 my-1">
                  {/* Line 1 (Direct 50% + Recycle) */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8B949E]">
                    <span className="text-white font-bold">L1 (50%)</span>
                    <div className="flex items-center space-x-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${referrals.l1Count >= 1 ? 'bg-[#3B82F6] shadow-[0_0_6px_#3B82F6]' : 'bg-[#1E2533]'}`} />
                      <span className={`w-2.5 h-2.5 rounded-full ${referrals.l1Count >= 2 ? 'bg-[#3B82F6] shadow-[0_0_6px_#3B82F6]' : 'bg-[#1E2533]'}`} />
                      <span className={`w-2.5 h-2.5 rounded-full ${referrals.l1Count >= 3 ? 'bg-emerald-400 shadow-[0_0_6px_#10B981]' : 'bg-[#1E2533]'}`} title="Recycle Spot" />
                    </div>
                  </div>

                  {/* Line 2 (Team 30% Downlines) */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8B949E]">
                    <span className={referrals.l2Count > 0 ? 'text-indigo-300 font-bold' : 'text-[#8B949E]'}>
                      L2 (30%)
                    </span>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 4 }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-2.5 h-2.5 rounded-full ${
                            referrals.l2Count > idx
                              ? 'bg-indigo-400 shadow-[0_0_6px_#818CF8]'
                              : 'bg-[#1E2533]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Line 3 (Network 5% Downlines) */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8B949E]">
                    <span className={referrals.l3Count > 0 ? 'text-cyan-300 font-bold' : 'text-[#8B949E]'}>
                      L3 (5%)
                    </span>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 8 }).map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-2 h-2 rounded-full ${
                            referrals.l3Count > idx
                              ? 'bg-cyan-400 shadow-[0_0_5px_#22D3EE]'
                              : 'bg-[#1E2533]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Crossover (Overtake Pass-up Row) */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8B949E] pt-1 border-t border-[#1E2533]/60">
                    <div className="flex items-center space-x-1.5">
                      <span className={hasCrossover ? 'text-amber-300 font-black' : 'text-[#8B949E]'}>
                        ⚡ Crossover
                      </span>
                      {hasCrossover && (
                        <span className="text-[9px] text-amber-300 bg-amber-500/20 px-1 rounded font-extrabold">
                          +{crossoverEarned.toLocaleString()} AIQX
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: 4 }).map((_, idx) => {
                        const isFilled = hasCrossover && idx < Math.max(1, Math.min(4, crossoverCount || 1));
                        return (
                          <span
                            key={idx}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                              isFilled
                                ? 'bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 shadow-[0_0_8px_#F59E0B] border border-amber-200 animate-pulse'
                                : 'bg-[#1E2533]'
                            }`}
                            title={
                              isFilled
                                ? `Crossover spot filled: Downline member bypassed unqualified upline and paid upward (+${crossoverEarned.toLocaleString()} AIQX)`
                                : 'Crossover spot: Activates when downline members activate higher slots before their sponsors'
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Tactile Overtake Notice Banner if Crossover happened */}
                {hasCrossover && (
                  <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono text-amber-300 my-1 shadow-sm">
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
                      <span className="font-bold truncate">Overtake pass-up captured!</span>
                    </div>
                    <span className="font-mono font-black text-amber-200 shrink-0 ml-1">
                      +{crossoverEarned.toLocaleString()} AIQX
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Row: Total Grid Earned & Dial */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1E2533]/60">
                <div className="text-xs text-emerald-400 font-bold flex items-center space-x-1 font-mono">
                  <span>↑</span>
                  <span>
                    {totalMatrixGridEarned > 0 ? `+${totalMatrixGridEarned.toLocaleString()} AIQX` : '0 AIQX'}
                  </span>
                  {hasCrossover && (
                    <span className="text-[10px] text-amber-400 font-normal">
                      (⚡ +{crossoverEarned.toLocaleString()})
                    </span>
                  )}
                </div>
                {/* Mini Circular Dial */}
                <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="8" fill="#171D27" />
                    <circle
                      cx="10"
                      cy="10"
                      r="4.5"
                      stroke={hasCrossover ? '#F59E0B' : hasL2L3 ? '#10B981' : '#4B5563'}
                      strokeWidth="7"
                      strokeDasharray={hasCrossover || hasL2L3 ? '22 28.27' : '0 28.27'}
                      transform="rotate(-90 10 10)"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ROW 3: SINGLE MATRIX PROGRAM CARD (All 12 Slots Inside, Pure UI, No Text Walls) */}
      <div className="space-y-4 pt-1">
        {/* Section Header */}
        <div className="flex items-center space-x-2">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            AIQX Matrix Programs
          </h2>
          <button
            onClick={onNavigateToDocs}
            className="px-2.5 py-0.5 rounded-full bg-[#171D27] hover:bg-[#1E2533] text-[#F5A623] border border-[#F5A623]/30 font-bold text-xs shadow-sm cursor-pointer transition-colors"
          >
            Info
          </button>
        </div>

        {/* Single Clean Matrix Program Card */}
        <div className="p-6 rounded-2xl bg-[#11161E] border border-[#1E2533] shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Program Name & 12 Mini Slot Tiles Matrix (2 rows of 6 squares, NO numbers inside) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black text-white tracking-wide">
                  AIQX Matrix
                </span>
              </div>

              {/* 12 Pure Visual Slot Boxes: Colorful if Activated, Clean Muted if Not Reached Yet, No Numbers */}
              <div className="grid grid-cols-6 gap-2 w-fit">
                {MATRIX_SLOTS_CONFIG.map((lvl) => {
                  const isUnlocked = activeLevels.includes(lvl.level);
                  return (
                    <button
                      key={lvl.level}
                      onClick={() => onInspectSlotLevel?.(lvl.level)}
                      aria-label={`Slot ${lvl.level}`}
                      title={`Slot ${lvl.level}: ${lvl.totalPackageFee.toLocaleString()} AIQX (${
                        isUnlocked ? 'Activated & Active' : 'Not Reached Yet'
                      })`}
                      className={`w-9 h-7 sm:w-11 sm:h-8 rounded-lg transition-all cursor-pointer relative group ${
                        isUnlocked
                          ? 'bg-gradient-to-tr from-[#2563EB] via-[#3B82F6] to-[#60A5FA] border border-[#93C5FD]/50 shadow-[0_0_10px_rgba(59,130,246,0.45)] hover:scale-105'
                          : 'bg-[#121722]/80 border border-[#1E2738] hover:border-[#2C3B54] hover:bg-[#182030] opacity-40 hover:opacity-75'
                      }`}
                    >
                      {/* Clean empty box - NO numbers written inside */}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Total Earnings in Program & Preview Button */}
            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-4">
              <div className="text-left md:text-right">
                <div className="flex items-center md:justify-end space-x-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {earnings.totalEarnings.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-[#F5A623] font-mono">AIQX</span>
                  <ArrowUpRight className="w-5 h-5 text-[#8B949E]" />
                </div>
              </div>

              {/* Action: Keep ONLY Preview Button (No upgrade price or 130 AIQX) */}
              <div>
                <button
                  onClick={() => onInspectSlotLevel?.(1)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <span>Preview</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
