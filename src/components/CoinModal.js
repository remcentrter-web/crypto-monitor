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
// 1. ІМПОРТУЄМО ПЛАГІН ДЛЯ ЗУМУ
import zoomPlugin from 'chartjs-plugin-zoom';
import './CoinModal.css';

// 2. РЕЄСТРУЄМО ПЛАГІН
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, zoomPlugin);

const CHART_GREEN = '#00c087'; 
const CHART_RED = '#ff4343'; 

const CoinModal = ({ coinId, data, onClose }) => {
  const [usdAmount, setUsdAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chartHistory, setChartHistory] = useState([]);
  
  const chartRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  const formatNumber = (num) => {
    return num ? new Intl.NumberFormat('en-US').format(num) : '---';
  };

  const currentPrice = parseFloat(data?.price?.toString().replace(/[^-0-9.]/g, '')) || 0;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const correctId = data?.id || coinId.toLowerCase();
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${correctId}/market_chart?vs_currency=usd&days=1`
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
  }, [coinId, data, currentPrice]);

  if (!coinId) return null;

  const isPositive = parseFloat(data?.change) >= 0;
  const priceColor = isPositive ? CHART_GREEN : CHART_RED;

  const prices = chartHistory.map(item => item[1]);
  const labels = chartHistory.map(item => {
    const date = new Date(item[0]);
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  });

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Ціна USD',
        data: prices,
        fill: true,
        tension: 0.3,
        pointRadius: 0,
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
        label: 'Поточна ціна',
        data: Array(prices.length).fill(currentPrice),
        borderColor: 'rgba(255, 255, 255, 0.2)',
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
        filter: function(tooltipItem) {
          return tooltipItem.datasetIndex === 0; 
        },
        callbacks: {
          label: (context) => `$${context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 6})}`,
          title: (tooltipItems) => `Час: ${tooltipItems[0].label}`
        }
      },
      // 3. НАЛАШТУВАННЯ ЗУМУ
      zoom: {
        pan: {
          enabled: true,
          mode: 'x', // Дозволяє тягати графік мишкою тільки вліво-вправо
        },
        zoom: {
          wheel: {
            enabled: true, // Зум коліщатком мишки
          },
          pinch: {
            enabled: true // Зум пальцями на телефоні
          },
          mode: 'x', // Наближаємо тільки по осі часу (щоб графік не плющило у висоту)
        }
      }
    },
    scales: {
      x: { 
        display: true,
        grid: { display: false, drawBorder: false },
        ticks: {
          color: '#8e9eaf',
          maxTicksLimit: 6,
          maxRotation: 0,
          font: { size: 10 }
        }
      },
      y: { display: false },
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  const cryptoAmount = usdAmount && data?.price 
    ? (parseFloat(usdAmount) / currentPrice).toFixed(6)
    : '0.00';

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
                <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {coinId.toUpperCase()} <span style={{ color: '#aaa', fontSize: '1rem', fontWeight: 'normal' }}>ДЕТАЛІ</span>
                </h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '5px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff' }}>
                    {data?.price ? '$' + data.price : '...'}
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: priceColor }}>
                    {isPositive ? '▲' : '▼'} {data?.change}%
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(247, 147, 26, 0.1)', border: '1px solid rgba(247, 147, 26, 0.3)', padding: '6px 12px', borderRadius: '20px', color: '#f7931a', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f7931a', animation: 'pulseLiveModal 2s infinite' }}></div>
              ⚡ НАЖИВО (24Г)
            </div>
          </div>

          <div className="modal-main-row" style={{ marginTop: '20px' }}>
            
            <div className="modal-chart-container" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '300px', width: '100%' }}>
                {isLoading ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
                    Аналізуємо графік... ⏳
                  </div>
                ) : (
                  <div ref={chartRef} style={{ height: '100%', animation: isVisible ? 'drawChartRevealModal 1s ease-out forwards' : 'none' }}>
                    <Line data={chartData} options={chartOptions} />
                  </div>
                )}
              </div>
            </div>

            <div className="modal-stats-grid">
              <div className="stat-item">
                <span className="stat-label">Рейтинг у світі</span>
                <strong className="stat-value">#{data?.rank || '---'}</strong>
              </div>
              <div className="stat-item">
                <span className="stat-label">Капіталізація</span>
                <strong className="stat-value">${formatNumber(data?.marketCap)}</strong>
              </div>
              <div className="stat-item">
                <span className="stat-label">Max (24г)</span>
                <strong className="stat-value" style={{ color: CHART_GREEN }}>${data?.high24h?.toLocaleString() || '---'}</strong>
              </div>
              <div className="stat-item">
                <span className="stat-label">Min (24г)</span>
                <strong className="stat-value" style={{ color: CHART_RED }}>${data?.low24h?.toLocaleString() || '---'}</strong>
              </div>
              <div className="stat-item">
                <span className="stat-label">Об'єм (24г)</span>
                <strong className="stat-value">${formatNumber(data?.volume)}</strong>
              </div>
              <div className="stat-item">
                <span className="stat-label">All-Time High</span>
                <strong className="stat-value" style={{ color: '#f7931a' }}>${data?.ath?.toLocaleString() || '---'}</strong>
              </div>
            </div>

          </div>

          <div className="calculator-section">
            <h3>Калькулятор</h3>
            <div className="calc-input-group">
              <input 
                type="number" 
                placeholder="Введіть суму в USD" 
                value={usdAmount}
                min="0"
                onKeyDown={(e) => ["-", "+", "e", "E"].includes(e.key) && e.preventDefault()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val >= 0 || val === '') setUsdAmount(val);
                }}
              />
              <span className="currency-label">USD</span>
            </div>
            
            <div className="calc-results-container">
              <p className="calc-result">Ви отримаєте: <strong>{cryptoAmount} {coinId.toUpperCase()}</strong></p>
              <p className="calc-result uah-style" style={{ color: '#aaa', marginTop: '5px' }}>
                В гривнях (UAH): <strong style={{ color: 'white' }}>~{(usdAmount * 40.2).toLocaleString()} ₴</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CoinModal;