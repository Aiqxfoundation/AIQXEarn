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
  Layers,
  Shuffle,
  Coins,
  Cpu,
  Clock,
  Sparkles,
  GitBranch,
  Search,
} from 'lucide-react';
import { AppConfig, formatAddress, getExplorerUrl } from '../lib/solana';
import { SolanaLogo } from './SolanaLogo';
import { OFFICIAL_AIQX_MINT } from '../lib/marketData';
import { OFFICIAL_TREASURY_WALLET } from '../lib/referral-engine';

export type NavigationTab =
  | 'terminal'
  | 'foundation'
  | 'matrix-x'
  | 'my-network'
  | 'my-slots'
  | 'referrals'
  | 'crossover'
  | 'earnings'
  | 'contribute'
  | 'transactions'
  | 'system-pool'
  | 'dashboard'
  | 'docs';

interface HeaderProps {
  config: AppConfig;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isRegistered: boolean;
  userWallet?: string;
  userId?: number;
  baseTokenPriceUsd?: number;
  onOpenTokenGuide?: () => void;
  // Forsage Preview ID controls
  previewIdInput: string;
  setPreviewIdInput: (val: string) => void;
  onPreviewSubmit: (id: string) => void;
  isPreviewMode?: boolean;
  onClearPreview?: () => void;
}

