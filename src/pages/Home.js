import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import CoinModal from '../components/CoinModal'; 
import BtcChart from '../components/BtcChart'; 
import HeroBackground from '../components/HeroBackground';

let cachedGlobalData = null;
let cachedFearGreed = null;
let lastFetchTime = 0;

const homeTranslations = {
  ua: {
    heroTitle1: "Майбутнє фінансів", heroTitle2: "у твоїх руках",
    heroSub: "Найшвидший та найзручніший моніторинг криптовалют. Відстежуй тренди, аналізуй ринок та приймай правильні рішення в реальному часі.",
    heroBtn: "Дослідити ринок 🚀",
    leaders: "📊 Лідери ринку (за 24 год)",
    loadingLeaders: "Завантаження лідерів...",
    globalTitle: "🌐 Глобальна статистика",
    marketCap: "Загальна ринкова капіталізація",
    volume: "Добовий обсяг торгів (24 год)",
    dominance: "Ринкове домінування BTC",
    fng: "Fear & Greed Index"
  },
  en: {
    heroTitle1: "The future of finance", heroTitle2: "is in your hands",
    heroSub: "The fastest and most convenient crypto monitoring. Track trends, analyze the market, and make the right decisions in real time.",
    heroBtn: "Explore Market 🚀",
    leaders: "📊 Market Leaders (24h)",
    loadingLeaders: "Loading leaders...",
    globalTitle: "🌐 Global Statistics",
    marketCap: "Total Market Capitalization",
    volume: "24h Trading Volume",
    dominance: "BTC Market Dominance",
    fng: "Fear & Greed Index"
  }
};

