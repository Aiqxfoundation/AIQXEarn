import React, { FC, useState } from 'react';
import {
  Shuffle,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import {
  MATRIX_LEVELS_CONFIG,
  getMatrixLevelConfig,
  UserRecord,
} from '../../lib/referral-engine';
import { AppConfig } from '../../lib/solana';

interface CrossoverSectionProps {
  config: AppConfig;
  user: UserRecord | null;
  onNavigateToMatrix?: () => void;
}

export const CrossoverSection: FC<CrossoverSectionProps> = ({
  config,
  user,
  onNavigateToMatrix,
}) => {
  const activeLevels = user?.activeLevels || [1];
  const userMaxLevel = Math.max(...activeLevels, 1);

  // Interactive Simulator State
  const [testDownlineLevel, setTestDownlineLevel] = useState<number>(Math.min(userMaxLevel + 1, 14));
  const [testU1Level, setTestU1Level] = useState<number>(userMaxLevel);
  const [testU2Level, setTestU2Level] = useState<number>(Math.max(userMaxLevel - 1, 1));
  const [testU3Level, setTestU3Level] = useState<number>(Math.max(userMaxLevel - 2, 1));

  const targetConfig = getMatrixLevelConfig(testDownlineLevel);
  const commissionPool = targetConfig.directReward + targetConfig.indirectReward + targetConfig.thirdLineReward;

  const u1Qual = testU1Level >= testDownlineLevel;
  const u2Qual = testU2Level >= testDownlineLevel;
  const u3Qual = testU3Level >= testDownlineLevel;

  const isCrossoverScenario = !(u1Qual && u2Qual && u3Qual);

  // Split calculation
  const u1Share = u1Qual ? Math.floor(commissionPool * 0.40) : 0;
  const u2Share = u2Qual ? Math.floor(commissionPool * 0.30) : 0;
  const u3Share = u3Qual ? Math.floor(commissionPool * 0.20) : 0;
  const allocated = u1Share + u2Share + u3Share;
  const unallocated = commissionPool - allocated;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Overview Top Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#F5A623]">
              Section 8 Specification
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Auto Crossover &amp; Commission Split</h1>
          <p className="text-xs text-[#8B949E]">
            When a downline activates a higher level than their upline, the smart contract automatically routes commissions to qualified uplines.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B0E11] border border-[#1E2533] text-right shrink-0">
          <div className="text-[10px] text-[#8B949E]">Your Current Qualification</div>
          <div className="text-base font-bold text-emerald-400 font-mono">
            Active up to Level {userMaxLevel}
          </div>
          <div className="text-[10px] text-[#4E5766]">
            Qualified for L1–L{userMaxLevel} Commissions
          </div>
        </div>
      </div>

      {/* Commission Protection Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-[#141A23] to-[#11161E] border border-[#1E2533] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center text-[#F5A623] shrink-0 mt-0.5">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">How Crossover Protection Works</h3>
            <p className="text-xs text-[#8B949E] leading-relaxed mt-0.5">
              To earn commissions on Level <strong>N</strong>, your wallet must also have Level <strong>N</strong> activated.
              If a direct or indirect downline activates a higher level before you, commission splits execute automatically
              to the nearest qualified uplines. Upgrade your slots ahead of your team to ensure 100% full payouts.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToMatrix}
          className="px-4 py-2 rounded-lg bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] font-bold text-xs shrink-0 flex items-center space-x-1 cursor-pointer transition-all shadow-[0_2px_8px_rgba(245,166,35,0.25)]"
        >
          <span>Upgrade Next Slot</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Split Ratios Matrix */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Upline 1 Share (if Qualified)</span>
          <p className="text-2xl font-bold font-mono text-[#F5A623] mt-1">40%</p>
          <span className="text-[10px] text-[#4E5766]">Immediate Sponsor</span>
        </div>
        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Upline 2 Share (if Qualified)</span>
          <p className="text-2xl font-bold font-mono text-white mt-1">30%</p>
          <span className="text-[10px] text-[#4E5766]">Second Line Sponsor</span>
        </div>
        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Upline 3 Share (if Qualified)</span>
          <p className="text-2xl font-bold font-mono text-white mt-1">20%</p>
          <span className="text-[10px] text-[#4E5766]">Third Line Sponsor</span>
        </div>
        <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <span className="text-[11px] text-[#8B949E]">Unallocated Reserve</span>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">10%</p>
          <span className="text-[10px] text-[#4E5766]">Highest Qualified Sponsor</span>
        </div>
      </div>

      {/* Interactive Crossover Simulator */}
      <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2533]">
          <div className="flex items-center space-x-2">
            <Shuffle className="w-4 h-4 text-[#F5A623]" />
            <h3 className="text-sm font-bold text-white">Interactive Crossover Split Simulator</h3>
          </div>
          <span className="text-xs font-mono text-[#8B949E]">Real-Time Smart Contract Math</span>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="text-[11px] text-[#8B949E] block mb-1">Downline Activating Level:</label>
            <select
              value={testDownlineLevel}
              onChange={(e) => setTestDownlineLevel(Number(e.target.value))}
              className="w-full p-2 rounded-lg bg-[#0B0E11] border border-[#1E2533] text-white text-xs font-mono font-bold focus:outline-none focus:border-[#F5A623]"
            >
              {MATRIX_LEVELS_CONFIG.map((l) => (
                <option key={l.level} value={l.level}>
                  Level {l.level} ({l.totalPackageFee.toLocaleString()} AIQX)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-[#8B949E] block mb-1">Upline 1 (Sponsor) Max Level:</label>
            <select
              value={testU1Level}
              onChange={(e) => setTestU1Level(Number(e.target.value))}
              className="w-full p-2 rounded-lg bg-[#0B0E11] border border-[#1E2533] text-white text-xs font-mono focus:outline-none focus:border-[#F5A623]"
            >
              {MATRIX_LEVELS_CONFIG.map((l) => (
                <option key={l.level} value={l.level}>
                  Level {l.level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-[#8B949E] block mb-1">Upline 2 Max Level:</label>
            <select
              value={testU2Level}
              onChange={(e) => setTestU2Level(Number(e.target.value))}
              className="w-full p-2 rounded-lg bg-[#0B0E11] border border-[#1E2533] text-white text-xs font-mono focus:outline-none focus:border-[#F5A623]"
            >
              {MATRIX_LEVELS_CONFIG.map((l) => (
                <option key={l.level} value={l.level}>
                  Level {l.level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-[#8B949E] block mb-1">Upline 3 Max Level:</label>
            <select
              value={testU3Level}
              onChange={(e) => setTestU3Level(Number(e.target.value))}
              className="w-full p-2 rounded-lg bg-[#0B0E11] border border-[#1E2533] text-white text-xs font-mono focus:outline-none focus:border-[#F5A623]"
            >
              {MATRIX_LEVELS_CONFIG.map((l) => (
                <option key={l.level} value={l.level}>
                  Level {l.level}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Matrix */}
        <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#1E2533] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E2533] font-sans">
            <span className="font-bold text-white">
              Simulation Result: Level {testDownlineLevel} ({targetConfig.totalPackageFee.toLocaleString()} AIQX Package)
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">
              Slot Fee to Treasury: {targetConfig.slotActivationFee.toLocaleString()} AIQX
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 rounded bg-[#11161E] border border-[#1E2533]">
              <span className="flex items-center space-x-2">
                <span className="text-[#8B949E]">Upline 1 (L{testU1Level}):</span>
                {u1Qual ? (
                  <span className="text-emerald-400 font-sans text-[11px] font-semibold">Qualified (40%)</span>
                ) : (
                  <span className="text-rose-400 font-sans text-[11px] font-semibold">Unqualified (Level too low)</span>
                )}
              </span>
              <span className="font-bold text-[#F5A623]">
                {u1Share.toLocaleString()} AIQX
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-[#11161E] border border-[#1E2533]">
              <span className="flex items-center space-x-2">
                <span className="text-[#8B949E]">Upline 2 (L{testU2Level}):</span>
                {u2Qual ? (
                  <span className="text-emerald-400 font-sans text-[11px] font-semibold">Qualified (30%)</span>
                ) : (
                  <span className="text-rose-400 font-sans text-[11px] font-semibold">Unqualified (Level too low)</span>
                )}
              </span>
              <span className="font-bold text-white">
                {u2Share.toLocaleString()} AIQX
              </span>
            </div>

            <div className="flex justify-between items-center p-2 rounded bg-[#11161E] border border-[#1E2533]">
              <span className="flex items-center space-x-2">
                <span className="text-[#8B949E]">Upline 3 (L{testU3Level}):</span>
                {u3Qual ? (
                  <span className="text-emerald-400 font-sans text-[11px] font-semibold">Qualified (20%)</span>
                ) : (
                  <span className="text-rose-400 font-sans text-[11px] font-semibold">Unqualified (Level too low)</span>
                )}
              </span>
              <span className="font-bold text-white">
                {u3Share.toLocaleString()} AIQX
              </span>
            </div>

            {unallocated > 0 && (
              <div className="flex justify-between items-center p-2 rounded bg-[#11161E] border border-emerald-500/30">
                <span className="text-emerald-400 font-sans text-[11px]">
                  Unallocated Reserve Flow to Highest Qualified Sponsor:
                </span>
                <span className="font-bold text-emerald-400">
                  {unallocated.toLocaleString()} AIQX
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
