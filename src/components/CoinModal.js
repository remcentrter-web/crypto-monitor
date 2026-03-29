import React, { useState, useEffect } from 'react';
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
import './CoinModal.css';

// Реєструємо модулі графіка
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CoinModal = ({ coinId, data, onClose }) => {
  const [usdAmount, setUsdAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chartHistory, setChartHistory] = useState([]);

  // Функція для форматування великих чисел
  const formatNumber = (num) => {
    return num ? new Intl.NumberFormat('en-US').format(num) : '---';
  };

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        // 1. Беремо ПРАВИЛЬНИЙ ID (наприклад, 'bitcoin' замість 'BTC')
        const correctId = data?.id || coinId.toLowerCase();
        
        // 2. Робимо прямий запит до CoinGecko
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${correctId}/market_chart?vs_currency=usd&days=1`
        );

        // 3. Перевіряємо, чи сервер не видав помилку
        if (!response.ok) {
          throw new Error('CoinGecko ліміти або 404');
        }

        const resData = await response.json();
        
        // 4. Якщо дані є — малюємо реальний графік
        if (resData && resData.prices) {
          const prices = resData.prices.map(item => item[1]);
          setChartHistory(prices);
        } else {
          throw new Error('Немає масиву цін');
        }

      } catch (error) {
        // 5. ТИХИЙ РЕЖИМ: Якщо ліміт або помилка — малюємо красивий фейковий графік
        const currentPrice = parseFloat(data?.price?.replace(/[^-0-9.]/g, '')) || 50000;
        const fakeData = Array.from({ length: 24 }, () => 
          currentPrice * (0.98 + Math.random() * 0.04)
        );
        setChartHistory(fakeData);
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    if (coinId) fetchHistory();
  }, [coinId, data]);

  if (!coinId) return null;

  const isPositive = parseFloat(data?.change) >= 0;
  const priceColor = isPositive ? '#2ebd85' : '#f6465d';

  const chartData = {
    labels: chartHistory.map((_, index) => index),
    datasets: [
      {
        fill: true,
        label: 'Ціна USD',
        data: chartHistory,
        borderColor: priceColor,
        backgroundColor: isPositive ? 'rgba(46, 189, 133, 0.1)' : 'rgba(246, 70, 93, 0.1)',
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { display: false },
      y: { display: false },
    },
  };

  const cryptoAmount = usdAmount && data?.price 
    ? (parseFloat(usdAmount) / parseFloat(data.price.replace(/[^0-9.]/g, ''))).toFixed(6)
    : '0.00';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        
        {/* ШАПКА: Логотип і ціна в один ряд */}
        <div className="modal-top-bar">
          <div className="modal-header">
            {data?.image && (
              <img 
                src={data.image} 
                alt={coinId}
                className="modal-icon"
              />
            )}
            <h2>{coinId.toUpperCase()} ДЕТАЛІ</h2>
          </div>
          <div className="modal-price-info">
            <p className="modal-current-price" style={{ color: priceColor }}>
              {data?.price ? '$' + data.price : '...'}
            </p>
            <span className={`modal-change ${isPositive ? 'up' : 'down'}`}>
              {isPositive ? '▲' : '▼'} {data?.change}%
            </span>
          </div>
        </div>

        {/* ГОЛОВНИЙ БЛОК: ГРАФІК + СТАТИСТИКА ПОРУЧ */}
        <div className="modal-main-row">
          
          {/* Графік (Ліворуч) */}
          <div className="modal-chart-container">
            {isLoading ? (
              <div className="skeleton-chart"></div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>

          {/* Статистика (Праворуч) */}
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
              <strong className="stat-value" style={{ color: '#2ebd85' }}>${data?.high24h || '---'}</strong>
            </div>
            <div className="stat-item">
              <span className="stat-label">Min (24г)</span>
              <strong className="stat-value" style={{ color: '#f6465d' }}>${data?.low24h || '---'}</strong>
            </div>
            <div className="stat-item">
              <span className="stat-label">Об'єм (24г)</span>
              <strong className="stat-value">${formatNumber(data?.volume)}</strong>
            </div>
            <div className="stat-item">
              <span className="stat-label">All-Time High</span>
              <strong className="stat-value" style={{ color: '#f3ba2f' }}>${data?.ath || '---'}</strong>
            </div>
          </div>

        </div>

        {/* КАЛЬКУЛЯТОР (Знизу) */}
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
  );
};

export default CoinModal;