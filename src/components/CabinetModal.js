import React, { useState } from 'react';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import './CabinetModal.css';

const PRESET_AVATARS = [
  "https://api.dicebear.com/8.x/bottts/svg?seed=BTC&backgroundColor=1e2329",
  "https://api.dicebear.com/8.x/bottts/svg?seed=ETH&backgroundColor=1e2329",
  "https://api.dicebear.com/8.x/bottts/svg?seed=SOL&backgroundColor=1e2329",
  "https://api.dicebear.com/8.x/bottts/svg?seed=DOGE&backgroundColor=1e2329",
  "https://api.dicebear.com/8.x/bottts/svg?seed=XRP&backgroundColor=1e2329",
  "https://api.dicebear.com/8.x/bottts/svg?seed=ADA&backgroundColor=1e2329"
];

const translations = {
  ua: {
    menuProfile: "👤 Профіль", menuStats: "📊 Активність", menuSec: "🔒 Безпека", menuSet: "⚙️ Налаштування", menuSup: "🎧 Підтримка", menuAbout: "🚀 Про додаток", logout: "Вийти з акаунта",
    profTitle: "Мій профіль", nickLabel: "Ваш нікнейм", avaLabel: "Швидкий вибір аватара", urlLabel: "Або вставте посилання", saveBtn: "Зберегти зміни", saving: "Збереження...",
    statTitle: "Аналітика акаунта", statFav: "Обраних монет", statAlert: "Сповіщень", statLog: "Журнал подій", log1: "Успішна авторизація", log2: "Синхронізація з хмарою", log3: "Оновлення котирувань",
    secTitle: "Безпека", secEmail: "Електронна пошта", secEmailDesc: "Основний ідентифікатор", secPass: "Новий пароль", secPassDesc: "Мінімум 6 символів", secUpdate: "Оновити дані",
    setTitle: "Загальні налаштування", setLang: "Мова інтерфейсу", setCur: "Основна валюта",
    supTitle: "Підтримка", supPlace: "Опишіть проблему або залиште побажання...", supBtn: "Надіслати повідомлення",
    abTitle: "Про Crypto Monitor", abP1: "Твій персональний термінал для аналізу ринку.", abF1: "Швидкість React ⚡", abF1d: "Миттєве завантаження.", abF2: "Надійність Firebase 🔒", abF2d: "Твої дані в безпеці.", abF3: "Точність CoinGecko 📈", abF3d: "Ціни в реальному часі.", abFoot: "Розроблено для трейдерів. Версія 2.0"
  },
  en: {
    menuProfile: "👤 Profile", menuStats: "📊 Activity", menuSec: "🔒 Security", menuSet: "⚙️ Settings", menuSup: "🎧 Support", menuAbout: "🚀 About", logout: "Logout",
    profTitle: "My Profile", nickLabel: "Nickname", avaLabel: "Quick Avatar Select", urlLabel: "Or paste image URL", saveBtn: "Save Changes", saving: "Saving...",
    statTitle: "Account Analytics", statFav: "Favorite Coins", statAlert: "Active Alerts", statLog: "Event Log", log1: "Successful login", log2: "Cloud synchronization", log3: "Price quotes updated",
    secTitle: "Security", secEmail: "Email Address", secEmailDesc: "Primary identifier", secPass: "New Password", secPassDesc: "Minimum 6 characters", secUpdate: "Update Security",
    setTitle: "General Settings", setLang: "Interface Language", setCur: "Main Currency",
    supTitle: "Support", supPlace: "Describe your issue or leave feedback...", supBtn: "Send Message",
    abTitle: "About Crypto Monitor", abP1: "Your personal terminal for market analysis.", abF1: "React Speed ⚡", abF1d: "Instant loading.", abF2: "Firebase Security 🔒", abF2d: "Your data is safe.", abF3: "CoinGecko Accuracy 📈", abF3d: "Real-time pricing.", abFoot: "Built for traders. Version 2.0"
  }
};

