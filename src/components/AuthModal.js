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

  // Вхід через Google
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

  // Скидання пароля
  const handleResetPassword = async () => {
    if (!email) {
      setError('Спочатку введіть свій Email');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setInfoMessage( 'Інструкцію відправлено! Якщо листа немає, перевірте папку "Спам"');
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
        
        {/* ОНОВЛЕНА КНОПКА GOOGLE З МАЛЕНЬКОЮ ІКОНКОЮ */}
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
              // ЗАХИСТ ІМЕНІ: Тільки літери та пробіли
              onChange={(e) => setName(e.target.value.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s]/g, ''))} 
              required 
            />
          )}
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            // ЗАХИСТ ПОШТИ: Тільки літери, цифри, @, крапка і підкреслення (ніяких +=-)
            onChange={(e) => setEmail(e.target.value.replace(/[^a-zA-Z0-9@._]/g, ''))} 
            required 
          />
          <input 
            type="password" 
            placeholder="Пароль" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          
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
          <span onClick={() => { setIsLogin(!isLogin); setError(''); setInfoMessage(''); }}>
            {isLogin ? ' Створити' : ' Увійти'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;