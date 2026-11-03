import React, { FC, useState } from 'react';
import {
  Copy,
  Check,
  ExternalLink,
  Info,
  ArrowUpRight,
  TrendingUp,
  Users,
  Activity,
  Layers,
  Zap,
  Repeat,
  ShieldCheck,
  User,
  Award,
} from 'lucide-react';
import { AppConfig, formatAddress, getExplorerUrl } from '../lib/solana';
import { UserRecord, EarningsRecord } from '../lib/referral-engine';

interface ForsageDashboardProps {
  config: AppConfig;
  user: UserRecord;
  earnings: {
    l1Earnings: number;
    l2Earnings: number;
    l3Earnings: number;
    crossoverEarnings?: number;
    contributionEarnings?: number;
    totalEarnings: number;
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
  onNavigateToPartners?: () => void;
  onNavigateToDocs?: () => void;
  onNavigateToContribute?: () => void;
  onNavigateToJoin?: () => void;
  onInspectSlotLevel?: (level: number) => void;
}

export const ForsageDashboard: FC<ForsageDashboardProps> = ({
  config,
  user,
  earnings,
  referrals,
  aiqxBalance,
  solBalance,
  isPreviewMode = false,
  onExitPreview,
  onPreviewMemberId,
  onNavigateToMatrix,
  onNavigateToPartners,
  onNavigateToDocs,
  onNavigateToContribute,
  onNavigateToJoin,
  onInspectSlotLevel,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);

  const memberId = user.id || 1;
  const refParam = String(memberId);
  const personalLink = typeof window !== 'undefined'
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

  // Format Join Date
  const joinDateFormatted = user.joinTime
    ? new Date(user.joinTime).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '01.06.2024';

  const sponsorId = user.sponsorId || (memberId > 1 ? 1 : null);
  const activeLevels = user.activeLevels || [1];

  // Ratio calculation: total earnings / slot activation cost ratio
  const activeLevelsCost = activeLevels.reduce((acc, lvl) => {
    // 100 for L1, doubling each level
    return acc + 100 * Math.pow(2, lvl - 1);
  }, 0);
  const ratioPercent = activeLevelsCost > 0
    ? Math.max(100, Math.round((earnings.totalEarnings / activeLevelsCost) * 100))
    : 100;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Read-Only Preview Mode Notice Banner */}
      {isPreviewMode && (
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-xs">
          <div className="flex items-center space-x-2 text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span className="font-semibold">
              Preview Mode: Inspecting public on-chain profile for Member ID #{memberId}
            </span>
          </div>
          {onExitPreview && (
            <button
              onClick={onExitPreview}
              className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer transition-colors shadow-sm"
            >
              Exit Preview
            </button>
          )}
        </div>
      )}

