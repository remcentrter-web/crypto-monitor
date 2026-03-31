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

const BtcChart = ({ btcData }) => {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
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
        const res = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1');
        if (!res.ok) throw new Error('Ліміт API');
        const data = await res.json();
        const prices = data.prices.map(item => item[1]);
        setChartData(prices);
      } catch (error) {
        console.warn("Малюємо резервний графік BTC");
        const basePrice = btcData?.current_price || 67000;
        const fakePrices = Array.from({length: 24}, (_, i) => 
          basePrice * (1 + Math.sin(i / 2) * 0.02 + Math.random() * 0.01)
        );
        setChartData(fakePrices);
      } finally {
        setIsLoading(false);
      }
    };
    if (btcData) fetchBtcHistory();
  }, [btcData]);

  if (!btcData) return null;

  const data = {
    labels: chartData.map((_, i) => i),
    datasets: [
      {
        label: 'Ціна BTC ($)',
        data: chartData,
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

          const isGrowing = chartData[chartData.length - 1] >= chartData[0];
          const gradientColor = isGrowing ? CHART_GREEN : CHART_RED;

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          // ЗРОБИЛИ ГРАФІК ПРОЗОРІШИМ (було 66, стало 33)
          gradient.addColorStop(0, `${gradientColor}33`); 
          gradient.addColorStop(1, `${gradientColor}00`); 
          return gradient;
        },
      },
      // НОВА ФІЧА: Пунктирна лінія поточної ціни
      {
        label: 'Поточна ціна',
        data: Array(chartData.length).fill(btcData.current_price),
        borderColor: 'rgba(255, 255, 255, 0.2)', // Напівпрозора біла лінія
        borderWidth: 1,
        borderDash: [5, 5], // Робить лінію пунктирною
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
        callbacks: {
          label: (context) => `$${context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`,
          title: () => ''
        }
      }
    },
    scales: { x: { display: false }, y: { display: false } },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
  };

  const high = btcData.high_24h || btcData.current_price * 1.05;
  const low = btcData.low_24h || btcData.current_price * 0.95;
  const rangePercent = Math.min(Math.max(((btcData.current_price - low) / (high - low)) * 100, 0), 100);

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
                  ${btcData.current_price.toLocaleString()}
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
              ⚡ НАЖИВО: АКТУАЛЬНО (24Г)
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '30px', padding: '15px', background: '#12161c', borderRadius: '15px', border: '1px solid #2b3139' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '0.9rem', marginBottom: '8px' }}>
            <span>Мін. 24г: <span style={{color: '#fff'}}>${low.toLocaleString()}</span></span>
            <span>Макс. 24г: <span style={{color: '#fff'}}>${high.toLocaleString()}</span></span>
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

        <div style={{ height: '300px', width: '100%' }}>
          {isLoading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '1.2rem' }}>
              Аналізуємо ринок... ⏳
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