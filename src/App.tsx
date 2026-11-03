import React, { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletProvider, useWalletNotice } from './context/WalletProvider';
import { Header, NavigationTab } from './components/Header';
import { AiqxSidebar } from './components/AiqxSidebar';
import { AiqxDashboard } from './components/AiqxDashboard';
import { DocsSection } from './components/DocsSection';
import { RealCandlestickChart } from './components/RealCandlestickChart';
import { RealSwapTerminal } from './components/RealSwapTerminal';
import { JoinSection } from './components/JoinSection';
import { SolanaLogo } from './components/SolanaLogo';
import { TokenGuideModal } from './components/TokenGuideModal';
import { TotalTeamPicture } from './components/matrix/TotalTeamPicture';
import { SlotTreeView } from './components/matrix/SlotTreeView';

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
  const [selectedSlotLevel, setSelectedSlotLevel] = useState<number>(1);
  const [isActivatingSlot, setIsActivatingSlot] = useState<boolean>(false);
  const [isTokenGuideOpen, setIsTokenGuideOpen] = useState<boolean>(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);

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
    uplineRecycleEarnings?: number;
    downlineRewardEarnings?: number;
    history: EarningsRecord[];
  }>({
    l1Earnings: 0,
    l2Earnings: 0,
    l3Earnings: 0,
    crossoverEarnings: 0,
    uplineRecycleEarnings: 0,
    downlineRewardEarnings: 0,
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

  // Member Preview ID State
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

  const handleActivateSlot = async (slotConfig: any) => {
    try {
      setIsActivatingSlot(true);
      const target = displayUser?.wallet || String(displayUser?.id || 1);
      const res = await fetch('/api/matrix/upgrade-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: target,
          level: slotConfig.level,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await loadUserData();
        await loadPlatformData();
        if (displayUser?.id) {
          await loadPreviewMember(String(displayUser.id));
        }
      }
    } catch (err) {
      console.warn('Error upgrading slot:', err);
    } finally {
      setIsActivatingSlot(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E14] text-[#E6EDF3]">
      {/* AIQX Matrix Top Bar */}
      <Header
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRegistered={isRegistered}
        userWallet={userData?.wallet}
        userId={userData?.id}
        baseTokenPriceUsd={poolMetrics.baseTokenPriceUsd}
        aiqxBalance={aiqxBalance}
        solBalance={solBalance}
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
        <AiqxSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenTokenGuide={() => setIsTokenGuideOpen(true)}
          isRegistered={isRegistered}
        />

        {/* Center / Right Operational Viewport */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: UNIFIED AIQX MATRIX DASHBOARD */}
          {activeTab === 'dashboard' && displayUser && (
            <AiqxDashboard
              config={config}
              user={displayUser}
              earnings={displayEarnings}
              referrals={displayReferrals}
              aiqxBalance={aiqxBalance}
              solBalance={solBalance}
              baseTokenPriceUsd={poolMetrics.baseTokenPriceUsd}
              isPreviewMode={isPreviewMode}
              onExitPreview={handleClearPreview}
              onPreviewMemberId={(id) => {
                setPreviewIdInput(String(id));
                loadPreviewMember(String(id));
              }}
              onNavigateToDocs={() => setActiveTab('docs')}
              onNavigateToTeamPicture={() => setActiveTab('team-picture')}
              onNavigateToJoin={() => setIsJoinModalOpen(true)}
              onInspectSlotLevel={(level) => {
                setSelectedSlotLevel(level);
                setActiveTab('slot-tree');
              }}
              onRefreshData={() => {
                loadUserData();
                loadPlatformData();
              }}
            />
          )}

          {/* TAB: DEDICATED SEPARATE SLOT TREE VIEW (STRUCTURED LIKE DASHBOARD) */}
          {activeTab === 'slot-tree' && displayUser && (
            <SlotTreeView
              config={config}
              user={displayUser}
              slotLevel={selectedSlotLevel}
              onSelectSlotLevel={(lvl) => setSelectedSlotLevel(lvl)}
              onBackToDashboard={() => setActiveTab('dashboard')}
              onActivateSlot={handleActivateSlot}
              onPreviewMemberId={(id) => {
                setPreviewIdInput(String(id));
                loadPreviewMember(String(id));
              }}
              isActivating={isActivatingSlot}
              baseTokenPriceUsd={poolMetrics.baseTokenPriceUsd}
              totalEarnings={displayEarnings.totalEarnings}
            />
          )}

          {/* TAB: FULL PICTURE OF TOTAL TEAM */}
          {activeTab === 'team-picture' && (
            <TotalTeamPicture
              config={config}
              currentUser={displayUser}
              referrals={displayReferrals}
              onPreviewMemberId={(id) => loadPreviewMember(id)}
              onNavigateToSlots={() => setActiveTab('dashboard')}
            />
          )}

          {/* TAB 2: TRADING TERMINAL & SWAP */}
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

          {/* TAB 3: DEDICATED INFORMATION & DOCS */}
          {activeTab === 'docs' && (
            <DocsSection
              config={config}
              onNavigateToMatrix={() => setActiveTab('dashboard')}
              onNavigateToJoin={() => setIsJoinModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modal Join / Onboarding (Keeps everything on single dashboard) */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#0D1117] border border-[#1E2533] rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2533]">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="text-lg font-black text-white">Join AIQX Matrix X</h3>
              </div>
              <button
                onClick={() => setIsJoinModalOpen(false)}
                className="p-1.5 rounded-xl bg-[#171D27] hover:bg-[#202735] text-[#8B949E] hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="pt-4">
              <JoinSection
                config={config}
                initialReferral={referralParam || String(displayUser?.id || 1)}
                aiqxBalance={aiqxBalance}
                solBalance={solBalance}
                isRegistered={isRegistered}
                onJoinSuccess={() => {
                  loadUserData();
                  loadPlatformData();
                  setIsJoinModalOpen(false);
                }}
                onRefreshBalances={loadUserData}
                onGoToDex={() => {
                  setIsJoinModalOpen(false);
                  setActiveTab('terminal');
                }}
                onGoToDashboard={() => {
                  setIsJoinModalOpen(false);
                  setActiveTab('dashboard');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Clean Footer */}
      <footer className="border-t border-[#1E2533] bg-[#0B0E14] py-4 text-xs text-[#8B949E] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <SolanaLogo className="w-3.5 h-3.5" />
            <span className="font-bold text-white text-xs">AIQX Matrix</span>
            <span className="text-[#363E4D]">•</span>
            <span className="text-[11px] text-[#6E7681]">Solana</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('docs')}
              className="text-[11px] text-[#8B949E] hover:text-blue-400 transition-colors cursor-pointer font-mono"
            >
              Docs
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className="text-[11px] text-[#8B949E] hover:text-blue-400 transition-colors cursor-pointer font-mono"
            >
              DEX
            </button>
            <a
              href="https://explorer.solana.com/address/AiqxkvBcvugexLRRxFXBYxT5ekcrSb9noosq3VqBTRFD"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[#8B949E] hover:text-blue-400 transition-colors cursor-pointer font-mono"
            >
              Explorer
            </a>
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
