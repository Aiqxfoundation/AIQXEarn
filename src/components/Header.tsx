import React, { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ShieldCheck, ExternalLink, Activity } from 'lucide-react';
import { formatAddress, getExplorerUrl, AppConfig } from '../lib/solana';

interface HeaderProps {
  config: AppConfig;
  activeTab: 'overview' | 'how-it-works' | 'token' | 'system-pool' | 'dashboard';
  setActiveTab: (tab: 'overview' | 'how-it-works' | 'token' | 'system-pool' | 'dashboard') => void;
  isRegistered: boolean;
}

export const Header: FC<HeaderProps> = ({
  config,
  activeTab,
  setActiveTab,
  isRegistered,
}) => {
  const { publicKey } = useWallet();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1E2533] bg-[#0B0E11]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Network */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center space-x-3 text-left focus:outline-none group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5A623] to-[#D48806] flex items-center justify-center font-bold text-[#0B0E11] text-xl shadow-[0_0_15px_rgba(245,166,35,0.25)] group-hover:scale-105 transition-transform">
              AQ
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#F5A623] transition-colors">
                  AIQX
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#171D27] text-[#8B949E] border border-[#232B3B]">
                  SPL
                </span>
              </div>
              <p className="text-[11px] text-[#8B949E] font-medium hidden sm:block">
                Solana Community Adoption
              </p>
            </div>
          </button>

          {/* Network indicator */}
          <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[#11161E] border border-[#1E2533] text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[#8B949E] font-mono">
              {config.network === 'mainnet-beta' ? 'Solana Mainnet' : 'Solana Devnet'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-[#F5A623] bg-[#171D27]'
                : 'text-[#8B949E] hover:text-white hover:bg-[#11161E]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('how-it-works')}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'how-it-works'
                ? 'text-[#F5A623] bg-[#171D27]'
                : 'text-[#8B949E] hover:text-white hover:bg-[#11161E]'
            }`}
          >
            How It Works
          </button>
          <button
            onClick={() => setActiveTab('token')}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'token'
                ? 'text-[#F5A623] bg-[#171D27]'
                : 'text-[#8B949E] hover:text-white hover:bg-[#11161E]'
            }`}
          >
            Token
          </button>
          <button
            onClick={() => setActiveTab('system-pool')}
            className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'system-pool'
                ? 'text-[#F5A623] bg-[#171D27]'
                : 'text-[#8B949E] hover:text-white hover:bg-[#11161E]'
            }`}
          >
            System Pool
          </button>
          {publicKey && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                activeTab === 'dashboard'
                  ? 'text-[#F5A623] bg-[#171D27]'
                  : 'text-[#8B949E] hover:text-white hover:bg-[#11161E]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Dashboard</span>
              {isRegistered && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          )}
        </nav>

        {/* Wallet Connection & Action */}
        <div className="flex items-center space-x-3">
          <WalletMultiButton className="!bg-[#F5A623] !text-[#0B0E11] !font-bold hover:!bg-[#e59917] !h-10 !px-4 !rounded-lg !text-sm !shadow-[0_2px_8px_rgba(245,166,35,0.2)]" />
        </div>
      </div>
    </header>
  );
};
