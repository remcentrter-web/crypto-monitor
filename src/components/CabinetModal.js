import React, { useState } from 'react';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { db } from '../firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import './CabinetModal.css';

// 🔥 НОВІ СЕРЙОЗНІ АВАТАРИ (Геометрія / Абстракція)
const PRESET_AVATARS = [
  "https://api.dicebear.com/8.x/shapes/svg?seed=Alpha&backgroundColor=1e2329&shape1Color=f7931a",
  "https://api.dicebear.com/8.x/shapes/svg?seed=Nexus&backgroundColor=1e2329&shape1Color=00c087",
  "https://api.dicebear.com/8.x/shapes/svg?seed=Vertex&backgroundColor=1e2329&shape1Color=3b82f6",
  "https://api.dicebear.com/8.x/shapes/svg?seed=Quantum&backgroundColor=1e2329&shape1Color=8b5cf6",
  "https://api.dicebear.com/8.x/shapes/svg?seed=Prime&backgroundColor=1e2329&shape1Color=ff4343",
  "https://api.dicebear.com/8.x/shapes/svg?seed=Core&backgroundColor=1e2329&shape1Color=eab308"
];

const translations = {
  ua: {
    menuProfile: "👤 Профіль", menuStats: "📊 Активність", menuSec: "🔒 Безпека", menuSet: "⚙️ Налаштування", menuSup: "🎧 Підтримка", menuAbout: "🚀 Про додаток", logout: "Вийти з акаунта",
    profTitle: "Мій профіль", nickLabel: "Ваш нікнейм", avaLabel: "Швидкий вибір аватара", urlLabel: "Або вставте посилання на фото", saveBtn: "Зберегти зміни", saving: "Збереження...",
    bioLabel: "Про себе (Торгова стратегія)", bioPlace: "Наприклад: Day trader | Crypto enthusiast...",
    statTitle: "Аналітика акаунта", statFav: "Обраних монет", statAlert: "Сповіщень", statLog: "Журнал подій", 
    statEmptyLog: "Подій поки немає", memberSince: "На платформі з",
    secTitle: "Безпека", secEmail: "Електронна пошта", secEmailDesc: "Основний ідентифікатор", secPass: "Новий пароль", secPassDesc: "Мінімум 6 символів", secUpdate: "Оновити дані",
    setTitle: "Загальні налаштування", setLang: "Мова інтерфейсу", setCur: "Основна валюта", setTz: "Часовий пояс",
    supTitle: "Підтримка", supPlace: "Опишіть проблему або залиште побажання...", supBtn: "Надіслати повідомлення", supSending: "Відправка...",
    abTitle: "Про Crypto Monitor", abP1: "Твій персональний термінал для аналізу ринку.", 
    abF1: "Швидкість React ⚡", abF1d: "Миттєве завантаження.", abF2: "Надійність Firebase 🔒", abF2d: "Твої дані в безпеці.", abF3: "Точність CoinGecko 📈", abF3d: "Ціни в реальному часі.", abF4: "Графіки Chart.js 📊", abF4d: "Глибока аналітика.",
    abFeaturesTitle: "Ключові можливості:", 
    abL1: "Миттєві цінові сповіщення", 
    abL2: "Мультивалютність та локалізація", 
    abL3: "Синхронізація обраного у хмарі", 
    abL4: "Адаптивний дизайн інтерфейсу",
    abFoot: "Версія 2.0 | Розроблено для трейдерів.",
    tzKyiv: "🇺🇦 Київ (UTC+2/3)", tzBerlin: "🇪🇺 Берлін/Париж (UTC+1/2)", tzLondon: "🇬🇧 Лондон (UTC+0/1)", tzNy: "🇺🇸 Нью-Йорк (UTC-5/4)", tzTokyo: "🇯🇵 Токіо (UTC+9)"
  },
  en: {
    menuProfile: "👤 Profile", menuStats: "📊 Activity", menuSec: "🔒 Security", menuSet: "⚙️ Settings", menuSup: "🎧 Support", menuAbout: "🚀 About", logout: "Logout",
    profTitle: "My Profile", nickLabel: "Nickname", avaLabel: "Quick Avatar Select", urlLabel: "Or paste image URL", saveBtn: "Save Changes", saving: "Saving...",
    bioLabel: "About Me (Trading Strategy)", bioPlace: "E.g.: Day trader | Crypto enthusiast...",
    statTitle: "Account Analytics", statFav: "Favorite Coins", statAlert: "Active Alerts", statLog: "Event Log",
    statEmptyLog: "No events yet", memberSince: "Member since",
    secTitle: "Security", secEmail: "Email Address", secEmailDesc: "Primary identifier", secPass: "New Password", secPassDesc: "Minimum 6 characters", secUpdate: "Update Security",
    setTitle: "General Settings", setLang: "Interface Language", setCur: "Main Currency", setTz: "Time Zone",
    supTitle: "Support", supPlace: "Describe your issue or leave feedback...", supBtn: "Send Message", supSending: "Sending...",
    abTitle: "About Crypto Monitor", abP1: "Your personal terminal for market analysis.", 
    abF1: "React Speed ⚡", abF1d: "Instant loading.", abF2: "Firebase Security 🔒", abF2d: "Your data is safe.", abF3: "CoinGecko Accuracy 📈", abF3d: "Real-time pricing.", abF4: "Chart.js Visuals 📊", abF4d: "Deep analytics.",
    abFeaturesTitle: "Core Features:", 
    abL1: "Instant price alerts", 
    abL2: "Multi-currency & localization", 
    abL3: "Cloud-synced favorites", 
    abL4: "Fully responsive design",
    abFoot: "Version 2.0 | Built for traders.",
    tzKyiv: "🇺🇦 Kyiv (UTC+2/3)", tzBerlin: "🇪🇺 Berlin/Paris (UTC+1/2)", tzLondon: "🇬🇧 London (UTC+0/1)", tzNy: "🇺🇸 New York (UTC-5/4)", tzTokyo: "🇯🇵 Tokyo (UTC+9)"
  }
};

