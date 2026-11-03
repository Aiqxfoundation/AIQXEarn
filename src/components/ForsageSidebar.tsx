import React, { FC } from 'react';
import {
  LayoutGrid,
  Layers,
  ArrowDownUp,
  Users,
  BarChart2,
  BookOpen,
  Zap,
  Send,
  ExternalLink,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { NavigationTab } from './Header';

interface ForsageSidebarProps {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onOpenTokenGuide?: () => void;
  isRegistered?: boolean;
}

export const ForsageSidebar: FC<ForsageSidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenTokenGuide,
  isRegistered,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutGrid,
    },
    {
      id: 'matrix-x' as NavigationTab,
      label: 'Programs (Matrix X)',
      icon: Layers,
    },
    {
      id: 'terminal' as NavigationTab,
      label: 'DEX Terminal',
      icon: ArrowDownUp,
    },
    {
      id: 'my-network' as NavigationTab,
      label: 'Partners',
      icon: Users,
    },
    {
      id: 'transactions' as NavigationTab,
      label: 'Stats & Ledger',
      icon: BarChart2,
    },
    {
      id: 'docs' as NavigationTab,
      label: 'Information',
      icon: BookOpen,
    },
    {
      id: 'contribute' as NavigationTab,
      label: 'Contribute',
      icon: Zap,
    },
    {
      id: 'system-pool' as NavigationTab,
      label: 'Protocol Pool',
      icon: ShieldCheck,
    },
  ];

  return (
    <aside className="w-60 shrink-0 hidden lg:flex flex-col justify-between py-6 pr-4 border-r border-[#1E2533] min-h-[calc(100vh-4rem)]">
      {/* Top Menu Links */}
      <div className="space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#6E7681]">
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeTab === item.id ||
            (item.id === 'matrix-x' && (activeTab === 'my-slots' || activeTab === 'crossover')) ||
            (item.id === 'my-network' && activeTab === 'referrals') ||
            (item.id === 'docs' && activeTab === 'foundation');

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1E2638] text-white shadow-sm ring-1 ring-blue-500/30'
                  : 'text-[#8B949E] hover:text-white hover:bg-[#141A24]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-blue-400' : 'text-[#6E7681]'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Footer Section */}
      <div className="space-y-4 pt-6 border-t border-[#1E2533]">
        {/* Token Guide trigger */}
        {onOpenTokenGuide && (
          <button
            onClick={onOpenTokenGuide}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#11161E] hover:bg-[#171D27] text-[11px] font-mono text-[#8B949E] hover:text-blue-400 transition-colors border border-[#1E2533] cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Token Audit</span>
            </div>
            <ExternalLink className="w-3 h-3 text-[#6E7681]" />
          </button>
        )}

        {/* Social Icons */}
        <div className="flex items-center justify-around px-2 text-[#6E7681]">
          <a
            href="https://t.me/aiqxfoundation"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#171D27]"
            title="Telegram Community"
          >
            <Send className="w-4 h-4" />
          </a>
          <a
            href="https://x.com/AiqxFoundation"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#171D27] font-bold text-xs"
            title="X (Twitter)"
          >
            𝕏
          </a>
          <a
            href="https://solscan.io"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#171D27]"
            title="Solana Explorer"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="text-center text-[10px] text-[#4A5568] font-mono">
          AIQX Foundation • Solana
        </div>
      </div>
    </aside>
  );
};
