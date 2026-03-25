import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './Navbar.css';

function App() {
  const [prices, setPrices] = useState({});
  const [lastUpdated, setLastUpdated] = useState('');
  const prevPricesRef = useRef({});

  // 1. Завантаження обраного з пам'яті
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('myFavorites');
    return saved ? JSON.parse(saved) : [];
  });

  // Автозбереження зірочок
  useEffect(() => {
    localStorage.setItem('myFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    const fetchPrices = () => {
      // Список усіх 11 монет (3 основні + 8 додаткових)
      const symbols = [
        'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 
        'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 
        'TRXUSDT', 'DOTUSDT', 'LTCUSDT', 'MATICUSDT'
      ];
      
      Promise.all(
        symbols.map(s => fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${s}`).then(r => r.json()))
      ).then(data => {
        const results = {};
        data.forEach(item => {
          const coinName = item.symbol.replace('USDT', '');
          results[coinName] = parseFloat(item.price).toFixed(coinName === 'BTC' || coinName === 'ETH' ? 2 : 4);
        });

        setPrices(results);
        setLastUpdated(new Date().toLocaleTimeString('uk-UA', { timeZone: 'Europe/Kyiv' }));
      }).catch(err => console.error("Помилка API:", err));
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    prevPricesRef.current = prices;
  }, [prices]);

  const toggleFavorite = (coinId) => {
    setFavorites(prev => 
      prev.includes(coinId) ? prev.filter(id => id !== coinId) : [...prev, coinId]
    );
  };

  // Допоміжна функція для створення карток
  const renderCard = (id, name, isSmall = false) => {
    const currentPrice = prices[id];
    const prevPrice = prevPricesRef.current[id];
    const isUp = parseFloat(currentPrice) >= parseFloat(prevPrice);
    const isFavorite = favorites.includes(id);

    return (
      <div key={id} className={`crypto-card ${id.toLowerCase()} ${isSmall ? 'small-card' : ''}`}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>{name} ({id})</h2>
          <button 
            onClick={() => toggleFavorite(id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: isFavorite ? '#f7931a' : '#444' }}
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
        <p className={`price ${isUp ? 'up' : 'down'}`}>
          <span className="arrow">{isUp ? '▲' : '▼'}</span>
          ${currentPrice || '...'}
        </p>
      </div>
    );
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-logo">CRYPTO MONITOR</div>
        <div className="user-block" onClick={() => alert("Профіль Максим")}>
          <span className="user-name">Максим</span>
          <div className="user-avatar">М</div>
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

      <h1>Топ-3 криптовалюти на сьогодні</h1>
      <p className="update-time">Останнє оновлення: {lastUpdated}</p>
      
      <div className="crypto-container">
        {renderCard('BTC', 'Bitcoin')}
        {renderCard('ETH', 'Ethereum')}
        {renderCard('SOL', 'Solana')}
      </div>

      <div className="popular-section">
        <h2 className="section-title">8 популярних криптовалют</h2>
        <div className="popular-grid">
          {renderCard('BNB', 'Binance Coin', true)}
          {renderCard('XRP', 'Ripple', true)}
          {renderCard('ADA', 'Cardano', true)}
          {renderCard('DOGE', 'Dogecoin', true)}
          {renderCard('TRX', 'TRON', true)}
          {renderCard('DOT', 'Polkadot', true)}
          {renderCard('LTC', 'Litecoin', true)}
          {renderCard('MATIC', 'Polygon', true)}
        </div>
      </div>
    </div>
  );
}

export default App;