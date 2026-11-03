import React, { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletProvider, useWalletNotice } from './context/WalletProvider';
import { Header, NavigationTab } from './components/Header';
import { RealCandlestickChart } from './components/RealCandlestickChart';
import { RealSwapTerminal } from './components/RealSwapTerminal';
import { JoinSection } from './components/JoinSection';
import { Dashboard } from './components/Dashboard';
import { SystemPoolSection } from './components/SystemPoolSection';
import { SolanaLogo } from './components/SolanaLogo';
import { TokenGuideModal } from './components/TokenGuideModal';
import {
  DEFAULT_CONFIG,
  AppConfig,
  fetchSolBalance,
  fetchTokenBalance,
  formatAddress,
  getExplorerUrl,
} from './lib/solana';
import {
  PoolMetrics,
  DEFAULT_POOL_METRICS,
  OFFICIAL_AIQX_MINT,
  VERIFIED_POOL_ADDRESS,
} from './lib/marketData';
import { UserRecord, EarningsRecord, SystemPoolBreakdown } from './lib/referral-engine';
import {
  AlertTriangle,
  Users,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';

function AppContent() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { notice, clearNotice } = useWalletNotice();

  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<NavigationTab>('terminal');
  const [isTokenGuideOpen, setIsTokenGuideOpen] = useState<boolean>(false);

  // Live GeckoTerminal Pool Metrics
  const [poolMetrics, setPoolMetrics] = useState<PoolMetrics>(DEFAULT_POOL_METRICS);

  // Platform Stats
  const [stats, setStats] = useState<{
    totalRegisteredUsers: number;
    totalAiqxDistributed: number;
    totalSupply: number;
    network: string;
    systemPool: SystemPoolBreakdown;
  } | null>(null);

  // User State
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserRecord | null>(null);
  const [earningsData, setEarningsData] = useState<{
    l1Earnings: number;
    l2Earnings: number;
    l3Earnings: number;
    totalEarnings: number;
    history: EarningsRecord[];
  }>({
    l1Earnings: 0,
    l2Earnings: 0,
    l3Earnings: 0,
    totalEarnings: 0,
    history: [],
  });
  const [referralsData, setReferralsData] = useState<{
    l1Count: number;
    l2Count: number;
    l3Count: number;
    totalNetworkCount: number;
    tree: {
      l1: UserRecord[];
      l2: UserRecord[];
      l3: UserRecord[];
    };
  }>({
    l1Count: 0,
    l2Count: 0,
    l3Count: 0,
    totalNetworkCount: 0,
    tree: { l1: [], l2: [], l3: [] },
  });

  const [aiqxBalance, setAiqxBalance] = useState<number>(0);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(false);
  const [referralParam, setReferralParam] = useState<string>('');

  // Extract ?ref= from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) setReferralParam(ref);
    }
  }, []);

  // Fetch Live Pool Data from GeckoTerminal endpoint
  const loadPoolMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/market/pool');
      const data = await res.json();
      if (data && data.success) {
        setPoolMetrics((prev) => ({
          ...prev,
          address: data.poolAddress || prev.address,
          name: data.name || prev.name,
          baseTokenPriceUsd: data.baseTokenPriceUsd || prev.baseTokenPriceUsd,
          baseTokenPriceSol: data.baseTokenPriceSol || prev.baseTokenPriceSol,
          solPriceUsd: data.solPriceUsd || prev.solPriceUsd,
          aiqxPerSol: data.aiqxPerSol || prev.aiqxPerSol,
          fdvUsd: data.fdvUsd || prev.fdvUsd,
          reserveUsd: data.reserveUsd || prev.reserveUsd,
          priceChange24h: data.priceChange24h ?? prev.priceChange24h,
          volume24hUsd: data.volume24hUsd || prev.volume24hUsd,
          updatedAt: Date.now(),
        }));
      }
    } catch (err) {
      console.warn('Failed to load pool metrics:', err);
    }
  }, []);

  // Fetch Public Config & Stats
  const loadPlatformData = useCallback(async () => {
    try {
      const [configRes, statsRes] = await Promise.all([
        fetch('/api/config').then((r) => r.json()).catch(() => DEFAULT_CONFIG),
        fetch('/api/stats').then((r) => r.json()).catch(() => null),
      ]);

      if (configRes) setConfig(configRes);
      if (statsRes && statsRes.success) setStats(statsRes.stats);
    } catch (err) {
      console.warn('Could not load config/stats:', err);
    }
  }, []);

  useEffect(() => {
    loadPlatformData();
    loadPoolMetrics();
    const interval = setInterval(loadPoolMetrics, 30000);
    return () => clearInterval(interval);
  }, [loadPlatformData, loadPoolMetrics]);

  // Fetch Balances & User Status
  const loadUserData = useCallback(async () => {
    if (!publicKey) {
      setIsRegistered(false);
      setUserData(null);
      setAiqxBalance(0);
      setSolBalance(0);
      return;
    }

    setIsLoadingUser(true);
    const walletAddress = publicKey.toBase58();

    try {
      const [solBal, tokenBal] = await Promise.all([
        fetchSolBalance(connection, walletAddress),
        fetchTokenBalance(connection, walletAddress, config.tokenMint, config.decimals),
      ]);
      setSolBalance(solBal);
      setAiqxBalance(tokenBal);

      const res = await fetch(`/api/user/${walletAddress}`);
      const data = await res.json();

      if (data && data.success && data.registered) {
        setIsRegistered(true);
        setUserData(data.user);
        if (data.earnings) setEarningsData(data.earnings);
        if (data.referrals) setReferralsData(data.referrals);
      } else {
        setIsRegistered(false);
        setUserData(null);
      }
    } catch (err) {
      console.warn('Error fetching user data:', err);
    } finally {
      setIsLoadingUser(false);
    }
  }, [publicKey, connection, config.tokenMint, config.decimals]);

  useEffect(() => {
    if (connected && publicKey) {
      loadUserData();
    }
  }, [connected, publicKey, loadUserData]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E11] text-[#E6EDF3]">
      {/* Header with live price, real Solana logo, and hamburger menu */}
      <Header
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRegistered={isRegistered}
        userWallet={userData?.wallet}
        baseTokenPriceUsd={poolMetrics.baseTokenPriceUsd}
        onOpenTokenGuide={() => setIsTokenGuideOpen(true)}
      />

      {/* Global Wallet Notice Banner if needed */}
      {notice && (
        <div className="bg-[#171D27] border-b border-[#F5A623]/30 px-4 py-2.5 text-xs text-[#E6EDF3] flex items-center justify-between">
          <div className="flex items-center space-x-2 max-w-4xl">
            <AlertTriangle className="w-4 h-4 text-[#F5A623] shrink-0" />
            <span className="leading-relaxed">{notice}</span>
          </div>
          <button
            onClick={clearNotice}
            className="ml-4 px-2.5 py-0.5 rounded bg-[#1E2533] hover:bg-[#2A3448] text-white font-mono cursor-pointer transition-colors text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* TAB 1: TRADING TERMINAL (COMPACT DUAL COLUMN) */}
        {activeTab === 'terminal' && (
          <div className="space-y-5">
            {/* 2-Column High-Density Trading Desk */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left Column: Real Candlestick Chart (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <RealCandlestickChart
                  poolMetrics={poolMetrics}
                  onRefreshPool={loadPoolMetrics}
                />
              </div>

              {/* Right Column: Real Swap Terminal & Referral Quick-Card (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <RealSwapTerminal
                  poolMetrics={poolMetrics}
                  solBalance={solBalance}
                  aiqxBalance={aiqxBalance}
                  onRefreshBalances={loadUserData}
                />

                {/* Compact Community Referral Card */}
                <div className="p-4 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-[#F5A623]" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Community Referral Program
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('referrals')}
                      className="text-[11px] font-mono text-[#F5A623] hover:underline cursor-pointer"
                    >
                      {isRegistered ? 'View Tree →' : 'Join Network →'}
                    </button>
                  </div>

                  <p className="text-[11px] text-[#8B949E] leading-relaxed">
                    Earn AIQX by growing the Solana community. Atomic distribution:
                    <strong className="text-white"> Level 1 (50%)</strong>,
                    <strong className="text-white"> Level 2 (30%)</strong>,
                    <strong className="text-white"> Level 3 (5%)</strong>,
                    <strong className="text-[#F5A623]"> System Pool (15%)</strong>.
                  </p>

                  {isRegistered && userData ? (
                    <div className="p-2.5 rounded-lg bg-[#0B0E11] border border-[#1E2533] flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400">Status: Registered</span>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}?ref=${userData.wallet}`;
                          navigator.clipboard.writeText(url);
                          alert('Referral link copied to clipboard!');
                        }}
                        className="px-2 py-1 rounded bg-[#171D27] hover:bg-[#232B3B] text-[#F5A623] text-[11px] cursor-pointer"
                      >
                        Copy My Ref Link
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveTab('referrals')}
                      className="w-full py-2 rounded-lg bg-[#171D27] hover:bg-[#1E2533] text-white border border-[#232B3B] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Activate Membership (100 AIQX)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: REFERRALS / JOIN SECTION */}
        {activeTab === 'referrals' && (
          <div className="space-y-6 max-w-4xl mx-auto py-2">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold text-white">AIQX 3-Level Referral System</h2>
              <p className="text-xs text-[#8B949E]">
                Automated on-chain marketing rewards. 100 AIQX activation distributed atomically.
              </p>
            </div>

            <JoinSection
              config={config}
              initialReferral={referralParam || config.genesisWallet}
              aiqxBalance={aiqxBalance}
              solBalance={solBalance}
              isRegistered={isRegistered}
              onJoinSuccess={() => {
                loadUserData();
                loadPlatformData();
                setActiveTab('dashboard');
              }}
              onRefreshBalances={loadUserData}
              onGoToDex={() => setActiveTab('terminal')}
              onGoToDashboard={() => setActiveTab('dashboard')}
            />
          </div>
        )}

        {/* TAB 3: SYSTEM POOL */}
        {activeTab === 'system-pool' && (
          <div className="max-w-4xl mx-auto py-2">
            <SystemPoolSection
              config={config}
              poolData={stats?.systemPool || null}
            />
          </div>
        )}

        {/* TAB 4: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="max-w-6xl mx-auto py-2">
            {!connected ? (
              <div className="max-w-md mx-auto p-8 rounded-xl bg-[#11161E] border border-[#1E2533] text-center space-y-4 shadow-xl">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#171D27] border border-[#232B3B] flex items-center justify-center text-[#F5A623]">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Connect Solana Wallet</h3>
                <p className="text-xs text-[#8B949E] leading-relaxed">
                  Connect your Phantom or Solana wallet to inspect your referrals, earnings history, and real-time network tree.
                </p>
                <div className="flex justify-center pt-2">
                  <WalletMultiButton className="!bg-[#F5A623] !text-[#0B0E11] !font-bold hover:!bg-[#e59917] !h-10 !px-5 !rounded-lg !text-xs !shadow-[0_4px_14px_rgba(245,166,35,0.25)]" />
                </div>
              </div>
            ) : isRegistered && userData ? (
              <Dashboard
                config={config}
                user={userData}
                earnings={earningsData}
                referrals={referralsData}
                aiqxBalance={aiqxBalance}
                solBalance={solBalance}
                onRefresh={() => {
                  loadUserData();
                  loadPlatformData();
                }}
                onGoToDex={() => setActiveTab('terminal')}
              />
            ) : (
              <div className="max-w-lg mx-auto p-6 rounded-xl bg-[#11161E] border border-[#1E2533] text-center space-y-4">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#171D27] text-[#F5A623] border border-[#232B3B]">
                  Unregistered Wallet
                </span>
                <h3 className="text-lg font-bold text-white">Not Registered Yet</h3>
                <p className="text-xs text-[#8B949E]">
                  Your connected wallet is not yet registered in the AIQX referral contract.
                  Join to unlock your personal referral link and marketing earnings.
                </p>
                <button
                  onClick={() => setActiveTab('referrals')}
                  className="px-4 py-2 rounded-lg bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] font-bold text-xs cursor-pointer shadow-md"
                >
                  Go to Join Activation
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Clean Minimalist Institutional Footer */}
      <footer className="border-t border-[#1E2533] bg-[#0B0E11] py-4 text-xs text-[#8B949E] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <SolanaLogo className="w-3.5 h-3.5" />
            <span className="font-bold text-white text-xs">AIQX Protocol</span>
            <span className="text-[#363E4D]">•</span>
            <span className="text-[11px] text-[#6E7681]">Solana Community DEX & Referral Network</span>
          </div>

          <button
            onClick={() => setIsTokenGuideOpen(true)}
            className="text-[11px] text-[#8B949E] hover:text-[#F5A623] transition-colors cursor-pointer flex items-center space-x-1 font-mono"
          >
            <span>View Token Specifications & Guide</span>
            <span>→</span>
          </button>
        </div>
      </footer>

      {/* Complete Token Guide & Specification Modal */}
      <TokenGuideModal
        isOpen={isTokenGuideOpen}
        onClose={() => setIsTokenGuideOpen(false)}
        config={config}
        tokenPriceUsd={poolMetrics.baseTokenPriceUsd}
      />
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}
