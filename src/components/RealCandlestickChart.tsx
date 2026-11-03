import React, { FC, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import {
  OhlcvCandle,
  PoolMetrics,
  calculateChartBounds,
  parseGeckoOhlcv,
  generateSyntheticHistory,
  enrichCandleSeries,
  VERIFIED_POOL_ADDRESS,
} from '../lib/marketData';

interface RealCandlestickChartProps {
  poolMetrics: PoolMetrics;
  onRefreshPool?: () => void;
}

type TimeframeOption = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

interface TimeframeConfig {
  tf: string;
  agg: string;
  limit: number;
  seconds: number;
}

const TIMEFRAME_MAP: Record<TimeframeOption, TimeframeConfig> = {
  '1m': { tf: 'minute', agg: '1', limit: 60, seconds: 60 },
  '5m': { tf: 'minute', agg: '5', limit: 60, seconds: 300 },
  '15m': { tf: 'minute', agg: '15', limit: 60, seconds: 900 },
  '1h': { tf: 'hour', agg: '1', limit: 60, seconds: 3600 },
  '4h': { tf: 'hour', agg: '4', limit: 60, seconds: 14400 },
  '1D': { tf: 'day', agg: '1', limit: 45, seconds: 86400 },
};

const DEFAULT_VISIBLE_CANDLES = 28;

export const RealCandlestickChart: FC<RealCandlestickChartProps> = ({
  poolMetrics,
  onRefreshPool,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('1h');
  const [chartMode, setChartMode] = useState<'candles' | 'line'>('candles');
  const [candles, setCandles] = useState<OhlcvCandle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hoveredCandle, setHoveredCandle] = useState<OhlcvCandle | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const [isLiveSource, setIsLiveSource] = useState<boolean>(true);

  // Zoom & Pan State
  const [visibleCount, setVisibleCount] = useState<number>(DEFAULT_VISIBLE_CANDLES);
  const [panOffset, setPanOffset] = useState<number>(0); // 0 = anchored to newest candle on right
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartX = useRef<number>(0);
  const dragStartPan = useRef<number>(0);
  const hasDragged = useRef<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 680, height: 320 });

  // Responsive dimension tracker
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          const newHeight = Math.max(260, Math.min(340, Math.floor(width * 0.46)));
          setDimensions({ width, height: newHeight });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch GeckoTerminal OHLCV
  const fetchCandles = useCallback(async () => {
    setIsLoading(true);
    const config = TIMEFRAME_MAP[selectedTimeframe];
    try {
      const res = await fetch(
        `/api/market/ohlcv?pool=${poolMetrics.address || VERIFIED_POOL_ADDRESS}&timeframe=${config.tf}&aggregate=${config.agg}&limit=${config.limit}`
      );
      const json = await res.json();

      if (json.success && Array.isArray(json.ohlcv) && json.ohlcv.length > 0) {
        const parsed = parseGeckoOhlcv(json.ohlcv);
        const enriched = enrichCandleSeries(parsed, 50, config.seconds);
        setCandles(enriched);
        setIsLiveSource(true);
      } else {
        const synth = generateSyntheticHistory(poolMetrics.baseTokenPriceUsd, config.limit, config.seconds);
        setCandles(synth);
        setIsLiveSource(false);
      }
    } catch (err) {
      console.warn('Error fetching candles:', err);
      const synth = generateSyntheticHistory(poolMetrics.baseTokenPriceUsd, config.limit, config.seconds);
      setCandles(synth);
      setIsLiveSource(false);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeframe, poolMetrics.address, poolMetrics.baseTokenPriceUsd]);

  // Reset pan when changing timeframe
  useEffect(() => {
    setPanOffset(0);
    fetchCandles();
    const interval = setInterval(fetchCandles, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [fetchCandles]);

  // Visible window computation for zoom & pan
  const totalCandles = candles.length;
  const clampedVisibleCount = Math.max(8, Math.min(totalCandles || DEFAULT_VISIBLE_CANDLES, visibleCount));
  const maxPan = Math.max(0, totalCandles - clampedVisibleCount);
  const clampedPan = Math.max(0, Math.min(maxPan, panOffset));

  const startIndex = Math.max(0, totalCandles - clampedVisibleCount - clampedPan);
  const endIndex = Math.min(totalCandles, startIndex + clampedVisibleCount);

  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    return candles.slice(startIndex, endIndex);
  }, [candles, startIndex, endIndex]);

  // Chart bounds dynamically calculated for the currently visible candles
  const { minPrice, maxPrice, maxVolume, priceRange } = useMemo(() => {
    return calculateChartBounds(visibleCandles);
  }, [visibleCandles]);

  const activeCandle = hoveredCandle || (visibleCandles.length > 0 ? visibleCandles[visibleCandles.length - 1] : null);

  const pricePercentChange = useMemo(() => {
    if (!activeCandle) return 0;
    const diff = activeCandle.close - activeCandle.open;
    return (diff / activeCandle.open) * 100;
  }, [activeCandle]);

  // Layout metrics
  const chartPadding = { top: 20, right: 65, bottom: 42, left: 10 };
  const plotWidth = Math.max(10, dimensions.width - chartPadding.left - chartPadding.right);
  const plotHeight = Math.max(10, dimensions.height - chartPadding.top - chartPadding.bottom);
  const volumeHeight = Math.floor(plotHeight * 0.22); // 22% for volume sub-bars
  const pricePlotHeight = plotHeight - volumeHeight - 8;

  const candleCount = visibleCandles.length;
  const candleStep = candleCount > 0 ? plotWidth / candleCount : 10;
  const candleBodyWidth = Math.max(3, Math.min(22, candleStep * 0.7));

  // Convert price to Y coord
  const priceToY = useCallback(
    (price: number) => {
      const ratio = (price - minPrice) / (priceRange || 1);
      return chartPadding.top + pricePlotHeight - ratio * pricePlotHeight;
    },
    [minPrice, priceRange, pricePlotHeight, chartPadding.top]
  );

  // Convert volume to Y coord
  const volumeToHeight = useCallback(
    (vol: number) => {
      const ratio = vol / (maxVolume || 1);
      return Math.max(2, ratio * volumeHeight);
    },
    [maxVolume, volumeHeight]
  );

  // Convert timestamp to human readable label
  const formatTimeLabel = (timestamp: number) => {
    const d = new Date(timestamp * 1000);
    if (selectedTimeframe === '1D') {
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setVisibleCount((prev) => Math.max(8, prev - 4));
  };

  const handleZoomOut = () => {
    setVisibleCount((prev) => Math.min(totalCandles || 60, prev + 4));
  };

  const handleResetZoom = () => {
    setVisibleCount(DEFAULT_VISIBLE_CANDLES);
    setPanOffset(0);
  };

  // Mouse wheel zoom handler
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      // Zoom in
      setVisibleCount((prev) => Math.max(8, prev - 3));
    } else if (e.deltaY > 0) {
      // Zoom out
      setVisibleCount((prev) => Math.min(totalCandles || 60, prev + 3));
    }
  };

  // Mouse drag handlers for panning
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only primary button
    dragStartX.current = e.clientX;
    dragStartPan.current = clampedPan;
    hasDragged.current = false;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX.current;
      if (Math.abs(deltaX) > 3) {
        hasDragged.current = true;
        // Dragging to the right reveals older candles (+ panOffset)
        // Dragging to the left reveals newer candles (- panOffset)
        const candleDelta = Math.round(deltaX / (candleStep || 10));
        setPanOffset(Math.max(0, Math.min(maxPan, dragStartPan.current + candleDelta)));
        setHoveredCandle(null);
        setHoverPos(null);
        return;
      }
    }

    // Normal hover inspection
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - chartPadding.left;
    const mouseY = e.clientY - rect.top;

    if (mouseX >= 0 && mouseX <= plotWidth && visibleCandles.length > 0) {
      const index = Math.floor(mouseX / candleStep);
      const clampedIndex = Math.max(0, Math.min(visibleCandles.length - 1, index));
      setHoveredCandle(visibleCandles[clampedIndex]);
      setHoverPos({
        x: chartPadding.left + (clampedIndex + 0.5) * candleStep,
        y: Math.max(chartPadding.top, Math.min(chartPadding.top + plotHeight, mouseY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredCandle(null);
    setHoverPos(null);
  };

  // Calculate smoothed path for line mode
  const linePath = useMemo(() => {
    if (visibleCandles.length < 2) return '';
    const points = visibleCandles.map((c, i) => {
      const x = chartPadding.left + (i + 0.5) * candleStep;
      const y = priceToY(c.close);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `M ${points.join(' L ')}`;
  }, [visibleCandles, candleStep, chartPadding.left, priceToY]);

  const lineAreaPath = useMemo(() => {
    if (!linePath || visibleCandles.length < 2) return '';
    const firstX = chartPadding.left + 0.5 * candleStep;
    const lastX = chartPadding.left + (visibleCandles.length - 0.5) * candleStep;
    const bottomY = chartPadding.top + pricePlotHeight;
    return `${linePath} L ${lastX.toFixed(1)},${bottomY} L ${firstX.toFixed(1)},${bottomY} Z`;
  }, [linePath, visibleCandles.length, candleStep, chartPadding.left, chartPadding.top, pricePlotHeight]);

  return (
    <div className="rounded-xl bg-[#11161E] border border-[#1E2533] overflow-hidden flex flex-col shadow-xl">
      {/* Top Header / Ticker Bar */}
      <div className="px-4 py-3 border-b border-[#1E2533] flex flex-wrap items-center justify-between gap-3 bg-[#0E1218]">
        {/* Pair Identity & Live Price */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-white text-base tracking-tight">AIQX / SOL</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#171D27] text-emerald-400 border border-emerald-900/40 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isLiveSource ? 'Live GeckoTerminal' : 'Direct Pool Feed'}</span>
            </span>
          </div>

          <div className="h-4 w-px bg-[#1E2533]" />

          <div className="flex items-baseline space-x-2 font-mono">
            <span className="text-lg font-extrabold text-white">
              ${(activeCandle?.close || poolMetrics.baseTokenPriceUsd).toFixed(6)}
            </span>
            <span
              className={`text-xs font-bold flex items-center ${
                pricePercentChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {pricePercentChange >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />
              )}
              {pricePercentChange >= 0 ? '+' : ''}
              {pricePercentChange.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Timeframe, Zoom, & Chart Mode Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Pills */}
          <div className="inline-flex rounded-lg bg-[#0B0E11] p-0.5 border border-[#1E2533] text-xs font-mono">
            {(['1m', '5m', '15m', '1h', '4h', '1D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSelectedTimeframe(tf)}
                className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                  selectedTimeframe === tf
                    ? 'bg-[#171D27] text-[#F5A623] font-bold shadow-sm'
                    : 'text-[#8B949E] hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Zoom In / Zoom Out Controls */}
          <div className="inline-flex items-center space-x-0.5 rounded-lg bg-[#0B0E11] p-0.5 border border-[#1E2533] text-xs font-mono">
            <button
              onClick={handleZoomIn}
              disabled={clampedVisibleCount <= 8}
              title="Zoom In (+)"
              className="p-1 rounded hover:bg-[#1E2533] text-[#8B949E] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              disabled={clampedVisibleCount >= totalCandles}
              title="Zoom Out (-)"
              className="p-1 rounded hover:bg-[#1E2533] text-[#8B949E] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom & Pan"
              className="p-1 rounded hover:bg-[#1E2533] text-[#8B949E] hover:text-[#F5A623] cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg bg-[#0B0E11] p-0.5 border border-[#1E2533] text-xs font-mono">
            <button
              onClick={() => setChartMode('candles')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                chartMode === 'candles'
                  ? 'bg-[#171D27] text-white font-bold'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Candles
            </button>
            <button
              onClick={() => setChartMode('line')}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                chartMode === 'line'
                  ? 'bg-[#171D27] text-white font-bold'
                  : 'text-[#8B949E] hover:text-white'
              }`}
            >
              Line
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => {
              fetchCandles();
              if (onRefreshPool) onRefreshPool();
            }}
            title="Refresh Live Chart"
            className="p-1.5 rounded-lg bg-[#0B0E11] text-[#8B949E] border border-[#1E2533] hover:text-[#F5A623] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#F5A623]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-time OHLCV Bar HUD & Pan Notice */}
      <div className="px-4 py-1.5 bg-[#0B0E11]/90 border-b border-[#1E2533] text-[11px] font-mono text-[#8B949E] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {activeCandle ? (
            <>
              <span>
                Time: <strong className="text-white">{new Date(activeCandle.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong>
              </span>
              <span>
                O: <strong className="text-white">${activeCandle.open.toFixed(6)}</strong>
              </span>
              <span>
                H: <strong className="text-white">${activeCandle.high.toFixed(6)}</strong>
              </span>
              <span>
                L: <strong className="text-white">${activeCandle.low.toFixed(6)}</strong>
              </span>
              <span>
                C:{' '}
                <strong className={activeCandle.isUp ? 'text-emerald-400' : 'text-rose-400'}>
                  ${activeCandle.close.toFixed(6)}
                </strong>
              </span>
              <span>
                Vol: <strong className="text-white">{activeCandle.volume.toLocaleString()} AIQX</strong>
              </span>
            </>
          ) : (
            <span>Streaming live candlesticks from Solana Dex AMM...</span>
          )}
        </div>

        {/* Back to Live button if panned back in time */}
        {clampedPan > 0 && (
          <button
            onClick={() => setPanOffset(0)}
            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-[#171D27] text-[#F5A623] border border-[#F5A623]/30 hover:bg-[#F5A623]/20 cursor-pointer transition-colors text-[10px]"
          >
            <span>Live Price</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        className="relative w-full bg-[#0B0E11] select-none flex-1 overflow-hidden"
        style={{ minHeight: dimensions.height }}
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: isDragging ? 'grabbing' : totalCandles > clampedVisibleCount ? 'grab' : 'crosshair' }}
          className="w-full h-full block"
        >
          <defs>
            <linearGradient id="chartLineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5A623" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#F5A623" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Subtle Horizontal Price Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = chartPadding.top + pricePlotHeight * (1 - pct);
            const price = minPrice + priceRange * pct;
            return (
              <g key={`grid-y-${i}`}>
                <line
                  x1={chartPadding.left}
                  y1={y}
                  x2={dimensions.width - chartPadding.right}
                  y2={y}
                  stroke="#171D27"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                {/* Price Y-Axis Label */}
                <text
                  x={dimensions.width - chartPadding.right + 6}
                  y={y + 3.5}
                  fill="#6E7681"
                  fontSize="9.5"
                  fontFamily="monospace"
                  textAnchor="start"
                >
                  ${price.toFixed(6)}
                </text>
              </g>
            );
          })}

          {/* Volume Sub-chart Divider Line */}
          <line
            x1={chartPadding.left}
            y1={chartPadding.top + pricePlotHeight + 4}
            x2={dimensions.width - chartPadding.right}
            y2={chartPadding.top + pricePlotHeight + 4}
            stroke="#1E2533"
            strokeWidth="1"
          />
          <text
            x={chartPadding.left + 4}
            y={chartPadding.top + pricePlotHeight + 14}
            fill="#484F58"
            fontSize="8.5"
            fontFamily="monospace"
          >
            VOL
          </text>

          {/* Volume Bars (Histogram at bottom) */}
          {visibleCandles.map((candle, idx) => {
            const centerX = chartPadding.left + (idx + 0.5) * candleStep;
            const barH = volumeToHeight(candle.volume);
            const barY = chartPadding.top + plotHeight - barH;
            return (
              <rect
                key={`vol-${candle.timestamp}-${idx}`}
                x={centerX - candleBodyWidth / 2}
                y={barY}
                width={candleBodyWidth}
                height={barH}
                fill={candle.isUp ? '#10B981' : '#F43F5E'}
                opacity={0.35}
                rx={1}
              />
            );
          })}

          {/* Candlestick Mode */}
          {chartMode === 'candles' &&
            visibleCandles.map((candle, idx) => {
              const centerX = chartPadding.left + (idx + 0.5) * candleStep;
              const yHigh = priceToY(candle.high);
              const yLow = priceToY(candle.low);
              const yOpen = priceToY(candle.open);
              const yClose = priceToY(candle.close);

              const bodyTop = Math.min(yOpen, yClose);
              const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
              const color = candle.isUp ? '#10B981' : '#F43F5E';

              return (
                <g key={`candle-${candle.timestamp}-${idx}`}>
                  {/* Upper/Lower Wick */}
                  <line
                    x1={centerX}
                    y1={yHigh}
                    x2={centerX}
                    y2={yLow}
                    stroke={color}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  {/* Candle Body */}
                  <rect
                    x={centerX - candleBodyWidth / 2}
                    y={bodyTop}
                    width={candleBodyWidth}
                    height={bodyHeight}
                    fill={color}
                    rx={1}
                  />
                </g>
              );
            })}

          {/* Line Mode */}
          {chartMode === 'line' && (
            <>
              {lineAreaPath && <path d={lineAreaPath} fill="url(#chartLineGrad)" />}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#F5A623"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </>
          )}

          {/* Time X-Axis Labels */}
          {visibleCandles.map((candle, idx) => {
            const stepSkip = Math.max(3, Math.floor(candleCount / 5));
            if (idx % stepSkip !== 0 && idx !== candleCount - 1) return null;
            const x = chartPadding.left + (idx + 0.5) * candleStep;
            return (
              <text
                key={`time-label-${candle.timestamp}-${idx}`}
                x={x}
                y={chartPadding.top + plotHeight + 16}
                fill="#6E7681"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {formatTimeLabel(candle.timestamp)}
              </text>
            );
          })}

          {/* Hover Crosshairs & Floating Price Badge */}
          {hoverPos && activeCandle && !isDragging && (
            <g pointerEvents="none">
              {/* Vertical Crosshair Line */}
              <line
                x1={hoverPos.x}
                y1={chartPadding.top}
                x2={hoverPos.x}
                y2={chartPadding.top + plotHeight}
                stroke="#8B949E"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Horizontal Crosshair Line */}
              <line
                x1={chartPadding.left}
                y1={priceToY(activeCandle.close)}
                x2={dimensions.width - chartPadding.right}
                y2={priceToY(activeCandle.close)}
                stroke="#8B949E"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Floating Price Badge on Y-Axis */}
              <g transform={`translate(${dimensions.width - chartPadding.right}, ${priceToY(activeCandle.close) - 9})`}>
                <rect
                  x="0"
                  y="0"
                  width="62"
                  height="18"
                  fill="#F5A623"
                  rx="3"
                />
                <text
                  x="31"
                  y="12.5"
                  fill="#0B0E11"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  ${activeCandle.close.toFixed(6)}
                </text>
              </g>

              {/* Floating Time Badge on X-Axis */}
              <g transform={`translate(${hoverPos.x - 30}, ${chartPadding.top + plotHeight + 4})`}>
                <rect
                  x="0"
                  y="0"
                  width="60"
                  height="16"
                  fill="#1E2533"
                  rx="3"
                />
                <text
                  x="30"
                  y="11.5"
                  fill="#E6EDF3"
                  fontSize="8.5"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {formatTimeLabel(activeCandle.timestamp)}
                </text>
              </g>

              {/* Glowing Indicator Dot on active candle close */}
              <circle
                cx={hoverPos.x}
                cy={priceToY(activeCandle.close)}
                r="3.5"
                fill="#FFFFFF"
                stroke="#F5A623"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