      {/* TOP ROW: User Card (Left) & Personal Link Card (Right) - Exactly matching Forsage */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left User Card (7 cols) */}
        <div className="md:col-span-6 lg:col-span-5 p-6 rounded-3xl bg-[#11161E] border border-[#1E2533] flex items-center space-x-5 shadow-lg relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Large Avatar with Medal Badge */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#1E293B] to-[#334155] border-2 border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <User className="w-10 h-10" />
            </div>
            {/* Small golden badge icon */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 border-2 border-[#11161E] flex items-center justify-center text-black font-black text-[9px] shadow-md">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Member Details */}
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-3xl font-black text-white tracking-tight">
              ID {memberId}
            </h1>

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

            {/* Invited By Upline */}
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

        {/* Right Personal Link Card (5 cols) */}
        <div className="md:col-span-6 lg:col-span-7 p-6 rounded-3xl bg-[#11161E] border border-[#1E2533] flex flex-col justify-between shadow-lg relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-xs text-[#8B949E]">
              <span className="font-semibold">Personal link</span>
              <Info className="w-3.5 h-3.5 text-[#6E7681]" />
            </div>

            {/* Link & Copy */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0B0E14] border border-[#1E2533]">
              <span className="text-sm sm:text-base font-bold text-blue-400 font-mono truncate mr-2">
                {personalLink.replace(/^https?:\/\//, '')}
              </span>
              <button
                onClick={() => copyToClipboard(personalLink, 'link')}
                className="p-1.5 rounded-lg bg-[#171D27] hover:bg-[#202735] text-[#8B949E] hover:text-white transition-colors cursor-pointer shrink-0"
                title="Copy Personal Link"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 text-xs text-[#8B949E]">
            <span>Not a member yet? Sign up with this upline</span>
            <button
              onClick={onNavigateToJoin}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* SECOND ROW: 4 Stat Metric Cards (Forsage: Partners, Team, Ratio, Profits with sparkline) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Partners */}
        <div
          onClick={onNavigateToPartners}
          className="p-5 rounded-3xl bg-[#11161E] border border-[#1E2533] space-y-3 cursor-pointer hover:border-[#2C364A] transition-all group shadow-sm"
        >
          <div className="flex items-center space-x-1.5 text-xs text-[#8B949E]">
            <span className="font-medium">Partners</span>
            <Info className="w-3.5 h-3.5 text-[#6E7681]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-blue-400 transition-colors">
              {referrals.l1Count.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-400 font-medium flex items-center space-x-1 mt-1">
              <span>↑</span>
              <span>{referrals.l1Count > 0 ? `+${referrals.l1Count}` : '0'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Team */}
        <div
          onClick={onNavigateToPartners}
          className="p-5 rounded-3xl bg-[#11161E] border border-[#1E2533] space-y-3 cursor-pointer hover:border-[#2C364A] transition-all group shadow-sm"
        >
          <div className="flex items-center space-x-1.5 text-xs text-[#8B949E]">
            <span className="font-medium">Team</span>
            <Info className="w-3.5 h-3.5 text-[#6E7681]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white group-hover:text-blue-400 transition-colors">
              {referrals.totalNetworkCount.toLocaleString()}
            </div>
            <div className="text-xs text-emerald-400 font-medium flex items-center space-x-1 mt-1">
              <span>↑</span>
              <span>{referrals.totalNetworkCount > 0 ? `+${referrals.totalNetworkCount}` : '0'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Ratio */}
        <div className="p-5 rounded-3xl bg-[#11161E] border border-[#1E2533] space-y-3 shadow-sm">
          <div className="flex items-center space-x-1.5 text-xs text-[#8B949E]">
            <span className="font-medium">Ratio</span>
            <Info className="w-3.5 h-3.5 text-[#6E7681]" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {ratioPercent} %
            </div>
            <div className="text-xs text-emerald-400 font-medium flex items-center space-x-1 mt-1">
              <span>↑</span>
              <span>0%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Profits with Forsage Staircase Area Sparkline */}
        <div className="p-5 rounded-3xl bg-[#11161E] border border-[#1E2533] relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center space-x-1.5 text-xs text-[#8B949E]">
              <span className="font-medium">Profits</span>
              <Info className="w-3.5 h-3.5 text-[#6E7681]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white truncate">
              {earnings.totalEarnings.toLocaleString()} <span className="text-base text-blue-400 font-bold">AIQX</span>
            </div>
            <div className="text-xs text-emerald-400 font-medium flex items-center space-x-1">
              <span>↑</span>
              <span>{earnings.totalEarnings > 0 ? `+${earnings.totalEarnings} AIQX` : '0 AIQX'}</span>
            </div>
          </div>

          {/* Staircase Area SVG Chart matching Forsage image */}
          <div className="absolute right-0 bottom-0 w-36 h-20 opacity-80 pointer-events-none">
            <svg viewBox="0 0 140 80" fill="none" className="w-full h-full">
              <path
                d="M0,75 L25,75 L25,55 L60,55 L60,35 L95,35 L95,15 L140,15 L140,80 L0,80 Z"
                fill="url(#profitGrad)"
              />
              <path
                d="M0,75 L25,75 L25,55 L60,55 L60,35 L95,35 L95,15 L140,15"
                stroke="#3B82F6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <defs>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="80" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3B82F6" stopOpacity="0.4" />
                  <stop offset="1" stopColor="#3B82F6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* THIRD ROW: AIQX Programs Title + 4 Program Cards (matching Forsage x3, x4, xXx, xGold cards) */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-black text-white tracking-tight">AIQX Programs</h2>
          <button
            onClick={onNavigateToDocs}
            className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[11px] font-semibold hover:bg-blue-600/30 transition-colors cursor-pointer"
          >
            <Info className="w-3 h-3" />
            <span>Info</span>
          </button>
        </div>

        {/* 2x2 Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Program 1: Matrix X (14-Level Doubling Matrix) */}
          <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#121824] via-[#10141E] to-[#0A0D13] border border-blue-500/20 hover:border-blue-500/40 transition-all shadow-xl group overflow-hidden">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xl font-black text-white tracking-wide">Matrix X</span>
                <p className="text-xs text-[#8B949E] mt-0.5">14-Level Doubling Slot Matrix</p>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  {earnings.totalEarnings.toLocaleString()} <span className="text-sm text-blue-400 font-bold">AIQX</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#6E7681] group-hover:text-blue-400 transition-colors ml-auto mt-1" />
              </div>
            </div>

            {/* 14 Slot Preview Tiles (2 rows of 7 slots) */}
            <div className="my-6">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 14 }).map((_, idx) => {
                  const lvlNum = idx + 1;
                  const isUnlocked = activeLevels.includes(lvlNum);
                  return (
                    <div
                      key={lvlNum}
                      onClick={() => onInspectSlotLevel?.(lvlNum)}
                      title={`Level ${lvlNum}: ${isUnlocked ? 'Active' : 'Locked'}`}
                      className={`h-9 rounded-xl flex items-center justify-center font-mono text-[10px] font-bold cursor-pointer transition-all duration-200 ${
                        isUnlocked
                          ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(59,130,246,0.5)] scale-100 hover:scale-105'
                          : 'bg-[#171D27] text-[#4A5568] border border-[#232B3B]/60 hover:border-[#38455C]'
                      }`}
                    >
                      {lvlNum}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action */}
            <div className="flex items-center justify-end pt-2">
              <button
                onClick={onNavigateToMatrix}
                className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <span>Preview</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Program 2: Direct Referral Program (50%) */}
          <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#181324] via-[#120E1C] to-[#0A0D13] border border-purple-500/20 hover:border-purple-500/40 transition-all shadow-xl group overflow-hidden">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xl font-black text-white tracking-wide">Direct Line</span>
                <p className="text-xs text-[#8B949E] mt-0.5">50% Instant On-Chain Commission</p>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  {earnings.l1Earnings.toLocaleString()} <span className="text-sm text-purple-400 font-bold">AIQX</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#6E7681] group-hover:text-purple-400 transition-colors ml-auto mt-1" />
              </div>
            </div>

            {/* Visual Tiles */}
            <div className="my-6">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 14 }).map((_, idx) => {
                  const lvlNum = idx + 1;
                  const isUnlocked = activeLevels.includes(lvlNum);
                  return (
                    <div
                      key={lvlNum}
                      className={`h-9 rounded-xl flex items-center justify-center font-mono text-[10px] font-bold ${
                        isUnlocked
                          ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                          : 'bg-[#1C1628] text-[#4A5568] border border-[#2B213D]/60'
                      }`}
                    >
                      {lvlNum}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action */}
            <div className="flex items-center justify-end pt-2">
              <button
                onClick={onNavigateToPartners}
                className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <span>Partners</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Program 3: Indirect & 3rd Line Cascade (30% + 5%) */}
          <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#24131E] via-[#1C0E18] to-[#0A0D13] border border-pink-500/20 hover:border-pink-500/40 transition-all shadow-xl group overflow-hidden">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xl font-black text-white tracking-wide">Team Cascade</span>
                <p className="text-xs text-[#8B949E] mt-0.5">30% Level 2 + 5% Level 3 Rewards</p>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  {(earnings.l2Earnings + earnings.l3Earnings).toLocaleString()} <span className="text-sm text-pink-400 font-bold">AIQX</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#6E7681] group-hover:text-pink-400 transition-colors ml-auto mt-1" />
              </div>
            </div>

            {/* Visual Tiles */}
            <div className="my-6">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 14 }).map((_, idx) => {
                  const lvlNum = idx + 1;
                  const isUnlocked = activeLevels.includes(lvlNum);
                  return (
                    <div
                      key={lvlNum}
                      className={`h-9 rounded-xl flex items-center justify-center font-mono text-[10px] font-bold ${
                        isUnlocked
                          ? 'bg-pink-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                          : 'bg-[#261520] text-[#4A5568] border border-[#3D1E32]/60'
                      }`}
                    >
                      {lvlNum}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action */}
            <div className="flex items-center justify-end pt-2">
              <button
                onClick={onNavigateToMatrix}
                className="px-5 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-lg shadow-pink-500/25 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <span>Preview</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Program 4: Contribute to Earn & Treasury Slot Pool */}
          <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#241A13] via-[#1C140E] to-[#0A0D13] border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-xl group overflow-hidden">
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="text-2xl font-black text-white tracking-wide">Contribute &amp; Pool</span>
                <p className="text-xs text-[#8B949E] mt-0.5">15% Treasury Slot Isolation &amp; Grants</p>
              </div>
              <div className="text-right">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  {(earnings.contributionEarnings || 0).toLocaleString()} <span className="text-sm text-amber-400 font-bold">AIQX</span>
                </span>
                <ArrowUpRight className="w-4 h-4 text-[#6E7681] group-hover:text-amber-400 transition-colors ml-auto mt-1" />
              </div>
            </div>

            {/* Visual Tiles */}
            <div className="my-6">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 14 }).map((_, idx) => {
                  const lvlNum = idx + 1;
                  const isUnlocked = activeLevels.includes(lvlNum);
                  return (
                    <div
                      key={lvlNum}
                      className={`h-9 rounded-xl flex items-center justify-center font-mono text-[10px] font-bold ${
                        isUnlocked
                          ? 'bg-amber-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                          : 'bg-[#261B14] text-[#4A5568] border border-[#3D281D]/60'
                      }`}
                    >
                      {lvlNum}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Action */}
            <div className="flex items-center justify-end pt-2">
              <button
                onClick={onNavigateToContribute}
                className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <span>Contribute</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
