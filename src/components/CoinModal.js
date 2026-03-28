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
  // Функція для форматування великих чисел (наприклад, 1,234,567)
  const formatNumber = (num) => {
    return num ? new Intl.NumberFormat('en-US').format(num) : '---';
  };
  const [usdAmount, setUsdAmount] = useState('');
  const [isLoading, setIsLoading] = useState(true);
const [chartHistory, setChartHistory] = useState([]);
useEffect(() => {
  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://cors-anywhere.herokuapp.com/https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1`
      );
      const resData = await response.json();
      // Отримуємо тільки масив цін
      const prices = resData.prices.map(item => item[1]);
      setChartHistory(prices);
   } catch (error) {
      console.error("Помилка завантаження:", error);
      // Створюємо масив з 24 точок на основі поточної ціни
      const currentPrice = parseFloat(data?.price?.replace(/[^-0-9.]/g, '')) || 50000;
      const fakeData = Array.from({ length: 24 }, () => 
        currentPrice * (0.98 + Math.random() * 0.04)
      );
      setChartHistory(fakeData);
    } finally {
      // Вимикаємо анімацію через 0.5 секунди
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  if (coinId) fetchHistory();
}, [coinId]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!coinId) return null;

  const isPositive = parseFloat(data?.change) >= 0;
  const priceColor = isPositive ? '#2ebd85' : '#f6465d';

  // Дані для графіка (імітація за останні 7 годин)
  const chartData = {
labels: chartHistory.map((_, index) => index),
    datasets: [
      {
        fill: true,
        label: 'Ціна USD',
        // Генеруємо невелике коливання навколо поточної ціни
       data: chartHistory,
      borderColor: priceColor,
        backgroundColor: isPositive ? 'rgba(46, 189, 133, 0.1)' : 'rgba(246, 70, 93, 0.1)',
        tension: 0.4, // Робить лінію плавною
        pointRadius: 0, // Приховуємо точки
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // Ховаємо підпис зверху
    },
    scales: {
      x: { display: false }, // Ховаємо нижню вісь
      y: { display: false }, // Ховаємо бічну вісь
    },
  };

  const cryptoAmount = usdAmount && data?.price 
    ? (parseFloat(usdAmount) / parseFloat(data.price.replace(/[^0-9.]/g, ''))).toFixed(6)
    : '0.00';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        
        <div className="modal-header">
          {data?.image && (
            <img 
              src={data.image} 
              alt={coinId}
              className="modal-icon"
              style={{ width: '40px', borderRadius: '50%' }}
            />
          )}
          <h2>{coinId} ДЕТАЛІ</h2>
        </div>

        <div className="modal-price-info">
          <p className="modal-current-price" style={{ color: priceColor }}>
            {data?.price ? '$' + data.price : '...'}
          </p>
          <span className={`modal-change ${isPositive ? 'up' : 'down'}`}>
            {isPositive ? '▲' : '▼'} {data?.change}%
          </span>
        </div>

        {/* НОВИЙ БЛОК З ГРАФІКОМ */}
        <div className="modal-chart-container">
  {isLoading ? (
    <div className="skeleton-chart"></div>
  ) : (
    <Line data={chartData} options={chartOptions} />
  )}
</div>
<div className="modal-stats-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '15px', 
          margin: '10px 0',
          padding: '15px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px'
        }}>
          <div className="stat-item">
            <span style={{ color: '#aaa', fontSize: '0.8rem', display: 'block' }}>Рейтинг у світі </span>
            <strong style={{ fontSize: '1.1rem' }}>#{data?.rank || '---'}</strong>
          </div>
          <div className="stat-item">
            <span style={{ color: '#aaa', fontSize: '0.8rem', display: 'block' }}>Капіталізація</span>
            <strong style={{ fontSize: '1.1rem' }}>${formatNumber(data?.marketCap)}</strong>
          </div>
          <div className="stat-item">
            <span style={{ color: '#aaa', fontSize: '0.8rem', display: 'block' }}>Max (24г)</span>
            <strong style={{ fontSize: '1.1rem', color: '#2ebd85' }}>${data?.high24h || '---'}</strong>
          </div>
          <div className="stat-item">
            <span style={{ color: '#aaa', fontSize: '0.8rem', display: 'block' }}>Min (24г)</span>
            <strong style={{ fontSize: '1.1rem', color: '#f6465d' }}>${data?.low24h || '---'}</strong>
          </div>
          <div className="stat-item">
            <span style={{ color: '#aaa', fontSize: '0.8rem', display: 'block' }}>Об'єм (24г)</span>
            <strong style={{ fontSize: '1.1rem' }}>${formatNumber(data?.volume)}</strong>
          </div>
          <div className="stat-item">
            <span style={{ color: '#aaa', fontSize: '0.8rem', display: 'block' }}>All-Time High</span>
            <strong style={{ fontSize: '1.1rem', color: '#f3ba2f' }}>${data?.ath || '---'}</strong>
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
            <p className="calc-result">Ви отримаєте: <strong>{cryptoAmount} {coinId}</strong></p>
            <p className="calc-result uah-style">В гривнях (UAH): <strong>~{(usdAmount * 40.2).toLocaleString()} ₴</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinModal;