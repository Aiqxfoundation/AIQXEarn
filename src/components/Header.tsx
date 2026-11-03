import React, { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Activity,
  ArrowDownUp,
  Users,
  Database,
  BookOpen,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { AppConfig, formatAddress, getExplorerUrl } from '../lib/solana';
import { SolanaLogo } from './SolanaLogo';
import { OFFICIAL_AIQX_MINT } from '../lib/marketData';

export type NavigationTab = 'terminal' | 'referrals' | 'system-pool' | 'dashboard';

interface HeaderProps {
  config: AppConfig;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isRegistered: boolean;
  userWallet?: string;
  baseTokenPriceUsd?: number;
  onOpenTokenGuide?: () => void;
}

export const Header: FC<HeaderProps> = ({
  config,
  activeTab,
  setActiveTab,
  isRegistered,
  userWallet,
  baseTokenPriceUsd = 0.0002613,
  onOpenTokenGuide,
}) => {
  const { publicKey } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [copiedMint, setCopiedMint] = useState<boolean>(false);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scrolling when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const handleNavClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  const handleTokenGuideClick = () => {
    setIsMenuOpen(false);
    onOpenTokenGuide?.();
  };

  const handleCopyRefLink = async () => {
    if (!userWallet) return;
    try {
      const url = `${window.location.origin}?ref=${userWallet}`;
      await navigator.clipboard.writeText(url);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleCopyMint = async () => {
    try {
      await navigator.clipboard.writeText(OFFICIAL_AIQX_MINT);
      setCopiedMint(true);
      setTimeout(() => setCopiedMint(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const navItems = [
    {
      id: 'terminal' as NavigationTab,
      label: 'DEX Terminal',
      description: 'Live Candlestick Chart & Instant Raydium Swap',
      icon: ArrowDownUp,
      badge: 'Live',
    },
    {
      id: 'referrals' as NavigationTab,
      label: 'Community Referrals',
      description: '3-Level Atomic Distribution & 100 AIQX Join',
      icon: Users,
      badge: '50% / 30% / 5%',
    },
    {
      id: 'dashboard' as NavigationTab,
      label: 'Portfolio Dashboard',
      description: 'On-Chain Earnings, Member Tree & Balances',
      icon: Activity,
      badge: isRegistered ? 'Active' : undefined,
    },
    {
      id: 'system-pool' as NavigationTab,
      label: 'Protocol Pool',
      description: '15% System Reserve & Ecosystem Treasury',
      icon: Database,
      badge: 'Treasury',
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#1E2533] bg-[#0B0E11]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo & Live Ticker */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleNavClick('terminal')}
              className="flex items-center space-x-3 text-left focus:outline-none group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-[#F5A623] to-[#e59917] shadow-[0_0_14px_rgba(245,166,35,0.3)] group-hover:scale-105 transition-transform flex items-center justify-center">
                <img
                  src="/aiqx-logo.png"
                  alt="AIQX Official Emblem"
                  className="w-full h-full rounded-full object-cover bg-black"
                />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-[#F5A623] transition-colors">
                    AIQX
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#171D27] text-[#F5A623] border border-[#232B3B]">
                    DEX
                  </span>
                </div>
              </div>
            </button>

            {/* Network indicator with authentic Solana Logo */}
            <div className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#11161E] border border-[#1E2533] text-xs">
              <SolanaLogo className="w-3.5 h-3.5" />
              <span className="text-white font-mono font-semibold text-[11px]">Solana</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Live Price Tag */}
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#11161E] border border-[#1E2533] text-xs font-mono">
              <span className="text-[#8B949E]">1 AIQX:</span>
              <span className="text-emerald-400 font-bold">${baseTokenPriceUsd.toFixed(6)}</span>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Compact) */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => handleNavClick('terminal')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'terminal'
                  ? 'text-[#F5A623] bg-[#171D27]'
                  : 'text-[#8B949E] hover:text-white hover:bg-[#11161E]'
              }`}
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span>Terminal</span>
            </button>

            <button
              onClick={() => handleNavClick('referrals')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'referrals'
                  ? 'text-[#F5A623] bg-[#171D27]'
                  : 'text-[#8B949E] hover:text-white hover:bg-[#11161E]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Referrals</span>
            </button>

            <button
              onClick={() => handleNavClick('system-pool')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors items-center space-x-1.5 cursor-pointer ${
                activeTab === 'system-pool'
                  ? 'text-[#F5A623] bg-[#171D27]'
                  : 'text-[#8B949E] hover:text-white hover:bg-[#11161E]'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Pool</span>
            </button>

            {publicKey && (
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'text-[#F5A623] bg-[#171D27]'
                    : 'text-[#8B949E] hover:text-white hover:bg-[#11161E]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Dashboard</span>
                {isRegistered && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </button>
            )}
          </nav>

          {/* Action Controls, Wallet Button, & Top Hamburger Menu */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Token Guide quick button */}
            <button
              onClick={onOpenTokenGuide}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-[#141A23] hover:bg-[#1C2432] border border-[#232B3B] text-white hover:text-[#F5A623] text-xs font-semibold cursor-pointer transition-all shadow-sm group"
              title="AIQX Token Specs & Official Contract Guide"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#F5A623] group-hover:scale-110 transition-transform" />
              <span>Token Guide</span>
            </button>

            {/* Wallet Connect */}
            <WalletMultiButton className="!bg-[#F5A623] !text-[#0B0E11] !font-bold hover:!bg-[#e59917] !h-9 !px-3.5 !rounded-lg !text-xs !shadow-[0_2px_8px_rgba(245,166,35,0.2)]" />

            {/* Top Hamburger Menu Button (Requested Feature) */}
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 rounded-lg bg-[#141A23] hover:bg-[#1C2432] border border-[#232B3B] text-[#8B949E] hover:text-[#F5A623] transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-[#F5A623]"
              title="Toggle Pages Navigation Menu"
              aria-label="Toggle Pages Navigation Menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-[#F5A623]" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hamburger Menu Overlay Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative w-full max-w-sm sm:max-w-md bg-[#0D1117] border-l border-[#1E2533] shadow-2xl flex flex-col h-full z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-[#1E2533] flex items-center justify-between bg-[#11161E]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-tr from-[#F5A623] to-[#e59917] flex items-center justify-center">
                  <img
                    src="/aiqx-logo.png"
                    alt="AIQX Emblem"
                    className="w-full h-full rounded-full object-cover bg-black"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">AIQX PROTOCOL</h3>
                  <p className="text-[11px] text-[#8B949E] font-mono">Navigation & Ecosystem Menu</p>
                </div>
              </div>

              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg text-[#8B949E] hover:text-white hover:bg-[#171D27] cursor-pointer transition-colors"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price & Network Quick Glance */}
            <div className="p-4 bg-[#0B0E11] border-b border-[#1E2533] flex items-center justify-between text-xs font-mono">
              <div className="flex items-center space-x-2">
                <SolanaLogo className="w-3.5 h-3.5" />
                <span className="text-white font-semibold">Solana Mainnet</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div>
                <span className="text-[#8B949E] mr-1.5">1 AIQX:</span>
                <span className="text-emerald-400 font-bold">${baseTokenPriceUsd.toFixed(6)}</span>
              </div>
            </div>

            {/* Navigation Page Items */}
            <div className="p-4 space-y-2 flex-1">
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#8B949E] px-2 mb-2 font-semibold">
                Select Page Destination
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start space-x-3.5 cursor-pointer group ${
                      isActive
                        ? 'bg-[#171D27] border-[#F5A623]/60 shadow-[0_0_15px_rgba(245,166,35,0.12)]'
                        : 'bg-[#11161E] border-[#1E2533] hover:border-[#2D3748] hover:bg-[#141A23]'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#F5A623] text-[#0B0E11]'
                          : 'bg-[#171D27] text-[#8B949E] group-hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-bold truncate ${
                            isActive ? 'text-[#F5A623]' : 'text-white group-hover:text-[#F5A623]'
                          }`}
                        >
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0B0E11] text-[#F5A623] border border-[#232B3B]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8B949E] mt-0.5 line-clamp-1">
                        {item.description}
                      </p>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 mt-2 transition-transform group-hover:translate-x-0.5 ${
                        isActive ? 'text-[#F5A623]' : 'text-[#4E5766]'
                      }`}
                    />
                  </button>
                );
              })}

              {/* Token Guide Full Modal Link */}
              <button
                onClick={handleTokenGuideClick}
                className="w-full text-left p-3.5 rounded-xl border border-[#1E2533] bg-[#11161E] hover:border-[#2D3748] hover:bg-[#141A23] transition-all flex items-start space-x-3.5 cursor-pointer group"
              >
                <div className="p-2 rounded-lg shrink-0 bg-[#171D27] text-[#8B949E] group-hover:text-[#F5A623] transition-colors">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white group-hover:text-[#F5A623] transition-colors">
                      Token Guide & Contract
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#0B0E11] text-emerald-400 border border-emerald-800/40">
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8B949E] mt-0.5 line-clamp-1">
                    SPL Mint, 4.55M Fixed Supply, Raydium AMM pair
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 text-[#4E5766] mt-2 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Drawer Footer with Quick Utilities */}
            <div className="p-4 border-t border-[#1E2533] bg-[#0B0E11] space-y-3">
              {/* Copy Referral Link if Registered */}
              {isRegistered && userWallet && (
                <div className="p-3 rounded-lg bg-[#11161E] border border-[#1E2533] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#8B949E] font-medium">Your Referral Link</span>
                    <span className="text-emerald-400 font-mono text-[10px]">Level 1: 50 AIQX</span>
                  </div>
                  <button
                    onClick={handleCopyRefLink}
                    className="w-full py-1.5 px-2.5 rounded bg-[#171D27] hover:bg-[#202735] text-[#F5A623] border border-[#232B3B] text-xs font-mono font-semibold flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    {copiedRef ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Referral Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy My Referral Link</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Official Mint Quick Copy */}
              <div className="p-3 rounded-lg bg-[#11161E] border border-[#1E2533] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#8B949E]">Official AIQX Mint</span>
                  <button
                    onClick={handleCopyMint}
                    className="text-[#F5A623] hover:underline flex items-center space-x-1 text-[10px] cursor-pointer"
                  >
                    {copiedMint ? <span>Copied!</span> : <span>Copy Mint</span>}
                  </button>
                </div>
                <div className="text-[11px] font-mono text-white/90 truncate bg-[#0B0E11] p-1.5 rounded border border-[#1E2533]/80">
                  {OFFICIAL_AIQX_MINT}
                </div>
              </div>

              {/* Explorer Link */}
              <a
                href={getExplorerUrl(OFFICIAL_AIQX_MINT, 'token', config.network)}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 rounded-lg bg-[#141A23] hover:bg-[#1C2432] text-xs font-semibold text-[#8B949E] hover:text-white border border-[#232B3B] flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>View Mint on Solana Explorer</span>
                <ExternalLink className="w-3 h-3 text-[#F5A623]" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
