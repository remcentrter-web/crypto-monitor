import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './Navbar.css';
import CoinModal from './components/CoinModal';

function App() {
  const [prices, setPrices] = useState({});
  const [lastUpdated, setLastUpdated] = useState('');
  const prevPricesRef = useRef({});
const [selectedCoin, setSelectedCoin] = useState(null);
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
      const symbols = [
        'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 
        'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 
        'TRXUSDT', 'DOTUSDT', 'LTCUSDT', 'MATICUSDT'
      ];
      
      // Один запит на всі монети — отримуємо ціну + відсотки
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`)
        .then(r => r.json())
        .then(data => {
          const results = {};
          data.forEach(item => {
            const coinName = item.symbol.replace('USDT', '');
            results[coinName] = {
              price: parseFloat(item.lastPrice).toFixed(coinName === 'BTC' || coinName === 'ETH' ? 2 : 4),
              change: parseFloat(item.priceChangePercent).toFixed(2)
            };
          });

          setPrices(results);
          setLastUpdated(new Date().toLocaleTimeString('uk-UA', { timeZone: 'Europe/Kyiv' }));
        })
        .catch(err => console.error("Помилка API:", err));
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
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

  // Допоміжна функція для створення карток
  const renderCard = (id, name, isSmall = false) => {
    const coinData = prices[id]; // Отримуємо дані про монету
    const currentPrice = coinData?.price;
    const changePercent = coinData?.change;
    
    // Порівнюємо ціну з попередньою для анімації спалаху
    const prevPriceData = prevPricesRef.current[id];
    const prevPrice = prevPriceData?.price;
    
    const isUp = parseFloat(currentPrice) >= parseFloat(prevPrice);
    const isPositiveChange = parseFloat(changePercent) >= 0;
    const isFavorite = favorites.includes(id);

    // Визначаємо клас для блимання (якщо ціна змінилася)
    const flashClass = (currentPrice && prevPrice && currentPrice !== prevPrice) 
      ? (isUp ? 'up-flash' : 'down-flash') 
      : '';

    return (
<div 
  key={id} 
  className={`crypto-card ${id.toLowerCase()} ${isSmall ? 'small-card' : ''} ${flashClass}`}
  onClick={() => setSelectedCoin(id)} 
  style={{ cursor: 'pointer' }}
>        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: isSmall ? '1rem' : '1.5rem' }}>{name} ({id})</h2>
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
          
          {/* Відображення відсотків */}
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