const CabinetModal = ({ 
  user, onClose, onLogout, favoritesCount, alertsCount, 
  currentLang, setGlobalLang, currentCurrency, setGlobalCurrency, 
  currentTimezone, setGlobalTimezone, 
  activityLog = [], userJoinDate = "" 
}) => {
  const [activeSection, setActiveSection] = useState('profile');
  const t = translations[currentLang] || translations.ua; 

  const [newName, setNewName] = useState(user?.displayName || '');
  const [newPhoto, setNewPhoto] = useState(user?.photoURL || '');
  const [newBio, setNewBio] = useState(localStorage.getItem(`bio_${user?.uid}`) || '');

  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  if (!user) return null;

  const notify = (text, type = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 3000);
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName: newName, photoURL: newPhoto });
      localStorage.setItem(`bio_${user.uid}`, newBio);
      notify(currentLang === 'ua' ? 'Профіль оновлено!' : 'Profile updated!');
    } catch (err) { notify('Error', 'error'); }
    setIsSaving(false);
  };

  const handleUpdateSecurity = async () => {
    setIsSaving(true);
    try {
      if (newEmail !== user.email) await updateEmail(user, newEmail);
      if (newPassword) await updatePassword(user, newPassword);
      notify(currentLang === 'ua' ? 'Безпеку оновлено!' : 'Security updated!');
      setNewPassword('');
    } catch (err) { notify(currentLang === 'ua' ? 'Потрібно перелогінитись!' : 'Relogin required!', 'error'); }
    setIsSaving(false);
  };

  const handleSendSupport = async () => {
    if (!supportMsg.trim()) return;
    setIsSendingSupport(true);
    try {
      await addDoc(collection(db, "support_tickets"), {
        uid: user.uid,
        email: user.email,
        userName: user.displayName || "Anonymous",
        message: supportMsg,
        timestamp: serverTimestamp() 
      });
      notify(currentLang === 'ua' ? 'Надіслано! Дякуємо.' : 'Sent! Thank you.');
      setSupportMsg('');
    } catch (err) {
      console.error(err);
      notify(currentLang === 'ua' ? 'Помилка відправки' : 'Send error', 'error');
    } finally {
      setIsSendingSupport(false);
    }
  };

  return (
    <div className="cab-overlay" onClick={onClose}>
      <div className="cab-window" onClick={(e) => e.stopPropagation()}>
        
        <div className="cab-sidebar">
          <div className="cab-sidebar-user">
            <img src={user.photoURL || PRESET_AVATARS[0]} alt="Avatar" style={{ borderRadius: '12px' }} />
            <div className="cab-user-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="cab-username" style={{ fontWeight: 'bold' }}>{user.displayName || 'Trader'}</span>
            </div>
          </div>
          
          <nav className="cab-menu">
            <button className={activeSection === 'profile' ? 'active' : ''} onClick={() => setActiveSection('profile')}>{t.menuProfile}</button>
            <button className={activeSection === 'stats' ? 'active' : ''} onClick={() => setActiveSection('stats')}>{t.menuStats}</button>
            <button className={activeSection === 'security' ? 'active' : ''} onClick={() => setActiveSection('security')}>{t.menuSec}</button>
            <button className={activeSection === 'settings' ? 'active' : ''} onClick={() => setActiveSection('settings')}>{t.menuSet}</button>
            <button className={activeSection === 'support' ? 'active' : ''} onClick={() => setActiveSection('support')}>{t.menuSup}</button>
            <button className={activeSection === 'about' ? 'active' : ''} onClick={() => setActiveSection('about')}>{t.menuAbout}</button>
          </nav>

          <button className="cab-logout-btn" onClick={onLogout}>{t.logout}</button>
        </div>

        <div className="cab-main">
          <button className="cab-x-close" onClick={onClose}>&times;</button>
          
          {statusMsg.text && <div className={`cab-toast ${statusMsg.type}`}>{statusMsg.text}</div>}

          <div className="cab-content-area">
            
            {activeSection === 'profile' && (
              <div className="cab-section-inner cab-fade-in">
                <h2 className="cab-h2">{t.profTitle}</h2>
                
                <div className="cab-pro-user-card">
                  <div className="cab-pro-avatar-wrapper">
                    <img src={newPhoto || user.photoURL || PRESET_AVATARS[0]} alt="Preview" />
                  </div>
                  <div className="cab-pro-user-info">
                    <h3>{newName || user.displayName || 'Anonymous Trader'}</h3>
                    <div className="cab-badges">
                      <span className="cab-badge-pro">verified</span>
                      <span className="cab-badge-date">{t.memberSince}: {userJoinDate || '2026'}</span>
                    </div>
                  </div>
                </div>

                <div className="cab-profile-form">
                  <div className="cab-input-row">
                    <div style={{ flex: 1 }}>
                      <label className="cab-label">{t.nickLabel}</label>
                      <input 
                        className="cab-input" 
                        type="text" 
                        value={newName} 
                        onChange={(e) => {
                          const cleanValue = e.target.value.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9 ]/g, '');
                          setNewName(cleanValue);
                        }} 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="cab-label">{t.urlLabel}</label>
                      <input className="cab-input" type="text" value={newPhoto} onChange={(e) => setNewPhoto(e.target.value)} placeholder="https://..." />
                    </div>
                  </div>

                  <label className="cab-label">{t.bioLabel}</label>
                  <input className="cab-input" type="text" value={newBio} onChange={(e) => setNewBio(e.target.value)} placeholder={t.bioPlace} />
                  
                  <label className="cab-label">{t.avaLabel}</label>
                  <div className="cab-mini-gallery">
                    {PRESET_AVATARS.map((url, i) => (
                      <img key={i} src={url} className={newPhoto === url ? 'selected' : ''} onClick={() => setNewPhoto(url)} alt={`Preset ${i}`}/>
                    ))}
                  </div>
                  
                  <button className="cab-save-btn cab-wide" style={{ marginTop: '10px' }} onClick={handleUpdateProfile} disabled={isSaving}>
                      {isSaving ? t.saving : t.saveBtn}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'stats' && (
              <div className="cab-section-inner cab-fade-in">
                <h2 className="cab-h2">{t.statTitle}</h2>
                <div style={{ textAlign: 'center', color: '#8e9eaf', fontSize: '0.85rem', marginBottom: '15px' }}>
                  {t.memberSince}: <span style={{ color: '#fff', fontWeight: 'bold' }}>{userJoinDate}</span>
                </div>
                <div className="cab-pro-dashboard">
                  <div className="cab-pro-stat-card">
                    <span className="cab-pro-label">{t.statFav}</span>
                    <span className="cab-pro-value">{favoritesCount}</span>
                    <div className="cab-pro-bar"><div className="cab-pro-fill fav-fill" style={{ width: `${Math.min(favoritesCount * 10, 100)}%` }}></div></div>
                  </div>
                  <div className="cab-pro-stat-card">
                    <span className="cab-pro-label">{t.statAlert}</span>
                    <span className="cab-pro-value">{alertsCount}</span>
                    <div className="cab-pro-bar"><div className="cab-pro-fill alert-fill" style={{ width: `${Math.min(alertsCount * 20, 100)}%` }}></div></div>
                  </div>
                </div>
                <h3 className="cab-sub-title">{t.statLog}</h3>
                <div className="cab-activity-log">
                    {activityLog.length > 0 ? activityLog.map((log, index) => (
                      <div key={index} className="cab-log-item" style={{ animationDelay: `${index * 0.05}s` }}>
                        <span className={`cab-dot ${log.type || 'blue'}`}></span> 
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <span>{log.text}</span>
                          <span style={{ fontSize: '0.7rem', color: '#444' }}>{log.time}</span>
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#444' }}>{t.statEmptyLog}</div>
                    )}
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="cab-section-inner cab-fade-in">
                <h2 className="cab-h2">{t.secTitle}</h2>
                <div className="cab-security-box">
                    <div className="cab-field-row">
                        <div className="cab-field-info"><h4>{t.secEmail}</h4><p>{t.secEmailDesc}</p></div>
                        <input className="cab-input" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                    </div>
                    <div className="cab-field-row">
                        <div className="cab-field-info"><h4>{t.secPass}</h4><p>{t.secPassDesc}</p></div>
                        <input className="cab-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <button className="cab-save-btn cab-wide" onClick={handleUpdateSecurity}>{t.secUpdate}</button>
                </div>
              </div>
            )}

            {activeSection === 'settings' && (
              <div className="cab-section-inner cab-fade-in">
                <h2 className="cab-h2">{t.setTitle}</h2>
                <div className="cab-settings-list">
                    <div className="cab-setting-row">
                        <span>{t.setLang}</span>
                        <select className="cab-select-ui" value={currentLang} onChange={(e) => setGlobalLang(e.target.value)}>
                            <option value="ua">Українська 🇺🇦</option>
                            <option value="en">English 🇺🇸</option>
                        </select>
                    </div>
                    <div className="cab-setting-row">
                        <span>{t.setCur}</span>
                        <select className="cab-select-ui" value={currentCurrency} onChange={(e) => setGlobalCurrency(e.target.value)}>
                            <option value="usd">USD ($)</option>
                            <option value="eur">EUR (€)</option>
                            <option value="gbp">GBP (£)</option>
                            <option value="pln">PLN (zł)</option>
                            <option value="uah">UAH (₴)</option>
                        </select>
                    </div>
                    <div className="cab-setting-row">
                        <span>{t.setTz}</span>
                        <select className="cab-select-ui" value={currentTimezone} onChange={(e) => setGlobalTimezone(e.target.value)}>
                            <option value="Europe/Kyiv">{t.tzKyiv}</option>
                            <option value="Europe/Berlin">{t.tzBerlin}</option>
                            <option value="Europe/London">{t.tzLondon}</option>
                            <option value="America/New_York">{t.tzNy}</option>
                            <option value="Asia/Tokyo">{t.tzTokyo}</option>
                        </select>
                    </div>
                </div>
              </div>
            )}

            {activeSection === 'support' && (
              <div className="cab-section-inner cab-fade-in">
                <h2 className="cab-h2">{t.supTitle}</h2>
                <div className="cab-support-ui">
                    <textarea 
                        className="cab-textarea" 
                        value={supportMsg} 
                        onChange={(e) => setSupportMsg(e.target.value)} 
                        placeholder={t.supPlace}
                        disabled={isSendingSupport}
                    />
                    <button 
                      className="cab-dark-rounded-btn" 
                      onClick={handleSendSupport}
                      disabled={isSendingSupport || !supportMsg.trim()}
                    >
                      {isSendingSupport ? t.supSending : t.supBtn}
                    </button>
                </div>
              </div>
            )}

            {/* ПРО ДОДАТОК - ОНОВЛЕНИЙ І ВИРІВНЯНИЙ БЛОК */}
            {activeSection === 'about' && (
              <div className="cab-section-inner cab-about-reveal">
                <h2 className="cab-h2">{t.abTitle}</h2>
                <p className="cab-p-ani p-1">{t.abP1}</p>
                
                {/* 4 Картки Технологій - анімація cab-anim-2 */}
                <div className="cab-features-grid cab-anim-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }}>
                  <div className="cab-feature-box"><h4>{t.abF1}</h4><p>{t.abF1d}</p></div>
                  <div className="cab-feature-box"><h4>{t.abF2}</h4><p>{t.abF2d}</p></div>
                  <div className="cab-feature-box"><h4>{t.abF3}</h4><p>{t.abF3d}</p></div>
                  <div className="cab-feature-box"><h4>{t.abF4}</h4><p>{t.abF4d}</p></div>
                </div>

                {/* БЛОК КЛЮЧОВИХ МОЖЛИВОСТЕЙ - ТЕПЕР ТЕЖ АНІМУЄТЬСЯ ТА ВИРІВНЯНИЙ */}
                <div className="cab-about-list cab-anim-2" style={{ textAlign: 'left', marginBottom: '30px' }}>
                  <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: '#fff', fontWeight: 'bold' }}>{t.abFeaturesTitle}</h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#8e9eaf', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 30px' }}>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}><span style={{ color: '#f7931a' }}>◆</span> {t.abL1}</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}><span style={{ color: '#f7931a' }}>◆</span> {t.abL2}</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}><span style={{ color: '#f7931a' }}>◆</span> {t.abL3}</li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}><span style={{ color: '#f7931a' }}>◆</span> {t.abL4}</li>
                  </ul>
                </div>

                {/* Чистий футер */}
                <p className="cab-p-ani p-4 cab-about-footer" style={{ borderTop: '1px solid #2b3139', paddingTop: '20px', color: '#555', fontSize: '0.9rem' }}>
                  {t.abFoot}
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CabinetModal;