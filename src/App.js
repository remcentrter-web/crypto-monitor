import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './Navbar.css';
import CoinModal from './components/CoinModal';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Market from './pages/Market';
import Favorites from './pages/Favorites';
import Alerts from './pages/Alerts';

import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import AuthModal from './components/AuthModal';
import CabinetModal from './components/CabinetModal'; 

const appTranslations = {
  ua: {
    navHome: "Головна", navMarket: "Ринок", navFav: "Обране", navAlerts: "Сповіщення",
    searchBox: "Пошук або фільтр...",
    catAll: "Всі", catTop: "🔥 Топ-10", catGain: "🚀 Зростають", catStables: "💵 Стейбли", catFav: "⭐ Обрані",
    notFound: "За цим фільтром нічого не знайдено",
    loginBtn: "Увійти / Зареєструватись", logoutMsg: "Ви вийшли з акаунта", loginMsg: "Успішний вхід",
    titleTop3: "Топ-3 криптовалюти на сьогодні",
    lastUpdate: "Останнє оновлення:",
    titlePop: "Популярні блокчейн-проекти 2026 року",
    titleAll: "Весь ринок",
    loadMore: "Розгорнути список", coinsCount: "монет",
    alertCreate: "Сповіщення створено!",
    alertTitle: "Цінове сповіщення",
    alertText1: "Програма зафіксувала, що", alertText2: "перетнув відмітку",
    alertCurrent: "Поточна ринкова ціна:", alertGotIt: "Зрозуміло, дякую!",
    logAddedFav: "Додано в обране", logRemovedFav: "Видалено з обраного", logAlertSet: "Створено сповіщення",
    logLangChanged: "Змінено мову на", logCurChanged: "Змінено валюту на", logTzChanged: "Змінено часовий пояс"
  },
  en: {
    navHome: "Home", navMarket: "Market", navFav: "Favorites", navAlerts: "Alerts",
    searchBox: "Search or filter...",
    catAll: "All", catTop: "🔥 Top-10", catGain: "🚀 Gainers", catStables: "💵 Stables", catFav: "⭐ Favorites",
    notFound: "Nothing found with this filter",
    loginBtn: "Login / Register", logoutMsg: "You have logged out", loginMsg: "Successful login",
    titleTop3: "Top-3 Cryptocurrencies Today",
    lastUpdate: "Last update:",
    titlePop: "Popular Blockchain Projects 2026",
    titleAll: "Entire Market",
    loadMore: "Expand list", coinsCount: "coins",
    alertCreate: "Alert created!",
    alertTitle: "Price Alert",
    alertText1: "The system detected that", alertText2: "crossed the mark of",
    alertCurrent: "Current market price:", alertGotIt: "Got it, thanks!",
    logAddedFav: "Added to favorites", logRemovedFav: "Removed from favorites", logAlertSet: "Alert created",
    logLangChanged: "Language changed to", logCurChanged: "Currency changed to", logTzChanged: "Timezone changed"
  }
};

const currencySymbols = {
  usd: '$', eur: '€', gbp: '£', pln: 'zł', uah: '₴'
};

