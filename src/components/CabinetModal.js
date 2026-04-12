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

const CabinetModal = ({ user, onClose, onLogout, favoritesCount, alertsCount }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [newName, setNewName] = useState(user?.displayName || '');
  const [newPhoto, setNewPhoto] = useState(user?.photoURL || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [supportMsg, setSupportMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' }); // Заміна alert

  if (!user) return null;

  const showStatus = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile(user, { displayName: newName, photoURL: newPhoto });
      showStatus('Профіль успішно оновлено!');
    } catch (err) { showStatus('Помилка: ' + err.message, 'error'); }
    setIsSaving(false);
  };

  const handleUpdateSecurity = async () => {
    setIsSaving(true);
    try {
      if (newEmail !== user.email) await updateEmail(user, newEmail);
      if (newPassword) await updatePassword(user, newPassword);
      showStatus('Дані входу оновлено!');
      setNewPassword('');
    } catch (err) { 
      showStatus('Для зміни безпеки потрібно перелогінитись!', 'error'); 
    }
    setIsSaving(false);
  };

  return (
    <div className="cab-overlay" onClick={onClose}>
      <div className="cab-window" onClick={(e) => e.stopPropagation()}>
        
        {/* SIDEBAR */}
        <div className="cab-sidebar">
          <div className="cab-sidebar-user">
            <img src={user.photoURL || PRESET_AVATARS[0]} alt="Avatar" />
            <div className="user-info-text">
              <span className="user-name-sidebar">{user.displayName || 'Трейдер'}</span>
              <span className="user-status-sidebar">Online</span>
            </div>
          </div>
          
          <nav className="cab-menu">
            <button className={activeSection === 'profile' ? 'active' : ''} onClick={() => setActiveSection('profile')}>👤 Профіль</button>
            <button className={activeSection === 'stats' ? 'active' : ''} onClick={() => setActiveSection('stats')}>📊 Активність</button>
            <button className={activeSection === 'security' ? 'active' : ''} onClick={() => setActiveSection('security')}>🔒 Безпека</button>
            <button className={activeSection === 'settings' ? 'active' : ''} onClick={() => setActiveSection('settings')}>⚙️ Налаштування</button>
            <button className={activeSection === 'support' ? 'active' : ''} onClick={() => setActiveSection('support')}>🎧 Підтримка</button>
            <button className={activeSection === 'about' ? 'active' : ''} onClick={() => setActiveSection('about')}>🚀 Про додаток</button>
          </nav>

          <button className="sidebar-logout" onClick={onLogout}>Вийти з системи</button>
        </div>

        {/* MAIN CONTENT */}
        <div className="cab-main">
          <button className="cab-close-btn" onClick={onClose}>&times;</button>
          
          {/* Кастомний Алерт */}
          {message.text && <div className={`cab-status-msg ${message.type}`}>{message.text}</div>}

          <div className="cab-section-content fade-in">
            
            {/* ПРОФІЛЬ */}
            {activeSection === 'profile' && (
              <div className="section-inner">
                <h2 className="section-title">Налаштування профілю</h2>
                <div className="profile-edit-grid">
                  <div className="avatar-preview-big">
                    <img src={newPhoto || user.photoURL || PRESET_AVATARS[0]} alt="Preview" />
                  </div>
                  <div className="edit-inputs">
                    <label>Ваш нікнейм</label>
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
                    <label>Швидкий вибір аватара</label>
                    <div className="avatar-mini-gallery">
                      {PRESET_AVATARS.map((url, i) => (
                        <img key={i} src={url} className={newPhoto === url ? 'selected' : ''} onClick={() => setNewPhoto(url)} alt="preset"/>
                      ))}
                    </div>
                    <button className="save-btn" onClick={handleUpdateProfile} disabled={isSaving}>
                        {isSaving ? 'Збереження...' : 'Зберегти зміни'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* АКТИВНІСТЬ */}
            {activeSection === 'stats' && (
              <div className="section-inner">
                <h2 className="section-title">Твоя активність</h2>
                <div className="stats-dashboard">
                  <div className="stat-box-small">
                    <span className="stat-icon">⭐</span>
                    <div className="stat-info">
                      <span className="val">{favoritesCount}</span>
                      <span className="lab">Улюблених монет</span>
                    </div>
                  </div>
                  <div className="stat-box-small">
                    <span className="stat-icon">🔔</span>
                    <div className="stat-info">
                      <span className="val">{alertsCount}</span>
                      <span className="lab">Активних сповіщень</span>
                    </div>
                  </div>
                </div>
                
                <h3 className="sub-title">Останні дії</h3>
                <div className="activity-list">
                    <div className="activity-item">
                        <span className="act-dot green"></span>
                        <p>Ви авторизувалися в системі <span>(Зараз)</span></p>
                    </div>
                    <div className="activity-item">
                        <span className="act-dot blue"></span>
                        <p>Ваш список обраного оновлено <span>(Сьогодні)</span></p>
                    </div>
                    <div className="activity-item">
                        <span className="act-dot orange"></span>
                        <p>Перегляд ринкової статистики <span>(Вчора)</span></p>
                    </div>
                </div>
              </div>
            )}

            {/* БЕЗПЕКА */}
            {activeSection === 'security' && (
              <div className="section-inner">
                <h2 className="section-title">Безпека</h2>
                <div className="security-container">
                    <div className="security-row">
                        <div className="sec-info">
                            <h4>Електронна пошта</h4>
                            <p>{user.email}</p>
                        </div>
                        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Новий Email" />
                    </div>
                    <div className="security-row">
                        <div className="sec-info">
                            <h4>Новий пароль</h4>
                            <p>Рекомендуємо 12+ символів</p>
                        </div>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <button className="save-btn wide" onClick={handleUpdateSecurity}>Оновити дані</button>
                </div>
              </div>
            )}

            {/* НАЛАШТУВАННЯ */}
            {activeSection === 'settings' && (
              <div className="section-inner">
                <h2 className="section-title">Загальні налаштування</h2>
                <div className="settings-list">
                    <div className="setting-item">
                        <span>Основна валюта</span>
                        <select className="cab-select">
                            <option>USD ($)</option>
                            <option>UAH (₴)</option>
                        </select>
                    </div>
                    <div className="setting-item">
                        <span>Звукові сповіщення</span>
                        <input type="checkbox" className="cab-toggle" defaultChecked />
                    </div>
                    <div className="setting-item">
                        <span>Показувати ціну в заголовку вкладки</span>
                        <input type="checkbox" className="cab-toggle" />
                    </div>
                </div>
              </div>
            )}

            {/* ПІДТРИМКА */}
            {activeSection === 'support' && (
              <div className="section-inner">
                <h2 className="section-title">Підтримка</h2>
                <div className="support-card-ui">
                    <textarea 
                        className="support-textarea" 
                        value={supportMsg} 
                        onChange={(e) => setSupportMsg(e.target.value)} 
                        placeholder="Опишіть вашу проблему або пропозицію..."
                    />
                    <button className="save-btn" onClick={() => {
                        showStatus('Повідомлення надіслано в чергу обробки!');
                        setSupportMsg('');
                    }}>Надіслати тікет</button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default CabinetModal;