function Home({ coins = [] }) {
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'ua');
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('app_lang') || 'ua';
      if (currentLang !== lang) setLang(currentLang);
    }, 300);
    return () => clearInterval(interval);
  }, [lang]);

  const t = homeTranslations[lang];

  const [globalData, setGlobalData] = useState(cachedGlobalData);
  const [fearGreed, setFearGreed] = useState(cachedFearGreed);
  const [selectedCoin, setSelectedCoin] = useState(null);

  const leadersRef = useRef(null);

  useEffect(() => {
    const now = Date.now();
    if (cachedGlobalData && (now - lastFetchTime < 300000)) return;

    fetch('https://api.coingecko.com/api/v3/global')
      .then(res => res.json())
      .then(data => {
        setGlobalData(data.data);
        cachedGlobalData = data.data;
      })
      .catch(err => console.error("Помилка global:", err));

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

  const sortedCoins = [...coins].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
  const topGainers = sortedCoins.slice(0, 2);
  const topLosers = sortedCoins.slice(-2).reverse();
  const bitcoinData = coins.find(c => c.id === 'bitcoin');

  const scrollToLeaders = () => {
    if (!leadersRef.current) return;
    const targetPosition = leadersRef.current.getBoundingClientRect().top + window.scrollY - 30; 
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = 800;
    let start = null;

    window.requestAnimationFrame(function step(timestamp) {
      if (!start) start = timestamp;
      const progress = timestamp - start;
      const easeInOutCubic = progress < duration / 2 
        ? 4 * Math.pow(progress / duration, 3) 
        : 1 - Math.pow(-2 * progress / duration + 2, 3) / 2;
      
      window.scrollTo(0, startPosition + distance * easeInOutCubic);
      
      if (progress < duration) {
        window.requestAnimationFrame(step);
      } else {
        window.scrollTo(0, targetPosition);
      }
    });
  };

  return (
    <>
      <style>
        {`
          @keyframes bounceDown {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-12px); }
            60% { transform: translateY(-6px); }
          }
        `}
      </style>

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', 
        minHeight: '80vh', color: 'white', textAlign: 'center', 
        padding: '50px 20px', position: 'relative'
      }}>
        
        <HeroBackground />

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          
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
            {t.heroTitle1} <br/> {t.heroTitle2}
          </h1>

          <p style={{ 
            fontSize: '1.2rem', color: '#aaa', maxWidth: '600px', 
            marginBottom: '40px', lineHeight: '1.6' 
          }}>
            {t.heroSub}
          </p>

          <Link to="/market" style={{ 
            padding: '15px 40px', fontSize: '1.2rem', fontWeight: 'bold', 
            color: '#12161c', background: '#f7931a', borderRadius: '30px', 
            textDecoration: 'none', boxShadow: '0 4px 15px rgba(247, 147, 26, 0.4)',
            transition: 'all 0.3s ease'
          }}>
            {t.heroBtn}
          </Link>

          <div style={{
            display: 'flex', justifyContent: 'center', width: '100%', 
            marginTop: '40px', 
            marginBottom: '60px' 
          }}>
            <div 
              onClick={scrollToLeaders}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '70px', height: '70px',
                border: '2px solid rgba(247, 147, 26, 0.4)', 
                borderRadius: '50%',
                background: 'rgba(247, 147, 26, 0.1)', 
                cursor: 'pointer',
                animation: 'bounceDown 2s infinite',
                color: '#f7931a', fontSize: '2rem', 
                transition: 'all 0.3s ease',
                boxShadow: '0 5px 15px rgba(247, 147, 26, 0.2)'
              }}
            >
              ↓
            </div>
          </div>

          <div ref={leadersRef} style={{ width: '100%', maxWidth: '1000px', textAlign: 'left', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '25px', color: '#fff' }}>
              {t.leaders}
            </h2>
            {coins.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                {topGainers.map(coin => (
                  <div key={coin.id} onClick={() => setSelectedCoin(coin)} style={{ background: '#1e2329', padding: '20px', borderRadius: '15px', border: '1px solid rgba(0, 230, 118, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'transform 0.2s ease', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                      <img src={coin.image} alt={coin.name} style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{coin.symbol.toUpperCase()}</h4>
                        <p style={{ margin: 0, fontSize: '1rem', color: '#aaa' }}>${coin.current_price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div style={{ color: '#00e676', fontWeight: 'bold', fontSize: '1.2rem' }}>+{coin.price_change_percentage_24h.toFixed(2)}%</div>
                  </div>
                ))}
                {topLosers.map(coin => (
                  <div key={coin.id} onClick={() => setSelectedCoin(coin)} style={{ background: '#1e2329', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255, 77, 77, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'transform 0.2s ease', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                      <img src={coin.image} alt={coin.name} style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{coin.symbol.toUpperCase()}</h4>
                        <p style={{ margin: 0, fontSize: '1rem', color: '#aaa' }}>${coin.current_price.toLocaleString()}</p>
                      </div>
                    </div>
                    <div style={{ color: '#ff4d4d', fontWeight: 'bold', fontSize: '1.2rem' }}>{coin.price_change_percentage_24h.toFixed(2)}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#aaa' }}>{t.loadingLeaders}</p>
            )}
          </div>

          {bitcoinData && <BtcChart btcData={bitcoinData} />}

          <div style={{ width: '100%', maxWidth: '1000px', textAlign: 'left', marginBottom: '25px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0', color: '#fff' }}>{t.globalTitle}</h2>
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', 
            marginBottom: '40px', width: '100%', maxWidth: '1000px'
          }}>
            <div style={{ background: '#1e2329', padding: '20px', borderRadius: '15px', border: '1px solid #2b3139' }}>
              <h3 style={{ color: '#aaa', fontSize: '0.9rem', margin: '0 0 10px 0' }}>{t.marketCap}</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#fff' }}>${globalData ? formatNumber(globalData.total_market_cap?.usd) : '...'}</p>
            </div>
            <div style={{ background: '#1e2329', padding: '20px', borderRadius: '15px', border: '1px solid #2b3139' }}>
              <h3 style={{ color: '#aaa', fontSize: '0.9rem', margin: '0 0 10px 0' }}>{t.volume}</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#fff' }}>${globalData ? formatNumber(globalData.total_volume?.usd) : '...'}</p>
            </div>
            <div style={{ background: '#1e2329', padding: '20px', borderRadius: '15px', border: '1px solid #2b3139' }}>
              <h3 style={{ color: '#aaa', fontSize: '0.9rem', margin: '0 0 10px 0' }}>{t.dominance}</h3>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#f7931a' }}>{globalData ? globalData.market_cap_percentage?.btc?.toFixed(1) : '...'}%</p>
            </div>

            <div style={{ gridColumn: '1 / -1', background: '#1e2329', padding: '30px', borderRadius: '15px', border: '1px solid #2b3139', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <h3 style={{ color: '#aaa', fontSize: '1rem', margin: '0 0 15px 0', textTransform: 'uppercase' }}>{t.fng}</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: '900', margin: 0, color: fearGreed ? getFearGreedColor(fearGreed.value) : '#fff' }}>{fearGreed ? `${fearGreed.value} / 100` : '...'}</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '1.1rem', color: '#aaa' }}>{fearGreed ? (lang === 'ua' ? (fearGreed.value_classification.replace("Extreme Fear", "Екстремальний страх").replace("Fear", "Страх").replace("Neutral", "Нейтрально").replace("Greed", "Жадібність").replace("Extreme Greed", "Екстремальна жадібність")) : fearGreed.value_classification) : ''}</p>
            </div>
          </div>
        </div>

        {selectedCoin && (
          <CoinModal 
            coinId={selectedCoin.id} 
            data={{ id: selectedCoin.id, price: selectedCoin.current_price.toString(), change: selectedCoin.price_change_percentage_24h.toFixed(2).toString(), image: selectedCoin.image, rank: selectedCoin.market_cap_rank, marketCap: selectedCoin.market_cap, volume: selectedCoin.total_volume, high24h: selectedCoin.high_24h, low24h: selectedCoin.low_24h, ath: selectedCoin.ath }}
            onClose={() => setSelectedCoin(null)} 
          />
        )}
      </div>
    </>
  );
}

export default Home;