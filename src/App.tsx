import React, { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletProvider } from './context/WalletProvider';
import { Header } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { JoinSection } from './components/JoinSection';
import { Dashboard } from './components/Dashboard';
import { SystemPoolSection } from './components/SystemPoolSection';
import {
  DEFAULT_CONFIG,
  AppConfig,
  fetchSolBalance,
  fetchTokenBalance,
} from './lib/solana';
import { UserRecord, EarningsRecord, SystemPoolBreakdown } from './lib/referral-engine';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();

  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'overview' | 'how-it-works' | 'token' | 'system-pool' | 'dashboard'>('overview');
  
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

  // Referral URL query param
  const [referralParam, setReferralParam] = useState<string>('');

  // Extract ?ref= from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setReferralParam(ref);
      }
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
  }, [loadPlatformData]);

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
      // 1. Fetch on-chain balances
      const [solBal, tokenBal] = await Promise.all([
        fetchSolBalance(connection, walletAddress),
        fetchTokenBalance(connection, walletAddress, config.tokenMint, config.decimals),
      ]);
      setSolBalance(solBal);
      setAiqxBalance(tokenBal);

      // 2. Fetch User registration & earnings status from backend
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

  // Switch view on wallet connection
  useEffect(() => {
    if (connected && publicKey) {
      setActiveTab('dashboard');
    }
  }, [connected, publicKey]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0E11] text-[#E6EDF3]">
      {/* Header */}
      <Header
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRegistered={isRegistered}
      />

      {/* Main Body */}
      <main className="flex-1 pb-16">
        {activeTab === 'overview' && (
          <LandingHero
            config={config}
            stats={stats}
            onExploreClick={() => {
              const el = document.getElementById('token');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onDashboardClick={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'how-it-works' && (
          <LandingHero
            config={config}
            stats={stats}
            onExploreClick={() => {
              const el = document.getElementById('token');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onDashboardClick={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'token' && (
          <LandingHero
            config={config}
            stats={stats}
            onExploreClick={() => {
              const el = document.getElementById('token');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            onDashboardClick={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'system-pool' && (
          <SystemPoolSection
            config={config}
            poolData={stats?.systemPool || null}
          />
        )}

        {activeTab === 'dashboard' && (
          <div className="py-8">
            {!connected ? (
              <div className="max-w-xl mx-auto p-8 rounded-xl bg-[#11161E] border border-[#1E2533] text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#171D27] flex items-center justify-center mx-auto text-[#F5A623]">
                  AQ
                </div>
                <h2 className="text-xl font-bold text-white">Wallet Connection Required</h2>
                <p className="text-xs text-[#8B949E] leading-relaxed">
                  Connect your Solana wallet (Phantom, Solflare, or Backpack) to access your personalized referral dashboard or register.
                </p>
              </div>
            ) : isLoadingUser ? (
              <div className="flex flex-col items-center justify-center p-16 space-y-3">
                <Loader2 className="w-8 h-8 text-[#F5A623] animate-spin" />
                <span className="text-xs font-mono text-[#8B949E]">Loading On-Chain Account State...</span>
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
              />
            ) : (
              <div className="space-y-6">
                <div className="max-w-3xl mx-auto px-4 text-center">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#11161E] border border-[#1E2533] text-xs font-mono text-[#F5A623] mb-3">
                    <span>Unregistered Account</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white">Activate Your AIQX Membership</h1>
                  <p className="text-xs text-[#8B949E] mt-1">
                    Sign the atomic 100 AIQX distribution transaction to register and unlock referral rewards.
                  </p>
                </div>

                <JoinSection
                  config={config}
                  initialReferral={referralParam || config.genesisWallet}
                  aiqxBalance={aiqxBalance}
                  solBalance={solBalance}
                  onJoinSuccess={() => {
                    loadUserData();
                    loadPlatformData();
                  }}
                  onRefreshBalances={loadUserData}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E2533] bg-[#0B0E11] py-8 text-xs text-[#8B949E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <span className="font-extrabold text-white">AIQX PROTOCOL</span>
            <span>•</span>
            <span>Solana SPL Community Marketing</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Decimals: {config.decimals}</span>
            <span>•</span>
            <span>Total Supply: {config.totalTokenSupply.toLocaleString()} AIQX</span>
          </div>
        </div>
      </footer>
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
