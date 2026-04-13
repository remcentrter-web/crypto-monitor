import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import './CoinModal.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, zoomPlugin);

const CHART_GREEN = '#00c087'; 
const CHART_RED = '#ff4343'; 

// 🔥 СЛОВНИК ОНОВЛЕНО: ПРИБРАЛИ ЖОРСТКУ ПРИВ'ЯЗКУ ДО USD
const translations = {
  ua: {
    details: "ДЕТАЛІ", proChart: "📊 Проф. графік", live: "⚡ НАЖИВО (24Г)",
    hint: "*Крутіть коліщатко для наближення. Двічі клікніть, щоб скинути масштаб.",
    analyzing: "Аналізуємо графік... ⏳",
    rank: "Рейтинг у світі", cap: "Капіталізація", max24: "Max (24г)", min24: "Min (24г)", vol24: "Об'єм (24г)", ath: "All-Time High",
    calcTitle: "Калькулятор", calcPlaceholder: "Введіть суму в", calcGet: "Ви отримаєте:",
    alertTitle: "Сповіщення ціни", alertPlaceholder: "Напр.", btnUp: "📈 Вище", btnDown: "📉 Нижче",
    proTerminal: "Професійний термінал", chartPrice: "Ціна", currentPrice: "Поточна ціна",
    general: "Загальний:", localTrend: "Локальний тренд:", time: "Час:"
  },
  en: {
    details: "DETAILS", proChart: "📊 Pro Chart", live: "⚡ LIVE (24H)",
    hint: "*Scroll to zoom. Double click to reset zoom.",
    analyzing: "Analyzing chart... ⏳",
    rank: "Global Rank", cap: "Market Cap", max24: "Max (24h)", min24: "Min (24h)", vol24: "Volume (24h)", ath: "All-Time High",
    calcTitle: "Calculator", calcPlaceholder: "Enter amount in", calcGet: "You will get:",
    alertTitle: "Price Alert", alertPlaceholder: "E.g.", btnUp: "📈 Above", btnDown: "📉 Below",
    proTerminal: "Professional Terminal", chartPrice: "Price", currentPrice: "Current Price",
    general: "Overall:", localTrend: "Local Trend:", time: "Time:"
  }
};

