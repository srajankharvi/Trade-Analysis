import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart, ColorType, CrosshairMode, CandlestickSeries, LineSeries, HistogramSeries,
} from 'lightweight-charts';
import type { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  CandlestickChart, LineChart as LineChartIcon, AreaChart, Maximize, RotateCcw,
  Activity, TrendingUp, TrendingDown, Target, PanelRightClose, PanelRightOpen, ArrowLeft
} from 'lucide-react';
import './TradingChart.css';

// ──────────────────────────── Constants ────────────────────────────
const SYMBOLS = [
  { symbol: 'BTCUSDT', name: 'BTC/USDT', base: 'BTC' },
  { symbol: 'ETHUSDT', name: 'ETH/USDT', base: 'ETH' },
  { symbol: 'SOLUSDT', name: 'SOL/USDT', base: 'SOL' },
  { symbol: 'BNBUSDT', name: 'BNB/USDT', base: 'BNB' },
  { symbol: 'XRPUSDT', name: 'XRP/USDT', base: 'XRP' },
  { symbol: 'DOGEUSDT', name: 'DOGE/USDT', base: 'DOGE' },
  { symbol: 'ADAUSDT', name: 'ADA/USDT', base: 'ADA' },
  { symbol: 'AVAXUSDT', name: 'AVAX/USDT', base: 'AVAX' },
  { symbol: 'DOTUSDT', name: 'DOT/USDT', base: 'DOT' },
  { symbol: 'MATICUSDT', name: 'MATIC/USDT', base: 'MATIC' },
];

const TIMEFRAMES = [
  { label: '1m', interval: '1m' },
  { label: '5m', interval: '5m' },
  { label: '15m', interval: '15m' },
  { label: '30m', interval: '30m' },
  { label: '1H', interval: '1h' },
  { label: '4H', interval: '4h' },
  { label: '1D', interval: '1d' },
];

type ChartMode = 'candlestick' | 'line' | 'area';
type IndicatorKey = 'sma' | 'ema' | 'bb';

