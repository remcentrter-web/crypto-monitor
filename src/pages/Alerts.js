import React, { useState, useEffect } from 'react';

// 🔥 СЛОВНИК ДЛЯ СТОРІНКИ "СПОВІЩЕННЯ"
const alertsTranslations = {
  ua: {
    pageTitle: "🔔 Мої сповіщення", activeTargets: "Активні цілі", historyTitle: "🕒 Останні спрацювання",
    targetAbove: "📈 ЦІЛЬ ВИЩЕ", targetBelow: "📉 ЦІЛЬ НИЖЧЕ", now: "Зараз:",
    editTitle: "Змінити ціль", editSub: "Введіть нову ціну", btnCancel: "Скасувати", btnSave: "Зберегти"
  },
  en: {
    pageTitle: "🔔 My Alerts", activeTargets: "Active Targets", historyTitle: "🕒 Recent Triggers",
    targetAbove: "📈 TARGET ABOVE", targetBelow: "📉 TARGET BELOW", now: "Now:",
    editTitle: "Edit target for", editSub: "Enter new price", btnCancel: "Cancel", btnSave: "Save"
  }
};

const Alerts = ({ alerts, setAlerts, prices, history, onEdit }) => {
  // 🔥 РАДАР МОВИ
  const [lang, setLang] = useState(localStorage.getItem('app_lang') || 'ua');
  useEffect(() => {
    const interval = setInterval(() => {
      const currentLang = localStorage.getItem('app_lang') || 'ua';
      if (currentLang !== lang) setLang(currentLang);
    }, 300);
    return () => clearInterval(interval);
  }, [lang]);

  const t = alertsTranslations[lang];

  const [editingAlert, setEditingAlert] = useState(null);
  const [tempPrice, setTempPrice] = useState('');

  const removeAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id));

  const openEditModal = (alert) => {
    setEditingAlert(alert);
    setTempPrice(alert.targetPrice);
  };

  const saveEdit = () => {
    if (tempPrice && !isNaN(tempPrice)) {
      onEdit(editingAlert.id, tempPrice);
      setEditingAlert(null);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto', color: '#fff', position: 'relative' }}>
      <h1 style={{ fontSize: '2.4rem', marginBottom: '30px', textAlign: 'center' }}>{t.pageTitle}</h1>

      <h2 style={{ color: '#8e9eaf', fontSize: '0.9rem', marginBottom: '25px', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '1px' }}>{t.activeTargets}</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '60px' }}>
        {alerts.map(alert => {
          const currentPrice = parseFloat(prices[alert.coinId]?.price || 0);
          const isUp = alert.type === 'up';
          const diffPercent = Math.abs(currentPrice - alert.targetPrice) / alert.targetPrice;
          const isClose = diffPercent < 0.01     && currentPrice > 0;

          return (
            <div key={alert.id} className={isClose ? 'pulse-alert-card' : ''} style={{ 
              background: '#15191e', borderRadius: '24px', padding: '25px', 
              border: `1px solid ${isClose ? (isUp ? '#00c087' : '#ff4343') : '#2b3139'}`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <strong style={{ fontSize: '1.2rem', color: '#8e9eaf' }}>{alert.coinId}</strong>
                <button onClick={() => removeAlert(alert.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.3 }}>🗑️</button>
              </div>

              <div onClick={() => openEditModal(alert)} style={{ cursor: 'pointer', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.75rem', color: isUp ? '#00c087' : '#ff4343', fontWeight: 'bold' }}>
                  {isUp ? t.targetAbove : t.targetBelow}
                </span>
                <div style={{ fontSize: '1.6rem', fontWeight: '800', marginTop: '5px' }}>${alert.targetPrice}</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#555', fontSize: '0.85rem' }}>{t.now}</span>
                <span style={{ fontWeight: 'bold', fontSize: '1rem', color: isClose ? (isUp ? '#00c087' : '#ff4343') : '#8e9eaf' }}>${currentPrice}</span>
              </div>
            </div>
          );
        })}
      </div>

      <h2 style={{ color: '#8e9eaf', fontSize: '0.9rem', marginBottom: '20px', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '1px' }}>{t.historyTitle}</h2>
      <div style={{ background: '#12161c', borderRadius: '20px', border: '1px solid #2b3139' }}>
        {history.map((h, i) => (
          <div key={i} style={{ padding: '15px 25px', borderBottom: '1px solid #2b3139', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong style={{fontSize: '1.1rem'}}>{h.coinId}</strong> <span style={{ color: h.type === 'up' ? '#00c087' : '#ff4343', marginLeft: '10px' }}>{h.type === 'up' ? '↗' : '↘'} ${h.targetPrice}</span></span>
            <span style={{ color: '#444', fontSize: '0.75rem' }}>{h.time}</span>
          </div>
        ))}
      </div>

      {editingAlert && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000
        }}>
          <div style={{
            background: '#1c2128', padding: '35px', borderRadius: '28px',
            width: '90%', maxWidth: '340px', border: '1px solid #2b3139', textAlign: 'center',
            boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
            animation: 'modalOpenAnim 0.25s ease-out forwards'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.4rem' }}>{t.editTitle} {editingAlert.coinId}</h3>
            <p style={{ color: '#8e9eaf', fontSize: '0.85rem', marginBottom: '25px' }}>{t.editSub}</p>
            
            <input 
              type="number" 
              autoFocus
              className="no-spinners"
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              onKeyDown={(e) => {
                if (['-', '+', 'e', 'E'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '16px', 
                background: '#12161c', border: '1px solid #2b3139',
                borderRadius: '16px', color: '#fff', fontSize: '1.3rem', textAlign: 'center',
                outline: 'none', marginBottom: '25px'
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setEditingAlert(null)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid #2b3139', color: '#8e9eaf', borderRadius: '14px', cursor: 'pointer', fontWeight: '600' }}>{t.btnCancel}</button>
              <button onClick={saveEdit} style={{ flex: 1, padding: '14px', background: '#00c087', border: 'none', color: '#000', fontWeight: '700', borderRadius: '14px', cursor: 'pointer' }}>{t.btnSave}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalOpenAnim {
          0% { opacity: 0; transform: scale(0.95) translateY(10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes alertPulse {
          0%, 100% { box-shadow: 0 0 0px rgba(255,255,255,0); }
          50% { box-shadow: 0 0 25px rgba(255,255,255,0.03); }
        }
        .pulse-alert-card { animation: alertPulse 2s infinite; }
        
        input.no-spinners::-webkit-outer-spin-button,
        input.no-spinners::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input.no-spinners {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default Alerts;