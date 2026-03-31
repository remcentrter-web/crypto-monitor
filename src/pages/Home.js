import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Імпортуємо твоє модальне вікно
import CoinModal from '../components/CoinModal'; 

// --- ГЛОБАЛЬНИЙ КЕШ ---
let cachedGlobalData = null;
let cachedFearGreed = null;
let lastFetchTime = 0;

function Home({ coins = [] }) {
  const [globalData, setGlobalData] = useState(cachedGlobalData);
  const [fearGreed, setFearGreed] = useState(cachedFearGreed);
  
  // НОВИЙ СТАН: для відкритого модального вікна
  const [selectedCoin, setSelectedCoin] = useState(null);

  useEffect(() => {
    const now = Date.now();
    if (cachedGlobalData && (now - lastFetchTime < 300000)) {
      return; // Дані з кешу
    }

    // 1. Отримуємо глобальну статистику
    fetch('https://api.coingecko.com/api/v3/global')
      .then(res => res.json())
      .then(data => {
        setGlobalData(data.data);
        cachedGlobalData = data.data;
      })
      .catch(err => console.error("Помилка global:", err));

    // 2. Індекс страху та жадібності
    fetch('https://api.alternative.me/fng/')
      .then(res => res.json())
      .then(data => {
        setFearGreed(data.data[0]);
        cachedFearGreed = data.data[0];
      })
      .catch(err => console.error("Помилка Fear & Greed:", err));

    lastFetchTime = now;
  }, []);

  const formatNumber = (num) => {
    if (!num) return '...';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    return num.toLocaleString();
  };

  const getFearGreedColor = (value) => {
    if (value <= 35) return '#ff4d4d'; 
    if (value <= 65) return '#ffbb00'; 
    return '#00e676'; 
  };

  // Логіка злетів та падінь
  const sortedCoins = [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
  const topGainers = sortedCoins.slice(0, 2);
  const topLosers = sortedCoins.slice(-2).reverse();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      minHeight: '80vh', color: 'white', textAlign: 'center', 
      padding: '50px 20px', position: 'relative'
    }}>
      
      <div style={{ 
        width: '300px', height: '300px', 
        background: 'linear-gradient(135deg, #f7931a, #ffbb00)', 
        borderRadius: '50%', filter: 'blur(100px)', 
        position: 'absolute', top: '10%', zIndex: -1, opacity: 0.15 
      }}></div>

      <h1 style={{ 
        fontSize: '4rem', fontWeight: '900', marginBottom: '20px', 
        background: 'linear-gradient(90deg, #f7931a, #fff)', 
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        lineHeight: '1.2'
      }}>
        Майбутнє фінансів <br/> у твоїх руках
      </h1>

      <p style={{ 
        fontSize: '1.2rem', color: '#aaa', maxWidth: '600px', 
        marginBottom: '40px', lineHeight: '1.6' 
      }}>
        Найшвидший та найзручніший моніторинг криптовалют. Відстежуй тренди, аналізуй ринок та приймай правильні рішення в реальному часі.
      </p>

      <Link to="/market" style={{ 
        padding: '15px 40px', fontSize: '1.2rem', fontWeight: 'bold', 
        color: '#12161c', background: '#f7931a', borderRadius: '30px', 
        textDecoration: 'none', boxShadow: '0 4px 15px rgba(247, 147, 26, 0.4)',
        transition: 'all 0.3s ease', marginBottom: '60px'
      }}>
        Дослідити ринок 🚀
      </Link>

      {/* --- СТАТИСТИКА РИНКУ ТА ІНДЕКС --- */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', 
        marginBottom: '50px', width: '100%', maxWidth: '1000px'
      }}>
        <div style={{ background: '#1e2329', padding: '20px', borderRadius: '15px', border: '1px solid #2b3139' }}>
          <h3 style={{ color: '#aaa', fontSize: '1rem', margin: '0 0 10px 0' }}>Поточна капіталізація</h3>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#fff' }}>
            ${globalData ? formatNumber(globalData.total_market_cap?.usd) : '...'}
          </p>
        </div>
        
        <div style={{ background: '#1e2329', padding: '20px', borderRadius: '15px', border: '1px solid #2b3139' }}>
          <h3 style={{ color: '#aaa', fontSize: '1rem', margin: '0 0 10px 0' }}>Обсяг торгів (24 год)</h3>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#fff' }}>
            ${globalData ? formatNumber(globalData.total_volume?.usd) : '...'}
          </p>
        </div>
        
        <div style={{ background: '#1e2329', padding: '20px', borderRadius: '15px', border: '1px solid #2b3139' }}>
          <h3 style={{ color: '#aaa', fontSize: '1rem', margin: '0 0 10px 0' }}>Поточне домінування BTC</h3>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#f7931a' }}>
            {globalData ? globalData.market_cap_percentage?.btc?.toFixed(1) : '...'}%
          </p>
        </div>
        
        <div style={{ background: '#1e2329', padding: '20px', borderRadius: '15px', border: '1px solid #2b3139' }}>
          <h3 style={{ color: '#aaa', fontSize: '1rem', margin: '0 0 10px 0' }}>Індекс страху/жадібності</h3>
          <p style={{ 
            fontSize: '1.8rem', fontWeight: 'bold', margin: 0, 
            color: fearGreed ? getFearGreedColor(fearGreed.value) : '#fff' 
          }}>
            {fearGreed ? `${fearGreed.value} / 100` : '...'}
          </p>
          <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#aaa' }}>
            {fearGreed ? fearGreed.value_classification : ''}
          </p>
        </div>
      </div>

      {/* --- ЛІДЕРИ ЗРОСТАННЯ ТА ПАДІННЯ --- */}
      <div style={{ width: '100%', maxWidth: '1000px', textAlign: 'left', paddingBottom: '40px' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid #2b3139', paddingBottom: '10px' }}>
          📊 Лідери зростання та падіння (за 24 год)
        </h2>
        
        {coins.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
            
            {/* Рендеримо 2 найкращі монети */}
            {topGainers.map(coin => (
              <div 
                key={coin.id} 
                onClick={() => setSelectedCoin(coin)} 
                style={{
                  background: '#1e2329', padding: '15px', borderRadius: '15px', border: '1px solid rgba(0, 230, 118, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease' // ДОДАНО ПЛАВНІСТЬ
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} // СТРИБОК
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'} // ПОВЕРНЕННЯ
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img src={coin.image} alt={coin.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{coin.symbol.toUpperCase()}</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#aaa' }}>${coin.current_price.toLocaleString()}</p>
                  </div>
                </div>
                <div style={{ color: '#00e676', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  +{coin.price_change_percentage_24h.toFixed(2)}%
                </div>
              </div>
            ))}

            {/* Рендеримо 2 найгірші монети */}
            {topLosers.map(coin => (
              <div 
                key={coin.id} 
                onClick={() => setSelectedCoin(coin)} 
                style={{
                  background: '#1e2329', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255, 77, 77, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease' // ДОДАНО ПЛАВНІСТЬ
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} // СТРИБОК
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'} // ПОВЕРНЕННЯ
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <img src={coin.image} alt={coin.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{coin.symbol.toUpperCase()}</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#aaa' }}>${coin.current_price.toLocaleString()}</p>
                  </div>
                </div>
                <div style={{ color: '#ff4d4d', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {coin.price_change_percentage_24h.toFixed(2)}%
                </div>
              </div>
            ))}

          </div>
        ) : (
          <p style={{ color: '#aaa' }}>Завантаження аналітики...</p>
        )}
      </div>

      {/* РЕНДЕР МОДАЛЬНОГО ВІКНА (якщо обрано монету) */}
      {selectedCoin && (
        <CoinModal 
          coinId={selectedCoin.id} 
          data={{
            id: selectedCoin.id,
            price: selectedCoin.current_price.toString(),
            change: selectedCoin.price_change_percentage_24h.toFixed(2).toString(), // ДОДАНО .toFixed(2)
            image: selectedCoin.image,
            rank: selectedCoin.market_cap_rank,
            marketCap: selectedCoin.market_cap,
            volume: selectedCoin.total_volume,
            high24h: selectedCoin.high_24h,
            low24h: selectedCoin.low_24h,
            ath: selectedCoin.ath
          }}
          onClose={() => setSelectedCoin(null)} 
        />
      )}

    </div>
  );
}

export default Home;  