import React, { FC, useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Coins,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  AppConfig,
  formatAddress,
  getExplorerUrl,
  createAtomicJoiningTransaction,
} from '../lib/solana';
import {
  ReferralDistribution,
  isValidSolanaAddress,
} from '../lib/referral-engine';

interface JoinSectionProps {
  config: AppConfig;
  initialReferral?: string;
  aiqxBalance: number;
  solBalance: number;
  isRegistered?: boolean;
  onJoinSuccess: () => void;
  onRefreshBalances: () => void;
  onGoToDex?: () => void;
  onGoToDashboard?: () => void;
}

export const JoinSection: FC<JoinSectionProps> = ({
  config,
  initialReferral = '',
  aiqxBalance,
  solBalance,
  isRegistered = false,
  onJoinSuccess,
  onRefreshBalances,
  onGoToDex,
  onGoToDashboard,
}) => {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [referralInput, setReferralInput] = useState<string>(initialReferral || config.genesisWallet);
  const [resolvedHierarchy, setResolvedHierarchy] = useState<any | null>(null);
  const [distribution, setDistribution] = useState<ReferralDistribution | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusStep, setStatusStep] = useState<string>('');
  const [successTx, setSuccessTx] = useState<string | null>(null);
  const [devnetAirdropping, setDevnetAirdropping] = useState<boolean>(false);
  const [devnetSuccessMessage, setDevnetSuccessMessage] = useState<string | null>(null);

  // Update input if initialReferral changes
  useEffect(() => {
    if (initialReferral && isValidSolanaAddress(initialReferral)) {
      setReferralInput(initialReferral);
    }
  }, [initialReferral]);

  // Debounced referral resolution
  useEffect(() => {
    if (!referralInput || !isValidSolanaAddress(referralInput)) {
      setResolvedHierarchy(null);
      setDistribution(null);
      setValidationError(
        referralInput.length > 0 ? 'Invalid Solana wallet address format' : null
      );
      return;
    }

    if (publicKey && referralInput === publicKey.toBase58()) {
      setValidationError('Self-referral is strictly prohibited. Enter your sponsor’s wallet.');
      setResolvedHierarchy(null);
      setDistribution(null);
      return;
    }

    let isMounted = true;
    setIsResolving(true);
    setValidationError(null);

    const resolveHierarchy = async () => {
      try {
        const queryParams = new URLSearchParams({
          referral: referralInput.trim(),
          ...(publicKey ? { joining: publicKey.toBase58() } : {}),
        });

        const res = await fetch(`/api/referral/resolve?${queryParams}`);
        const data = await res.json();

        if (!isMounted) return;

        if (!res.ok || !data.success) {
          setValidationError(data.error || 'Failed to resolve referral hierarchy.');
          setResolvedHierarchy(null);
          setDistribution(null);
        } else {
          setValidationError(null);
          setResolvedHierarchy(data.hierarchy);
          setDistribution(data.distribution);
        }
      } catch (err: any) {
        if (!isMounted) return;
        setValidationError('Network error resolving referral. Please check backend connection.');
      } finally {
        if (isMounted) setIsResolving(false);
      }
    };

    const timer = setTimeout(resolveHierarchy, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [referralInput, publicKey]);

  // Atomic Join Execution
  const handleJoinNetwork = async () => {
    if (!publicKey || !distribution) return;

    if (aiqxBalance < 100) {
      setValidationError(
        `Insufficient AIQX balance (${aiqxBalance.toFixed(2)} AIQX). You need at least 100 AIQX to join.`
      );
      return;
    }

    if (solBalance < 0.005) {
      setValidationError(
        `Insufficient SOL for transaction fee (${solBalance.toFixed(4)} SOL). You need ~0.005 SOL for network fees.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      setValidationError(null);
      setStatusStep('1/4: Preparing atomic SPL token distribution instructions...');

      const tokenMintPubkey = new PublicKey(config.tokenMint);

      // Build atomic multi-instruction transaction
      const transaction = await createAtomicJoiningTransaction({
        connection,
        joiningWallet: publicKey,
        tokenMint: tokenMintPubkey,
        distribution,
        decimals: config.decimals,
      });

      setStatusStep('2/4: Please approve the 100 AIQX distribution in your wallet...');
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      setStatusStep('3/4: Waiting for Solana network confirmation...');
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      await connection.confirmTransaction(
        {
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        },
        'confirmed'
      );

      setStatusStep('4/4: Performing server-side verification and registering user...');
      const verifyRes = await fetch('/api/join/verify-and-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature,
          joiningWallet: publicKey.toBase58(),
          referralWallet: referralInput.trim(),
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Server verification failed');
      }

      setSuccessTx(signature);
      setStatusStep('Registration successful!');
      onRefreshBalances();
      setTimeout(() => {
        onJoinSuccess();
      }, 1500);
    } catch (err: any) {
      console.error('[Join Error]', err);
      setValidationError(err.message || 'Failed to complete registration transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Devnet Test Bypass / Helper (For Devnet testing without real funds)
  const handleDevnetSimulateJoin = async () => {
    if (!publicKey || !distribution) return;
    try {
      setIsSubmitting(true);
      setValidationError(null);
      setStatusStep('Simulating verified Devnet registration...');

      // Generate a deterministic simulated signature for devnet testing
      const fakeSig = `devnet_sig_${Date.now()}_${publicKey.toBase58().slice(0, 8)}`;

      const verifyRes = await fetch('/api/join/verify-and-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature: fakeSig,
          joiningWallet: publicKey.toBase58(),
          referralWallet: referralInput.trim(),
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Registration failed');
      }

      setSuccessTx(fakeSig);
      setStatusStep('Successfully registered on AIQX!');
      onRefreshBalances();
      setTimeout(() => {
        onJoinSuccess();
      }, 1000);
    } catch (err: any) {
      setValidationError(err.message || 'Registration simulation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Request Devnet SOL helper
  const handleRequestDevnetSol = async () => {
    if (!publicKey) return;
    try {
      setDevnetAirdropping(true);
      setDevnetSuccessMessage(null);
      const airdropSig = await connection.requestAirdrop(publicKey, 1000000000); // 1 SOL
      await connection.confirmTransaction(airdropSig, 'confirmed');
      setDevnetSuccessMessage('Successfully received 1 Devnet SOL for transaction fees!');
      onRefreshBalances();
    } catch (err: any) {
      console.warn('Airdrop failed:', err);
      setDevnetSuccessMessage('Solana Devnet faucet rate limit reached. Proceed with test registration.');
    } finally {
      setDevnetAirdropping(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-xl bg-[#11161E] border border-[#1E2533] shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E2533] pb-6 mb-6">
        <div>
          <div className="text-xs font-mono text-[#F5A623] uppercase tracking-wider mb-1">
            Membership Onboarding
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>Join the AIQX Network</span>
          </h2>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#8B949E] uppercase font-semibold">Joining Fee</div>
          <div className="text-xl font-mono font-bold text-[#F5A623]">100 AIQX</div>
        </div>
      </div>

      {/* Already Registered Status Banner */}
      {isRegistered && (
        <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-800/40 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Wallet Already Registered & Active</span>
              <span className="text-[#8B949E]">
                This wallet is active in the 3-tier matrix. You can view your tree and earnings in the Dashboard.
              </span>
            </div>
          </div>
          {onGoToDashboard && (
            <button
              type="button"
              onClick={onGoToDashboard}
              className="px-3.5 py-1.5 rounded-lg bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-sm"
            >
              Go to Dashboard →
            </button>
          )}
        </div>
      )}

      {/* Connected Wallet Identity */}
      <div className="p-4 rounded-lg bg-[#0B0E11] border border-[#1E2533] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs text-[#8B949E] block mb-0.5">Your Connected Wallet</span>
          <span className="text-sm font-mono text-white">
            {publicKey ? publicKey.toBase58() : 'No wallet connected'}
          </span>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div>
            <span className="text-[#8B949E]">AIQX: </span>
            <span className={aiqxBalance >= 100 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {aiqxBalance.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[#8B949E]">SOL: </span>
            <span className={solBalance >= 0.005 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
              {solBalance.toFixed(4)}
            </span>
          </div>
          {aiqxBalance < 100 && onGoToDex && (
            <button
              type="button"
              onClick={onGoToDex}
              className="px-2 py-0.5 rounded bg-[#F5A623]/20 hover:bg-[#F5A623]/30 text-[#F5A623] border border-[#F5A623]/40 text-[11px] font-bold cursor-pointer transition-colors"
            >
              Get AIQX
            </button>
          )}
        </div>
      </div>

      {/* Referral Input */}
      <div className="space-y-2 mb-6">
        <label className="block text-xs font-semibold text-[#8B949E] uppercase tracking-wider">
          Referral Wallet Address (Sponsor)
        </label>
        <div className="relative">
          <input
            type="text"
            value={referralInput}
            onChange={(e) => setReferralInput(e.target.value.trim())}
            placeholder="Enter sponsor Solana wallet address"
            className="w-full px-4 py-3 bg-[#0B0E11] border border-[#1E2533] rounded-lg text-sm font-mono text-white placeholder-[#4E5766] focus:outline-none focus:border-[#F5A623] transition-colors"
          />
          {isResolving && (
            <div className="absolute right-3 top-3.5">
              <Loader2 className="w-4 h-4 text-[#F5A623] animate-spin" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] text-[#8B949E]">
          <span>Must be an existing verified AIQX participant.</span>
          <button
            type="button"
            onClick={() => setReferralInput(config.genesisWallet)}
            className="text-[#F5A623] hover:underline cursor-pointer"
          >
            Use Genesis Sponsor
          </button>
        </div>
      </div>

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-4 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-start space-x-2.5 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="leading-relaxed">{validationError}</span>
        </div>
      )}

      {/* Live Distribution Breakdown Preview */}
      {distribution && (
        <div className="mb-6 rounded-lg bg-[#0B0E11] border border-[#1E2533] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#171D27] border-b border-[#1E2533] flex items-center justify-between text-xs font-semibold text-white">
            <span>Verified 100 AIQX Atomic Distribution Preview</span>
            <span className="text-[#F5A623] font-mono">100% On-Chain</span>
          </div>

          <div className="divide-y divide-[#1E2533]/50 text-xs">
            {/* Level 1 */}
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F5A623]" />
                  <span>Level 1 (Direct Sponsor)</span>
                </div>
                <div className="text-[#8B949E] font-mono text-[11px] mt-0.5">
                  {formatAddress(distribution.l1Wallet, 6)}
                </div>
              </div>
              <div className="text-right font-mono font-bold text-white text-sm">
                50.00 AIQX
              </div>
            </div>

            {/* Level 2 */}
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F5A623]/80" />
                  <span>Level 2 (Second-Level Upline)</span>
                </div>
                <div className="text-[#8B949E] font-mono text-[11px] mt-0.5">
                  {distribution.l2IsSystemReserve ? (
                    <span className="text-amber-400">Missing — Allocated to System Reserve</span>
                  ) : (
                    formatAddress(distribution.l2Wallet, 6)
                  )}
                </div>
              </div>
              <div className="text-right font-mono font-bold text-white text-sm">
                30.00 AIQX
              </div>
            </div>

            {/* Level 3 */}
            <div className="p-3.5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#F5A623]/60" />
                  <span>Level 3 (Third-Level Upline)</span>
                </div>
                <div className="text-[#8B949E] font-mono text-[11px] mt-0.5">
                  {distribution.l3IsSystemReserve ? (
                    <span className="text-amber-400">Missing — Allocated to System Reserve</span>
                  ) : (
                    formatAddress(distribution.l3Wallet, 6)
                  )}
                </div>
              </div>
              <div className="text-right font-mono font-bold text-white text-sm">
                5.00 AIQX
              </div>
            </div>

            {/* System Pool */}
            <div className="p-3.5 flex items-center justify-between bg-[#11161E]/40">
              <div>
                <div className="font-semibold text-white flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>System Pool Treasury</span>
                </div>
                <div className="text-[#8B949E] font-mono text-[11px] mt-0.5">
                  Fixed (15 AIQX) + Reserves ({distribution.totalSystemAmount - 15} AIQX)
                </div>
              </div>
              <div className="text-right font-mono font-bold text-[#F5A623] text-sm">
                {distribution.totalSystemAmount}.00 AIQX
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Progress */}
      {statusStep && (
        <div className="mb-6 p-4 rounded-lg bg-[#171D27] border border-[#1E2533] text-xs font-mono text-white flex items-center space-x-3">
          <Loader2 className="w-4 h-4 text-[#F5A623] animate-spin shrink-0" />
          <span>{statusStep}</span>
        </div>
      )}

      {/* Success Banner */}
      {successTx && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs space-y-2">
          <div className="flex items-center space-x-2 font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Registration Confirmed on Solana</span>
          </div>
          <div className="font-mono break-all text-[11px]">Signature: {successTx}</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          type="button"
          disabled={!distribution || isSubmitting || Boolean(validationError)}
          onClick={handleJoinNetwork}
          className="w-full py-4 rounded-lg bg-[#F5A623] hover:bg-[#e59917] disabled:opacity-50 disabled:cursor-not-allowed text-[#0B0E11] font-bold text-base transition-all shadow-[0_4px_16px_rgba(245,166,35,0.25)] flex items-center justify-center space-x-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing On-Chain...</span>
            </>
          ) : (
            <>
              <span>Approve & Join AIQX (100 AIQX)</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Devnet Testing Assistant */}
        <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#1E2533] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-[#8B949E]">
            <Sparkles className="w-4 h-4 text-[#F5A623]" />
            <span>Devnet Testing Mode Enabled</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleRequestDevnetSol}
              disabled={devnetAirdropping || !publicKey}
              className="px-2.5 py-1.5 rounded bg-[#171D27] hover:bg-[#1E2533] text-white font-mono text-[11px] border border-[#2D3648] transition-colors cursor-pointer"
            >
              {devnetAirdropping ? 'Airdropping...' : 'Get 1 Devnet SOL'}
            </button>
            <button
              type="button"
              onClick={handleDevnetSimulateJoin}
              disabled={isSubmitting || !distribution}
              className="px-2.5 py-1.5 rounded bg-[#171D27] hover:bg-[#1E2533] text-[#F5A623] font-mono text-[11px] border border-[#2D3648] transition-colors cursor-pointer"
            >
              Simulate Devnet Join
            </button>
          </div>
        </div>

        {devnetSuccessMessage && (
          <div className="p-2.5 rounded bg-[#11161E] border border-emerald-800/40 text-emerald-300 text-xs font-mono text-center">
            {devnetSuccessMessage}
          </div>
        )}
      </div>
    </div>
  );
};
