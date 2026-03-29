import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './Navbar.css';
import CoinModal from './components/CoinModal';

function App() {
  const [prices, setPrices] = useState({});
  const [lastUpdated, setLastUpdated] = useState('');
  const prevPricesRef = useRef({});
  const [selectedCoin, setSelectedCoin] = useState(null);
  
  // --- НОВІ СТАНИ ДЛЯ ТОП-50 ТА ПОШУКУ ---
  const [coins, setCoins] = useState([]); 
  const [searchQuery, setSearchQuery] = useState(''); 
  // ---------------------------------------

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('myFavorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('myFavorites', JSON.stringify(favorites));
  }, [favorites]);

  // ОНОВЛЕНИЙ FETCH ДЛЯ ТОП-50 З COINGECKO
  useEffect(() => {
   const fetchTop50 = async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&_t=${Date.now()}`
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        const results = {};
        data.forEach(item => {
          const symbol = item.symbol.toUpperCase();
          
          // НОВА ЛОГІКА ЦІНИ: якщо менше 1 цента (0.01) — показуємо 6 цифр, інакше стандартно 2 або 4
          const formattedPrice = item.current_price < 0.01 
            ? item.current_price.toFixed(6) 
            : item.current_price.toFixed(item.current_price > 1 ? 2 : 4);

          results[symbol] = {
            id: item.id,
          price: formattedPrice,
          change: item.price_change_percentage_24h?.toFixed(2),
          name: item.name,
          image: item.image,
          // --- НОВІ ДАНІ ДЛЯ МОДАЛКИ ---
          rank: item.market_cap_rank,
          marketCap: item.market_cap,
          high24h: item.high_24h,
          low24h: item.low_24h,
          volume: item.total_volume,
          ath: item.ath
        };
        });

        setPrices(prev => {
          prevPricesRef.current = prev;
          return results;
        });
        
        setCoins(data);
        setLastUpdated(new Date().toLocaleTimeString('uk-UA', { timeZone: 'Europe/Kyiv' }));
      }
    } catch (err) {
      console.error("Помилка CoinGecko:", err);
    }
  };
    fetchTop50();
    const interval = setInterval(fetchTop50, 30000); 
    return () => clearInterval(interval);
  }, []);
  // Це залишаємо для порівняння цін (пульсації)
  useEffect(() => {
    prevPricesRef.current = prices;
  }, [prices]);

  const toggleFavorite = (coinId) => {
    setFavorites(prev => 
      prev.includes(coinId) ? prev.filter(id => id !== coinId) : [...prev, coinId]
    );
  };

 // Допоміжна функція для створення карток з логотипами
  const renderCard = (id, name, isSmall = false) => {
    const coinData = prices[id]; 
    const currentPrice = coinData?.price;
    const changePercent = coinData?.change;
    const coinImage = coinData?.image; // Отримуємо посилання на картинку
    
    const prevPriceData = prevPricesRef.current[id];
    const prevPrice = prevPriceData?.price;
    
    const isUp = parseFloat(currentPrice) >= parseFloat(prevPrice);
    const isPositiveChange = parseFloat(changePercent) >= 0;
    const isFavorite = favorites.includes(id);

    const flashClass = (currentPrice && prevPrice && currentPrice !== prevPrice) 
      ? (isUp ? 'up-flash' : 'down-flash') 
      : '';

    return (
      <div 
        key={id} 
        className={`crypto-card ${id.toLowerCase()} ${isSmall ? 'small-card' : ''} ${flashClass}`}
        onClick={() => setSelectedCoin(id)} 
        style={{ cursor: 'pointer' }}
      >
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            
            {/* Виводимо логотип монети */}
            {coinImage && (
              <img 
                src={coinImage} 
                alt={id} 
                style={{ width: isSmall ? '24px' : '32px', borderRadius: '50%' }} 
              />
            )}
            
            <h2 style={{ margin: 0, fontSize: isSmall ? '1rem' : '1.5rem' }}>
             {name.length > 18 ? name.substring(0, 18) + '...' : name}
            </h2>
          </div>

          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(id);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: isFavorite ? '#f7931a' : '#444' }}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '10px' }}>
          <p className={`price ${isUp ? 'up' : 'down'}`} style={{ margin: 0, fontSize: isSmall ? '1.1rem' : '1.4rem' }}>
            <span className="arrow">{isUp ? '▲' : '▼'}</span>
            ${currentPrice || '...'}
          </p>
          
          {changePercent && (
            <span className={isPositiveChange ? 'green-text' : 'red-text'} style={{ fontSize: '0.9rem' }}>
              {isPositiveChange ? '+' : ''}{changePercent}%
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-logo">CRYPTO MONITOR</div>
        <div className="user-block" onClick={() => alert("Профіль Максим")}>
          <span className="user-name">Максим</span>
          <div className="user-avatar">Д</div>
        </div>
      </nav>

      {/* Секція "МОЄ ОБРАНЕ" */}
      {favorites.length > 0 && (
        <div className="popular-section" style={{ background: 'rgba(247, 147, 26, 0.05)', padding: '20px', borderRadius: '20px', margin: '20px auto', maxWidth: '1200px' }}>
          <h2 className="section-title">⭐ МОЄ ОБРАНЕ</h2>
          <div className="crypto-container">
            {favorites.map(id => renderCard(id, id === 'BTC' ? 'Bitcoin' : id === 'ETH' ? 'Ethereum' : id, true))}
          </div>
        </div>
      )}

      {selectedCoin && (
        <CoinModal 
          coinId={selectedCoin} 
          data={prices[selectedCoin]} 
          onClose={() => setSelectedCoin(null)} 
        />
      )}
      <h1>Топ-3 криптовалюти на сьогодні</h1>
      <p className="update-time">Останнє оновлення: {lastUpdated}</p>
      
      <div className="crypto-container">
       {renderCard('BTC', 'Bitcoin')}
        {renderCard('ETH', 'Ethereum')}
          {renderCard('SOL', 'Solana')}     
      </div>

      <div className="popular-section">
        <h2 className="section-title">Популярні блокчейн-проекти 2026 року</h2>
        <div className="popular-grid">
          {renderCard('BNB', 'Binance Coin', true)}
          {renderCard('XRP', 'Ripple', true)}
          {renderCard('ADA', 'Cardano', true)}
          {renderCard('DOGE', 'Dogecoin', true)}
          {renderCard('TRX', 'TRON', true)}
          {renderCard('DOT', 'Polkadot', true)}
          {renderCard('LTC', 'Litecoin', true)}
          {renderCard('LINK', 'Chainlink', true)}
        </div>
      </div>
      {/* НОВА СЕКЦІЯ: ВЕСЬ РИНОК */}
      <div className="popular-section">
        <h2 className="section-title">Весь ринок (Топ-50)</h2>
        <div className="popular-grid">
          {coins.map(coin => renderCard(coin.symbol.toUpperCase(), coin.name, true))}
        </div>
      </div>
    </div>
  );
}

export default App;