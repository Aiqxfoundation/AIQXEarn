import React, { FC, useState } from 'react';
import {
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Coins,
  BookOpen,
  Lock,
  Layers,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { AppConfig, getExplorerUrl } from '../lib/solana';
import { OFFICIAL_AIQX_MINT, VERIFIED_POOL_ADDRESS } from '../lib/marketData';
import { SolanaLogo } from './SolanaLogo';

interface TokenGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  tokenPriceUsd?: number;
}

export const TokenGuideModal: FC<TokenGuideModalProps> = ({
  isOpen,
  onClose,
  config,
  tokenPriceUsd = 0.0002613,
}) => {
  const [copiedMint, setCopiedMint] = useState(false);
  const [copiedPool, setCopiedPool] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, type: 'mint' | 'pool') => {
    navigator.clipboard.writeText(text);
    if (type === 'mint') {
      setCopiedMint(true);
      setTimeout(() => setCopiedMint(false), 2000);
    } else {
      setCopiedPool(true);
      setTimeout(() => setCopiedPool(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      {/* Background click to dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#0D1117] border border-[#232B3B] rounded-2xl shadow-[0_16px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] z-10">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2533] bg-[#11161E]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center text-[#F5A623]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-tight">AIQX Official Token Guide</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Verified Contract
                </span>
              </div>
              <p className="text-xs text-[#8B949E]">
                Architecture, SPL token specifications, security audits & distribution protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B949E] hover:text-white hover:bg-[#1A2230] transition-colors cursor-pointer"
            aria-label="Close Token Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 text-sm text-[#C9D1D9]">
          {/* Token Identity Card */}
          <div className="p-4 rounded-xl bg-[#141A23] border border-[#1E2533] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#F5A623] to-[#e59917] shrink-0">
                <img
                  src="/aiqx-logo.png"
                  alt="AIQX Logo"
                  className="w-full h-full rounded-full object-cover bg-black"
                />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-extrabold text-white">AIQX Protocol</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#1E2533] text-[#F5A623]">
                    SPL Token
                  </span>
                </div>
                <div className="text-xs text-[#8B949E] flex items-center space-x-2 mt-0.5">
                  <span className="flex items-center space-x-1">
                    <SolanaLogo className="w-3 h-3" />
                    <span>Solana Mainnet-Beta</span>
                  </span>
                  <span>•</span>
                  <span>1 AIQX ≈ ${tokenPriceUsd.toFixed(6)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <a
                href={`https://raydium.io/swap/?inputMint=sol&outputMint=${OFFICIAL_AIQX_MINT}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>Swap on Raydium</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={`https://www.geckoterminal.com/solana/pools/${VERIFIED_POOL_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-lg bg-[#1E2533] hover:bg-[#2A3448] text-white font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>Live Chart</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#8B949E]" />
              </a>
            </div>
          </div>

          {/* SPL Mint Address Section with One-Click Copy */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8B949E]">
              <span className="text-white">Official SPL Token Mint Address:</span>
              <a
                href={getExplorerUrl(OFFICIAL_AIQX_MINT, 'address', 'mainnet-beta')}
                target="_blank"
                rel="noreferrer"
                className="text-[#F5A623] hover:underline flex items-center space-x-1"
              >
                <span>View on Solana Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#090C0F] border border-[#1E2533]">
              <span className="font-mono text-xs text-[#E6EDF3] break-all select-all font-medium">
                {OFFICIAL_AIQX_MINT}
              </span>
              <button
                onClick={() => copyToClipboard(OFFICIAL_AIQX_MINT, 'mint')}
                className="ml-3 px-3 py-1.5 rounded-lg bg-[#171D27] hover:bg-[#1E2533] text-white text-xs flex items-center space-x-1.5 shrink-0 border border-[#232B3B] cursor-pointer transition-colors"
              >
                {copiedMint ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#8B949E]" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Key Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-[#11161E] border border-[#1E2533]">
              <div className="text-[11px] text-[#8B949E]">Total Fixed Supply</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">4,550,000</div>
              <div className="text-[10px] text-[#4E5766]">AIQX Max Cap</div>
            </div>

            <div className="p-3 rounded-xl bg-[#11161E] border border-[#1E2533]">
              <div className="text-[11px] text-[#8B949E]">Token Decimals</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">6 Decimals</div>
              <div className="text-[10px] text-[#4E5766]">SPL Standard</div>
            </div>

            <div className="p-3 rounded-xl bg-[#11161E] border border-[#1E2533]">
              <div className="text-[11px] text-[#8B949E]">Primary DEX Pair</div>
              <div className="text-sm font-bold text-white mt-1 font-mono">AIQX / SOL</div>
              <div className="text-[10px] text-[#4E5766]">Raydium AMM</div>
            </div>

            <div className="p-3 rounded-xl bg-[#11161E] border border-[#1E2533]">
              <div className="text-[11px] text-[#8B949E]">Trading Status</div>
              <div className="text-sm font-bold text-emerald-400 mt-1 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Active</span>
              </div>
              <div className="text-[10px] text-[#4E5766]">Raydium V4 Pool</div>
            </div>
          </div>

          {/* Security & Immutability Badges */}
          <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-3">
            <div className="flex items-center space-x-2 text-white font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Contract Security & Decentralization Status</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-[#0E1218] border border-[#1A2230]">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Mint Revoked</div>
                  <div className="text-[10px] text-[#8B949E]">No inflation possible</div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-[#0E1218] border border-[#1A2230]">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Freeze Revoked</div>
                  <div className="text-[10px] text-[#8B949E]">Zero transfer blacklists</div>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 p-2.5 rounded-lg bg-[#0E1218] border border-[#1A2230]">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">SPL Immutable</div>
                  <div className="text-[10px] text-[#8B949E]">Canonical Solana Token</div>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Reward Distribution Architecture */}
          <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-semibold text-xs">
                <Sparkles className="w-4 h-4 text-[#F5A623]" />
                <span>3-Tier Community Distribution Architecture</span>
              </div>
              <span className="text-[11px] font-mono text-[#8B949E]">100% Automated Distribution</span>
            </div>

            <p className="text-xs text-[#8B949E] leading-relaxed">
              When participants register or trigger network activities, the platform algorithmically executes
              instantaneous token distributions across verified referrers:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-center">
              <div className="p-2.5 rounded-lg bg-[#090C0F] border border-[#1E2533]">
                <div className="text-[#F5A623] font-extrabold text-sm">50%</div>
                <div className="text-[10px] text-white font-sans mt-0.5 font-semibold">Tier 1 Direct</div>
                <div className="text-[9px] text-[#8B949E] font-sans">Immediate Sponsor</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#090C0F] border border-[#1E2533]">
                <div className="text-[#F5A623] font-extrabold text-sm">30%</div>
                <div className="text-[10px] text-white font-sans mt-0.5 font-semibold">Tier 2 Network</div>
                <div className="text-[9px] text-[#8B949E] font-sans">Second Line</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#090C0F] border border-[#1E2533]">
                <div className="text-[#F5A623] font-extrabold text-sm">5%</div>
                <div className="text-[10px] text-white font-sans mt-0.5 font-semibold">Tier 3 Growth</div>
                <div className="text-[9px] text-[#8B949E] font-sans">Third Line</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#090C0F] border border-[#1E2533]">
                <div className="text-emerald-400 font-extrabold text-sm">15%</div>
                <div className="text-[10px] text-white font-sans mt-0.5 font-semibold">System Reserve</div>
                <div className="text-[9px] text-[#8B949E] font-sans">Liquidity Growth</div>
              </div>
            </div>
          </div>

          {/* Raydium AMM Pool Reference */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#8B949E]">
              <span>Raydium AMM Pool Address:</span>
              <a
                href={getExplorerUrl(VERIFIED_POOL_ADDRESS, 'address', 'mainnet-beta')}
                target="_blank"
                rel="noreferrer"
                className="text-[#F5A623] hover:underline flex items-center space-x-1"
              >
                <span>Explorer Pool</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#090C0F] border border-[#1E2533]">
              <span className="font-mono text-[11px] text-[#8B949E] break-all select-all">
                {VERIFIED_POOL_ADDRESS}
              </span>
              <button
                onClick={() => copyToClipboard(VERIFIED_POOL_ADDRESS, 'pool')}
                className="ml-2 px-2.5 py-1 rounded bg-[#171D27] hover:bg-[#1E2533] text-white text-[11px] flex items-center space-x-1 shrink-0 cursor-pointer"
              >
                {copiedPool ? (
                  <span className="text-emerald-400 font-bold">Copied</span>
                ) : (
                  <span>Copy</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#1E2533] bg-[#11161E] flex items-center justify-between text-xs text-[#8B949E]">
          <div className="flex items-center space-x-2">
            <SolanaLogo className="w-3.5 h-3.5" />
            <span>AIQX Decentralized Financial Protocol</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1E2533] hover:bg-[#2A3448] text-white font-semibold cursor-pointer transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
