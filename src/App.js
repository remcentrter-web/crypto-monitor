import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './Navbar.css';
import CoinModal from './components/CoinModal';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Market from './pages/Market';
import Favorites from './pages/Favorites';

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

  const [isSearchFocused, setIsSearchFocused] = useState(false); 
  const [searchCategory, setSearchCategory] = useState('all'); 

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
        setPrices(prev => {
          const results = {};
          
          data.forEach(item => {
            const symbol = item.symbol.toUpperCase();
            const formattedPrice = item.current_price < 0.01 
              ? item.current_price.toFixed(6) 
              : item.current_price.toFixed(item.current_price > 1 ? 2 : 4);

            // ФІКС БАГА: Запам'ятовуємо, куди пішла ціна (вгору чи вниз)
            let dir = 'up'; 
            if (prev[symbol]) {
              if (parseFloat(formattedPrice) > parseFloat(prev[symbol].price)) {
                dir = 'up';
              } else if (parseFloat(formattedPrice) < parseFloat(prev[symbol].price)) {
                dir = 'down';
              } else {
                dir = prev[symbol].direction || 'up'; // Якщо не змінилась, лишаємо старий напрямок
              }
            }

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
              ath: item.ath,
              direction: dir // Зберігаємо напрямок у стан
            };
          });

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

    if (isAdding) {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 500);
    }

    setToast({ 
      show: true, 
      message: isAdding ? `${coinId} додано в обране` : `${coinId} видалено з обраного`,
      isAdd: isAdding
    });

    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const renderCard = (id, name, isSmall = false) => {
    const coinData = prices[id]; 
    const currentPrice = coinData?.price;
    const changePercent = coinData?.change;
    const coinImage = coinData?.image; 
    
    // ФІКС БАГА: Беремо колір з пам'яті монети
    const isUp = coinData?.direction !== 'down'; 
    
    const prevPriceData = prevPricesRef.current[id];
    const prevPrice = prevPriceData?.price;
    
    const isPositiveChange = parseFloat(changePercent) >= 0;
    const isFavorite = favorites.includes(id);

    // Анімація спалаху (залишається працювати тільки в момент оновлення)
    const flashClass = (currentPrice && prevPrice && currentPrice !== prevPrice) 
      ? (parseFloat(currentPrice) > parseFloat(prevPrice) ? 'up-flash' : 'down-flash') 
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

  const filteredCoins = coins.filter(coin => {
    const matchesText = coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        coin.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCategory = true;
    if (searchCategory === 'top10') matchesCategory = coin.market_cap_rank <= 10;
    if (searchCategory === 'gainers') matchesCategory = coin.price_change_percentage_24h > 0;
    if (searchCategory === 'stables') {
      const stables = ['usdt', 'usdc', 'usds', 'dai', 'fdusd', 'usde'];
      matchesCategory = stables.includes(coin.symbol.toLowerCase());
    }
    if (searchCategory === 'favorites') matchesCategory = favorites.includes(coin.symbol.toUpperCase());

    return matchesText && matchesCategory;
  });

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
              placeholder="Пошук або фільтр..."   
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              style={{ 
                padding: '10px 15px', borderRadius: '20px', border: 'none', 
                outline: 'none', width: isSearchFocused ? '350px' : '250px', 
                background: '#2b3139', color: 'white', fontSize: '1rem', textAlign: 'center',
                transition: 'width 0.3s ease, box-shadow 0.3s ease',
                boxShadow: isSearchFocused ? '0 0 10px rgba(247, 147, 26, 0.3)' : 'none'
              }}
            />
            
            {(isSearchFocused || searchQuery.trim().length > 0 || searchCategory !== 'all') && (
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', 
                width: '450px', background: '#1e2329', borderRadius: '15px', 
                marginTop: '10px', overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)', zIndex: 1000, border: '1px solid #333'
              }}>
                
                <div style={{ padding: '12px', background: '#15191e', borderBottom: '1px solid #2b3139', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                  {[
                    { id: 'all', label: 'Всі' },
                    { id: 'top10', label: '🔥 Топ-10' },
                    { id: 'gainers', label: '🚀 Зростають' },
                    { id: 'stables', label: '💵 Стейбли' },
                    { id: 'favorites', label: '⭐ Обрані' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSearchCategory(cat.id)}
                      style={{
                        padding: '6px 12px', borderRadius: '15px', fontSize: '0.85rem', border: 'none',
                        background: searchCategory === cat.id ? '#f7931a' : '#2b3139',
                        color: searchCategory === cat.id ? '#12161c' : '#aaa',
                        cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s ease'
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {filteredCoins.length > 0 ? filteredCoins.map(coin => {
                    const change = coin.price_change_percentage_24h?.toFixed(2);
                    const changeColor = coin.price_change_percentage_24h >= 0 ? '#16c784' : '#ea3943';
                    return (
                      <div 
                        key={coin.id}
                        onClick={() => {
                          setSelectedCoin(coin.symbol.toUpperCase()); 
                          setSearchQuery(''); 
                          setSearchCategory('all'); 
                        }}
                        style={{
                          padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px',
                          cursor: 'pointer', borderBottom: '1px solid #2b3139', color: 'white',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#2b3139'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <img src={coin.image} alt={coin.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 'bold' }}>{coin.name}</span>
                          <span style={{ color: '#aaa', fontSize: '0.8rem' }}>{coin.symbol.toUpperCase()}</span>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold' }}>${coin.current_price < 0.01 ? coin.current_price.toFixed(6) : coin.current_price.toFixed(2)}</div>
                          {change && (
                            <span style={{ color: changeColor, fontSize: '0.85rem' }}>
                              {coin.price_change_percentage_24h >= 0 ? '+' : ''}{change}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#aaa' }}>За цим фільтром нічого не знайдено 🤷‍♂️</div>
                  )}
                </div>
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
                  {coins.slice(0, visibleCoins).map((coin, index) => (
                    <div key={coin.id} className={index >= 16 ? 'fade-in-item' : ''} style={{ animationDelay: `${(index - 16) * 0.03}s` }}>
                      {renderCard(coin.symbol.toUpperCase(), coin.name, true)}
                    </div>
                  ))}
                </div>

                {visibleCoins < coins.length && (
                  <div style={{ textAlign: 'center', marginTop: '50px', marginBottom: '30px' }}>
                    <button className="load-more-btn pulsing-btn" onClick={() => setVisibleCoins(coins.length)}>
                      Розгорнути список ({coins.length} монет)
                    </button>
                  </div>
                )}
              </div>
            </>
          } />

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
            favorites={favorites} 
            toggleFavorite={toggleFavorite}
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