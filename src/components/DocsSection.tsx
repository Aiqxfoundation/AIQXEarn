import React, { FC, useState } from 'react';
import {
  BookOpen,
  ShieldCheck,
  Layers,
  Users,
  Repeat,
  Zap,
  CheckCircle2,
  Lock,
  ExternalLink,
  Copy,
  Check,
  Coins,
  Cpu,
  Search,
} from 'lucide-react';
import { AppConfig, getExplorerUrl } from '../lib/solana';
import {
  MATRIX_LEVELS_CONFIG,
  OFFICIAL_TREASURY_WALLET,
  GENESIS_ROOT_WALLET,
} from '../lib/referral-engine';
import { OFFICIAL_AIQX_MINT } from '../lib/marketData';

interface DocsSectionProps {
  config: AppConfig;
  onNavigateToMatrix?: () => void;
  onNavigateToJoin?: () => void;
  onNavigateToContribute?: () => void;
}

export const DocsSection: FC<DocsSectionProps> = ({
  config,
  onNavigateToMatrix,
  onNavigateToJoin,
  onNavigateToContribute,
}) => {
  const [activeDocTab, setActiveDocTab] = useState<
    'manifesto' | 'matrix-math' | 'id-system' | 'distribution' | 'treasury' | 'crossover' | 'contribute' | 'contracts'
  >('manifesto');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = async (val: string, key: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const docSections = [
    { id: 'manifesto', label: '1. Manifesto & Protocol', icon: ShieldCheck },
    { id: 'matrix-math', label: '2. 12-Slot Independent System', icon: Layers },
    { id: 'id-system', label: '3. Permanent Sequential IDs', icon: Users },
    { id: 'distribution', label: '4. Joining & Distribution', icon: Coins },
    { id: 'treasury', label: '5. Treasury Policy', icon: Lock },
    { id: 'crossover', label: '6. Auto Crossover Splits', icon: Repeat },
    { id: 'contribute', label: '7. Contribute to Earn', icon: Zap },
    { id: 'contracts', label: '8. Smart Contract & Audit', icon: Cpu },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#11161E] border border-[#1E2533] shadow-2xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623] animate-pulse" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F5A623]">
              Protocol Documentation &amp; Architecture
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AIQX Knowledge Base</h1>
          <p className="text-xs text-[#8B949E]">
            Complete institutional specifications, 14-level mathematical models, on-chain rules, and security audits.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onNavigateToJoin && (
            <button
              onClick={onNavigateToJoin}
              className="px-4 py-2 rounded-xl bg-[#171D27] hover:bg-[#1E2533] border border-[#232B3B] text-white text-xs font-semibold cursor-pointer transition-colors"
            >
              Join (100 AIQX)
            </button>
          )}
          {onNavigateToMatrix && (
            <button
              onClick={onNavigateToMatrix}
              className="px-4 py-2 rounded-xl bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] text-xs font-bold shadow-[0_4px_16px_rgba(245,166,35,0.25)] cursor-pointer transition-colors"
            >
              Open Matrix X →
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Docs Layout: Left navigation pill list, Right active document */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Doc Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <div className="p-3 rounded-2xl bg-[#11161E] border border-[#1E2533] space-y-1 shadow-2xl">
            <div className="px-3 py-2 text-[11px] font-mono font-bold text-[#8B949E] uppercase tracking-wider">
              Sections
            </div>
            {docSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeDocTab === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveDocTab(sec.id as any)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-left text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#171D27] text-[#F5A623] border border-[#F5A623]/40 font-bold shadow-sm'
                      : 'text-[#8B949E] hover:text-white hover:bg-[#0B0E11]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#F5A623]' : 'text-[#6E7681]'}`} />
                  <span className="truncate">{sec.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Contract Card */}
          <div className="p-4 rounded-2xl bg-[#11161E] border border-[#1E2533] space-y-3 text-xs">
            <div className="flex items-center justify-between text-[#8B949E]">
              <span className="font-mono text-[11px]">AIQX Mint</span>
              <span className="text-emerald-400 font-mono text-[10px]">SPL 6 Decimals</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0B0E14] border border-[#1A2230] flex items-center justify-between font-mono text-[11px]">
              <span className="text-blue-400 truncate max-w-[200px]">{OFFICIAL_AIQX_MINT}</span>
              <button
                onClick={() => handleCopy(OFFICIAL_AIQX_MINT, 'mint')}
                className="p-1 hover:text-white text-[#8B949E] cursor-pointer"
                title="Copy Mint"
              >
                {copiedKey === 'mint' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Active Document Pane */}
        <div className="lg:col-span-8">
          <div className="p-6 rounded-2xl bg-[#11161E] border border-[#1E2533] space-y-6 min-h-[500px]">
            {/* 1. Manifesto */}
            {activeDocTab === 'manifesto' && (
              <div className="space-y-4">
                <div className="border-b border-[#1E2533] pb-4">
                  <h2 className="text-xl font-bold text-white">1. Protocol Manifesto &amp; Architecture</h2>
                  <p className="text-xs text-[#8B949E] mt-1">
                    AIQX Foundation Matrix Program: Built For Adoption &amp; Network | Contribute to Earn.
                  </p>
                </div>

                <div className="space-y-3 text-xs text-[#C9D1D9] leading-relaxed">
                  <p>
                    The AIQX Foundation Matrix Program is an institutional-grade, fully decentralized smart contract architecture deployed on the Solana blockchain.
                    Traditional pyramid or centralized schemes retain administrative custody of funds, introduce counterparty default risk, and rely on arbitrary operator discretion.
                  </p>
                  <p>
                    In contrast, AIQX operates on non-custodial SPL token transfers. Every incoming activation fee is atomically dispersed in the exact same transaction slot to verified uplines and the immutable Treasury wallet according to hardcoded mathematical rules.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#1A2230] space-y-1">
                    <span className="text-[10px] font-mono text-[#8B949E] uppercase">Blockchain</span>
                    <div className="text-sm font-bold text-white">Solana Mainnet</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#1A2230] space-y-1">
                    <span className="text-[10px] font-mono text-[#8B949E] uppercase">Fixed Supply</span>
                    <div className="text-sm font-bold text-emerald-400">4,500,000 AIQX</div>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#1A2230] space-y-1">
                    <span className="text-[10px] font-mono text-[#8B949E] uppercase">Slots Program</span>
                    <div className="text-sm font-bold text-blue-400">12 Independent Slots</div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. 14-Level Math */}
            {activeDocTab === 'matrix-math' && (
              <div className="space-y-4">
                <div className="border-b border-[#1E2533] pb-4">
                  <h2 className="text-xl font-bold text-white">2. 12-Slot Independent Matrix Mathematics</h2>
                  <p className="text-xs text-[#8B949E] mt-1">
                    Pure slot-based system: No levels. Every slot is higher than before (doubling fees from 100 to 204,800 AIQX). Everyone earns under identical opportunities.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#1E2533]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#171D27] text-[#8B949E] text-[11px] uppercase border-b border-[#1E2533]">
                      <tr>
                        <th className="py-2.5 px-3">Slot</th>
                        <th className="py-2.5 px-3">Direct Spots</th>
                        <th className="py-2.5 px-3">Recycling Spots</th>
                        <th className="py-2.5 px-3">Total Capacity</th>
                        <th className="py-2.5 px-3">Direct Reward</th>
                        <th className="py-2.5 px-3 text-right">Package Fee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A2230] text-[#E6EDF3]">
                      {MATRIX_LEVELS_CONFIG.map((s) => (
                        <tr key={s.slot} className="hover:bg-[#141A24]">
                          <td className="py-2 px-3 font-bold text-blue-400">Slot {s.slot}</td>
                          <td className="py-2 px-3 text-emerald-400 font-bold">{s.directSpots} Direct</td>
                          <td className="py-2 px-3 text-cyan-400 font-bold">1 Recycling</td>
                          <td className="py-2 px-3">{s.slots} Spots</td>
                          <td className="py-2 px-3 text-emerald-400">+{s.directReward.toLocaleString()} AIQX</td>
                          <td className="py-2 px-3 text-right font-bold text-[#F5A623]">{s.totalPackageFee.toLocaleString()} AIQX</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#1A2332] space-y-2 text-xs text-[#8B949E]">
                  <p>
                    <strong className="text-white">Recycling Logic (Exact):</strong> When the final recycling spot is filled, the slot recycles: 50% to nearest qualified upline (crossover enabled), 10% to Treasury, and 40% distributed across the user’s top 3 downline leaders (20%, 12%, 8%). A fresh cycle opens of the same slot!
                  </p>
                  <p>
                    <strong className="text-white">Total Team Topology:</strong> Modeled after 1 Leader → 3 Direct Partners → 9 Downline Members.
                  </p>
                </div>
              </div>
            )}

            {/* 3. ID System */}
            {activeDocTab === 'id-system' && (
              <div className="space-y-4">
                <div className="border-b border-[#1E2533] pb-4">
                  <h2 className="text-xl font-bold text-white">3. Permanent Sequential ID Registration System</h2>
                  <p className="text-xs text-[#8B949E] mt-1">
                    Immutable membership hierarchy with strict preservation of sponsor relationships.
                  </p>
                </div>

                <div className="space-y-3 text-xs text-[#C9D1D9] leading-relaxed">
                  <p>
                    Every participant receives a permanent, monotonically incrementing integer ID upon initial activation (100 AIQX).
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-[#8B949E]">
                    <li><strong className="text-white">ID 1 (ROOT / Genesis)</strong>: Root anchor of the entire matrix tree.</li>
                    <li><strong className="text-white">ID 2, ID 3, ...</strong>: Sequentially minted IDs on-chain.</li>
                    <li><strong className="text-white">Separation of Structures</strong>: The referral hierarchy (Sponsor ID) is permanent and never mutated by spillover. The matrix structure (Parent ID) dynamically fills slots left-to-right, top-to-bottom.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#1A2230] font-mono text-xs text-blue-400">
                  ID 1 (ROOT) → ID 2 (Direct Sponsor: 1) → ID 3 (Spillover Child under ID 2)
                </div>
              </div>
            )}

            {/* 4. Distribution */}
            {activeDocTab === 'distribution' && (
              <div className="space-y-4">
                <div className="border-b border-[#1E2533] pb-4">
                  <h2 className="text-xl font-bold text-white">4. Two Separate 100 AIQX Mechanisms</h2>
                  <p className="text-xs text-[#8B949E] mt-1">
                    Strict mathematical distinction between New Member Onboarding and Same-Level Slot Recycling.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Mechanism 1 */}
                  <div className="p-4 rounded-xl bg-[#0B0E14] border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">1. Initial Joining (100 AIQX)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 font-bold">New Member</span>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#8B949E]">Direct Referral (Line 1)</span>
                        <span className="font-bold text-emerald-400">50 AIQX (50%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B949E]">Indirect Line (Line 2)</span>
                        <span className="font-bold text-purple-400">30 AIQX (30%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B949E]">Third Line (Line 3)</span>
                        <span className="font-bold text-amber-400">5 AIQX (5%)</span>
                      </div>
                      <div className="flex justify-between border-t border-[#1E2533] pt-2">
                        <span className="text-[#8B949E]">Slot Activation (Vault)</span>
                        <span className="font-bold text-cyan-400">15 AIQX (15%)</span>
                      </div>
                      <div className="flex justify-between border-t border-[#1E2533] pt-2">
                        <span className="text-white font-bold">Protocol Treasury</span>
                        <span className="font-bold text-emerald-400">0 AIQX (0%)</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#8B949E]">
                      Fixed for all new entries. Treasury gets 0 AIQX from this initial onboarding fee.
                    </p>
                  </div>

                  {/* Mechanism 2 */}
                  <div className="p-4 rounded-xl bg-[#0B0E14] border border-cyan-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">2. Slot Recycling (100 AIQX)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-400 font-bold">Slot Full</span>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#8B949E]">Eligible Upline (Active Level)</span>
                        <span className="font-bold text-cyan-400">50 AIQX (50%)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#8B949E]">Protocol Treasury</span>
                        <span className="font-bold text-amber-400">10 AIQX (10%)</span>
                      </div>
                      <div className="flex justify-between border-t border-[#1E2533] pt-2">
                        <span className="text-[#8B949E]">Top 3 Downline Leaders</span>
                        <span className="font-bold text-emerald-400">40 AIQX (40%)</span>
                      </div>
                      <div className="pl-3 text-[11px] text-[#8B949E] space-y-1">
                        <div className="flex justify-between">
                          <span>• Rank 1 (50%)</span>
                          <span className="text-white font-bold">20 AIQX</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Rank 2 (30%)</span>
                          <span className="text-white font-bold">12 AIQX</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Rank 3 (20%)</span>
                          <span className="text-white font-bold">8 AIQX</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#8B949E]">
                      Trigger: When a slot at any level is full, a NEW slot of SAME LEVEL opens with SAME FEE. Level does NOT auto-upgrade.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Treasury Policy */}
            {activeDocTab === 'treasury' && (
              <div className="space-y-4">
                <div className="border-b border-[#1E2533] pb-4">
                  <h2 className="text-xl font-bold text-white">5. Protocol Treasury Wallet Policy</h2>
                  <p className="text-xs text-[#8B949E] mt-1">
                    Strict isolation of protocol operational reserve and zero admin control over user commissions.
                  </p>
                </div>

                <div className="space-y-3 text-xs text-[#C9D1D9] leading-relaxed">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                    <span className="font-bold text-amber-400 uppercase text-[11px] tracking-wider block">
                      STRICT ISOLATION &amp; ZERO-BURN POLICY
                    </span>
                    <p className="text-amber-200">
                      The Protocol Treasury receives <strong>0 AIQX</strong> from new member joins. Treasury receives exactly <strong>10 AIQX</strong> solely upon same-level slot recycling. All referral commissions (Direct 50, Indirect 30, Third Line 5) and downline leader rewards (40 AIQX) are distributed directly to community wallets.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[#8B949E] text-[11px] font-mono">Immutable Treasury Address:</span>
                    <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#1A2230] flex items-center justify-between font-mono text-xs">
                      <span className="text-white select-all">{OFFICIAL_TREASURY_WALLET}</span>
                      <button
                        onClick={() => handleCopy(OFFICIAL_TREASURY_WALLET, 'treasury')}
                        className="p-1 hover:text-white text-[#8B949E] cursor-pointer"
                        title="Copy Treasury Address"
                      >
                        {copiedKey === 'treasury' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Crossover */}
            {activeDocTab === 'crossover' && (
              <div className="space-y-4">
                <div className="border-b border-[#1E2533] pb-4">
                  <h2 className="text-xl font-bold text-white">6. Upward Crossover &amp; 40 AIQX Downline Ranking</h2>
                  <p className="text-xs text-[#8B949E] mt-1">
                    Upward traversal mechanics and competitive 3-line leader compensation.
                  </p>
                </div>

                <div className="space-y-3 text-xs text-[#C9D1D9] leading-relaxed">
                  <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#1A2230] space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Upward Crossover Mechanics</h4>
                    <p className="text-[#8B949E]">
                      If a downline member activates Level 2 (or higher) but their direct upline only has Level 1 active, all Level 2 income <strong className="text-white">CROSSOVERS</strong> to the nearest qualified upline in the tree who has that level unlocked. The amount traverses upward until it finds an active level holder. Upline must open that level to earn.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#1A2230] space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">40 AIQX Downline Leader Engine</h4>
                    <p className="text-[#8B949E]">
                      Upon every slot recycling (100 AIQX), 40 AIQX is allocated to the Top 3 Leaders in the user's OWN downline:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-[#8B949E]">
                      <li><strong className="text-white">Scoring Metric</strong>: Total members in their 3 lines (Direct + Indirect + Third). Higher team count = higher rank.</li>
                      <li><strong className="text-white">Rank 1 (50%)</strong>: 20 AIQX paid atomically on Solana.</li>
                      <li><strong className="text-white">Rank 2 (30%)</strong>: 12 AIQX paid atomically on Solana.</li>
                      <li><strong className="text-white">Rank 3 (20%)</strong>: 8 AIQX paid atomically on Solana.</li>
                      <li><strong className="text-white">Zero Burn Fallback</strong>: If 3 downline lines are incomplete, rewards go to active members bringing users. No AIQX is ever burned.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Contribute to Earn */}
            {activeDocTab === 'contribute' && (
              <div className="space-y-4">
                <div className="border-b border-[#1E2533] pb-4">
                  <h2 className="text-xl font-bold text-white">7. Contribute to Earn Program</h2>
                  <p className="text-xs text-[#8B949E] mt-1">
                    Decentralized community task verification and adoption grants.
                  </p>
                </div>

                <div className="space-y-3 text-xs text-[#C9D1D9] leading-relaxed">
                  <p>
                    Members can actively contribute to the growth and liquidity of the AIQX ecosystem by executing verified adoption tasks:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#1A2230] space-y-1">
                      <div className="font-bold text-white">Community Marketing</div>
                      <p className="text-[#8B949E] text-[11px]">Creating educational video tutorials, X threads, and articles.</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0B0E14] border border-[#1A2230] space-y-1">
                      <div className="font-bold text-white">Liquidity Provisioning</div>
                      <p className="text-[#8B949E] text-[11px]">Providing SOL/AIQX pool liquidity on Raydium AMM.</p>
                    </div>
                  </div>
                  {onNavigateToContribute && (
                    <button
                      onClick={onNavigateToContribute}
                      className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition-colors"
                    >
                      Submit Contribution Proof →
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 8. Smart Contract & Audit */}
            {activeDocTab === 'contracts' && (
              <div className="space-y-4">
                <div className="border-b border-[#1E2533] pb-4">
                  <h2 className="text-xl font-bold text-white">8. Smart Contract &amp; SPL Token Audit</h2>
                  <p className="text-xs text-[#8B949E] mt-1">
                    On-chain cryptographic security and verifiable parameters.
                  </p>
                </div>

                <div className="space-y-3 text-xs text-[#C9D1D9] leading-relaxed">
                  <div className="p-4 rounded-xl bg-[#0B0E14] border border-[#1A2230] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1E2533] pb-2">
                      <span className="text-[#8B949E]">Token Standard</span>
                      <span className="font-mono font-bold text-white">SPL Token (Solana)</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#1E2533] pb-2">
                      <span className="text-[#8B949E]">Mint Address</span>
                      <a
                        href={getExplorerUrl(OFFICIAL_AIQX_MINT, 'address', 'mainnet-beta')}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-blue-400 hover:underline flex items-center space-x-1"
                      >
                        <span className="truncate max-w-[200px]">{OFFICIAL_AIQX_MINT}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#1E2533] pb-2">
                      <span className="text-[#8B949E]">Total Fixed Supply</span>
                      <span className="font-mono font-bold text-white">4,500,000 AIQX</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#8B949E]">Mint Authority</span>
                      <span className="font-mono text-emerald-400 font-bold">Revoked / Immutable</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
