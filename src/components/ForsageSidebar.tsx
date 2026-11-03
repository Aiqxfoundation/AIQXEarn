import React, { FC, useState } from 'react';
import {
  LayoutGrid,
  Users,
  BarChart2,
  Target,
  BookOpen,
  MessageSquare,
  Send,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Youtube,
  Twitter,
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
  const [oldInterfaceToggle, setOldInterfaceToggle] = useState<boolean>(false);

  const menuItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Dashboard',
      icon: LayoutGrid,
      action: () => setActiveTab('dashboard'),
    },
    {
      id: 'team-picture' as NavigationTab,
      label: 'Partners',
      icon: Users,
      action: () => setActiveTab('team-picture'),
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: BarChart2,
      action: () => setActiveTab('dashboard'),
    },
    {
      id: 'targets',
      label: 'Targets',
      icon: Target,
      badge: 'Beta',
      action: () => onOpenTokenGuide?.(),
    },
    {
      id: 'docs' as NavigationTab,
      label: 'Information',
      icon: BookOpen,
      action: () => setActiveTab('docs'),
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      action: () => setActiveTab('dashboard'),
    },
    {
      id: 'telegram',
      label: 'Telegram bots',
      icon: Send,
      action: () => window.open('https://t.me/aiqxfoundation', '_blank'),
    },
    {
      id: 'promo',
      label: 'Promo',
      icon: Sparkles,
      badge: 'New',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      action: () => onOpenTokenGuide?.(),
    },
  ];

  return (
    <aside className="w-60 shrink-0 hidden lg:flex flex-col justify-between py-6 pr-4 border-r border-[#1E2533] min-h-[calc(100vh-4rem)]">
      {/* Top Menu Links */}
      <div className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            (item.id === 'dashboard' && (activeTab === 'dashboard' || activeTab === 'slot-tree')) ||
            (item.id === 'team-picture' && activeTab === 'team-picture') ||
            (item.id === 'docs' && activeTab === 'docs');

          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#182132] text-white shadow-sm ring-1 ring-blue-500/40'
                  : 'text-[#8B949E] hover:text-white hover:bg-[#141A24]'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-blue-400' : 'text-[#6E7681]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full border ${
                    item.badgeColor || 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Footer Section: Old Interface Toggle, English, Socials */}
      <div className="space-y-4 pt-6 border-t border-[#1E2533]">
        {/* "Old interface" toggle switch matching screenshot */}
        <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-[#111622] border border-[#1E2533]">
          <span className="text-xs text-[#8B949E] font-medium">Old interface</span>
          <button
            type="button"
            role="switch"
            aria-checked={oldInterfaceToggle}
            onClick={() => setOldInterfaceToggle((prev) => !prev)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              oldInterfaceToggle ? 'bg-purple-600' : 'bg-[#2A3448]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                oldInterfaceToggle ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Language selector: English with US flag */}
        <div className="flex items-center space-x-2 px-3 py-1.5 text-xs text-[#8B949E] hover:text-white cursor-pointer transition-colors">
          <span className="text-sm">🇺🇸</span>
          <span className="font-medium">English</span>
        </div>

        {/* Social Icons matching bottom of sidebar in screenshot */}
        <div className="flex items-center space-x-3 px-3 text-[#6E7681]">
          <a
            href="https://t.me/aiqxfoundation"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#171D27]"
            title="Telegram"
          >
            <Send className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#171D27]"
            title="YouTube"
          >
            <Youtube className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://x.com/AiqxFoundation"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors p-1.5 rounded-lg hover:bg-[#171D27]"
            title="Twitter / X"
          >
            <Twitter className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </aside>
  );
};
