import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseGeckoOhlcv,
  calculateChartBounds,
  calculateSwapQuote,
  generateSyntheticHistory,
  enrichCandleSeries,
} from './marketData';

test('enrichCandleSeries expands sparse candles to target count', () => {
  const sparse = [
    { timestamp: 1700003600, open: 0.00025, high: 0.00028, low: 0.00024, close: 0.00027, volume: 500, isUp: true }
  ];
  const enriched = enrichCandleSeries(sparse, 20, 3600);
  assert.equal(enriched.length, 20);
  // Last element must be the real live candle
  assert.equal(enriched[enriched.length - 1].timestamp, 1700003600);
  assert.equal(enriched[enriched.length - 1].close, 0.00027);
});

test('parseGeckoOhlcv sorts candles ascending and assigns isUp accurately', () => {
  const rawData = [
    [1700003600, 0.00025, 0.00028, 0.00024, 0.00027, 500], // isUp: true
    [1700000000, 0.00026, 0.00029, 0.00023, 0.00024, 800], // isUp: false
  ];

  const parsed = parseGeckoOhlcv(rawData);
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].timestamp, 1700000000); // Earliest first
  assert.equal(parsed[0].isUp, false); // 0.00024 < 0.00026
  assert.equal(parsed[1].timestamp, 1700003600);
  assert.equal(parsed[1].isUp, true); // 0.00027 >= 0.00025
});

test('calculateChartBounds calculates range and prevents flat zero division', () => {
  const candles = [
    { timestamp: 1, open: 0.0002, high: 0.0003, low: 0.00018, close: 0.00025, volume: 100, isUp: true },
    { timestamp: 2, open: 0.00025, high: 0.00035, low: 0.00022, close: 0.00032, volume: 250, isUp: true },
  ];

  const bounds = calculateChartBounds(candles);
  assert.ok(bounds.minPrice < 0.00018);
  assert.ok(bounds.maxPrice > 0.00035);
  assert.equal(bounds.maxVolume, 250);
  assert.ok(bounds.priceRange > 0);
});

test('calculateSwapQuote computes buy and sell amounts with slippage deduction', () => {
  const rate = 380000; // 1 SOL = 380,000 AIQX

  // 1 SOL Buy with 1% slippage
  const buyQuote = calculateSwapQuote({
    amountIn: 1,
    mode: 'buy',
    aiqxPerSol: rate,
    slippagePct: 1,
  });
  assert.equal(buyQuote.amountOut, 380000);
  assert.equal(buyQuote.minReceived, 376200); // 380000 * 0.99
  assert.ok(buyQuote.estimatedPriceImpactPct > 0);

  // 380,000 AIQX Sell with 2% slippage
  const sellQuote = calculateSwapQuote({
    amountIn: 380000,
    mode: 'sell',
    aiqxPerSol: rate,
    slippagePct: 2,
  });
  assert.equal(sellQuote.amountOut, 1);
  assert.equal(sellQuote.minReceived, 0.98); // 1 * 0.98
});

test('generateSyntheticHistory generates valid candle sequences', () => {
  const candles = generateSyntheticHistory(0.00026, 20, 3600);
  assert.equal(candles.length, 20);
  assert.ok(candles[0].timestamp < candles[19].timestamp);
  for (const c of candles) {
    assert.ok(c.high >= c.low);
    assert.ok(c.high >= Math.max(c.open, c.close));
    assert.ok(c.low <= Math.min(c.open, c.close));
    assert.ok(c.volume > 0);
  }
});
