import React, { useState, useMemo, useEffect } from 'react';

// 🔥 СЛОВНИК ДЛЯ СТОРІНКИ "ОБРАНЕ"
const favoritesTranslations = {
  ua: {
    emptyTitle: "Моє обране", emptyText: "Тут поки порожньо. Додай монети на вкладці \"Ринок\"!",
    analytics: "📊 Аналітика списку", avgTrend: "Середній тренд (24г)", topMover: "🔥 Топ-мувер",
    sortTitle: "⚙️ Сортування", sortRank: "За рейтингом", sortGrowth: "🚀 Ріст", sortDrop: "📉 Падіння", sortPrice: "💰 Ціна",
    clearBtn: "🧹 Очистити все", pageTitle: "⭐ Моє обране",
    modalTitle: "Очистити список?", modalText1: "Це видалить усі", modalText2: "монети з вашого обраного. Ви впевнені?",
    btnCancel: "Скасувати", btnConfirm: "Видалити все"
  },
  en: {
    emptyTitle: "My Favorites", emptyText: "It's empty here. Add coins from the \"Market\" tab!",
    analytics: "📊 List Analytics", avgTrend: "Average Trend (24h)", topMover: "🔥 Top Mover",
    sortTitle: "⚙️ Sort By", sortRank: "By Rank", sortGrowth: "🚀 Growth", sortDrop: "📉 Drop", sortPrice: "💰 Price",
    clearBtn: "🧹 Clear All", pageTitle: "⭐ My Favorites",
    modalTitle: "Clear the list?", modalText1: "This will remove all", modalText2: "coins from your favorites. Are you sure?",
    btnCancel: "Cancel", btnConfirm: "Delete All"
  }
};

const Favorites = ({ favorites, prices, renderCard, setFavorites }) => {
  // 🔥 РАДАР МОВИ
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'ua');
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('app_lang') || 'ua';
      if (currentLang !== lang) setLang(currentLang);
    }, 300);
    return () => clearInterval(interval);
  }, [lang]);

  const t = favoritesTranslations[lang];

  const [sortBy, setSortBy] = useState('rank');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const favoriteData = useMemo(() => {
    return favorites
      .map(symbol => {
        const data = prices[symbol];
        return data ? { ...data, coinSymbol: symbol } : null;
      })
      .filter(coin => coin !== null);
  }, [favorites, prices]);

  const stats = useMemo(() => {
    if (favoriteData.length === 0) return { avgChange: 0, topMover: null };
    const totalChange = favoriteData.reduce((acc, coin) => acc + parseFloat(coin.change || 0), 0);
    const avg = (totalChange / favoriteData.length).toFixed(2);
    const top = [...favoriteData].sort((a, b) => parseFloat(b.change) - parseFloat(a.change))[0];
    return { avgChange: avg, topMover: top };
  }, [favoriteData]);

  const sortedData = useMemo(() => {
    let data = [...favoriteData];
    if (sortBy === 'growth') data.sort((a, b) => parseFloat(b.change) - parseFloat(a.change));
    if (sortBy === 'drop') data.sort((a, b) => parseFloat(a.change) - parseFloat(b.change));
    if (sortBy === 'price') data.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    if (sortBy === 'rank') data.sort((a, b) => (a.rank || 999) - (b.rank || 999));
    return data;
  }, [favoriteData, sortBy]);

  const clearAllFavorites = () => {
    setFavorites([]);
    setShowConfirmModal(false);
  };

  if (favorites.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px', color: '#8e9eaf' }}>
        <h1 style={{fontSize: '3rem', marginBottom: '20px'}}>⭐</h1>
        <h2>{t.emptyTitle}</h2>
        <p>{t.emptyText}</p>
      </div>
    );
  }

  return (
    <div className="favorites-page-container" style={{ position: 'relative' }}>
      <aside className="favorites-sidebar">
        <div className="sidebar-section">
          <h3>{t.analytics}</h3>
          <div className="stat-card">
            <span className="stat-label">{t.avgTrend}</span>
            <strong className={`stat-value ${stats.avgChange >= 0 ? 'up' : 'down'}`}>
              {stats.avgChange >= 0 ? '▲' : '▼'} {stats.avgChange}%
            </strong>
          </div>
          {stats.topMover && (
            <div className="stat-card">
              <span className="stat-label">{t.topMover}</span>
              <strong className="stat-value" style={{color: '#f7931a'}}>{stats.topMover.coinSymbol}</strong>
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <h3>{t.sortTitle}</h3>
          <div className="sort-buttons">
            <button className={sortBy === 'rank' ? 'active' : ''} onClick={() => setSortBy('rank')}>{t.sortRank}</button>
            <button className={sortBy === 'growth' ? 'active' : ''} onClick={() => setSortBy('growth')}>{t.sortGrowth}</button>
            <button className={sortBy === 'drop' ? 'active' : ''} onClick={() => setSortBy('drop')}>{t.sortDrop}</button>
            <button className={sortBy === 'price' ? 'active' : ''} onClick={() => setSortBy('price')}>{t.sortPrice}</button>
          </div>
        </div>

        <button className="clear-all-btn" onClick={() => setShowConfirmModal(true)}>
          {t.clearBtn}
        </button>
      </aside>

      <main className="favorites-main">
        <h1 className="section-title">{t.pageTitle} ({favorites.length})</h1>
        <div className="crypto-container">
          {sortedData.map(coin => (
            renderCard(coin.coinSymbol, coin.name, true)
          ))}
        </div>
      </main>

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
            <h2 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '1.6rem' }}>{t.modalTitle}</h2>
            <p style={{ color: '#8e9eaf', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '30px' }}>
              {t.modalText1} <strong>{favorites.length}</strong> {t.modalText2}
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
                {t.btnCancel}
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
                {t.btnConfirm}
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