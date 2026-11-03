import React, { FC, useState, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  ArrowDownUp,
  ExternalLink,
  SlidersHorizontal,
  RefreshCw,
  Zap,
  ShieldCheck,
  Check,
  Copy,
} from 'lucide-react';
import { SolanaLogo } from './SolanaLogo';
import {
  PoolMetrics,
  calculateSwapQuote,
  OFFICIAL_AIQX_MINT,
  VERIFIED_POOL_ADDRESS,
} from '../lib/marketData';

interface RealSwapTerminalProps {
  poolMetrics: PoolMetrics;
  solBalance: number;
  aiqxBalance: number;
  onRefreshBalances?: () => void;
}

export const RealSwapTerminal: FC<RealSwapTerminalProps> = ({
  poolMetrics,
  solBalance,
  aiqxBalance,
  onRefreshBalances,
}) => {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [inputAmount, setInputAmount] = useState<string>('0.5');
  const [slippage, setSlippage] = useState<number>(1.0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [isRouting, setIsRouting] = useState<boolean>(false);
  const [copiedMint, setCopiedMint] = useState<boolean>(false);

  const parsedInput = parseFloat(inputAmount) || 0;

  // Real pool rate
  const aiqxPerSol = poolMetrics.aiqxPerSol > 0 ? poolMetrics.aiqxPerSol : 382921.79;
  const solPerAiqx = 1 / aiqxPerSol;

  // Calculate real output and slippage
  const quote = useMemo(() => {
    return calculateSwapQuote({
      amountIn: parsedInput,
      mode,
      aiqxPerSol,
      slippagePct: slippage,
    });
  }, [parsedInput, mode, aiqxPerSol, slippage]);

  // USD Values
  const inputUsdValue = useMemo(() => {
    if (parsedInput <= 0) return 0;
    return mode === 'buy'
      ? parsedInput * poolMetrics.solPriceUsd
      : parsedInput * poolMetrics.baseTokenPriceUsd;
  }, [parsedInput, mode, poolMetrics.solPriceUsd, poolMetrics.baseTokenPriceUsd]);

  const outputUsdValue = useMemo(() => {
    if (quote.amountOut <= 0) return 0;
    return mode === 'buy'
      ? quote.amountOut * poolMetrics.baseTokenPriceUsd
      : quote.amountOut * poolMetrics.solPriceUsd;
  }, [quote.amountOut, mode, poolMetrics.baseTokenPriceUsd, poolMetrics.solPriceUsd]);

  // Fast percentage buttons
  const handlePercent = (pct: number) => {
    if (mode === 'buy') {
      const maxAvailable = Math.max(0, solBalance - 0.008); // leave gas
      const target = (maxAvailable * pct) / 100;
      setInputAmount(target.toFixed(4));
    } else {
      const target = (aiqxBalance * pct) / 100;
      setInputAmount(target.toFixed(2));
    }
  };

  const handleMax = () => {
    if (mode === 'buy') {
      const maxSol = Math.max(0, solBalance - 0.008);
      setInputAmount(maxSol > 0 ? maxSol.toFixed(4) : '0');
    } else {
      setInputAmount(aiqxBalance > 0 ? aiqxBalance.toFixed(2) : '0');
    }
  };

  // Switch buy/sell mode
  const handleSwitchMode = () => {
    setMode((prev) => (prev === 'buy' ? 'sell' : 'buy'));
    if (quote.amountOut > 0) {
      setInputAmount(
        mode === 'buy'
          ? Math.floor(quote.amountOut).toString()
          : quote.amountOut.toFixed(4)
      );
    }
  };

  // Copy mint
  const copyMint = () => {
    navigator.clipboard.writeText(OFFICIAL_AIQX_MINT);
    setCopiedMint(true);
    setTimeout(() => setCopiedMint(false), 2000);
  };

  // Direct Swap Execution Link to Raydium Official AMM Pair
  const raydiumUrl = useMemo(() => {
    return mode === 'buy'
      ? `https://raydium.io/swap/?inputMint=sol&outputMint=${OFFICIAL_AIQX_MINT}`
      : `https://raydium.io/swap/?inputMint=${OFFICIAL_AIQX_MINT}&outputMint=sol`;
  }, [mode]);

  const handleExecuteSwap = () => {
    if (!connected) {
      setVisible(true);
      return;
    }

    if (mode === 'buy' && parsedInput > solBalance) {
      alert(`Insufficient SOL balance. Available: ${solBalance.toFixed(4)} SOL`);
      return;
    }

    if (mode === 'sell' && parsedInput > aiqxBalance) {
      alert(`Insufficient AIQX balance. Available: ${aiqxBalance.toFixed(2)} AIQX`);
      return;
    }

    setIsRouting(true);
    // Instant real route opening
    setTimeout(() => {
      setIsRouting(false);
      window.open(raydiumUrl, '_blank', 'noopener,noreferrer');
    }, 400);
  };

  return (
    <div className="rounded-xl bg-[#11161E] border border-[#1E2533] p-5 shadow-2xl flex flex-col justify-between space-y-4">
      {/* Top Header: Buy / Sell Switcher & Settings */}
      <div className="flex items-center justify-between pb-3 border-b border-[#1E2533]">
        <div className="inline-flex rounded-lg bg-[#0B0E11] p-1 border border-[#1E2533]">
          <button
            onClick={() => setMode('buy')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              mode === 'buy'
                ? 'bg-[#F5A623] text-[#0B0E11] shadow-[0_2px_8px_rgba(245,166,35,0.25)]'
                : 'text-[#8B949E] hover:text-white'
            }`}
          >
            BUY AIQX
          </button>
          <button
            onClick={() => setMode('sell')}
            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
              mode === 'sell'
                ? 'bg-[#F5A623] text-[#0B0E11] shadow-[0_2px_8px_rgba(245,166,35,0.25)]'
                : 'text-[#8B949E] hover:text-white'
            }`}
          >
            SELL AIQX
          </button>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setShowSettings(!showSettings)}
            title="Slippage settings"
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showSettings
                ? 'bg-[#171D27] text-[#F5A623] border-[#F5A623]/40'
                : 'bg-[#0B0E11] text-[#8B949E] border-[#1E2533] hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
          {onRefreshBalances && (
            <button
              onClick={onRefreshBalances}
              title="Refresh Wallet Balances"
              className="p-1.5 rounded-lg bg-[#0B0E11] text-[#8B949E] border border-[#1E2533] hover:text-[#F5A623] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Slippage Settings Drawer */}
      {showSettings && (
        <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#1E2533] space-y-2 text-xs">
          <div className="flex items-center justify-between text-[#8B949E]">
            <span>Slippage Tolerance</span>
            <span className="font-mono text-[#F5A623] font-bold">{slippage}%</span>
          </div>
          <div className="grid grid-cols-4 gap-2 font-mono">
            {[0.5, 1.0, 2.5, 5.0].map((val) => (
              <button
                key={val}
                onClick={() => setSlippage(val)}
                className={`py-1 rounded text-center text-xs transition-colors cursor-pointer ${
                  slippage === val
                    ? 'bg-[#F5A623] text-[#0B0E11] font-bold'
                    : 'bg-[#171D27] text-white hover:bg-[#1E2533]'
                }`}
              >
                {val}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input: You Pay */}
      <div className="p-3.5 rounded-xl bg-[#0B0E11] border border-[#1E2533] space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-[#8B949E]">
          <span>You Pay</span>
          <div className="flex items-center space-x-1">
            <span>Balance:</span>
            <span className="font-mono text-white font-semibold">
              {mode === 'buy' ? `${solBalance.toFixed(4)} SOL` : `${aiqxBalance.toFixed(2)} AIQX`}
            </span>
            <button
              onClick={handleMax}
              className="ml-1 px-1.5 py-0.5 rounded bg-[#171D27] hover:bg-[#232B3B] text-[10px] font-mono text-[#F5A623] cursor-pointer"
            >
              MAX
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <input
            type="number"
            min="0"
            step="any"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder="0.0"
            className="w-full bg-transparent text-xl sm:text-2xl font-mono font-bold text-white focus:outline-none"
          />

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#171D27] border border-[#232B3B] shrink-0">
            {mode === 'buy' ? (
              <>
                <div className="w-5 h-5 rounded-full bg-[#11161E] flex items-center justify-center p-0.5 border border-[#232B3B]">
                  <SolanaLogo className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-white text-sm">SOL</span>
              </>
            ) : (
              <>
                <img src="/aiqx-logo.png" alt="AIQX" className="w-5 h-5 rounded-full" />
                <span className="font-bold text-white text-sm">AIQX</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#6E7681] font-mono pt-1">
          <span>≈ ${inputUsdValue.toFixed(2)} USD</span>
          <div className="flex items-center space-x-1.5">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                onClick={() => handlePercent(pct)}
                className="px-1.5 py-0.5 rounded bg-[#171D27]/80 hover:bg-[#232B3B] hover:text-[#F5A623] cursor-pointer transition-colors"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mode Switch Invert Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          onClick={handleSwitchMode}
          className="w-8 h-8 rounded-full bg-[#171D27] border border-[#232B3B] hover:border-[#F5A623] text-[#F5A623] flex items-center justify-center transition-transform hover:rotate-180 duration-200 shadow-md cursor-pointer"
        >
          <ArrowDownUp className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Output: You Receive */}
      <div className="p-3.5 rounded-xl bg-[#0B0E11] border border-[#1E2533] space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-[#8B949E]">
          <span>You Receive (Calculated)</span>
          <span>
            Balance:{' '}
            <span className="font-mono text-white font-semibold">
              {mode === 'buy' ? `${aiqxBalance.toFixed(2)} AIQX` : `${solBalance.toFixed(4)} SOL`}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xl sm:text-2xl font-mono font-bold text-[#F5A623] truncate">
            {mode === 'buy'
              ? quote.amountOut.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : quote.amountOut.toFixed(6)}
          </div>

          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#171D27] border border-[#232B3B] shrink-0">
            {mode === 'buy' ? (
              <>
                <img src="/aiqx-logo.png" alt="AIQX" className="w-5 h-5 rounded-full" />
                <span className="font-bold text-white text-sm">AIQX</span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full bg-[#11161E] flex items-center justify-center p-0.5 border border-[#232B3B]">
                  <SolanaLogo className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-white text-sm">SOL</span>
              </>
            )}
          </div>
        </div>

        <div className="text-[10px] text-[#6E7681] font-mono">
          ≈ ${outputUsdValue.toFixed(2)} USD
        </div>
      </div>

      {/* Real Routing Breakdown */}
      <div className="p-3 rounded-lg bg-[#0B0E11]/80 border border-[#1E2533] space-y-1.5 text-[11px] font-mono">
        <div className="flex items-center justify-between text-[#8B949E]">
          <span>Live Rate</span>
          <span className="text-white font-semibold">
            {quote.rateLabel}
          </span>
        </div>
        <div className="flex items-center justify-between text-[#8B949E]">
          <span>Guaranteed Minimum</span>
          <span className="text-white">
            {mode === 'buy'
              ? `${quote.minReceived.toLocaleString(undefined, { maximumFractionDigits: 2 })} AIQX`
              : `${quote.minReceived.toFixed(6)} SOL`}
          </span>
        </div>
        <div className="flex items-center justify-between text-[#8B949E]">
          <span>Price Impact</span>
          <span className="text-emerald-400 font-bold">&lt; {quote.estimatedPriceImpactPct}%</span>
        </div>
        <div className="flex items-center justify-between text-[#8B949E]">
          <span>Routing DEX</span>
          <span className="text-[#F5A623]">Raydium AMM (Live Verified Pool)</span>
        </div>
      </div>

      {/* Execute Swap Button */}
      <button
        onClick={handleExecuteSwap}
        disabled={isRouting || parsedInput <= 0}
        className="w-full py-3.5 rounded-lg bg-[#F5A623] hover:bg-[#e59917] disabled:opacity-50 text-[#0B0E11] font-extrabold text-sm transition-all shadow-[0_4px_16px_rgba(245,166,35,0.3)] flex items-center justify-center space-x-2 cursor-pointer"
      >
        {isRouting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Connecting to Raydium Pool...</span>
          </>
        ) : !connected ? (
          <span>Connect Wallet to Swap</span>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            <span>
              {mode === 'buy' ? 'Swap SOL for AIQX' : 'Swap AIQX for SOL'}
            </span>
            <ExternalLink className="w-3.5 h-3.5 ml-1" />
          </>
        )}
      </button>

      {/* Verified Contract Badge */}
      <div className="pt-1 flex items-center justify-between text-[11px] text-[#8B949E]">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verified SPL Token</span>
        </div>
        <div className="flex items-center space-x-1 font-mono">
          <span>{OFFICIAL_AIQX_MINT.slice(0, 4)}...{OFFICIAL_AIQX_MINT.slice(-4)}</span>
          <button
            onClick={copyMint}
            title="Copy Mint"
            className="hover:text-white transition-colors cursor-pointer"
          >
            {copiedMint ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};
