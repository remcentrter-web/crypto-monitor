import React, { useState, useMemo } from 'react';

const Favorites = ({ favorites, prices, renderCard, setFavorites }) => {
  const [sortBy, setSortBy] = useState('rank');

  // 1. Готуємо дані (зберігаємо символ окремо як coinSymbol)
  const favoriteData = useMemo(() => {
    return favorites
      .map(symbol => {
        const data = prices[symbol];
        return data ? { ...data, coinSymbol: symbol } : null;
      })
      .filter(coin => coin !== null);
  }, [favorites, prices]);

  // 2. Рахуємо статистику
  const stats = useMemo(() => {
    if (favoriteData.length === 0) return { avgChange: 0, topMover: null };
    const totalChange = favoriteData.reduce((acc, coin) => acc + parseFloat(coin.change || 0), 0);
    const avg = (totalChange / favoriteData.length).toFixed(2);
    const top = [...favoriteData].sort((a, b) => parseFloat(b.change) - parseFloat(a.change))[0];
    return { avgChange: avg, topMover: top };
  }, [favoriteData]);

  // 3. Сортування
  const sortedData = useMemo(() => {
    let data = [...favoriteData];
    if (sortBy === 'growth') data.sort((a, b) => parseFloat(b.change) - parseFloat(a.change));
    if (sortBy === 'drop') data.sort((a, b) => parseFloat(a.change) - parseFloat(b.change));
    if (sortBy === 'price') data.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if (sortBy === 'rank') data.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    return data;
  }, [favoriteData, sortBy]);

  if (favorites.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: '#8e9eaf' }}>
        <h1>⭐ Моє обране</h1>
        <p>Тут поки порожньо. Додай монети на вкладці "Ринок"!</p>
      </div>
    );
  }

  return (
    <div className="favorites-page-container">
      <aside className="favorites-sidebar">
        <div className="sidebar-section">
          <h3>📊 Аналітика списку</h3>
          <div className="stat-card">
            <span className="stat-label">Середній тренд (24г)</span>
            <strong className={`stat-value ${stats.avgChange >= 0 ? 'up' : 'down'}`}>
              {stats.avgChange >= 0 ? '▲' : '▼'} {stats.avgChange}%
            </strong>
          </div>
          {stats.topMover && (
            <div className="stat-card">
              <span className="stat-label">🔥 Топ-мувер</span>
              <strong className="stat-value" style={{color: '#f7931a'}}>{stats.topMover.coinSymbol}</strong>
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <h3>⚙️ Сортування</h3>
          <div className="sort-buttons">
            <button className={sortBy === 'rank' ? 'active' : ''} onClick={() => setSortBy('rank')}>За рейтингом</button>
            <button className={sortBy === 'growth' ? 'active' : ''} onClick={() => setSortBy('growth')}>🚀 Ріст</button>
            <button className={sortBy === 'drop' ? 'active' : ''} onClick={() => setSortBy('drop')}>📉 Падіння</button>
            <button className={sortBy === 'price' ? 'active' : ''} onClick={() => setSortBy('price')}>💰 Ціна</button>
          </div>
        </div>

        <button className="clear-all-btn" onClick={() => window.confirm('Видалити всі монети?') && setFavorites([])}>
          🧹 Очистити все
        </button>
      </aside>

      <main className="favorites-main">
        <h1 className="section-title">⭐ Моє обране ({favorites.length})</h1>
        <div className="crypto-container">
          {sortedData.map(coin => (
            /* ВАЖЛИВО: Передаємо coinSymbol замість id */
            renderCard(coin.coinSymbol, coin.name, true)
          ))}
        </div>
      </main>
    </div>
  );
};

export default Favorites;