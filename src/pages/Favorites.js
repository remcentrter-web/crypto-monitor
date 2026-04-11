import React, { useState, useMemo } from 'react';

const Favorites = ({ favorites, prices, renderCard, setFavorites }) => {
  const [sortBy, setSortBy] = useState('rank');
  // Стан для нашої нової модалки підтвердження
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 1. Готуємо дані
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

  // Функція для повного очищення
  const clearAllFavorites = () => {
    setFavorites([]);
    setShowConfirmModal(false);
  };

  if (favorites.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: '#8e9eaf' }}>
        <h1 style={{fontSize: '3rem', marginBottom: '20px'}}>⭐</h1>
        <h2>Моє обране</h2>
        <p>Тут поки порожньо. Додай монети на вкладці "Ринок"!</p>
      </div>
    );
  }

  return (
    <div className="favorites-page-container" style={{ position: 'relative' }}>
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

        {/* Тепер кнопка просто відкриває нашу модалку */}
        <button className="clear-all-btn" onClick={() => setShowConfirmModal(true)}>
          🧹 Очистити все
        </button>
      </aside>

      <main className="favorites-main">
        <h1 className="section-title">⭐ Моє обране ({favorites.length})</h1>
        <div className="crypto-container">
          {sortedData.map(coin => (
            renderCard(coin.coinSymbol, coin.name, true)
          ))}
        </div>
      </main>

      {/* --- НАША НОВА КРАСИВА МОДАЛКА ОЧИЩЕННЯ --- */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{
            background: '#1c2128', padding: '40px', borderRadius: '32px',
            width: '90%', maxWidth: '380px', border: '1px solid #2b3139', textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
            animation: 'favModalAnim 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>⚠️</div>
            <h2 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '1.6rem' }}>Очистити список?</h2>
            <p style={{ color: '#8e9eaf', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '30px' }}>
              Це видалить усі <strong>{favorites.length}</strong> монети з вашого обраного. Ви впевнені?
            </p>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <button 
                onClick={() => setShowConfirmModal(false)} 
                style={{ 
                  flex: 1, padding: '16px', background: 'transparent', 
                  border: '1px solid #2b3139', color: '#8e9eaf', 
                  borderRadius: '16px', cursor: 'pointer', fontWeight: '600',
                  transition: '0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#2b3139'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                Скасувати
              </button>
              <button 
                onClick={clearAllFavorites} 
                style={{ 
                  flex: 1, padding: '16px', background: '#ff4343', 
                  border: 'none', color: '#fff', fontWeight: 'bold', 
                  borderRadius: '16px', cursor: 'pointer',
                  boxShadow: '0 10px 20px rgba(255,67,67,0.2)'
                }}
              >
                Видалити все
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes favModalAnim {
          0% { opacity: 0; transform: scale(0.9) translateY(30px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Favorites;