import React, { FC, useState, useEffect } from 'react';
import {
  Users,
  Crown,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { UserRecord } from '../../lib/referral-engine';
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
  const [selectedMember, setSelectedMember] = useState<{
    id: number;
    wallet: string;
    level: string;
    slots: number;
  } | null>(null);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

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

  const directList = teamData?.directPartners || [];
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

  // 3 Direct Branches
  const b1 = directList[0] || null;
  const b2 = directList[1] || null;
  const b3 = directList[2] || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2 animate-fadeIn">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between p-5 rounded-3xl bg-[#111622] border border-[#1E2533] shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              Partners &amp; Team Architecture
            </h1>
            <span className="text-xs font-mono text-[#8B949E]">
              1 Leader → 3 Directs (50%) → 9 Downlines (30%)
            </span>
          </div>
        </div>

        <button
          onClick={loadTeamData}
          disabled={loading}
          className="p-2.5 rounded-2xl bg-[#151D2A] hover:bg-[#1E293B] text-white border border-[#222E42] transition-colors cursor-pointer flex items-center justify-center shadow-sm"
          title="Refresh Tree"
        >
          <RefreshCw className={`w-4 h-4 text-blue-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-[#111622] border border-[#1E2533] shadow-sm">
          <div className="text-xs text-[#8B949E] mb-1 font-mono">Total Team</div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono">
            {referrals.totalNetworkCount}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#111622] border border-[#1E2533] shadow-sm">
          <div className="text-xs text-[#8B949E] mb-1 font-mono">Line 1 (50%)</div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
            {referrals.l1Count}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#111622] border border-[#1E2533] shadow-sm">
          <div className="text-xs text-[#8B949E] mb-1 font-mono">Line 2 (30%)</div>
          <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono">
            {referrals.l2Count}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-[#111622] border border-[#1E2533] shadow-sm">
          <div className="text-xs text-[#8B949E] mb-1 font-mono">Line 3 (5%)</div>
          <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono">
            {referrals.l3Count}
          </div>
        </div>
      </div>

      {/* ── UNIFIED CONNECTED VECTOR TREE CANVAS (100% LINKED, NEVER DISCONNECTED) ── */}
      <div className="rounded-3xl bg-[#0A0D14] border border-[#1A2232] shadow-2xl overflow-hidden relative">
        {/* Canvas Toolbar */}
        <div className="bg-[#0E131E]/90 backdrop-blur-md border-b border-[#1A2333] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-white">Connected Architecture</span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Live Network
            </span>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1.5 px-1.5 py-1 rounded-xl bg-[#141B28] border border-[#202C3F]">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.1))}
              className="p-1 text-[#8B949E] hover:text-white rounded-lg cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-1 text-[10px] font-mono text-[#8B949E] hover:text-white cursor-pointer"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.1))}
              className="p-1 text-[#8B949E] hover:text-white rounded-lg cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tree Container: Fits on Mobile & Pans Cleanly */}
        <div className="p-4 sm:p-8 flex flex-col items-center justify-center relative bg-[radial-gradient(#172133_1px,transparent_1px)] [background-size:24px_24px] overflow-x-auto min-h-[440px]">
          <div
            className="w-full flex justify-center transition-transform duration-150 ease-out origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            {/* SVG Tree: Fully self-contained coordinates. Nodes and lines are mathematically locked. */}
            <svg
              viewBox="0 0 900 440"
              className="w-full max-w-4xl h-auto select-none"
              style={{ minWidth: '320px' }}
            >
              <defs>
                {/* Gradients */}
                <linearGradient id="rootGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#1E3A8A" />
                </linearGradient>

                <linearGradient id="dirGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>

                <linearGradient id="downGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#0E7490" />
                </linearGradient>

                <linearGradient id="emptyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#141C2A" />
                  <stop offset="100%" stopColor="#0D131E" />
                </linearGradient>

                {/* Glow Filter */}
                <filter id="blueGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* ════ LEVEL 0 -> LEVEL 1 CONNECTING LINES (LEADER -> 3 DIRECTS) ════ */}
              <line x1="450" y1="95" x2="450" y2="130" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <line x1="160" y1="130" x2="740" y2="130" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
              <line x1="160" y1="130" x2="160" y2="162" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
              <line x1="450" y1="130" x2="450" y2="162" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
              <line x1="740" y1="130" x2="740" y2="162" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />

              {/* ════ LEVEL 1 -> LEVEL 2 CONNECTING LINES (3 DIRECTS -> 9 DOWNLINES) ════ */}
              {/* Branch 1 Droplines */}
              <line x1="160" y1="228" x2="160" y2="265" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="80" y1="265" x2="240" y2="265" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="80" y1="265" x2="80" y2="318" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="160" y1="265" x2="160" y2="318" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="240" y1="265" x2="240" y2="318" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />

              {/* Branch 2 Droplines */}
              <line x1="450" y1="228" x2="450" y2="265" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="370" y1="265" x2="530" y2="265" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="370" y1="265" x2="370" y2="318" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="450" y1="265" x2="450" y2="318" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="530" y1="265" x2="530" y2="318" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />

              {/* Branch 3 Droplines */}
              <line x1="740" y1="228" x2="740" y2="265" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="660" y1="265" x2="820" y2="265" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="660" y1="265" x2="660" y2="318" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="740" y1="265" x2="740" y2="318" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="820" y1="265" x2="820" y2="318" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />

              {/* ════ LEVEL 0: ROOT LEADER NODE (cx: 450, cy: 55) ════ */}
              <g
                className="cursor-pointer"
                onClick={() =>
                  setSelectedMember({
                    id: rootMember.id,
                    wallet: rootMember.wallet,
                    level: 'Leader',
                    slots: rootMember.maxActiveSlot,
                  })
                }
              >
                <circle cx="450" cy="55" r="40" fill="url(#rootGrad)" stroke="#60A5FA" strokeWidth="3" filter="url(#blueGlow)" />
                <text x="450" y="52" fill="#FFFFFF" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="monospace">
                  YOU
                </text>
                <text x="450" y="68" fill="#93C5FD" fontSize="11" fontWeight="700" textAnchor="middle" fontFamily="monospace">
                  ID #{rootMember.id}
                </text>
              </g>

              {/* ════ LEVEL 1: 3 DIRECT PARTNER NODES (cy: 195) ════ */}
              {/* Direct 1 (cx: 160) */}
              <g
                className="cursor-pointer"
                onClick={() =>
                  b1 &&
                  setSelectedMember({
                    id: b1.id,
                    wallet: b1.wallet,
                    level: 'Line 1 (50%)',
                    slots: b1.maxActiveSlot,
                  })
                }
              >
                <circle
                  cx="160"
                  cy="195"
                  r="32"
                  fill={b1 ? 'url(#dirGrad)' : 'url(#emptyGrad)'}
                  stroke={b1 ? '#34D399' : '#1E293B'}
                  strokeWidth="2.5"
                  strokeDasharray={b1 ? 'none' : '4 3'}
                />
                <text x="160" y="193" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="monospace">
                  {b1 ? `ID #${b1.id}` : '#1'}
                </text>
                <text x="160" y="207" fill={b1 ? '#A7F3D0' : '#64748B'} fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">
                  {b1 ? 'DIRECT' : 'OPEN'}
                </text>
              </g>

              {/* Direct 2 (cx: 450) */}
              <g
                className="cursor-pointer"
                onClick={() =>
                  b2 &&
                  setSelectedMember({
                    id: b2.id,
                    wallet: b2.wallet,
                    level: 'Line 1 (50%)',
                    slots: b2.maxActiveSlot,
                  })
                }
              >
                <circle
                  cx="450"
                  cy="195"
                  r="32"
                  fill={b2 ? 'url(#dirGrad)' : 'url(#emptyGrad)'}
                  stroke={b2 ? '#34D399' : '#1E293B'}
                  strokeWidth="2.5"
                  strokeDasharray={b2 ? 'none' : '4 3'}
                />
                <text x="450" y="193" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="monospace">
                  {b2 ? `ID #${b2.id}` : '#2'}
                </text>
                <text x="450" y="207" fill={b2 ? '#A7F3D0' : '#64748B'} fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">
                  {b2 ? 'DIRECT' : 'OPEN'}
                </text>
              </g>

              {/* Direct 3 (cx: 740) */}
              <g
                className="cursor-pointer"
                onClick={() =>
                  b3 &&
                  setSelectedMember({
                    id: b3.id,
                    wallet: b3.wallet,
                    level: 'Line 1 (50%)',
                    slots: b3.maxActiveSlot,
                  })
                }
              >
                <circle
                  cx="740"
                  cy="195"
                  r="32"
                  fill={b3 ? 'url(#dirGrad)' : 'url(#emptyGrad)'}
                  stroke={b3 ? '#34D399' : '#1E293B'}
                  strokeWidth="2.5"
                  strokeDasharray={b3 ? 'none' : '4 3'}
                />
                <text x="740" y="193" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="monospace">
                  {b3 ? `ID #${b3.id}` : '#3'}
                </text>
                <text x="740" y="207" fill={b3 ? '#A7F3D0' : '#64748B'} fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">
                  {b3 ? 'DIRECT' : 'OPEN'}
                </text>
              </g>

              {/* ════ LEVEL 2: 9 DOWNLINE NODES (cy: 340) ════ */}
              {[
                { x: 80, parent: b1, idx: 0 },
                { x: 160, parent: b1, idx: 1 },
                { x: 240, parent: b1, idx: 2 },
                { x: 370, parent: b2, idx: 0 },
                { x: 450, parent: b2, idx: 1 },
                { x: 530, parent: b2, idx: 2 },
                { x: 660, parent: b3, idx: 0 },
                { x: 740, parent: b3, idx: 1 },
                { x: 820, parent: b3, idx: 2 },
              ].map((pos, dIdx) => {
                const sub = pos.parent?.subDownlines?.[pos.idx] || null;

                return (
                  <g
                    key={dIdx}
                    className="cursor-pointer"
                    onClick={() =>
                      sub &&
                      setSelectedMember({
                        id: sub.id,
                        wallet: sub.wallet,
                        level: 'Line 2 (30%)',
                        slots: sub.maxActiveSlot || 1,
                      })
                    }
                  >
                    <circle
                      cx={pos.x}
                      cy="340"
                      r="22"
                      fill={sub ? 'url(#downGrad)' : 'url(#emptyGrad)'}
                      stroke={sub ? '#22D3EE' : '#1E293B'}
                      strokeWidth="2"
                      strokeDasharray={sub ? 'none' : '3 2'}
                    />
                    <text x={pos.x} y="344" fill={sub ? '#FFFFFF' : '#64748B'} fontSize="9" fontWeight="700" textAnchor="middle" fontFamily="monospace">
                      {sub ? `#${sub.id}` : `L2`}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Member Detail Drawer */}
        {selectedMember && (
          <div className="mx-6 mb-6 p-4 rounded-2xl bg-[#141B28] border border-blue-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-xs">
                #{selectedMember.id}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">
                    Member #{selectedMember.id}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {selectedMember.level}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs font-mono text-[#8B949E]">
                  <span>{formatAddress(selectedMember.wallet)}</span>
                  <button
                    onClick={() => copyAddress(selectedMember.wallet)}
                    className="hover:text-white cursor-pointer"
                  >
                    {copiedWallet === selectedMember.wallet ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <a
                    href={getExplorerUrl(selectedMember.wallet, 'address', 'mainnet-beta')}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-400 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {onPreviewMemberId && (
                <button
                  onClick={() => onPreviewMemberId(selectedMember.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer transition-colors shadow-sm"
                >
                  Inspect Matrix
                </button>
              )}
              <button
                onClick={() => setSelectedMember(null)}
                className="px-3 py-1.5 rounded-xl bg-[#1B2434] hover:bg-[#253246] text-white text-xs font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
