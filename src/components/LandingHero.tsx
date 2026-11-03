import React, { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  ShieldAlert,
  Coins,
  Share2,
  Users,
  Wallet,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Lock,
  ArrowDownUp,
  Zap,
} from 'lucide-react';
import {
  AppConfig,
  getExplorerUrl,
  formatAddress,
  RAYDIUM_SWAP_BUY_URL,
  DEXSCREENER_URL,
  GECKOTERMINAL_URL,
} from '../lib/solana';

interface LandingHeroProps {
  config: AppConfig;
  stats: {
    totalRegisteredUsers: number;
    totalAiqxDistributed: number;
    totalSupply: number;
    network: string;
  } | null;
  onExploreClick: () => void;
  onDashboardClick: () => void;
  onDexClick?: () => void;
}

export const LandingHero: FC<LandingHeroProps> = ({
  config,
  stats,
  onExploreClick,
  onDashboardClick,
  onDexClick,
}) => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();

  return (
    <div className="space-y-16 py-8 sm:py-12">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto px-4">
        {/* Official Coin Logo Emblem */}
        <div className="flex justify-center mb-6">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-tr from-[#F5A623] via-[#e59917] to-amber-600 shadow-[0_0_35px_rgba(245,166,35,0.4)] animate-in fade-in zoom-in duration-500">
            <img
              src="/aiqx-logo.png"
              alt="Official AIQX Token"
              className="w-full h-full rounded-full object-cover bg-black"
            />
            <div className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-[#11161E] border border-[#F5A623] text-[10px] font-mono font-bold text-[#F5A623]">
              SPL
            </div>
          </div>
        </div>

        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#11161E] border border-[#1E2533] text-xs font-mono text-[#F5A623] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#F5A623]" />
          <span>Solana SPL Token Adoption Protocol</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Grow AIQX Through <br />
          <span className="text-[#F5A623]">Community Adoption.</span>
        </h1>

        <p className="text-lg sm:text-xl text-[#8B949E] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          AIQX is a community-driven Solana ecosystem that rewards users who actively
          contribute to token adoption through community marketing.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {connected ? (
            <button
              onClick={onDashboardClick}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] font-bold text-base transition-all shadow-[0_4px_16px_rgba(245,166,35,0.25)] flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setVisible(true)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] font-bold text-base transition-all shadow-[0_4px_16px_rgba(245,166,35,0.25)] flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>Connect Wallet</span>
            </button>
          )}

          {onDexClick && (
            <button
              onClick={onDexClick}
              className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#171D27] hover:bg-[#1E2533] text-white border border-[#2D3648] hover:border-[#F5A623] font-semibold text-base transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <ArrowDownUp className="w-4 h-4 text-[#F5A623]" />
              <span>Buy / Sell AIQX</span>
            </button>
          )}

          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto px-8 py-3.5 rounded-lg bg-[#11161E] hover:bg-[#171D27] text-white border border-[#1E2533] font-semibold text-base transition-all cursor-pointer"
          >
            Explore AIQX
          </button>
        </div>
      </section>

      {/* Compact Institutional Statistics */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
          {/* Total Registered Users */}
          <div className="p-4 rounded-lg bg-[#0B0E11]/60 border border-[#1E2533]/60">
            <div className="text-xs text-[#8B949E] uppercase tracking-wider font-semibold mb-1">
              Total Registered Users
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {stats?.totalRegisteredUsers !== undefined
                ? stats.totalRegisteredUsers.toLocaleString()
                : '--'}
            </div>
          </div>

          {/* Total AIQX Distributed */}
          <div className="p-4 rounded-lg bg-[#0B0E11]/60 border border-[#1E2533]/60">
            <div className="text-xs text-[#8B949E] uppercase tracking-wider font-semibold mb-1">
              Total AIQX Distributed
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-[#F5A623]">
              {stats?.totalAiqxDistributed !== undefined
                ? `${stats.totalAiqxDistributed.toLocaleString()} AIQX`
                : '--'}
            </div>
          </div>

          {/* Total Supply */}
          <div className="p-4 rounded-lg bg-[#0B0E11]/60 border border-[#1E2533]/60">
            <div className="text-xs text-[#8B949E] uppercase tracking-wider font-semibold mb-1">
              Total Supply
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-mono text-white">
              {stats?.totalSupply !== undefined
                ? `${(stats.totalSupply).toLocaleString()} AIQX`
                : '4,500,000 AIQX'}
            </div>
          </div>

          {/* Solana Network */}
          <div className="p-4 rounded-lg bg-[#0B0E11]/60 border border-[#1E2533]/60">
            <div className="text-xs text-[#8B949E] uppercase tracking-wider font-semibold mb-1">
              Solana Network
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>{stats?.network || (config.network === 'mainnet-beta' ? 'Mainnet' : 'Devnet')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (4 Steps) */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 scroll-mt-24">
        <div className="mb-8 text-center sm:text-left">
          <div className="text-xs font-mono text-[#F5A623] uppercase tracking-wider mb-1">
            Participation Protocol
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533] flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-[#F5A623] mb-4">
                01 — STEP
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-sm text-[#8B949E] leading-relaxed">
                Connect Phantom, Solflare or Backpack to establish your decentralized identity.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#1E2533] flex items-center text-xs text-[#8B949E]">
              <Wallet className="w-4 h-4 mr-1.5 text-[#F5A623]" />
              <span>Non-custodial connection</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533] flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-[#F5A623] mb-4">
                02 — STEP
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Join the Network</h3>
              <p className="text-sm text-[#8B949E] leading-relaxed">
                Register using 100 AIQX and a valid referral wallet via an atomic on-chain transaction.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#1E2533] flex items-center text-xs text-[#8B949E]">
              <Coins className="w-4 h-4 mr-1.5 text-[#F5A623]" />
              <span>100 AIQX registration fee</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533] flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-[#F5A623] mb-4">
                03 — STEP
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Promote AIQX</h3>
              <p className="text-sm text-[#8B949E] leading-relaxed">
                Share your personal referral link and introduce new participants to expand adoption.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#1E2533] flex items-center text-xs text-[#8B949E]">
              <Share2 className="w-4 h-4 mr-1.5 text-[#F5A623]" />
              <span>3-Level viral hierarchy</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533] flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-[#F5A623] mb-4">
                04 — STEP
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Earn Marketing Rewards</h3>
              <p className="text-sm text-[#8B949E] leading-relaxed">
                Receive AIQX directly into your Solana wallet when eligible referrals join.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#1E2533] flex items-center text-xs text-[#8B949E]">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
              <span>Instant on-chain settlement</span>
            </div>
          </div>
        </div>
      </section>

      {/* Prominent Business Explanation */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="p-6 sm:p-8 rounded-xl bg-[#11161E] border border-[#1E2533] relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center space-x-2 text-xs font-mono text-[#F5A623]">
                <ShieldAlert className="w-4 h-4" />
                <span className="uppercase tracking-wider font-semibold">Important Business Explanation</span>
              </div>
              <p className="text-sm sm:text-base text-[#E6EDF3] leading-relaxed">
                &ldquo;The AIQX ecosystem operates through community marketing and token adoption.
                Users who actively promote AIQX and bring new participants to the platform can receive
                AIQX marketing rewards according to the published three-level distribution structure.
                Rewards depend on actual network participation. No fixed income or guaranteed returns
                are promised.&rdquo;
              </p>
            </div>
            <div className="shrink-0 p-4 rounded-lg bg-[#0B0E11] border border-[#1E2533] text-center w-full md:w-auto">
              <div className="text-xs text-[#8B949E] uppercase font-semibold">Distribution Model</div>
              <div className="text-lg font-mono font-bold text-[#F5A623] mt-1">50% / 30% / 5% / 15%</div>
              <div className="text-[11px] text-[#8B949E] mt-0.5">L1 / L2 / L3 / System</div>
            </div>
          </div>
        </div>
      </section>

      {/* Token Specifications */}
      <section id="token" className="max-w-6xl mx-auto px-4 scroll-mt-24">
        <div className="mb-6">
          <div className="text-xs font-mono text-[#F5A623] uppercase tracking-wider mb-1">
            Verified On-Chain Parameters
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            AIQX Token Configuration
          </h2>
        </div>

        <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-3.5 rounded-lg bg-[#0B0E11]/70 border border-[#1E2533]">
              <div className="text-xs text-[#8B949E]">Token Name</div>
              <div className="text-base font-bold text-white mt-1">AIQX</div>
            </div>
            <div className="p-3.5 rounded-lg bg-[#0B0E11]/70 border border-[#1E2533]">
              <div className="text-xs text-[#8B949E]">Symbol</div>
              <div className="text-base font-bold text-[#F5A623] mt-1">AIQX</div>
            </div>
            <div className="p-3.5 rounded-lg bg-[#0B0E11]/70 border border-[#1E2533]">
              <div className="text-xs text-[#8B949E]">Network</div>
              <div className="text-base font-bold text-white mt-1">
                Solana Mainnet
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-[#0B0E11]/70 border border-[#1E2533]">
              <div className="text-xs text-[#8B949E]">Token Standard</div>
              <div className="text-base font-bold text-white mt-1 font-mono">SPL Token</div>
            </div>
            <div className="p-3.5 rounded-lg bg-[#0B0E11]/70 border border-[#1E2533]">
              <div className="text-xs text-[#8B949E]">Decimals</div>
              <div className="text-base font-bold text-white mt-1 font-mono">{config.decimals}</div>
            </div>
            <div className="p-3.5 rounded-lg bg-[#0B0E11]/70 border border-[#1E2533]">
              <div className="text-xs text-[#8B949E]">Total Supply</div>
              <div className="text-base font-bold text-white mt-1 font-mono">
                {config.totalTokenSupply.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Mint Address Row & Direct DEX Links */}
          <div className="mt-5 pt-4 border-t border-[#1E2533] flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-[#8B949E]">
              <span className="font-semibold text-white">Contract / Mint Address:</span>
              <span className="font-mono text-[#E6EDF3] bg-[#0B0E11] px-2.5 py-1 rounded border border-[#1E2533] select-all">
                {config.tokenMint}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href={RAYDIUM_SWAP_BUY_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-[#F5A623] hover:underline font-mono"
              >
                <span>Raydium Swap</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-[#2D3648]">•</span>
              <a
                href={DEXSCREENER_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-[#F5A623] hover:underline font-mono"
              >
                <span>DexScreener</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-[#2D3648]">•</span>
              <a
                href={getExplorerUrl(config.tokenMint, 'address', 'mainnet-beta')}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-white hover:text-[#F5A623] font-mono"
              >
                <span>Solana Explorer</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
