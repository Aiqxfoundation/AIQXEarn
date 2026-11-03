import React, { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Users,
  Network,
  Share2,
  Copy,
  Check,
  ChevronRight,
  ShieldCheck,
  Layers,
  ArrowRight,
  ExternalLink,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import { UserRecord } from '../../lib/referral-engine';
import { AppConfig, formatAddress, getExplorerUrl } from '../../lib/solana';

interface MyNetworkSectionProps {
  config: AppConfig;
  user: UserRecord | null;
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
  onNavigateToReferrals?: () => void;
  onNavigateToTeamPicture?: () => void;
}

export const MyNetworkSection: FC<MyNetworkSectionProps> = ({
  config,
  user,
  referrals,
  onNavigateToReferrals,
  onNavigateToTeamPicture,
}) => {
  const { connected } = useWallet();
  const [activeTab, setActiveTab] = useState<'l1' | 'l2' | 'l3'>('l1');
  const [treeData, setTreeData] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (user?.wallet) {
      fetch(`/api/matrix/tree/${user.wallet}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.success) setTreeData(data.tree);
        })
        .catch((e) => console.warn('Could not load tree data:', e));
    }
  }, [user?.wallet]);

  const copyId = () => {
    if (!user?.id) return;
    navigator.clipboard.writeText(String(user.id));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const currentList = activeTab === 'l1' ? referrals.tree.l1 : activeTab === 'l2' ? referrals.tree.l2 : referrals.tree.l3;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Top Identity Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
              Permanent ID Network
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Matrix Network</h1>
          <p className="text-xs text-[#8B949E]">
            Immutable 3-line sponsor hierarchy &amp; automated doubling matrix placement.
          </p>
          {onNavigateToTeamPicture && (
            <div className="pt-1">
              <button
                onClick={onNavigateToTeamPicture}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold font-mono transition-all cursor-pointer shadow-md shadow-blue-500/20"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Full Picture of Total Team Topology →</span>
              </button>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center space-x-3 shrink-0">
            <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#1E2533] flex items-center space-x-3">
              <div>
                <div className="text-[10px] text-[#8B949E]">Your Permanent ID</div>
                <div className="text-base font-extrabold text-[#F5A623] font-mono">
                  #{user.id || 1}
                </div>
              </div>
              <button
                onClick={copyId}
                className="px-2 py-1 rounded bg-[#171D27] hover:bg-[#1E2533] text-xs font-mono text-white cursor-pointer"
              >
                {copiedId ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#1E2533]">
              <div className="text-[10px] text-[#8B949E]">Sponsor ID</div>
              <div className="text-base font-bold text-white font-mono">
                {user.sponsorId ? `#${user.sponsorId}` : 'Root #1'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Network Tier Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Direct Team (Tier 1)</span>
          <p className="text-xl font-bold font-mono text-[#F5A623] mt-1">{referrals.l1Count}</p>
          <span className="text-[10px] text-[#4E5766]">50% Direct Commission</span>
        </div>
        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Indirect Team (Tier 2)</span>
          <p className="text-xl font-bold font-mono text-white mt-1">{referrals.l2Count}</p>
          <span className="text-[10px] text-[#4E5766]">30% Line Commission</span>
        </div>
        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Third-Line Team (Tier 3)</span>
          <p className="text-xl font-bold font-mono text-white mt-1">{referrals.l3Count}</p>
          <span className="text-[10px] text-[#4E5766]">5% Line Commission</span>
        </div>
        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Total Network Size</span>
          <p className="text-xl font-bold font-mono text-emerald-400 mt-1">{referrals.totalNetworkCount}</p>
          <span className="text-[10px] text-emerald-500/80">3 Generations Deep</span>
        </div>
      </div>

      {/* Visual Matrix Hierarchy Preview */}
      <div className="p-5 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2533]">
          <div className="flex items-center space-x-2">
            <GitBranch className="w-4 h-4 text-[#F5A623]" />
            <h3 className="text-sm font-bold text-white">Visual Matrix Placement Tree</h3>
          </div>
          <span className="text-xs font-mono text-[#8B949E]">Spillover Enabled</span>
        </div>

        {treeData ? (
          <div className="p-4 rounded-lg bg-[#0B0E11] border border-[#1E2533] font-mono text-xs overflow-x-auto">
            <div className="space-y-3">
              {/* Root Node */}
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 rounded bg-[#F5A623] text-[#0B0E11] font-extrabold text-[11px]">
                  YOU (#{treeData.id || 1})
                </span>
                <span className="text-white">{formatAddress(treeData.wallet || '')}</span>
                <span className="text-emerald-400 text-[10px]">Active L{Math.max(...(treeData.activeLevels || [1]))}</span>
              </div>

              {/* Children Nodes */}
              {treeData.children && treeData.children.length > 0 ? (
                <div className="pl-6 border-l-2 border-[#1E2533] space-y-2 mt-2">
                  {treeData.children.map((child: any, idx: number) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-[#8B949E]">↳</span>
                      <span className="px-2 py-0.5 rounded bg-[#171D27] text-white font-bold text-[10px] border border-[#232B3B]">
                        #{child.id}
                      </span>
                      <span className="text-[#8B949E]">{formatAddress(child.wallet)}</span>
                      <span className="text-[10px] text-emerald-400">L{Math.max(...(child.activeLevels || [1]))}</span>
                      <span className="text-[10px] text-[#4E5766]">Direct Downline</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[#8B949E] pl-6 pt-2 italic">
                  No downline nodes placed in your subtree yet. Share your link to start building.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[#8B949E]">
            Connect wallet to inspect personal matrix tree hierarchy.
          </div>
        )}
      </div>

      {/* Tabbed Member Tables */}
      <div className="p-5 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E2533] pb-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('l1')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'l1'
                  ? 'bg-[#F5A623] text-[#0B0E11]'
                  : 'bg-[#171D27] text-[#8B949E] hover:text-white'
              }`}
            >
              Direct Team ({referrals.l1Count})
            </button>
            <button
              onClick={() => setActiveTab('l2')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'l2'
                  ? 'bg-[#F5A623] text-[#0B0E11]'
                  : 'bg-[#171D27] text-[#8B949E] hover:text-white'
              }`}
            >
              Indirect Team ({referrals.l2Count})
            </button>
            <button
              onClick={() => setActiveTab('l3')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'l3'
                  ? 'bg-[#F5A623] text-[#0B0E11]'
                  : 'bg-[#171D27] text-[#8B949E] hover:text-white'
              }`}
            >
              Third Line ({referrals.l3Count})
            </button>
          </div>
        </div>

        {currentList.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#8B949E] space-y-2">
            <p>No members registered in this tier yet.</p>
            {onNavigateToReferrals && (
              <button
                onClick={onNavigateToReferrals}
                className="text-[#F5A623] hover:underline cursor-pointer"
              >
                Copy your referral link to invite partners →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1E2533] text-[#8B949E]">
                  <th className="py-2 px-3">Member ID</th>
                  <th className="py-2 px-3">Wallet Address</th>
                  <th className="py-2 px-3">Active Levels</th>
                  <th className="py-2 px-3">Join Date</th>
                  <th className="py-2 px-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2230]">
                {currentList.map((m, idx) => (
                  <tr key={idx} className="hover:bg-[#151C27] transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">#{m.id || idx + 2}</td>
                    <td className="py-2.5 px-3 text-[#C9D1D9]">{formatAddress(m.wallet)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Level {Math.max(...(m.activeLevels || [1]))}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#8B949E]">
                      {new Date(m.joinTime).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <a
                        href={getExplorerUrl(m.joinSignature || m.wallet, m.joinSignature ? 'tx' : 'address', config.network)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#F5A623] hover:underline inline-flex items-center space-x-1"
                      >
                        <span>Solana Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