function App() {
  const [language, setLanguage] = useState(localStorage.getItem('app_lang') || 'ua');
  const t = appTranslations[language] || appTranslations.ua;

  const [currency, setCurrency] = useState(localStorage.getItem('app_currency') || 'usd');
  const curSymbol = currencySymbols[currency] || '$';

  const [timezone, setTimezone] = useState(localStorage.getItem('app_tz') || 'Europe/Kyiv');

  // 🔥 ДОДАНО СТАН ДЛЯ ЖУРНАЛУ ПОДІЙ ТА ДАТИ РЕЄСТРАЦІЇ
  const [activityLog, setActivityLog] = useState(() => {
    const saved = localStorage.getItem('myActivityLog');
    return saved ? JSON.parse(saved) : [];
  });
  const [userJoinDate, setUserJoinDate] = useState("");

  // 🔥 ФУНКЦІЯ ДЛЯ ДОДАВАННЯ ПОДІЇ В ЖУРНАЛ
  const addLogEvent = (text, type = 'blue') => {
    const time = new Date().toLocaleTimeString(language === 'ua' ? 'uk-UA' : 'en-US', { timeZone: timezone, hour: '2-digit', minute: '2-digit' });
    setActivityLog(prev => [{ text, time, type }, ...prev].slice(0, 15)); // Зберігаємо останні 15 подій
  };

  useEffect(() => {
    localStorage.setItem('myActivityLog', JSON.stringify(activityLog));
  }, [activityLog]);

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('app_currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('app_tz', timezone);
  }, [timezone]);

  const [prices, setPrices] = useState({ _currency: currency });
  const [lastFetchTime, setLastFetchTime] = useState(null);
  
  const lastUpdatedFormatted = lastFetchTime 
    ? new Date(lastFetchTime).toLocaleTimeString(language === 'ua' ? 'uk-UA' : 'en-US', { timeZone: timezone })
    : '';

  const prevPricesRef = useRef({ _currency: currency });
  const [selectedCoin, setSelectedCoin] = useState(null);
  
  const [coins, setCoins] = useState([]); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [toast, setToast] = useState({ show: false, message: '', isAdd: true });
  const [isPulsing, setIsPulsing] = useState(false);
  const [visibleCoins, setVisibleCoins] = useState(16);

  const [isSearchFocused, setIsSearchFocused] = useState(false); 
  const [searchCategory, setSearchCategory] = useState('all'); 

  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCabinetModal, setShowCabinetModal] = useState(false); 

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('myFavorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // 🔥 ВИРАХОВУЄМО ДАТУ РЕЄСТРАЦІЇ З FIREBASE
        if (currentUser.metadata && currentUser.metadata.creationTime) {
          const date = new Date(currentUser.metadata.creationTime);
          const options = { year: 'numeric', month: 'long', day: 'numeric' };
          setUserJoinDate(date.toLocaleDateString(language === 'ua' ? 'uk-UA' : 'en-US', options));
        }
      }
    });
    return () => unsubscribe();
  }, [language]);

  const handleLogout = async () => {
    await signOut(auth);
    setToast({ show: true, message: t.logoutMsg, isAdd: false });
    setTimeout(() => setToast({ show: false, message: '', isAdd: true }), 3000);
  };

  useEffect(() => {
    localStorage.setItem('myFavorites', JSON.stringify(favorites));
  }, [favorites]);

  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem('myAlerts');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeAlertsQueue, setActiveAlertsQueue] = useState([]); 

  const [alertHistory, setAlertHistory] = useState(() => {
    const saved = localStorage.getItem('myAlertHistory');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('myAlertHistory', JSON.stringify(alertHistory));
  }, [alertHistory]);

  useEffect(() => {
    localStorage.setItem('myAlerts', JSON.stringify(alerts));
  }, [alerts]);

  const handleAddAlert = (coinId, targetPrice, type) => {
    const newAlert = { id: Date.now(), coinId, targetPrice: parseFloat(targetPrice), type };
    setAlerts(prev => [...prev, newAlert]);
    setToast({ show: true, message: `${t.alertCreate} (${coinId})`, isAdd: true });
    setTimeout(() => setToast({ show: false, message: '', isAdd: true }), 3000);
    // 🔥 ЗАПИС В ЖУРНАЛ: Створення сповіщення
    addLogEvent(`${t.logAlertSet}: ${coinId} ${type === 'up' ? '▲' : '▼'} ${curSymbol}${targetPrice}`, 'green');
  };

  const handleEditAlert = (id, newPrice) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, targetPrice: parseFloat(newPrice) } : a));
  };

  useEffect(() => {
    if (alerts.length === 0 || Object.keys(prices).length <= 1) return;

    let alertsToKeep = [];
    let newlyTriggered = []; 

    alerts.forEach(alertItem => {
      const coinData = prices[alertItem.coinId];
      if (!coinData) {
        alertsToKeep.push(alertItem);
        return;
      }

      const currentPrice = parseFloat(coinData.price);
      
      if (alertItem.type === 'up' && currentPrice >= alertItem.targetPrice) {
        newlyTriggered.push({ ...alertItem, currentPrice });
      } 
      else if (alertItem.type === 'down' && currentPrice <= alertItem.targetPrice) {
        newlyTriggered.push({ ...alertItem, currentPrice });
      } 
      else {
        alertsToKeep.push(alertItem); 
      }
    });

  if (newlyTriggered.length > 0) {
      const triggeredWithTime = newlyTriggered.map(item => ({
        ...item,
        time: new Date().toLocaleTimeString(language === 'ua' ? 'uk-UA' : 'en-US', { timeZone: timezone }),
        date: new Date().toLocaleDateString(language === 'ua' ? 'uk-UA' : 'en-US', { timeZone: timezone })
      }));
      
      setAlertHistory(prev => [...triggeredWithTime, ...prev].slice(0, 20));
      setActiveAlertsQueue(prevQueue => [...prevQueue, ...newlyTriggered]);
      setAlerts(alertsToKeep);
    }
  }, [prices,alerts, language, timezone]);

  useEffect(() => {
   const fetchTop50 = async () => {
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=100&page=1&sparkline=false&_t=${Date.now()}`
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        setPrices(prev => {
          const isSameCurrency = prev._currency === currency;
          const results = { _currency: currency };
          
          data.forEach(item => {
            const symbol = item.symbol.toUpperCase();
            const formattedPrice = item.current_price < 0.01 
              ? item.current_price.toFixed(6) 
              : item.current_price.toFixed(item.current_price > 1 ? 2 : 4);

            let dir = prev[symbol]?.direction || 'up'; 
            
            if (isSameCurrency && prev[symbol]) {
              if (parseFloat(formattedPrice) > parseFloat(prev[symbol].price)) {
                dir = 'up';
              } else if (parseFloat(formattedPrice) < parseFloat(prev[symbol].price)) {
                dir = 'down';
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
              direction: dir 
            };
          });

          prevPricesRef.current = isSameCurrency ? prev : { _currency: currency, ...results };
          return results;
        });
        
        setCoins(data);
        setLastFetchTime(Date.now());
      }
    } catch (err) {
      console.error("Помилка CoinGecko:", err);
    }
  };
    fetchTop50();
    const interval = setInterval(fetchTop50, 60000); 
    return () => clearInterval(interval);
  }, [currency]);

  const toggleFavorite = (coinId) => {
    const isAdding = !favorites.includes(coinId);
    
    setFavorites(prev => 
      isAdding ? [...prev, coinId] : prev.filter(id => id !== coinId)
    );

    if (isAdding) {
      setIsPulsing(true);
      setTimeout(() => setIsPulsing(false), 500);
      // 🔥 ЗАПИС В ЖУРНАЛ: Додано в обране
      addLogEvent(`${t.logAddedFav}: ${coinId}`, 'green');
    } else {
      // 🔥 ЗАПИС В ЖУРНАЛ: Видалено з обраного
      addLogEvent(`${t.logRemovedFav}: ${coinId}`, 'orange');
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
    
    const isUp = coinData?.direction !== 'down'; 
    
    const prevPriceData = prevPricesRef.current[id];
    const prevPrice = prevPriceData?.price;
    
    const isPositiveChange = parseFloat(changePercent) >= 0;
    const isFavorite = favorites.includes(id);

    const isSameCurrencyForFlash = prices._currency === prevPricesRef.current._currency;
    const flashClass = (isSameCurrencyForFlash && currentPrice && prevPrice && currentPrice !== prevPrice) 
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
            {curSymbol}{currentPrice || '...'}
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
            <Link to="/" className="nav-link-btn">{t.navHome}</Link>
            <Link to="/market" className="nav-link-btn">{t.navMarket}</Link>
            <Link to="/favorites" className={`nav-link-btn ${isPulsing ? 'pulse-nav' : ''}`}> {t.navFav}</Link>
            <Link to="/alerts" className="nav-link-btn" style={{ position: 'relative' }}>
              {t.navAlerts}
              {alerts.length > 0 && (
                <span style={{ 
                  position: 'absolute', top: '-8px', right: '-12px', background: '#ff4343', color: 'white', 
                  fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold',
                  boxShadow: '0 0 10px rgba(255,67,67,0.3)'
                }}>
                  {alerts.length}
                </span>
              )}
            </Link>
          </div>

          <div style={{ position: 'relative', margin: '0 auto' }}>
            <input 
              type="text" 
              placeholder={t.searchBox}   
              value={searchQuery}
              onChange={(e) => {
                const cleanValue = e.target.value.replace(/[0-9+-]/g, '');
                setSearchQuery(cleanValue);
              }}
              onKeyDown={(e) => {
                if (/[0-9+-]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
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
                    { id: 'all', label: t.catAll },
                    { id: 'top10', label: t.catTop },
                    { id: 'gainers', label: t.catGain },
                    { id: 'stables', label: t.catStables },
                    { id: 'favorites', label: t.catFav }
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
                          <div style={{ fontWeight: 'bold' }}>{curSymbol}{coin.current_price < 0.01 ? coin.current_price.toFixed(6) : coin.current_price.toFixed(2)}</div>
                          {change && (
                            <span style={{ color: changeColor, fontSize: '0.85rem' }}>
                              {coin.price_change_percentage_24h >= 0 ? '+' : ''}{change}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#aaa' }}>{t.notFound}</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="user-block" onClick={() => user ? setShowCabinetModal(true) : setShowAuthModal(true)}>
            {user ? (
              <>
                <span className="user-name">{user.displayName || user.email.split('@')[0]}</span>
                <div className="user-avatar">{user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}</div>
              </>
            ) : (
              <span className="auth-link-text">
                {t.loginBtn}
              </span>
            )}
          </div>

        </nav>

        <Routes>
          <Route path="/" element={<Home coins={coins} />} />
          
          <Route path="/market" element={
            <>
              <Market />
              
              <h1>{t.titleTop3}</h1>
              <p className="update-time">{t.lastUpdate} {lastUpdatedFormatted}</p>
              
              <div className="crypto-container">
               {renderCard('BTC', 'Bitcoin')}
                {renderCard('ETH', 'Ethereum')}
                  {renderCard('SOL', 'Solana')}    
              </div>

              <div className="popular-section">
                <h2 className="section-title">{t.titlePop}</h2>
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
                <h2 className="section-title">{t.titleAll}</h2>
                
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
                      {t.loadMore} ({coins.length} {t.coinsCount})
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
          <Route path="/alerts" element={<Alerts alerts={alerts} setAlerts={setAlerts} prices={prices} history={alertHistory} onEdit={handleEditAlert} currencySymbol={curSymbol} />} />

        </Routes>

        {selectedCoin && (
          <CoinModal 
            coinId={selectedCoin} 
            data={prices[selectedCoin]} 
            onClose={() => setSelectedCoin(null)} 
            favorites={favorites} 
            toggleFavorite={toggleFavorite}
            handleAddAlert={handleAddAlert}
            user={user}
            currencySymbol={curSymbol}
            currencyCode={currency}
          />
        )}

        {activeAlertsQueue.length > 0 && (
          (() => {
            const currentAlert = activeAlertsQueue[0]; 
            
            return (
              <div className="modal-overlay" style={{ zIndex: 9999 }}>
                <div className="modal-content" style={{ 
                  maxWidth: '320px', textAlign: 'center', borderRadius: '20px', border: 'none', 
                  animation: 'modalRevealAlert 0.4s ease-out forwards, modalPulseAlertShadow 3s infinite 0.4s',
                  boxShadow: `0 0 40px ${currentAlert.type === 'up' ? 'rgba(0,192,135,0.15)' : 'rgba(255,67,67,0.15)'}`,
                  padding: '30px'
                }}>
                  
                  <div style={{ fontSize: '3.5rem', marginBottom: '10px' }}>
                    {currentAlert.type === 'up' ? '📈' : '📉'}
                  </div>
                  <h2 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>
                    {t.alertTitle}
                  </h2>
                  <p style={{ fontSize: '1rem', color: '#aaa', marginBottom: '25px', lineHeight: '1.4' }}>
                    {t.alertText1} <strong style={{ color: '#fff' }}>{currentAlert.coinId}</strong> {t.alertText2} <strong style={{ color: currentAlert.type === 'up' ? '#00c087' : '#ff4343' }}>{curSymbol}{currentAlert.targetPrice}</strong>!
                  </p>
                  <div style={{ background: '#12161c', padding: '15px', borderRadius: '15px', marginBottom: '25px', border: '1px solid #2b3139' }}>
                    <span style={{ color: '#8e9eaf', fontSize: '0.85rem' }}>{t.alertCurrent}</span><br/>
                    <strong style={{ fontSize: '1.6rem', color: '#fff' }}>{curSymbol}{currentAlert.currentPrice}</strong>
                  </div>

                  <button 
                    onClick={() => setActiveAlertsQueue(prev => prev.slice(1))}
                    style={{ width: '100%', padding: '12px', background: '#fff', color: '#000', border: 'none', borderRadius: '15px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.03)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    {t.alertGotIt}
                  </button>
                  
                </div>
              </div>
            );
          })()
        )}

        {toast.show && (
          <div className="toast-notification">
            {toast.message}
          </div>
        )}

        {showAuthModal && (
          <AuthModal 
            onClose={() => setShowAuthModal(false)} 
            onLoginSuccess={() => {
              setToast({ show: true, message: t.loginMsg, isAdd: true });
              setTimeout(() => setToast({ show: false, message: '', isAdd: true }), 3000);
              // 🔥 ЗАПИС В ЖУРНАЛ: Вхід в акаунт
              addLogEvent(t.loginMsg, 'green');
            }}
          />
        )}

       {showCabinetModal && (
          <CabinetModal 
            user={user} 
            favoritesCount={favorites.length}
            alertsCount={alerts.length}
            onClose={() => setShowCabinetModal(false)} 
            onLogout={() => {
              setShowCabinetModal(false);
              handleLogout();
            }}
            currentLang={language}
            setGlobalLang={(newLang) => {
              setLanguage(newLang);
              addLogEvent(`${t.logLangChanged} ${newLang.toUpperCase()}`, 'blue');
            }}
            currentCurrency={currency}
            setGlobalCurrency={(newCur) => {
              setCurrency(newCur);
              addLogEvent(`${t.logCurChanged} ${newCur.toUpperCase()}`, 'blue');
            }}
            currentTimezone={timezone}
            setGlobalTimezone={(newTz) => {
              setTimezone(newTz);
              addLogEvent(t.logTzChanged, 'blue');
            }}
            // 🔥 ПЕРЕДАЄМО ЛОГ І ДАТУ В КАБІНЕТ
            activityLog={activityLog}
            userJoinDate={userJoinDate}
          />
        )}  
      </div>
    </Router>
  );
}

export default App;