const crosshairPlugin = {
  id: 'crosshair',
  afterDraw: (chart) => {
    if (chart.tooltip && typeof chart.tooltip.getActiveElements === 'function') {
      const activeElements = chart.tooltip.getActiveElements();
      if (activeElements && activeElements.length > 0) {
        const ctx = chart.ctx;
        const x = activeElements[0].element.x;
        const y = activeElements[0].element.y;
        const topY = chart.scales.y.top;
        const bottomY = chart.scales.y.bottom;
        const leftX = chart.scales.x.left;
        const rightX = chart.scales.x.right;

        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, bottomY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(leftX, y);
        ctx.lineTo(rightX, y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
};

// 🔥 ДОДАНО ПРОПСИ ДЛЯ ВАЛЮТИ (currencySymbol, currencyCode)
const CoinModal = ({ coinId, data, onClose, favorites = [], toggleFavorite, handleAddAlert, currencySymbol = '$', currencyCode = 'usd' }) => {
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'ua');
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('app_lang') || 'ua';
      if (currentLang !== lang) setLang(currentLang);
    }, 300);
    return () => clearInterval(interval);
  }, [lang]);

  const t = translations[lang];

  const [fiatAmount, setFiatAmount] = useState('');
  const [alertPrice, setAlertPrice] = useState(''); 
  const [isLoading, setIsLoading] = useState(true);
  const [chartHistory, setChartHistory] = useState([]);
  const [showProChart, setShowProChart] = useState(false);
  
  const chartRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const formatNumber = (num) => {
    return num ? new Intl.NumberFormat('en-US').format(num) : '---';
  };

  const currentPrice = parseFloat(data?.price?.toString().replace(/[^-0-9.]/g, '')) || 0;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 🔥 ОНОВЛЕНО ЗАПИТ: ТЕПЕР ТУТ ДИНАМІЧНА ВАЛЮТА ЗАМІСТЬ USD
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const correctId = data?.id || coinId.toLowerCase();
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${correctId}/market_chart?vs_currency=${currencyCode}&days=1`
        );

        if (!response.ok) throw new Error('Ліміт API');

        const resData = await response.json();
        if (resData && resData.prices) {
          setChartHistory(resData.prices);
        } else {
          throw new Error('Немає масиву цін');
        }
      } catch (error) {
        const now = Date.now();
        const fakeData = Array.from({ length: 24 }, (_, i) => [
          now - (23 - i) * 3600000, 
          currentPrice * (1 + Math.sin(i / 2) * 0.02 + Math.random() * 0.01)
        ]);
        setChartHistory(fakeData);
      } finally {
        setIsLoading(false);
      }
    };

    if (coinId) fetchHistory();
  }, [coinId, data, currentPrice, currencyCode]);

  if (!coinId) return null;

  const isPositive = parseFloat(data?.change) >= 0;
  const priceColor = isPositive ? CHART_GREEN : CHART_RED;
  const isFavorite = favorites.includes(coinId.toUpperCase());

  const prices = chartHistory.map(item => item[1]);
  const labels = chartHistory.map(item => {
    const date = new Date(item[0]);
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  });

  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const maxIndex = prices.indexOf(maxPrice);
  const minIndex = prices.indexOf(minPrice);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: `${t.chartPrice} ${currencyCode.toUpperCase()}`,
        data: prices,
        fill: true,
        tension: 0.3,
        pointRadius: (context) => {
          const idx = context.dataIndex;
          if (idx === prices.length - 1) return 5;
          if (idx === maxIndex || idx === minIndex) return 4;
          return 0;
        },
        pointBackgroundColor: (context) => {
          const idx = context.dataIndex;
          if (idx === prices.length - 1) return '#f7931a';
          if (idx === maxIndex) return CHART_GREEN;
          if (idx === minIndex) return CHART_RED;
          if (idx > 0) {
            return prices[idx] >= prices[idx - 1] ? CHART_GREEN : CHART_RED;
          }
          return priceColor;
        },
        pointBorderColor: (context) => {
          const idx = context.dataIndex;
          if (idx === prices.length - 1 || idx === maxIndex || idx === minIndex) return '#fff';
          if (idx > 0) {
            return prices[idx] >= prices[idx - 1] ? CHART_GREEN : CHART_RED;
          }
          return priceColor;
        },
        borderWidth: 2,
        pointHoverRadius: 6,
        segment: {
          borderColor: ctx => ctx.p0.parsed.y <= ctx.p1.parsed.y ? CHART_GREEN : CHART_RED,
        },
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const chartArea = context.chart.chartArea;
          if (!chartArea) return null;

          const isGrowing = prices[prices.length - 1] >= prices[0];
          const gradientColor = isGrowing ? CHART_GREEN : CHART_RED;

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, `${gradientColor}33`); 
          gradient.addColorStop(1, `${gradientColor}00`); 
          return gradient;
        },
      },
      {
        label: t.currentPrice,
        data: Array(prices.length).fill(currentPrice),
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        tension: 0
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { 
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#12161c',
        titleColor: '#aaa',
        bodyColor: '#fff',
        borderColor: '#2b3139',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        filter: function(tooltipItem) {
          return tooltipItem.datasetIndex === 0; 
        },
        callbacks: {
          labelColor: function(context) {
            const idx = context.dataIndex;
            let color = priceColor;
            if (idx === prices.length - 1) {
              color = '#f7931a';
            } else if (idx > 0) {
              color = prices[idx] >= prices[idx - 1] ? CHART_GREEN : CHART_RED;
            }
            return { borderColor: color, backgroundColor: color, borderWidth: 2 };
          },
          label: (context) => {
            const currentVal = context.parsed.y;
            const startVal = prices[0];
            const diffPercent = ((currentVal - startVal) / startVal) * 100;
            const sign = diffPercent >= 0 ? '▲ +' : '▼ ';
            return `${t.general} ${sign}${diffPercent.toFixed(2)}% | ${currencySymbol}${currentVal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}`;
          },
          afterLabel: (context) => {
            const idx = context.dataIndex;
            if (idx > 0) {
              const prevVal = prices[idx - 1];
              const currVal = prices[idx];
              const stepDiff = ((currVal - prevVal) / prevVal) * 100;
              const stepSign = stepDiff >= 0 ? '+' : '';
              return `${t.localTrend} ${stepSign}${stepDiff.toFixed(3)}%`;
            }
            return null;
          },
          title: (tooltipItems) => `${t.time} ${tooltipItems[0].label}`
        }
      },
      zoom: {
        pan: { enabled: true, mode: 'x' },
        zoom: { wheel: { enabled: true, speed: 0.05 }, pinch: { enabled: true }, drag: { enabled: false }, mode: 'x' }
      }
    },
    scales: {
      x: { 
        display: true,
        grid: { display: false, drawBorder: false },
        ticks: { color: '#8e9eaf', maxTicksLimit: 6, maxRotation: 0, font: { size: 10 } }
      },
      y: { display: false },
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  const cryptoAmount = fiatAmount && data?.price 
    ? (parseFloat(fiatAmount) / currentPrice).toFixed(6)
    : '0.00';

  const handleDoubleClick = () => {
    if (chartRef.current && typeof chartRef.current.resetZoom === 'function') {
      chartRef.current.resetZoom();
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes drawChartRevealModal {
            0% { opacity: 0; clip-path: inset(0 100% 0 0); transform: translateY(10px); }
            100% { opacity: 1; clip-path: inset(0 0 0 0); transform: translateY(0); }
          }
          @keyframes pulseLiveModal {
            0% { box-shadow: 0 0 0 0 rgba(247, 147, 26, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(247, 147, 26, 0); }
            100% { box-shadow: 0 0 0 0 rgba(247, 147, 26, 0); }
          }
          .pro-chart-btn {
            background: rgba(255, 255, 255, 0.05); 
            color: #8e9eaf; border: 1px solid #2b3139; 
            padding: 8px 16px; border-radius: 20px; font-size: 0.9rem; font-weight: bold;
            cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s;
          }
          .pro-chart-btn:hover {
            background: rgba(255, 255, 255, 0.1); color: #fff; border-color: #444c56;
          }
        `}
      </style>

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={onClose}>&times;</button>
          
          <div className="modal-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              {data?.image && (
                <img src={data.image} alt={coinId} className="modal-icon" style={{ width: '45px', height: '45px', borderRadius: '50%' }} />
              )}
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {coinId.toUpperCase()}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (toggleFavorite) toggleFavorite(coinId.toUpperCase());
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: isFavorite ? '#f7931a' : '#444', padding: 0, marginTop: '-2px' }}
                  >
                    {isFavorite ? '★' : '☆'}
                  </button>
                  <span style={{ color: '#aaa', fontSize: '1rem', fontWeight: 'normal', marginLeft: '5px' }}>{t.details}</span>
                </h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '5px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>
                    {data?.price ? currencySymbol + data.price : '...'}
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: priceColor }}>
                    {isPositive ? '▲' : '▼'} {data?.change}%
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <button className="pro-chart-btn" onClick={() => setShowProChart(true)}>
                {t.proChart}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(247, 147, 26, 0.1)', border: '1px solid rgba(247, 147, 26, 0.3)', padding: '6px 12px', borderRadius: '20px', color: '#f7931a', fontSize: '0.85rem', fontWeight: 'bold', height: 'fit-content' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f7931a', animation: 'pulseLiveModal 2s infinite' }}></div>
                {t.live}
              </div>
            </div>
          </div>

          <div className="modal-main-row" style={{ marginTop: '20px' }}>
            <div className="modal-chart-container" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#aaa', marginBottom: '10px' }}>
                {t.hint}
              </div>
              <div style={{ height: '300px', width: '100%', cursor: 'crosshair' }} onDoubleClick={handleDoubleClick}>
                {isLoading ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                    {t.analyzing}
                  </div>
                ) : (
                  <div style={{ height: '100%', animation: isVisible ? 'drawChartRevealModal 1s ease-out forwards' : 'none' }}>
                    <Line ref={chartRef} data={chartData} options={chartOptions} plugins={[crosshairPlugin]} />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-stats-grid">
              <div className="stat-item">
                <span className="stat-label">{t.rank}</span>
                <strong className="stat-value">#{data?.rank || '---'}</strong>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t.cap}</span>
                <strong className="stat-value">{currencySymbol}{formatNumber(data?.marketCap)}</strong>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t.max24}</span>
                <strong className="stat-value" style={{ color: CHART_GREEN }}>{currencySymbol}{data?.high24h?.toLocaleString() || '---'}</strong>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t.min24}</span>
                <strong className="stat-value" style={{ color: CHART_RED }}>{currencySymbol}{data?.low24h?.toLocaleString() || '---'}</strong>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t.vol24}</span>
                <strong className="stat-value">{currencySymbol}{formatNumber(data?.volume)}</strong>
              </div>
              <div className="stat-item">
                <span className="stat-label">{t.ath}</span>
                <strong className="stat-value" style={{ color: '#f7931a' }}>{currencySymbol}{data?.ath?.toLocaleString() || '---'}</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
            <div className="calculator-section" style={{ margin: 0 }}>
              <h3 style={{ textAlign: 'center', margin: '0 0 15px 0' }}>{t.calcTitle}</h3>
              <div className="calc-input-group">
                <input 
                  type="number" 
                  placeholder={`${t.calcPlaceholder} ${currencyCode.toUpperCase()}`} 
                  value={fiatAmount}
                  min="0"
                  onKeyDown={(e) => ["-", "+", "e", "E"].includes(e.key) && e.preventDefault()}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val >= 0 || val === '') setFiatAmount(val);
                  }}
                />
                <span className="currency-label">{currencyCode.toUpperCase()}</span>
              </div>
              
              <div className="calc-results-container">
                <p className="calc-result">{t.calcGet} <strong>{cryptoAmount} {coinId.toUpperCase()}</strong></p>
              </div>
            </div>

            <div className="calculator-section" style={{ margin: 0, border: '1px solid #2b3139', background: '#15191e' }}>
              <h3 style={{ textAlign: 'center', margin: '0 0 15px 0' }}>{t.alertTitle}</h3>
              <div className="calc-input-group">
                <input 
                  type="number" 
                  placeholder={`${t.alertPlaceholder} ${currencySymbol}${(currentPrice * 1.05).toFixed(currentPrice < 1 ? 4 : 0)}...`}
                  value={alertPrice}
                  min="0"
                  onChange={(e) => setAlertPrice(e.target.value)}
                />
                <span className="currency-label">{currencyCode.toUpperCase()}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button 
                  onClick={() => {
                    if (alertPrice && alertPrice > 0) {
                      if (handleAddAlert) handleAddAlert(coinId.toUpperCase(), alertPrice, 'up');
                      setAlertPrice(''); 
                    }
                  }}
                  style={{ flex: 1, padding: '10px', background: 'rgba(0, 192, 135, 0.1)', color: '#00c087', border: '1px solid #00c087', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(0, 192, 135, 0.2)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(0, 192, 135, 0.1)'}
                >
                  {t.btnUp}
                </button>
                <button 
                  onClick={() => {
                    if (alertPrice && alertPrice > 0) {
                      if (handleAddAlert) handleAddAlert(coinId.toUpperCase(), alertPrice, 'down');
                      setAlertPrice(''); 
                    }
                  }}
                  style={{ flex: 1, padding: '10px', background: 'rgba(255, 67, 67, 0.1)', color: '#ff4343', border: '1px solid #ff4343', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(255, 67, 67, 0.2)'}
                  onMouseLeave={(e) => e.target.style.background = 'rgba(255, 67, 67, 0.1)'}
                >
                  {t.btnDown}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showProChart && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: '#0d1117', zIndex: 100000,
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ 
            padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
            background: '#15191e', borderBottom: '1px solid #2b3139' 
          }}>
            <h2 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {coinId.toUpperCase()} / {currencyCode.toUpperCase()}
              <span style={{fontSize: '0.9rem', color: '#8e9eaf', fontWeight: 'normal'}}>{t.proTerminal}</span>
            </h2>
            <button
              onClick={() => setShowProChart(false)}
              style={{ 
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', 
                width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.5rem', 
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: '0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#ff4343'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.1)'}
            >
              &times;
            </button>
          </div>

          <div style={{ flex: 1, width: '100%', background: '#131722' }}>
            <iframe
              title="TradingView Chart"
              /* Для TradingView зазвичай працює USD, тому залишаємо як є, щоб графік гарантовано завантажився */
              src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_1&symbol=${coinId.toUpperCase()}USD&interval=15&hidesidetoolbar=0&symboledit=1&saveimage=1&toolbarbg=15191e&studies=[]&theme=dark&style=1&timezone=Europe/Kyiv&locale=${lang === 'ua' ? 'uk' : 'en'}`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </>
  );
};

export default CoinModal;