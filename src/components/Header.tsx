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

export type NavigationTab = 'dashboard' | 'team-picture' | 'terminal' | 'docs' | 'slot-tree';

interface HeaderProps {
  config: AppConfig;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  isRegistered: boolean;
  userWallet?: string;
  userId?: number;
  baseTokenPriceUsd?: number;
  aiqxBalance?: number;
  solBalance?: number;
  onOpenTokenGuide?: () => void;
  // AIQX Matrix Preview ID controls
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
  aiqxBalance = 0,
  solBalance = 0,
  onOpenTokenGuide,
  previewIdInput,
  setPreviewIdInput,
  onPreviewSubmit,
  isPreviewMode = false,
  onClearPreview,
}) => {
  const { publicKey, disconnect } = useWallet();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [copiedMint, setCopiedMint] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setShowSearchModal(false);
      }
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

  const handlePreviewFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewIdInput.trim()) {
      onPreviewSubmit(previewIdInput.trim());
      setShowSearchModal(false);
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

  const navMenuItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Slots',
      icon: Activity,
    },
    {
      id: 'team-picture' as NavigationTab,
      label: 'Team Picture',
      icon: Users,
    },
    {
      id: 'terminal' as NavigationTab,
      label: 'DEX',
      icon: ArrowDownUp,
    },
    {
      id: 'docs' as NavigationTab,
      label: 'Docs',
      icon: BookOpen,
    },
  ];

  return (
    <>
      {/* AIQX Matrix Fixed Top Bar - Clean, Non-Scrolling, Zero Jitter */}
      <header className="sticky top-0 z-40 w-full bg-[#0E121A] border-b border-[#1E2533] shadow-md select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Left: Exact Brand Logo + Desktop Navigation Buttons */}
          <div className="flex items-center space-x-3 sm:space-x-5 shrink-0">
            <button
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center space-x-2.5 focus:outline-none group cursor-pointer shrink-0"
              title="AIQX Foundation"
            >
              <img
                src="/aiqx-logo.png"
                alt="AIQX Logo"
                className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm"
              />
              <span className="font-extrabold text-lg text-white tracking-tight">
                AIQX
              </span>
            </button>

            {/* Desktop Navigation: Slots | Team Picture | DEX | Docs */}
            <nav className="hidden lg:flex items-center space-x-1 bg-[#141926] p-1 rounded-2xl border border-[#1E273A]">
              {navMenuItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-[#8B949E] hover:text-white hover:bg-[#1E2538]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action: Clean non-scrolling container
              - On Desktop: Solana Pill + SOL Balance Pill + Search + Connect Wallet
              - On Mobile: Search + Menu Lines (Connect Wallet is inside the Menu Drawer at the top) */}
          <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
            {/* 1. Network Pill: Solana Mainnet (visible on lg+) */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-[#141926] border border-[#1E273A] text-xs font-medium text-white shadow-sm shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <SolanaLogo className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold text-white text-[11px] sm:text-xs">Solana</span>
            </div>

            {/* 2. SOL Native Balance Pill (visible on lg+) */}
            <div
              title="Your SOL Balance"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-[#141926] border border-[#1E273A] text-xs font-mono text-white shadow-sm shrink-0"
            >
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 flex items-center justify-center text-[8px] font-black text-white shrink-0">
                S
              </div>
              <span className="font-bold text-white text-[11px] sm:text-xs">
                {solBalance.toFixed(3)}{' '}
                <span className="text-[#8B949E] text-[10px] font-sans">SOL</span>
              </span>
            </div>

            {/* 3. Search Button for Member Preview ID */}
            <button
              onClick={() => setShowSearchModal((prev) => !prev)}
              className={`p-2 rounded-2xl border transition-colors cursor-pointer shrink-0 ${
                showSearchModal || isPreviewMode
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-[#141926] hover:bg-[#1D2436] text-[#8B949E] hover:text-white border-[#1E273A]'
              }`}
              title="Search Member ID / Preview Mode"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* 4. Desktop Connect Wallet Button (Hidden on Mobile, placed cleanly at right edge) */}
            <div className="hidden lg:block wallet-btn-custom shrink-0">
              <WalletMultiButton className="!bg-gradient-to-r !from-blue-600 !to-indigo-600 hover:!from-blue-500 hover:!to-indigo-500 !text-white !font-bold !h-9 !px-4 !rounded-2xl !text-xs !shadow-md !shadow-blue-600/30 !border !border-blue-400/40 cursor-pointer" />
            </div>

            {/* 5. Mobile Menu Lines (Hamburger) */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="lg:hidden flex flex-col justify-center items-center w-9 h-9 rounded-2xl bg-[#141926] hover:bg-[#1E2538] border border-[#1E273A] transition-all cursor-pointer space-y-1 shrink-0 shadow-sm p-2"
              aria-label="Open Navigation Menu"
              title="Menu"
            >
              <span className="w-4 h-0.5 bg-white/90 rounded-full" />
              <span className="w-4 h-0.5 bg-white/90 rounded-full" />
              <span className="w-4 h-0.5 bg-white/90 rounded-full" />
            </button>
          </div>
        </div>

        {/* Quick Inline Search Drawer / Dropdown when search icon is clicked */}
        {showSearchModal && (
          <div className="border-t border-[#1E273A] bg-[#111622] py-2.5 px-4 animate-fadeIn">
            <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
              <form
                onSubmit={handlePreviewFormSubmit}
                className="flex-1 flex items-center space-x-2 bg-[#0E121A] px-3 py-1.5 rounded-2xl border border-blue-500/40"
              >
                <Search className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-semibold text-[#8B949E] shrink-0">Member ID:</span>
                <input
                  type="text"
                  value={previewIdInput}
                  onChange={(e) => setPreviewIdInput(e.target.value)}
                  placeholder="e.g. 1, 42434"
                  autoFocus
                  className="bg-transparent text-white font-mono font-bold text-xs flex-1 focus:outline-none placeholder:text-[#4A5568]"
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer transition-colors shadow-sm"
                >
                  Inspect Matrix
                </button>
              </form>
              <button
                onClick={() => setShowSearchModal(false)}
                className="p-1.5 rounded-xl text-[#8B949E] hover:text-white hover:bg-[#1A2232] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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
                <img
                  src="/aiqx-logo.png"
                  alt="AIQX Logo"
                  className="w-8 h-8 rounded-full object-cover shrink-0 shadow-sm"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-extrabold text-sm text-white">AIQX Matrix</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-600/20 text-blue-400 border border-blue-500/30">
                      12 Slots
                    </span>
                  </div>
                  <span className="text-[11px] text-[#8B949E] block">Pure Solana Matrix</span>
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

            {/* Connect Wallet Button At Top Of Menu Drawer */}
            <div className="p-4 border-b border-[#1E2533] bg-[#11161E]/70 space-y-3">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6E7681]">
                Wallet Connection
              </div>
              <div className="wallet-btn-custom w-full flex justify-center">
                <WalletMultiButton className="!w-full !justify-center !bg-gradient-to-r !from-blue-600 !to-indigo-600 hover:!from-blue-500 hover:!to-indigo-500 !text-white !font-bold !h-11 !px-4 !rounded-xl !text-sm !shadow-md !shadow-blue-600/30 !border !border-blue-400/40 cursor-pointer" />
              </div>

              {/* Solana Network & Native SOL Balance Indicator inside menu */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <div className="flex items-center space-x-1.5 text-[#8B949E]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <SolanaLogo className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="font-medium text-white text-[11px]">Solana Mainnet</span>
                </div>
                <div className="font-mono text-xs font-bold text-white bg-[#141926] px-2.5 py-1 rounded-lg border border-[#1E273A]">
                  {solBalance.toFixed(3)} <span className="text-[#8B949E] text-[10px] font-sans">SOL</span>
                </div>
              </div>
            </div>

            {/* Menu Items - Strictly Dashboard, DEX, Docs only */}
            <div className="p-4 space-y-1">
              <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#6E7681]">
                Navigation
              </div>
              {navMenuItems.map((item) => {
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
                      <span className="text-sm font-bold text-white">{item.label}</span>
                    </div>
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
