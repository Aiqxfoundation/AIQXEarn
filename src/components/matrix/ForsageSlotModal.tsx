import React, { FC, useState, useEffect } from 'react';
import {
  Layers,
  Repeat,
  Users,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Coins,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  ChevronRight,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  MatrixLevelConfig,
  OFFICIAL_TREASURY_WALLET,
} from '../../lib/referral-engine';
import { SlotOccupant, SlotCardData } from './ForsageSlotCard';
import { getExplorerUrl } from '../../lib/solana';

interface ForsageSlotModalProps {
  levelConfig: MatrixLevelConfig;
  isOpen: boolean;
  onClose: () => void;
  userWallet?: string;
  userId?: number;
  isUnlocked: boolean;
  isNextInLine: boolean;
  onActivate: (config: MatrixLevelConfig) => void;
  connected: boolean;
}

export const ForsageSlotModal: FC<ForsageSlotModalProps> = ({
  levelConfig,
  isOpen,
  onClose,
  userWallet,
  userId = 1,
  isUnlocked,
  isNextInLine,
  onActivate,
  connected,
}) => {
  const [loading, setLoading] = useState(false);
  const [slotData, setSlotData] = useState<SlotCardData | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<number>(1);
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);
  const [inspectingOccupant, setInspectingOccupant] = useState<SlotOccupant | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function loadSlotDetail() {
      try {
        setLoading(true);
        const query = userWallet ? `wallet=${userWallet}` : `id=${userId}`;
        const res = await fetch(`/api/matrix/slot-detail?${query}&level=${levelConfig.level}`);
        const data = await res.json();

        if (isMounted && data.success && data.slot) {
          setSlotData(data.slot);
          setSelectedCycle(data.slot.currentCycle || 1);
        }
      } catch (err) {
        console.warn('Could not fetch slot detail from server, using calculated data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSlotDetail();
    return () => {
      isMounted = false;
    };
  }, [isOpen, levelConfig.level, userWallet, userId]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWallet(text);
    setTimeout(() => setCopiedWallet(null), 2000);
  };

  const completedCycles = slotData?.completedCycles || (isUnlocked ? 1 : 0);
  const currentCycle = slotData?.currentCycle || completedCycles + 1;
  const occupants = slotData?.occupants || [];
  const partnersCount = slotData?.partnersCount || (isUnlocked ? 1 : 0);
  const totalEarned = slotData?.totalEarned || (isUnlocked ? levelConfig.directReward : 0);

  const getSpotColorClass = (type?: SlotOccupant['placementType']) => {
    switch (type) {
      case 'direct':
        return 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-300 text-black shadow-[0_0_16px_rgba(16,185,129,0.5)]';
      case 'spillover_above':
        return 'bg-gradient-to-br from-amber-400 to-amber-600 border-amber-300 text-black shadow-[0_0_16px_rgba(245,166,35,0.5)]';
      case 'spillover_below':
        return 'bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-300 text-white shadow-[0_0_16px_rgba(139,92,246,0.5)]';
      case 'reinvest':
        return 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-300 text-black shadow-[0_0_16px_rgba(6,182,212,0.5)]';
      default:
        return 'bg-[#0F141E] border-[#222C3E] border-dashed text-[#526075] hover:border-[#384863]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#0B0E14] border border-[#232F42] rounded-3xl shadow-2xl overflow-hidden z-10">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#1A2332] bg-[#0E131C] shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#F5A623]/20 to-transparent border border-[#F5A623]/40 flex items-center justify-center font-mono font-black text-xl text-[#F5A623] shadow-[0_0_15px_rgba(245,166,35,0.25)]">
              L{levelConfig.level}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Matrix Slot Level {levelConfig.level}
                </h2>
                {isUnlocked ? (
                  <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Unlocked &amp; Active</span>
                  </span>
                ) : isNextInLine ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#F5A623]/15 text-[#F5A623] border border-[#F5A623]/30">
                    Next to Upgrade
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#1C2533] text-[#8B949E] border border-[#2B384D]">
                    Locked
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8B949E] mt-0.5">
                Forsage-Architecture Doubling Capacity: {levelConfig.slots.toLocaleString()} Spots | Cycle Automation
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#141B26] hover:bg-[#1E2838] border border-[#222E40] text-[#8B949E] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#0E131C] border border-[#1A2332]">
              <div className="flex items-center justify-between text-[#8B949E] text-[11px]">
                <span>Total Level Cost</span>
                <Coins className="w-3.5 h-3.5 text-[#F5A623]" />
              </div>
              <p className="text-base font-mono font-bold text-white mt-1">
                {levelConfig.totalPackageFee.toLocaleString()} AIQX
              </p>
              <span className="text-[10px] text-emerald-400 font-mono">
                15% ({levelConfig.slotActivationFee.toLocaleString()}) to Treasury
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E131C] border border-[#1A2332]">
              <div className="flex items-center justify-between text-[#8B949E] text-[11px]">
                <span>Total Earned</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-base font-mono font-bold text-emerald-400 mt-1">
                +{totalEarned.toLocaleString()} AIQX
              </p>
              <span className="text-[10px] text-[#8B949E]">Direct &amp; Spillover Pool</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E131C] border border-[#1A2332]">
              <div className="flex items-center justify-between text-[#8B949E] text-[11px]">
                <span>Completed Cycles</span>
                <Repeat className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <p className="text-base font-mono font-bold text-cyan-400 mt-1">
                {completedCycles} Cycles
              </p>
              <span className="text-[10px] text-[#8B949E]">Automatic Reinvestment</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0E131C] border border-[#1A2332]">
              <div className="flex items-center justify-between text-[#8B949E] text-[11px]">
                <span>Total Partners</span>
                <Users className="w-3.5 h-3.5 text-[#F5A623]" />
              </div>
              <p className="text-base font-mono font-bold text-white mt-1">
                {partnersCount} Members
              </p>
              <span className="text-[10px] text-[#8B949E]">Direct &amp; Spillover</span>
            </div>
          </div>

          {/* Forsage Visual Matrix Tree & Spots Diagram */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#080B10] border border-[#1A2332] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#171F2C]">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Interactive Matrix Tree</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Cycle #{currentCycle}
                  </span>
                </h3>
                <p className="text-xs text-[#8B949E]">
                  Click on any node to view partner wallet, on-chain placement, and SPL rewards.
                </p>
              </div>

              {/* Forsage Color Legend */}
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                <span className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-[#0F141E] border border-emerald-500/30 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Direct</span>
                </span>
                <span className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-[#0F141E] border border-amber-500/30 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Spillover (Above)</span>
                </span>
                <span className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-[#0F141E] border border-purple-500/30 text-purple-400">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>Spillover (Below)</span>
                </span>
                <span className="flex items-center space-x-1.5 px-2 py-1 rounded-md bg-[#0F141E] border border-cyan-500/30 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Reinvest 🔄</span>
                </span>
              </div>
            </div>

            {/* Tree Canvas */}
            <div className="py-6 flex flex-col items-center justify-center space-y-6">
              {/* Root Node (You) */}
              <div className="relative flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1C2536] to-[#0E131C] border-2 border-[#F5A623] flex flex-col items-center justify-center shadow-[0_0_20px_rgba(245,166,35,0.25)]">
                  <span className="text-[10px] font-mono font-bold text-[#F5A623]">YOU</span>
                  <span className="text-xs font-mono font-extrabold text-white">ID #{userId}</span>
                </div>
                {/* Connector Stem */}
                <div className="w-0.5 h-6 bg-[#232F42]" />
              </div>

              {/* Matrix Spots Grid with Connecting Lines */}
              <div className="w-full max-w-2xl">
                {/* Horizontal Bar */}
                <div className="w-full h-0.5 bg-[#232F42] mb-4" />

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 justify-items-center">
                  {Array.from({ length: Math.min(levelConfig.slots, 12) }).map((_, idx) => {
                    const spotIndex = idx + 1;
                    const occ = occupants.find((o) => o.position === spotIndex);
                    const isReinvestSpot = spotIndex === levelConfig.slots && levelConfig.slots > 1;
                    const type = occ ? occ.placementType : undefined;

                    return (
                      <div
                        key={spotIndex}
                        onClick={() => occ && setInspectingOccupant(occ)}
                        className={`group relative flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                          occ
                            ? 'bg-[#0E141E] hover:border-white/40 shadow-lg'
                            : 'bg-[#090C12] border-[#1C2433] opacity-60'
                        }`}
                      >
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 font-mono text-xs font-black transition-transform group-hover:scale-110 ${getSpotColorClass(
                            type
                          )}`}
                        >
                          {occ ? (
                            type === 'reinvest' ? (
                              <Repeat className="w-4 h-4" />
                            ) : (
                              <span>#{occ.userId}</span>
                            )
                          ) : (
                            <span className="text-xs text-[#526075]">
                              {isReinvestSpot ? '🔄' : spotIndex}
                            </span>
                          )}
                        </div>

                        <span className="mt-2 text-[10px] font-mono font-bold text-white">
                          Spot #{spotIndex}
                        </span>

                        <span className="text-[9px] font-mono text-[#8B949E]">
                          {occ ? occ.placementType.replace('_', ' ') : 'Open'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {levelConfig.slots > 12 && (
                  <div className="mt-4 p-3 rounded-xl bg-[#0D1219] border border-[#1E2736] text-center text-xs font-mono text-[#8B949E]">
                    Showing front 12 of <strong className="text-white">{levelConfig.slots.toLocaleString()}</strong> matrix spots. All positions are cryptographically sequenced on Solana.
                  </div>
                )}
              </div>
            </div>

            {/* Selected Occupant Card Detail Popup */}
            {inspectingOccupant && (
              <div className="p-4 rounded-xl bg-[#101622] border border-cyan-500/40 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-white">
                      Partner #{inspectingOccupant.userId} (Spot #{inspectingOccupant.position})
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300">
                      {inspectingOccupant.placementType}
                    </span>
                  </div>
                  <button
                    onClick={() => setInspectingOccupant(null)}
                    className="text-[#8B949E] hover:text-white text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono pt-1 text-[#8B949E]">
                  <div>
                    <span className="text-[10px]">Solana Wallet:</span>
                    <div className="flex items-center space-x-1 text-white font-bold">
                      <span>{inspectingOccupant.wallet.slice(0, 6)}...{inspectingOccupant.wallet.slice(-4)}</span>
                      <button
                        onClick={() => handleCopy(inspectingOccupant.wallet)}
                        className="text-[#8B949E] hover:text-white"
                      >
                        {copiedWallet === inspectingOccupant.wallet ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px]">Reward Generated:</span>
                    <p className="text-emerald-400 font-bold">
                      +{inspectingOccupant.rewardEarned.toLocaleString()} AIQX
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px]">Timestamp:</span>
                    <p className="text-white">
                      {new Date(inspectingOccupant.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Slot Occupants Table */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#080B10] border border-[#1A2332] space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#F5A623]" />
              <span>Current Cycle Occupants Log</span>
            </h3>

            {occupants.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[#0D1219] border border-[#1A2332] text-xs font-mono text-[#8B949E]">
                No occupants in this cycle yet. Share your referral link to place members directly or receive spillover!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1A2332] text-[#8B949E] text-[10px] uppercase">
                      <th className="pb-2.5">Spot</th>
                      <th className="pb-2.5">User ID</th>
                      <th className="pb-2.5">Wallet</th>
                      <th className="pb-2.5">Placement</th>
                      <th className="pb-2.5">Reward</th>
                      <th className="pb-2.5">Tx Signature</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#151C28]">
                    {occupants.map((occ) => (
                      <tr key={occ.position} className="hover:bg-[#0E141E]/50">
                        <td className="py-2.5 font-bold text-white">#{occ.position}</td>
                        <td className="py-2.5 font-bold text-[#F5A623]">ID #{occ.userId}</td>
                        <td className="py-2.5 text-[#C9D1D9]">
                          <div className="flex items-center space-x-1">
                            <span>{occ.wallet.slice(0, 4)}...{occ.wallet.slice(-4)}</span>
                            <a
                              href={getExplorerUrl(occ.wallet, 'address')}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#8B949E] hover:text-cyan-400"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              occ.placementType === 'direct'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : occ.placementType === 'spillover_above'
                                ? 'bg-amber-500/15 text-amber-400'
                                : occ.placementType === 'reinvest'
                                ? 'bg-cyan-500/15 text-cyan-400'
                                : 'bg-purple-500/15 text-purple-400'
                            }`}
                          >
                            {occ.placementType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold text-emerald-400">
                          +{occ.rewardEarned.toLocaleString()} AIQX
                        </td>
                        <td className="py-2.5 text-[#8B949E]">
                          <a
                            href={getExplorerUrl(occ.txSignature, 'tx')}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-cyan-400 flex items-center space-x-1"
                          >
                            <span>{occ.txSignature.slice(0, 6)}...</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Treasury Transparency & Crossover Split Info */}
          <div className="p-4 rounded-xl bg-[#0F141E] border border-[#1E2736] space-y-2 text-xs">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict Treasury Separation Rule</span>
            </div>
            <p className="text-[#8B949E]">
              Only the 15% Slot Activation Fee ({levelConfig.slotActivationFee.toLocaleString()} AIQX) is routed to Treasury (
              <span className="font-mono text-white">{OFFICIAL_TREASURY_WALLET.slice(0, 6)}...{OFFICIAL_TREASURY_WALLET.slice(-4)}</span>).
              All referral rewards (50% Direct, 30% Indirect, 5% Third Line) are paid 100% directly to member wallets on Solana.
            </p>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 sm:p-5 bg-[#0E131C] border-t border-[#1A2332] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-mono text-[#8B949E]">
            Matrix Status: <strong className="text-white">{isUnlocked ? 'Unlocked & Earning' : 'Locked'}</strong>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-[#141B26] hover:bg-[#1E2838] border border-[#232E40] text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Close
            </button>

            {!isUnlocked && isNextInLine && (
              <button
                onClick={() => {
                  onClose();
                  onActivate(levelConfig);
                }}
                disabled={!connected}
                className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 shadow-[0_4px_16px_rgba(245,166,35,0.3)] cursor-pointer"
              >
                <span>Activate Level {levelConfig.level} ({levelConfig.totalPackageFee.toLocaleString()} AIQX)</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
