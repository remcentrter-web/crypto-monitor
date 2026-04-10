import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './Navbar.css';
import CoinModal from './components/CoinModal';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Market from './pages/Market';
import Favorites from './pages/Favorites'; // Підключаємо майбутню сторінку

function App() {
  const [prices, setPrices] = useState({});
  const [lastUpdated, setLastUpdated] = useState('');
  const prevPricesRef = useRef({});
  const [selectedCoin, setSelectedCoin] = useState(null);
  
  const [coins, setCoins] = useState([]); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [toast, setToast] = useState({ show: false, message: '', isAdd: true });
const [isPulsing, setIsPulsing] = useState(false);
const [visibleCoins, setVisibleCoins] = useState(16);

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('myFavorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('myFavorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
   const fetchTop50 = async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&_t=${Date.now()}`
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        const results = {};
        data.forEach(item => {
          const symbol = item.symbol.toUpperCase();
          const formattedPrice = item.current_price < 0.01 
            ? item.current_price.toFixed(6) 
            : item.current_price.toFixed(item.current_price > 1 ? 2 : 4);

          results[symbol] = {
            id: item.id,
            price: formattedPrice,
            change: item.price_change_percentage_24h?.toFixed(2),
            name: item.name,
            image: item.image,
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
    const interval = setInterval(fetchTop50, 60000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    prevPricesRef.current = prices;
  }, [prices]);

  const toggleFavorite = (coinId) => {
  const isAdding = !favorites.includes(coinId);
  
  setFavorites(prev => 
    isAdding ? [...prev, coinId] : prev.filter(id => id !== coinId)
  );

  // Вмикаємо пульсацію кнопки в шапці (тільки коли додаємо)
  if (isAdding) {
    setIsPulsing(true);
    setTimeout(() => setIsPulsing(false), 500);
  }

  // Показуємо плаваюче повідомлення
  setToast({ 
    show: true, 
    message: isAdding ? `${coinId} додано в обране` : `${coinId} видалено з обраного`,
    isAdd: isAdding
  });

  // Автоматично ховаємо повідомлення через 3 секунди
  setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
};

  const renderCard = (id, name, isSmall = false) => {
    const coinData = prices[id]; 
    const currentPrice = coinData?.price;
    const changePercent = coinData?.change;
    const coinImage = coinData?.image; 
    
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

  const filteredCoins = coins.filter(coin => 
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-logo">CRYPTO MONITOR</div>
          
          <div style={{ display: 'flex', gap: '15px', marginLeft: '30px', alignItems: 'center' }}>
            <Link to="/" className="nav-link-btn">Головна</Link>
            <Link to="/market" className="nav-link-btn">Ринок</Link>
          <Link to="/favorites" className={`nav-link-btn ${isPulsing ? 'pulse-nav' : ''}`}>⭐ Обране</Link>
          </div>

          <div style={{ position: 'relative', margin: '0 auto' }}>
            <input 
              type="text" 
              placeholder="Пошук монети (напр. BTC)..."   
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                padding: '10px 15px', borderRadius: '20px', border: 'none', 
                outline: 'none', width: '250px', background: '#2b3139', 
                color: 'white', fontSize: '1rem', textAlign: 'center'
              }}
            />
            {searchQuery.trim().length > 0 && filteredCoins.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, width: '100%', background: '#1e2329',
                borderRadius: '10px', marginTop: '5px', maxHeight: '300px', overflowY: 'auto',
                boxShadow: '0 5px 15px rgba(0,0,0,0.5)', zIndex: 1000, border: '1px solid #333'
              }}>
                {filteredCoins.map(coin => {
                  const change = coin.price_change_percentage_24h?.toFixed(2);
                  const changeColor = coin.price_change_percentage_24h >= 0 ? '#16c784' : '#ea3943';
                  return (
                    <div 
                      key={coin.id}
                      onClick={() => {
                        setSelectedCoin(coin.symbol.toUpperCase()); 
                        setSearchQuery(''); 
                      }}
                      style={{
                        padding: '10px 15px', display: 'flex', alignItems: 'center', gap: '10px',
                        cursor: 'pointer', borderBottom: '1px solid #2b3139', color: 'white'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2b3139'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <img src={coin.image} alt={coin.name} style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>{coin.name}</span>
                        {change && (
                          <span style={{ color: changeColor, fontSize: '0.9rem' }}>
                            {coin.price_change_percentage_24h >= 0 ? '+' : ''}{change}%
                          </span>
                        )}
                      </div>
                      <span style={{ color: '#aaa', fontSize: '0.8rem', marginLeft: 'auto' }}>{coin.symbol.toUpperCase()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="user-block" onClick={() => alert("Профіль Максим")}>
            <span className="user-name">Максим</span>
            <div className="user-avatar">Д</div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home coins={coins} />} />
          
          <Route path="/market" element={
            <>
              <Market />
              
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

              <div className="popular-section">
                <h2 className="section-title">Весь ринок</h2>
                
                <div className="popular-grid">
                  {/* ТУТ ЗМІНА 1: Додаємо клас fade-in-item для плавної появи нових карток */}
                  {coins.slice(0, visibleCoins).map((coin, index) => (
                    <div key={coin.id} className={index >= 16 ? 'fade-in-item' : ''} style={{ animationDelay: `${(index - 20) * 0.05}s` }}>
                      {renderCard(coin.symbol.toUpperCase(), coin.name, true)}
                    </div>
                  ))}
                </div>

                {visibleCoins < coins.length && (
                  <div style={{ textAlign: 'center', marginTop: '50px', marginBottom: '30px' }}>
                    <button 
                      className="load-more-btn pulsing-btn" 
                      onClick={() => setVisibleCoins(coins.length)} /* ТУТ ЗМІНА 2: Показує ВСІ монети одразу */
                    >
                      Розгорнути весь список
                    </button>
                  </div>
                )}
              </div>
            </>
          } />

          {/* НОВИЙ МАРШРУТ ДЛЯ СТОРІНКИ ОБРАНОГО */}
          <Route path="/favorites" element={
            <Favorites 
              favorites={favorites} 
              prices={prices} 
              renderCard={renderCard} 
              setFavorites={setFavorites} 
            />
          } />

        </Routes>

        {selectedCoin && (
          <CoinModal 
            coinId={selectedCoin} 
            data={prices[selectedCoin]} 
            onClose={() => setSelectedCoin(null)} 
          />
        )}
{toast.show && (
  <div className="toast-notification">
    {toast.isAdd ? '✅' : '🗑️'} {toast.message}
  </div>
)}
      </div>
    </Router>
  );
}

export default App;