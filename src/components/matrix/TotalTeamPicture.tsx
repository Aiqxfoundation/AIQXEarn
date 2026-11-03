import React, { FC, useState, useEffect } from 'react';
import {
  Users,
  GitBranch,
  Crown,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  Eye,
  ArrowRight,
  Layers,
  Repeat,
  ShieldCheck,
  Award,
  Zap,
  Info,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { UserRecord, MATRIX_SLOTS_CONFIG } from '../../lib/referral-engine';
import { AppConfig, formatAddress, getExplorerUrl } from '../../lib/solana';

interface TeamMemberNode {
  id: number;
  wallet: string;
  sponsorId: number | null;
  joinTime: string;
  activeLevels: number[];
  maxActiveSlot: number;
  subDownlines?: TeamMemberNode[];
  directSubCount?: number;
}

interface TeamPictureData {
  blueprintImageUrl: string;
  rootUser: {
    id: number;
    wallet: string;
    sponsorId: number | null;
    joinTime: string;
    activeLevels: number[];
    maxActiveSlot: number;
    totalTeamCount: number;
    directPartnersCount: number;
  };
  directPartners: TeamMemberNode[];
  metrics: {
    totalTeamCount: number;
    directCount: number;
    secondGenCount: number;
    thirdGenCount: number;
  };
}

interface TotalTeamPictureProps {
  config: AppConfig;
  currentUser: UserRecord | null;
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
  onPreviewMemberId?: (id: number) => void;
  onNavigateToSlots?: () => void;
}

export const TotalTeamPicture: FC<TotalTeamPictureProps> = ({
  config,
  currentUser,
  referrals,
  onPreviewMemberId,
  onNavigateToSlots,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [teamData, setTeamData] = useState<TeamPictureData | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMemberNode | null>(null);
  const [activeFilterSlot, setActiveFilterSlot] = useState<number>(0); // 0 = all
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'interactive' | 'blueprint' | 'both'>('interactive');

  const rootIdOrWallet = currentUser?.id ? String(currentUser.id) : (currentUser?.wallet || '1');

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/team/picture/${rootIdOrWallet}`);
      const data = await res.json();
      if (data && data.success) {
        setTeamData(data);
      }
    } catch (e) {
      console.warn('Could not load team picture data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, [rootIdOrWallet]);

  const copyAddress = async (wallet: string) => {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopiedWallet(wallet);
      setTimeout(() => setCopiedWallet(null), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  // Build 3 branches for the 3-wide tree view
  const directList = teamData?.directPartners || [];
  const branch1 = directList[0] || null;
  const branch2 = directList[1] || null;
  const branch3 = directList[2] || null;

  const branches = [branch1, branch2, branch3];

  const rootMember = teamData?.rootUser || {
    id: currentUser?.id || 1,
    wallet: currentUser?.wallet || 'GenesisRootWallet',
    sponsorId: currentUser?.sponsorId || null,
    joinTime: currentUser?.joinTime || new Date().toISOString(),
    activeLevels: currentUser?.activeLevels || [1],
    maxActiveSlot: Math.max(...(currentUser?.activeLevels || [1])),
    totalTeamCount: referrals.totalNetworkCount,
    directPartnersCount: referrals.l1Count,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Top Banner: Total Team Architecture */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F141E] via-[#121927] to-[#0D121B] border border-[#1E2738] p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-[11px] font-mono text-blue-400">
              <Users className="w-3.5 h-3.5" />
              <span>Full Picture of Total Team Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Total Team Topology
            </h1>
            <p className="text-xs sm:text-sm text-[#8B949E] leading-relaxed">
              Standard 3-Wide Organization: 1 Leader (Red) → 3 Direct Partners (Green) → 9 Sub-downlines (Cyan). Everyone earns under independent slots with identical residual rewards.
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center space-x-2 p-1.5 rounded-2xl bg-[#0B0E14] border border-[#1E2533] self-start md:self-auto shrink-0">
            <button
              onClick={() => setViewMode('interactive')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'interactive'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Interactive Tree
            </button>
            <button
              onClick={() => setViewMode('blueprint')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'blueprint'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Blueprint Reference
            </button>
            <button
              onClick={() => setViewMode('both')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'both'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Side-by-Side
            </button>
          </div>
        </div>

        {/* Metrics Cards Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-[#1B2332]">
          <div className="p-4 rounded-2xl bg-[#090C12]/80 border border-[#1A2230]">
            <span className="text-[11px] font-mono text-[#8B949E] block">Total Team Network</span>
            <span className="text-2xl font-black font-mono text-white mt-1 block">
              {teamData?.metrics.totalTeamCount ?? referrals.totalNetworkCount}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Members across all tiers</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090C12]/80 border border-[#1A2230]">
            <span className="text-[11px] font-mono text-[#8B949E] block">Tier 1 Directs (Green)</span>
            <span className="text-2xl font-black font-mono text-emerald-400 mt-1 block">
              {teamData?.metrics.directCount ?? referrals.l1Count}
            </span>
            <span className="text-[10px] text-[#8B949E] font-mono">3-wide primary branches</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090C12]/80 border border-[#1A2230]">
            <span className="text-[11px] font-mono text-[#8B949E] block">Tier 2 Downlines (Cyan)</span>
            <span className="text-2xl font-black font-mono text-cyan-400 mt-1 block">
              {teamData?.metrics.secondGenCount ?? referrals.l2Count}
            </span>
            <span className="text-[10px] text-[#8B949E] font-mono">9 sub-branch nodes</span>
          </div>

          <div className="p-4 rounded-2xl bg-[#090C12]/80 border border-[#1A2230]">
            <span className="text-[11px] font-mono text-[#8B949E] block">Independent Slots</span>
            <span className="text-2xl font-black font-mono text-[#F5A623] mt-1 block">
              {rootMember.maxActiveSlot} / 12
            </span>
            <span className="text-[10px] text-[#F5A623]/80 font-mono">Active slot depth</span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Interactive Tree and/or Blueprint */}
      <div className={`grid gap-6 ${viewMode === 'both' ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Blueprint Architecture Card (shows user uploaded image) */}
        {(viewMode === 'blueprint' || viewMode === 'both') && (
          <div className={`${viewMode === 'both' ? 'lg:col-span-5' : 'col-span-1'} p-6 rounded-3xl bg-[#0F141E] border border-[#1E2738] space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2332]">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Standard Topology Blueprint
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Official Rule
              </span>
            </div>

            <p className="text-xs text-[#8B949E]">
              Every slot in AIQX Independent Matrix follows this exact 3-wide topology:
            </p>

            {/* Embedded image reference */}
            <div className="relative rounded-2xl overflow-hidden border border-[#232E40] bg-[#0A0D13] p-4 flex flex-col items-center justify-center">
              <img
                src="/assets/aistudio/images__89__1b7e0220.jpeg"
                alt="Total Team Architecture Topology"
                className="max-h-72 w-auto object-contain rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
              />
              <div className="mt-3 text-center space-y-1">
                <div className="text-[11px] font-mono font-bold text-white">
                  3-Wide Binary/Trinary Matrix Placement
                </div>
                <div className="text-[10px] text-[#8B949E]">
                  Top Red (Leader) • 3 Green (Direct Partners) • 9 Cyan (Downline Partners)
                </div>
              </div>
            </div>

            {/* Rule Explanations */}
            <div className="space-y-2 pt-2 text-xs text-[#8B949E]">
              <div className="flex items-start space-x-2 p-2.5 rounded-xl bg-[#090C12] border border-[#18202D]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1 shrink-0" />
                <div>
                  <strong className="text-white block font-mono">Slot Owner (Red)</strong>
                  <span>Owns the slot, receives direct payouts for spots 1..N and triggers recycling on final spot.</span>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-2.5 rounded-xl bg-[#090C12] border border-[#18202D]">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <div>
                  <strong className="text-white block font-mono">Direct Partners (Green)</strong>
                  <span>Direct team partners. In Slot 1, 2 pay direct to owner and 1 recycles slot!</span>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-2.5 rounded-xl bg-[#090C12] border border-[#18202D]">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 mt-1 shrink-0" />
                <div>
                  <strong className="text-white block font-mono">Team Downline (Cyan)</strong>
                  <span>9 sub-downline positions (3 under each partner) that power the 40 AIQX leader pool.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Interactive Total Team Tree */}
        {(viewMode === 'interactive' || viewMode === 'both') && (
          <div className={`${viewMode === 'both' ? 'lg:col-span-7' : 'col-span-1'} p-6 rounded-3xl bg-[#0F141E] border border-[#1E2738] space-y-6`}>
            {/* Tree Controls Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1A2332]">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-4 h-4 text-[#F5A623]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Live Interactive Total Team Diagram
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={loadTeamData}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-xl bg-[#151C27] hover:bg-[#1D2635] text-[11px] font-mono text-[#8B949E] hover:text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Tree Diagram Visual Canvas */}
            <div className="relative rounded-2xl bg-[#080B10] border border-[#18202E] p-6 overflow-x-auto min-w-[340px]">
              <div className="min-w-[620px] flex flex-col items-center space-y-8 py-2">
                {/* 1. TOP NODE: Root Leader (Red Circle) */}
                <div className="flex flex-col items-center group cursor-pointer" onClick={() => setSelectedMember({
                  id: rootMember.id,
                  wallet: rootMember.wallet,
                  sponsorId: rootMember.sponsorId,
                  joinTime: rootMember.joinTime,
                  activeLevels: rootMember.activeLevels,
                  maxActiveSlot: rootMember.maxActiveSlot,
                  directSubCount: rootMember.directPartnersCount,
                })}>
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 via-rose-600 to-red-800 border-4 border-red-400/80 shadow-[0_0_28px_rgba(239,68,68,0.5)] flex flex-col items-center justify-center text-white transition-transform group-hover:scale-105">
                      <Crown className="w-5 h-5 text-amber-300 drop-shadow mb-0.5" />
                      <span className="text-xs font-mono font-black">#{rootMember.id}</span>
                    </div>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-red-600 text-[9px] font-extrabold uppercase font-mono tracking-wider text-white border border-red-300 shadow">
                      Leader
                    </span>
                  </div>

                  <div className="mt-3 text-center">
                    <div className="text-xs font-bold text-white font-mono flex items-center justify-center space-x-1">
                      <span>{formatAddress(rootMember.wallet)}</span>
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono font-semibold">
                      Slots Active: {rootMember.maxActiveSlot} / 12
                    </div>
                  </div>
                </div>

                {/* Vertical Connector Line 1 */}
                <div className="w-[2px] h-6 bg-gradient-to-b from-red-500/80 to-[#2A374E]" />

                {/* Horizontal Connector Bar across 3 Branches */}
                <div className="relative w-[540px] h-[2px] bg-[#2A374E]">
                  {/* Branch tick 1 */}
                  <div className="absolute left-[40px] -top-[1px] w-[2px] h-5 bg-[#2A374E]" />
                  {/* Branch tick 2 */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] w-[2px] h-5 bg-[#2A374E]" />
                  {/* Branch tick 3 */}
                  <div className="absolute right-[40px] -top-[1px] w-[2px] h-5 bg-[#2A374E]" />
                </div>

                {/* 2. DIRECT PARTNERS ROW: 3 Green Nodes */}
                <div className="grid grid-cols-3 gap-6 w-full max-w-[620px] pt-1">
                  {branches.map((partner, branchIdx) => {
                    const isFilled = partner !== null;

                    return (
                      <div key={branchIdx} className="flex flex-col items-center space-y-6">
                        {/* Partner Node (Green) */}
                        <div
                          onClick={() => partner && setSelectedMember(partner)}
                          className={`flex flex-col items-center group ${isFilled ? 'cursor-pointer' : ''}`}
                        >
                          <div className="relative">
                            <div
                              className={`w-16 h-16 rounded-full flex flex-col items-center justify-center font-mono font-bold transition-all ${
                                isFilled
                                  ? 'bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 border-4 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.45)] text-white group-hover:scale-105'
                                  : 'bg-[#121721] border-2 border-dashed border-[#232D3F] text-[#4A5568]'
                              }`}
                            >
                              {isFilled ? (
                                <>
                                  <Users className="w-4 h-4 mb-0.5 text-emerald-200" />
                                  <span className="text-xs font-black">#{partner.id}</span>
                                </>
                              ) : (
                                <span className="text-[10px] text-[#4A5568]">Spot {branchIdx + 1}</span>
                              )}
                            </div>
                            <span
                              className={`absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full text-[8px] font-bold uppercase font-mono tracking-wider ${
                                isFilled
                                  ? 'bg-emerald-600 text-white border border-emerald-300'
                                  : 'bg-[#192230] text-[#6E7681]'
                              }`}
                            >
                              Direct {branchIdx + 1}
                            </span>
                          </div>

                          <div className="mt-2 text-center">
                            {isFilled ? (
                              <>
                                <div className="text-[11px] font-bold text-white font-mono">
                                  {formatAddress(partner.wallet)}
                                </div>
                                <div className="text-[9px] text-emerald-400 font-mono">
                                  L{partner.maxActiveSlot} • {partner.directSubCount || 0} downlines
                                </div>
                              </>
                            ) : (
                              <div className="text-[10px] text-[#6E7681] italic">
                                Open Direct Spot
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Vertical line down to sub-downlines */}
                        <div className="w-[2px] h-4 bg-[#232D3F]" />

                        {/* Horizontal connector for 3 sub-nodes under this partner */}
                        <div className="relative w-[150px] h-[2px] bg-[#232D3F]">
                          <div className="absolute left-[15px] -top-[1px] w-[2px] h-3 bg-[#232D3F]" />
                          <div className="absolute left-1/2 -translate-x-1/2 -top-[1px] w-[2px] h-3 bg-[#232D3F]" />
                          <div className="absolute right-[15px] -top-[1px] w-[2px] h-3 bg-[#232D3F]" />
                        </div>

                        {/* 3. SUB-DOWNLINES: 3 Cyan Nodes per partner */}
                        <div className="grid grid-cols-3 gap-2 w-full pt-1">
                          {[0, 1, 2].map((subIdx) => {
                            const sub = partner?.subDownlines?.[subIdx] || null;
                            const isSubFilled = sub !== null;

                            return (
                              <div
                                key={subIdx}
                                onClick={() => sub && setSelectedMember(sub)}
                                className={`flex flex-col items-center ${isSubFilled ? 'cursor-pointer group' : ''}`}
                                title={isSubFilled ? `Member #${sub.id} (${sub.wallet})` : 'Open Downline Spot'}
                              >
                                <div
                                  className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-[10px] font-bold transition-all ${
                                    isSubFilled
                                      ? 'bg-gradient-to-br from-cyan-400 via-sky-600 to-blue-700 border-2 border-cyan-300 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)] group-hover:scale-110'
                                      : 'bg-[#0E131C] border border-dashed border-[#1E2736] text-[#364153]'
                                  }`}
                                >
                                  {isSubFilled ? `#${sub.id}` : ''}
                                </div>
                                <span className="text-[8px] font-mono text-[#6E7681] mt-1">
                                  {isSubFilled ? formatAddress(sub.wallet, 2) : '•'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Member Details Inspector Card */}
            {selectedMember && (
              <div className="p-4 rounded-2xl bg-[#0B0E14] border border-[#232E40] space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-[#1A2332]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-bold text-white font-mono">
                      Member #{selectedMember.id} Profile
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="text-[#6E7681] hover:text-white text-xs font-mono cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-[#11161E] border border-[#1E2533]">
                    <span className="text-[10px] text-[#8B949E] block">Solana Address</span>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-white font-bold">{formatAddress(selectedMember.wallet, 6)}</span>
                      <button
                        onClick={() => copyAddress(selectedMember.wallet)}
                        className="text-[#8B949E] hover:text-white cursor-pointer"
                        title="Copy address"
                      >
                        {copiedWallet === selectedMember.wallet ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#11161E] border border-[#1E2533]">
                    <span className="text-[10px] text-[#8B949E] block">Active Independent Slots</span>
                    <span className="text-emerald-400 font-bold block mt-0.5">
                      {selectedMember.activeLevels.join(', ')} ({selectedMember.activeLevels.length} active)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#11161E] border border-[#1E2533]">
                    <span className="text-[10px] text-[#8B949E] block">Direct Downline Partners</span>
                    <span className="text-[#F5A623] font-bold block mt-0.5">
                      {selectedMember.directSubCount || selectedMember.subDownlines?.length || 0} Partners
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <a
                    href={getExplorerUrl(selectedMember.wallet, 'address', config.network)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center space-x-1"
                  >
                    <span>View on Solana Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  {onPreviewMemberId && (
                    <button
                      onClick={() => onPreviewMemberId(selectedMember.id)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <span>Preview Member #{selectedMember.id} Matrix</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 12-Slot Table Quick Matrix Specs */}
      <div className="p-6 rounded-3xl bg-[#0F141E] border border-[#1E2738] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1A2332]">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-[#F5A623]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              12 Independent Slots — Opportunity &amp; Capacity Specifications
            </h3>
          </div>
          {onNavigateToSlots && (
            <button
              onClick={onNavigateToSlots}
              className="text-xs font-mono text-[#F5A623] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Explore Slots Matrix</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#1A2332] text-[#8B949E]">
                <th className="py-2.5 px-3">Slot Number</th>
                <th className="py-2.5 px-3">Package Fee</th>
                <th className="py-2.5 px-3">Direct Spots</th>
                <th className="py-2.5 px-3">Recycling Spots</th>
                <th className="py-2.5 px-3">Total Capacity</th>
                <th className="py-2.5 px-3 text-right">Recycling Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151D2A]">
              {MATRIX_SLOTS_CONFIG.map((s) => (
                <tr key={s.slot} className="hover:bg-[#131A26] transition-colors">
                  <td className="py-2 px-3 font-bold text-white">
                    SLOT {s.slot < 10 ? `0${s.slot}` : s.slot}
                  </td>
                  <td className="py-2 px-3 font-extrabold text-[#F5A623]">
                    {s.totalPackageFee.toLocaleString()} AIQX
                  </td>
                  <td className="py-2 px-3 text-emerald-400 font-bold">
                    {s.directSpots} Direct {s.directSpots === 1 ? 'Spot' : 'Spots'}
                  </td>
                  <td className="py-2 px-3 text-cyan-400 font-bold">
                    1 Recycling (Reinvest)
                  </td>
                  <td className="py-2 px-3 text-white">
                    {s.slots} Total Spots
                  </td>
                  <td className="py-2 px-3 text-right text-[#8B949E]">
                    50% Upline (Crossover) • 10% Treasury • 40% Downline Leaders
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
