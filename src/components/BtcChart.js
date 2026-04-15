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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const CHART_GREEN = '#00c087'; 
const CHART_RED = '#ff4343';   

// 🔥 СЛОВНИК ДЛЯ ГРАФІКА
const translations = {
  ua: {
    labelBtc: "Ціна BTC",
    currentPrice: "Поточна ціна",
    live: "⚡ НАЖИВО: АКТУАЛЬНО (24Г)",
    min: "Мін. 24г:",
    max: "Макс. 24г:",
    analyzing: "Аналізуємо ринок... ⏳",
    time: "Час:"
  },
  en: {
    labelBtc: "BTC Price",
    currentPrice: "Current Price",
    live: "⚡ LIVE: ACTUAL (24H)",
    min: "Min 24h:",
    max: "Max 24h:",
    analyzing: "Analyzing market... ⏳",
    time: "Time:"
  }
};

// 🔥 ДОДАНО ПРОПСИ ДЛЯ МОВИ ТА ВАЛЮТИ
const BtcChart = ({ btcData, currencySymbol = '$', currencyCode = 'usd', lang = 'ua' }) => {
  const [chartHistory, setChartHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const t = translations[lang] || translations.ua;
  const chartRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (chartRef.current) observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const fetchBtcHistory = async () => {
      setIsLoading(true);
      try {
        // 🔥 ДИНАМІЧНИЙ ЗАПИТ ВАЛЮТИ
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${currencyCode}&days=1`);
        if (!res.ok) throw new Error('Ліміт API');
        const data = await res.json();
        // Зберігаємо повні дані з часом
        setChartHistory(data.prices);
      } catch (error) {
        console.warn("Малюємо резервний графік BTC");
        const basePrice = btcData?.current_price || 67000;
        const now = Date.now();
        const fakeData = Array.from({length: 24}, (_, i) => [
          now - (23 - i) * 3600000,
          basePrice * (1 + Math.sin(i / 2) * 0.02 + Math.random() * 0.01)
        ]);
        setChartHistory(fakeData);
      } finally {
        setIsLoading(false);
      }
    };
    if (btcData) fetchBtcHistory();
  }, [btcData, currencyCode]); // Перезавантажуємо при зміні валюти

  if (!btcData) return null;

  const currentPrice = btcData.current_price;
  const prices = chartHistory.map(item => item[1]);
  const labels = chartHistory.map(item => {
    const date = new Date(item[0]);
    return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
  });

  const data = {
    labels: labels,
    datasets: [
      {
        label: `${t.labelBtc} (${currencySymbol})`,
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
          // 🔥 ТВІЙ ПРОЗОРИЙ ФОН ЗБЕРЕЖЕНО (15)
          gradient.addColorStop(0, `${gradientColor}15`); 
          gradient.addColorStop(1, `${gradientColor}00`); 
          return gradient;
        },
      },
      {
        label: t.currentPrice,
        data: Array(prices.length).fill(currentPrice),
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        tension: 0
      }
    ]
  };

  const options = {
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
          // 🔥 ДИНАМІЧНА ВАЛЮТА У ТУЛТИПІ
          label: (context) => `${currencySymbol}${context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
          title: (tooltipItems) => `${t.time} ${tooltipItems[0].label}`
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
      y: { display: false } 
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  const high = btcData.high_24h || currentPrice * 1.05;
  const low = btcData.low_24h || currentPrice * 0.95;
  const rangePercent = Math.min(Math.max(((currentPrice - low) / (high - low)) * 100, 0), 100);

  return (
    <>
      <style>
        {`
          @keyframes drawChartReveal {
            0% { opacity: 0; clip-path: inset(0 100% 0 0); transform: translateY(15px); }
            100% { opacity: 1; clip-path: inset(0 0 0 0); transform: translateY(0); }
          }
          @keyframes pulseLive {
            0% { box-shadow: 0 0 0 0 rgba(247, 147, 26, 0.7); }
            70% { box-shadow: 0 0 0 6px rgba(247, 147, 26, 0); }
            100% { box-shadow: 0 0 0 0 rgba(247, 147, 26, 0); }
          }
        `}
      </style>
      
      <div ref={chartRef} style={{
        width: '100%', maxWidth: '1000px', background: '#1e2329', 
        borderRadius: '20px', padding: '30px', border: '1px solid #2b3139', 
        marginBottom: '50px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', 
        position: 'relative', textAlign: 'left',
        opacity: isVisible ? 1 : 0, 
        transition: 'opacity 0.3s ease'
      }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img src={btcData.image} alt="Bitcoin" style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                Bitcoin <span style={{ color: '#aaa', fontSize: '1.2rem', fontWeight: 'normal' }}>BTC</span>
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '15px', marginTop: '5px' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff' }}>
                  {/* 🔥 ДИНАМІЧНА ВАЛЮТА */}
                  {currencySymbol}{currentPrice.toLocaleString()}
                </span>
                <span style={{ 
                  fontSize: '1.2rem', fontWeight: 'bold', 
                  color: btcData.price_change_percentage_24h >= 0 ? CHART_GREEN : CHART_RED 
                }}>
                  {btcData.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(btcData.price_change_percentage_24h).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(247, 147, 26, 0.1)', border: '1px solid rgba(247, 147, 26, 0.3)', padding: '6px 12px', borderRadius: '20px', color: '#f7931a', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f7931a', animation: 'pulseLive 2s infinite' }}></div>
              {t.live}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '30px', padding: '15px', background: '#12161c', borderRadius: '15px', border: '1px solid #2b3139' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '0.9rem', marginBottom: '8px' }}>
            {/* 🔥 ДИНАМІЧНА ВАЛЮТА ДЛЯ МІН/МАКС */}
            <span>{t.min} <span style={{color: '#fff'}}>{currencySymbol}{low.toLocaleString()}</span></span>
            <span>{t.max} <span style={{color: '#fff'}}>{currencySymbol}{high.toLocaleString()}</span></span>
          </div>
          <div style={{ width: '100%', height: '6px', background: '#2b3139', borderRadius: '3px', position: 'relative' }}>
            <div style={{ 
              position: 'absolute', left: `${rangePercent}%`, top: '-4px', 
              width: '14px', height: '14px', background: '#fff', borderRadius: '50%', 
              boxShadow: '0 0 10px rgba(255,255,255,0.5)', transform: 'translateX(-50%)', zIndex: 2
            }}></div>
            <div style={{ 
              height: '100%', borderRadius: '3px', 
              background: `linear-gradient(90deg, ${CHART_RED} 0%, ${CHART_GREEN} 100%)`,
              width: `${rangePercent}%`, position: 'relative', zIndex: 1
            }}></div>
          </div>
        </div>

        <div style={{ height: '320px', width: '100%' }}>
          {isLoading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '1.2rem' }}>
              {t.analyzing}
            </div>
          ) : (
            <div style={{ height: '100%', animation: isVisible ? 'drawChartReveal 1.5s ease-out forwards' : 'none' }}>
              <Line data={data} options={options} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BtcChart;