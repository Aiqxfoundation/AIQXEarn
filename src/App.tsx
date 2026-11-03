import React, { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletProvider, useWalletNotice } from './context/WalletProvider';
import { Header, NavigationTab } from './components/Header';
import { ForsageSidebar } from './components/ForsageSidebar';
import { ForsageDashboard } from './components/ForsageDashboard';
import { DocsSection } from './components/DocsSection';
import { RealCandlestickChart } from './components/RealCandlestickChart';
import { RealSwapTerminal } from './components/RealSwapTerminal';
import { JoinSection } from './components/JoinSection';
import { SystemPoolSection } from './components/SystemPoolSection';
import { SolanaLogo } from './components/SolanaLogo';
import { TokenGuideModal } from './components/TokenGuideModal';

// AIQX Foundation Matrix Program Components
import { FoundationOverview } from './components/matrix/FoundationOverview';
import { MatrixXSection } from './components/matrix/MatrixXSection';
import { MyNetworkSection } from './components/matrix/MyNetworkSection';
import { MySlotsSection } from './components/matrix/MySlotsSection';
import { CrossoverSection } from './components/matrix/CrossoverSection';
import { EarningsSection } from './components/matrix/EarningsSection';
import { ContributeSection } from './components/matrix/ContributeSection';
import { TransactionsSection } from './components/matrix/TransactionsSection';

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
  Sparkles,
} from 'lucide-react';

function AppContent() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { notice, clearNotice } = useWalletNotice();

  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
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

  // Connected User State
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserRecord | null>(null);
  const [earningsData, setEarningsData] = useState<{
    l1Earnings: number;
    l2Earnings: number;
    l3Earnings: number;
    crossoverEarnings?: number;
    contributionEarnings?: number;
    totalEarnings: number;
    history: EarningsRecord[];
  }>({
    l1Earnings: 0,
    l2Earnings: 0,
    l3Earnings: 0,
    crossoverEarnings: 0,
    contributionEarnings: 0,
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

  // Forsage Preview ID State
  const [previewIdInput, setPreviewIdInput] = useState<string>('1');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [previewUserData, setPreviewUserData] = useState<UserRecord | null>(null);
  const [previewEarningsData, setPreviewEarningsData] = useState<any>(null);
  const [previewReferralsData, setPreviewReferralsData] = useState<any>(null);

  const [aiqxBalance, setAiqxBalance] = useState<number>(0);
  const [solBalance, setSolBalance] = useState<number>(0);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(false);
  const [referralParam, setReferralParam] = useState<string>('');
  const [copiedHeroRef, setCopiedHeroRef] = useState<boolean>(false);

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

  // Load Preview Data for a given ID or wallet
  const loadPreviewMember = useCallback(async (idOrWallet: string | number) => {
    try {
      const res = await fetch(`/api/user/${idOrWallet}`);
      const data = await res.json();
      if (data && data.success && data.user) {
        setPreviewUserData(data.user);
        if (data.earnings) setPreviewEarningsData(data.earnings);
        if (data.referrals) setPreviewReferralsData(data.referrals);
        setIsPreviewMode(true);
        setActiveTab('dashboard');
      } else {
        // If not found, try fallback to ID 1
        const fallbackRes = await fetch(`/api/user/1`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData && fallbackData.success && fallbackData.user) {
          setPreviewUserData(fallbackData.user);
          if (fallbackData.earnings) setPreviewEarningsData(fallbackData.earnings);
          if (fallbackData.referrals) setPreviewReferralsData(fallbackData.referrals);
          setIsPreviewMode(true);
          setActiveTab('dashboard');
        }
      }
    } catch (e) {
      console.warn('Failed to load preview user:', e);
    }
  }, []);

  // Default seed preview of ID 1 on load
  useEffect(() => {
    loadPlatformData();
    loadPoolMetrics();
    loadPreviewMember('1');
    const interval = setInterval(loadPoolMetrics, 30000);
    return () => clearInterval(interval);
  }, [loadPlatformData, loadPoolMetrics, loadPreviewMember]);

  // Fetch Balances & User Status for connected wallet
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
        // If wallet is connected, exit preview by default unless requested
        setIsPreviewMode(false);
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

  // Handle preview search submission
  const handlePreviewSubmit = (idOrWallet: string) => {
    loadPreviewMember(idOrWallet);
  };

  const handleClearPreview = () => {
    setIsPreviewMode(false);
    if (userData) {
      setPreviewUserData(null);
    } else {
      // If no wallet connected, preview root ID 1
      loadPreviewMember('1');
    }
  };

  // Determine active display user (either preview or connected user)
  const displayUser = isPreviewMode ? previewUserData : (userData || previewUserData);
  const displayEarnings = isPreviewMode
    ? (previewEarningsData || earningsData)
    : (userData ? earningsData : (previewEarningsData || earningsData));
  const displayReferrals = isPreviewMode
    ? (previewReferralsData || referralsData)
    : (userData ? referralsData : (previewReferralsData || referralsData));

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-[#E6EDF3]">
      {/* Forsage-style Top Banner */}
      <Header
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRegistered={isRegistered}
        userWallet={userData?.wallet}
        userId={userData?.id}
        baseTokenPriceUsd={poolMetrics.baseTokenPriceUsd}
        onOpenTokenGuide={() => setIsTokenGuideOpen(true)}
        previewIdInput={previewIdInput}
        setPreviewIdInput={setPreviewIdInput}
        onPreviewSubmit={handlePreviewSubmit}
        isPreviewMode={isPreviewMode}
        onClearPreview={handleClearPreview}
      />

      {/* Global Notice Banner if needed */}
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

      {/* Main Viewport Container with Left Sidebar */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex gap-6">
        {/* Left Sidebar (Desktop) */}
        <ForsageSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenTokenGuide={() => setIsTokenGuideOpen(true)}
          isRegistered={isRegistered}
        />

        {/* Center / Right Operational Viewport */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: FORSAGE DASHBOARD */}
          {activeTab === 'dashboard' && displayUser && (
            <ForsageDashboard
              config={config}
              user={displayUser}
              earnings={displayEarnings}
              referrals={displayReferrals}
              aiqxBalance={aiqxBalance}
              solBalance={solBalance}
              isPreviewMode={isPreviewMode}
              onExitPreview={handleClearPreview}
              onPreviewMemberId={(id) => {
                setPreviewIdInput(String(id));
                loadPreviewMember(String(id));
              }}
              onNavigateToMatrix={() => setActiveTab('matrix-x')}
              onNavigateToPartners={() => setActiveTab('my-network')}
              onNavigateToDocs={() => setActiveTab('docs')}
              onNavigateToContribute={() => setActiveTab('contribute')}
              onNavigateToJoin={() => setActiveTab('referrals')}
              onInspectSlotLevel={(lvl) => {
                setActiveTab('matrix-x');
              }}
            />
          )}

          {/* TAB 2: MATRIX X (14-LEVEL FORSAGE SLOTS) */}
          {activeTab === 'matrix-x' && (
            <MatrixXSection
              config={config}
              userActiveLevels={displayUser?.activeLevels || [1]}
              aiqxBalance={aiqxBalance}
              userWallet={displayUser?.wallet}
              onUpgradeSuccess={() => {
                loadUserData();
                loadPlatformData();
              }}
              onNavigateToJoin={() => setActiveTab('referrals')}
            />
          )}

          {/* TAB 3: TRADING TERMINAL & SWAP */}
          {activeTab === 'terminal' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 space-y-4">
                  <RealCandlestickChart
                    poolMetrics={poolMetrics}
                    onRefreshPool={loadPoolMetrics}
                  />
                </div>
                <div className="lg:col-span-5 space-y-4">
                  <RealSwapTerminal
                    poolMetrics={poolMetrics}
                    solBalance={solBalance}
                    aiqxBalance={aiqxBalance}
                    onRefreshBalances={loadUserData}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PARTNERS & NETWORK TREE */}
          {activeTab === 'my-network' && (
            <MyNetworkSection
              config={config}
              user={displayUser}
              referrals={displayReferrals}
              onNavigateToReferrals={() => setActiveTab('referrals')}
            />
          )}

          {/* TAB 5: MY SLOTS */}
          {activeTab === 'my-slots' && (
            <MySlotsSection
              config={config}
              user={displayUser}
              aiqxBalance={aiqxBalance}
              onNavigateToMatrix={() => setActiveTab('matrix-x')}
            />
          )}

          {/* TAB 6: DEDICATED INFORMATION & DOCS */}
          {(activeTab === 'docs' || activeTab === 'foundation') && (
            <DocsSection
              config={config}
              onNavigateToMatrix={() => setActiveTab('matrix-x')}
              onNavigateToJoin={() => setActiveTab('referrals')}
              onNavigateToContribute={() => setActiveTab('contribute')}
            />
          )}

          {/* TAB 7: STATS & TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <TransactionsSection
              config={config}
              earningsHistory={displayEarnings.history}
              userWallet={displayUser?.wallet}
            />
          )}

          {/* TAB 8: CONTRIBUTE TO EARN */}
          {activeTab === 'contribute' && (
            <ContributeSection
              config={config}
              user={displayUser}
            />
          )}

          {/* TAB 9: PROTOCOL SYSTEM POOL */}
          {activeTab === 'system-pool' && (
            <div className="max-w-4xl mx-auto py-2">
              <SystemPoolSection
                config={config}
                poolData={stats?.systemPool || null}
              />
            </div>
          )}

          {/* TAB 10: JOIN / ONBOARDING ACTIVATION */}
          {activeTab === 'referrals' && (
            <div className="space-y-6 max-w-4xl mx-auto py-2">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-black text-white">AIQX Matrix X Activation</h2>
                <p className="text-xs text-[#8B949E]">
                  100 AIQX Initial Activation with permanent sequential ID and automated 3-tier distribution.
                </p>
              </div>

              <JoinSection
                config={config}
                initialReferral={referralParam || '1'}
                aiqxBalance={aiqxBalance}
                solBalance={solBalance}
                isRegistered={isRegistered}
                onJoinSuccess={() => {
                  loadUserData();
                  loadPlatformData();
                  setActiveTab('matrix-x');
                }}
                onRefreshBalances={loadUserData}
                onGoToDex={() => setActiveTab('terminal')}
                onGoToDashboard={() => setActiveTab('dashboard')}
              />
            </div>
          )}

          {/* TAB 11: CROSSOVER */}
          {activeTab === 'crossover' && (
            <CrossoverSection
              config={config}
              user={displayUser}
              onNavigateToMatrix={() => setActiveTab('matrix-x')}
            />
          )}

          {/* TAB 12: EARNINGS */}
          {activeTab === 'earnings' && (
            <EarningsSection
              config={config}
              user={displayUser}
              earnings={displayEarnings}
              aiqxPriceUsd={poolMetrics.baseTokenPriceUsd}
            />
          )}
        </main>
      </div>

      {/* Minimalist Footer */}
      <footer className="border-t border-[#1E2533] bg-[#0B0E14] py-4 text-xs text-[#8B949E] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <SolanaLogo className="w-3.5 h-3.5" />
            <span className="font-bold text-white text-xs">AIQX Foundation Matrix</span>
            <span className="text-[#363E4D]">•</span>
            <span className="text-[11px] text-[#6E7681]">14-Level Doubling Slot Matrix on Solana</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('docs')}
              className="text-[11px] text-[#8B949E] hover:text-blue-400 transition-colors cursor-pointer font-mono"
            >
              Docs &amp; Audits
            </button>
            <button
              onClick={() => setIsTokenGuideOpen(true)}
              className="text-[11px] text-[#8B949E] hover:text-blue-400 transition-colors cursor-pointer flex items-center space-x-1 font-mono"
            >
              <span>Token Guide</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Token Guide Modal */}
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
