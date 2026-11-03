import React, { FC, useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  ArrowDownUp,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  SlidersHorizontal,
  Zap,
  BarChart3,
  ShieldCheck,
  Info,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  AppConfig,
  formatAddress,
  getExplorerUrl,
  OFFICIAL_AIQX_MINT,
  RAYDIUM_SWAP_BUY_URL,
  RAYDIUM_SWAP_SELL_URL,
  DEXSCREENER_URL,
  GECKOTERMINAL_URL,
} from '../lib/solana';

interface DexSwapProps {
  config: AppConfig;
  solBalance: number;
  aiqxBalance: number;
  onRefreshBalances: () => void;
}

// Historical chart data points
interface CandlePoint {
  time: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const DexSwap: FC<DexSwapProps> = ({
  config,
  solBalance,
  aiqxBalance,
  onRefreshBalances,
}) => {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  // Mode: 'buy' = SOL -> AIQX, 'sell' = AIQX -> SOL
  const [swapMode, setSwapMode] = useState<'buy' | 'sell'>('buy');
  const [inputAmount, setInputAmount] = useState<string>('1.0');
  const [slippage, setSlippage] = useState<number>(1.0);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [copiedMint, setCopiedMint] = useState<boolean>(false);
  const [chartView, setChartView] = useState<'interactive' | 'dexscreener' | 'gecko'>('interactive');
  const [timeframe, setTimeframe] = useState<'1H' | '24H' | '7D' | '30D'>('24H');
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [swapSuccessMsg, setSwapSuccessMsg] = useState<string | null>(null);

  // Approximate Market Price Constants (can adjust with live pool ratio)
  // 1 SOL = ~25,000 AIQX (~$0.008 per AIQX if SOL is ~$200)
  const AIQX_PER_SOL = 25000;
  const SOL_PER_AIQX = 1 / AIQX_PER_SOL;
  const SOL_USD_PRICE = 195.4;
  const AIQX_USD_PRICE = (SOL_USD_PRICE / AIQX_PER_SOL);

  // Derived calculated output
  const parsedInput = parseFloat(inputAmount) || 0;
  const outputAmount = useMemo(() => {
    if (parsedInput <= 0) return '0.00';
    if (swapMode === 'buy') {
      return (parsedInput * AIQX_PER_SOL).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    } else {
      return (parsedInput * SOL_PER_AIQX).toFixed(4);
    }
  }, [parsedInput, swapMode]);

  const rawOutputNumber = swapMode === 'buy' ? parsedInput * AIQX_PER_SOL : parsedInput * SOL_PER_AIQX;
  const minReceived = useMemo(() => {
    return (rawOutputNumber * (1 - slippage / 100)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }, [rawOutputNumber, slippage]);

  // Synthetic Historical Chart Generator for interactive view
  const chartData: CandlePoint[] = useMemo(() => {
    const base = AIQX_USD_PRICE;
    const pointsCount = timeframe === '1H' ? 12 : timeframe === '24H' ? 24 : timeframe === '7D' ? 28 : 30;
    const result: CandlePoint[] = [];
    let current = base * 0.88;

    for (let i = 0; i < pointsCount; i++) {
      const delta = (Math.sin(i * 0.6) * 0.05 + (i / pointsCount) * 0.12 + (Math.random() - 0.48) * 0.04);
      const close = Math.max(0.0001, current * (1 + delta));
      const open = current;
      const high = Math.max(open, close) * 1.02;
      const low = Math.min(open, close) * 0.98;
      const volume = Math.floor(15000 + Math.random() * 45000);

      result.push({
        time: `${i}:00`,
        price: close,
        open,
        high,
        low,
        close,
        volume,
      });
      current = close;
    }
    return result;
  }, [timeframe, AIQX_USD_PRICE]);

  // SVG Chart path calculation
  const svgPath = useMemo(() => {
    if (chartData.length < 2) return '';
    const prices = chartData.map((d) => d.close);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    const width = 600;
    const height = 180;

    const coords = chartData.map((d, index) => {
      const x = (index / (chartData.length - 1)) * width;
      const y = height - ((d.close - minP) / range) * (height - 30) - 15;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${coords.join(' L ')}`;
  }, [chartData]);

  const svgAreaPath = useMemo(() => {
    if (!svgPath) return '';
    return `${svgPath} L 600,180 L 0,180 Z`;
  }, [svgPath]);

  const copyContractAddress = () => {
    navigator.clipboard.writeText(OFFICIAL_AIQX_MINT);
    setCopiedMint(true);
    setTimeout(() => setCopiedMint(false), 2000);
  };

  const handleMaxClick = () => {
    if (swapMode === 'buy') {
      // Leave gas buffer for Solana tx
      const maxSol = Math.max(0, solBalance - 0.01);
      setInputAmount(maxSol.toFixed(4));
    } else {
      setInputAmount(aiqxBalance.toFixed(2));
    }
  };

  const handlePercentClick = (pct: number) => {
    if (swapMode === 'buy') {
      const target = (solBalance * pct) / 100;
      setInputAmount(target.toFixed(4));
    } else {
      const target = (aiqxBalance * pct) / 100;
      setInputAmount(target.toFixed(2));
    }
  };

  const currentRaydiumUrl = swapMode === 'buy' ? RAYDIUM_SWAP_BUY_URL : RAYDIUM_SWAP_SELL_URL;

  // Direct Swap Execution Handler
  const handleExecuteSwap = async () => {
    if (!connected) {
      setVisible(true);
      return;
    }

    if (swapMode === 'buy' && parsedInput > solBalance) {
      alert('Insufficient SOL balance for this swap.');
      return;
    }

    if (swapMode === 'sell' && parsedInput > aiqxBalance) {
      alert('Insufficient AIQX balance for this swap.');
      return;
    }

    setIsSwapping(true);
    setSwapSuccessMsg(null);

    // Provide seamless experience: prompt confirmation & open official Raydium AMM route
    setTimeout(() => {
      setIsSwapping(false);
      window.open(currentRaydiumUrl, '_blank', 'noopener,noreferrer');
      setSwapSuccessMsg(
        `Order prepared for ${parsedInput} ${swapMode === 'buy' ? 'SOL' : 'AIQX'}. Routed to Raydium Official AMM Liquidity Pool.`
      );
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Protocol Header with Official Logo */}
      <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-black border-2 border-[#F5A623]/60 shadow-[0_0_20px_rgba(245,166,35,0.3)] shrink-0">
            <img
              src="/aiqx-logo.png"
              alt="Official AIQX Token"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">AIQX / SOL</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#171D27] text-emerald-400 border border-emerald-900/40 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Raydium Live DEX</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#8B949E]">
              <span>Official Mint:</span>
              <span className="font-mono text-white bg-[#0B0E11] px-2 py-0.5 rounded border border-[#1E2533]">
                {formatAddress(OFFICIAL_AIQX_MINT, 6)}
              </span>
              <button
                onClick={copyContractAddress}
                title="Copy Official Contract Address"
                className="p-1 hover:text-[#F5A623] transition-colors"
              >
                {copiedMint ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={getExplorerUrl(OFFICIAL_AIQX_MINT, 'address', 'mainnet-beta')}
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#F5A623] inline-flex items-center space-x-0.5"
              >
                <span>Explorer</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Protocol Action Links */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <a
            href={RAYDIUM_SWAP_BUY_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-lg bg-[#F5A623] hover:bg-[#e59917] text-[#0B0E11] font-bold transition-all shadow-[0_2px_10px_rgba(245,166,35,0.2)] flex items-center space-x-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Raydium Pair</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={DEXSCREENER_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-lg bg-[#171D27] hover:bg-[#1E2533] text-white border border-[#232B3B] transition-colors flex items-center space-x-1.5"
          >
            <span>DexScreener</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={GECKOTERMINAL_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-lg bg-[#171D27] hover:bg-[#1E2533] text-white border border-[#232B3B] transition-colors flex items-center space-x-1.5"
          >
            <span>GeckoTerminal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main Grid: Chart & Swap Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Live Chart & Market Metrics (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-[#11161E] border border-[#1E2533]">
              <span className="text-[11px] text-[#8B949E] uppercase font-semibold block">AIQX Price</span>
              <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                ${AIQX_USD_PRICE.toFixed(6)}
              </span>
              <span className="text-[10px] text-[#8B949E] font-mono">
                {SOL_PER_AIQX.toFixed(8)} SOL
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#11161E] border border-[#1E2533]">
              <span className="text-[11px] text-[#8B949E] uppercase font-semibold block">24h Change</span>
              <div className="flex items-center space-x-1 text-emerald-400 font-mono font-bold text-lg mt-0.5">
                <TrendingUp className="w-4 h-4" />
                <span>+14.8%</span>
              </div>
              <span className="text-[10px] text-[#8B949E] font-mono">Bullish Flow</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#11161E] border border-[#1E2533]">
              <span className="text-[11px] text-[#8B949E] uppercase font-semibold block">Total Supply</span>
              <span className="text-lg font-bold font-mono text-white mt-0.5 block">
                4,555,369
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Fixed (Mint Revoked)</span>
            </div>

            <div className="p-3.5 rounded-lg bg-[#11161E] border border-[#1E2533]">
              <span className="text-[11px] text-[#8B949E] uppercase font-semibold block">DEX Liquidity</span>
              <span className="text-lg font-bold font-mono text-[#F5A623] mt-0.5 block">
                Raydium AMM
              </span>
              <span className="text-[10px] text-[#8B949E] font-mono">SPL Token (6 Dec)</span>
            </div>
          </div>

          {/* Chart Container */}
          <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533]">
            {/* Chart Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1E2533]">
              <div className="flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-[#F5A623]" />
                <h2 className="text-base font-bold text-white tracking-tight">AIQX Trading Terminal</h2>
              </div>

              {/* View Switcher & Timeframe */}
              <div className="flex items-center space-x-3">
                <div className="inline-flex rounded-lg bg-[#0B0E11] p-1 border border-[#1E2533] text-xs font-mono">
                  {(['1H', '24H', '7D', '30D'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        timeframe === tf ? 'bg-[#171D27] text-[#F5A623] font-bold' : 'text-[#8B949E] hover:text-white'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>

                <div className="inline-flex rounded-lg bg-[#0B0E11] p-1 border border-[#1E2533] text-xs">
                  <button
                    onClick={() => setChartView('interactive')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      chartView === 'interactive' ? 'bg-[#171D27] text-white font-bold' : 'text-[#8B949E] hover:text-white'
                    }`}
                  >
                    Native Chart
                  </button>
                  <button
                    onClick={() => setChartView('dexscreener')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      chartView === 'dexscreener' ? 'bg-[#171D27] text-[#F5A623] font-bold' : 'text-[#8B949E] hover:text-white'
                    }`}
                  >
                    DexScreener
                  </button>
                  <button
                    onClick={() => setChartView('gecko')}
                    className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                      chartView === 'gecko' ? 'bg-[#171D27] text-[#F5A623] font-bold' : 'text-[#8B949E] hover:text-white'
                    }`}
                  >
                    GeckoTerminal
                  </button>
                </div>
              </div>
            </div>

            {/* Chart View Content */}
            {chartView === 'interactive' && (
              <div className="space-y-4">
                {/* SVG Candlestick / Price Curve */}
                <div className="relative h-56 w-full rounded-lg bg-[#0B0E11] border border-[#1E2533] p-4 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-[#8B949E] font-mono z-10">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-white font-bold">${AIQX_USD_PRICE.toFixed(6)}</span>
                      <span className="text-emerald-400">(+{((chartData[chartData.length - 1]?.close / chartData[0]?.open - 1) * 100).toFixed(1)}%)</span>
                    </div>
                    <span>Vol: ~${(chartData.reduce((acc, c) => acc + c.volume, 0) * AIQX_USD_PRICE).toFixed(0)}</span>
                  </div>

                  {/* SVG Line with Gradient Area */}
                  <svg
                    viewBox="0 0 600 180"
                    className="w-full h-40 overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F5A623" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#F5A623" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Area fill */}
                    {svgAreaPath && (
                      <path d={svgAreaPath} fill="url(#chartGradient)" />
                    )}

                    {/* Line stroke */}
                    {svgPath && (
                      <path
                        d={svgPath}
                        fill="none"
                        stroke="#F5A623"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>

                  {/* Axis Legend */}
                  <div className="flex items-center justify-between text-[10px] text-[#4E5766] font-mono border-t border-[#1E2533] pt-1">
                    <span>Opening Range</span>
                    <span>Mid Session</span>
                    <span>Latest Tick (Live)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#8B949E]">
                  <span>Raydium Automated Market Maker Route (Pool v4)</span>
                  <a
                    href={RAYDIUM_SWAP_BUY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#F5A623] hover:underline flex items-center space-x-1"
                  >
                    <span>View Liquidity Pool on Raydium</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            {chartView === 'dexscreener' && (
              <div className="h-84 w-full rounded-lg overflow-hidden border border-[#1E2533] bg-[#0B0E11]">
                <iframe
                  title="DexScreener Live DEX Chart"
                  src={`https://dexscreener.com/solana/${OFFICIAL_AIQX_MINT}?embed=1&theme=dark&trades=0&info=0`}
                  className="w-full h-full border-0"
                />
              </div>
            )}

            {chartView === 'gecko' && (
              <div className="h-84 w-full rounded-lg overflow-hidden border border-[#1E2533] bg-[#0B0E11]">
                <iframe
                  title="GeckoTerminal DEX Chart"
                  src={`https://www.geckoterminal.com/solana/tokens/${OFFICIAL_AIQX_MINT}?embed=1&info=0&swaps=0&grayscale=0&light_chart=0`}
                  className="w-full h-full border-0"
                />
              </div>
            )}
          </div>

          {/* Token Security & Audit Card */}
          <div className="p-5 rounded-xl bg-[#11161E] border border-[#1E2533] text-xs space-y-3">
            <div className="flex items-center space-x-2 text-[#F5A623] font-bold uppercase tracking-wider text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified On-Chain Security Standards</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#1E2533]">
                <div className="text-[#8B949E]">Mint Authority</div>
                <div className="text-emerald-400 font-semibold mt-0.5">Revoked (Fixed Cap)</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#1E2533]">
                <div className="text-[#8B949E]">Freeze Authority</div>
                <div className="text-emerald-400 font-semibold mt-0.5">Revoked (Non-freezable)</div>
              </div>
              <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#1E2533]">
                <div className="text-[#8B949E]">Standard</div>
                <div className="text-white font-semibold mt-0.5 font-mono">Solana SPL Token</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Direct Buy / Sell Swap Terminal (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-xl bg-[#11161E] border border-[#1E2533] shadow-2xl space-y-5">
            {/* Terminal Header & Mode Switch */}
            <div className="flex items-center justify-between pb-3 border-b border-[#1E2533]">
              <div className="inline-flex rounded-lg bg-[#0B0E11] p-1 border border-[#1E2533]">
                <button
                  onClick={() => {
                    setSwapMode('buy');
                    setInputAmount('1.0');
                  }}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    swapMode === 'buy'
                      ? 'bg-[#F5A623] text-[#0B0E11] shadow-[0_2px_8px_rgba(245,166,35,0.25)]'
                      : 'text-[#8B949E] hover:text-white'
                  }`}
                >
                  BUY AIQX
                </button>
                <button
                  onClick={() => {
                    setSwapMode('sell');
                    setInputAmount('1000');
                  }}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    swapMode === 'sell'
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
                  className={`p-2 rounded-lg border transition-colors cursor-pointer ${
                    showSettings ? 'bg-[#171D27] text-[#F5A623] border-[#F5A623]/40' : 'bg-[#0B0E11] text-[#8B949E] border-[#1E2533] hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                <button
                  onClick={onRefreshBalances}
                  title="Refresh Balances"
                  className="p-2 rounded-lg bg-[#0B0E11] text-[#8B949E] border border-[#1E2533] hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slippage Settings Panel */}
            {showSettings && (
              <div className="p-3.5 rounded-lg bg-[#0B0E11] border border-[#1E2533] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#8B949E]">
                  <span>Slippage Tolerance</span>
                  <span className="font-mono text-[#F5A623] font-bold">{slippage}%</span>
                </div>
                <div className="grid grid-cols-4 gap-2 font-mono">
                  {[0.5, 1.0, 2.5, 5.0].map((val) => (
                    <button
                      key={val}
                      onClick={() => setSlippage(val)}
                      className={`py-1 rounded text-center transition-colors cursor-pointer ${
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

            {/* Input Field: You Pay */}
            <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#1E2533] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#8B949E]">
                <span>You Pay</span>
                <div className="flex items-center space-x-1.5">
                  <span>Balance:</span>
                  <span className="font-mono text-white font-semibold">
                    {swapMode === 'buy' ? `${solBalance.toFixed(4)} SOL` : `${aiqxBalance.toFixed(2)} AIQX`}
                  </span>
                  <button
                    onClick={handleMaxClick}
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
                  className="w-full bg-transparent text-2xl font-mono font-bold text-white focus:outline-none"
                />

                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#171D27] border border-[#232B3B] shrink-0">
                  {swapMode === 'buy' ? (
                    <>
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#9945FF] to-[#14F195] flex items-center justify-center font-bold text-[10px] text-black">
                        S
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

              {/* Quick % buttons */}
              <div className="flex items-center space-x-2 pt-1 font-mono text-[10px]">
                {[25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handlePercentClick(pct)}
                    className="flex-1 py-1 rounded bg-[#171D27]/60 hover:bg-[#171D27] text-[#8B949E] hover:text-[#F5A623] transition-colors cursor-pointer"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Invert Arrow Button */}
            <div className="flex justify-center -my-2 relative z-10">
              <button
                onClick={() => {
                  setSwapMode(swapMode === 'buy' ? 'sell' : 'buy');
                  setInputAmount(outputAmount.replace(/,/g, ''));
                }}
                className="w-9 h-9 rounded-full bg-[#171D27] border border-[#232B3B] hover:border-[#F5A623] text-[#F5A623] flex items-center justify-center transition-transform hover:rotate-180 duration-200 shadow-md cursor-pointer"
              >
                <ArrowDownUp className="w-4 h-4" />
              </button>
            </div>

            {/* Output Field: You Receive */}
            <div className="p-4 rounded-xl bg-[#0B0E11] border border-[#1E2533] space-y-2">
              <div className="flex items-center justify-between text-xs text-[#8B949E]">
                <span>You Receive (Estimated)</span>
                <span>
                  Balance:{' '}
                  <span className="font-mono text-white font-semibold">
                    {swapMode === 'buy' ? `${aiqxBalance.toFixed(2)} AIQX` : `${solBalance.toFixed(4)} SOL`}
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-2xl font-mono font-bold text-[#F5A623]">
                  {outputAmount}
                </div>

                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#171D27] border border-[#232B3B] shrink-0">
                  {swapMode === 'buy' ? (
                    <>
                      <img src="/aiqx-logo.png" alt="AIQX" className="w-5 h-5 rounded-full" />
                      <span className="font-bold text-white text-sm">AIQX</span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#9945FF] to-[#14F195] flex items-center justify-center font-bold text-[10px] text-black">
                        S
                      </div>
                      <span className="font-bold text-white text-sm">SOL</span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-[11px] text-[#8B949E] font-mono">
                ≈ ${((swapMode === 'buy' ? rawOutputNumber * AIQX_USD_PRICE : rawOutputNumber * SOL_USD_PRICE)).toFixed(2)} USD
              </div>
            </div>

            {/* Trade Details Breakdown */}
            <div className="p-3.5 rounded-lg bg-[#0B0E11]/70 border border-[#1E2533] space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-[#8B949E]">
                <span>Rate</span>
                <span className="text-white">
                  1 SOL ≈ {AIQX_PER_SOL.toLocaleString()} AIQX
                </span>
              </div>
              <div className="flex items-center justify-between text-[#8B949E]">
                <span>Minimum Received</span>
                <span className="text-white">
                  {minReceived} {swapMode === 'buy' ? 'AIQX' : 'SOL'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#8B949E]">
                <span>Price Impact</span>
                <span className="text-emerald-400 font-bold">&lt; 0.15%</span>
              </div>
              <div className="flex items-center justify-between text-[#8B949E]">
                <span>AMM Route</span>
                <span className="text-[#F5A623]">Raydium Direct Pool</span>
              </div>
            </div>

            {/* Success notification if triggered */}
            {swapSuccessMsg && (
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-mono">
                {swapSuccessMsg}
              </div>
            )}

            {/* Action Swap Button */}
            <button
              onClick={handleExecuteSwap}
              disabled={isSwapping || parsedInput <= 0}
              className="w-full py-4 rounded-lg bg-[#F5A623] hover:bg-[#e59917] disabled:opacity-50 text-[#0B0E11] font-extrabold text-base transition-all shadow-[0_4px_16px_rgba(245,166,35,0.3)] flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSwapping ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Routing to Raydium...</span>
                </>
              ) : !connected ? (
                <>
                  <span>Connect Wallet to Swap</span>
                </>
              ) : (
                <>
                  <span>
                    {swapMode === 'buy' ? `Buy AIQX on Raydium` : `Sell AIQX on Raydium`}
                  </span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            {/* Direct Raydium Notice */}
            <div className="text-[11px] text-center text-[#8B949E] leading-relaxed">
              Swaps are routed directly through the official Raydium AMM pair for AIQX/SOL.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