export const Header: FC<HeaderProps> = ({
  config,
  activeTab,
  setActiveTab,
  isRegistered,
  userWallet,
  userId,
  baseTokenPriceUsd = 0.0002613,
  onOpenTokenGuide,
  previewIdInput,
  setPreviewIdInput,
  onPreviewSubmit,
  isPreviewMode = false,
  onClearPreview,
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

  const handlePreviewFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewIdInput.trim()) {
      onPreviewSubmit(previewIdInput.trim());
    }
  };

  const handleCopyRefLink = async () => {
    if (!userWallet) return;
    try {
      const refParam = userId ? String(userId) : userWallet;
      const url = `${window.location.origin}?ref=${refParam}`;
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

  // Matrix navigation menu items
  const matrixMenuItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      description: 'Personal link, team stats, profits sparkline & programs',
      icon: Activity,
      badge: 'Main',
    },
    {
      id: 'matrix-x' as NavigationTab,
      label: 'Programs (Matrix X)',
      description: '14-Level Doubling Matrix, Slots & Direct Upgrades',
      icon: Layers,
      badge: '14 Levels',
    },
    {
      id: 'terminal' as NavigationTab,
      label: 'DEX Terminal',
      description: 'Live Raydium Candlesticks, Market Depth & Instant Swap',
      icon: ArrowDownUp,
      badge: 'Live AMM',
    },
    {
      id: 'my-network' as NavigationTab,
      label: 'Partners & Network',
      description: 'Permanent Sequential ID Tree & Spillover Hierarchy',
      icon: GitBranch,
      badge: userId ? `#${userId}` : 'Team',
    },
    {
      id: 'docs' as NavigationTab,
      label: 'Information & Docs',
      description: 'Full Protocol Manifesto, 14-Level Math & Audit',
      icon: BookOpen,
      badge: 'Knowledge',
    },
    {
      id: 'transactions' as NavigationTab,
      label: 'Stats & Ledger',
      description: 'On-Chain Explorer Links & Atomic Execution History',
      icon: Clock,
      badge: 'Ledger',
    },
    {
      id: 'contribute' as NavigationTab,
      label: 'Contribute to Earn',
      description: 'Task Verification, Marketing Grants & Adoption Pool',
      icon: Cpu,
      badge: 'Earn',
    },
    {
      id: 'referrals' as NavigationTab,
      label: 'Join / Onboarding',
      description: 'ID-Based Links (?ref=ID) & 100 AIQX Activation',
      icon: Users,
      badge: 'Join',
    },
    {
      id: 'system-pool' as NavigationTab,
      label: 'Protocol Treasury',
      description: '15% System Reserve & Strict Treasury Isolation',
      icon: Database,
      badge: 'Treasury',
    },
  ];

  return (
    <>
      {/* Forsage-Style Top Bar with Vibrant Royal Blue Background */}
      <header className="sticky top-0 z-40 w-full bg-[#2563EB] shadow-md border-b border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand Emblem + Preview ID search input + Go button */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center space-x-2 focus:outline-none group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full p-0.5 bg-white/20 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
                <img
                  src="/aiqx-logo.png"
                  alt="AIQX Emblem"
                  className="w-full h-full rounded-full object-cover bg-black"
                />
              </div>
              <span className="font-black text-lg text-white tracking-tight hidden sm:inline">
                AIQX
              </span>
            </button>

            {/* Forsage Preview ID Search Bar */}
            <form
              onSubmit={handlePreviewFormSubmit}
              className="flex items-center space-x-2 bg-blue-700/60 p-1 rounded-2xl border border-blue-400/40"
            >
              <span className="text-xs font-bold text-white px-2 hidden sm:inline">
                Preview ID
              </span>
              <input
                type="text"
                value={previewIdInput}
                onChange={(e) => setPreviewIdInput(e.target.value)}
                placeholder="1"
                className="bg-blue-800 text-white font-mono font-bold text-xs px-3 py-1.5 rounded-xl border border-blue-400/30 w-16 sm:w-24 text-center focus:outline-none focus:ring-1 focus:ring-white placeholder:text-blue-300"
              />
              <button
                type="submit"
                className="bg-blue-300 hover:bg-white text-blue-900 font-extrabold text-xs px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Go
              </button>
            </form>

            {/* Exit Preview pill button if in preview mode */}
            {isPreviewMode && (
              <button
                onClick={onClearPreview}
                className="px-2.5 py-1 rounded-xl bg-blue-900/80 hover:bg-blue-900 text-white font-mono text-xs flex items-center space-x-1 cursor-pointer transition-colors border border-blue-400/40"
                title="Exit Preview Mode"
              >
                <span className="hidden md:inline">Exit</span>
                <X className="w-3.5 h-3.5 text-blue-200" />
              </button>
            )}
          </div>

          {/* Right Action: Connect Wallet & Mobile Menu Toggle */}
          <div className="flex items-center space-x-3">
            {/* Price Pill */}
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-blue-700/60 border border-blue-400/30 text-xs font-mono text-white">
              <span className="text-blue-200">AIQX:</span>
              <span className="font-bold text-emerald-300">${baseTokenPriceUsd.toFixed(6)}</span>
            </div>

            {/* Connect Wallet Button (Forsage black button with white bold text) */}
            <div className="wallet-btn-custom">
              <WalletMultiButton className="!bg-[#0B0E14] !text-white !font-bold hover:!bg-[#151B26] !h-10 !px-4 !rounded-2xl !text-xs !shadow-lg border border-black/40" />
            </div>

            {/* Hamburger Button for Mobile */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-blue-700/60 hover:bg-blue-700 text-white border border-blue-400/40 cursor-pointer transition-colors flex items-center justify-center"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Hamburger Drawer Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative w-full max-w-sm sm:max-w-md bg-[#0D1117] border-l border-[#1E2533] shadow-2xl flex flex-col h-full z-10 overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-[#1E2533] flex items-center justify-between bg-[#11161E]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full p-0.5 bg-blue-600 flex items-center justify-center">
                  <img
                    src="/aiqx-logo.png"
                    alt="AIQX Emblem"
                    className="w-full h-full rounded-full object-cover bg-black"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-sm text-white">AIQX Matrix X</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-600/20 text-blue-400 border border-blue-500/30">
                      14 Levels
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8B949E] block">Forsage-Style Slot System</span>
                </div>
              </div>

              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 rounded-lg text-[#8B949E] hover:text-white hover:bg-[#1E2533] cursor-pointer transition-colors"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-1">
              <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#6E7681]">
                Platform Sections
              </div>
              {matrixMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-blue-600/15 text-white border border-blue-500/30 font-semibold'
                        : 'text-[#8B949E] hover:text-white hover:bg-[#161C26]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-blue-400' : 'text-[#6E7681]'
                        }`}
                      />
                      <div>
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[11px] text-[#6E7681] truncate max-w-[200px]">
                          {item.description}
                        </div>
                      </div>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#1E2533] text-[#8B949E]">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="mt-auto p-4 border-t border-[#1E2533] bg-[#11161E] space-y-3">
              <div className="flex items-center justify-between text-xs text-[#8B949E]">
                <span>AIQX Mint</span>
                <button
                  onClick={handleCopyMint}
                  className="font-mono text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
                >
                  <span>{copiedMint ? 'Copied!' : 'Copy Mint'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-[#8B949E]">
                <span>Treasury Wallet</span>
                <span className="font-mono text-emerald-400 text-[11px]">
                  {formatAddress(OFFICIAL_TREASURY_WALLET)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
