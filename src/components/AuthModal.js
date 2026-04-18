import React, { useState } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile, 
  GoogleAuthProvider, 
  signInWithPopup,
  sendPasswordResetEmail 
} from 'firebase/auth';
import './AuthModal.css';

const AuthModal = ({ onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  
  // 🔥 Стан для відображення пароля
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      if (onLoginSuccess) onLoginSuccess();
      onClose();
    } catch (err) {
      setError('Помилка входу через Google');
      console.error(err);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Спочатку введіть свій Email');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMessage('Інструкцію відправлено! Якщо листа немає, перевірте папку "Спам"');
      setError('');
    } catch (err) {
      setError('Помилка: перевірте правильність Email');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (name.length < 2) {
          setError("Ім'я занадто коротке");
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      }
      if (onLoginSuccess) onLoginSuccess();
      onClose();
    } catch (err) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Цей акаунт вже існує. Увійдіть.');
          break;
        case 'auth/weak-password':
          setError('Пароль має бути не менше 6 символів');
          break;
        case 'auth/invalid-credential':
          setError('Неправильна пошта або пароль');
          break;
        default:
          setError('Сталася помилка. Перевірте дані.');
      }
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>&times;</button>
        
        <h2>{isLogin ? 'Вхід в систему' : 'Реєстрація'}</h2>
        
        {/* 🔥 НОВИЙ ТЕКСТ ПІД ЧАС РЕЄСТРАЦІЇ */}
        {!isLogin && (
          <p style={{ 
            color: '#8e9eaf', 
            fontSize: '0.9rem', 
            textAlign: 'center', 
            marginTop: '-10px', 
            marginBottom: '20px', 
            lineHeight: '1.4' 
          }}>
            Створіть акаунт, щоб отримати доступ до професійних графіків, цінових сповіщень та хмарної синхронізації.
          </p>
        )}
        
        <button type="button" className="google-btn" onClick={handleGoogleLogin}>
          <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="G" style={{ width: '24px', height: '24px' }} />
          Продовжити з Google
        </button>

        <div className="auth-divider"><span>або через пошту</span></div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Ваше ім'я" 
              value={name} 
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s]/g, ''))} 
              required 
            />
          )}
          
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value.replace(/[^a-zA-Z0-9@._]/g, ''))} 
            required 
          />
          
          <div className="password-input-container">
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Пароль" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <button 
              type="button" 
              className="toggle-password-btn" 
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
          
          {error && <p className="auth-error">{error}</p>}
          {infoMessage && <p className="auth-info">{infoMessage}</p>}

          <button type="submit" className="auth-submit-btn">
            {isLogin ? 'Увійти' : 'Зареєструватися'}
          </button>
        </form>

        {isLogin && (
          <p className="forgot-password" onClick={handleResetPassword}>Забули пароль?</p>
        )}

        <p className="auth-switch">
          {isLogin ? 'Немає акаунту?' : 'Вже маєте акаунт?'}
          <span onClick={() => { setIsLogin(!isLogin); setError(''); setInfoMessage(''); setShowPassword(false); }}>
            {isLogin ? ' Створити' : ' Увійти'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;