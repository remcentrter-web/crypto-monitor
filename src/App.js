import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import './Navbar.css';

function App() {
  const [prices, setPrices] = useState({ BTC: '...', ETH: '...', SOL: '...' });
  const [lastUpdated, setLastUpdated] = useState('');
const prevPricesRef = useRef({ BTC: 0, ETH: 0, SOL: 0 });
  useEffect(() => {
    const fetchPrices = () => {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
      
      Promise.all(
        symbols.map(s => fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${s}`).then(r => r.json()))
      ).then(data => {
     const newPrices = {
        BTC: parseFloat(data[0].price).toFixed(2),
        ETH: parseFloat(data[1].price).toFixed(2),
        SOL: parseFloat(data[2].price).toFixed(2)
      };
 
setPrices(newPrices);
setLastUpdated(new Date().toLocaleTimeString('uk-UA', { timeZone: 'Europe/Kyiv' }));
    }).catch(err => console.error("Помилка:", err));
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 3000);
    return () => clearInterval(interval);
  }, []);
// Цей блок буде спрацьовувати щоразу, коли ціна оновлюється
  useEffect(() => {
    prevPricesRef.current = prices;
  }, [prices]);
  return (
    <div className="App">
      <nav className="navbar">
        <div className="nav-logo">CRYPTO MONITOR</div>
        <div className="user-block" onClick={() => alert("Профіль користувача Максим")}>
          <span className="user-name">Максим</span>
          <div className="user-avatar">М</div>
        </div>
      </nav>

      <h1>Топ-3 криптовалюти на сьогодні</h1>
      <p className="update-time">Останнє оновлення: {lastUpdated}</p>
      
     <div className="crypto-container">
        {/* Картка Bitcoin */}
        <div className="crypto-card btc">
          <h2>Bitcoin (BTC)</h2>
          <p className={`price ${prices.BTC < prevPricesRef.current.BTC ? 'down' : 'up'}`}>
            ${prices.BTC}
          </p>
        </div>

        {/* Картка Ethereum */}
        <div className="crypto-card eth">
          <h2>Ethereum (ETH)</h2>
          <p className={`price ${prices.ETH < prevPricesRef.current.ETH ? 'down' : 'up'}`}>
            ${prices.ETH}
          </p>
        </div>

        {/* Картка Solana */}
        <div className="crypto-card sol">
          <h2>Solana (SOL)</h2>
          <p className={`price ${prices.SOL < prevPricesRef.current.SOL ? 'down' : 'up'}`}>
            ${prices.SOL}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;