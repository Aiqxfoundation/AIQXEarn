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
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-xs shadow-md">
          <div className="flex items-center space-x-2 text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span className="font-semibold">
              Preview Mode: ID #{memberId}
            </span>
          </div>
          {onExitPreview && (
            <button
              onClick={onExitPreview}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer transition-colors shadow-sm"
            >
              Exit Preview
            </button>
          )}
        </div>
      )}

      {/* ROW 1: USER PROFILE BANNER (AIQX Matrix UI) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left User Card (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#111622] border border-[#1E2533] flex items-center space-x-5 shadow-lg relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Avatar with Gold Badge */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#1E283D] to-[#2B3852] border-2 border-blue-500/50 flex items-center justify-center text-blue-400 shadow-lg">
              <User className="w-10 h-10 text-blue-300" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 border-2 border-[#111622] flex items-center justify-center text-black font-black text-[9px] shadow-md">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Member Details */}
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
                MEMBER {memberId}
              </h1>
              <span className="text-xs font-mono font-bold text-blue-400 bg-blue-600/15 px-2 py-0.5 rounded-lg border border-blue-500/30">
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
                className="hover:text-blue-400 transition-colors"
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
                  className="text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  ID {sponsorId}
                </button>
              ) : (
                <span className="text-emerald-400 font-bold">GENESIS ROOT</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Personal Link Card (7 cols - Blue Gradient Card) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-gradient-to-r from-[#142D5A] via-[#11244A] to-[#0E1B38] border border-blue-500/30 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-blue-200">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm text-white">My personal link</span>
                <HelpCircle className="w-3.5 h-3.5 text-blue-300" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-blue-300" />
            </div>

            {/* Link Text */}
            <div className="text-sm sm:text-base font-extrabold text-blue-300 font-mono tracking-tight truncate py-1">
              {personalLink}
            </div>

            {/* Action Buttons: Copy & Share */}
            <div className="flex items-center space-x-3 pt-1">
              <button
                onClick={() => copyToClipboard(personalLink, 'link')}
                className="px-5 py-2 rounded-2xl bg-[#1E4FD9] hover:bg-[#2563EB] text-white font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-md shadow-blue-900/30"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
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
                className="px-5 py-2 rounded-2xl bg-[#1E4FD9] hover:bg-[#2563EB] text-white font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer shadow-md shadow-blue-900/30"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 text-xs text-blue-200/80 border-t border-blue-500/20 mt-3">
            <span>Not a member yet? Sign up with this upline</span>
            <button
              onClick={onNavigateToJoin}
              className="px-4 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-900 font-extrabold text-xs shadow-sm transition-all cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* ROW 2: 4 STAT METRIC CARDS (AIQX Matrix UI) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Partners */}
        <div className="p-5 rounded-3xl bg-[#111622] border border-[#1E2533] shadow-sm group">
          <div className="flex items-center justify-between text-xs text-[#8B949E] mb-2">
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-white text-sm">Partners</span>
              <HelpCircle className="w-3 h-3 text-[#6E7681]" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors">
              {referrals.l1Count.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-400 font-bold flex items-center space-x-1 mt-1">
              <span>↑</span>
              <span>{referrals.l1Count > 0 ? `+${referrals.l1Count}` : '0'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Team */}
        <div className="p-5 rounded-3xl bg-[#111622] border border-[#1E2533] shadow-sm group">
          <div className="flex items-center justify-between text-xs text-[#8B949E] mb-2">
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-white text-sm">Team</span>
              <HelpCircle className="w-3 h-3 text-[#6E7681]" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors">
              {referrals.totalNetworkCount.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-400 font-bold flex items-center space-x-1 mt-1">
              <span>↑</span>
              <span>{referrals.totalNetworkCount > 0 ? `+${referrals.totalNetworkCount}` : '0'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Ratio */}
        <div className="p-5 rounded-3xl bg-[#111622] border border-[#1E2533] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[#8B949E] mb-2">
            <div className="flex items-center space-x-1">
              <span className="font-semibold text-white text-sm">Ratio</span>
              <HelpCircle className="w-3 h-3 text-[#6E7681]" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{ratioPercent} %</div>
            <div className="text-xs text-emerald-400 font-bold flex items-center space-x-1 mt-1">
              <span>↑</span>
              <span>0 %</span>
            </div>
          </div>
        </div>

        {/* Card 4: Profits with Staircase Area Sparkline */}
        <div className="p-5 rounded-3xl bg-[#111622] border border-[#1E2533] relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center justify-between text-xs text-[#8B949E]">
              <div className="flex items-center space-x-1">
                <span className="font-semibold text-white text-sm">Profits</span>
                <HelpCircle className="w-3 h-3 text-[#6E7681]" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white truncate">
              {earnings.totalEarnings.toLocaleString()}{' '}
              <span className="text-sm font-bold text-blue-400">AIQX</span>
            </div>
            <div className="text-xs text-emerald-400 font-bold flex items-center space-x-1 pt-0.5">
              <span>↑</span>
              <span>{earnings.totalEarnings > 0 ? `+${earnings.totalEarnings} AIQX` : '0 AIQX'}</span>
            </div>
          </div>

          {/* Smooth Rising Blue Staircase Area Chart */}
          <div className="absolute right-0 bottom-0 w-36 h-20 opacity-80 pointer-events-none">
            <svg viewBox="0 0 140 80" fill="none" className="w-full h-full">
              <path
                d="M0,75 L25,75 L25,55 L60,55 L60,35 L95,35 L95,15 L140,15 L140,80 L0,80 Z"
                fill="url(#dashProfitGrad)"
              />
              <path
                d="M0,75 L25,75 L25,55 L60,55 L60,35 L95,35 L95,15 L140,15"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="dashProfitGrad" x1="0" y1="0" x2="0" y2="80" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3B82F6" stopOpacity="0.45" />
                  <stop offset="1" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
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
            className="px-2.5 py-0.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
          >
            Info
          </button>
        </div>

        {/* Single Clean Matrix Program Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-[#141A29] via-[#121724] to-[#10141F] border border-[#1E273A] shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left: Program Name & 12 Mini Slot Tiles Matrix (2 rows of 6 squares) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black text-white tracking-wide">
                  AIQX Matrix
                </span>
              </div>

              {/* 12 Slot Tiles (2 rows of 6 rounded squares matching reference screenshot) */}
              <div className="grid grid-cols-6 gap-2 w-fit">
                {MATRIX_SLOTS_CONFIG.map((lvl) => {
                  const isUnlocked = activeLevels.includes(lvl.level);
                  return (
                    <button
                      key={lvl.level}
                      onClick={() => onInspectSlotLevel?.(lvl.level)}
                      title={`Slot ${lvl.level}: ${lvl.totalPackageFee.toLocaleString()} AIQX (${
                        isUnlocked ? 'Active' : 'Locked'
                      })`}
                      className={`w-10 h-8 rounded-lg transition-all cursor-pointer flex items-center justify-center font-mono text-xs font-black shadow-sm ${
                        isUnlocked
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 ring-1 ring-blue-400/50 scale-[1.02]'
                          : 'bg-[#1C2538] hover:bg-[#25324C] text-[#6E7681] border border-[#28354E]'
                      }`}
                    >
                      {lvl.level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Total Earnings in Program & Upgrade Action Button */}
            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-4">
              <div className="text-left md:text-right">
                <div className="flex items-center md:justify-end space-x-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                    {earnings.totalEarnings.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-blue-400 font-mono">AIQX</span>
                  <ArrowUpRight className="w-5 h-5 text-[#8B949E]" />
                </div>
              </div>

              {/* Action: Upgrade or Preview Button */}
              <div>
                {nextSlotToUpgrade ? (
                  <button
                    onClick={(e) => handleActivateLevel(nextSlotToUpgrade, e)}
                    disabled={isActivating}
                    className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    {isActivating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                    <span>
                      Upgrade {nextSlotToUpgrade.totalPackageFee.toLocaleString()} AIQX
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => onInspectSlotLevel?.(1)}
                    className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <span>Preview</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