interface CandleData {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface WatchlistPrice {
  price: string;
  change: number;
}

// ──────────────────────────── Indicator Helpers ────────────────────────────
function calcSMA(data: CandleData[], period: number) {
  const result: { time: Time; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

function calcEMA(data: CandleData[], period: number) {
  const result: { time: Time; value: number }[] = [];
  const k = 2 / (period + 1);
  let ema = data[0].close;
  for (let i = 0; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    if (i >= period - 1) result.push({ time: data[i].time, value: ema });
  }
  return result;
}

function calcBB(data: CandleData[], period: number, mult: number) {
  const middle: { time: Time; value: number }[] = [];
  const upper: { time: Time; value: number }[] = [];
  const lower: { time: Time; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    const avg = sum / period;
    let variance = 0;
    for (let j = 0; j < period; j++) variance += (data[i - j].close - avg) ** 2;
    const std = Math.sqrt(variance / period);
    middle.push({ time: data[i].time, value: avg });
    upper.push({ time: data[i].time, value: avg + mult * std });
    lower.push({ time: data[i].time, value: avg - mult * std });
  }
  return { middle, upper, lower };
}

// ──────────────────────────── Component ────────────────────────────
const TradingChart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorSeriesRefs = useRef<ISeriesApi<'Line'>[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const candlesRef = useRef<CandleData[]>([]);

  const [searchParams] = useSearchParams();

  const [selectedSymbol, setSelectedSymbol] = useState(searchParams.get('symbol') || 'BTCUSDT');
  const [selectedTf, setSelectedTf] = useState('1h');
  const [chartMode, setChartMode] = useState<ChartMode>('candlestick');
  const [showSymbolModal, setShowSymbolModal] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [currentPrice, setCurrentPrice] = useState('0.00');
  const [priceChange24h, setPriceChange24h] = useState(0);
  const [watchlistPrices, setWatchlistPrices] = useState<Record<string, WatchlistPrice>>({});

  const [activeIndicators, setActiveIndicators] = useState<Set<IndicatorKey>>(new Set());
  const [showIndicators, setShowIndicators] = useState(false);

  // Backtest state
  const [backtestMode, setBacktestMode] = useState(false);
  const [backtestPosition, setBacktestPosition] = useState<any>(null);
  const [btQuantity, setBtQuantity] = useState('0.01');
  const [btStopLoss, setBtStopLoss] = useState('');
  const [btTakeProfit, setBtTakeProfit] = useState('');

  // Trade history
  const [tradeHistory, setTradeHistory] = useState<any[]>([]);

  // ── Fetch trade history ──
  useEffect(() => {
    axios.get('http://localhost:5000/api/trades').then(r => setTradeHistory(r.data)).catch(() => {});
  }, []);

  // ── Remove all indicator series ──
  const clearIndicators = useCallback(() => {
    indicatorSeriesRefs.current.forEach(s => {
      try { chartRef.current?.removeSeries(s); } catch {}
    });
    indicatorSeriesRefs.current = [];
  }, []);

  // ── Apply indicators ──
  const applyIndicators = useCallback((data: CandleData[]) => {
    clearIndicators();
    if (!chartRef.current || data.length < 21) return;

    if (activeIndicators.has('sma')) {
      const smaData = calcSMA(data, 20);
      const s = chartRef.current.addSeries(LineSeries, { color: '#f59e0b', lineWidth: 1, title: 'SMA 20', priceScaleId: 'right' });
      s.setData(smaData);
      indicatorSeriesRefs.current.push(s);
    }
    if (activeIndicators.has('ema')) {
      const emaData = calcEMA(data, 20);
      const s = chartRef.current.addSeries(LineSeries, { color: '#8b5cf6', lineWidth: 1, title: 'EMA 20', priceScaleId: 'right' });
      s.setData(emaData);
      indicatorSeriesRefs.current.push(s);
    }
    if (activeIndicators.has('bb')) {
      const bb = calcBB(data, 20, 2);
      const up = chartRef.current.addSeries(LineSeries, { color: 'rgba(41,98,255,0.5)', lineWidth: 1, title: 'BB Upper', priceScaleId: 'right' });
      const mid = chartRef.current.addSeries(LineSeries, { color: 'rgba(41,98,255,0.3)', lineWidth: 1, title: 'BB Mid', priceScaleId: 'right' });
      const lo = chartRef.current.addSeries(LineSeries, { color: 'rgba(41,98,255,0.5)', lineWidth: 1, title: 'BB Lower', priceScaleId: 'right' });
      up.setData(bb.upper); mid.setData(bb.middle); lo.setData(bb.lower);
      indicatorSeriesRefs.current.push(up, mid, lo);
    }
  }, [activeIndicators, clearIndicators]);

  // ── Create chart (once) ──
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#131722' }, textColor: '#787b86' },
      grid: { vertLines: { color: '#1e222d' }, horzLines: { color: '#1e222d' } },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1e222d' },
      timeScale: { borderColor: '#1e222d', timeVisible: true, secondsVisible: false },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });
    chartRef.current = chart;

    const mainSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', downColor: '#ef4444',
      borderUpColor: '#10b981', borderDownColor: '#ef4444',
      wickUpColor: '#10b981', wickDownColor: '#ef4444',
    });
    mainSeriesRef.current = mainSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    const ro = new ResizeObserver(handleResize);
    ro.observe(chartContainerRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, []);

  // ── Fetch klines + connect WebSocket ──
  useEffect(() => {
    const fetchAndConnect = async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${selectedSymbol}&interval=${selectedTf}&limit=500`);
        const raw = await res.json();
        const candles: CandleData[] = raw.map((k: any) => ({
          time: (k[0] / 1000) as Time,
          open: parseFloat(k[1]),
          high: parseFloat(k[2]),
          low: parseFloat(k[3]),
          close: parseFloat(k[4]),
        }));
        const volumes = raw.map((k: any) => ({
          time: (k[0] / 1000) as Time,
          value: parseFloat(k[5]),
          color: parseFloat(k[4]) >= parseFloat(k[1]) ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
        }));
        candlesRef.current = candles;

        if (mainSeriesRef.current) mainSeriesRef.current.setData(candles);
        if (volumeSeriesRef.current) volumeSeriesRef.current.setData(volumes);
        if (chartRef.current) chartRef.current.timeScale().fitContent();

        if (candles.length > 0) setCurrentPrice(candles[candles.length - 1].close.toFixed(2));
        applyIndicators(candles);
      } catch (err) {
        console.error('Failed to fetch klines', err);
      }

      // 24h ticker
      try {
        const tickerRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${selectedSymbol}`);
        const ticker = await tickerRes.json();
        setPriceChange24h(parseFloat(ticker.priceChangePercent));
      } catch {}

      // WebSocket for live candle updates
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@kline_${selectedTf}`);
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const k = msg.k;
        if (!k) return;
        const candle: CandleData = {
          time: (k.t / 1000) as Time,
          open: parseFloat(k.o), high: parseFloat(k.h),
          low: parseFloat(k.l), close: parseFloat(k.c),
        };
        setCurrentPrice(parseFloat(k.c).toFixed(2));

        if (mainSeriesRef.current) mainSeriesRef.current.update(candle);
        if (volumeSeriesRef.current) {
          (volumeSeriesRef.current as any).update({
            time: candle.time,
            value: parseFloat(k.v),
            color: candle.close >= candle.open ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
          });
        }

        // Update candles ref
        const arr = candlesRef.current;
        if (arr.length > 0 && arr[arr.length - 1].time === candle.time) {
          arr[arr.length - 1] = candle;
        } else {
          arr.push(candle);
        }

        // Update position current price
        if (backtestPosition) {
          setBacktestPosition((prev: any) => prev ? { ...prev, currentPrice: parseFloat(k.c) } : null);
        }
      };
      wsRef.current = ws;
    };

    fetchAndConnect();
    return () => { if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol, selectedTf]);

  // ── Watchlist prices ──
  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');
    ws.onmessage = (event) => {
      const tickers = JSON.parse(event.data);
      const updates: Record<string, WatchlistPrice> = {};
      for (const t of tickers) {
        if (SYMBOLS.find(s => s.symbol === t.s)) {
          updates[t.s] = { price: parseFloat(t.c).toFixed(2), change: ((parseFloat(t.c) - parseFloat(t.o)) / parseFloat(t.o)) * 100 };
        }
      }
      if (Object.keys(updates).length > 0) {
        setWatchlistPrices(prev => ({ ...prev, ...updates }));
      }
    };
    return () => ws.close();
  }, []);

  // ── Re-apply indicators when toggled ──
  useEffect(() => {
    if (candlesRef.current.length > 0) applyIndicators(candlesRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndicators]);

  const toggleIndicator = (key: IndicatorKey) => {
    setActiveIndicators(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
    setShowIndicators(false);
  };

  // ── Backtest trade actions ──
  const openBacktestTrade = (direction: 'Buy' | 'Sell') => {
    const price = parseFloat(currentPrice);
    setBacktestPosition({
      symbol: selectedSymbol,
      direction,
      entryPrice: price,
      currentPrice: price,
      quantity: parseFloat(btQuantity),
      stopLoss: btStopLoss ? parseFloat(btStopLoss) : null,
      takeProfit: btTakeProfit ? parseFloat(btTakeProfit) : null,
      entryTime: new Date().toISOString(),
    });
  };

  const closeBacktestTrade = async () => {
    if (!backtestPosition) return;
    const exitPrice = parseFloat(currentPrice);
    const pnl = backtestPosition.direction === 'Buy'
      ? (exitPrice - backtestPosition.entryPrice) * backtestPosition.quantity
      : (backtestPosition.entryPrice - exitPrice) * backtestPosition.quantity;

    try {
      const sym = SYMBOLS.find(s => s.symbol === backtestPosition.symbol);
      await axios.post('http://localhost:5000/api/trades', {
        date: backtestPosition.entryTime,
        symbol: sym ? sym.name : backtestPosition.symbol,
        type: backtestPosition.direction,
        strategy: 'Backtest',
        entryTime: backtestPosition.entryTime,
        exitTime: new Date().toISOString(),
        entryPrice: backtestPosition.entryPrice,
        exitPrice: exitPrice,
        quantity: backtestPosition.quantity,
        stopLoss: backtestPosition.stopLoss,
        takeProfit: backtestPosition.takeProfit,
        pnl: parseFloat(pnl.toFixed(2)),
        status: pnl > 0 ? 'Win' : pnl < 0 ? 'Loss' : 'Breakeven',
      });
      const res = await axios.get('http://localhost:5000/api/trades');
      setTradeHistory(res.data);
    } catch (err) {
      console.error('Failed to save backtest trade', err);
    }
    setBacktestPosition(null);
  };

  // ── UI helpers ──
  const currentSymbolObj = SYMBOLS.find(s => s.symbol === selectedSymbol);
  const displaySymbol = currentSymbolObj?.name || selectedSymbol;
  const filteredSymbols = SYMBOLS.filter(s =>
    s.name.toLowerCase().includes(symbolSearch.toLowerCase()) || s.symbol.toLowerCase().includes(symbolSearch.toLowerCase())
  );
  const resetChart = () => { if (chartRef.current) chartRef.current.timeScale().fitContent(); };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  };

  const unrealizedPnl = backtestPosition
    ? backtestPosition.direction === 'Buy'
      ? (backtestPosition.currentPrice - backtestPosition.entryPrice) * backtestPosition.quantity
      : (backtestPosition.entryPrice - backtestPosition.currentPrice) * backtestPosition.quantity
    : 0;

  // ────────────────────────── RENDER ──────────────────────────
  return (
    <div className="chart-page">
      {/* ── Top Bar ── */}
      <div className="chart-topbar">
        <a href="/" style={{ color: '#787b86', display: 'flex', alignItems: 'center', textDecoration: 'none', marginRight: '0.5rem' }}>
          <ArrowLeft size={18} />
        </a>

        <button className="chart-topbar__symbol-btn" onClick={() => setShowSymbolModal(true)}>
          {displaySymbol}
        </button>

        <div className="chart-timeframes">
          {TIMEFRAMES.map(tf => (
            <button key={tf.interval}
              className={`chart-timeframes__btn ${selectedTf === tf.interval ? 'chart-timeframes__btn--active' : ''}`}
              onClick={() => setSelectedTf(tf.interval)}
            >{tf.label}</button>
          ))}
        </div>

        <div className="chart-topbar__price">
          <span className="chart-topbar__price-current">{currentPrice}</span>
          <span className={`chart-topbar__price-change ${priceChange24h >= 0 ? 'chart-topbar__price-change--up' : 'chart-topbar__price-change--down'}`}>
            {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
          </span>
        </div>

        <div className="chart-topbar__live">
          <span className="chart-topbar__live-dot" />
          LIVE
        </div>
      </div>

      {/* ── Chart Controls ── */}
      <div className="chart-controls">
        <button className={`chart-controls__btn ${chartMode === 'candlestick' ? 'chart-controls__btn--active' : ''}`} onClick={() => setChartMode('candlestick')} title="Candlestick">
          <CandlestickChart size={15} />
        </button>
        <button className={`chart-controls__btn ${chartMode === 'line' ? 'chart-controls__btn--active' : ''}`} onClick={() => setChartMode('line')} title="Line">
          <LineChartIcon size={15} />
        </button>
        <button className={`chart-controls__btn ${chartMode === 'area' ? 'chart-controls__btn--active' : ''}`} onClick={() => setChartMode('area')} title="Area">
          <AreaChart size={15} />
        </button>
        <div className="chart-controls__sep" />

        <div style={{ position: 'relative' }}>
          <button className="chart-controls__btn" onClick={() => setShowIndicators(!showIndicators)}>
            <Activity size={15} /> Indicators
          </button>
          {showIndicators && (
            <div className="indicator-dropdown">
              {([
                { key: 'sma' as IndicatorKey, label: 'SMA (20)' },
                { key: 'ema' as IndicatorKey, label: 'EMA (20)' },
                { key: 'bb' as IndicatorKey, label: 'Bollinger Bands' },
              ]).map(ind => (
                <div key={ind.key} className="indicator-dropdown__item" onClick={() => toggleIndicator(ind.key)}>
                  <span>{ind.label}</span>
                  {activeIndicators.has(ind.key) && <span className="indicator-dropdown__check">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="chart-controls__sep" />
        <button className="chart-controls__btn" onClick={resetChart} title="Reset"><RotateCcw size={15} /></button>
        <button className="chart-controls__btn" onClick={toggleFullscreen} title="Fullscreen"><Maximize size={15} /></button>
        <div className="chart-controls__sep" />
        <button
          className={`chart-controls__btn ${backtestMode ? 'chart-controls__btn--active' : ''}`}
          onClick={() => setBacktestMode(!backtestMode)}
          style={backtestMode ? { background: 'rgba(41,98,255,0.15)' } : {}}
        >
          <Target size={15} /> Backtest
        </button>

        <div style={{ marginLeft: 'auto' }}>
          <button className="chart-controls__btn" onClick={() => setSidebarOpen(!sidebarOpen)} title="Toggle sidebar">
            {sidebarOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
          </button>
        </div>
      </div>

      {/* ── Backtest Bar ── */}
      {backtestMode && (
        <div className="backtest-bar">
          <span className="backtest-bar__label">BACKTEST</span>
          <label style={{ fontSize: '0.8rem', color: '#787b86' }}>Qty</label>
          <input type="number" step="any" value={btQuantity} onChange={e => setBtQuantity(e.target.value)} style={{ width: 80 }} />
          <label style={{ fontSize: '0.8rem', color: '#787b86' }}>SL</label>
          <input type="number" step="any" value={btStopLoss} onChange={e => setBtStopLoss(e.target.value)} placeholder="Optional" style={{ width: 100 }} />
          <label style={{ fontSize: '0.8rem', color: '#787b86' }}>TP</label>
          <input type="number" step="any" value={btTakeProfit} onChange={e => setBtTakeProfit(e.target.value)} placeholder="Optional" style={{ width: 100 }} />
          {!backtestPosition ? (
            <>
              <button className="backtest-bar__btn backtest-bar__btn--buy" onClick={() => openBacktestTrade('Buy')}>
                <TrendingUp size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Buy / Long
              </button>
              <button className="backtest-bar__btn backtest-bar__btn--sell" onClick={() => openBacktestTrade('Sell')}>
                <TrendingDown size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Sell / Short
              </button>
            </>
          ) : (
            <button className="backtest-bar__btn backtest-bar__btn--close" onClick={closeBacktestTrade}>
              Close Position
            </button>
          )}
        </div>
      )}

      {/* ── Main Area ── */}
      <div className="chart-main">
        <div className="chart-container">
          <div className="chart-container__canvas" ref={chartContainerRef} />
        </div>

        {/* ── Right Sidebar ── */}
        <div className={`chart-sidebar ${!sidebarOpen ? 'chart-sidebar--collapsed' : ''}`}>
          <div className="chart-sidebar__section">
            <div className="chart-sidebar__title">Watchlist</div>
            {SYMBOLS.slice(0, 5).map(s => {
              const wp = watchlistPrices[s.symbol];
              return (
                <div key={s.symbol} className="watchlist-item" onClick={() => setSelectedSymbol(s.symbol)}>
                  <span className="watchlist-item__symbol">{s.name}</span>
                  <span className="watchlist-item__price" style={{ color: wp && wp.change >= 0 ? '#10b981' : '#ef4444' }}>
                    {wp ? wp.price : '—'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Position Panel */}
          {backtestPosition && (
            <div className="chart-sidebar__section">
              <div className="chart-sidebar__title">Position</div>
              <div className="position-panel">
                <div className="position-panel__header">
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{displaySymbol}</span>
                  <span className={`position-panel__dir ${backtestPosition.direction === 'Buy' ? 'position-panel__dir--long' : 'position-panel__dir--short'}`}>
                    {backtestPosition.direction === 'Buy' ? 'LONG' : 'SHORT'}
                  </span>
                </div>
                <div className="position-panel__row"><span className="position-panel__label">Entry</span><span className="position-panel__value">${backtestPosition.entryPrice.toFixed(2)}</span></div>
                <div className="position-panel__row"><span className="position-panel__label">Current</span><span className="position-panel__value">${backtestPosition.currentPrice.toFixed(2)}</span></div>
                <div className="position-panel__row"><span className="position-panel__label">Quantity</span><span className="position-panel__value">{backtestPosition.quantity}</span></div>
                {backtestPosition.stopLoss && <div className="position-panel__row"><span className="position-panel__label">Stop Loss</span><span className="position-panel__value" style={{ color: '#ef4444' }}>${backtestPosition.stopLoss.toFixed(2)}</span></div>}
                {backtestPosition.takeProfit && <div className="position-panel__row"><span className="position-panel__label">Take Profit</span><span className="position-panel__value" style={{ color: '#10b981' }}>${backtestPosition.takeProfit.toFixed(2)}</span></div>}
                <div className="position-panel__row" style={{ marginTop: '0.5rem', borderTop: '1px solid #2a2e39', paddingTop: '0.5rem' }}>
                  <span className="position-panel__label">Unrealized P&L</span>
                  <span className="position-panel__value" style={{ color: unrealizedPnl >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                    {unrealizedPnl >= 0 ? '+' : ''}${unrealizedPnl.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Selected Trade (from URL) */}
          {searchParams.get('tradeId') && tradeHistory.length > 0 && (() => {
            const trade = tradeHistory.find((t: any) => t._id === searchParams.get('tradeId'));
            if (!trade) return null;
            return (
              <div className="chart-sidebar__section">
                <div className="chart-sidebar__title">Selected Trade</div>
                <div className="position-panel">
                  <div className="position-panel__row"><span className="position-panel__label">Entry</span><span className="position-panel__value">${trade.entryPrice}</span></div>
                  <div className="position-panel__row"><span className="position-panel__label">Exit</span><span className="position-panel__value">${trade.exitPrice}</span></div>
                  <div className="position-panel__row"><span className="position-panel__label">P&L</span><span className="position-panel__value" style={{ color: trade.pnl >= 0 ? '#10b981' : '#ef4444' }}>${trade.pnl.toFixed(2)}</span></div>
                  <div className="position-panel__row"><span className="position-panel__label">Strategy</span><span className="position-panel__value">{trade.strategy}</span></div>
                  <div className="position-panel__row"><span className="position-panel__label">Status</span><span className="position-panel__value">{trade.status}</span></div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Bottom Trade History ── */}
      <div className="chart-bottom">
        <div className="chart-bottom__header">
          <span>Trade History</span>
          <span>{tradeHistory.length} trades</span>
        </div>
        <table>
          <thead>
            <tr><th>Date</th><th>Symbol</th><th>Dir</th><th>Entry</th><th>Exit</th><th>P&L</th><th>Result</th></tr>
          </thead>
          <tbody>
            {tradeHistory.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '1rem', color: '#787b86' }}>No trades yet</td></tr>
            ) : (
              tradeHistory.slice(0, 20).map((t: any) => (
                <tr key={t._id}>
                  <td>{new Date(t.date).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 500 }}>{t.symbol}</td>
                  <td><span style={{ color: t.type === 'Buy' ? '#10b981' : '#ef4444' }}>{t.type}</span></td>
                  <td>${t.entryPrice}</td>
                  <td>${t.exitPrice}</td>
                  <td style={{ color: t.pnl >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(2)}</td>
                  <td>
                    <span style={{
                      padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600,
                      background: t.status === 'Win' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: t.status === 'Win' ? '#10b981' : '#ef4444'
                    }}>{t.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Symbol Search Modal ── */}
      {showSymbolModal && (
        <div className="symbol-modal-overlay" onClick={() => setShowSymbolModal(false)}>
          <div className="symbol-modal" onClick={e => e.stopPropagation()}>
            <div className="symbol-modal__search">
              <input
                autoFocus
                placeholder="Search symbol..."
                value={symbolSearch}
                onChange={e => setSymbolSearch(e.target.value)}
              />
            </div>
            <div className="symbol-modal__list">
              {filteredSymbols.map(s => (
                <div key={s.symbol} className="symbol-modal__item" onClick={() => { setSelectedSymbol(s.symbol); setShowSymbolModal(false); setSymbolSearch(''); }}>
                  <div>
                    <div className="symbol-modal__item-name">{s.name}</div>
                    <div className="symbol-modal__item-desc">Binance Spot</div>
                  </div>
                  <span style={{ color: '#787b86', fontSize: '0.8rem' }}>{s.base}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingChart;
