import React, { FC, useState, useEffect } from 'react';
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
  Crown,
  ChevronRight,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GitBranch,
} from 'lucide-react';
import { AppConfig, formatAddress, getExplorerUrl } from '../lib/solana';
import {
  UserRecord,
  EarningsRecord,
  MATRIX_LEVELS_CONFIG,
  MatrixLevelConfig,
  OFFICIAL_TREASURY_WALLET,
} from '../lib/referral-engine';
import { ForsageSlotCard, SlotCardData } from './matrix/ForsageSlotCard';
import { ForsageSlotModal } from './matrix/ForsageSlotModal';

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
  onNavigateToPartners?: () => void;
  onNavigateToDocs?: () => void;
  onNavigateToContribute?: () => void;
  onNavigateToJoin?: () => void;
  onInspectSlotLevel?: (level: number) => void;
  onRefreshData?: () => void;
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
  onNavigateToDocs,
  onNavigateToJoin,
  onRefreshData,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedPartnerWallet, setCopiedPartnerWallet] = useState<string | null>(null);

  // Network tracking state: Line 1 (Directs), Line 2 (Indirects), Line 3 (Third Line)
  const [activeNetworkLine, setActiveNetworkLine] = useState<'l1' | 'l2' | 'l3'>('l1');

  // Downline leaders for the 40 AIQX recycling reward
  const [downlineLeaders, setDownlineLeaders] = useState<any[]>([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(false);

  // 14-Level Modal State
  const [inspectingLevel, setInspectingLevel] = useState<MatrixLevelConfig | null>(null);
  const [activatingLevel, setActivatingLevel] = useState<MatrixLevelConfig | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);

  // Level 1 slot quick recycle
  const [isRecyclingL1, setIsRecyclingL1] = useState(false);
  const [recycleSuccess, setRecycleSuccess] = useState<string | null>(null);

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

  const copyPartnerWallet = async (wallet: string) => {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopiedPartnerWallet(wallet);
      setTimeout(() => setCopiedPartnerWallet(null), 2000);
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

  // Fetch live top 3 downline leaders for 40 AIQX pool qualification
  useEffect(() => {
    let isMounted = true;
    async function loadLeaders() {
      try {
        setIsLoadingLeaders(true);
        const target = user.wallet || memberId;
        const res = await fetch(`/api/matrix/downline-leaders/${target}`);
        const data = await res.json();
        if (isMounted && data.success && data.leaders) {
          setDownlineLeaders(data.leaders);
        }
      } catch (err) {
        console.warn('Could not load downline leaders:', err);
      } finally {
        if (isMounted) setIsLoadingLeaders(false);
      }
    }
    loadLeaders();
    return () => {
      isMounted = false;
    };
  }, [user.wallet, memberId]);

  // Handle independent level activation
  const handleActivateLevel = async (lvl: MatrixLevelConfig) => {
    try {
      setIsActivating(true);
      setActivationError(null);
      setActivationSuccess(null);

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
        setActivationSuccess(`Level ${lvl.level} activated successfully!`);
        onRefreshData?.();
      } else {
        setActivationError(data.error || `Failed to activate Level ${lvl.level}`);
      }
    } catch (err: any) {
      setActivationError(err.message || 'Network error activating level.');
    } finally {
      setIsActivating(false);
    }
  };

  // Handle Level 1 direct slot recycle (Same-Level Recycling: 50 upline, 10 treasury, 40 top 3 downline leaders)
  const handleRecycleLevel1 = async () => {
    try {
      setIsRecyclingL1(true);
      setRecycleSuccess(null);
      const target = user.wallet || String(memberId);
      const res = await fetch('/api/matrix/recycle-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: target,
          level: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRecycleSuccess(
          `Slot 1 Recycled! 50 AIQX to Upline ID #${data.eligibleUpline?.id || 1}, 10 AIQX to Treasury, 40 AIQX to Top 3 Leaders.`
        );
        onRefreshData?.();
        setTimeout(() => setRecycleSuccess(null), 5000);
      } else {
        alert(data.error || 'Failed to recycle slot');
      }
    } catch (e: any) {
      alert(e.message || 'Error executing slot recycling');
    } finally {
      setIsRecyclingL1(false);
    }
  };

  // Ratio calculation: total earnings / slot activation cost ratio
  const activeLevelsCost = activeLevels.reduce((acc, lvl) => {
    return acc + 100 * Math.pow(2, lvl - 1);
  }, 0);
  const ratioPercent =
    activeLevelsCost > 0
      ? Math.max(100, Math.round((earnings.totalEarnings / activeLevelsCost) * 100))
      : 100;

  // Active network list
  const currentNetworkList =
    activeNetworkLine === 'l1'
      ? referrals.tree.l1
      : activeNetworkLine === 'l2'
      ? referrals.tree.l2
      : referrals.tree.l3;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Read-Only Preview Mode Notice Banner */}
      {isPreviewMode && (
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-blue-600/15 border border-blue-500/30 text-xs">
          <div className="flex items-center space-x-2 text-blue-300">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span className="font-semibold">
              Preview Mode: Inspecting public on-chain profile &amp; matrix for Member ID #{memberId}
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

      {/* TOP ROW: User Profile Card (Left) & Personal Link Card (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left User Card (5 cols) */}
        <div className="md:col-span-6 lg:col-span-5 p-6 rounded-3xl bg-[#11161E] border border-[#1E2533] flex items-center space-x-5 shadow-lg relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Large Avatar with Medal Badge */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#1E293B] to-[#334155] border-2 border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
              <User className="w-10 h-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 border-2 border-[#11161E] flex items-center justify-center text-black font-black text-[9px] shadow-md">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Member Details */}
          <div className="space-y-1.5 min-w-0">
            <h1 className="text-3xl font-black text-white tracking-tight">ID {memberId}</h1>

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

        {/* Right Personal Link Card (7 cols) */}
        <div className="md:col-span-6 lg:col-span-7 p-6 rounded-3xl bg-[#11161E] border border-[#1E2533] flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-2">
            <div className="flex items-center space-x-1.5 text-xs text-[#8B949E]">
              <span className="font-semibold">Personal link</span>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-600/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                Direct Line
              </span>
            </div>

            {/* Link & Copy */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0B0E14] border border-[#1E2533]">
              <span className="text-sm sm:text-base font-bold text-blue-400 font-mono truncate mr-2">
                aiqx.sol/b/{memberId}
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
            <span>Join with this sponsor ID #{memberId}</span>
            <button
              onClick={onNavigateToJoin}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>

      {/* SECOND ROW: 4 Stat Metric Cards (Partners, Team, Ratio, Profits with Staircase Sparkline) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Partners */}
        <div
          onClick={() => setActiveNetworkLine('l1')}
          className={`p-5 rounded-3xl bg-[#11161E] border transition-all cursor-pointer shadow-sm group ${
            activeNetworkLine === 'l1'
              ? 'border-blue-500 ring-1 ring-blue-500/30'
              : 'border-[#1E2533] hover:border-[#2C364A]'
          }`}
        >
          <div className="flex items-center space-x-1.5 text-xs text-[#8B949E]">
            <span className="font-medium">Partners</span>
            <span className="text-[10px] text-blue-400 font-mono">Line 1</span>
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
          onClick={() => setActiveNetworkLine('l2')}
          className={`p-5 rounded-3xl bg-[#11161E] border transition-all cursor-pointer shadow-sm group ${
            activeNetworkLine === 'l2' || activeNetworkLine === 'l3'
              ? 'border-blue-500 ring-1 ring-blue-500/30'
              : 'border-[#1E2533] hover:border-[#2C364A]'
          }`}
        >
          <div className="flex items-center space-x-1.5 text-xs text-[#8B949E]">
            <span className="font-medium">Team</span>
            <span className="text-[10px] text-purple-400 font-mono">3 Lines</span>
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
            <span className="text-[10px] text-[#6E7681] font-mono">ROI %</span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">{ratioPercent} %</div>
            <div className="text-xs text-emerald-400 font-medium flex items-center space-x-1 mt-1">
              <span>↑</span>
              <span>Active</span>
            </div>
          </div>
        </div>

        {/* Card 4: Profits with Forsage Staircase Area Sparkline */}
        <div className="p-5 rounded-3xl bg-[#11161E] border border-[#1E2533] relative overflow-hidden flex flex-col justify-between shadow-sm">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center space-x-1.5 text-xs text-[#8B949E]">
              <span className="font-medium">Profits</span>
              <span className="text-[10px] text-blue-400 font-mono">Total Net</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white truncate">
              {earnings.totalEarnings.toLocaleString()}{' '}
              <span className="text-base text-blue-400 font-bold">AIQX</span>
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

      {/* THIRD ROW: USERS NETWORK TRACK SYSTEM (Directly on Dashboard) */}
      <div className="p-6 rounded-3xl bg-[#11161E] border border-[#1E2533] space-y-5 shadow-lg">
        {/* Network Header & 3-Line Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1E2533]">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <GitBranch className="w-4 h-4 text-blue-400" />
              <h2 className="text-lg font-black text-white tracking-tight">
                Network Track System
              </h2>
            </div>
            <p className="text-xs text-[#8B949E]">
              Track your 3-line downline hierarchy, active slot levels &amp; leader rankings.
            </p>
          </div>

          {/* Line Switcher Pills */}
          <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-[#0B0E14] border border-[#1E2533]">
            <button
              onClick={() => setActiveNetworkLine('l1')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNetworkLine === 'l1'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Directs (50%) • {referrals.l1Count}
            </button>
            <button
              onClick={() => setActiveNetworkLine('l2')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNetworkLine === 'l2'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Indirects (30%) • {referrals.l2Count}
            </button>
            <button
              onClick={() => setActiveNetworkLine('l3')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNetworkLine === 'l3'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Third Line (5%) • {referrals.l3Count}
            </button>
          </div>
        </div>

        {/* Network Content: Partner Cards + Top 3 Leaders Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Active Line Partners List (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#8B949E] px-1 font-mono">
              <span>
                {activeNetworkLine === 'l1'
                  ? 'LINE 1 — DIRECT MEMBERS (50% REWARD)'
                  : activeNetworkLine === 'l2'
                  ? 'LINE 2 — INDIRECT MEMBERS (30% REWARD)'
                  : 'LINE 3 — THIRD-LINE MEMBERS (5% REWARD)'}
              </span>
              <span>{currentNetworkList.length} Members</span>
            </div>

            {currentNetworkList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0B0E14] border border-[#1E2533] text-center space-y-2">
                <Users className="w-8 h-8 text-[#4A5568] mx-auto" />
                <p className="text-xs text-[#8B949E]">
                  No members in {activeNetworkLine === 'l1' ? 'Direct Line 1' : activeNetworkLine === 'l2' ? 'Line 2' : 'Line 3'} yet.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => copyToClipboard(personalLink, 'link')}
                    className="px-3.5 py-1.5 rounded-xl bg-[#171D27] hover:bg-[#202735] text-xs font-mono text-blue-400 hover:text-white transition-colors cursor-pointer border border-[#1E2533]"
                  >
                    {copiedLink ? 'Copied Link!' : 'Copy Referral Link'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                {currentNetworkList.map((partner) => {
                  const partnerId = partner.id || 1;
                  return (
                    <div
                      key={partner.wallet}
                      className="p-3.5 rounded-2xl bg-[#0B0E14] border border-[#1E2533] hover:border-blue-500/40 transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onPreviewMemberId?.(partnerId)}
                            className="text-xs font-black text-white group-hover:text-blue-400 transition-colors font-mono cursor-pointer hover:underline"
                            title="Inspect Partner Matrix"
                          >
                            ID #{partnerId}
                          </button>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            L{(partner.activeLevels || [1]).join(', ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-[11px] font-mono text-[#6E7681]">
                          <span>{formatAddress(partner.wallet)}</span>
                          <button
                            onClick={() => copyPartnerWallet(partner.wallet)}
                            className="hover:text-white cursor-pointer"
                            title="Copy Wallet"
                          >
                            {copiedPartnerWallet === partner.wallet ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => onPreviewMemberId?.(partnerId)}
                        className="p-2 rounded-xl bg-[#171D27] hover:bg-blue-600 text-[#8B949E] hover:text-white transition-colors cursor-pointer shrink-0"
                        title="View Matrix"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Top 3 Downline Leaders Card (4 cols) */}
          <div className="lg:col-span-4 p-4 rounded-2xl bg-[#0B0E14] border border-[#1E2533] space-y-3 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-white tracking-wide">
                  Top 3 Downline Leaders
                </span>
              </div>
              <p className="text-[11px] text-[#8B949E]">
                Auto-qualified for 40 AIQX Slot Recycling Reward (20 / 12 / 8 AIQX).
              </p>
            </div>

            {/* Leaders Ranking List */}
            <div className="space-y-2">
              {isLoadingLeaders ? (
                <div className="py-6 flex items-center justify-center space-x-2 text-xs text-[#8B949E]">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Scoring downline...</span>
                </div>
              ) : downlineLeaders.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#6E7681]">
                  Downline leaders will appear here as your 3 lines grow.
                </div>
              ) : (
                downlineLeaders.slice(0, 3).map((leader) => {
                  const leaderId = leader.userId || leader.user?.id || 1;
                  const teamCount = leader.teamCount ?? leader.score ?? 0;
                  const rewardAmt = leader.amount ?? leader.rewardAiqx ?? (leader.rank === 1 ? 20 : leader.rank === 2 ? 12 : 8);

                  return (
                    <div
                      key={leader.rank}
                      onClick={() => onPreviewMemberId?.(leaderId)}
                      className="p-2.5 rounded-xl bg-[#11161E] border border-[#1E2533] flex items-center justify-between cursor-pointer hover:border-amber-400/40 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            leader.rank === 1
                              ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                              : leader.rank === 2
                              ? 'bg-slate-400/20 text-slate-300 border border-slate-400/30'
                              : 'bg-amber-700/20 text-amber-600 border border-amber-700/30'
                          }`}
                        >
                          #{leader.rank}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white font-mono">
                            ID #{leaderId}
                          </div>
                          <div className="text-[10px] text-[#6E7681]">
                            Team: {teamCount} members
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-400 font-mono">
                          +{rewardAmt} AIQX
                        </div>
                        <div className="text-[9px] text-[#8B949E]">
                          {leader.rank === 1 ? '50% Share' : leader.rank === 2 ? '30% Share' : '20% Share'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 text-[10px] text-[#6E7681] font-mono border-t border-[#1E2533]">
              Zero-Burn Policy • Distributed atomically upon slot completion.
            </div>
          </div>
        </div>
      </div>

      {/* FOURTH ROW: THE 14-LEVEL MATRIX SYSTEM (The Heart of the Dashboard) */}
      <div className="space-y-4 pt-2">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-black text-white tracking-tight">
                14-Level Doubling Matrix System
              </h2>
            </div>
            <p className="text-xs text-[#8B949E]">
              Each level is independent and activated based on your decision. Level 1 slot remains exact &amp; recycles once fulfilled.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {/* Level 1 Quick Recycle Button if active */}
            {activeLevels.includes(1) && (
              <button
                onClick={handleRecycleLevel1}
                disabled={isRecyclingL1}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-black font-extrabold text-xs shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 cursor-pointer transition-all"
                title="Recycle Level 1 Slot: 50 AIQX to Upline, 10 to Treasury, 40 to Top 3 Leaders"
              >
                {isRecyclingL1 ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Repeat className="w-3.5 h-3.5" />
                )}
                <span>Recycle L1 (100 AIQX)</span>
              </button>
            )}

            <button
              onClick={onNavigateToDocs}
              className="px-3 py-1.5 rounded-xl bg-[#171D27] hover:bg-[#202735] text-xs font-mono text-blue-400 border border-[#1E2533] cursor-pointer transition-colors"
            >
              14-Level Math Docs →
            </button>
          </div>
        </div>

        {/* Recycling / Activation feedback notification */}
        {recycleSuccess && (
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-300 flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{recycleSuccess}</span>
          </div>
        )}

        {activationSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{activationSuccess}</span>
          </div>
        )}

        {activationError && (
          <div className="p-3 rounded-2xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center space-x-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{activationError}</span>
          </div>
        )}

        {/* 14-LEVEL MATRIX GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {MATRIX_LEVELS_CONFIG.map((lvlConfig) => {
            const isUnlocked = activeLevels.includes(lvlConfig.level);
            const isNextInLine =
              !isUnlocked &&
              (lvlConfig.level === 1 || activeLevels.includes(lvlConfig.level - 1));

            return (
              <ForsageSlotCard
                key={lvlConfig.level}
                config={lvlConfig}
                isUnlocked={isUnlocked}
                isNextInLine={isNextInLine}
                connected={true}
                onInspect={(levelNum) => {
                  const cfg = MATRIX_LEVELS_CONFIG.find((l) => l.level === levelNum);
                  if (cfg) setInspectingLevel(cfg);
                }}
                onActivate={(cfg) => {
                  setActivatingLevel(cfg);
                  handleActivateLevel(cfg);
                }}
              />
            );
          })}
        </div>
      </div>

      {/* INTERACTIVE FORSAGE SLOT MODAL */}
      {inspectingLevel && (
        <ForsageSlotModal
          levelConfig={inspectingLevel}
          isOpen={true}
          onClose={() => setInspectingLevel(null)}
          userWallet={user.wallet}
          userId={memberId}
          isUnlocked={activeLevels.includes(inspectingLevel.level)}
          isNextInLine={!activeLevels.includes(inspectingLevel.level)}
          onActivate={(cfg) => handleActivateLevel(cfg)}
          connected={true}
        />
      )}
    </div>
  );
};
