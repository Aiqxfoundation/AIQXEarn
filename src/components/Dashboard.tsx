import React, { FC, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Copy,
  Check,
  ExternalLink,
  Coins,
  Users,
  Award,
  Clock,
  ArrowUpRight,
  ArrowRight,
  TrendingUp,
  Share2,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { AppConfig, formatAddress, getExplorerUrl } from '../lib/solana';
import { UserRecord, EarningsRecord } from '../lib/referral-engine';

interface DashboardProps {
  config: AppConfig;
  user: UserRecord;
  earnings: {
    l1Earnings: number;
    l2Earnings: number;
    l3Earnings: number;
    totalEarnings: number;
    history: EarningsRecord[];
  };
  referrals: {
    l1Count: number;
    l2Count: number;
    l3Count: number;
    totalNetworkCount: number;
    tree: {
      l1: UserRecord[];
      l2: UserRecord[];
      l3: UserRecord[];
    };
  };
  aiqxBalance: number;
  solBalance: number;
  onRefresh: () => void;
  onGoToDex?: () => void;
}

export const Dashboard: FC<DashboardProps> = ({
  config,
  user,
  earnings,
  referrals,
  aiqxBalance,
  solBalance,
  onRefresh,
  onGoToDex,
}) => {
  const { publicKey } = useWallet();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [activeTreeTab, setActiveTreeTab] = useState<'l1' | 'l2' | 'l3'>('l1');

  const refParam = user.id ? String(user.id) : user.wallet;
  const referralUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?ref=${refParam}`
    : `https://aiqx.io/?ref=${refParam}`;

  const copyToClipboard = async (text: string, type: 'link' | 'wallet') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedWallet(true);
        setTimeout(() => setCopiedWallet(false), 2000);
      }
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
              Verified Active Participant
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AIQX Community Dashboard</h1>
          <p className="text-xs text-[#8B949E]">
            Direct on-chain referral accounting and automated token adoption rewards.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onRefresh}
            className="px-3.5 py-2 rounded-lg bg-[#171D27] hover:bg-[#1E2533] text-white border border-[#232B3B] text-xs font-mono transition-colors cursor-pointer"
          >
            Refresh On-Chain Data
          </button>
        </div>
      </div>

      {/* Grid: My Account & My Referral */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MY ACCOUNT */}
        <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2533]">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[#F5A623] font-semibold">
                  My Account
                </span>
                <span className="px-2 py-0.5 rounded bg-[#171D27] text-white font-mono font-bold text-[10px] border border-[#232B3B]">
                  ID #{user.id || 1}
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono">
                Level {Math.max(...(user.activeLevels || [1]))} Active
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-[#8B949E] block mb-1">Connected Wallet</span>
                <div className="flex items-center space-x-2 bg-[#0B0E11] p-2.5 rounded-lg border border-[#1E2533]">
                  <span className="text-xs font-mono text-white truncate flex-1">
                    {user.wallet}
                  </span>
                  <button
                    onClick={() => copyToClipboard(user.wallet, 'wallet')}
                    title="Copy wallet address"
                    className="p-1 text-[#8B949E] hover:text-[#F5A623] transition-colors"
                  >
                    {copiedWallet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={getExplorerUrl(user.wallet, 'address', config.network)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-[#8B949E] hover:text-[#F5A623] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#1E2533] flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-[#8B949E] block">AIQX Token Balance</span>
                    <span className="text-xl font-bold font-mono text-white mt-1 block">
                      {aiqxBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {onGoToDex && (
                    <button
                      onClick={onGoToDex}
                      className="mt-2 text-[11px] font-mono text-[#F5A623] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Buy / Sell on DEX</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#1E2533]">
                  <span className="text-xs text-[#8B949E] block">SOL Fee Balance</span>
                  <span className="text-xl font-bold font-mono text-[#8B949E] mt-1 block">
                    {solBalance.toFixed(4)} SOL
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1E2533] flex items-center justify-between text-xs text-[#8B949E]">
            <span>Join Date: {new Date(user.joinTime).toLocaleDateString()}</span>
            <a
              href={getExplorerUrl(user.joinSignature, 'tx', config.network)}
              target="_blank"
              rel="noreferrer"
              className="text-[#F5A623] hover:underline flex items-center space-x-1"
            >
              <span>Join Tx</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* MY REFERRAL */}
        <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#1E2533]">
              <span className="text-xs font-mono uppercase tracking-wider text-[#F5A623] font-semibold">
                My Referral Link
              </span>
              <span className="text-[11px] text-[#8B949E] font-mono">
                Level 1: 50 AIQX Reward
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-[#8B949E] block mb-1">Personal Referral Link</span>
                <div className="flex items-center space-x-2 bg-[#0B0E11] p-2.5 rounded-lg border border-[#1E2533]">
                  <span className="text-xs font-mono text-[#F5A623] truncate flex-1">
                    {referralUrl}
                  </span>
                  <button
                    onClick={() => copyToClipboard(referralUrl, 'link')}
                    className="px-3 py-1 rounded bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#1E2533]">
                <div className="text-xs text-[#8B949E] mb-1">Direct Sponsor Wallet</div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-white">
                    {user.upline1 ? formatAddress(user.upline1, 8) : 'Genesis Community Root'}
                  </span>
                  {user.upline1 && (
                    <a
                      href={getExplorerUrl(user.upline1, 'address', config.network)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#F5A623] hover:underline flex items-center space-x-1"
                    >
                      <span>Explorer</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1E2533] text-xs text-[#8B949E]">
            Share your link with prospective participants. Every eligible join credits 50 AIQX instantly to your wallet.
          </div>
        </div>
      </div>

      {/* MY EARNINGS BREAKDOWN */}
      <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-[#1E2533]">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#F5A623] font-semibold mb-1">
              On-Chain Marketing Rewards
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">My Earnings Breakdown</h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#8B949E] block">Total AIQX Earned</span>
            <span className="text-2xl font-mono font-bold text-[#F5A623]">
              {earnings.totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })} AIQX
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Level 1 Earnings */}
          <div className="p-5 rounded-lg bg-[#0B0E11] border border-[#1E2533]">
            <div className="flex items-center justify-between text-xs text-[#8B949E] mb-2">
              <span className="font-semibold text-white">Level 1 Earnings</span>
              <span className="font-mono text-[#F5A623]">50 AIQX / join</span>
            </div>
            <div className="text-2xl font-mono font-bold text-white">
              {earnings.l1Earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-[#8B949E]">AIQX</span>
            </div>
            <div className="text-[11px] text-[#8B949E] mt-2">
              From {referrals.l1Count} direct referrals
            </div>
          </div>

          {/* Level 2 Earnings */}
          <div className="p-5 rounded-lg bg-[#0B0E11] border border-[#1E2533]">
            <div className="flex items-center justify-between text-xs text-[#8B949E] mb-2">
              <span className="font-semibold text-white">Level 2 Earnings</span>
              <span className="font-mono text-[#F5A623]">30 AIQX / join</span>
            </div>
            <div className="text-2xl font-mono font-bold text-white">
              {earnings.l2Earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-[#8B949E]">AIQX</span>
            </div>
            <div className="text-[11px] text-[#8B949E] mt-2">
              From {referrals.l2Count} second-level referrals
            </div>
          </div>

          {/* Level 3 Earnings */}
          <div className="p-5 rounded-lg bg-[#0B0E11] border border-[#1E2533]">
            <div className="flex items-center justify-between text-xs text-[#8B949E] mb-2">
              <span className="font-semibold text-white">Level 3 Earnings</span>
              <span className="font-mono text-[#F5A623]">5 AIQX / join</span>
            </div>
            <div className="text-2xl font-mono font-bold text-white">
              {earnings.l3Earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs text-[#8B949E]">AIQX</span>
            </div>
            <div className="text-[11px] text-[#8B949E] mt-2">
              From {referrals.l3Count} third-level referrals
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-[#171D27]/60 border border-[#1E2533] text-xs text-[#8B949E] flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#F5A623] shrink-0" />
          <span>
            Non-Custodial Architecture: All marketing rewards are transferred directly to your Solana wallet during registration transactions. No custodial withdrawal delays.
          </span>
        </div>
      </div>

      {/* TOTAL REFERRALS & REFERRAL TREE */}
      <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1E2533]">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#F5A623] font-semibold mb-1">
              Community Network
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Total Referrals & Tree</h2>
          </div>

          {/* Tree Level Tabs */}
          <div className="inline-flex rounded-lg bg-[#0B0E11] p-1 border border-[#1E2533]">
            <button
              onClick={() => setActiveTreeTab('l1')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTreeTab === 'l1'
                  ? 'bg-[#171D27] text-[#F5A623] border border-[#232B3B]'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Level 1 ({referrals.l1Count})
            </button>
            <button
              onClick={() => setActiveTreeTab('l2')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTreeTab === 'l2'
                  ? 'bg-[#171D27] text-[#F5A623] border border-[#232B3B]'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Level 2 ({referrals.l2Count})
            </button>
            <button
              onClick={() => setActiveTreeTab('l3')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTreeTab === 'l3'
                  ? 'bg-[#171D27] text-[#F5A623] border border-[#232B3B]'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Level 3 ({referrals.l3Count})
            </button>
          </div>
        </div>

        {/* Tree Table */}
        <div className="overflow-x-auto">
          {referrals.tree[activeTreeTab].length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8B949E] bg-[#0B0E11] rounded-lg border border-[#1E2533]">
              No participants registered at {activeTreeTab.toUpperCase()} yet. Share your referral link to expand your network.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0E11] text-[#8B949E] uppercase font-mono border-b border-[#1E2533]">
                <tr>
                  <th className="py-3 px-4">Participant Wallet</th>
                  <th className="py-3 px-4">Upline Sponsor</th>
                  <th className="py-3 px-4">Join Date</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2533]/50 font-mono">
                {referrals.tree[activeTreeTab].map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#171D27]/30 transition-colors">
                    <td className="py-3.5 px-4 text-white font-semibold">
                      {formatAddress(item.wallet, 6)}
                    </td>
                    <td className="py-3.5 px-4 text-[#8B949E]">
                      {item.upline1 ? formatAddress(item.upline1, 6) : '--'}
                    </td>
                    <td className="py-3.5 px-4 text-[#8B949E]">
                      {new Date(item.joinTime).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={getExplorerUrl(item.joinSignature, 'tx', config.network)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-[#F5A623] hover:underline"
                      >
                        <span>Verified</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* TRANSACTION HISTORY */}
      <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
        <div className="mb-6 pb-4 border-b border-[#1E2533]">
          <div className="text-xs font-mono uppercase tracking-wider text-[#F5A623] font-semibold mb-1">
            Settlement Audit
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Transaction History</h2>
        </div>

        <div className="overflow-x-auto">
          {earnings.history.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8B949E] bg-[#0B0E11] rounded-lg border border-[#1E2533]">
              No transaction records found yet for this account.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0E11] text-[#8B949E] uppercase font-mono border-b border-[#1E2533]">
                <tr>
                  <th className="py-3 px-4">Transaction Type</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Referral Level</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2533]/50 font-mono">
                {earnings.history.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#171D27]/30 transition-colors">
                    <td className="py-3.5 px-4 text-white font-medium capitalize">
                      {tx.category.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#F5A623]">
                      +{Number(tx.amount).toFixed(2)} AIQX
                    </td>
                    <td className="py-3.5 px-4 text-[#8B949E]">
                      Level {tx.level}
                    </td>
                    <td className="py-3.5 px-4 text-[#8B949E]">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <a
                        href={getExplorerUrl(tx.transactionSignature, 'tx', config.network)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-[#F5A623] hover:underline"
                      >
                        <span>{formatAddress(tx.transactionSignature, 4)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