// 🔥 ДОДАЛИ ПРОПСИ ДЛЯ ВАЛЮТИ ТАКОЖ (currentCurrency, setGlobalCurrency)
const CabinetModal = ({ user, onClose, onLogout, favoritesCount, alertsCount, currentLang, setGlobalLang, currentCurrency, setGlobalCurrency }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const t = translations[currentLang] || translations.ua; 

  const [newName, setNewName] = useState(user?.displayName || '');
  const [newPhoto, setNewPhoto] = useState(user?.photoURL || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
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

  return (
    <div className="cab-overlay" onClick={onClose}>
      <div className="cab-window" onClick={(e) => e.stopPropagation()}>
        
        {/* SIDEBAR */}
        <div className="cab-sidebar">
          <div className="cab-sidebar-user">
            <img src={user.photoURL || PRESET_AVATARS[0]} alt="Avatar" />
            {/* 🔥 ВИПРАВИВ ЗЛИПАННЯ: додав display: flex та gap */}
            <div className="cab-user-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="cab-username" style={{ fontWeight: 'bold' }}>{user.displayName || 'Trader'}</span>
              <span className="cab-status-online" style={{ fontSize: '0.8rem', padding: '2px 6px', borderRadius: '8px', background: 'rgba(0, 192, 135, 0.15)', color: '#00c087', border: '1px solid rgba(0, 192, 135, 0.3)' }}>Online</span>
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

        {/* MAIN CONTENT */}
        <div className="cab-main">
          <button className="cab-x-close" onClick={onClose}>&times;</button>
          
          {statusMsg.text && <div className={`cab-toast ${statusMsg.type}`}>{statusMsg.text}</div>}

          <div className="cab-content-area">
            
            {/* ПРОФІЛЬ */}
            {activeSection === 'profile' && (
              <div className="cab-section-inner cab-fade-in">
                <h2 className="cab-h2">{t.profTitle}</h2>
                <div className="cab-profile-grid">
                  <div className="cab-avatar-big">
                    <img src={newPhoto || user.photoURL || PRESET_AVATARS[0]} alt="Preview" />
                  </div>
                  <div className="cab-inputs-group">
                    <label className="cab-label">{t.nickLabel}</label>
                    <input className="cab-input" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
                    
                    <label className="cab-label">{t.avaLabel}</label>
                    <div className="cab-mini-gallery">
                      {PRESET_AVATARS.map((url, i) => (
                        <img key={i} src={url} className={newPhoto === url ? 'selected' : ''} onClick={() => setNewPhoto(url)} alt="preset"/>
                      ))}
                    </div>

                    <label className="cab-label">{t.urlLabel}</label>
                    <input className="cab-input" type="text" value={newPhoto} onChange={(e) => setNewPhoto(e.target.value)} placeholder="https://..." />
                    
                    <button className="cab-save-btn" onClick={handleUpdateProfile} disabled={isSaving}>
                        {isSaving ? t.saving : t.saveBtn}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* АКТИВНІСТЬ */}
            {activeSection === 'stats' && (
              <div className="cab-section-inner cab-fade-in">
                <h2 className="cab-h2">{t.statTitle}</h2>
                <div className="cab-pro-dashboard">
                  <div className="cab-pro-stat-card">
                    <span className="cab-pro-label">{t.statFav}</span>
                    <span className="cab-pro-value">{favoritesCount}</span>
                    <div className="cab-pro-bar"><div className="cab-pro-fill fav-fill"></div></div>
                  </div>
                  <div className="cab-pro-stat-card">
                    <span className="cab-pro-label">{t.statAlert}</span>
                    <span className="cab-pro-value">{alertsCount}</span>
                    <div className="cab-pro-bar"><div className="cab-pro-fill alert-fill"></div></div>
                  </div>
                </div>
                
                <h3 className="cab-sub-title">{t.statLog}</h3>
                <div className="cab-activity-log">
                    <div className="cab-log-item"><span className="cab-dot green"></span> {t.log1}</div>
                    <div className="cab-log-item"><span className="cab-dot blue"></span> {t.log2}</div>
                    <div className="cab-log-item"><span className="cab-dot orange"></span> {t.log3}</div>
                </div>
              </div>
            )}

            {/* БЕЗПЕКА */}
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

            {/* НАЛАШТУВАННЯ */}
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
                        {/* 🔥 ЗМІНЮЄМО ГЛОБАЛЬНУ ВАЛЮТУ */}
                        <select className="cab-select-ui" value={currentCurrency} onChange={(e) => setGlobalCurrency(e.target.value)}>
                            <option value="usd">USD ($)</option>
                            <option value="eur">EUR (€)</option>
                            <option value="gbp">GBP (£)</option>
                            <option value="pln">PLN (zł)</option>
                            <option value="uah">UAH (₴)</option>
                        </select>
                    </div>
                </div>
              </div>
            )}

            {/* ПІДТРИМКА */}
            {activeSection === 'support' && (
              <div className="cab-section-inner cab-fade-in">
                <h2 className="cab-h2">{t.supTitle}</h2>
                <div className="cab-support-ui">
                    <textarea 
                        className="cab-textarea" 
                        value={supportMsg} 
                        onChange={(e) => setSupportMsg(e.target.value)} 
                        placeholder={t.supPlace}
                    />
                    <button className="cab-dark-rounded-btn" onClick={() => { 
                      notify(currentLang === 'ua' ? 'Надіслано!' : 'Sent!'); 
                      setSupportMsg(''); 
                    }}>
                      {t.supBtn}
                    </button>
                </div>
              </div>
            )}

            {/* ПРО ДОДАТОК */}
            {activeSection === 'about' && (
              <div className="cab-section-inner cab-about-reveal">
                <h2 className="cab-h2">{t.abTitle}</h2>
                <p className="cab-p-ani p-1">{t.abP1}</p>
                <div className="cab-features-grid cab-anim-2">
                  <div className="cab-feature-box"><h4>{t.abF1}</h4><p>{t.abF1d}</p></div>
                  <div className="cab-feature-box"><h4>{t.abF2}</h4><p>{t.abF2d}</p></div>
                  <div className="cab-feature-box"><h4>{t.abF3}</h4><p>{t.abF3d}</p></div>
                </div>
                <p className="cab-p-ani p-4 cab-about-footer">{t.abFoot}</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CabinetModal;