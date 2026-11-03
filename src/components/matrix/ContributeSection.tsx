import React, { FC, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Cpu,
  Sparkles,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  PlusCircle,
  FileCode2,
  ShieldCheck,
  Send,
  AlertCircle,
  Loader2,
  Users,
} from 'lucide-react';
import { ContributionRecord, UserRecord } from '../../lib/referral-engine';
import { AppConfig, formatAddress, getExplorerUrl } from '../../lib/solana';

interface ContributeSectionProps {
  config: AppConfig;
  user: UserRecord | null;
}

const CATEGORIES = [
  'Smart Contract Development',
  'Frontend Development',
  'Bug Reporting',
  'Security Research',
  'Documentation & Guides',
  'Community Education',
  'Ecosystem Adoption',
  'Verified Technical Contributions',
] as const;

export const ContributeSection: FC<ContributeSectionProps> = ({ config, user }) => {
  const { connected, publicKey } = useWallet();

  const [contributions, setContributions] = useState<ContributionRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('Smart Contract Development');
  const [description, setDescription] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [requestedReward, setRequestedReward] = useState<number>(500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadContributions = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/contribute/list');
      const data = await res.json();
      if (data && data.success) {
        setContributions(data.contributions || []);
      }
    } catch (e) {
      console.warn('Failed to fetch contributions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContributions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const res = await fetch('/api/contribute/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          description,
          proofUrl,
          requestedRewardAiqx: requestedReward,
          contributorWallet: publicKey.toBase58(),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Submission failed');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowSubmitModal(false);
        setTitle('');
        setDescription('');
        setProofUrl('');
        loadContributions();
      }, 1500);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit contribution proposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" />
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#F5A623]">
              AIQX Foundation — Ecosystem Grants
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contribute to Earn</h1>
          <p className="text-xs text-[#8B949E]">
            Rewarding technical, security, documentation, and adoption contributions from independently funded ecosystem allocations.
          </p>
        </div>

        <button
          onClick={() => setShowSubmitModal(true)}
          disabled={!connected}
          className="px-4 py-2.5 rounded-lg bg-[#F5A623] hover:bg-[#e59917] disabled:opacity-50 text-[#0B0E11] font-bold text-xs flex items-center space-x-2 shadow-[0_4px_14px_rgba(245,166,35,0.25)] cursor-pointer shrink-0 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit Contribution Proposal</span>
        </button>
      </div>

      {/* Contribution Guidelines Banner */}
      <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#1E2533] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#8B949E]">
        <div className="flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">Independent Grant Funding</span>
            <span>Rewards are funded by foundation treasury grants, NEVER from new member joining fees.</span>
          </div>
        </div>

        <div className="flex items-start space-x-2.5">
          <FileCode2 className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">Open Source Verification</span>
            <span>All PRs, smart contracts, bug audits, and guides are public for community inspection.</span>
          </div>
        </div>

        <div className="flex items-start space-x-2.5">
          <Award className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white block">On-Chain Grant Settlement</span>
            <span>Approved contributions receive AIQX transfers with immutable transaction records.</span>
          </div>
        </div>
      </div>

      {/* Verified Contributions Ledger */}
      <div className="p-5 rounded-xl bg-[#11161E] border border-[#1E2533] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#1E2533]">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#F5A623]" />
            <h3 className="text-sm font-bold text-white">Community Technical Contributions</h3>
          </div>
          <span className="text-xs font-mono text-[#8B949E]">{contributions.length} Proposals Logged</span>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-xs text-[#8B949E]">Loading contributions...</div>
        ) : contributions.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#8B949E]">No contributions submitted yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contributions.map((c) => {
              const statusBadge =
                c.status === 'rewarded'
                  ? { label: 'Rewarded', style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' }
                  : c.status === 'verified'
                  ? { label: 'Verified', style: 'text-[#F5A623] bg-[#F5A623]/10 border-[#F5A623]/20' }
                  : { label: 'Under Review', style: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };

              return (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-[#0B0E11] border border-[#1E2533] flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#171D27] text-[#8B949E]">
                        {c.category}
                      </span>
                      <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${statusBadge.style}`}>
                        {statusBadge.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white pt-1">{c.title}</h4>
                    <p className="text-xs text-[#8B949E] line-clamp-3 leading-relaxed">
                      {c.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#1E2533] flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[#8B949E] text-[10px] block">Grant Allocation</span>
                      <span className="font-bold text-[#F5A623]">
                        {(c.grantedRewardAiqx || c.requestedRewardAiqx).toLocaleString()} AIQX
                      </span>
                    </div>

                    {c.proofUrl && (
                      <a
                        href={c.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded bg-[#171D27] hover:bg-[#1E2533] text-white text-[11px] flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        <span>View Proof / PR</span>
                        <ExternalLink className="w-3 h-3 text-[#8B949E]" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="fixed inset-0" onClick={() => !isSubmitting && setShowSubmitModal(false)} />

          <div className="relative w-full max-w-lg bg-[#0D1117] border border-[#232B3B] rounded-2xl shadow-2xl p-6 space-y-4 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2533]">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-[#F5A623]" />
                <h3 className="text-base font-bold text-white">Submit Contribution Proposal</h3>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="text-[#8B949E] hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-white block mb-1 font-semibold">Proposal Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anchor Matrix Program Audit or Turkish Localization"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#11161E] border border-[#1E2533] text-white focus:outline-none focus:border-[#F5A623]"
                />
              </div>

              <div>
                <label className="text-white block mb-1 font-semibold">Category:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2.5 rounded-lg bg-[#11161E] border border-[#1E2533] text-white focus:outline-none focus:border-[#F5A623]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white block mb-1 font-semibold">Work Summary &amp; Impact:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your technical work, methodology, and how it advances the AIQX ecosystem..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#11161E] border border-[#1E2533] text-white focus:outline-none focus:border-[#F5A623]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-white block mb-1 font-semibold">Proof Link / PR URL:</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-[#11161E] border border-[#1E2533] text-white focus:outline-none focus:border-[#F5A623]"
                  />
                </div>

                <div>
                  <label className="text-white block mb-1 font-semibold">Requested Reward (AIQX):</label>
                  <input
                    type="number"
                    min={50}
                    max={50000}
                    value={requestedReward}
                    onChange={(e) => setRequestedReward(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg bg-[#11161E] border border-[#1E2533] text-white font-mono font-bold focus:outline-none focus:border-[#F5A623]"
                  />
                </div>
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Proposal submitted successfully!</span>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#171D27] text-[#8B949E] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] font-bold cursor-pointer flex items-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Proposal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
